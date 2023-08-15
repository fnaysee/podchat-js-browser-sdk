import { chatMessageVOTypes } from "./lib/constants"
import DOMPurify from 'dompurify'
import Utility from "./utility/utility"
import {errorList, raiseError} from "./lib/errorHandler";
import {sdkParams} from "./lib/sdkParams";
import {store} from "./lib/store";

let chatMessaging = null;

/**
 * Communicates with chat server
 * @param params
 * @constructor
 */
function ChatMessaging(params) {
    var currentModuleInstance = this,
        asyncClient = params.asyncClient;
        //Utility = params.Utility,
        // consoleLogging = sdkParams.consoleLogging,
        //generalTypeCode = sdkParams.generalTypeCode,
        //chatPingMessageInterval = params.chatPingMessageInterval,
        //asyncRequestTimeout = params.asyncRequestTimeout,
        //messageTtl = params.messageTtl,
        //serverName = params.serverName,
        //msgPriority = params.msgPriority,
        //typeCodeOwnerId = sdkParams.typeCodeOwnerId || null;

    this.threadCallbacks = {};
    this.sendMessageCallbacks = {};
    // this.messagesCallbacks = {};
    // this.asyncRequestTimeouts = {};
    // this.sendPingTimeout = null;
    this.chatState = false;
    this.userInfo = null;

    /**
     * sendPingTimeout removed,
     *
     * TODO: remove the interval when socket statet changes to closed
     */
    this.startChatPing = function () {
        sdkParams.chatPingMessageInterval = setInterval(() => {
            currentModuleInstance.ping();
        }, 20000) ;//TODO: chatPingMessageInterval
    }
    this.stopChatPing = function() {
        clearInterval(sdkParams.chatPingMessageInterval);
    }

        this.asyncInitialized = function (client) {
            asyncClient = client
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
            if(!currentModuleInstance.chatState && chatMessageVOTypes.USER_INFO != params.chatMessageVOType) {
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
                : sdkParams.msgPriority;

            var messageVO = {
                type: params.chatMessageVOType,
                token: sdkParams.token,
                tokenIssuer: 1
            };

            if (params.typeCode || sdkParams.generalTypeCode) {
                messageVO.typeCode = sdkParams.generalTypeCode;//params.typeCode;
            }

            if(sdkParams.typeCodeOwnerId) {
                messageVO.ownerId = sdkParams.typeCodeOwnerId;
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
                if (!store.threadCallbacks[threadId]) {
                    store.threadCallbacks[threadId] = {};
                }

                store.threadCallbacks[threadId][uniqueId] = {};

                store.sendMessageCallbacks[uniqueId] = {};

                if (callbacks.onSent) {
                    store.sendMessageCallbacks[uniqueId].onSent = callbacks.onSent;
                    store.threadCallbacks[threadId][uniqueId].onSent = false;
                    store.threadCallbacks[threadId][uniqueId].uniqueId = uniqueId;
                }

                if (callbacks.onSeen) {
                    store.sendMessageCallbacks[uniqueId].onSeen = callbacks.onSeen;
                    store.threadCallbacks[threadId][uniqueId].onSeen = false;
                }

                if (callbacks.onDeliver) {
                    store.sendMessageCallbacks[uniqueId].onDeliver = callbacks.onDeliver;
                    store.threadCallbacks[threadId][uniqueId].onDeliver = false;
                }

            } else if (callbacks.onResult) {
                store.messagesCallbacks[uniqueId] = callbacks.onResult;
            }
        } else if (typeof callbacks == 'function') {
            store.messagesCallbacks[uniqueId] = callbacks;
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
                    peerName: sdkParams.serverName,
                    priority: asyncPriority,
                    content: JSON.stringify(messageVO),
                    ttl: (params.messageTtl > 0)
                        ? params.messageTtl
                        : sdkParams.messageTtl
                },
                uniqueId: messageVO.uniqueId
            };

            asyncClient.send(data, function (res) {
                if (!res.hasError && callbacks) {
                    if (typeof callbacks == 'function') {
                        callbacks(res);
                    } else if (typeof callbacks == 'object' && typeof callbacks.onResult == 'function') {
                        callbacks.onResult(res);
                    }

                if (store.messagesCallbacks[uniqueId]) {
                    delete store.messagesCallbacks[uniqueId];
                }
            }
        });

        if (sdkParams.asyncRequestTimeout > 0) {
            store.asyncRequestTimeouts[uniqueId] && clearTimeout(store.asyncRequestTimeouts[uniqueId]);
            store.asyncRequestTimeouts[uniqueId] = setTimeout(function () {
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

                if (store.messagesCallbacks[uniqueId]) {
                    delete store.messagesCallbacks[uniqueId];
                }
                if (store.sendMessageCallbacks[uniqueId]) {
                    delete store.sendMessageCallbacks[uniqueId];
                }
                if (!!store.threadCallbacks[threadId] && store.threadCallbacks[threadId][uniqueId]) {
                    store.threadCallbacks[threadId][uniqueId] = {};
                    delete store.threadCallbacks[threadId][uniqueId];
                }

            }, sdkParams.asyncRequestTimeout);
        }

/*          currentModuleInstance.sendPingTimeout && clearTimeout(currentModuleInstance.sendPingTimeout);
        currentModuleInstance.sendPingTimeout = setTimeout(function () {
            currentModuleInstance.ping();
        }, chatPingMessageInterval); */

            recursiveCallback && recursiveCallback();

        return {
            uniqueId: uniqueId,
            threadId: threadId,
            participant: currentModuleInstance.userInfo?.id,// currentModuleInstance.userInfo,
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
    };

}

function initChatMessaging(params) {
    if(!chatMessaging) {
        chatMessaging = new ChatMessaging(params)
    }

    return chatMessaging;
}

function messenger(){
    return chatMessaging;
}
export default ChatMessaging;
export {messenger, initChatMessaging}
