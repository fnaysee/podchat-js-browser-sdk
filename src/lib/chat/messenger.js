import {chatMessageVOTypes} from "../constants";
import {errorList, raiseError} from "../errorHandler";
import {sdkParams} from "../sdkParams";
import DOMPurify from "dompurify";
import Utility from "../../utility/utility";
import {store} from "../store";
import {asyncClient} from "../async/async";

class Messenger {
    constructor() {
        this._chatSendQueue = [];
        this._chatState = false;
    }

    sendChatMessage(params) {
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

        if (sdkParams.typeCodeOwnerId) {
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
                if (DOMPurify.isSupported) {
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
        } else {
            uniqueId = Utility.generateUUID();
        }

        if (Array.isArray(uniqueId)) {
            messageVO.uniqueId = JSON.stringify(uniqueId);
        } else {
            messageVO.uniqueId = uniqueId;
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

        asyncClient().send(data, function (res) {});

        if (sdkParams.asyncRequestTimeout > 0) {}

        return {
            uniqueId: uniqueId,
            threadId: threadId,
            participant: store.user(),
            content: params.content
        };
    }

    /**
     * Chat Send Message Queue Handler
     *
     * Whenever something pushes into cahtSendQueue
     * this function invokes and does the message
     * sending progress throught async
     *
     * @access private
     *
     * @return {undefined}
     */
    _chatSendQueueHandler = function () {
        if (this._chatSendQueue.length) {
            var messageToBeSend = this._chatSendQueue[0];

            /**
             * Getting chatSendQueue from either cache or
             * memory and scrolling through the send queue
             * to send all the messages which are waiting
             * for this._chatState to become TRUE
             *
             * There is a small possibility that a Message
             * wouldn't make it through network, so it Will
             * not reach chat server. To avoid losing those
             * messages, we put a clone of every message
             * in waitQ, and when ack of the message comes,
             * we delete that message from waitQ. otherwise
             * we assume that these messages have been failed to
             * send and keep them to be either canceled or resent
             * by user later. When user calls getHistory(), they
             * will have failed messages alongside with typical
             * messages history.
             */
            if (this._chatState) {
                this._getChatSendQueue(0, function (chatSendQueue) {
                    this._deleteFromChatSentQueue(messageToBeSend,
                         () => {
                            this.sendMessage(messageToBeSend.message, messageToBeSend.callbacks, function () {
                                if (chatSendQueue.length) {
                                    this._chatSendQueueHandler();
                                }
                            });
                        });
                });
            }
        }
    }

    /**
     * Get Chat Send Queue
     *
     * This function returns chat send queue
     *
     * @access private
     *
     * @return {array}  An array of messages on sendQueue
     */
    _getChatSendQueue = function (threadId, callback) {
        if (threadId) {
            var tempSendQueue = [];

            for (var i = 0; i < this._chatSendQueue.length; i++) {
                if (this._chatSendQueue[i].threadId === threadId) {
                    tempSendQueue.push(this._chatSendQueue[i]);
                }
            }
            callback && callback(tempSendQueue);
        } else {
            callback && callback(this._chatSendQueue);
        }
    }

    /**
     * Delete an Item from Chat Send Queue
     *
     * This function gets an item and deletes it
     * from Chat Send Queue
     *
     * @access private
     *
     * @return {undefined}
     */
    _deleteFromChatSentQueue = function (item, callback) {
        for (var i = 0; i < this._chatSendQueue.length; i++) {
            if (this._chatSendQueue[i].message.uniqueId === item.message.uniqueId) {
                this._chatSendQueue.splice(i, 1);
            }
        }
        callback && callback();
    }

    putInMessagesDeliveryQueue = function (threadId, messageId) {
        if (sdkParams.messagesDelivery.hasOwnProperty(threadId)
            && typeof sdkParams.messagesDelivery[threadId] === 'number'
            && !!sdkParams.messagesDelivery[threadId]) {
            if (sdkParams.messagesDelivery[threadId] < messageId) {
                sdkParams.messagesDelivery[threadId] = messageId;
            }
        } else {
            sdkParams.messagesDelivery[threadId] = messageId;
        }
    }

    putInMessagesSeenQueue = function (threadId, messageId) {
        if (sdkParams.messagesSeen.hasOwnProperty(threadId)
            && typeof sdkParams.messagesSeen[threadId] === 'number'
            && !!sdkParams.messagesSeen[threadId]) {
            if (sdkParams.messagesSeen[threadId] < messageId) {
                sdkParams.messagesSeen[threadId] = messageId;
            }
        } else {
            sdkParams.messagesSeen[threadId] = messageId;
        }
    }

    /**
     * Messages Delivery Queue Handler
     *
     * Whenever something pushes into messagesDelivery
     * this function invokes and does the message
     * delivery progress throught async
     *
     * @access private
     *
     * @return {undefined}
     */
    messagesDeliveryQueueHandler = function () {
        if (Object.keys(sdkParams.messagesDelivery).length) {
            if (this._chatState) {
                for (var key in sdkParams.messagesDelivery) {
                    deliver({
                        messageId: sdkParams.messagesDelivery[key]
                    });

                    delete sdkParams.messagesDelivery[key];
                }
            }
        }
    }

    /**
     * Messages Seen Queue Handler
     *
     * Whenever something pushes into messagesSeen
     * this function invokes and does the message
     * seen progress throught async
     *
     * @access private
     *
     * @return {undefined}
     */
    messagesSeenQueueHandler = function () {
        if (Object.keys(sdkParams.messagesSeen).length) {
            if (this._chatState) {
                for (var key in sdkParams.messagesSeen) {
                    seen({
                        messageId: sdkParams.messagesSeen[key]
                    });

                    delete sdkParams.messagesSeen[key];
                }
            }
        }
    }

    handleChatMessage(params) {

    }
}

let messenger = new Messenger()

function sendChatMessage(params){
    return messenger.sendChatMessage(params)
}
function handleChatMessage(params){
    return messenger.handleChatMessage(params)
}


export {sendChatMessage, handleChatMessage}