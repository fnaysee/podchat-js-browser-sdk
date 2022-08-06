"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.raiseError = exports.init = exports.errorList = exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = require("../events.module");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var errorList = {
  INVALID_CALLID: {
    code: 12000,
    message: "[SDK] Call not started or invalid callId"
  },

  /**
   * 12400-12499 Media devices
   */
  VIDEO_PERMISSION_ERROR: {
    code: 12400,
    message: "Could not grant video input permission"
  },
  AUDIO_PERMISSION_ERROR: {
    code: 12401,
    message: "Could not grant audio input permission"
  },
  AUDIO_OUT_PERMISSION_ERROR: {
    code: 12402,
    message: "Could not grant audio out permission"
  },
  MEDIA_DEVICES_NOT_SUPPORTED: {
    code: 12403,
    message: "Current environment does not supports user media devices"
  },
  SCREENSHARE_PERMISSION_ERROR: {
    code: 12404,
    message: "Could not grant screen share permission"
  },

  /**
   * 12550-12570 ScreenShare
   */
  SCREENSHARE_NOT_STARTED: {
    code: 12550,
    message: "ScreenShare not started "
  },
  NOT_SCREENSHARE_OWNER: {
    code: 12551,
    message: "You are not ScreenShare owner"
  },
  SCREENSHARE_ALREADY_STARTED: {
    code: 12552,
    message: "ScreenShare already started "
  },

  /**
   * 12700-12720 Call stickers
   */
  INVALID_STICKER_NAME: {
    code: 12700,
    message: "[SDK] Invalid sticker name. Use SDK.callStickerTypes"
  }
};
exports.errorList = errorList;
var messagingModule;

var init = function init(params) {
  messagingModule = params.chatMessaging;
};

exports.init = init;

var handleError = function handleError(error) {
  var item = Object.values(errorList).filter(function (item) {
    return item.code == error;
  });
  if (!item.length) return {};
  return item[0];
};

var raiseError = function raiseError(errorObject, callback) {
  var firEvent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var _ref = arguments.length > 3 ? arguments[3] : undefined,
      _ref$eventName = _ref.eventName,
      eventName = _ref$eventName === void 0 ? 'error' : _ref$eventName,
      _ref$eventType = _ref.eventType,
      eventType = _ref$eventType === void 0 ? null : _ref$eventType,
      _ref$environmentDetai = _ref.environmentDetails,
      environmentDetails = _ref$environmentDetai === void 0 ? null : _ref$environmentDetai;

  callback && callback({
    hasError: true,
    errorCode: errorObject.code,
    errorMessage: errorObject.message
  });
  firEvent && _events.chatEvents.fireEvent(eventName, {
    type: eventType,
    code: errorObject.code,
    message: errorObject.message,
    environmentDetails: environmentDetails
  });
  return _objectSpread({
    hasError: true
  }, errorObject);
};

exports.raiseError = raiseError;
var _default = handleError;
exports["default"] = _default;