import { chatMessageVOTypes } from "./lib/constants"
import DOMPurify from 'dompurify'
import Utility from "./utility/utility"
import {errorList, raiseError} from "./lib/errorHandler";
// (function () {
    /**
     * Communicates with chat server
     * @param params
     * @constructor
     */
    function ChatMessaging(params) {

        var currentModuleInstance = this,
            asyncClient = params.asyncClient,
            //Utility = params.Utility,
            consoleLogging = params.consoleLogging,
            generalTypeCode = params.generalTypeCode,
            chatPingMessageInterval = params.chatPingMessageInterval,
            asyncRequestTimeout = params.asyncRequestTimeout,
            messageTtl = params.messageTtl,
            serverName = params.serverName,
            msgPriority = params.msgPriority,
            typeCodeOwnerId = params.typeCodeOwnerId || null,
            token = params.token;

        this.threadCallbacks = {};
        this.sendMessageCallbacks = {};
        this.messagesCallbacks = {};
        this.asyncRequestTimeouts = {};
        // this.sendPingTimeout = null;
        this.chatState = false;
        this.userInfo = null;

        /**
         * sendPingTimeout removed,
         *
         * TODO: remove the interval when socket statet changes to closed
         */
        this.startChatPing = function () {
            chatPingMessageInterval = setInterval(() => {
                currentModuleInstance.ping();
            }, 20000) ;//TODO: chatPingMessageInterval
        }
        this.stopChatPing = function() {
            clearInterval(chatPingMessageInterval);
        }

        this.asyncInitialized = function (client) {
            asyncClient = client
        }

        this.updateToken = function (newToken) {
            token = newToken;
        }

        /**
         * Send Message
         *
         * All socket messages go through this function
         *
         * @access private
         *
         * @param {string}    token           SSO Token of current user
         * @param {string}    tokenIssuer     Issuer of token (default : 1)
         * @param {int}       type            Type of message (object : chatMessageVOTypes)
         * @param {string}    typeCode        Type of contact who is going to receive the message
         * @param {int}       messageType     Type of Message, in order to filter messages
         * @param {long}      subjectId       Id of chat thread
         * @param {string}    uniqueId        Tracker id for client
         * @param {string}    content         Content of message
         * @param {long}      time            Time of message, filled by chat server
         * @param {string}    medadata        Metadata for message (Will use when needed)
         * @param {string}    systemMedadata  Metadata for message (To be Set by client)
         * @param {long}      repliedTo       Id of message to reply to (Should be filled by client)
         * @param {function}  callback        The callback function to run after
         *
         * @return {object} Instant Function Return
         */
        this.sendMessage = function (params, callbacks, recursiveCallback) {
            if(!currentModuleInstance.chatState) {
                let clbck;
                if(!callbacks) {
                    clbck = null;
                } else if(typeof callbacks === "function") {
                    clbck = callbacks;
                } else if(callbacks.onResult) {
                    clbck = callbacks.onResult;
                }
                raiseError(errorList.SOCKET_NOT_CONNECTED, clbck, true, {});
                return;
            }

            /**
             * + ChatMessage        {object}
             *    - token           {string}
             *    - tokenIssuer     {string}
             *    - type            {int}
             *    - typeCode        {string}
             *    - messageType     {int}
             *    - subjectId       {int}
             *    - uniqueId        {string}
             *    - content         {string}
             *    - time            {int}
             *    - medadata        {string}
             *    - systemMedadata  {string}
             *    - repliedTo       {int}
             */
            var threadId = null;

            var asyncPriority = (params.asyncPriority > 0)
                ? params.asyncPriority
                : msgPriority;

            var messageVO = {
                type: params.chatMessageVOType,
                token: token,
                tokenIssuer: 1
            };

            if (params.typeCode || generalTypeCode) {
                messageVO.typeCode = generalTypeCode;//params.typeCode;
            }

            /*if (params.typeCode) {
                messageVO.typeCode = params.typeCode;
            } else if (generalTypeCode) {
                messageVO.typeCode = generalTypeCode;
            }*/

            if(typeCodeOwnerId) {
                messageVO.ownerId = typeCodeOwnerId;
            }

            if (params.messageType) {
                messageVO.messageType = params.messageType;
            }

            if (params.subjectId) {
                threadId = params.subjectId;
                messageVO.subjectId = params.subjectId;
            }

            if (params.content) {
                if (typeof params.content == 'object') {
                    messageVO.content = JSON.stringify(params.content);
                } else {
                    messageVO.content = params.content;
                    if(DOMPurify.isSupported) {
                        messageVO.content = DOMPurify.sanitize(messageVO.content, {ALLOWED_TAGS: []});
                    }
                }
            }

            if (params.metadata) {
                messageVO.metadata = params.metadata;
            }

            if (params.systemMetadata) {
                messageVO.systemMetadata = params.systemMetadata;
            }

            if (params.repliedTo) {
                messageVO.repliedTo = params.repliedTo;
            }

            var uniqueId;

            if (typeof params.uniqueId != 'undefined') {
                uniqueId = params.uniqueId;
            } else if (params.chatMessageVOType !== chatMessageVOTypes.PING) {
                uniqueId = Utility.generateUUID();
            }

            if (Array.isArray(uniqueId)) {
                messageVO.uniqueId = JSON.stringify(uniqueId);
            } else {
                messageVO.uniqueId = uniqueId;
            }

            if (typeof callbacks == 'object') {
                if (callbacks.onSeen || callbacks.onDeliver || callbacks.onSent) {
                    if (!currentModuleInstance.threadCallbacks[threadId]) {
                        currentModuleInstance.threadCallbacks[threadId] = {};
                    }

                    currentModuleInstance.threadCallbacks[threadId][uniqueId] = {};

                    currentModuleInstance.sendMessageCallbacks[uniqueId] = {};

                    if (callbacks.onSent) {
                        currentModuleInstance.sendMessageCallbacks[uniqueId].onSent = callbacks.onSent;
                        currentModuleInstance.threadCallbacks[threadId][uniqueId].onSent = false;
                        currentModuleInstance.threadCallbacks[threadId][uniqueId].uniqueId = uniqueId;
                    }

                    if (callbacks.onSeen) {
                        currentModuleInstance.sendMessageCallbacks[uniqueId].onSeen = callbacks.onSeen;
                        currentModuleInstance.threadCallbacks[threadId][uniqueId].onSeen = false;
                    }

                    if (callbacks.onDeliver) {
                        currentModuleInstance.sendMessageCallbacks[uniqueId].onDeliver = callbacks.onDeliver;
                        currentModuleInstance.threadCallbacks[threadId][uniqueId].onDeliver = false;
                    }

                } else if (callbacks.onResult) {
                    currentModuleInstance.messagesCallbacks[uniqueId] = callbacks.onResult;
                }
            } else if (typeof callbacks == 'function') {
                currentModuleInstance.messagesCallbacks[uniqueId] = callbacks;
            }

            /**
             * Message to send through async SDK
             *
             * + MessageWrapperVO  {object}
             *    - type           {int}       Type of ASYNC message based on content
             *    + content        {string}
             *       -peerName     {string}    Name of receiver Peer
             *       -receivers[]  {int}      Array of receiver peer ids (if you use this, peerName will be ignored)
             *       -priority     {int}       Priority of message 1-10, lower has more priority
             *       -messageId    {int}      Id of message on your side, not required
             *       -ttl          {int}      Time to live for message in milliseconds
             *       -content      {string}    Chat Message goes here after stringifying
             *    - trackId        {int}      Tracker id of message that you receive from DIRANA previously (if you are replying a sync message)
             */

            var data = {
                type: (parseInt(params.pushMsgType) > 0)
                    ? params.pushMsgType
                    : 3,
                content: {
                    peerName: serverName,
                    priority: asyncPriority,
                    content: JSON.stringify(messageVO),
                    ttl: (params.messageTtl > 0)
                        ? params.messageTtl
                        : messageTtl
                }
            };

            asyncClient.send(data, function (res) {
                if (!res.hasError && callbacks) {
                    if (typeof callbacks == 'function') {
                        callbacks(res);
                    } else if (typeof callbacks == 'object' && typeof callbacks.onResult == 'function') {
                        callbacks.onResult(res);
                    }

                    if (currentModuleInstance.messagesCallbacks[uniqueId]) {
                        delete currentModuleInstance.messagesCallbacks[uniqueId];
                    }
                }
            });

            if (asyncRequestTimeout > 0) {
                currentModuleInstance.asyncRequestTimeouts[uniqueId] && clearTimeout(currentModuleInstance.asyncRequestTimeouts[uniqueId]);
                currentModuleInstance.asyncRequestTimeouts[uniqueId] = setTimeout(function () {
                    if (typeof callbacks == 'function') {
                        callbacks({
                            hasError: true,
                            errorCode: 408,
                            errorMessage: 'Async Request Timed Out!'
                        });
                    } else if (typeof callbacks == 'object' && typeof callbacks.onResult == 'function') {
                        callbacks.onResult({
                            hasError: true,
                            errorCode: 408,
                            errorMessage: 'Async Request Timed Out!'
                        });
                    }

                    if (currentModuleInstance.messagesCallbacks[uniqueId]) {
                        delete currentModuleInstance.messagesCallbacks[uniqueId];
                    }
                    if (currentModuleInstance.sendMessageCallbacks[uniqueId]) {
                        delete currentModuleInstance.sendMessageCallbacks[uniqueId];
                    }
                    if (!!currentModuleInstance.threadCallbacks[threadId] && currentModuleInstance.threadCallbacks[threadId][uniqueId]) {
                        currentModuleInstance.threadCallbacks[threadId][uniqueId] = {};
                        delete currentModuleInstance.threadCallbacks[threadId][uniqueId];
                    }

                }, asyncRequestTimeout);
            }

/*          currentModuleInstance.sendPingTimeout && clearTimeout(currentModuleInstance.sendPingTimeout);
            currentModuleInstance.sendPingTimeout = setTimeout(function () {
                currentModuleInstance.ping();
            }, chatPingMessageInterval); */

            recursiveCallback && recursiveCallback();

            return {
                uniqueId: uniqueId,
                threadId: threadId,
                participant: currentModuleInstance.userInfo,
                content: params.content
            };
        }

        /**
         * Ping
         *
         * This Function sends ping message to keep user connected to
         * chat server and updates its status
         *
         * @access private
         *
         * @return {undefined}
         */
        this.ping = function () {
            if (currentModuleInstance.chatState && typeof currentModuleInstance.userInfo !== 'undefined') {
                /**
                 * Ping messages should be sent ASAP, because
                 * we don't want to wait for send queue, we send them
                 * right through async from here
                 */
                currentModuleInstance.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.PING,
                    pushMsgType: 3
                });
            }
            /*else {
                currentModuleInstance.sendPingTimeout && clearTimeout(currentModuleInstance.sendPingTimeout);
            }*/
        };

    }

    // if (typeof module !== 'undefined' && typeof module.exports != 'undefined') {
    //     module.exports = ChatMessaging;
    // } else {
    //     if (!window.POD) {
    //         window.POD = {};
    //     }
    //     window.POD.ChatMessaging = ChatMessaging;
    // }
// })();
export default ChatMessaging;
