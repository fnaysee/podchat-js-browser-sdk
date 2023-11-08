import {CallUsers} from "./callUsers";
import Utility from "../../utility/utility";
import CallServerManager from "./callServerManager";
import {callMetaDataTypes} from "../constants";
import {errorList} from "../errorHandler";

function CallManager({app, callId, callConfig}) {
    const config = {
        callId,
        callConfig,
        users: new CallUsers({app, callId}),
        callServerController: new CallServerManager(app),
        screenShareInfo: new ScreenShareStateManager(app),
        deviceManager: null
    };

    function startCallWebRTCFunctions(callConfig) {
        config.callServerController.setServers(callConfig.kurentoAddress);
        if (app.call.sharedVariables.callDivId) {
            new Promise(resolve => {
                let callVideo = (typeof callConfig.video === 'boolean') ? callConfig.video : true,
                    callMute = (typeof callConfig.mute === 'boolean') ? callConfig.mute : false;

                config.deviceManager = app.call.sharedVariables.deviceManager;
                app.call.sharedVariables.deviceManager = null;

                if (callConfig.selfData) {
                    callConfig.selfData.callId = config.callId;
                    callConfig.selfData.cameraPaused = callConfig.cameraPaused;
                    config.users.addItem(callConfig.selfData);
                    // callStateController.setupCallParticipant(params.selfData);
                }

                config.screenShareInfo.setOwner(callConfig.screenShareOwner);
                config.screenShareInfo.setIsStarted(!!callConfig.screenShareOwner);

                if (callConfig.recordingOwner) {
                    app.chatEvents.fireEvent('callEvents', {
                        type: 'CALL_RECORDING_STARTED',
                        result: {
                            id: callConfig.recordingOwner
                        }
                    });
                }

                if (callConfig.clientsList && callConfig.clientsList.length) {
                    for (let i in callConfig.clientsList) {
                        if (callConfig.clientsList[i].userId !== app.store.user.get().id) {
                            callConfig.clientsList[i].callId = config.callId;
                            callConfig.clientsList[i].cameraPaused = false;
                            config.users.addItem(callConfig.clientsList[i]);

                        }
                    }
                }

                config.callConfig.screenShareObject = {
                    callId : config.callId,
                    cameraPaused : false,
                    userId : "screenShare",
                    topicSend: callConfig.screenShare
                }

                config.screenShareInfo.setIsStarted(!!config.callConfig.screenShareOwner);
                if(config.screenShareInfo.isStarted()) {
                    config.screenShareInfo.setOwner(config.callConfig.screenShareOwner);
                    config.users.addItem(config.callConfig.screenShareObject, "screenShare");
                }

                config.callConfig.callVideo = callVideo;
                config.callConfig.callAudio = callMute;
                createSessionInChat();
                resolve();
            }).then(()=>{
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                });
            })

        } else {
            app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        }
    }

    function createSessionInChat() {
        app.call.callStopQueue.callStarted = true;

        let message = {
                id: 'CREATE_SESSION',
                brokerAddress: config.callConfig.brokerAddress,
                turnAddress: config.callConfig.turnAddress.split(',')[0]
            },
            onResultCallback = function (res) {
                if (res.done === 'TRUE') {
                    app.call.callStopQueue.callStarted = true;
                    // callController.startCall(params);
                } else {
                    app.callsManager.removeItem(config.callId);
                    // endCall({callId: config.callId});
                    // callStop(true, true);
                }

            }
        sendCallMessage(message, onResultCallback, {
                timeoutTime: 4000,
                timeoutRetriesCount: 5
            }
        )
    }

    async function callStop(resetCurrentCallId = true, resetCameraPaused = true) {
        await config.users.destroy();

        if (app.call.callStopQueue.callStarted) {
            sendCallMessage({
                id: 'CLOSE'
            }, null, {});
            app.call.callStopQueue.callStarted = false;
        }

        if (resetCameraPaused)
            app.call.joinCallParams.cameraPaused = false;

        clearTimeout(config.callRequestTimeout);
        config.callConfig = {};

        if (resetCurrentCallId)
            config.callId = null;
    }

    function sendCallMessage(message, callback, {
        timeoutTime = 0,
        timeoutRetriesCount = 0
    }) {
        message.token = app.sdkParams.token;

        // let uniqueId;

        if (!message.uniqueId) {
            message.uniqueId = Utility.generateUUID();
        }

        // message.uniqueId = uniqueId;
        message.chatId = config.callId;

        let data = {
            type: 3,
            content: {
                peerName: config.callServerController.getCurrentServer(),// callServerName,
                priority: 1,
                content: JSON.stringify(message),
                ttl: app.sdkParams.messageTtl
            }
        };

        if (typeof callback == 'function') {
            app.store.messagesCallbacks[message.uniqueId] = callback;
        }

        app.call.sharedVariables.asyncClient.send(data, function (res) {
        });

        if (timeoutTime || app.call.sharedVariables.globalCallRequestTimeout > 0) {
            app.store.asyncRequestTimeouts[message.uniqueId] && clearTimeout(app.store.asyncRequestTimeouts[message.uniqueId]);
            app.store.asyncRequestTimeouts[message.uniqueId] = setTimeout(function () {
                if (app.store.messagesCallbacks[message.uniqueId]) {
                    delete app.store.messagesCallbacks[message.uniqueId];
                }

                if (timeoutRetriesCount) {
                    app.sdkParams.consoleLogging && console.log("[SDK][sendCallMessage] Retrying call request. uniqueId :" + message.uniqueId, {message})
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
            }, timeoutTime || app.call.sharedVariables.globalCallRequestTimeout);
        }
    }

    function subscribeToReceiveOffers(jsonMessage) {
        if (jsonMessage.upOrDown === true) { //TRUE if participant is sending data on this topic
            sendCallMessage({
                id: 'SUBSCRIBE',
                useComedia: true,
                useSrtp: false,
                topic: jsonMessage.topic,
                mediaType: (jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2 : 1)
                //brokerAddress:brkrAddr
            }, null, {
                timeoutTime: 4000,
                timeoutRetriesCount: 5
            });
        }
    }

    function handleProcessSdpOffer(jsonMessage) {
        let userId = config.users.findUserIdByTopic(jsonMessage.topic),
            topicManager,
            peer; //callUsers[userId].peers[jsonMessage.topic];

        if (!userId) {
            console.warn("[SDK] Skipping PROCESS_SDP_OFFER, topic not exists.", {jsonMessage})
            return;
        }

        let userObj = config.users.get(userId);


        if (jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
            topicManager = config.users.get(userId).videoTopicManager()
            peer = topicManager.videoTopicManager().getPeer();
        } else if (jsonMessage.topic.indexOf('Vo-') !== -1) {
            topicManager = config.users.get(userId).audioTopicManager();
            peer = topicManager.audioTopicManager().getPeer();
        }

        if (peer == null) {
            console.warn("[handleProcessSdpAnswer] Skip, no WebRTC Peer");
            return;
        }

        peer.processOffer(jsonMessage.sdpOffer, function (err, sdpAnswer) {
            if (err) {
                console.error("[SDK][handleProcessSdpOffer] Error: " + err);
                stop();
                return;
            }

            sendCallMessage({
                id: 'RECIVE_SDP_ANSWER',
                sdpAnswer: sdpAnswer,
                useComedia: true,
                useSrtp: false,
                topic: jsonMessage.topic,
                mediaType: (jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2 : 1)
            }, null, {
                timeoutTime: 4000,
                timeoutRetriesCount: 5
            });

            topicManager.topicMetaData().sdpAnswerReceived = true;
            // topicManager.startMedia()
            // if (userObj.isScreenShare() || userObj.isMe()) {
            //     topicManager.restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000]);
            // }
        });
    }

    function handleProcessSdpAnswer(jsonMessage) {
        let userId = config.users.findUserIdByTopic(jsonMessage.topic),
            topicManager,
            peer; // = callUsers[userId].peers[jsonMessage.topic];

        if (!userId) {
            console.warn("[SDK] Skipping PROCESS_SDP_ANSWER, topic not exists. ", {jsonMessage})
            return;
        }

        let userObj = config.users.get(userId);

        if (jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
            topicManager = userObj.videoTopicManager();
        } else if (jsonMessage.topic.indexOf('Vo-') !== -1) {
            topicManager = userObj.audioTopicManager();
        }

        if(!topicManager)
            return;

        peer = topicManager.getPeer();

        if (peer == null) {
            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: "[handleProcessSdpAnswer] Skip, no WebRTC Peer",
                error: peer,
                environmentDetails: getCallDetails()
            });
            return;
        }

        peer.processAnswer(jsonMessage.sdpAnswer, (err) => {
            if (err) {
                sendCallSocketError("[handleProcessSdpAnswer] Error: " + err);

                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "[handleProcessSdpAnswer] Error: " + err,
                    environmentDetails: getCallDetails()
                });

                return;
            }

            app.sdkParams.consoleLogging && console.log("[SDK][handleProcessSdpAnswer]", jsonMessage, jsonMessage.topic, topicManager.metadata().isIceCandidateIntervalSet().toString());

            if (topicManager.metadata().isIceCandidateIntervalSet()) {
                topicManager.topicMetaData().sdpAnswerReceived = true;
                // topicManager.startMedia()
                // if (userId == 'screenShare' || userId == app.store.user.get().id) {
                //     topicManager.restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000, 20000]);
                // }
            }
        });
    }

    function handleAddIceCandidate(jsonMessage) {
        let userId = config.users.findUserIdByTopic(jsonMessage.topic);

        if (!userId) {
            console.warn("[SDK] Skipping ADD_ICE_CANDIDATE, topic not exists.", {jsonMessage})
            return;
        }

        let peer; //= callUsers[userId].peers[jsonMessage.topic];

        if (jsonMessage.topic.indexOf('Vi-') > -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
            peer = config.users.get(userId).videoTopicManager();
        } else if (jsonMessage.topic.indexOf('Vo-') > -1) {
            peer = config.users.get(userId).audioTopicManager();
        }

        if(!peer)
            return;

        peer = peer.getPeer();

        if (peer == null) {
            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: "[handleAddIceCandidate] Skip, no WebRTC Peer",
                error: JSON.stringify(peer),
                environmentDetails: getCallDetails()
            });
            return;
        }

        peer.addIceCandidate(jsonMessage.candidate, (err) => {
            if (err) {
                console.error("[handleAddIceCandidate] " + err);

                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "[handleAddIceCandidate] " + err,
                    error: JSON.stringify(jsonMessage.candidate),
                    environmentDetails: getCallDetails()
                });

                return;
            }
        });
    }

    function getCallDetails(customData) {
        return {
            currentUser: app.store.user.get(),
            currentServers: {
                callTurnIp: app.call.sharedVariables.callTurnIp,
            },
            isJanus: config.callId && config.callServerController.isJanus(),
            screenShareInfo: {
                isStarted: config.screenShareInfo.isStarted(),
                iAmOwner: config.screenShareInfo.iAmOwner(),
            },
            callId: config.callId,
            startCallInfo: config.callConfig,
            ...customData,

        }
    }

    function sendCallSocketError(message) {
        app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            code: 7000,
            message: message,
            environmentDetails: getCallDetails()
        });

        sendCallMessage({
            id: 'ERROR',
            message: message,
        }, null, {});
    }

    function handlePartnerFreeze(jsonMessage) {
        if (!!jsonMessage && !!jsonMessage.topic && jsonMessage.topic.substring(0, 2) === 'Vi') {
            let userId = config.users.findUserIdByTopic();
            if (userId) {
                config.users.get(userId).videoTopicManager().restartMedia()
                setTimeout(function () {
                    config.users.get(userId).videoTopicManager().restartMedia()
                }, 4000);
                setTimeout(function () {
                    config.users.get(userId).videoTopicManager().restartMedia()
                }, 8000);
            }
        }
    }

    function handleReceivedMetaData(jsonMessage, uniqueId) {
        let jMessage = JSON.parse(jsonMessage.message);
        let id = jMessage.id;
        if (!id || typeof id === "undefined" || jsonMessage.userid == app.store.user.get().id) {
            return;
        }

        switch (id) {
            case callMetaDataTypes.POORCONNECTION:
                publicized.sendQualityCheckEvent({
                    userId: jMessage.userid,
                    topic: jMessage.content.description,//jMessage.topic,
                    mediaType: (jMessage.content.description.indexOf('Vi') !== -1 ? 'video' : 'audio'),//jMessage.mediaType,
                    canSendCallMetaData: false
                });

                break;
            case callMetaDataTypes.POORCONNECTIONRESOLVED:
                publicized.sendQualityCheckEvent({
                    userId: jMessage.userid,
                    topic: jMessage.content.description,
                    mediaType: (jMessage.content.description.indexOf('Vi') !== -1 ? 'video' : 'audio'),
                    isResolved: true,
                    canSendCallMetaData: false
                });
                break;
            case callMetaDataTypes.CUSTOMUSERMETADATA:
                if (app.store.messagesCallbacks[uniqueId]) {
                    app.store.messagesCallbacks[uniqueId](jsonMessage);
                }
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CUSTOM_USER_METADATA',
                    userId: jMessage.userid,
                    content: jMessage.content
                });
                break;
            case callMetaDataTypes.SCREENSHAREMETADATA:
                if(config.screenShareInfo.isStarted()) {
                    config.screenShareInfo.setWidth(jMessage.content.dimension.width);
                    config.screenShareInfo.setHeight(jMessage.content.dimension.height);
                    // applyScreenShareSizeToElement();
                    if(config.screenShareInfo.iAmOwner()){
                        setTimeout(()=>{
                            if(config.users.get('screenShare') && config.users.get('screenShare').videoTopicManager())
                                config.users.get('screenShare').videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000]);
                        }, 2500)
                    }

                    app.chatEvents.fireEvent("callEvents", {
                        type: 'SCREENSHARE_METADATA',
                        userId: jMessage.userid,
                        content: jMessage.content
                    });
                }
                break;
        }

    }

    function sendCallMetaData(params) {
        let message = {
            id: params.id,
            userid: params.userid,
            content: params.content || undefined
        };

        sendCallMessage({
            id: 'SENDMETADATA',
            message: JSON.stringify(message),
            chatId: config.callId
        }, null, {});
    }
    function handleError(jsonMessage, sendingTopic, receiveTopic) {
        const errMessage = jsonMessage.message;

        app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            code: 7000,
            message: "Kurento error: " + errMessage,
            environmentDetails: getCallDetails()
        });
    }

    const publicized = {
        callServerController(){
            return config.callServerController
        },
        callConfig() {
            return config.callConfig;
        },
        callStop,
        endCall: app.call.endCall,
        users(){
            return config.users;
        },
        deviceManager(){
            return config.deviceManager;
        },
        sendCallDivs(){
            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.users.generateCallUIList()
            });
        },
        screenShareInfo: config.screenShareInfo,
        raiseCallError: function (errorObject, callBack, fireEvent) {
            app.errorHandler.raiseError(errorObject, callBack, fireEvent, {
                eventName: 'callEvents',
                eventType: 'CALL_ERROR',
                environmentDetails: getCallDetails()
            });
        },
        getCallDetails,
        sendCallMessage,
        getTurnServer: function (params) {

            if (!!params.turnAddress && params.turnAddress.length > 0
                || (app.call.sharedVariables.useInternalTurnAddress && !!params.internalTurnAddress && params.turnAddress.length > 0 )) {

                let serversTemp = app.call.sharedVariables.useInternalTurnAddress ? params.internalTurnAddress.split(',') : params.turnAddress.split(','),
                    turnsList = [];

                for(let i in serversTemp) {
                    turnsList.push({
                        "urls": "turn:" + serversTemp[i],
                        "username": "mkhorrami",
                        "credential": "mkh_123456"
                    })
                }

                return turnsList;
            } else {
                return [
                    {
                        "urls": "turn:" + app.call.sharedVariables.callTurnIp + ":3478",
                        "username": "mkhorrami",
                        "credential": "mkh_123456"
                    }
                ];
            }
        },
        sendQualityCheckEvent: function ({
                                             userId,
                                             topic,
                                             mediaType,
                                             isLongTime = false,
                                             isResolved = false,
                                             canSendCallMetaData = true
                                         }) {
            if (mediaType === 'video') { //TODO: Deprecated!
                app.chatEvents.fireEvent('callEvents', {
                    type: isResolved ? 'POOR_VIDEO_CONNECTION_RESOLVED' : 'POOR_VIDEO_CONNECTION',
                    subType: (isResolved ? undefined : (isLongTime ? 'LONG_TIME' : 'SHORT_TIME')),
                    message: 'Poor connection resolved',
                    metadata: {
                        elementId: "uiRemoteVideo-" + topic,
                        topic: topic,
                        userId: userId
                    }
                });
            }

            app.chatEvents.fireEvent('callEvents', {
                type: isResolved ? 'POOR_CONNECTION_RESOLVED' : 'POOR_CONNECTION',
                subType: (isResolved ? undefined : (isLongTime ? 'LONG_TIME' : 'SHORT_TIME')),
                message: `Poor connection ${(isResolved ? 'resolved' : '')}`,
                metadata: {
                    media: mediaType,
                    elementId: "uiRemoteVideo-" + topic,
                    topic: topic,
                    userId: userId
                }
            });
            if (canSendCallMetaData) {
                sendCallMetaData({
                    id: (isResolved ? callMetaDataTypes.POORCONNECTIONRESOLVED : callMetaDataTypes.POORCONNECTION),
                    userid: userId,
                    content: {
                        title: `Poor Connection ${(isResolved ? 'Resolved' : '')}`,
                        description: topic,
                    }
                });
            }
        },
        processCallMessage: function (message) {
            let uniqueId = message.uniqueId;
            if (message.done !== 'FALSE' || (message.done === 'FALSE' && message.desc === 'duplicated')) {
                app.store.asyncRequestTimeouts[uniqueId] && clearTimeout(app.store.asyncRequestTimeouts[uniqueId]);
            } else if (message.done === 'FALSE') {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "Kurento error: " + (message.desc ? message.desc : message.message),
                    environmentDetails: getCallDetails()
                });
            }

            switch (message.id) {
                case 'PROCESS_SDP_ANSWER':
                    handleProcessSdpAnswer(message);
                    break;
                case 'RECEIVING_MEDIA': // Only for receiving topics from janus, first we subscribe
                    subscribeToReceiveOffers(message);
                    break;
                case 'PROCESS_SDP_OFFER':  //Then janus sends offers
                    handleProcessSdpOffer(message);
                    break;
                case 'ADD_ICE_CANDIDATE':
                    handleAddIceCandidate(message);
                    break;

                case 'GET_KEY_FRAME':
                    let user = config.users.get(app.store.user.get().id);
                    if (user && user.user().video) {
                        user.videoTopicManager().restartMediaOnKeyFrame([2000, 4000, 8000, 12000]);
                    }
                    let screenShareuser = config.users.get('screenShare');
                    if (screenShareuser
                        && screenShareuser.user().video
                        && config.screenShareInfo.isStarted()
                        && config.screenShareInfo.iAmOwner()
                    ) {
                        screenShareuser.videoTopicManager().restartMediaOnKeyFrame([2000, 4000, 8000, 12000]);
                    }
                    break;

                case 'FREEZED':
                    handlePartnerFreeze(message);
                    break;

                /*case 'STOPALL':
                    if (app.store.messagesCallbacks[uniqueId]) {
                        app.store.messagesCallbacks[uniqueId](jsonMessage);
                    }
                    break;*/

                case 'STOP':
                    if (app.store.messagesCallbacks[uniqueId]) {
                        app.store.messagesCallbacks[uniqueId](message);
                    }
                    break;

                case 'CLOSE':
                    if (app.store.messagesCallbacks[uniqueId]) {
                        app.store.messagesCallbacks[uniqueId](message);
                    }
                    break;

                case 'SESSION_NEW_CREATED':
                    if (app.store.messagesCallbacks[uniqueId]) {
                        app.store.messagesCallbacks[uniqueId](message);
                    }
                    break;

                case 'SESSION_REFRESH':
                    if (app.store.messagesCallbacks[uniqueId]) {
                        app.store.messagesCallbacks[uniqueId](message);
                    }
                    break;

                case 'RECEIVEMETADATA':
                    handleReceivedMetaData(message, uniqueId);
                    break;

                case 'ERROR':
                    publicized.raiseCallError(app.errorHandler.getFilledErrorObject({...errorList.CALL_SERVER_ERROR, replacements:[JSON.stringify(message)]}), null, true);
                    break;

                case 'SEND_SDP_OFFER':
                case 'RECIVE_SDP_OFFER':
                case 'SDP_ANSWER_RECEIVED':
                    break;

                default:
                    console.warn("[SDK][onmessage] Invalid message, id: " + message.id, message);
                    // if (jsonMessage.match(/NOT CREATE SESSION/g)) {
                    //     if (currentCallParams && Object.keys(currentCallParams)) {
                    //         //handleCallSocketOpen(currentCallParams);
                    //         callStateController.createSessionInChat(currentCallParams);
                    //     }
                    // }
                    break;
            }

            app.store.messagesCallbacks[uniqueId] && delete app.store.messagesCallbacks[uniqueId];
        },
        handleParticipantJoin(messageContent) {
            if (Array.isArray(messageContent)) {
                for (let i in messageContent) {
                    let correctedData = {
                        video: messageContent[i].video,
                        mute: messageContent[i].mute,
                        userId: messageContent[i].userId,
                        topicSend: messageContent[i].sendTopic,
                        autoStartStreams: true,
                        callId: config.callId,
                        cameraPaused: false
                    };
                    if (!config.users.get(correctedData.userId)) {
                        new Promise(resolve => {
                            config.users.addItem(correctedData);
                            resolve();
                        }).then(()=>{
                            app.chatEvents.fireEvent('callEvents', {
                                type: 'CALL_DIVS',
                                result: config.users.generateCallUIList()
                            });
                        })
                    } else {
                        config.users.removeItem(correctedData.userId);
                        new Promise(resolve => {
                            config.users.addItem(correctedData);
                            resolve();
                        }).then(()=>{
                            app.chatEvents.fireEvent('callEvents', {
                                type: 'CALL_DIVS',
                                result: config.users.generateCallUIList()
                            });
                        })
                    }
                }
            }

            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANT_JOINED',
                result: messageContent
            });

            if (config.users.get(app.store.user.get().id).video) {
                config.users.get(app.store.user.get().id).videoTopicManager().restartMediaOnKeyFrame(app.store.user().id, [2000, 4000, 8000, 12000, 16000, 24000]);
            }
            if (config.screenShareInfo.isStarted()
                && config.screenShareInfo.iAmOwner()
            ) {
                sendCallMetaData({
                    id: callMetaDataTypes.SCREENSHAREMETADATA,
                    userid: app.store.user.get().id,
                    content: {
                        dimension: {
                            width: config.screenShareInfo.getWidth(),
                            height: config.screenShareInfo.getHeight()
                        }
                    }
                });
                // config.users.get('screenShare').videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000, 16000, 24000]);
            }
        },
        async handleParticipantLeft(messageContent, threadId) {
            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANT_LEFT',
                callId: threadId,
                result: messageContent
            });
            //If I'm the only call participant, stop the call
            if (Object.values(config.users.getAll()).length < 2) {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ENDED',
                    callId: config.callId
                });
                app.callsManager.removeItem(config.callId);
                return;
            }

            if (!!messageContent[0].userId) {
                //console.log("chatMessageVOTypes.LEAVE_CALL: ", messageContent[0].userId, store.user().id)
                if (messageContent[0].userId == app.store.user.get().id) {
                    // await callStop();
                    app.callsManager.removeItem(config.callId);
                } else {
                    await config.users.removeItem(messageContent[0].userId);
                    if (config.screenShareInfo.isStarted() && config.screenShareInfo.getOwner() === messageContent[0].userId) {
                        config.users.removeItem("screenShare")
                    }
                    //callStateController.removeScreenShareFromCall()
                }
            }

        },
        handleParticipantMute(messageContent) {
            if (Array.isArray(messageContent)) {
                for (let i in messageContent) {
                    let user = config.users.get(messageContent[i].userId);
                    if (user) {
                        user.stopAudio();
                    }
                }
            }
            setTimeout(function () {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                });
            });

            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANT_MUTE',
                result: messageContent
            });
        },
        async handleParticipantUnMute(messageContent) {
            if (Array.isArray(messageContent)) {
                for (let i in messageContent) {
                    let user = config.users.get(messageContent[i].userId);
                    if (user) {
                        if(user.audioTopicManager()) {
                            await user.destroyAudio();
                        }
                        setTimeout(()=>{
                            user.startAudio(messageContent[i].sendTopic);
                        }, 50);
                    }
                }
            }
            setTimeout(function () {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                });
            })

            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANT_UNMUTE',
                result: messageContent
            });
        },
        async handleParticipantVideoOn(messageContent) {
            if (Array.isArray(messageContent)) {
                for (let i in messageContent) {
                    let user = config.users.get(messageContent[i].userId);
                    if(user){
                        if(user.audioTopicManager()) {
                            await user.stopVideo();
                        }
                        user.startVideo(messageContent[i].sendTopic);
                    }

                }
            }

            setTimeout(function () {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                });
            })

            app.chatEvents.fireEvent('callEvents', {
                type: 'TURN_ON_VIDEO_CALL',
                result: messageContent
            });
        },
        handleParticipantVideoOff(messageContent) {
            if (Array.isArray(messageContent)) {
                for (let i in messageContent) {
                    let user = config.users.get(messageContent[i].userId);
                    if(user)
                        user.stopVideo();
                }
            }

            setTimeout(function () {
                app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                });
            })

            app.chatEvents.fireEvent('callEvents', {
                type: 'TURN_OFF_VIDEO_CALL',
                result: messageContent
            });
        },
        handleStartScreenShare(messageContent){
            app.sdkParams.consoleLogging && console.log("[sdk][startScreenShare][onResult]: ", messageContent);
            let result = Utility.createReturnData(false, '', 0, messageContent, null)
            if(result.hasError) {
                // endScreenShare({}, null);
                config.users.removeItem("screenShare");
                return;
            }

            let direction = 'send', shareScreen = true;
            config.screenShareInfo.setIsStarted(true);
            config.screenShareInfo.setOwner(messageContent.screenOwner.id);

            if (config.screenShareInfo.isStarted() && !config.screenShareInfo.iAmOwner()) {
                direction = 'receive';
                shareScreen = false;
            }

            if (config.screenShareInfo.isStarted() && config.screenShareInfo.iAmOwner()) {
                let qualityObject = app.call.calculateScreenSize({quality: app.call.sharedVariables.startScreenSharetParams.quality});
                config.screenShareInfo.setWidth(qualityObject.width);
                config.screenShareInfo.setHeight(qualityObject.height);
                sendCallMetaData({
                    id: callMetaDataTypes.SCREENSHAREMETADATA,
                    userid: app.store.user.get().id,
                    content: {
                        dimension: {
                            width: config.screenShareInfo.getWidth(),
                            height: config.screenShareInfo.getHeight()
                        }
                    }
                });
            }

            // callStateController.addScreenShareToCall(direction, shareScreen);

            if(config.screenShareInfo.iAmOwner()){
                setTimeout(()=>{
                    doThings();
                }, 1000)
            } else {
                doThings();
            }
            function doThings(){
                callConfig.screenShareObject.callId = config.callId;
                callConfig.screenShareObject.cameraPaused = false;
                callConfig.screenShareObject.userId = "screenShare";
                config.users.addItem(callConfig.screenShareObject, "screenShare");
                app.chatEvents.fireEvent('callEvents', {
                    type: 'START_SCREEN_SHARE',
                    result: messageContent
                });
            }

        },
        async handleEndScreenShare(messageContent) {
            config.screenShareInfo.setIsStarted(false);
            config.screenShareInfo.setOwner(messageContent.screenOwner.id);
            await config.users.removeItem('screenShare');
            await config.deviceManager.mediaStreams.stopScreenShareInput();

            app.chatEvents.fireEvent('callEvents', {
                type: 'END_SCREEN_SHARE',
                result: messageContent
            });
            app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.users.generateCallUIList()
            });
        },
        onChatConnectionReconnect() {
            return;
            //First count all failed topics
            let ftCount = 0, totalTopics = 0;
            Object.values(config.users.getAll()).forEach(item => {
                if(item.user().video ){
                    totalTopics++;
                    if(item.videoTopicManager().isPeerFailed()){
                        ftCount++;
                    }
                }
                if(!item.user().mute){
                    totalTopics++;
                    if(item.audioTopicManager().isPeerFailed()){
                        ftCount++;
                    }
                }
            });
            //If only some topics are failed
            if(ftCount < totalTopics) {
                Object.values(config.users.getAll()).forEach(item => {
                    if(item.user().video ){
                        totalTopics++;
                        if(item.videoTopicManager().isPeerFailed()){
                            item.reconnectTopic("video");
                        }
                    }
                    if(!item.user().mute){
                        totalTopics++;
                        if(item.audioTopicManager().isPeerFailed()){
                            item.reconnectTopic("audio");
                        }
                    }
                })
            } else {
                //Inquiry the call

            }
        },
        async destroy() {
            await config.deviceManager.mediaStreams.stopAudioInput();
            await config.deviceManager.mediaStreams.stopVideoInput();
            await config.deviceManager.mediaStreams.stopScreenShareInput();
            return callStop()
        }
    }

    setTimeout(()=>{
        startCallWebRTCFunctions(config.callConfig);
    },50)
    return publicized;
}

function ScreenShareStateManager(app) {
    let config = {
        ownerId: 0,
        imOwner: false,
        isStarted: false,
        width: app.call.sharedVariables.callVideoMinWidth,
        height: app.call.sharedVariables.callVideoMinHeight
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
            return config.ownerId === app.store.user.get().id
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
            if (dimension
                && dimension.width && +dimension.width > 0
                && dimension.height && +dimension.height > 0
            ) {
                config.screenShareInfo.setHeight(dimension.height);
                config.screenShareInfo.setWidth(dimension.width);
            } else {
                config.screenShareInfo.setHeight(app.call.sharedVariables.callVideoMinHeight);
                config.screenShareInfo.setWidth(app.call.sharedVariables.callVideoMinWidth);
            }
        }
    }
}


export {CallManager}