/**
 * Type 5    Message Seen
 */
import {messenger} from "../../../messaging.module";
import {chatMessageVOTypes} from "../../constants";
import {sdkParams} from "../../sdkParams";
import {chatEvents} from "../../../events.module";

/**
 * Seen
 *
 * This functions sends seen acknowledge for a message
 *
 * @access private
 *
 * @param {int}   messageId  Id of Message
 *
 * @return {object} Instant sendMessage result
 */
function seen (params) {
    return messenger().sendMessage({
        chatMessageVOType: chatMessageVOTypes.SEEN,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: params.messageId,
        pushMsgType: 3
    });
}

function onSeen(
    {
        threadId, messageContent
    }) {
    let threadObject = {
        id: messageContent.conversationId,
        lastSeenMessageId: messageContent.messageId,
        lastSeenMessageTime: messageContent.messageTime,
        lastParticipantId: messageContent.participantId
    };

    chatEvents.fireEvent('threadEvents', {
        type: 'THREAD_LAST_ACTIVITY_TIME',
        result: {
            thread: threadObject
        }
    });

    chatEvents.fireEvent('messageEvents', {
        type: 'MESSAGE_SEEN',
        result: {
            message: messageContent.messageId,
            threadId: threadId,
            senderId: messageContent.participantId
        }
    });
}

export {seen, onSeen}
