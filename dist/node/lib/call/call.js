"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _sharedData = _interopRequireDefault(require("./sharedData"));

function Call(app) {
  var call = {};
  var sharedData = new _sharedData["default"](app);
  call.currentCall = sharedData.currentCall;
  call.callStopQueue = sharedData.callStopQueue;
  call.calculateScreenSize = sharedData.calculateScreenSize;
  call.sharedVariables = sharedData.sharedVariables;
  call.callClientType = sharedData.callClientType;
  call.callTypes = sharedData.callTypes;
  call.joinCallParams = sharedData.joinCallParams;
  call.endScreenShare = sharedData.endScreenShare;
  call.currentCall = sharedData.currentCall;
  call.endCall = sharedData.endCall;
  call.audioCtx = sharedData.audioCtx;
  return call;
}

var _default = Call;
exports["default"] = _default;