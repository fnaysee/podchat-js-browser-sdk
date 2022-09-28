"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

require("../constants.js");

var _eventsModule = require("../../events.module.js");

var _errorHandler = _interopRequireWildcard(require("../errorHandler.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var deviceList = {
  audioIn: [],
  audioOut: [],
  videoIn: []
};
var deviceStreams = {
  videoIn: null,
  audioIn: null,
  audioOut: null,
  screenShare: null
};
var _mediaStreams = {
  setAudioInput: function setAudioInput(stream) {
    deviceStreams.audioIn = stream;
  },
  setVideoInput: function setVideoInput(stream) {
    deviceStreams.videoIn = stream;
  },
  setScreenShareInput: function setScreenShareInput(stream) {
    deviceStreams.screenShare = stream;
  },
  getVideoInput: function getVideoInput() {
    return deviceStreams.videoIn;
  },
  getAudioInput: function getAudioInput() {
    return deviceStreams.audioIn;
  },
  getScreenShareInput: function getScreenShareInput() {
    return deviceStreams.screenShare;
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
  },
  stopScreenShareInput: function stopScreenShareInput() {
    if (!deviceStreams.screenShare) return;
    deviceStreams.screenShare.getTracks().forEach(function (track) {
      track.stop();
    });
    deviceStreams.screenShare = null;
  }
};
var deviceManager = {
  // getAvailableDevices() {
  //     // deviceManager.changeAudioOutputDevice();
  //     navigator.mediaDevices.enumerateDevices()
  //         .then(function(devices) {
  //             devices.forEach(function(device) {
  //                 console.log(device)
  //                 console.log(device.kind + ": " + device.label +
  //                     " id = " + device.deviceId);
  //             });
  //         })
  //         .catch(function(err) {
  //             console.log(err.name + ": " + err.message);
  //         });
  // },
  canChooseAudioOutputDevice: function canChooseAudioOutputDevice() {
    return !!navigator.mediaDevices.selectAudioOutput;
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
  grantScreenSharePermission: function grantScreenSharePermission(_ref) {
    var _ref$closeStream = _ref.closeStream,
        closeStream = _ref$closeStream === void 0 ? false : _ref$closeStream;
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return new Promise(function (resolve, reject) {
      if (_mediaStreams.getScreenShareInput()) {
        if (!_mediaStreams.getScreenShareInput().active) {
          _mediaStreams.stopScreenShareInput();
        } else {
          // console.log("exists resolving")
          resolve(_mediaStreams.getScreenShareInput());
          return;
        }
      }

      navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true
      }).then(function (stream) {
        _mediaStreams.setScreenShareInput(stream);

        if (closeStream) {
          _mediaStreams.stopScreenShareInput();
        }

        callback && callback({
          hasError: false
        });
        resolve(stream);
      })["catch"](function (e) {
        var error = (0, _errorHandler.raiseError)(_errorHandler.errorList.SCREENSHARE_PERMISSION_ERROR, callback, true, {
          eventName: 'callEvents',
          eventType: 'CALL_ERROR'
        });
        reject(error);
      });
    });
  },
  grantUserMediaDevicesPermissions: function grantUserMediaDevicesPermissions(_ref2) {
    var _ref2$video = _ref2.video,
        video = _ref2$video === void 0 ? false : _ref2$video,
        _ref2$audio = _ref2.audio,
        audio = _ref2$audio === void 0 ? false : _ref2$audio,
        _ref2$closeStream = _ref2.closeStream,
        closeStream = _ref2$closeStream === void 0 ? false : _ref2$closeStream;
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return new Promise( /*#__PURE__*/function () {
      var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(resolve, reject) {
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
                    width: 320,
                    framerate: 10
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
        return _ref3.apply(this, arguments);
      };
    }());
  },
  getInputDevicePermission: function getInputDevicePermission(_ref4) {
    var _ref4$audio = _ref4.audio,
        audio = _ref4$audio === void 0 ? false : _ref4$audio,
        _ref4$video = _ref4.video,
        video = _ref4$video === void 0 ? false : _ref4$video;
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