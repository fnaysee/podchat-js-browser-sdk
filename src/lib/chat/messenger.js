import {sdkParams} from "../sdkParams";
import DOMPurify from "dompurify";
import Utility from "../../utility/utility";
import {store} from "../store";
import {async} from "../async/async";

class Messenger {
    constructor() {}

    sendMessage(params) {
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
        let threadId = null,
            asyncPriority = (params.asyncPriority > 0)
                ? params.asyncPriority
                : sdkParams.msgPriority,
            messageVO = {
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

        let uniqueId;

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

        async().send(data);

        if (sdkParams.asyncRequestTimeout > 0) {}

        return {
            uniqueId: uniqueId,
            threadId: threadId,
            participant: store.user(),
            content: params.content
        };
    }

    processChatMessage() {

    }
}

let messenger = new Messenger()



export {messenger}