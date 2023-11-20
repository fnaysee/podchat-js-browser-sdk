"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallScreenShare = CallScreenShare;
exports.CallUser = CallUser;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _utility = _interopRequireDefault(require("../../../utility/utility"));

function CallUser(app, user) {
  var config = {
    callId: user.callId,
    userId: user.userId,
    user: user,
    isMe: user.userId == app.store.user.get().id,
    containerTag: null,
    htmlElements: {},
    videoIsOpen: false,
    audioIsOpen: false
  };
  var publicized = {
    userId: function userId() {
      return config.userId;
    },
    isMe: function isMe() {
      return config.userId == app.store.user.get().id;
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
    getVideoHtmlElement: function getVideoHtmlElement() {
      var elementUniqueId = _utility["default"].generateUUID();

      if (config.user.video && !config.htmlElement) {
        config.htmlElement = document.createElement('video');
        var el = config.htmlElement;
        el.setAttribute('id', 'callUserVideo-' + config.user.videoTopicName);
        el.setAttribute('class', app.call.sharedVariables.callVideoTagClassName);
        el.setAttribute('playsinline', '');
        el.setAttribute('muted', '');
        el.setAttribute('autoplay', '');
        el.setAttribute('data-uniqueId', elementUniqueId);
        el.setAttribute('width', app.call.sharedVariables.callVideoMinWidth + 'px');
        el.setAttribute('height', app.call.sharedVariables.callVideoMinHeight + 'px'); // el.setAttribute('controls', '');
      }

      return config.htmlElement;
    },
    getAudioHtmlElement: function getAudioHtmlElement(stream) {
      if (!config.isMe) {
        config.audioObject = new Audio();
        config.audioObject.srcObject = stream;
        config.audioObject.srcObject = stream;
        config.audioObject.autoplay = true;
        config.audioObject.play();
        publicized.watchAudioLevel();
      }
    },
    appendAudioToCallDiv: function appendAudioToCallDiv() {
      if (!app.call.sharedVariables.callDivId) {
        app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
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
      if (!app.call.sharedVariables.callDivId) {
        app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
          userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

      if (!userContainer) {
        callParentDiv.appendChild(config.htmlElements.container);
        userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
      }

      if (user.video) {
        if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
          userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
          config.htmlElements[config.user.videoTopicName].play();
        }
      }

      app.call.currentCall().sendCallDivs();
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
                config.audioIsOpen = true;
                config.user.mute = false;

                if (config.isMe) {
                  app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({
                    audio: true
                  }).then(function () {
                    app.call.currentCall().sendPeerManager().addTrack({
                      clientId: config.user.clientId,
                      topic: config.user.audioTopicName,
                      mediaType: 1,
                      stream: app.call.currentCall().deviceManager().mediaStreams.getAudioInput(),
                      onTrackCallback: onTrackCallback
                    });
                  })["catch"](function (error) {// reject(error)
                  });
                } else {
                  app.call.currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.audioTopicName,
                    mediaType: 1,
                    onTrackCallback: onTrackCallback
                  });
                }

              case 3:
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
                config.user.video = true;
                config.videoIsOpen = true;

                if (config.isMe) {
                  app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({
                    video: true
                  }).then(function () {
                    app.call.currentCall().sendPeerManager().addTrack({
                      clientId: config.user.clientId,
                      topic: config.user.videoTopicName,
                      mediaType: 0,
                      stream: app.call.currentCall().deviceManager().mediaStreams.getVideoInput(),
                      onTrackCallback: onTrackCallback
                    });
                  })["catch"](function (error) {// reject(error)
                  });
                } else {
                  app.call.currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.videoTopicName,
                    mediaType: 0,
                    onTrackCallback: onTrackCallback
                  });
                }

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return publicized.destroyVideo();

              case 2:
                _context3.next = 4;
                return publicized.destroyAudio();

              case 4:
                config.htmlElements = {};
                user = null;

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    stopAudio: function stopAudio() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                config.user.mute = true;
                config.audioIsOpen = false;
                if (config.isMe) app.call.currentCall().sendPeerManager().removeTrack(config.user.audioTopicName);
                _context4.next = 5;
                return publicized.destroyAudio();

              case 5:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    },
    destroyAudio: function destroyAudio() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                config.audioObject = null; //TODO: Remove audio level watcher interval
                // if (config.htmlElements[config.user.audioTopicName]) {
                //     config.htmlElements[config.user.audioTopicName].remove();
                //     delete config.htmlElements[config.user.audioTopicName];
                // }

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }))();
    },
    stopVideo: function stopVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                config.user.video = false;
                config.videoIsOpen = false;
                if (config.isMe) app.call.currentCall().sendPeerManager().removeTrack(config.user.videoTopicName);
                _context6.next = 5;
                return publicized.destroyVideo();

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }))();
    },
    destroyVideo: function destroyVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (config.htmlElements[config.user.videoTopicName]) {
                  config.htmlElements[config.user.videoTopicName].remove();
                  delete config.htmlElements[config.user.videoTopicName];
                }

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }))();
    },
    processTrackChange: function processTrackChange(conf) {
      if (conf.topic.indexOf('Vi-') > -1) {
        if (!config.videoIsOpen && conf.isReceiving) {
          publicized.startVideo(conf.topic.replace('Vi-', ''));
        } else if (config.videoIsOpen && !conf.isReceiving) {
          config.videoIsOpen = false;
          publicized.stopVideo();
        }
      } else if (conf.topic.indexOf('Vo-') > -1) {
        if (!config.audioIsOpen && conf.isReceiving) {
          publicized.startAudio(conf.topic.replace('Vo-', ''));
        } else if (config.audioIsOpen && !conf.isReceiving) {
          config.user.mute = true;
          config.audioIsOpen = false;
          publicized.stopAudio();
        }
      }
    },
    watchAudioLevel: function watchAudioLevel() {
      var stream = config.dataStream;
      var user = config.user,
          topicMetadata = config.topicMetaData; // Create and configure the audio pipeline

      var analyzer = app.call.audioCtx().createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.1;
      var sourceNode = app.call.audioCtx().createMediaStreamSource(stream);
      sourceNode.connect(analyzer); // Analyze the sound

      topicMetadata.audioLevelInterval = setInterval(function () {
        // Compute the max volume level (-Infinity...0)
        var fftBins = new Float32Array(analyzer.frequencyBinCount); // Number of values manipulated for each sample

        analyzer.getFloatFrequencyData(fftBins); // audioPeakDB varies from -Infinity up to 0

        var audioPeakDB = Math.max.apply(Math, (0, _toConsumableArray2["default"])(fftBins)); // Compute a wave (0...)

        var frequencyRangeData = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(frequencyRangeData);
        var sum = frequencyRangeData.reduce(function (p, c) {
          return p + c;
        }, 0); // audioMeter varies from 0 to 10

        var audioMeter = Math.sqrt(sum / frequencyRangeData.length); //console.log({audioMeter}, {audioPeakDB});

        if (audioPeakDB > -50 && audioMeter > 0) {
          app.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: convertToAudioLevel(audioPeakDB),
            isNoise: false,
            isMute: false
          });
        } else if (audioPeakDB !== -Infinity && audioPeakDB < -60 && audioMeter > 0) {
          app.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: 0,
            isNoise: true,
            isMute: false
          });
        } else if (audioPeakDB === -Infinity && audioMeter == 0) {
          app.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: 0,
            isNoise: false,
            isMute: true
          });
        }
      }, 500);

      function convertToAudioLevel(soundPower) {
        if (soundPower <= -60) {
          return 0;
        } else if (soundPower >= -60 && soundPower < -50) {
          return 1;
        } else if (soundPower >= -50 && soundPower < -40) {
          return 2;
        } else if (soundPower >= -40 && soundPower < 30) {
          return 3;
        } else if (soundPower >= -30) {
          return 4;
        }
      }
    }
  };

  function onTrackCallback(line, track) {
    var stream = new MediaStream([track]);
    var isAudio = line.topic.indexOf('Vo-') > -1;
    var isVideo = line.topic.indexOf('Vi-') > -1;

    if (config.isMe) {
      if (isAudio) {//TODO: implement
        // publicized.watchAudioLevel();
      } else {
        var el = publicized.getVideoHtmlElement();
        el.srcObject = stream;
        config.htmlElements[config.user.videoTopicName] = el;
        console.log('debug', 992, {
          el: el
        }, config.user.videoTopicName);
        publicized.appendVideoToCallDiv();
      }
    } else {
      if (isAudio) {
        config.audioObject = new Audio();
        config.audioObject.srcObject = stream;
        config.audioObject.srcObject = stream;
        config.audioObject.autoplay = true;
        config.audioObject.play(); //TODO: implement
        // publicized.watchAudioLevel();
      } else if (isVideo) {
        var _el = publicized.getVideoHtmlElement();

        _el.srcObject = stream;
        config.htmlElements[config.user.videoTopicName] = _el;
        publicized.appendVideoToCallDiv();
      }
    }
  }

  function setup(participant) {
    config.user = participant;

    if (config.isMe) {
      config.user.direction = 'send';
    } else {
      config.user.direction = 'receive';
    }

    config.user.videoTopicName = 'Vi-' + config.user.topicSend;
    config.user.audioTopicName = 'Vo-' + config.user.topicSend;
    generateContainerElement(); //
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

function CallScreenShare(app, user) {
  var config = {
    callId: user.callId,
    userId: user.userId,
    isMe: user.userId == app.store.user.get().id,
    user: user,
    videoIsOpen: false,
    type: "screenShare",
    containerTag: null,
    htmlElements: {},
    videoStream: null
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
      if (!app.call.sharedVariables.callDivId) {
        app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = config.user,
          callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
          userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

      if (!userContainer) {
        callParentDiv.appendChild(config.htmlElements.container);
        userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
      }

      if (user.video) {
        if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
          userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
          config.videoStream.getTracks()[0].enabled = true;
          setTimeout(function () {
            var el = document.getElementById("callUserVideo-" + config.user.videoTopicName);
            if (!el) return;
            el.addEventListener('loadedmetadata', playTheTag);
            el.srcObject = config.videoStream;

            function playTheTag() {
              el.play();
            }
          }, 500); // config.htmlElements[config.user.videoTopicName].srcObject = config.videoStream
          // config.htmlElements[config.user.videoTopicName].play();
        }
      }

      app.call.currentCall().sendCallDivs();
    },
    audioStopManager: function audioStopManager() {
      return config.user.audioStopManager;
    },
    startAudio: function startAudio(sendTopic) {
      return;
    },
    startVideo: function startVideo(sendTopic) {
      config.user.video = true;
      config.videoIsOpen = true;
      var iAmOwner = app.call.currentCall().screenShareInfo.iAmOwner();

      if (iAmOwner) {
        app.call.currentCall().deviceManager().grantScreenSharePermission({
          closeStream: false
        }).then(function (stream) {
          if (!stream) {
            alert("Error: could not find screenShareInput");
          } else {
            var onScreenShareEndCallback = function onScreenShareEndCallback(event) {
              // Click on browser UI stop sharing button
              if (!config.user) return;
              stream.getVideoTracks()[0].removeEventListener("ended", onScreenShareEndCallback);

              if (app.call.currentCall() && app.call.currentCall().screenShareInfo.isStarted()) {
                app.call.endScreenShare({
                  callId: config.callId
                });
              }
            };

            stream.getVideoTracks()[0].addEventListener("ended", onScreenShareEndCallback);
          }

          app.call.currentCall().sendPeerManager().addTrack({
            clientId: config.user.clientId,
            topic: config.user.videoTopicName,
            mediaType: 2,
            isScreenShare: true,
            stream: app.call.currentCall().deviceManager().mediaStreams.getScreenShareInput(),
            onTrackCallback: onTrackCallback
          });
        })["catch"](function (error) {// reject(error)
        });
      } else {
        app.call.currentCall().receivePeerManager().addTrack({
          clientId: config.user.clientId,
          topic: config.user.videoTopicName,
          mediaType: 2,
          isScreenShare: true,
          onTrackCallback: onTrackCallback
        });
      }
    },
    processTrackChange: function processTrackChange(conf) {
      if (conf.topic.indexOf('Vi-') > -1) {
        if (!config.videoIsOpen && conf.isReceiving) {
          publicized.startVideo(conf.topic.replace('Vi-', ''));
        } else if (config.videoIsOpen && !conf.isReceiving) {
          config.videoIsOpen = false;
          publicized.stopVideo();
        }
      }
    },
    reconnectTopic: function reconnectTopic(media) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return config.videoTopicManager.stopTopicOnServer();

              case 2:
                _context8.next = 4;
                return publicized.destroyVideo();

              case 4:
                _context8.next = 6;
                return publicized.startVideo(config.user.topic);

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }))();
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return publicized.stopVideo();

              case 2:
                config.htmlElements = {};
                config.user = null;

              case 4:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }))();
    },
    stopVideo: function stopVideo() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        var _app$call$currentCall;

        var iAmOwner;
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                config.user.video = false;
                config.videoIsOpen = false;
                iAmOwner = (_app$call$currentCall = app.call.currentCall().screenShareInfo) === null || _app$call$currentCall === void 0 ? void 0 : _app$call$currentCall.iAmOwner();
                if (iAmOwner) app.call.currentCall().sendPeerManager().removeTrack(config.user.videoTopicName);
                _context10.next = 6;
                return publicized.destroyVideo();

              case 6:
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
                return _context11.abrupt("return", new Promise(function (resolve) {
                  var el = document.getElementById("callUserVideo-".concat(config.user.videoTopicName));

                  if (el) {
                    el.remove();
                    config.htmlElements[config.user.videoTopicName].remove();
                    delete config.htmlElements[config.user.videoTopicName];
                  }

                  resolve();
                }));

              case 1:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }))();
    }
  };

  function setup(user) {
    var iAmOwner = app.call.currentCall().screenShareInfo.iAmOwner();
    var obj = {
      video: true,
      callId: user.callId,
      userId: user.userId,
      topic: user.topicSend,
      clientId: user.clientId
    };
    obj.direction = iAmOwner ? 'send' : 'receive';
    obj.videoTopicName = "Vi-send-".concat(obj.callId, "-screenShare"); //config.topic;

    config.user = obj; // publicized.appendUserToCallDiv(generateContainerElement())

    generateContainerElement();
    if (config.user.video && app.call.currentCall().screenShareInfo.iAmOwner()) publicized.startVideo(obj.topic);
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

  function getVideoHtmlElement() {
    var elementUniqueId = _utility["default"].generateUUID();

    if (config.user.video && !config.htmlElement) {
      config.htmlElement = document.createElement('video');
      var el = config.htmlElement;
      el.setAttribute('id', 'callUserVideo-' + config.user.videoTopicName);
      el.setAttribute('class', app.call.sharedVariables.callVideoTagClassName);
      el.setAttribute('playsinline', '');
      el.setAttribute('muted', '');
      el.setAttribute('autoplay', '');
      el.setAttribute('data-uniqueId', elementUniqueId);
      el.setAttribute('width', app.call.sharedVariables.callVideoMinWidth + 'px');
      el.setAttribute('height', app.call.sharedVariables.callVideoMinHeight + 'px'); // el.setAttribute('controls', '');
    }

    return config.htmlElement;
  }

  function onTrackCallback(line, track) {
    var stream = new MediaStream([track]);
    config.videoStream = stream;
    var el = getVideoHtmlElement(); // el.addEventListener('loadedmetadata', playTheTag);
    // el.srcObject = stream;

    config.htmlElements[config.user.videoTopicName] = el;
    publicized.appendVideoToCallDiv();
  }

  setup(user);
  return publicized;
}