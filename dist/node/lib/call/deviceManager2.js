"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeviceManager = DeviceManager;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

require("../constants.js");

var _errorHandler = require("../errorHandler.js");

function MediaStreamManager() {
  var deviceStreams = {
    videoIn: null,
    audioIn: null,
    audioOut: null,
    screenShare: null
  };
  return {
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
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (deviceStreams.audioIn) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                deviceStreams.audioIn.getTracks().forEach(function (track) {
                  if (!!track) {
                    track.stop();
                  }
                });
                deviceStreams.audioIn = null;

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    stopVideoInput: function stopVideoInput() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (deviceStreams.videoIn) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                deviceStreams.videoIn.getTracks().forEach(function (track) {
                  track.stop();
                });
                deviceStreams.videoIn = null;

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    stopScreenShareInput: function stopScreenShareInput() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (deviceStreams.screenShare) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt("return");

              case 2:
                deviceStreams.screenShare.getTracks().forEach(function (track) {
                  track.stop();
                });
                deviceStreams.screenShare = null;

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    }
  };
}

function DeviceManager(app) {
  var config = {
    mediaStreams: new MediaStreamManager(),
    streamsMetada: {
      audioInWatcherId: null
    }
  };
  var deviceManager = {
    getInputDevicePermission: function getInputDevicePermission(_ref) {
      var _ref$audio = _ref.audio,
          audio = _ref$audio === void 0 ? false : _ref$audio,
          _ref$video = _ref.video,
          video = _ref$video === void 0 ? false : _ref$video;
      return new Promise(function (resolve, reject) {
        if (video && config.mediaStreams.getVideoInput()) {
          resolve(config.mediaStreams.getVideoInput());
          return;
        }

        if (audio && config.mediaStreams.getAudioInput()) {
          resolve(config.mediaStreams.getAudioInput());
          return;
        }

        navigator.mediaDevices.getUserMedia({
          audio: audio,
          video: video
        }).then(function (stream) {
          if (audio) config.mediaStreams.setAudioInput(stream);
          if (video) config.mediaStreams.setVideoInput(stream);
          resolve(stream);
        })["catch"](function (error) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            code: audio ? 12400 : 12401,
            message: error // environmentDetails: getSDKCallDetails()

          });
          reject(app.errorHandler.handleError(audio ? 12400 : 12401));
        });
      });
    },
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
    grantScreenSharePermission: function grantScreenSharePermission(_ref2) {
      var _ref2$closeStream = _ref2.closeStream,
          closeStream = _ref2$closeStream === void 0 ? false : _ref2$closeStream;
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return new Promise(function (resolve, reject) {
        if (config.mediaStreams.getScreenShareInput()) {
          if (!config.mediaStreams.getScreenShareInput().active) {
            config.mediaStreams.stopScreenShareInput(); // resolve(config.mediaStreams.getScreenShareInput());
          } else {
            // console.log("exists resolving")
            resolve(config.mediaStreams.getScreenShareInput());
            return;
          }
        }

        navigator.mediaDevices.getDisplayMedia({
          audio: false,
          video: true
        }).then(function (stream) {
          config.mediaStreams.setScreenShareInput(stream);

          if (closeStream) {
            config.mediaStreams.stopScreenShareInput();
          }

          callback && callback({
            hasError: false
          });
          resolve(stream);
        })["catch"](function (e) {
          var error = app.errorHandler.raiseError(_errorHandler.errorList.SCREENSHARE_PERMISSION_ERROR, callback, true, {
            eventName: 'callEvents',
            eventType: 'CALL_ERROR'
          });
          reject(error);
        });
      });
    },
    grantUserMediaDevicesPermissions: function grantUserMediaDevicesPermissions(_ref3) {
      var _ref3$video = _ref3.video,
          video = _ref3$video === void 0 ? false : _ref3$video,
          _ref3$audio = _ref3.audio,
          audio = _ref3$audio === void 0 ? false : _ref3$audio,
          _ref3$closeStream = _ref3.closeStream,
          closeStream = _ref3$closeStream === void 0 ? false : _ref3$closeStream;
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return new Promise( /*#__PURE__*/function () {
        var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(resolve, reject) {
          var parsedError;
          return _regenerator["default"].wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (!audio) {
                    _context4.next = 4;
                    break;
                  }

                  _context4.next = 4;
                  return deviceManager.getInputDevicePermission({
                    audio: true
                  });

                case 4:
                  if (!video) {
                    _context4.next = 7;
                    break;
                  }

                  _context4.next = 7;
                  return deviceManager.getInputDevicePermission({
                    video: {
                      width: 320,
                      framerate: 10
                    }
                  });

                case 7:
                  if (closeStream) {
                    if (audio) config.mediaStreams.stopAudioInput();
                    if (video) config.mediaStreams.stopVideoInput();
                  }

                  if (callback) callback({
                    hasError: false
                  });
                  resolve({
                    hasError: false
                  });
                  _context4.next = 17;
                  break;

                case 12:
                  _context4.prev = 12;
                  _context4.t0 = _context4["catch"](0);
                  parsedError = {
                    hasError: true,
                    errorCode: _context4.t0.code,
                    errorMessage: _context4.t0.message
                  };
                  if (callback) callback(parsedError);
                  reject(parsedError);

                case 17:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, null, [[0, 12]]);
        }));

        return function (_x, _x2) {
          return _ref4.apply(this, arguments);
        };
      }());
    },
    mediaStreams: config.mediaStreams,
    watchAudioInputStream: function watchAudioInputStream(callErrorHandler) {
      config.streamsMetada.audioInWatcherId && clearInterval(config.streamsMetada.audioInWatcherId);
      config.streamsMetada.audioInWatcherId = setInterval(function () {
        var _config$mediaStreams$;

        if (!config.mediaStreams.getAudioInput()) {
          clearInterval(config.streamsMetada.audioInWatcherId);
          return;
        }

        var audioTracks = (_config$mediaStreams$ = config.mediaStreams.getAudioInput()) === null || _config$mediaStreams$ === void 0 ? void 0 : _config$mediaStreams$.getAudioTracks();

        if (audioTracks.length === 0) {
          callErrorHandler(_errorHandler.errorList.NO_AUDIO_TRACKS_AVAILABLE, null, true, {});
          clearInterval(config.streamsMetada.audioInWatcherId); // No audio from microphone has been captured

          return;
        } // We asked for the microphone so one track


        var track = audioTracks[0];

        if (track.muted) {
          // Track is muted which means that the track is unable to provide media data.
          // When muted, a track can't be unmuted.
          // This track will no more provide data...
          callErrorHandler(_errorHandler.errorList.AUDIO_TRACK_MUTED, null, true, {});
          clearInterval(config.streamsMetada.audioInWatcherId);
        }

        if (!track.enabled) {
          // Track is disabled (muted for telephonist) which means that the track provides silence instead of real data.
          // When disabled, a track can be enabled again.
          // When in that case, user can't be heard until track is enabled again.
          callErrorHandler(_errorHandler.errorList.AUDIO_TRACK_DISABLED, null, true, {});
        }

        if (track.readyState === "ended") {
          // Possibly a disconnection of the device
          // When ended, a track can't be active again
          // This track will no more provide data
          callErrorHandler(_errorHandler.errorList.AUDIO_TRACK_ENDED, null, true, {});
          clearInterval(config.streamsMetada.audioInWatcherId);
        }
      }, 10000);
    }
  };
  return deviceManager;
}

;