"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _constants = require("../constants");

var _messaging = require("../../messaging.module");

var _utility = _interopRequireDefault(require("../../utility/utility"));

function ReactionsMethods(app) {
  var reactionsListRequestsParams = {};
  var reactionSummariesRequests = {};

  function addReaction(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_REACTION,
      subjectId: params.threadId,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        messageId: params.messageId,
        reaction: params.reaction
      },
      token: app.sdkParams.token
    };
    return app.messenger.sendMessage(sendData);
  }

  function getMyReaction(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_MY_REACTION,
      subjectId: params.threadId,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        messageId: params.messageId
      },
      token: app.sdkParams.token
    };
    return app.messenger.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  }

  function replaceReaction(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REPLACE_REACTION,
      subjectId: params.threadId,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        reactionId: params.reactionId,
        reaction: params.reaction
      },
      token: app.sdkParams.token
    };
    return app.messenger.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  }

  function removeReaction(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_REACTION,
      subjectId: params.threadId,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        reactionId: params.reactionId
      },
      token: app.sdkParams.token
    };
    return app.messenger.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  }

  function getReactionList(_ref) {
    var threadId = _ref.threadId,
        messageId = _ref.messageId,
        _ref$count = _ref.count,
        count = _ref$count === void 0 ? 20 : _ref$count,
        _ref$offset = _ref.offset,
        offset = _ref$offset === void 0 ? 0 : _ref$offset,
        _ref$sticker = _ref.sticker,
        sticker = _ref$sticker === void 0 ? null : _ref$sticker,
        _ref$uniqueId = _ref.uniqueId,
        uniqueId = _ref$uniqueId === void 0 ? null : _ref$uniqueId;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REACTION_LIST,
      subjectId: threadId,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        messageId: messageId,
        count: count,
        offset: offset
      },
      token: app.sdkParams.token,
      uniqueId: uniqueId
    };

    if (sticker && sticker != 'null') {
      sendData.content.sticker = sticker;
    }

    if (!sendData.uniqueId) sendData.uniqueId = _utility["default"].generateUUID();
    reactionsListRequestsParams[sendData.uniqueId] = sendData.content;
    var cachedResult = app.store.reactionsList.getItem(messageId, sticker, count, offset);

    if (cachedResult) {
      cachedResult = JSON.parse(JSON.stringify(cachedResult));
      app.chatEvents.fireEvent('messageEvents', {
        type: 'REACTIONS_LIST',
        uniqueId: sendData.uniqueId,
        messageId: messageId,
        result: cachedResult
      });
    }

    if (!cachedResult) {
      return app.messenger.sendMessage(sendData);
    }
  }

  function getReactionsSummaries(params) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REACTION_COUNT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      token: app.sdkParams.token,
      subjectId: params.threadId,
      uniqueId: params.uniqueId ? params.uniqueId : _utility["default"].generateUUID()
    },
        cachedIds = app.store.reactionSummaries.filterExists(params.messageIds);
    reactionSummariesRequests[sendData.uniqueId] = params.messageIds;
    var difference = params.messageIds.reduce(function (result, element) {
      if (cachedIds.indexOf(element) === -1) {
        result.push(element);
      }

      return result;
    }, []);

    if (difference.length) {
      sendData.content = difference;
      var res = app.messenger.sendMessage(sendData);
    }

    if (cachedIds && cachedIds.length) {
      setTimeout(function () {
        var messageContent = app.store.reactionSummaries.getMany(cachedIds);
        messageContent = JSON.parse(JSON.stringify(messageContent));
        app.chatEvents.fireEvent('messageEvents', {
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
    var msgContent = JSON.parse(JSON.stringify(messageContent));
    app.store.reactionSummaries.addMany(messageContent);

    if (reactionSummariesRequests[uniqueId] && reactionSummariesRequests[uniqueId].length) {
      reactionSummariesRequests[uniqueId].forEach(function (item) {
        app.store.reactionSummaries.initItem(item, {});
      });
    } // params.messageIds.forEach(item=>{
    //     store.reactionSummaries.initItem(item, {});
    // });


    app.chatEvents.fireEvent('messageEvents', {
      type: 'REACTION_SUMMARIES',
      uniqueId: uniqueId,
      result: msgContent
    });
  }

  function onReactionList(uniqueId, messageContent) {
    if (!reactionsListRequestsParams[uniqueId]) {
      return;
    }

    var rq = reactionsListRequestsParams[uniqueId];
    app.store.reactionsList.save(reactionsListRequestsParams[uniqueId], messageContent);
    var cachedResult = app.store.reactionsList.getItem(rq.messageId, rq.sticker, rq.count, rq.offset);

    if (cachedResult) {
      cachedResult = JSON.parse(JSON.stringify(cachedResult));
    }

    app.chatEvents.fireEvent('messageEvents', {
      type: 'REACTIONS_LIST',
      uniqueId: uniqueId,
      messageId: rq.messageId,
      result: cachedResult
    });
    delete reactionsListRequestsParams[uniqueId];
  }

  function onRemoveReaction(uniqueId, messageContent, contentCount) {
    if (app.store.messagesCallbacks[uniqueId]) {
      app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    app.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    if (app.store.user.get().isMe(messageContent.reactionVO.participantVO.id)) app.store.reactionSummaries.removeMyReaction(messageContent.messageId);
    app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction); // app.store.reactionsList.removeReactionCache(messageContent.messageId, messageContent.reactionVO.reaction);

    app.chatEvents.fireEvent('messageEvents', {
      type: 'REMOVE_REACTION',
      result: messageContent
    });
  }

  function onReplaceReaction(uniqueId, messageContent, contentCount) {
    if (app.store.messagesCallbacks[uniqueId]) {
      app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    app.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.oldSticker);
    app.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    app.store.reactionSummaries.maybeUpdateMyReaction(messageContent.messageId, messageContent.reactionVO.id, messageContent.reactionVO.reaction, messageContent.reactionVO.participantVO.id, messageContent.reactionVO.time);
    app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.oldSticker);
    app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction);
    app.chatEvents.fireEvent('messageEvents', {
      type: 'REPLACE_REACTION',
      result: messageContent
    });
  }

  function onAddReaction(uniqueId, messageContent, contentCount) {
    if (app.store.messagesCallbacks[uniqueId]) {
      app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    var msgContent = JSON.parse(JSON.stringify(messageContent));
    app.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    app.store.reactionSummaries.maybeUpdateMyReaction(messageContent.messageId, messageContent.reactionVO.id, messageContent.reactionVO.reaction, messageContent.reactionVO.participantVO.id, messageContent.reactionVO.time);
    app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction);
    app.chatEvents.fireEvent('messageEvents', {
      type: 'ADD_REACTION',
      result: msgContent
    });
  }

  return {
    getReactionsSummaries: getReactionsSummaries,
    getReactionList: getReactionList,
    removeReaction: removeReaction,
    replaceReaction: replaceReaction,
    getMyReaction: getMyReaction,
    addReaction: addReaction,
    onReactionSummaries: onReactionSummaries,
    onReactionList: onReactionList,
    onRemoveReaction: onRemoveReaction,
    onReplaceReaction: onReplaceReaction,
    onAddReaction: onAddReaction
  };
}

var _default = ReactionsMethods;
exports["default"] = _default;