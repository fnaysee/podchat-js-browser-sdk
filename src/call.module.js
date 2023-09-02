import {chatMessageVOTypes, inviteeVOidTypes, callStickerTypes, callMetaDataTypes} from "./lib/constants"
import KurentoUtils from 'kurento-utils'
import Utility from "./utility/utility"
import {chatEvents} from "./events.module.js";

import errorHandler, {errorList, raiseError} from "./lib/errorHandler";
import {sdkParams} from "./lib/sdkParams";

import {callServerController} from "./lib/call/callServerManager";
import {callsManager} from "./lib/call/callsList";
import {
    // asyncRequestTimeouts,
    callStopQueue,
    callClientType,
    callTypes,
    joinCallParams,
    sharedVariables,
    endCall, endScreenShare, calculateScreenSize, currentCall, currentCallMyUser
} from "./lib/call/sharedData";
import {store} from "./lib/store";
import {messenger} from "./messaging.module";
import {DeviceManager} from "./lib/call/deviceManager2";

function ChatCall(params) {
    var //Utility = params.Utility,
        currentModuleInstance = this,
        //chatEvents = params.chatEvents,
        callRequestController = {
            imCallOwner: false,
            callRequestReceived: false,
            callEstablishedInMySide: false,
            callRequestTimeout: null,

            iRequestedCall: false,
            iAcceptedCall: false,

            canProcessStartCall: function (callId) {
                sdkParams.consoleLogging && console.log(
                    "[SDK] canProcessStartCall:",
                    {callId},
                    {acceptedCallId: sharedVariables.acceptedCallId},
                    callRequestController.iAcceptedCall,
                    callRequestController.iAcceptedCall && sharedVariables.acceptedCallId == callId
                );

                if(callRequestController.iAcceptedCall && sharedVariables.acceptedCallId == callId
                    || callRequestController.iRequestedCall && sharedVariables.requestedCallId == callId)
                    return true;

                return false;
            }
        },
        // generalTypeCode = params.typeCode,
        currentCallParams = {},
        latestCallRequestId = null,
        screenShareInfo = new screenShareStateManager(),
        //shouldReconnectCallTimeout = null,
        screenShareState = {
            started: false,
            imOwner: false
        },

        callUsers = {},

        //callServerManager(),
        //callTopicHealthChecker = new peersHealthChecker(),
        //messageTtl = params.messageTtl || 10000,
        callOptions = sdkParams.callOptions,
        config = {
            getHistoryCount: 25
        };

    sharedVariables.useInternalTurnAddress = !!(callOptions && callOptions.useInternalTurnAddress);
    sharedVariables.globalCallRequestTimeout = sdkParams.callRequestTimeout;
    sharedVariables.callTurnIp = (callOptions
        && callOptions.hasOwnProperty('callTurnIp')
        && typeof callOptions.callTurnIp === 'string')
        ? callOptions.callTurnIp
        : '46.32.6.188';
    sharedVariables.callDivId = (callOptions
        && callOptions.hasOwnProperty('callDivId')
        && typeof callOptions.callDivId === 'string')
        ? callOptions.callDivId
        : 'call-div';
    sharedVariables.callAudioTagClassName = (callOptions
        && callOptions.hasOwnProperty('callAudioTagClassName')
        && typeof callOptions.callAudioTagClassName === 'string')
        ? callOptions.callAudioTagClassName
        : '';
    sharedVariables.callVideoTagClassName = (callOptions
        && callOptions.hasOwnProperty('callVideoTagClassName')
        && typeof callOptions.callVideoTagClassName === 'string')
        ? callOptions.callVideoTagClassName
        : '';
    sharedVariables.callVideoMinWidth = (callOptions
        && callOptions.hasOwnProperty('callVideo')
        && typeof callOptions.callVideo === 'object'
        && callOptions.callVideo.hasOwnProperty('minWidth'))
        ? callOptions.callVideo.minWidth
        : 320;
    sharedVariables.callVideoMinHeight = (callOptions
        && callOptions.hasOwnProperty('callVideo')
        && typeof callOptions.callVideo === 'object'
        && callOptions.callVideo.hasOwnProperty('minHeight'))
        ? callOptions.callVideo.minHeight
        : 180;
    sharedVariables.callNoAnswerTimeout = sdkParams.callOptions?.callNoAnswerTimeout || 0;
    sharedVariables.callStreamCloseTimeout = sdkParams.callOptions?.streamCloseTimeout || 10000;

    function screenShareStateManager() {
        let config = {
            ownerId: 0,
            imOwner: false,
            isStarted: false,
            width: sharedVariables.callVideoMinWidth,
            height: sharedVariables.callVideoMinHeight
        };

        return {
            setOwner: function (ownerId) {
                config.ownerId = +ownerId;
            },
            setIsStarted: function (isStarted) {
                config.isStarted = isStarted;
            },
            isStarted: function () {
                return config.isStarted;
            },
            iAmOwner: function () {
                return config.ownerId === store.user().id
            },
            setWidth: function (width) {
                config.width = width;
            },
            setHeight: function (height) {
                config.height = height;
            },
            getWidth: function (width) {
                return config.width;
            },
            getHeight: function (height) {
                return config.height;
            },
            getOwner: function () {
                return config.ownerId
            },
            setDimension: function (dimension) {
                if(dimension
                    && dimension.width && +dimension.width > 0
                    && dimension.height  && +dimension.height > 0
                ) {
                    screenShareInfo.setHeight(dimension.height);
                    screenShareInfo.setWidth(dimension.width);
                } else {
                    screenShareInfo.setHeight(sharedVariables.callVideoMinHeight);
                    screenShareInfo.setWidth(sharedVariables.callVideoMinWidth);
                }
            }
        }
    }

    function callServerManager() {
        let config = {
            servers: [],
            currentServerIndex: 0,
        };

        return {
            setServers: function (serversList) {
                config.servers = serversList;
                config.currentServerIndex = 0;
            },
            // setCurrentServer: function (query) {
            //     for(let i in config.servers) {
            //         if(config.servers[i].indexOf(query) !== -1) {
            //             config.currentServerIndex = i;
            //             break;
            //         }
            //     }
            // },
            getCurrentServer: function () {
                return config.servers[0]//config.currentServerIndex];
            },
            isJanus: function () {
                return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
            },
            canChangeServer: function () {
                return config.currentServerIndex < config.servers.length - 1;
            },
            changeServer: function () {
                if(this.canChangeServer()) {
                    sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
                    config.currentServerIndex++;
                }
            }
        }
    }
    let init = function () {},

        raiseCallError = function (errorObject, callBack, fireEvent){
            raiseError(errorObject, callBack, fireEvent, {
                eventName: 'callEvents',
                eventType: 'CALL_ERROR',
                environmentDetails: getSDKCallDetails()
            });
        },

        sendCallMessage = function (message, callback, {
            timeoutTime = 0,
            timeoutRetriesCount = 0//,
            //timeoutCallback = null
        }) {
            message.token = sdkParams.token;

            let uniqueId;

            if (!message.uniqueId) {
                message.uniqueId = Utility.generateUUID();
            }

            // message.uniqueId = uniqueId;
            message.chatId = callsManager().currentCallId;

            let data = {
                type: 3,
                content: {
                    peerName: callServerController.getCurrentServer(),// callServerName,
                    priority: 1,
                    content: JSON.stringify(message),
                    ttl: sdkParams.messageTtl
                }
            };

            if (typeof callback == 'function') {
                store.messagesCallbacks[message.uniqueId] = callback;
            }

            sharedVariables.asyncClient.send(data, function (res) {
                if (!res.hasError && callback) {
                    // if (typeof callback == 'function') {
                    //     callback(res);
                    // }

                    // if (store.messagesCallbacks[uniqueId]) {
                    //     delete store.messagesCallbacks[uniqueId];
                    // }
                }
            });

            if (timeoutTime || sharedVariables.globalCallRequestTimeout > 0) {
                store.asyncRequestTimeouts[message.uniqueId] && clearTimeout(store.asyncRequestTimeouts[message.uniqueId]);
                store.asyncRequestTimeouts[message.uniqueId] = setTimeout(function () {
                    if (store.messagesCallbacks[message.uniqueId]) {
                        delete store.messagesCallbacks[message.uniqueId];
                    }

                    if(timeoutRetriesCount) {
                        sdkParams.consoleLogging && console.log("[SDK][sendCallMessage] Retrying call request. uniqueId :" + message.uniqueId, { message })
                        //timeoutCallback();
                        sendCallMessage(message, callback, {timeoutTime, timeoutRetriesCount: timeoutRetriesCount - 1})
                    } else if (typeof callback == 'function') {
                        /**
                         * Request failed
                         */
                        callback({
                            done: 'SKIP'
                        });
                    }

                  /*  if (store.messagesCallbacks[uniqueId]) {
                        delete store.messagesCallbacks[uniqueId];
                    }*/
                }, timeoutTime || sharedVariables.globalCallRequestTimeout);
            }
        },

        /**
         * Format Data To Make Call Participant
         *
         * This functions reformats given JSON to proper Object
         *
         * @access private
         *
         * @param {object}  messageContent    Json object of thread taken from chat server
         *
         * @param threadId
         * @return {object} participant Object
         */
        formatDataToMakeCallParticipant = function (messageContent) {
            /**
             * + CallParticipantVO                   {object}
             *    - id                           {int}
             *    - joinTime                     {int}
             *    - leaveTime                    {int}
             *    - threadParticipant            {object}
             *    - sendTopic                    {string}
             *    - receiveTopic                 {string}
             *    - brokerAddress                {string}
             *    - active                       {boolean}
             *    - callSession                  {object}
             *    - callStatus                   {int}
             *    - createTime                   {int}
             *    - sendKey                      {string}
             *    - mute                         {boolean}
             */

            let participant = {
                id: messageContent.id,
                joinTime: messageContent.joinTime,
                leaveTime: messageContent.leaveTime,
                sendTopic: messageContent.sendTopic,
                receiveTopic: messageContent.receiveTopic,
                brokerAddress: messageContent.brokerAddress,
                active: messageContent.active,
                callSession: messageContent.callSession,
                callStatus: messageContent.callStatus,
                createTime: messageContent.createTime,
                sendKey: messageContent.sendKey,
                mute: messageContent.mute
            };

            // Add Chat Participant if exist
            if (messageContent.participantVO) {
                participant.participantVO = messageContent.participantVO;
            }

            // Add Call Session if exist
            if (messageContent.callSession) {
                participant.callSession = messageContent.callSession;
            }

            // return participant;
            return JSON.parse(JSON.stringify(participant));
        },

        /**
         * Format Data To Make Call Message
         *
         * This functions reformats given JSON to proper Object
         *
         * @access private
         *
         * @param {object}  messageContent    Json object of thread taken from chat server
         *
         * @return {object} Call message Object
         */
        formatDataToMakeCallMessage = function (threadId, pushMessageVO) {
            /**
             * + CallVO                   {object}
             *    - id                    {int}
             *    - creatorId             {int}
             *    - type                  {int}
             *    - createTime            {string}
             *    - startTime             {string}
             *    - endTime               {string}
             *    - status                {int}
             *    - isGroup               {boolean}
             *    - callParticipants      {object}
             *    - partnerParticipantVO  {object}
             *    - conversationVO        {object}
             */
            let callMessage = {
                id: pushMessageVO.id,
                creatorId: pushMessageVO.creatorId,
                type: pushMessageVO.type,
                createTime: pushMessageVO.createTime,
                startTime: pushMessageVO.startTime,
                endTime: pushMessageVO.endTime,
                status: pushMessageVO.status,
                isGroup: pushMessageVO.isGroup,
                callParticipants: pushMessageVO.callParticipants,
                partnerParticipantVO: pushMessageVO.partnerParticipantVO,
                conversationVO: pushMessageVO.conversationVO
            };

            // return pinMessage;
            return JSON.parse(JSON.stringify(callMessage));
        },

        /**
         * Reformat Call Participants
         *
         * This functions reformats given Array of call Participants
         * into proper call participant
         *
         * @access private
         *
         * @param {object}  participantsContent   Array of Call Participant Objects
         * @param {int}    threadId              Id of call
         *
         * @return {object} Formatted Call Participant Array
         */
        reformatCallParticipants = function (participantsContent) {
            let returnData = [];

            for (let i = 0; i < participantsContent.length; i++) {
                returnData.push(formatDataToMakeCallParticipant(participantsContent[i]));
            }

            return returnData;
        },

        callReceived = function (params, callback) {
            let receiveCallData = {
                chatMessageVOType: chatMessageVOTypes.RECEIVE_CALL_REQUEST,
                typeCode: sdkParams.generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: sdkParams.token
            };

            if (params) {
                if (typeof +params.callId === 'number' && params.callId > 0) {
                    receiveCallData.subjectId = +params.callId;
                } else {
                    raiseError(errorList.INVALID_CALLID, callback, true, {});
                    /* chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invalid call id!'
                    }); */
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to ReceiveCall()'
                });
                return;
            }

            return messenger().sendMessage(receiveCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        },
        sendCallMetaData = function (params) {
            let message =  {
                id: params.id,
                userid: params.userid,
                content: params.content || undefined
            };

            sendCallMessage({
                id: 'SENDMETADATA',
                message: JSON.stringify(message),
                chatId: callsManager().currentCallId
            }, null, {});
        },

        getSDKCallDetails = function (customData) {
            return {
                currentUser: store.user(),
                currentServers: {
                    callTurnIp: sharedVariables.callTurnIp,

                },
                isJanus: callsManager().currentCallId && callServerController.isJanus(),
                screenShareInfo: {
                    isStarted: screenShareInfo.isStarted(),
                    iAmOwner: screenShareInfo.iAmOwner(),
                },
                callId: callsManager().currentCallId,
                startCallInfo: currentCallParams,
                customData
            }
        };
    this.callMessageHandler = function (callMessage) {
        let jsonMessage = (typeof callMessage.content === 'string' && Utility.isValidJson(callMessage.content))
            ? JSON.parse(callMessage.content)
            : callMessage.content

        if(jsonMessage.chatId){
            callsManager().routeCallMessage(jsonMessage.chatId, jsonMessage);
        } else {
            sdkParams.consoleLogging && console.warn("[SDK] Skipping call message, no chatId is available. ", {jsonMessage})
        }
    };

    this.asyncInitialized = function (async) {
        sharedVariables.asyncClient = async;

        sharedVariables.asyncClient.on('asyncReady', function (){
            // callStateController.maybeReconnectAllTopics();
            if(callsManager().currentCallId) {
                callsManager().get(callsManager().currentCallId).onChatConnectionReconnect();
            }
        })
    };

    /**
     * Do not process the message if is not for current call
     *
     * @param type
     * @param threadId
     * @return {boolean}
     */
    function shouldNotProcessChatMessage(type, threadId) {
        let restrictedMessageTypes = [
            chatMessageVOTypes.MUTE_CALL_PARTICIPANT,
            chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT,
            chatMessageVOTypes.CALL_PARTICIPANT_JOINED,
            chatMessageVOTypes.REMOVE_CALL_PARTICIPANT,
            chatMessageVOTypes.RECONNECT,
            chatMessageVOTypes.TURN_OFF_VIDEO_CALL,
            chatMessageVOTypes.TURN_ON_VIDEO_CALL,
            chatMessageVOTypes.DESTINED_RECORD_CALL,
            chatMessageVOTypes.RECORD_CALL,
            chatMessageVOTypes.RECORD_CALL_STARTED,
            chatMessageVOTypes.END_RECORD_CALL,
            chatMessageVOTypes.TERMINATE_CALL,
            chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE,
            chatMessageVOTypes.CALL_RECORDING_FAILED,
            // chatMessageVOTypes.END_CALL
        ];

        if(!callStopQueue.callStarted  && restrictedMessageTypes.includes(type)) {
            return true;
        } else {
            return false
        }
    }

    this.handleChatMessages = function(type, messageContent, contentCount, threadId, uniqueId) {
        sdkParams.consoleLogging && console.debug("[SDK][CALL_MODULE][handleChatMessages]", "type:", type, "threadId:", threadId, "currentCallId:", callsManager().currentCallId, "latestCallRequestId:", latestCallRequestId,  "shouldNotProcessChatMessage:", shouldNotProcessChatMessage(type, threadId))
        if(shouldNotProcessChatMessage(type, threadId)) {
            return;
        }

        switch (type) {
            /**
             * Type 70    Send Call Request
             */
            case chatMessageVOTypes.CALL_REQUEST:
                // callRequestController.callRequestReceived = true;
                callReceived({
                    callId: messageContent.callId
                }, function (r) {

                });

                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                messageContent.threadId = threadId;
                chatEvents.fireEvent('callEvents', {
                    type: 'RECEIVE_CALL',
                    result: messageContent
                });

                if (messageContent.callId > 0) {
                    // if(!currentCallId ) {
                    latestCallRequestId = messageContent.callId;
                    // }
                } else {
                    chatEvents.fireEvent('callEvents', {
                        type: 'PARTNER_RECEIVED_YOUR_CALL',
                        result: messageContent
                    });
                }

                break;

            /**
             * Type 71    Accept Call Request
             */
            case chatMessageVOTypes.ACCEPT_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'ACCEPT_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 72    Reject Call Request
             */
            case chatMessageVOTypes.REJECT_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'REJECT_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 73    Receive Call Request
             */
            case chatMessageVOTypes.RECEIVE_CALL_REQUEST:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if (messageContent.callId > 0) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'RECEIVE_CALL',
                        result: messageContent
                    });
                    // if(!currentCallId ) {
                    latestCallRequestId = messageContent.callId;
                    // }
                } else if(callRequestController.iRequestedCall) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'PARTNER_RECEIVED_YOUR_CALL',
                        result: messageContent
                    });
                }

                break;

            /**
             * Type 74    Start Call (Start sender and receivers)
             */
            case chatMessageVOTypes.START_CALL:
                if(!callRequestController.canProcessStartCall(threadId)) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STARTED_ELSEWHERE',
                        message: 'Call already started somewhere else..., aborting...'
                    });
                    return;
                }

                callsManager().currentCallId = threadId;
                processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId);
                // if(callsManager().currentCallId) {
                //     endCall({callId: callsManager().currentCallId});
                //     // callStop( true, false);
                //     setTimeout(()=>{
                //         callsManager().currentCallId = threadId;
                //         processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId);
                //     }, 5000);
                // } else {
                //     callsManager().currentCallId = threadId;
                //     processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId);
                // }

                break;

            /**
             * Type 75    End Call Request
             */
            case chatMessageVOTypes.END_CALL_REQUEST:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'END_CALL',
                    result: messageContent
                });

                callsManager().removeItem(threadId);
                // callStop();

                break;

            /**
             * Type 76   Call Ended
             */
            case chatMessageVOTypes.END_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ENDED',
                    callId: threadId
                });

                if(threadId === callsManager().currentCallId && callStopQueue.callStarted) {
                    callsManager().removeItem(threadId);
                    // callStop();
                }

                break;

            /**
             * Type 77    Get Calls History
             */
            case chatMessageVOTypes.GET_CALLS:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                break;

            /**
             * Type 78    Call Partner Reconnecting
             */
            case chatMessageVOTypes.RECONNECT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_RECONNECTING',
                    result: messageContent
                });

                break;

            /**
             * Type 79    Call Partner Connects
             */
            case chatMessageVOTypes.CONNECT:
                if(!callsManager().currentCallId)
                    return;

                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_CONNECTED',
                    result: messageContent
                });
                if(callUsers && callUsers[store.user().id] && callUsers[store.user().id].video) {
                    currentCall().users().get(store.user().id).videoTopicManager().restartMediaOnKeyFrame(store.user().id, [2000,4000,8000,12000]);
                }
                if(callUsers && callUsers['screenShare']
                    && screenShareInfo.isStarted()
                    && screenShareInfo.iAmOwner()
                ) {
                    currentCall().users().get(store.user().id).videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000,4000,8000,12000]);
                }
                break;

            /**
             * Type 90    Contacts Synced
             */
            case chatMessageVOTypes.CONTACT_SYNCED:
                chatEvents.fireEvent('contactEvents', {
                    type: 'CONTACTS_SYNCED',
                    result: messageContent
                });
                break;

            /**
             * Type 91    Send Group Call Request
             */
            case chatMessageVOTypes.GROUP_CALL_REQUEST:
                // callRequestController.callRequestReceived = true;
                callReceived({
                    callId: messageContent.callId
                }, function (r) {});

                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if (messageContent.callId > 0) {
                    // if(!currentCallId ) {
                    latestCallRequestId = messageContent.callId;
                    // }
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'RECEIVE_CALL',
                    result: messageContent
                });

                //currentCallId = messageContent.callId;

                break;

            /**
             * Type 92    Call Partner Leave
             * 1. I have left the call (GroupCall)
             * 2. Other person has left the call (GroupCall)
             */
            case chatMessageVOTypes.LEAVE_CALL:
                if(callsManager().currentCallId != threadId)
                    return;

                callsManager().get(threadId).handleParticipantLeft(messageContent, threadId);

                break;

            /**
             * Type 93    Add Call Participant
             */
            case chatMessageVOTypes.ADD_CALL_PARTICIPANT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                break;

            /**
             * Type 94    Call Participant Joined
             */
            case chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
                if(callsManager().currentCallId != threadId)
                    return;

                callsManager().get(threadId).handleParticipantJoin(messageContent);
                break;

            /**
             * Type 95    Remove Call Participant
             */
            case chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_REMOVED',
                    result: messageContent
                });

                break;

            /**
             * Type 96    Terminate Call
             */
            case chatMessageVOTypes.TERMINATE_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'TERMINATE_CALL',
                    result: messageContent
                });

                if(threadId === callsManager().currentCallId) {
                    callsManager().removeItem(threadId);
                }

                break;

            /**
             * Type 97    Mute Call Participant
             */
            case chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(!callsManager().currentCallId)
                    return;

                callsManager().get(threadId).handleParticipantMute(messageContent);

                break;

            /**
             * Type 98    UnMute Call Participant
             */
            case chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                callsManager().get(threadId).handleParticipantUnMute(messageContent);

                break;

            /**
             * Type 99   Partner rejected call
             */
            case chatMessageVOTypes.CANCEL_GROUP_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'REJECT_GROUP_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 110    Active Call Participants List
             */
            case chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                break;

            /**
             * Type 111    Kafka Call Session Created
             */
            case chatMessageVOTypes.CALL_SESSION_CREATED:
                // if(!callRequestController.callEstablishedInMySide)
                //     return;
                if(callRequestController.iRequestedCall) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_SESSION_CREATED',
                        result: messageContent
                    });

                    // if(!requestedCallId) {
                    sharedVariables.requestedCallId = messageContent.callId;
                }
                // }
                break;

            /**
             * Type 113    Turn On Video Call
             */
            case chatMessageVOTypes.TURN_ON_VIDEO_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(!callsManager().currentCallId)
                    return;

                callsManager().get(threadId).handleParticipantVideoOn(messageContent);

                break;

            /**
             * Type 114    Turn Off Video Call
             */
            case chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(!callsManager().currentCallId)
                    return;

                callsManager().get(threadId).handleParticipantVideoOff(messageContent);

                break;

            /**
             * Type 121    Record Call Request
             */
            case chatMessageVOTypes.RECORD_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(!currentCall()) {
                    return;
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'START_RECORDING_CALL',
                    result: messageContent
                });

                currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame(store.user().id, [4000,8000,12000,25000]);
                currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame("screenShare", [4000,8000,12000,25000]);

                break;

            /**
             * Type 122   End Record Call Request
             */
            case chatMessageVOTypes.END_RECORD_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'STOP_RECORDING_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 123   Start Screen Share
             */
            case chatMessageVOTypes.START_SCREEN_SHARE:
                if(!callsManager().currentCallId)
                    return;

                callsManager().get(threadId).handleStartScreenShare(messageContent);

                if (store.messagesCallbacks[uniqueId]) {
                        store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                break;

            /**
             * Type 124   End Screen Share
             */
            case chatMessageVOTypes.END_SCREEN_SHARE:
                // screenShareInfo.setIAmOwner(false);
                if(callsManager().currentCallId)
                    callsManager().get(threadId).handleEndScreenShare(messageContent);

                break;

            /**
             * Type 125   Delete From Call List
             */
            case chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'DELETE_FROM_CALL_LIST',
                    result: messageContent
                });

                break;
            /**
             * Type 126   Destinated Record Call Request
             */
            case chatMessageVOTypes.DESTINED_RECORD_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(!currentCall())
                    return;

                chatEvents.fireEvent('callEvents', {
                    type: 'START_RECORDING_CALL',
                    result: messageContent
                });

                currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame(store.user().id, [4000,8000,12000,25000]);
                currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame("screenShare", [4000,8000,12000,25000]);

                break;

            /**
             * Type 129   Get Calls To Join
             */
            case chatMessageVOTypes.GET_CALLS_TO_JOIN:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                break;

             /**
             * Type 221  Event to tell us p2p call converted to a group call
             */
            case chatMessageVOTypes.SWITCH_TO_GROUP_CALL_REQUEST:
                chatEvents.fireEvent('callEvents', {
                    type: 'SWITCH_TO_GROUP_CALL',
                    result: messageContent //contains: isGroup, callId, threadId
                });

                break;

            /**
             * Type 222    Call Recording Started
             */
            case chatMessageVOTypes.RECORD_CALL_STARTED:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_RECORDING_STARTED',
                    result: messageContent
                });

                break;

            /**
             * Type 225    CALL STICKER SYSTEM MESSAGE
             */
            case chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_STICKER',
                    result: messageContent
                });

                break;

            /**
             * Type 227    RECALL_THREAD_PARTICIPANT
             */
            case chatMessageVOTypes.RECALL_THREAD_PARTICIPANT:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                }
                break;

             /**
             * Type 228   INQUIRY_CALL
             */
            case chatMessageVOTypes.INQUIRY_CALL:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                }

                break;

            /**
             * Type 230    CALL_RECORDING_FAILED
             */
            case chatMessageVOTypes.CALL_RECORDING_FAILED:
                if (store.messagesCallbacks[uniqueId]) {
                    store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_RECORDING_FAILED',
                    result: messageContent
                });

                break;
        }
    }

    function processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId){
        if (store.messagesCallbacks[uniqueId]) {
            store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
        }

        callStopQueue.callStarted = true;
        messageContent.callId = threadId;
        chatEvents.fireEvent('callEvents', {
            type: 'CALL_STARTED',
            result: messageContent
        });

        if (typeof messageContent === 'object'
            && messageContent.hasOwnProperty('chatDataDto')
            && !!messageContent.chatDataDto.kurentoAddress) {

            let options = {
                video: messageContent.clientDTO.video,
                mute: messageContent.clientDTO.mute,
                sendingTopic: messageContent.clientDTO.topicSend,
                receiveTopic: messageContent.clientDTO.topicReceive,
                screenShare: messageContent.chatDataDto.screenShare,
                brokerAddress: messageContent.chatDataDto.brokerAddressWeb,
                turnAddress: messageContent.chatDataDto.turnAddress,
                internalTurnAddress: messageContent.chatDataDto.internalTurnAddress,
                selfData: messageContent.clientDTO,
                clientsList: messageContent.otherClientDtoList,
                screenShareOwner: +messageContent.chatDataDto.screenShareUser,
                recordingOwner: +messageContent.chatDataDto.recordingUser,
                kurentoAddress: messageContent.chatDataDto.kurentoAddress.split(','),
                cameraPaused: joinCallParams.cameraPaused
            };

            callsManager().addItem(threadId, options);
        } else {
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                message: 'Chat Data DTO is not present!',
                environmentDetails: getSDKCallDetails()
            });
        }
    }

    this.startCall = async function (params, callback) {
        let startCallData = {
            chatMessageVOType: chatMessageVOTypes.CALL_REQUEST,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {
            creatorClientDto: {}
        };

        if (params) {
            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            } else {
                content.type = 0x0; // Defaults to AUDIO Call
            }

            content.creatorClientDto.mute = (params.mute && typeof params.mute === 'boolean') ? params.mute : false;
            content.mute = (params.mute && typeof params.mute === 'boolean') ? params.mute : false;

            if (params.clientType
                && typeof params.clientType === 'string'
                && callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.creatorClientDto.clientType = callClientType.WEB;
            }

            if (typeof +params.threadId === 'number' && +params.threadId > 0) {
                content.threadId = +params.threadId;
            } else {
                if (Array.isArray(params.invitees) && params.invitees.length) {
                    content.invitees = [];//params.invitees;
                    for (let i = 0; i < params.invitees.length; i++) {
                        let tempInvitee = params.invitees[i];

                        if (tempInvitee && typeof tempInvitee.idType === "string") {
                            tempInvitee.idType = inviteeVOidTypes[tempInvitee.idType];
                            content.invitees.push(tempInvitee);
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
                    });
                    return;
                }
            }

            if(params.threadInfo
                && (params.threadInfo.metadata
                    || params.threadInfo.uniqueName)
            ) {
                content.createCallThreadRequest = params.threadInfo
            }

            startCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
            });
            return;
        }

        joinCallParams.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : false;
        callRequestController.iRequestedCall = true;
        if(!sharedVariables.deviceManager)
            sharedVariables.deviceManager = new DeviceManager();
        sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
            video: params.type == 'video',
            audio: !params.mute,
            closeStream: true
        }, function (result) {
            if(result.hasError) {
                callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                });
                return;
            }

            if(sharedVariables.callNoAnswerTimeout) {
                callRequestController.callRequestTimeout = setTimeout( function(metaData) {
                    //Reject the call if participant didn't answer
                    if(!callStopQueue.callStarted ) {
                        chatEvents.fireEvent("callEvents", {
                            type: "CALL_NO_ANSWER_TIMEOUT",
                            message: "[CALL_SESSION_CREATED] Call request timed out, No answer",
                        });

                        metaData.callInstance.rejectCall({
                            callId: metaData.currentCallId
                        });
                    }
                }, sharedVariables.callNoAnswerTimeout, {callInstance: currentModuleInstance, currentCallId: callsManager().currentCallId});
            }

            callsManager().destroyAllCalls();

            messenger().sendMessage(startCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        });
    };

    this.startGroupCall = async function (params, callback) {
        let startCallData = {
            chatMessageVOType: chatMessageVOTypes.GROUP_CALL_REQUEST,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {
            creatorClientDto: {}
        };

        if (params) {
            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            } else {
                content.type = 0x0; // Defaults to AUDIO Call
            }

            content.creatorClientDto.mute = (typeof params.mute === 'boolean') ? params.mute : false;

            if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.creatorClientDto.clientType = callClientType.WEB;
            }

            if (typeof +params.threadId === 'number' && params.threadId > 0) {
                content.threadId = +params.threadId;
            } else {
                if (Array.isArray(params.invitees)) {
                    content.invitees = [];

                    for (let i = 0; i < params.invitees.length; i++) {
                        let tempInvitee = params.invitees[i];

                        if (tempInvitee && typeof tempInvitee.idType === "string") {
                            tempInvitee.idType = inviteeVOidTypes[tempInvitee.idType];
                            content.invitees.push(tempInvitee);
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
                    });
                    return;
                }
            }

            if(params.threadInfo
                && (params.threadInfo.title
                    || params.threadInfo.description
                    || params.threadInfo.metadata
                    || params.threadInfo.uniqueName)
            ) {
                content.createCallThreadRequest = params.threadInfo
            }

            startCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
            });
            return;
        }

        joinCallParams.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : false;
        callRequestController.iRequestedCall = true;
        if(!sharedVariables.deviceManager)
            sharedVariables.deviceManager = new DeviceManager();
        sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
            video: params.type == 'video',
            audio: !params.mute,
            closeStream: true
        }, function (result) {
            if (result.hasError) {
                callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                });
                return;
            }

            if(sharedVariables.callNoAnswerTimeout) {
                callRequestController.callRequestTimeout = setTimeout( function(metaData) {
                    //Reject the call if participant didn't answer
                    if(!callStopQueue.callStarted) {
                        chatEvents.fireEvent("callEvents", {
                            type: "CALL_NO_ANSWER_TIMEOUT",
                            message: "[CALL_SESSION_CREATED] Call request timed out, No answer",
                        });

                        metaData.callInstance.rejectCall({
                            callId: metaData.currentCallId
                        });
                    }
                }, sharedVariables.callNoAnswerTimeout, {callInstance: currentModuleInstance, currentCallId: callsManager().currentCallId});
            }

            messenger().sendMessage(startCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        })
    };

    this.sendCallMetaData = function (params) {
        sendCallMetaData({
            id: callMetaDataTypes.CUSTOMUSERMETADATA,
            userid: store.user().id,
            content: params.content
        });
    };

    this.callReceived = callReceived;

    this.terminateCall = function (params, callback) {
        let terminateCallData = {
            chatMessageVOType: chatMessageVOTypes.TERMINATE_CALL,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {};

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                terminateCallData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }

            terminateCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to terminate the call!'
            });
            return;
        }

        return messenger().sendMessage(terminateCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.acceptCall = async function (params, callback) {
        let acceptCallData = {
            chatMessageVOType: chatMessageVOTypes.ACCEPT_CALL,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {};


        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                acceptCallData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }

            content.mute = (typeof params.mute === 'boolean') ? params.mute : false;
            content.video = (typeof params.video === 'boolean') ? params.video : false;
            content.videoCall = content.video;
            joinCallParams.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : callRequestController.cameraPaused;

            if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
                content.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.clientType = callClientType.WEB;
            }

            acceptCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to accept the call!'
            });
            return;
        }

        sharedVariables.acceptedCallId = parseInt(params.callId);
        callRequestController.iAcceptedCall = true;

        if(!sharedVariables.deviceManager)
            sharedVariables.deviceManager = new DeviceManager();

        sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
            video: params.video,
            audio: !params.mute,
            closeStream: true
        }, function (result) {
            if (result.hasError) {
                callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                });
                return;
            }

            messenger().sendMessage(acceptCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        });
    };

    this.rejectCall = this.cancelCall = function (params, callback) {
        let rejectCallData = {
            chatMessageVOType: chatMessageVOTypes.REJECT_CALL,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                rejectCallData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to reject the call!'
            });
            return;
        }

        return messenger().sendMessage(rejectCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.endCall = endCall;

    this.startRecordingCall = function (params, callback) {
        let recordCallData = {
            chatMessageVOType: chatMessageVOTypes.RECORD_CALL,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token,
            content: {}
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                recordCallData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }

            if(params.destinated === true) {
                recordCallData.chatMessageVOType = chatMessageVOTypes.DESTINED_RECORD_CALL;
                recordCallData.content.recordType = typeof +params.recordType === 'number' ? params.recordType : 1;
                recordCallData.content.tags = Array.isArray(params.tags) ? params.tags : null;
                recordCallData.content.threadId = typeof +params.threadId === 'number' ? params.threadId : null;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Record call!'
            });
            return;
        }

        return messenger().sendMessage(recordCallData, {
            onResult: function (result) {
                currentCall().users().get(store.user().id).videoTopicManager().restartMediaOnKeyFrame(store.user().id, [100])
                callback && callback(result);
            }
        });
    };

    this.stopRecordingCall = function (params, callback) {
        let stopRecordingCallData = {
            chatMessageVOType: chatMessageVOTypes.END_RECORD_CALL,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                stopRecordingCallData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Stop Recording the call!'
            });
            return;
        }

        return messenger().sendMessage(stopRecordingCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.startScreenShare = function (params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.START_SCREEN_SHARE,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            subjectId: callsManager().currentCallId,
            token: sdkParams.token
        };

        if(!sendData.subjectId) {
            raiseCallError(errorList.INVALID_CALLID, callback, true, {});
            return;
        }
        if(screenShareInfo.isStarted()) {
            raiseCallError(errorList.SCREENSHARE_ALREADY_STARTED, callback, true);
            return
        }

        if(params.quality) {
            sharedVariables.startScreenSharetParams.quality = params.quality;
        }

        currentCall().deviceManager().grantScreenSharePermission({
            video: params.video,
            audio: !params.mute,
            closeStream: false
        }, function (result) {
            if (result.hasError) {
                callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                });
                return;
            }

            return messenger().sendMessage(sendData, function (result) {
                callback && callback(result);
            });
        });
    };

    this.endScreenShare = endScreenShare;

    this.resizeScreenShare = function (params, callback) {
        let cCall = callsManager().get(callsManager().currentCallId);
        let result = {}

        if(!cCall) {
            result.hasError = false;
            callback && callback(result);
            return;
        }

        if(cCall.screenShareInfo.isStarted() && cCall.screenShareInfo.iAmOwner()) {
            let qualityObj = calculateScreenSize({quality: params.quality});
            screenShareInfo.setWidth(qualityObj.width);
            screenShareInfo.setHeight(qualityObj.height);

            // applyScreenShareSizeToElement()
            cCall.users().get("screenShare").videoTopicManager().restartMediaOnKeyFrame('screenShare', [10, 1000, 2000]);

            cCall.sendCallMetaData({
                id: callMetaDataTypes.SCREENSHAREMETADATA,
                userid: store.user().id,
                content: {
                    dimension: {
                        width: cCall.screenShareInfo.getWidth(),
                        height: cCall.screenShareInfo.getHeight()
                    }
                }
            })

            result.hasError = false;
        } else {
            result.hasError = true;
            result.errorMessage = 'You can not apply size to others ScreenShare or ScreenShare is not started'
        }

        callback && callback(result);
    };

    this.getCallsList = function (params, callback) {
        let getCallListData = {
            chatMessageVOType: chatMessageVOTypes.GET_CALLS,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {};

        if (params) {
            if (typeof params.count === 'number' && params.count >= 0) {
                content.count = +params.count;
            } else {
                content.count = 25;
            }

            if (typeof params.offset === 'number' && params.offset >= 0) {
                content.offset = +params.offset;
            } else {
                content.offset = 0;
            }

            if (typeof params.creatorCoreUserId === 'number' && params.creatorCoreUserId > 0) {
                content.creatorCoreUserId = +params.creatorCoreUserId;
            }

            if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
                content.creatorSsoId = +params.creatorSsoId;
            }

            if (typeof params.name === 'string') {
                content.name = params.name;
            }

            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            }

            if (Array.isArray(params.callIds)) {
                content.callIds = params.callIds;
            }

            if (typeof params.threadId === 'number' && +params.threadId > 0) {
                content.threadId = +params.threadId;
            }

            if (typeof params.contactType === 'string') {
                content.contactType = params.contactType;
            }

            if (typeof params.uniqueId === 'string') {
                content.uniqueId = params.uniqueId;
            }

            getCallListData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to End the call!'
            });
            return;
        }

        return messenger().sendMessage(getCallListData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.getCallsToJoin = function (params, callback) {
        let getCallListData = {
            chatMessageVOType: chatMessageVOTypes.GET_CALLS_TO_JOIN,
            pushMsgType: 3,
            token: sdkParams.token
        }, content = {};

        if (params) {
            if (typeof params.count === 'number' && params.count >= 0) {
                content.count = +params.count;
            } else {
                content.count = 25;
            }

            if (typeof params.offset === 'number' && params.offset >= 0) {
                content.offset = +params.offset;
            } else {
                content.offset = 0;
            }

            if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
                content.creatorSsoId = +params.creatorSsoId;
            }

            if (typeof params.name === 'string') {
                content.name = params.name;
            }

            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            }

            if (Array.isArray(params.threadIds)) {
                content.threadIds = params.threadIds;
            }

            if (typeof params.uniqueId === 'string') {
                content.uniqueId = params.uniqueId;
            }

            getCallListData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Invalid params'
            });
            return;
        }

        return messenger().sendMessage(getCallListData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.deleteFromCallList = function (params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.DELETE_FROM_CALL_HISTORY,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.contactType === 'string' && params.contactType.length) {
                sendData.content.contactType = params.contactType;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'You should enter a contactType!'
                });
                return;
            }

            if (Array.isArray(params.callIds)) {
                sendData.content = params.callIds;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Delete a call from Call History!'
            });
            return;
        }

        return messenger().sendMessage(sendData, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    let messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.getCallParticipants = function (params, callback) {
        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS,
            typeCode: sdkParams.generalTypeCode,//params.typeCode,
            content: {}
        };

        if (params) {
            if (isNaN(params.callId)) {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Call Id should be a valid number!'
                });
                return;
            } else {
                let callId = +params.callId;
                sendMessageParams.subjectId = callId;

                let offset = (parseInt(params.offset) > 0)
                    ? parseInt(params.offset)
                    : 0,
                    count = (parseInt(params.count) > 0)
                        ? parseInt(params.count)
                        : config.getHistoryCount;

                sendMessageParams.content.count = count;
                sendMessageParams.content.offset = offset;

                return messenger().sendMessage(sendMessageParams, {
                    onResult: function (result) {
                        let returnData = {
                            hasError: result.hasError,
                            cache: false,
                            errorMessage: result.errorMessage,
                            errorCode: result.errorCode
                        };

                        if (!returnData.hasError) {
                            let messageContent = result.result,
                                messageLength = messageContent.length,
                                resultData = {
                                    participants: reformatCallParticipants(messageContent),
                                    contentCount: result.contentCount,
                                    hasNext: (sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0),
                                    nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
                                };

                            returnData.result = resultData;
                        }

                        callback && callback(returnData);
                        /**
                         * Delete callback so if server pushes response before
                         * cache, cache won't send data again
                         */
                        callback = undefined;

                        if (!returnData.hasError) {
                            chatEvents.fireEvent('callEvents', {
                                type: 'CALL_PARTICIPANTS_LIST_CHANGE',
                                threadId: callId,
                                result: returnData.result
                            });
                        }
                    }
                });
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Get Call Participants!'
            });
            return;
        }
    };

    /**
     * This method inquiries call participants from call servers
     */
    this.inquiryCallParticipants = function ({}, callback) {
        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.INQUIRY_CALL,
            typeCode: sdkParams.generalTypeCode,//params.typeCode,
            subjectId: callsManager().currentCallId,
            content: {}
        };

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };

                if (!returnData.hasError) {
                    let messageContent = result.result,
                        messageLength = messageContent.length,
                        resultData = {
                            participants: reformatCallParticipants(messageContent),
                            contentCount: result.contentCount,
                        };

                    returnData.result = resultData;
                }

                callback && callback(returnData);
                /**
                 * Delete callback so if server pushes response before
                 * cache, cache won't send data again
                 */
                callback = undefined;

                returnData.result.callId = callsManager().currentCallId;

                if (!returnData.hasError) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'ACTIVE_CALL_PARTICIPANTS',
                        result: returnData.result
                    });
                }
            }
        });
    };

    this.addCallParticipants = function (params, callback) {
        /**
         * + AddCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of CONTACT IDs or inviteeVO Objects
         *    - uniqueId                    {string}
         */

        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.ADD_CALL_PARTICIPANT,
            typeCode: sdkParams.generalTypeCode,//params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.contactIds)) {
                sendMessageParams.content = params.contactIds;
            }

            if (Array.isArray(params.usernames)) {
                sendMessageParams.content = [];
                for (let i = 0; i < params.usernames.length; i++) {
                    sendMessageParams.content.push({
                        id: params.usernames[i],
                        idType: inviteeVOidTypes.TO_BE_USER_USERNAME
                    });
                }
            }

            if (Array.isArray(params.coreUserids)) {
                sendMessageParams.content = [];
                for (let i = 0; i < params.coreUserids.length; i++) {
                    sendMessageParams.content.push({
                        id: params.coreUserids[i],
                        idType: inviteeVOidTypes.TO_BE_CORE_USER_ID
                    });
                }
            }
        }

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    let messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.removeCallParticipants = function (params, callback) {
        /**
         * + removeCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.REMOVE_CALL_PARTICIPANT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    let messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.muteCallParticipants = function (params, callback) {
        /**
         * + muteCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.MUTE_CALL_PARTICIPANT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    let messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.unMuteCallParticipants = function (params, callback) {
        /**
         * + unMuteCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    let messageContent = result.result;
                    returnData.result = messageContent;

                }
                callback && callback(returnData);
            }
        });
    };

    this.turnOnVideoCall = function (params, callback) {
        let turnOnVideoData = {
            chatMessageVOType: chatMessageVOTypes.TURN_ON_VIDEO_CALL,
            typeCode: sdkParams.generalTypeCode,//params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                turnOnVideoData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to turn on the video call!'
            });
            return;
        }

        let call = callsManager().get(callsManager().currentCallId);
        if(!call) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Call not exists'
            });
            return;
        }

        let user = call.users().get(store.user().id); //callUsers[store.user().id];
        if(user
            && user.videoTopicManager()
            && user.videoTopicManager().getPeer()
        ) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Video stream is already open!'
            });
            return;
        }

        return messenger().sendMessage(turnOnVideoData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.turnOffVideoCall = function (params, callback) {
        let turnOffVideoData = {
            chatMessageVOType: chatMessageVOTypes.TURN_OFF_VIDEO_CALL,
            typeCode: sdkParams.generalTypeCode,//params.typeCode,
            pushMsgType: 3,
            token: sdkParams.token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                turnOffVideoData.subjectId = +params.callId;
            } else {
                raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to turn off the video call!'
            });
            return;
        }

        let call = callsManager().get(callsManager().currentCallId);
        if(!call) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Call not exists'
            });
            return;
        }

        let user = call.users().get(store.user().id); //callUsers[store.user().id];
        if(user
            && user.videoTopicManager()
            && user.videoTopicManager().getPeer()

            && (
                user.videoTopicManager().isPeerConnecting()
                || user.videoTopicManager().isPeerFailed()
                || user.videoTopicManager().isPeerDisconnected()
            )
            ) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Can not stop stream in current state'
            });
            return;
        }

        return messenger().sendMessage(turnOffVideoData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.disableParticipantsVideoReceive = function (params, callback) {
        if (params) {
            if (Array.isArray(params.userIds) && params.userIds.length) {
                for(let i in params.userIds) {
                    let user = currentCall().users().get(params.userIds[i]);
                    if(user.user().id != "screenShare"){
                        user.destroyVideo();
                    }

                    // callStateController.deactivateParticipantStream(
                    //     params.userIds[i],
                    //     'video',
                    //     'video'
                    // );
                }
                callback && callback({hasError: false});
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to closeOthersVideoReceive'
            });
            return;
        }
    };

    this.enableParticipantsVideoReceive = function (params, callback) {
        if (params) {
            if (Array.isArray(params.userIds) && params.userIds.length) {
                for( let i in params.userIds) {
                    let user = currentCall().users().get(params.userIds[i]);
                    if (!user || !user.user().video)
                        continue;

                    user.startVideo(user.user().topicSend);
                }
                callback && callback({hasError: false});
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to closeOthersVideoReceive'
            });
        }
    };

    /**
     * Pauses camera-send without closing its topic
     * @param params
     * @param callback
     */
    this.pauseCamera = function (params, callback) {
        // let me = callUsers[store.user().id];
        // let currentCall = callsManager().get(callsManager().currentCallId);
        if(!currentCall())
            return;

        let me = currentCall().users.get(store.user().id);
        if(!me || !me.user().video || !me.videoTopicManager().getPeer())
            return;

        me.videoTopicManager().pauseSendStream();
        callback && callback();
    };

    this.resumeCamera = function (params, callback) {
        // let currentCall = callsManager().get(callsManager().currentCallId);
        if(!currentCall())
            return;

        let me = currentCall().users.get(store.user().id);
        if(!me || !me.user().videoTopicName || !me.videoTopicManager().getPeer())//!me.peers[me.videoTopicName]
            return;

        me.videoTopicManager().pauseSendStream();
        callback && callback();
    };

    /**
     * Pauses mice-send without closing its topic
     * @param params
     * @param callback
     */
    this.pauseMice = function (params, callback) {
        let currentCall = callsManager().get(callsManager().currentCallId);
        let me = currentCall.users.get(store.user().id);

        if(!currentCall || !me || !me.user().audioTopicName || !me.audioTopicManager().getPeer())//!me.peers[me.videoTopicName]
            return;

        me.audioTopicManager().getPeer().getLocalStream().getTracks()[0].enabled = false;
        callback && callback();
    };

    this.resumeMice = function (params, callback) {
        let currentCall = callsManager().get(callsManager().currentCallId);
        let me = currentCall.users.get(store.user().id);

        if(!currentCall || !me || !me.user().audioTopicName || !me.audioTopicManager().getPeer())//!me.peers[me.videoTopicName]
            return;

        me.audioTopicManager().getPeer().getLocalStream().getTracks()[0].enabled = false;
        callback && callback();
    };

    this.resizeCallVideo = function (params, callback) {
        if (params) {
            if (!!params.width && +params.width > 0) {
                sharedVariables.callVideoMinWidth = +params.width;
            }

            if (!!params.height && +params.height > 0) {
                sharedVariables.callVideoMinHeight = +params.height;
            }

            if(!callUsers[store.user().id]){
                sdkParams.consoleLogging && console.log("Error in resizeCallVideo(), call not started ");
                return;
            }

            let userObject = callUsers[store.user().id]
            //userObject.peers[userObject.videoTopicName]
            userObject.videoTopicManager.getPeer()
                .getLocalStream()
                .getTracks()[0]
                .applyConstraints({
                "width": sharedVariables.callVideoMinWidth,
                "height": sharedVariables.callVideoMinHeight
            })
                .then((res) => {
                    userObject.htmlElements[userObject.videoTopicName].style.width = sharedVariables.callVideoMinWidth + 'px';
                    userObject.htmlElements[userObject.videoTopicName].style.height = sharedVariables.callVideoMinHeight + 'px';
                    callback && callback();
                })
                .catch((e) => {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: e
                    });
                });
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to resize the video call! Send an object like {width: 640, height: 480}'
            });
            return;
        }
    };

    this.sendCallSticker = function ({
        sticker = callStickerTypes.RAISE_HAND
    }, callback) {
        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: [
                sticker
            ],
            subjectId: callsManager().currentCallId
        };

        if(!sendMessageParams.subjectId) {
            raiseError(errorList.INVALID_CALLID, callback, true, {});
            return;
        }

        if(!sticker || !Object.values(callStickerTypes).includes(sticker)) {
            raiseCallError(errorList.INVALID_STICKER_NAME, callback, true);
            return;
        }

        return messenger().sendMessage(sendMessageParams, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

    this.recallThreadParticipant = function ({invitees}, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.RECALL_THREAD_PARTICIPANT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            content: null,
            subjectId: callsManager().currentCallId,
        };

        if(!invitees || !Array.isArray(invitees) || !invitees.length) {
            raiseCallError(errorList.INVITEES_LIST_REQUIRED, callback, true, {});
            return;
        }

        sendData.content = [];//params.invitees;
        invitees.forEach(item => {
            item.idType = inviteeVOidTypes[item.idType];
            sendData.content.push(item);
        })

        return messenger().sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.deviceManager = (sharedVariables.deviceManager ? sharedVariables.deviceManager : ( currentCall() ? currentCall().deviceManager() : null))

    this.resetCallStream = async function({userId, streamType = 'audio'}, callback) {
        if(!callsManager().currentCallId) {
            callback && callback({hasError: true});
            return;
        }

        let user = callsManager().get(callsManager().currentCallId).users().get(userId);

        if(!user){
            callback && callback({hasError: true});
            return;
        }

        await user.reconnectTopic(streamType);
        callback && callback({hasError: false});
    }
}

export default ChatCall
