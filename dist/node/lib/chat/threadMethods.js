"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _constants = require("../constants");

var _utility = _interopRequireDefault(require("../../utility/utility"));

function ThreadMethods(app) {
  var pinMessageRequests = {};

  function getPinMessages(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_PIN_MESSAGE,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      token: app.sdkParams.token // content: params.content

    };

    if (!params.uniqueId) {
      sendData.uniqueId = _utility["default"].generateUUID();
    }

    if (!params.content || !params.content.length) {
      return;
    }

    var mustRequestIds = [],
        existingItems = [];
    params.content.forEach(function (item) {
      var thread = app.store.threads.findOrCreate({
        id: item
      });

      if (!thread.isPinMessageRequested() && !thread.pinMessageVO) {
        mustRequestIds.push(item);
      } else if (thread.pinMessageVO) {
        existingItems.push(JSON.parse(JSON.stringify({
          id: thread.id,
          pinMessageVO: thread.pinMessageVO
        })));
      }
    });

    if (existingItems.length) {
      app.chatEvents.fireEvent('threadEvents', {
        type: 'GET_PIN_MESSAGES',
        result: existingItems,
        uniqueId: sendData.uniqueId
      });
    }

    if (mustRequestIds.length) {
      pinMessageRequests[sendData.uniqueId] = mustRequestIds;
      return app.messenger.sendMessage(sendData);
    } //     onResult: function (result) {
    //
    //         callback && callback(result);
    //     }
    // });

  }

  function onGetPinMessages(uniqueId, messageContent, contentCount) {
    if (pinMessageRequests[uniqueId]) {
      var result = [];
      pinMessageRequests[uniqueId].forEach(function (it) {
        var th = app.store.threads.findOrCreate({
          id: it.id
        });
        var serverResult = messageContent.length && messageContent.find(function (item) {
          return item.id == th.id;
        });

        if (serverResult) {
          th.pinMessage.setPinMessage(serverResult.pinMessageVO);
          result.push(JSON.parse(JSON.stringify({
            id: th.id,
            pinMessageVO: serverResult.pinMessageVO
          })));
        }

        th.pinMessage.setPinMessageRequested(true);
      });
      app.chatEvents.fireEvent('threadEvents', {
        type: 'GET_PIN_MESSAGES',
        result: result,
        uniqueId: uniqueId
      });
    } // if (app.store.messagesCallbacks[uniqueId]) {
    //     app.store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    // }

  }

  return {
    getPinMessages: getPinMessages,
    onGetPinMessages: onGetPinMessages
  };
}

var _default = ThreadMethods;
exports["default"] = _default;