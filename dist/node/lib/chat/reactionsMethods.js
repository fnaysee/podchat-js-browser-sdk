"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addReaction = addReaction;
exports.getMyReaction = getMyReaction;
exports.getReactionList = getReactionList;
exports.getReactionsSummaries = getReactionsSummaries;
exports.onAddReaction = onAddReaction;
exports.onReactionSummaries = onReactionSummaries;
exports.onRemoveReaction = onRemoveReaction;
exports.onReplaceReaction = onReplaceReaction;
exports.removeReaction = removeReaction;
exports.replaceReaction = replaceReaction;

var _constants = require("../constants");

var _sdkParams = require("../sdkParams");

var _messaging = require("../../messaging.module");

var _store = require("../store");

var _utility = _interopRequireDefault(require("../../utility/utility"));

var _events = require("../../events.module");

function addReaction(params, callback) {
  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.ADD_REACTION,
    subjectId: params.threadId,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {
      messageId: params.messageId,
      reaction: params.reaction
    },
    token: _sdkParams.sdkParams.token
  };
  return (0, _messaging.messenger)().sendMessage(sendData);
}

;

function getMyReaction(params, callback) {
  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.GET_MY_REACTION,
    subjectId: params.threadId,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {
      messageId: params.messageId
    },
    token: _sdkParams.sdkParams.token
  };
  return (0, _messaging.messenger)().sendMessage(sendData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

;

function replaceReaction(params, callback) {
  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.REPLACE_REACTION,
    subjectId: params.threadId,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {
      reactionId: params.reactionId,
      reaction: params.reaction
    },
    token: _sdkParams.sdkParams.token
  };
  return (0, _messaging.messenger)().sendMessage(sendData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

;

function removeReaction(params, callback) {
  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_REACTION,
    subjectId: params.threadId,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {
      reactionId: params.reactionId
    },
    token: _sdkParams.sdkParams.token
  };
  return (0, _messaging.messenger)().sendMessage(sendData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

;

function getReactionList(params, callback) {
  var count = 20,
      offset = 0;

  if (params) {
    if (parseInt(params.count) > 0) {
      count = params.count;
    }

    if (parseInt(params.offset) > 0) {
      offset = params.offset;
    }
  }

  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.REACTION_LIST,
    subjectId: params.threadId,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {
      sticker: params.sticker,
      messageId: params.messageId,
      count: count,
      offset: offset
    },
    token: _sdkParams.sdkParams.token
  };
  return (0, _messaging.messenger)().sendMessage(sendData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

;

function getReactionsSummaries(params) {
  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.REACTION_COUNT,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    token: _sdkParams.sdkParams.token,
    subjectId: params.threadId,
    uniqueId: _utility["default"].generateUUID()
  },
      cachedIds = _store.store.reactionSummaries.filterExists(params.messageIds);

  params.messageIds.forEach(function (item) {
    _store.store.reactionSummaries.initItem(item, {});
  });
  var difference = params.messageIds.reduce(function (result, element) {
    if (cachedIds.indexOf(element) === -1) {
      result.push(element);
    }

    return result;
  }, []);

  if (difference.length) {
    sendData.content = difference;
    var res = (0, _messaging.messenger)().sendMessage(sendData); // reactionSummariesRequest = {
    //     uniqueId: sendData.uniqueId,
    //     difference
    // };
  }

  if (cachedIds && cachedIds.length) {
    setTimeout(function () {
      var messageContent = _store.store.reactionSummaries.getMany(cachedIds);

      _events.chatEvents.fireEvent('messageEvents', {
        type: 'REACTION_SUMMARIES',
        uniqueId: sendData.uniqueId,
        result: messageContent
      });
    }, 100);
  }

  return {
    uniqueId: sendData.uniqueId
  };
}

function onReactionSummaries(uniqueId, messageContent) {
  _store.store.reactionSummaries.addMany(messageContent); // reactionSummariesRequest.difference.forEach(item => {
  //     if(!store.reactionsSummaries.messageExists(item)) {
  //         store.reactionsSummaries.addItem(item, {})
  //     }
  // })


  _events.chatEvents.fireEvent('messageEvents', {
    type: 'REACTION_SUMMARIES',
    uniqueId: uniqueId,
    result: messageContent
  });
}

function onRemoveReaction(uniqueId, messageContent, contentCount) {
  if (_store.store.messagesCallbacks[uniqueId]) {
    _store.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
  }

  _store.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.reactionVO.reaction);

  if (_store.store.user().isMe(messageContent.reactionVO.participantVO.id)) _store.store.reactionSummaries.removeMyReaction(messageContent.messageId);

  _events.chatEvents.fireEvent('messageEvents', {
    type: 'REMOVE_REACTION',
    result: messageContent
  });
}

function onReplaceReaction(uniqueId, messageContent, contentCount) {
  if (_store.store.messagesCallbacks[uniqueId]) {
    _store.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
  }

  _store.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.oldSticker);

  _store.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);

  _store.store.reactionSummaries.maybeUpdateMyReaction(messageContent.messageId, messageContent.reactionVO.id, messageContent.reactionVO.reaction, messageContent.reactionVO.participantVO.id, messageContent.reactionVO.time);

  _events.chatEvents.fireEvent('messageEvents', {
    type: 'REPLACE_REACTION',
    result: messageContent
  });
}

function onAddReaction(uniqueId, messageContent, contentCount) {
  if (_store.store.messagesCallbacks[uniqueId]) {
    _store.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
  }

  _store.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);

  if (_store.store.user().isMe(messageContent.reactionVO.participantVO.id)) _store.store.reactionSummaries.addMyReaction(messageContent.messageId);

  _events.chatEvents.fireEvent('messageEvents', {
    type: 'ADD_REACTION',
    result: messageContent
  });
}