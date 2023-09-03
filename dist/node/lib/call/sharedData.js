"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateScreenSize = calculateScreenSize;
exports.callTypes = exports.callStopQueue = exports.callClientType = void 0;
exports.currentCall = currentCall;
exports.currentCallMyUser = currentCallMyUser;
exports.endCall = endCall;
exports.endScreenShare = endScreenShare;
exports.sharedVariables = exports.joinCallParams = void 0;

var _sdkParams = require("../sdkParams");

var _errorHandler = require("../errorHandler");

var _constants = require("../constants");

var _events = require("../../events.module");

var _messaging = require("../../messaging.module");

var _callsList = require("./callsList");

var _store = require("../store");

var callStopQueue = {
  callStarted: false
},
    callClientType = {
  WEB: 1,
  ANDROID: 2,
  DESKTOP: 3
},
    callTypes = {
  'VOICE': 0x0,
  'VIDEO': 0x1
},
    joinCallParams = {
  cameraPaused: false
};
exports.joinCallParams = joinCallParams;
exports.callTypes = callTypes;
exports.callClientType = callClientType;
exports.callStopQueue = callStopQueue;
var sharedVariables = {
  globalCallRequestTimeout: null,
  callTurnIp: null,
  useInternalTurnAddress: null,
  callDivId: null,
  callAudioTagClassName: null,
  callVideoTagClassName: null,
  callVideoMinWidth: null,
  callVideoMinHeight: null,
  requestedCallId: null,
  acceptedCallId: null,
  currentCallId: null,
  callNoAnswerTimeout: null,
  callStreamCloseTimeout: null,
  asyncClient: null,
  callOptions: null,
  startScreenSharetParams: {
    quality: 3
  },
  deviceManager: null
};
exports.sharedVariables = sharedVariables;

function endCall(params, callback) {
  _sdkParams.sdkParams.consoleLogging && console.log('[SDK][endCall] called...');
  var endCallData = {
    chatMessageVOType: _constants.chatMessageVOTypes.END_CALL_REQUEST,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    pushMsgType: 3,
    token: _sdkParams.sdkParams.token
  };

  if (params) {
    if (typeof +params.callId === 'number' && params.callId > 0) {
      endCallData.subjectId = +params.callId;
    } else {
      (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }
  } else {
    _events.chatEvents.fireEvent('error', {
      code: 999,
      message: 'No params have been sent to End the call!'
    });

    return;
  }

  return (0, _messaging.messenger)().sendMessage(endCallData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

function endScreenShare(params, callback) {
  var cCall = (0, _callsList.callsManager)().get((0, _callsList.callsManager)().currentCallId);

  if (!cCall) {
    (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
    return;
  }

  var sendData = {
    chatMessageVOType: _constants.chatMessageVOTypes.END_SCREEN_SHARE,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    pushMsgType: 3,
    token: _sdkParams.sdkParams.token,
    subjectId: (0, _callsList.callsManager)().currentCallId
  };

  if (!sendData.subjectId) {
    cCall.raiseCallError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
    return;
  }

  if (!cCall.screenShareInfo.isStarted()) {
    cCall.raiseCallError(_errorHandler.errorList.SCREENSHARE_NOT_STARTED, callback, true);
    return;
  } else {
    cCall.users().removeItem("screenShare");
  }

  if (!cCall.screenShareInfo.iAmOwner()) {
    cCall.raiseCallError(_errorHandler.errorList.NOT_SCREENSHARE_OWNER, callback, true);
    return;
  }

  return (0, _messaging.messenger)().sendMessage(sendData, {
    onResult: function onResult(result) {
      callback && callback(result);
    }
  });
}

function calculateScreenSize(_ref) {
  var _ref$quality = _ref.quality,
      quality = _ref$quality === void 0 ? 3 : _ref$quality;
  var screenSize = window.screen,
      qualities = [{
    width: Math.round(screenSize.width / 3),
    height: Math.round(window.screen.height / 3)
  }, {
    width: Math.round(screenSize.width / 2),
    height: Math.round(screenSize.height / 2)
  }, {
    width: screenSize.width,
    height: screenSize.height
  }, {
    width: Math.round(screenSize.width * 1.6),
    height: Math.round(screenSize.height * 1.6)
  }],
      selectedQuality = quality ? +quality - 1 : 3,
      qualityObj = qualities[selectedQuality];
  return qualityObj;
}

function currentCall() {
  return (0, _callsList.callsManager)().get((0, _callsList.callsManager)().currentCallId);
}

function currentCallMyUser() {
  return currentCall().users().get(_store.store.user().id);
}