"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _constants = require("../constants");

var _utility = _interopRequireDefault(require("../../utility/utility"));

function ThreadMethods(app) {
  function getPinMessages(params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_PIN_MESSAGE,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      token: app.sdkParams.token,
      content: params.content
    };

    if (!params.uniqueId) {
      sendData.uniqueId = _utility["default"].generateUUID();
    }

    if (!params.content || !params.content.length) {
      return;
    }

    params.content.forEach(function (item) {
      var thread = app.store.threads.findOrCreate({
        id: item
      });
    });
    app.store.threads.getPinMessages(params.content);
    return app.messenger.sendMessage(sendData); //     onResult: function (result) {
    //
    //         callback && callback(result);
    //     }
    // });
  }

  function onGetPinMessages(uniqueId, messageContent, contentCount) {
    app.chatEvents.fireEvent('threadEvents', {
      type: 'GET_PIN_MESSAGES',
      result: messageContent,
      uniqueId: uniqueId
    }); // if (app.store.messagesCallbacks[uniqueId]) {
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