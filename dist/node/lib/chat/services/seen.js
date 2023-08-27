"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onSeen = onSeen;
exports.seen = seen;

var _messaging = require("../../../messaging.module");

var _constants = require("../../constants");

var _sdkParams = require("../../sdkParams");

var _events = require("../../../events.module");

/**
 * Type 5    Message Seen
 */

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
function seen(params) {
  return (0, _messaging.messenger)().sendMessage({
    chatMessageVOType: _constants.chatMessageVOTypes.SEEN,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: params.messageId,
    pushMsgType: 3
  });
}

function onSeen(_ref) {
  var threadId = _ref.threadId,
      messageContent = _ref.messageContent;
  var threadObject = {
    id: messageContent.conversationId,
    lastSeenMessageId: messageContent.messageId,
    lastSeenMessageTime: messageContent.messageTime,
    lastParticipantId: messageContent.participantId
  };

  _events.chatEvents.fireEvent('threadEvents', {
    type: 'THREAD_LAST_ACTIVITY_TIME',
    result: {
      thread: threadObject
    }
  });

  _events.chatEvents.fireEvent('messageEvents', {
    type: 'MESSAGE_SEEN',
    result: {
      message: messageContent.messageId,
      threadId: threadId,
      senderId: messageContent.participantId
    }
  });
}