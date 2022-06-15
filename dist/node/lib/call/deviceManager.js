"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

require("../constants.js");

var _eventsModule = require("../../events.module.js");

var _errorHandler = _interopRequireDefault(require("../errorHandler.js"));

var deviceList = {
  audioIn: [],
  audioOut: [],
  videoIn: []
};
var deviceStreams = {
  videoIn: null,
  audioIn: null,
  audioOut: null
};
var _mediaStreams = {
  setAudioInput: function setAudioInput(stream) {
    deviceStreams.audioIn = stream;
  },
  setVideoInput: function setVideoInput(stream) {
    deviceStreams.videoIn = stream;
  },
  getVideoInput: function getVideoInput() {
    return deviceStreams.videoIn;
  },
  getAudioInput: function getAudioInput() {
    return deviceStreams.audioIn;
  },
  stopAudioInput: function stopAudioInput() {
    if (!deviceStreams.audioIn) return;
    deviceStreams.audioIn.getTracks().forEach(function (track) {
      if (!!track) {
        track.stop();
      }
    });
    deviceStreams.audioIn = null;
  },
  stopVideoInput: function stopVideoInput() {
    if (!deviceStreams.videoIn) return;
    deviceStreams.videoIn.getTracks().forEach(function (track) {
      track.stop();
    });
    deviceStreams.videoIn = null;
  }
};
var deviceManager = {
  getAvailableDevices: function getAvailableDevices() {
    // deviceManager.changeAudioOutputDevice();
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      devices.forEach(function (device) {
        console.log(device);
        console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      });
    })["catch"](function (err) {
      console.log(err.name + ": " + err.message);
    });
  },
  canChooseAudioOutputDevice: function canChooseAudioOutputDevice() {
    return navigator.mediaDevices.selectAudioOutput;
  },
  changeAudioOutputDevice: function changeAudioOutputDevice() {
    if (!navigator.mediaDevices.selectAudioOutput) {
      console.warn("selectAudioOutput() not supported.");
      return;
    } //Display prompt and log selected device or error


    navigator.mediaDevices.selectAudioOutput().then(function (device) {
      console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
    })["catch"](function (err) {
      console.log(err.name + ": " + err.message);
    });
  },
  getScreenSharePermission: function getScreenSharePermission() {
    return new Promise(function (resolve) {
      navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      }).then(function (result) {
        console.log(result);
        resolve(result);
      });
    });
  },
  grantUserMediaDevicesPermissions: function grantUserMediaDevicesPermissions(_ref) {
    var _ref$video = _ref.video,
        video = _ref$video === void 0 ? false : _ref$video,
        _ref$audio = _ref.audio,
        audio = _ref$audio === void 0 ? false : _ref$audio,
        _ref$closeStream = _ref.closeStream,
        closeStream = _ref$closeStream === void 0 ? false : _ref$closeStream;
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return new Promise( /*#__PURE__*/function () {
      var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(resolve, reject) {
        var parsedError;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;

                if (!audio) {
                  _context.next = 4;
                  break;
                }

                _context.next = 4;
                return deviceManager.getInputDevicePermission({
                  audio: true
                });

              case 4:
                if (!video) {
                  _context.next = 7;
                  break;
                }

                _context.next = 7;
                return deviceManager.getInputDevicePermission({
                  video: {
                    width: 640,
                    framerate: 15
                  }
                });

              case 7:
                if (closeStream) {
                  if (audio) _mediaStreams.stopAudioInput();
                  if (video) _mediaStreams.stopVideoInput();
                }

                if (callback) callback({
                  hasError: false
                });
                resolve({
                  hasError: false
                });
                _context.next = 17;
                break;

              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](0);
                parsedError = {
                  hasError: true,
                  errorCode: _context.t0.code,
                  errorMessage: _context.t0.message
                };
                if (callback) callback(parsedError);
                reject(parsedError);

              case 17:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 12]]);
      }));

      return function (_x, _x2) {
        return _ref2.apply(this, arguments);
      };
    }());
  },
  getInputDevicePermission: function getInputDevicePermission(_ref3) {
    var _ref3$audio = _ref3.audio,
        audio = _ref3$audio === void 0 ? false : _ref3$audio,
        _ref3$video = _ref3.video,
        video = _ref3$video === void 0 ? false : _ref3$video;
    return new Promise(function (resolve, reject) {
      if (video && _mediaStreams.getVideoInput()) {
        resolve(_mediaStreams.getVideoInput());
        return;
      }

      if (audio && _mediaStreams.getAudioInput()) {
        resolve(_mediaStreams.getAudioInput());
        return;
      }

      navigator.mediaDevices.getUserMedia({
        audio: audio,
        video: video
      }).then(function (stream) {
        if (audio) _mediaStreams.setAudioInput(stream);
        if (video) _mediaStreams.setVideoInput(stream);
        resolve(stream);
      })["catch"](function (error) {
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: audio ? 12400 : 12401,
          message: error // environmentDetails: getSDKCallDetails()

        });

        reject((0, _errorHandler["default"])(audio ? 12400 : 12401));
      });
    });
  },
  mediaStreams: function mediaStreams() {
    return _mediaStreams;
  }
};
var _default = deviceManager;
exports["default"] = _default;