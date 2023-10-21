"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallScreenShare = CallScreenShare;
exports.CallUser = CallUser;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _sdkParams = require("../sdkParams");

var _deviceStartStopManager = require("./deviceStartStopManager");

var _callTopicManager = require("./callTopicManager");

var _sharedData = require("./sharedData");

var _callsList = require("./callsList");

var _store = require("../store");

function CallUser(user) {
  var config = {
    callId: user.callId,
    userId: user.userId,
    user: user,
    isMe: user.userId == _store.store.user().id,
    containerTag: null,
    htmlElements: {},
    videoTopicManager: null,
    audioTopicManager: null
  };
  var publicized = {
    isMe: function isMe() {
      return config.userId == _store.store.user().id;
    },
    isScreenShare: function isScreenShare() {
      return false;
    },
    user: function user() {
      return config.user;
    },
    getHTMLElements: function getHTMLElements() {
      return config.htmlElements;
    },
    appendAudioToCallDiv: function appendAudioToCallDiv() {
      if (!_sharedData.sharedVariables.callDivId) {
        _sdkParams.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(_sharedData.sharedVariables.callDivId),
          userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

      if (!userContainer) {
        callParentDiv.appendChild(config.htmlElements.container);
        userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
      }

      if (typeof user.mute !== "undefined" && !user.mute && config.audioTopicManager) {
        if (!document.getElementById("callUserAudio-" + config.user.audioTopicName)) {
          userContainer.appendChild(config.htmlElements[config.user.audioTopicName]);
          config.audioTopicManager.startMedia();
          config.audioTopicManager.watchAudioLevel();
        }
      }
    },
    appendVideoToCallDiv: function appendVideoToCallDiv() {
      if (!_sharedData.sharedVariables.callDivId) {
        _sdkParams.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(_sharedData.sharedVariables.callDivId),
          userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

      if (!userContainer) {
        callParentDiv.appendChild(config.htmlElements.container);
        userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
      }

      if (user.video && config.videoTopicManager) {
        if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
          userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
          config.videoTopicManager.startMedia();
        }
      }

      (0, _sharedData.currentCall)().sendCallDivs();
    },
    videoTopicManager: function videoTopicManager() {
      return config.videoTopicManager;
    },
    audioTopicManager: function audioTopicManager() {
      return config.audioTopicManager;
    },
    startAudio: function startAudio(sendTopic) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!config.audioTopicManager) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                config.user.audioTopicName = 'Vo-' + sendTopic;
                config.user.mute = false;
                config.audioTopicManager = new _callTopicManager.CallTopicManager({
                  callId: config.user.callId,
                  userId: config.user.userId,
                  topic: 'Vo-' + config.user.topicSend,
                  mediaType: 'audio',
                  direction: config.user.userId === _store.store.user().id ? 'send' : 'receive',
                  user: config.user,
                  onHTMLElement: function onHTMLElement(el) {
                    config.htmlElements[config.user.audioTopicName] = el;
                    publicized.appendAudioToCallDiv();
                  }
                });
                config.audioTopicManager.createTopic();

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    startVideo: function startVideo(sendTopic) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!config.videoTopicManager) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                config.user.videoTopicName = 'Vi-' + sendTopic;
                config.user.video = true;
                config.videoTopicManager = new _callTopicManager.CallTopicManager({
                  callId: config.user.callId,
                  userId: config.user.userId,
                  topic: 'Vi-' + config.user.topicSend,
                  mediaType: 'video',
                  direction: config.user.userId === _store.store.user().id ? 'send' : 'receive',
                  user: config.user,
                  onHTMLElement: function onHTMLElement(el) {
                    config.htmlElements[config.user.videoTopicName] = el;
                    publicized.appendVideoToCallDiv();
                  }
                });
                config.videoTopicManager.createTopic();

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    reconnectTopic: function reconnectTopic(media) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(media == 'audio')) {
                  _context3.next = 9;
                  break;
                }

                _context3.next = 3;
                return config.audioTopicManager.stopTopicOnServer();

              case 3:
                _context3.next = 5;
                return publicized.destroyAudio();

              case 5:
                _context3.next = 7;
                return publicized.startAudio(config.user.topicSend);

              case 7:
                _context3.next = 15;
                break;

              case 9:
                _context3.next = 11;
                return config.videoTopicManager.stopTopicOnServer();

              case 11:
                _context3.next = 13;
                return publicized.destroyVideo();

              case 13:
                _context3.next = 15;
                return publicized.startVideo(config.user.topicSend);

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(config.videoTopicManager && config.videoTopicManager.getPeer())) {
                  _context4.next = 3;
                  break;
                }

                _context4.next = 3;
                return publicized.destroyVideo();

              case 3:
                if (!(config.audioTopicManager && config.audioTopicManager.getPeer())) {
                  _context4.next = 6;
                  break;
                }

                _context4.next = 6;
                return publicized.destroyAudio();

              case 6:
                // user.topicMetaData = {};
                config.htmlElements = {};
                user = null;

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    },
    stopAudio: function stopAudio() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                config.user.mute = true;
                _context5.next = 3;
                return publicized.destroyAudio();

              case 3:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }))();
    },
    destroyAudio: function destroyAudio() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (config.audioTopicManager) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return");

              case 2:
                _context6.next = 4;
                return config.audioTopicManager.destroy();

              case 4:
                delete config.htmlElements[config.user.audioTopicName];
                config.audioTopicManager = null;

              case 6:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }))();
    },
    stopVideo: function stopVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                config.user.video = false;
                _context7.next = 3;
                return publicized.destroyVideo();

              case 3:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }))();
    },
    destroyVideo: function destroyVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (config.videoTopicManager) {
                  _context8.next = 2;
                  break;
                }

                return _context8.abrupt("return");

              case 2:
                _context8.next = 4;
                return config.videoTopicManager.destroy();

              case 4:
                delete config.htmlElements[config.user.videoTopicName];
                config.videoTopicManager = null;

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }))();
    }
  };

  function setup(participant) {
    config.user = participant;

    if (config.isMe) {
      config.user.direction = 'send';
    } else {
      config.user.direction = 'receive';
    }

    config.user.videoTopicName = 'Vi-' + config.user.topicSend;
    config.user.audioTopicName = 'Vo-' + config.user.topicSend; // config.user.audioStopManager = new DevicePauseStopManager({
    //     callId: config.callId,
    //     userId: config.user.userId,
    //     mediaType: 'audio',
    //     timeout: sdkParams.callOptions?.streamCloseTimeout || 10000
    // });
    // if (config.user.mute) {
    //     config.user.audioStopManager.pauseStream();
    //     config.user.audioStopManager.stopStream();
    // }
    // config.user.videoStopManager = new DevicePauseStopManager({
    //     callId: config.callId,
    //     userId: config.user.userId,
    //     mediaType: 'video',
    //     timeout: sdkParams.callOptions?.streamCloseTimeout || 10000
    // });
    // if (!config.user.video) {
    // config.user.videoStopManager.pauseStream();
    // config.user.videoStopManager.stopStream();
    // }
    // publicized.appendUserToCallDiv(generateContainerElement())

    generateContainerElement();
    if (config.user.video) publicized.startVideo(config.user.topicSend);
    if (!config.user.mute) publicized.startAudio(config.user.topicSend);
  }

  function generateContainerElement() {
    if (!config.htmlElements.container) {
      config.htmlElements.container = document.createElement('div');
      var el = config.htmlElements.container;
      el.setAttribute('id', 'callParticipantWrapper-' + config.userId);
      el.classList.add('participant');
      el.classList.add('wrapper');
      el.classList.add('user-' + config.userId);
      el.classList.add(config.isMe ? 'local' : 'remote');
    }

    return config.htmlElements;
  }

  setup(user);
  return publicized;
}

function CallScreenShare(user) {
  var config = {
    callId: user.callId,
    userId: user.userId,
    isMe: user.userId == _store.store.user().id,
    user: user,
    type: "screenShare",
    containerTag: null,
    htmlElements: {},
    videoTopicManager: null
  };
  var publicized = {
    isMe: function isMe() {
      return false;
    },
    isScreenShare: function isScreenShare() {
      return true;
    },
    user: function user() {
      return config.user;
    },
    getHTMLElements: function getHTMLElements() {
      return config.htmlElements;
    },
    appendVideoToCallDiv: function appendVideoToCallDiv() {
      var _config$videoTopicMan;

      if (!_sharedData.sharedVariables.callDivId) {
        _sdkParams.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(_sharedData.sharedVariables.callDivId),
          userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

      if (!userContainer) {
        callParentDiv.appendChild(config.htmlElements.container);
        userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
      }

      if (user.video && config.videoTopicManager) {
        if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
          userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
          config.videoTopicManager.startMedia();
        }
      } // if(currentCall().screenShareInfo.iAmOwner())


      (_config$videoTopicMan = config.videoTopicManager) === null || _config$videoTopicMan === void 0 ? void 0 : _config$videoTopicMan.restartMediaOnKeyFrame("screenShare", [1000, 4000]); // else {
      //     config.videoTopicManager?.restartMediaOnKeyFrame("screenShare", [1000, 3000, 6000]);
      // }

      (0, _sharedData.currentCall)().sendCallDivs();
    },
    videoTopicManager: function videoTopicManager() {
      return config.videoTopicManager;
    },
    audioTopicManager: function audioTopicManager() {
      return config.audioTopicManager;
    },
    audioStopManager: function audioStopManager() {
      return config.user.audioStopManager;
    },
    startAudio: function startAudio(sendTopic) {
      return;
    },
    startVideo: function startVideo(sendTopic) {
      config.user.videoTopicName = sendTopic;
      config.user.video = true;
      config.videoTopicManager = new _callTopicManager.CallTopicManager({
        callId: config.user.callId,
        userId: config.user.userId,
        topic: config.user.videoTopicName,
        mediaType: 'video',
        direction: (0, _callsList.callsManager)().get(config.callId).screenShareInfo.iAmOwner() ? 'send' : 'receive',
        user: config.user,
        isScreenShare: true,
        onHTMLElement: function onHTMLElement(el) {
          config.htmlElements[config.user.videoTopicName] = el;
          publicized.appendVideoToCallDiv();
        }
      }); // publicized.appendUserToCallDiv(generateVideoElement());

      config.videoTopicManager.createTopic();
    },
    reconnectTopic: function reconnectTopic(media) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return config.videoTopicManager.stopTopicOnServer();

              case 2:
                _context9.next = 4;
                return publicized.destroyVideo();

              case 4:
                _context9.next = 6;
                return publicized.startVideo(config.user.topic);

              case 6:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }))();
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (!(config.videoTopicManager && config.videoTopicManager.getPeer())) {
                  _context10.next = 3;
                  break;
                }

                _context10.next = 3;
                return config.videoTopicManager.destroy();

              case 3:
                // user.topicMetaData = {};
                config.htmlElements = {};
                user = null;

              case 5:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }))();
    },
    destroyAudio: function destroyAudio() {
      return new Promise(function (resolve) {
        resolve();
      });
    },
    destroyVideo: function destroyVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return config.videoTopicManager.destroy();

              case 2:
                delete config.htmlElements[config.user.videoTopicName];
                config.videoTopicManager = null;

              case 4:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }))();
    }
  };

  function setup(user) {
    var iAmOwner = (0, _callsList.callsManager)().get(config.callId).screenShareInfo.iAmOwner();
    var obj = {
      video: true,
      callId: user.callId,
      userId: user.userId,
      topic: user.topicSend
    };
    obj.direction = iAmOwner ? 'send' : 'receive';
    obj.videoTopicName = config.topic;
    config.user = obj; // publicized.appendUserToCallDiv(generateContainerElement())

    generateContainerElement();
    if (config.user.video) publicized.startVideo(obj.topic);
  }

  function generateContainerElement() {
    if (!config.htmlElements.container) {
      config.htmlElements.container = document.createElement('div');
      var el = config.htmlElements.container;
      el.setAttribute('id', 'callParticipantWrapper-' + config.userId);
      el.classList.add('participant');
      el.classList.add('wrapper');
      el.classList.add('user-' + config.userId);
      el.classList.add(config.isMe ? 'local' : 'remote');
    }

    return config.htmlElements;
  }

  function generateVideoElement() {
    if (config.user.video && !config.htmlElements[config.user.videoTopicName]) {
      var el = config.videoTopicManager.getHtmlElement();
      config.htmlElements[config.user.videoTopicName] = el;
    }
  }

  setup(user);
  return publicized;
}