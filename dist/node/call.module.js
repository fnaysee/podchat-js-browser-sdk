"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof3 = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _constants = require("./lib/constants");

var _kurentoUtils = _interopRequireDefault(require("kurento-utils"));

var _utility = _interopRequireDefault(require("./utility/utility"));

var _eventsModule = require("./events.module.js");

var _deviceManager = _interopRequireDefault(require("./lib/call/deviceManager.js"));

var _errorHandler = _interopRequireWildcard(require("./lib/errorHandler"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof3(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ChatCall(params) {
  var _params$asyncLogging, _params$asyncLogging2, _params$asyncLogging3, _params$callOptions, _params$callOptions2;

  var //Utility = params.Utility,
  currentModuleInstance = this,
      asyncClient = params.asyncClient,
      //chatEvents = params.chatEvents,
  chatMessaging = params.chatMessaging,
      token = params.token,
      asyncRequestTimeouts = {},
      callTypes = {
    'VOICE': 0x0,
    'VIDEO': 0x1
  },
      generalTypeCode = params.typeCode,
      callOptions = params.callOptions,
      useInternalTurnAddress = !!(params.callOptions && params.callOptions.useInternalTurnAddress),
      callTurnIp = params.callOptions && params.callOptions.hasOwnProperty('callTurnIp') && typeof params.callOptions.callTurnIp === 'string' ? params.callOptions.callTurnIp : '46.32.6.188',
      callDivId = params.callOptions && params.callOptions.hasOwnProperty('callDivId') && typeof params.callOptions.callDivId === 'string' ? params.callOptions.callDivId : 'call-div',
      callAudioTagClassName = params.callOptions && params.callOptions.hasOwnProperty('callAudioTagClassName') && typeof params.callOptions.callAudioTagClassName === 'string' ? params.callOptions.callAudioTagClassName : '',
      callVideoTagClassName = params.callOptions && params.callOptions.hasOwnProperty('callVideoTagClassName') && typeof params.callOptions.callVideoTagClassName === 'string' ? params.callOptions.callVideoTagClassName : '',
      callVideoMinWidth = params.callOptions && params.callOptions.hasOwnProperty('callVideo') && (0, _typeof2["default"])(params.callOptions.callVideo) === 'object' && params.callOptions.callVideo.hasOwnProperty('minWidth') ? params.callOptions.callVideo.minWidth : 320,
      callVideoMinHeight = params.callOptions && params.callOptions.hasOwnProperty('callVideo') && (0, _typeof2["default"])(params.callOptions.callVideo) === 'object' && params.callOptions.callVideo.hasOwnProperty('minHeight') ? params.callOptions.callVideo.minHeight : 180,
      currentCallParams = {},
      currentCallId = null,
      //shouldReconnectCallTimeout = null,
  callMetaDataTypes = {
    POORCONNECTION: 1,
    POORCONNECTIONRESOLVED: 2,
    CUSTOMUSERMETADATA: 3,
    SCREENSHAREMETADATA: 4
  },
      screenShareState = {
    started: false,
    imOwner: false
  },
      screenShareInfo = new screenShareStateManager(),
      callClientType = {
    WEB: 1,
    ANDROID: 2,
    DESKTOP: 3
  },
      callUsers = {},
      callRequestController = {
    imCallOwner: false,
    callRequestReceived: false,
    callEstablishedInMySide: false,
    callRequestTimeout: null,
    iCanAcceptTheCall: function iCanAcceptTheCall() {
      return callRequestController.callRequestReceived && callRequestController.callEstablishedInMySide;
    },
    cameraPaused: true
  },
      callStopQueue = {
    callStarted: false
  },
      callServerController = new callServerManager(),
      //callTopicHealthChecker = new peersHealthChecker(),
  messageTtl = params.messageTtl || 10000,
      config = {
    getHistoryCount: 50
  },
      globalCallRequestTimeout = typeof params.callRequestTimeout === 'number' && params.callRequestTimeout >= 0 ? params.callRequestTimeout : 10000,
      consoleLogging = (_params$asyncLogging = params.asyncLogging) !== null && _params$asyncLogging !== void 0 && _params$asyncLogging.consoleLogging && typeof ((_params$asyncLogging2 = params.asyncLogging) === null || _params$asyncLogging2 === void 0 ? void 0 : _params$asyncLogging2.consoleLogging) === 'boolean' ? (_params$asyncLogging3 = params.asyncLogging) === null || _params$asyncLogging3 === void 0 ? void 0 : _params$asyncLogging3.consoleLogging : false,
      callNoAnswerTimeout = ((_params$callOptions = params.callOptions) === null || _params$callOptions === void 0 ? void 0 : _params$callOptions.callNoAnswerTimeout) || 0,
      callStreamCloseTimeout = ((_params$callOptions2 = params.callOptions) === null || _params$callOptions2 === void 0 ? void 0 : _params$callOptions2.streamCloseTimeout) || 10000;

  function screenShareStateManager() {
    var config = {
      ownerId: 0,
      imOwner: false,
      isStarted: false,
      width: callVideoMinWidth,
      height: callVideoMinHeight
    };
    return {
      setOwner: function setOwner(ownerId) {
        config.ownerId = +ownerId;
      },
      setIsStarted: function setIsStarted(isStarted) {
        config.isStarted = isStarted;
      },
      isStarted: function isStarted() {
        return config.isStarted;
      },
      iAmOwner: function iAmOwner() {
        return config.ownerId === chatMessaging.userInfo.id;
      },
      setWidth: function setWidth(width) {
        config.width = width;
      },
      setHeight: function setHeight(height) {
        config.height = height;
      },
      getWidth: function getWidth(width) {
        return config.width;
      },
      getHeight: function getHeight(height) {
        return config.height;
      },
      getOwner: function getOwner() {
        return config.ownerId;
      },
      setDimension: function setDimension(dimension) {
        if (dimension && dimension.width && +dimension.width > 0 && dimension.height && +dimension.height > 0) {
          screenShareInfo.setHeight(dimension.height);
          screenShareInfo.setWidth(dimension.width);
        } else {
          screenShareInfo.setHeight(callVideoMinHeight);
          screenShareInfo.setWidth(callVideoMinWidth);
        }
      }
    };
  }

  function callServerManager() {
    var config = {
      servers: [],
      currentServerIndex: 0
    };
    return {
      setServers: function setServers(serversList) {
        config.servers = serversList;
        config.currentServerIndex = 0;
      },
      // setCurrentServer: function (query) {
      //     for(let i in config.servers) {
      //         if(config.servers[i].indexOf(query) !== -1) {
      //             config.currentServerIndex = i;
      //             break;
      //         }
      //     }
      // },
      getCurrentServer: function getCurrentServer() {
        return config.servers[0]; //config.currentServerIndex];
      },
      isJanus: function isJanus() {
        return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
      },
      canChangeServer: function canChangeServer() {
        return config.currentServerIndex < config.servers.length - 1;
      },
      changeServer: function changeServer() {
        if (this.canChangeServer()) {
          consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
          config.currentServerIndex++;
        }
      }
    };
  }

  function devicePauseStopManager(params) {
    var config = {
      userId: params.userId,
      mediaType: params.mediaType,
      // 'video' || 'audio'
      paused: false,
      stopped: false,
      timeoutHandler: null,
      timeout: params.timeout
    };
    var privateFunctions = {
      setTimeout: function setTimeout() {
        if (config.timeoutHandler) {
          this.removeTimeout();
        }
        /**
         * Temporarily disable timeout feature
         */
        //config.timeoutHandler = setTimeout(function () {


        if (config.paused) {
          config.stopped = true;
          callStateController.deactivateParticipantStream(config.userId, config.mediaType, config.mediaType === 'video' ? 'video' : 'mute');
        } //}, config.timeout);

      },
      removeTimeout: function removeTimeout() {
        clearTimeout(config.timeoutHandler);
      }
    };
    return {
      pauseStream: function pauseStream() {
        config.paused = true;
      },
      stopStream: function stopStream() {
        config.stopped = true;
      },
      isStreamPaused: function isStreamPaused() {
        return config.paused;
      },
      isStreamStopped: function isStreamStopped() {
        return config.stopped;
      },
      disableStream: function disableStream() {
        //if(pause)
        this.pauseStream();
        privateFunctions.setTimeout();
      },
      reset: function reset() {
        config.paused = false;
        config.stopped = false;
        privateFunctions.removeTimeout();
      }
    };
  }

  function callTopicManager(params) {
    var config = {
      userId: params.userId,
      state: 0,
      //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected
      peer: null,
      topic: params.topic,
      mediaType: params.mediaType,
      direction: params.direction,
      isScreenShare: false,
      sdpOfferRequestSent: false
    };
    var metadataInstance = new topicMetaDataManager({
      userId: params.userId,
      topic: params.topic
    });
    var peerStates = {
      DISCONNECTED: 0,
      CONNECTING: 1,
      FAILED: 3,
      CONNECTED: 4
    };
    return {
      setPeerState: function setPeerState(state) {
        config.state = state;
      },
      setIsScreenShare: function setIsScreenShare() {
        config.isScreenShare = true;
      },
      setDirection: function setDirection(direction) {
        config.direction = direction;
      },
      getPeer: function getPeer() {
        return config.peer;
      },
      metadata: function metadata() {
        return metadataInstance;
      },
      isPeerConnecting: function isPeerConnecting() {
        return config.state === peerStates.CONNECTING;
      },
      isPeerFailed: function isPeerFailed() {
        return config.state === peerStates.FAILED;
      },
      isPeerConnected: function isPeerConnected() {
        return config.state === peerStates.CONNECTED;
      },
      isPeerDisconnected: function isPeerDisconnected() {
        return config.state === peerStates.DISCONNECTED;
      },
      generateSdpOfferOptions: function generateSdpOfferOptions() {
        var topicManager = this;
        return new Promise(function (resolve, reject) {
          var mediaConstraints = {
            audio: config.mediaType === 'audio',
            video: config.mediaType === 'video'
          };

          if (config.direction === 'send' && config.mediaType === 'video') {
            mediaConstraints.video = {
              width: callVideoMinWidth,
              height: callVideoMinHeight,
              framerate: 15
            };
          }

          var options = {
            mediaConstraints: mediaConstraints,
            iceTransportPolicy: 'relay',
            onicecandidate: function onicecandidate(candidate) {
              topicManager.watchForIceCandidates(candidate);
            },
            configuration: {
              iceServers: callStateController.getTurnServer(currentCallParams)
            }
          };
          options[config.direction === 'send' ? 'localVideo' : 'remoteVideo'] = callUsers[config.userId].htmlElements[config.topic];

          if (config.direction === 'send') {
            if (config.mediaType === 'video') {
              if (config.isScreenShare) {
                _deviceManager["default"].grantScreenSharePermission({
                  closeStream: false
                }).then(function (stream) {
                  stream.getVideoTracks()[0].addEventListener("ended", function (event) {
                    // Click on browser UI stop sharing button
                    _deviceManager["default"].mediaStreams().stopScreenShareInput();

                    if (callUsers['screenShare'] && config.peer) {
                      currentModuleInstance.endScreenShare({
                        callId: currentCallId
                      });
                    }
                  });
                  options.videoStream = stream;
                  options.sendSource = 'screen';
                  resolve(options);
                })["catch"](function (error) {
                  var errorString = "[SDK][grantScreenSharePermission][catch] " + JSON.stringify(error);
                  console.error(errorString);
                  raiseCallError(_errorHandler.errorList.SCREENSHARE_PERMISSION_ERROR, null, true); // chatEvents.fireEvent('callEvents', {
                  //     type: 'CALL_ERROR',
                  //     code: 7000,
                  //     message: errorString,
                  //     environmentDetails: getSDKCallDetails()
                  // });

                  explainUserMediaError(error, 'video', 'screen'); //resolve(options);
                });
              } else {
                _deviceManager["default"].grantUserMediaDevicesPermissions({
                  video: true
                }).then(function () {
                  options.videoStream = _deviceManager["default"].mediaStreams().getVideoInput();
                  resolve(options);
                })["catch"](function (error) {
                  reject(error);
                });
              }
            } else if (config.mediaType === 'audio') {
              _deviceManager["default"].grantUserMediaDevicesPermissions({
                audio: true
              }).then(function () {
                options.audioStream = _deviceManager["default"].mediaStreams().getAudioInput();
                resolve(options);
              })["catch"](function (error) {
                reject(error);
              });
            }
          } else {
            resolve(options);
          }

          consoleLogging && console.log("[SDK][getSdpOfferOptions] ", "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction, "options: ", options);
        });
      },
      watchForIceCandidates: function watchForIceCandidates(candidate) {
        var manager = this;

        if (metadataInstance.isIceCandidateIntervalSet()) {
          return;
        } //callUsers[config.userId].topicMetaData[config.topic].interval


        metadataInstance.setIceCandidateInterval(setInterval(function () {
          if (callUsers[config.userId].topicMetaData[config.topic].sdpAnswerReceived === true) {
            consoleLogging && console.log("[SDK][watchForIceCandidates][setInterval] sdpAnswerReceived, topic:", config.topic);
            callUsers[config.userId].topicMetaData[config.topic].sdpAnswerReceived = false; // manager.removeTopicIceCandidateInterval();

            metadataInstance.clearIceCandidateInterval();
            sendCallMessage({
              id: 'ADD_ICE_CANDIDATE',
              topic: config.topic,
              candidateDto: candidate
            }, null, {});
          }
        }, 500, {
          candidate: candidate
        }));
      },
      establishPeerConnection: function establishPeerConnection(options) {
        var WebRtcFunction = config.direction === 'send' ? 'WebRtcPeerSendonly' : 'WebRtcPeerRecvonly',
            manager = this,
            user = callUsers[config.userId],
            topicElement = user.htmlElements[config.topic]; //topicMetaData = user.topicMetaData[config.topic];

        config.state = peerStates.CONNECTING;
        config.peer = new _kurentoUtils["default"].WebRtcPeer[WebRtcFunction](options, function (err) {
          consoleLogging && console.debug("[SDK][establishPeerConnection][KurentoUtils.WebRtcPeer][WebRtcFunction]: ", {
            options: options
          }, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);

          if (err) {
            var errorString = "[SDK][start/webRtc " + config.direction + "  " + config.mediaType + " Peer] Error: " + explainUserMediaError(err, config.mediaType);
            console.error(errorString);

            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_ERROR',
              code: 7000,
              message: errorString,
              environmentDetails: getSDKCallDetails()
            });

            return;
          }

          manager.watchRTCPeerConnection();

          if (config.direction === 'send') {
            startMedia(topicElement);

            if (callRequestController.cameraPaused) {
              currentModuleInstance.pauseCamera();
            }
          }

          if (callServerController.isJanus() && config.direction === 'receive') {
            var msgParams = {
              id: 'REGISTER_RECV_NOTIFICATION',
              topic: config.topic,
              mediaType: config.mediaType === 'video' ? 2 : 1
            };
            sendCallMessage(msgParams, null, {
              timeoutTime: 4000,
              timeoutRetriesCount: 5 // timeoutCallback(){
              //     sendCallMessage(msgParams, null, {});
              // }

            });
          } else {
            config.peer.generateOffer(function (err, sdpOffer) {
              consoleLogging && console.debug("[SDK][establishPeerConnection][generateOffer] GenerateOffer:: ", " sdpOffer: ", sdpOffer, " err: ", err);

              if (err) {
                var _errorString = "[SDK][start/WebRc " + config.direction + "  " + config.mediaType + " Peer/generateOffer] " + err;

                console.error(_errorString);

                _eventsModule.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_ERROR',
                  code: 7000,
                  message: _errorString,
                  environmentDetails: getSDKCallDetails()
                });

                return;
              }

              if (!config.sdpOfferRequestSent) {
                config.sdpOfferRequestSent = true;
                manager.sendSDPOfferRequestMessage(sdpOffer, 1);
              }
            });
          }
        });
      },
      sendSDPOfferRequestMessage: function sendSDPOfferRequestMessage(sdpOffer, retries) {
        var manager = this;
        sendCallMessage({
          id: config.direction === 'send' ? 'SEND_SDP_OFFER' : 'RECIVE_SDP_OFFER',
          sdpOffer: sdpOffer,
          useComedia: true,
          useSrtp: false,
          topic: config.topic,
          mediaType: config.mediaType === 'video' ? 2 : 1
        }, function (result) {
          if (result.done === 'FALSE' && retries > 0) {
            retries -= 1;
            manager.sendSDPOfferRequestMessage(sdpOffer);
          }
        }, {
          timeoutTime: 4000,
          timeoutRetriesCount: 5
        });
      },
      watchRTCPeerConnection: function watchRTCPeerConnection() {
        consoleLogging && console.log("[SDK][watchRTCPeerConnection] called with: ", "userId: ", config.userId, "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction);
        var manager = this,
            user = callUsers[config.userId]; // consoleLogging && console.log("[SDK][watchRTCPeerConnection] called with: ", callUsers, user);

        config.peer.peerConnection.onconnectionstatechange = function () {
          if (!user || !config.peer) {
            return; //avoid log errors
          }

          consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.connectionState);

          if (config.peer.peerConnection.connectionState === 'disconnected') {
            manager.removeConnectionQualityInterval();
          }

          if (config.peer.peerConnection.connectionState === "failed") {
            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_STATUS',
              errorCode: 7000,
              errorMessage: "Call Peer (".concat(config.topic, ") has failed!"),
              errorInfo: config.peer
            });

            if (chatMessaging.chatState) {
              manager.shouldReconnectTopic();
            }
          }

          if (config.peer.peerConnection.connectionState === 'connected') {
            if (config.mediaType === 'video') {
              if (config.direction === 'send') {
                user.topicMetaData[config.topic].connectionQualityInterval = setInterval(function () {
                  manager.checkConnectionQuality();
                }, 1000);
              }

              if (config.direction === 'receive') {
                _eventsModule.chatEvents.fireEvent("callEvents", {
                  type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
                  userId: config.userId
                });
              }
            }
          }
        };

        config.peer.peerConnection.oniceconnectionstatechange = function () {
          if (!user || !config.peer) {
            return; //avoid log errors
          }

          consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.iceConnectionState);

          if (config.peer.peerConnection.iceConnectionState === 'disconnected') {
            config.state = peerStates.DISCONNECTED;

            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_STATUS',
              errorCode: 7000,
              errorMessage: "Call Peer (".concat(config.topic, ") is disconnected!"),
              errorInfo: config.peer
            });

            consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, topic:', config.topic);
          }

          if (config.peer.peerConnection.iceConnectionState === "failed") {
            config.state = peerStates.FAILED;

            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_STATUS',
              errorCode: 7000,
              errorMessage: "Call Peer (".concat(config.topic, ") has failed!"),
              errorInfo: config.peer
            });

            if (chatMessaging.chatState) {
              manager.shouldReconnectTopic();
            }
          }

          if (config.peer.peerConnection.iceConnectionState === "connected") {
            if (config.direction === 'receive' && config.mediaType === 'audio') {
              manager.watchAudioLevel();
            }

            config.state = peerStates.CONNECTED;
            callRequestController.callEstablishedInMySide = true;

            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_STATUS',
              errorCode: 7000,
              errorMessage: "Call Peer (".concat(config.topic, ") has connected!"),
              errorInfo: config.peer
            });
          }
        };
      },
      watchAudioLevel: function watchAudioLevel() {
        var manager = this,
            audioCtx = new AudioContext(),
            stream = config.peer.getRemoteStream();

        if (config.peer && !stream) {
          setTimeout(function () {
            manager.watchAudioLevel();
          }, 500);
          return;
        }

        var audioSourceNode = audioCtx.createMediaStreamSource(stream),
            analyserNode = audioCtx.createScriptProcessor(2048, 1, 1);
        var instant = 0.0,
            counter = 0;

        analyserNode.onaudioprocess = function (event) {
          if (!config.peer) {
            analyserNode.removeEventListener('audioprocess', null);
            analyserNode.onaudioprocess = null;
          }

          counter++;

          if (counter % 20 !== 0) {
            return;
          } else {
            counter = 0;
          }

          var input = event.inputBuffer.getChannelData(0);
          var i;
          var sum = 0.0;
          var clipcount = 0;

          for (i = 0; i < input.length; ++i) {
            sum += input[i] * input[i];

            if (Math.abs(input[i]) > 0.99) {
              clipcount += 1;
            }
          }

          instant = Math.floor(Math.sqrt(sum / input.length) * 10000);

          _eventsModule.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: convertToAudioLevel(instant)
          });
        };

        analyserNode.fftSize = 256; // const bufferLength = analyserNode.frequencyBinCount;
        // const dataArray = new Uint8Array(bufferLength);

        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        function convertToAudioLevel(soundPower) {
          if (soundPower < 10) {
            return 0;
          } else if (soundPower >= 10 && soundPower < 100) {
            return 1;
          } else if (soundPower >= 100 && soundPower < 200) {
            return 2;
          } else if (soundPower >= 200 && soundPower < 300) {
            return 3;
          } else if (soundPower >= 300) {
            return 4;
          }
        }
      },
      checkConnectionQuality: function checkConnectionQuality() {
        if (!callUsers[config.userId] || !config.peer || !config.peer.peerConnection) {
          this.removeConnectionQualityInterval();
          return;
        }

        config.peer.peerConnection.getStats(null).then(function (stats) {
          //console.log(' watchRTCPeerConnection:: window.setInterval then(stats:', stats)
          //let statsOutput = "";
          var user = callUsers[config.userId],
              topicMetadata = user.topicMetaData[config.topic];
          stats.forEach(function (report) {
            if (report && report.type && report.type === 'remote-inbound-rtp') {
              /*statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                  `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;*/
              // Now the statistics for this report; we intentially drop the ones we
              // sorted to the top above
              if (!report['roundTripTime'] || report['roundTripTime'] > 1) {
                if (topicMetadata.poorConnectionCount === 10) {
                  _eventsModule.chatEvents.fireEvent('callEvents', {
                    type: 'POOR_VIDEO_CONNECTION',
                    subType: 'LONG_TIME',
                    message: 'Poor connection for a long time',
                    metadata: {
                      elementId: "uiRemoteVideo-" + config.topic,
                      topic: config.topic,
                      userId: config.userId
                    }
                  });
                }

                if (topicMetadata.poorConnectionCount > 3 && !topicMetadata.isConnectionPoor) {
                  //alert('Poor connection detected...');
                  consoleLogging && console.log('[SDK][checkConnectionQuality] Poor connection detected...');

                  _eventsModule.chatEvents.fireEvent('callEvents', {
                    type: 'POOR_VIDEO_CONNECTION',
                    subType: 'SHORT_TIME',
                    message: 'Poor connection detected',
                    metadata: {
                      elementId: "uiRemoteVideo-" + config.topic,
                      topic: config.topic,
                      userId: config.userId
                    }
                  });

                  topicMetadata.isConnectionPoor = true;
                  topicMetadata.poorConnectionCount = 0;
                  topicMetadata.poorConnectionResolvedCount = 0;
                  sendCallMetaData({
                    id: callMetaDataTypes.POORCONNECTION,
                    userid: config.userId,
                    content: {
                      title: 'Poor Connection',
                      description: config.topic
                    }
                  });
                } else {
                  callUsers[config.userId].topicMetaData[config.topic].poorConnectionCount++;
                }
              } else if (report['roundTripTime'] || report['roundTripTime'] < 1) {
                if (topicMetadata.poorConnectionResolvedCount > 3 && topicMetadata.isConnectionPoor) {
                  topicMetadata.poorConnectionResolvedCount = 0;
                  topicMetadata.poorConnectionCount = 0;
                  topicMetadata.isConnectionPoor = false;

                  _eventsModule.chatEvents.fireEvent('callEvents', {
                    type: 'POOR_VIDEO_CONNECTION_RESOLVED',
                    message: 'Poor connection resolved',
                    metadata: {
                      elementId: "uiRemoteVideo-" + config.topic,
                      topic: config.topic,
                      userId: config.userId
                    }
                  });

                  sendCallMetaData({
                    id: callMetaDataTypes.POORCONNECTIONRESOLVED,
                    userid: config.userId,
                    content: {
                      title: 'Poor Connection Resolved',
                      description: config.topic
                    }
                  });
                } else {
                  topicMetadata.poorConnectionResolvedCount++;
                }
              }
              /*Object.keys(report).forEach(function (statName) {
                  if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                      statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                  }
              });*/

            }
          }); //document.querySelector(".stats-box").innerHTML = statsOutput;
        });
      },
      removeConnectionQualityInterval: function removeConnectionQualityInterval() {
        if (callUsers[config.userId] && callUsers[config.userId].topicMetaData[config.topic]) {
          callUsers[config.userId].topicMetaData[config.topic]['poorConnectionCount'] = 0;
          clearInterval(callUsers[config.userId].topicMetaData[config.topic]['connectionQualityInterval']);
        }
      },
      shouldReconnectTopic: function shouldReconnectTopic() {
        var manager = this,
            iceConnectionState = config.peer.peerConnection.iceConnectionState;

        if (currentCallParams && Object.keys(currentCallParams).length) {
          if (callUsers[config.userId] && config.peer && iceConnectionState != 'connected') {
            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_STATUS',
              errorCode: 7000,
              errorMessage: "Call Peer (".concat(config.topic, ") is not in connected state, Restarting call in progress ...!"),
              errorInfo: config.peer
            });

            sendCallMessage({
              id: 'STOP',
              topic: config.topic
            }, function (result) {
              if (result.done === 'TRUE' || result.done === 'SKIP') {
                manager.reconnectTopic();
              }
              /* else if (result.done === 'SKIP') {
               manager.reconnectTopic();
              } */
              else {
                consoleLogging && console.log('STOP topic faced a problem', result);
                endCall({
                  callId: currentCallId
                });
                callStop();
              }
            }, {
              timeoutTime: 5000
            });
          }
        }
      },
      reconnectTopic: function reconnectTopic() {
        var manager = this;
        manager.removeTopic().then(function () {
          if (config.isScreenShare && screenShareInfo.isStarted()) {
            callStateController.addScreenShareToCall(config.direction, config.direction === 'send');
          } else {
            callStateController.appendUserToCallDiv(config.userId, callStateController.generateHTMLElements(config.userId));
            manager.createTopic();
          }
        });
      },
      createTopic: function createTopic() {
        var manager = this;

        if (callUsers[config.userId] && config.peer) {
          return;
        }

        this.generateSdpOfferOptions().then(function (options) {
          consoleLogging && console.debug("[SDK][generateSdpOfferOptions] Options for this request have been resolved: ", {
            options: options
          }, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);
          manager.establishPeerConnection(options);
        })["catch"](function (error) {
          console.error(error);
        });
      },
      removeTopic: function removeTopic() {
        var manager = this;
        return new Promise(function (resolve, reject) {
          if (config.peer) {
            config.sdpOfferRequestSent = false; // this.removeTopicIceCandidateInterval();

            metadataInstance.clearIceCandidateInterval();
            manager.removeConnectionQualityInterval();

            if (config.direction === 'send' && !config.isScreenShare) {
              /*let constraint = {
                  audio: config.mediaType === 'audio',
                  video: (config.mediaType === 'video' ? {
                      width: 640,
                      framerate: 15
                  } : false)
              }*/
              callStateController.removeStreamHTML(config.userId, config.topic);
              config.peer.dispose();
              config.peer = null;
              config.state = peerStates.DISCONNECTED;
              if (config.mediaType === 'audio') _deviceManager["default"].mediaStreams().stopAudioInput();

              if (config.mediaType === 'video') {
                _deviceManager["default"].mediaStreams().stopVideoInput();
              }
              /*navigator.mediaDevices.getUserMedia(constraint).then(function (stream) {
                  stream.getTracks().forEach(function (track) {
                      if(!!track) {
                          track.stop();
                      }
                  });
              }).catch(error => {
                  console.error("Could not free up some resources", error);
                  resolve(true);
              });*/


              resolve(true);
            } else {
              callStateController.removeStreamHTML(config.userId, config.topic);
              config.peer.dispose();
              config.peer = null;
              config.state = peerStates.DISCONNECTED;
              resolve(true);
            }
          }
        });
      }
    };
  }

  function peersHealthChecker() {
    var config = {
      healthCheckerInterval: null
    };

    function checkHealth() {
      var foundProblem = false;
      if (!callUsers || !callUsers.length) return;
      callUsers.forEach(function (user) {
        if (user.video) {
          if (user.videoTopicManager && (user.videoTopicManager.isPeerFailed() || user.videoTopicManager.isPeerDisconnected())) {
            user.videoTopicManager.removeTopic().then(function () {
              user.videoTopicManager.createTopic();
            });
            foundProblem = true;
            consoleLogging && console.debug("[SDK][HealthChecker] userId:", user.id, "topic:", user.videoTopicName);
          }
        }

        if (!user.mute) {
          if (user.audioTopicManager && (user.audioTopicManager.isPeerFailed() || user.audioTopicManager.isPeerDisconnected())) {
            user.audioTopicManager.removeTopic().then(function () {
              user.audioTopicManager.createTopic();
            });
            foundProblem = true;
            consoleLogging && console.debug("[SDK][HealthChecker] userId:", user.id, "topic:", user.audioTopicName);
          }
        }
      });

      if (foundProblem) {
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });
      }
    }

    return {
      startTopicsHealthCheck: function startTopicsHealthCheck() {
        config.healthCheckerInterval = setInterval(function () {
          checkHealth();
        }, 20000);
      },
      stopTopicsHealthCheck: function stopTopicsHealthCheck() {
        clearInterval(config.healthCheckerInterval);
      }
    };
  }

  function topicMetaDataManager(params) {
    var config = {
      userId: params.userId,
      topic: params.topic,
      interval: null,
      receivedSdpAnswer: false,
      connectionQualityInterval: null,
      poorConnectionCount: 0,
      poorConnectionResolvedCount: 0,
      isConnectionPoor: false
    };
    return {
      setIsConnectionPoor: function setIsConnectionPoor(state) {
        config.isConnectionPoor = state;
      },
      setReceivedSdpAnswer: function setReceivedSdpAnswer(state) {
        config.receivedSdpAnswer = state;
      },
      setIceCandidateInterval: function setIceCandidateInterval(id) {
        config.interval = id;
      },
      isConnectionPoor: function isConnectionPoor() {
        return config.isConnectionPoor;
      },
      isReceivedSdpAnswer: function isReceivedSdpAnswer() {
        return config.receivedSdpAnswer;
      },
      isIceCandidateIntervalSet: function isIceCandidateIntervalSet() {
        return config.interval !== null;
      },
      clearIceCandidateInterval: function clearIceCandidateInterval() {
        clearInterval(config.interval);
      }
    };
  }

  var init = function init() {},
      raiseCallError = function raiseCallError(errorObject, callBack, fireEvent) {
    (0, _errorHandler.raiseError)(errorObject, callBack, fireEvent, {
      eventName: 'callEvents',
      eventType: 'CALL_ERROR',
      environmentDetails: getSDKCallDetails()
    });
  },
      sendCallMessage = function sendCallMessage(message, callback, _ref) {
    var _ref$timeoutTime = _ref.timeoutTime,
        timeoutTime = _ref$timeoutTime === void 0 ? 0 : _ref$timeoutTime,
        _ref$timeoutRetriesCo = _ref.timeoutRetriesCount,
        timeoutRetriesCount = _ref$timeoutRetriesCo === void 0 ? 0 : _ref$timeoutRetriesCo;
    message.token = token;
    var uniqueId;

    if (typeof params.uniqueId != 'undefined') {
      uniqueId = params.uniqueId;
    } else {
      uniqueId = _utility["default"].generateUUID();
    }

    message.uniqueId = uniqueId;
    message.chatId = currentCallId;
    var data = {
      type: 3,
      content: {
        peerName: callServerController.getCurrentServer(),
        // callServerName,
        priority: 1,
        content: JSON.stringify(message),
        ttl: messageTtl
      }
    };

    if (typeof callback == 'function') {
      chatMessaging.messagesCallbacks[uniqueId] = callback;
    }

    asyncClient.send(data, function (res) {
      if (!res.hasError && callback) {// if (typeof callback == 'function') {
        //     callback(res);
        // }
        // if (chatMessaging.messagesCallbacks[uniqueId]) {
        //     delete chatMessaging.messagesCallbacks[uniqueId];
        // }
      }
    });

    if (timeoutTime || globalCallRequestTimeout > 0) {
      asyncRequestTimeouts[uniqueId] && clearTimeout(asyncRequestTimeouts[uniqueId]);
      asyncRequestTimeouts[uniqueId] = setTimeout(function () {
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          delete chatMessaging.messagesCallbacks[uniqueId];
        }

        if (timeoutRetriesCount) {
          consoleLogging && console.log("[SDK][sendCallMessage] Retrying call request. uniqueId :" + uniqueId, {
            message: message
          }); //timeoutCallback();

          sendCallMessage(message, callback, {
            timeoutTime: timeoutTime,
            timeoutRetriesCount: timeoutRetriesCount - 1
          });
        } else if (typeof callback == 'function') {
          /**
           * Request failed
           */
          callback({
            done: 'SKIP'
          });
        }
        /*  if (chatMessaging.messagesCallbacks[uniqueId]) {
              delete chatMessaging.messagesCallbacks[uniqueId];
          }*/

      }, timeoutTime || globalCallRequestTimeout);
    }
  },

  /**
   * Format Data To Make Call Participant
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @param threadId
   * @return {object} participant Object
   */
  formatDataToMakeCallParticipant = function formatDataToMakeCallParticipant(messageContent) {
    /**
     * + CallParticipantVO                   {object}
     *    - id                           {int}
     *    - joinTime                     {int}
     *    - leaveTime                    {int}
     *    - threadParticipant            {object}
     *    - sendTopic                    {string}
     *    - receiveTopic                 {string}
     *    - brokerAddress                {string}
     *    - active                       {boolean}
     *    - callSession                  {object}
     *    - callStatus                   {int}
     *    - createTime                   {int}
     *    - sendKey                      {string}
     *    - mute                         {boolean}
     */
    var participant = {
      id: messageContent.id,
      joinTime: messageContent.joinTime,
      leaveTime: messageContent.leaveTime,
      sendTopic: messageContent.sendTopic,
      receiveTopic: messageContent.receiveTopic,
      brokerAddress: messageContent.brokerAddress,
      active: messageContent.active,
      callSession: messageContent.callSession,
      callStatus: messageContent.callStatus,
      createTime: messageContent.createTime,
      sendKey: messageContent.sendKey,
      mute: messageContent.mute
    }; // Add Chat Participant if exist

    if (messageContent.participantVO) {
      participant.participantVO = messageContent.participantVO;
    } // Add Call Session if exist


    if (messageContent.callSession) {
      participant.callSession = messageContent.callSession;
    } // return participant;


    return JSON.parse(JSON.stringify(participant));
  },

  /**
   * Format Data To Make Call Message
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} Call message Object
   */
  formatDataToMakeCallMessage = function formatDataToMakeCallMessage(threadId, pushMessageVO) {
    /**
     * + CallVO                   {object}
     *    - id                    {int}
     *    - creatorId             {int}
     *    - type                  {int}
     *    - createTime            {string}
     *    - startTime             {string}
     *    - endTime               {string}
     *    - status                {int}
     *    - isGroup               {boolean}
     *    - callParticipants      {object}
     *    - partnerParticipantVO  {object}
     *    - conversationVO        {object}
     */
    var callMessage = {
      id: pushMessageVO.id,
      creatorId: pushMessageVO.creatorId,
      type: pushMessageVO.type,
      createTime: pushMessageVO.createTime,
      startTime: pushMessageVO.startTime,
      endTime: pushMessageVO.endTime,
      status: pushMessageVO.status,
      isGroup: pushMessageVO.isGroup,
      callParticipants: pushMessageVO.callParticipants,
      partnerParticipantVO: pushMessageVO.partnerParticipantVO,
      conversationVO: pushMessageVO.conversationVO
    }; // return pinMessage;

    return JSON.parse(JSON.stringify(callMessage));
  },

  /**
   * Reformat Call Participants
   *
   * This functions reformats given Array of call Participants
   * into proper call participant
   *
   * @access private
   *
   * @param {object}  participantsContent   Array of Call Participant Objects
   * @param {int}    threadId              Id of call
   *
   * @return {object} Formatted Call Participant Array
   */
  reformatCallParticipants = function reformatCallParticipants(participantsContent) {
    var returnData = [];

    for (var i = 0; i < participantsContent.length; i++) {
      returnData.push(formatDataToMakeCallParticipant(participantsContent[i]));
    }

    return returnData;
  },
      callReceived = function callReceived(params, callback) {
    var receiveCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECEIVE_CALL_REQUEST,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        receiveCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /* chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        }); */

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to ReceiveCall()'
      });

      return;
    }

    return chatMessaging.sendMessage(receiveCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      endCall = function endCall(params, callback) {
    consoleLogging && console.log('[SDK][endCall] called...');
    var endCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.END_CALL_REQUEST,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (!callRequestController.callEstablishedInMySide) {
      return;
    }

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        endCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /* chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        }); */

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to End the call!'
      });

      return;
    }
    /*if(callUsers && callUsers.length) {
        callStop();
    }*/


    return chatMessaging.sendMessage(endCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      startCallWebRTCFunctions = function startCallWebRTCFunctions(params, callback) {
    if (callDivId) {
      var callVideo = typeof params.video === 'boolean' ? params.video : true,
          callMute = typeof params.mute === 'boolean' ? params.mute : false;

      if (params.selfData) {
        callStateController.setupCallParticipant(params.selfData);
      }

      screenShareInfo.setOwner(params.screenShareOwner);
      screenShareInfo.setIsStarted(!!params.screenShareOwner);

      if (params.recordingOwner) {
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_RECORDING_STARTED',
          result: {
            id: params.recordingOwner
          }
        });
      }

      if (params.clientsList && params.clientsList.length) {
        for (var i in params.clientsList) {
          if (params.clientsList[i].userId !== chatMessaging.userInfo.id) callStateController.setupCallParticipant(params.clientsList[i]);
        }
      }

      callStateController.setupScreenSharingObject(params.screenShare);
      callback && callback(generateCallUIList());
      callStateController.createSessionInChat(Object.assign(params, {
        callVideo: callVideo,
        callAudio: !callMute
      }));
    } else {
      consoleLogging && console.log('No Call DIV has been declared!');
      return;
    }
  },
      generateCallUIList = function generateCallUIList() {
    var me = chatMessaging.userInfo.Id,
        callUIElements = {};

    for (var i in callUsers) {
      var tags = {};

      if (callUsers[i] && callUsers[i].htmlElements) {
        tags.container = callUsers[i].htmlElements.container;
        if (i === 'screenShare' && screenShareInfo.isStarted() || i != 'screenShare' && callUsers[i].video && callUsers[i].htmlElements[callUsers[i].videoTopicName]) tags.video = callUsers[i].htmlElements[callUsers[i].videoTopicName];
        if (!callUsers[i].mute && callUsers[i].htmlElements[callUsers[i].audioTopicName]) tags.audio = callUsers[i].htmlElements[callUsers[i].audioTopicName];
        callUIElements[i] = tags;
      }
    }

    return {
      uiElements: callUIElements
    };
  },
      callStateController = {
    createSessionInChat: function createSessionInChat(params) {
      currentCallParams = params;

      var callController = this,
          totalRetries = 1,
          message = {
        id: 'CREATE_SESSION',
        brokerAddress: params.brokerAddress,
        turnAddress: params.turnAddress.split(',')[0]
      },
          onResultCallback = function onResultCallback(res) {
        if (res.done === 'TRUE') {
          callStopQueue.callStarted = true;
          callController.startCall(params);
        }
        /*else if (res.done === 'SKIP') {
          callStopQueue.callStarted = true;
          callController.startCall(params);
        }*/

        /*else {
            consoleLogging && console.log('CREATE_SESSION faced a problem', res);
            endCall({
                callId: currentCallId
            });
        }*/

      }; // onTimeoutCallback = () => {
      // sendCallMessage(message, null, {});
      // };


      sendCallMessage(message, onResultCallback, {
        timeoutTime: 4000,
        timeoutRetriesCount: 5
      }); // sendCallMessage(message, onResultCallback, {timeoutCallback: onTimeoutCallback, timeoutRetriesCount: totalRetries} );
    },
    startCall: function startCall(params) {
      var callController = this;

      for (var i in callUsers) {
        if (i === "screenShare") {
          if (screenShareInfo.isStarted()) callStateController.addScreenShareToCall('receive', false);
          continue;
        }

        if (callUsers[i].video) {
          callController.startParticipantVideo(i);
        }

        if (callUsers[i].mute !== undefined && !callUsers[i].mute) {
          callController.startParticipantAudio(i);
        }
      } // setTimeout(()=>{
      //     callTopicHealthChecker.startTopicsHealthCheck();
      // }, 20000);

    },
    setupCallParticipant: function setupCallParticipant(participant) {
      var user = participant;
      user.topicMetaData = {}; // user.peers = {};

      user.videoTopicManager = new callTopicManager({
        userId: user.userId,
        topic: 'Vi-' + user.topicSend,
        mediaType: 'video',
        direction: user.userId === chatMessaging.userInfo.id ? 'send' : 'receive'
      });
      user.audioTopicManager = new callTopicManager({
        userId: user.userId,
        topic: 'Vo-' + user.topicSend,
        mediaType: 'audio',
        direction: user.userId === chatMessaging.userInfo.id ? 'send' : 'receive'
      });

      if (user.userId === chatMessaging.userInfo.id) {
        user.direction = 'send';
      } else {
        user.direction = 'receive';
      }

      user.videoTopicName = 'Vi-' + user.topicSend;
      user.audioTopicName = 'Vo-' + user.topicSend;
      user.audioStopManager = new devicePauseStopManager({
        userId: user.userId,
        mediaType: 'audio',
        timeout: callStreamCloseTimeout
      });

      if (user.mute) {
        user.audioStopManager.pauseStream();
        user.audioStopManager.stopStream();
      }

      user.videoStopManager = new devicePauseStopManager({
        userId: user.userId,
        mediaType: 'video',
        timeout: callStreamCloseTimeout
      });

      if (!user.video) {
        user.videoStopManager.pauseStream();
        user.videoStopManager.stopStream();
      }

      user.topicMetaData[user.videoTopicName] = {
        interval: null,
        receivedSdpAnswer: false,
        connectionQualityInterval: null,
        poorConnectionCount: 0,
        poorConnectionResolvedCount: 0,
        isConnectionPoor: false
      };
      user.topicMetaData[user.audioTopicName] = {
        interval: null,
        receivedSdpAnswer: false,
        connectionQualityInterval: null,
        poorConnectionCount: 0,
        poorConnectionResolvedCount: 0,
        isConnectionPoor: false
      };
      callUsers[user.userId] = user;
      this.appendUserToCallDiv(user.userId, this.generateHTMLElements(user.userId));
    },
    setupScreenSharingObject: function setupScreenSharingObject(topic) {
      var obj = {
        video: true
      };
      obj.topicMetaData = {};
      obj.direction = screenShareInfo.iAmOwner() ? 'send' : 'receive';
      obj.videoTopicManager = new callTopicManager({
        userId: 'screenShare',
        topic: topic,
        mediaType: 'video',
        direction: obj.direction,
        isScreenShare: true
      });
      obj.videoTopicName = topic;
      obj.topicMetaData[obj.videoTopicName] = {
        interval: null,
        receivedSdpAnswer: false,
        connectionQualityInterval: null,
        poorConnectionCount: 0,
        poorConnectionResolvedCount: 0,
        isConnectionPoor: false
      };
      callUsers['screenShare'] = obj; // if(screenShareInfo.isStarted())
      //     this.appendUserToCallDiv('screenShare', this.generateHTMLElements('screenShare'));
      // else

      this.generateHTMLElements('screenShare');
    },
    appendUserToCallDiv: function appendUserToCallDiv(userId) {
      if (!callDivId) {
        consoleLogging && console.log('No Call DIV has been declared!');
        return;
      }

      var user = callUsers[userId];
      var callParentDiv = document.getElementById(callDivId);

      if (user.video) {
        if (!document.getElementById("callParticipantWrapper-" + userId)) {
          if (!document.getElementById("uiRemoteVideo-" + user.videoTopicName)) {
            user.htmlElements.container.appendChild(user.htmlElements[user.videoTopicName]);
          }
        } else {
          document.getElementById("callParticipantWrapper-" + userId).append(user.htmlElements[user.videoTopicName]);
        }
      }

      if (typeof user.mute !== "undefined" && !user.mute) {
        if (!document.getElementById("callParticipantWrapper-" + userId)) {
          if (!document.getElementById("uiRemoteAudio-" + user.videoTopicName)) {
            user.htmlElements.container.appendChild(user.htmlElements[user.audioTopicName]);
          }
        } else {
          document.getElementById("callParticipantWrapper-" + userId).append(user.htmlElements[user.audioTopicName]);
        }
      }

      if (!document.getElementById("callParticipantWrapper-" + userId)) callParentDiv.appendChild(user.htmlElements.container);
    },
    generateHTMLElements: function generateHTMLElements(userId) {
      var user = callUsers[userId];

      if (!user.htmlElements) {
        user.htmlElements = {
          container: document.createElement('div')
        };
        var el = user.htmlElements.container;
        el.setAttribute('id', 'callParticipantWrapper-' + userId);
        el.classList.add('participant');
        el.classList.add('wrapper');
        el.classList.add('user-' + userId);
        el.classList.add(userId === chatMessaging.userInfo.id ? 'local' : 'remote');
      }

      if (user.video && !user.htmlElements[user.videoTopicName]) {
        user.htmlElements[user.videoTopicName] = document.createElement('video');
        var _el = user.htmlElements[user.videoTopicName];

        _el.setAttribute('id', 'uiRemoteVideo-' + user.videoTopicName);

        _el.setAttribute('class', callVideoTagClassName);

        _el.setAttribute('playsinline', '');

        _el.setAttribute('muted', '');

        _el.setAttribute('width', callVideoMinWidth + 'px');

        _el.setAttribute('height', callVideoMinHeight + 'px');
      }

      if (typeof user.mute !== 'undefined' && !user.mute && !user.htmlElements[user.audioTopicName]) {
        user.htmlElements[user.audioTopicName] = document.createElement('audio');
        var _el2 = user.htmlElements[user.audioTopicName];

        _el2.setAttribute('id', 'uiRemoteAudio-' + user.audioTopicName);

        _el2.setAttribute('class', callAudioTagClassName);

        _el2.setAttribute('autoplay', '');

        if (user.direction === 'send') _el2.setAttribute('muted', '');

        _el2.setAttribute('controls', '');
      }

      return user.htmlElements;
    },
    removeParticipant: function removeParticipant(userId) {
      var user = callUsers[userId];
      if (!user) return;

      if (user.videoTopicManager && user.videoTopicManager.getPeer()) {
        user.videoTopicManager.removeTopic();
      }

      if (user.audioTopicManager && user.audioTopicManager.getPeer()) {
        user.audioTopicManager.removeTopic();
      }

      if (callUsers[userId]) {
        // callUsers[userId].peers = {};
        callUsers[userId].topicMetaData = {};
        callUsers[userId].htmlElements = {};
        callUsers[userId] = null;
      }
    },
    startParticipantAudio: function startParticipantAudio(userId) {
      callUsers[userId].audioTopicManager.createTopic(); // this.createTopic(userId, callUsers[userId].audioTopicName, 'audio', callUsers[userId].direction);
    },
    startParticipantVideo: function startParticipantVideo(userId) {
      callUsers[userId].videoTopicManager.createTopic(); // this.createTopic(userId, callUsers[userId].videoTopicName, 'video', callUsers[userId].direction);
    },
    getTurnServer: function getTurnServer(params) {
      if (!!params.turnAddress && params.turnAddress.length > 0 || useInternalTurnAddress && !!params.internalTurnAddress && params.turnAddress.length > 0) {
        var serversTemp = useInternalTurnAddress ? params.internalTurnAddress.split(',') : params.turnAddress.split(','),
            turnsList = [];

        for (var i in serversTemp) {
          turnsList.push({
            "urls": "turn:" + serversTemp[i],
            "username": "mkhorrami",
            "credential": "mkh_123456"
          });
        }

        return turnsList;
      } else {
        return [{
          "urls": "turn:" + callTurnIp + ":3478",
          "username": "mkhorrami",
          "credential": "mkh_123456"
        }];
      }
    },
    maybeReconnectAllTopics: function maybeReconnectAllTopics() {
      if (!callUsers || !Object.keys(callUsers).length || !callRequestController.callEstablishedInMySide) return;

      for (var i in callUsers) {
        // let videoTopic = callUsers[i].videoTopicName, audioTopic = callUsers[i].audioTopicName;
        if (callUsers[i]) {
          if (callUsers[i].videoTopicManager && callUsers[i].videoTopicManager.getPeer() && callUsers[i].videoTopicManager.getPeer().peerConnection.connectionState === 'failed') {
            callUsers[i].videoTopicManager.shouldReconnectTopic();
          }

          if (callUsers[i].audioTopicManager && callUsers[i].audioTopicManager.getPeer() && callUsers[i].audioTopicManager.getPeer().peerConnection.connectionState === 'failed') {
            callUsers[i].audioTopicManager.shouldReconnectTopic();
          }
        }
      }
    },
    removeStreamHTML: function removeStreamHTML(userId, topic) {
      if (callUsers[userId] && callUsers[userId].htmlElements && callUsers[userId].htmlElements[topic]) {
        var stream = callUsers[userId].htmlElements[topic].srcObject;

        if (!!stream) {
          var tracks = stream.getTracks();

          if (!!tracks) {
            tracks.forEach(function (track) {
              track.stop();
            });
          }

          callUsers[userId].htmlElements[topic].srcObject = null;
        }

        callUsers[userId].htmlElements[topic].remove();
        delete callUsers[userId].htmlElements[topic];
      }
    },
    addScreenShareToCall: function addScreenShareToCall(direction, shareScreen) {
      if (direction !== callUsers["screenShare"].direction) {
        callUsers['screenShare'].direction = direction;
        callUsers['screenShare'].videoTopicManager.setDirection(direction);
      }

      callUsers['screenShare'].videoTopicManager.setIsScreenShare(shareScreen);
      var callController = this,
          screenShare = callUsers["screenShare"];

      if (!screenShare.videoTopicManager.getPeer()) {
        if (!screenShare.htmlElements[screenShare.videoTopicName]) {
          callStateController.generateHTMLElements('screenShare');
        }

        setTimeout(function () {
          callStateController.appendUserToCallDiv('screenShare');
          screenShare.videoTopicManager.createTopic();
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });
      } else {
        screenShare.videoTopicManager.removeTopic();

        if (!screenShare.htmlElements[screenShare.videoTopicName]) {
          callStateController.generateHTMLElements('screenShare');
        }

        callStateController.appendUserToCallDiv('screenShare');
        screenShare.videoTopicManager.createTopic();
        startMedia(screenShare.htmlElements[screenShare.videoTopicName]);
      }
    },
    removeScreenShareFromCall: function removeScreenShareFromCall() {
      var screenShare = callUsers["screenShare"];

      if (screenShare && screenShareInfo.isStarted()) {
        screenShareInfo.setIsStarted(false);
        screenShare.videoTopicManager.removeTopic();

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });
      }
    },
    removeAllCallParticipants: function removeAllCallParticipants() {
      var removeAllUsersPromise = new Promise(function (resolve, reject) {
        var index = 0;

        var _loop = function _loop(i) {
          index++;
          var user = callUsers[i];

          if (user) {
            if (user.videoTopicManager && user.videoTopicManager.getPeer()) {
              user.videoTopicManager.removeTopic();
            }

            if (user.audioTopicManager && user.audioTopicManager.getPeer()) {
              user.audioTopicManager.removeTopic();
            }

            setTimeout(function () {
              if (callUsers[i]) {
                // callUsers[i].peers = {};
                callUsers[i].topicMetaData = {};
                callUsers[i].htmlElements = {};
                callUsers[i] = null;
              }

              if (index === Object.keys(callUsers).length) resolve();
            }, 200);
          }
        };

        for (var i in callUsers) {
          _loop(i);
        }
      });
      removeAllUsersPromise.then(function () {
        callUsers = {};
      });
    },
    findUserIdByTopic: function findUserIdByTopic(topic) {
      for (var i in callUsers) {
        if (callUsers[i] && (callUsers[i].videoTopicName === topic || callUsers[i].audioTopicName === topic)) {
          //peer = callUsers[i].peers[jsonMessage.topic];
          return i;
        }
      }
    },
    activateParticipantStream: function activateParticipantStream(userId, mediaType, direction, topicNameKey, sendTopic, mediaKey) {
      if (callUsers[userId]) {
        callUsers[userId][mediaKey] = mediaKey !== 'mute';
        callUsers[userId][topicNameKey] = (mediaType === 'audio' ? 'Vo-' : 'Vi-') + sendTopic;
        callStateController.appendUserToCallDiv(userId, callStateController.generateHTMLElements(userId));
        setTimeout(function () {
          callUsers[userId][mediaType + 'TopicManager'].createTopic();
        });
      }
    },
    deactivateParticipantStream: function deactivateParticipantStream(userId, mediaType, mediaKey) {
      if (callUsers[userId]) {
        callUsers[userId][mediaKey] = mediaKey === 'mute' ? true : false; // var user = callUsers[userId];
        // var topicNameKey = mediaType === 'audio' ? 'audioTopicName' : 'videoTopicName';

        callUsers[userId][mediaType + 'TopicManager'].removeTopic();
      }
    },
    setMediaBitrates: function setMediaBitrates(sdp) {
      return this.setMediaBitrate(this.setMediaBitrate(sdp, "video", 400), "audio", 50);
    },
    setMediaBitrate: function setMediaBitrate(sdp, media, bitrate) {
      var lines = sdp.split("\n");
      var line = -1;

      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("m=" + media) === 0) {
          line = i;
          break;
        }
      }

      if (line === -1) {
        consoleLogging && console.debug("[SDK][setMediaBitrate] Could not find the m line for", media);
        return sdp;
      }

      consoleLogging && console.debug("[SDK][setMediaBitrate] Found the m line for", media, "at line", line); // Pass the m line

      line++; // Skip i and c lines

      /* while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
          line++;
      }*/
      // If we're on a b line, replace it

      if (lines[line].indexOf("b") === 0) {
        consoleLogging && console.debug("[SDK][setMediaBitrate] Replaced b line at line", line);
        lines[line] = "b=AS:" + bitrate;
        return lines.join("\n");
      } // Add a new b line


      consoleLogging && console.debug("[SDK][setMediaBitrate] Adding new b line before line", line);
      var newLines = lines.slice(0, line);
      newLines.push("b=AS:" + bitrate + "\r");
      newLines = newLines.concat(lines.slice(line, lines.length));
      consoleLogging && console.debug("[SDK][setMediaBitrate] output: ", newLines.join("\n"));
      return newLines.join("\n");
    }
  },
      sendCallSocketError = function sendCallSocketError(message) {
    _eventsModule.chatEvents.fireEvent('callEvents', {
      type: 'CALL_ERROR',
      code: 7000,
      message: message,
      environmentDetails: getSDKCallDetails()
    });

    sendCallMessage({
      id: 'ERROR',
      message: message
    }, null, {});
  },
      explainUserMediaError = function explainUserMediaError(err, deviceType, deviceSource) {
    /*chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: err,
        environmentDetails: getSDKCallDetails()
    });*/
    var n = err.name;

    if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks",
        environmentDetails: getSDKCallDetails()
      });

      alert("Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks");
      return "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks";
    } else if (n === 'NotReadableError' || n === 'TrackStartError') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use",
        environmentDetails: getSDKCallDetails()
      });

      alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use");
      return (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use";
    } else if (n === 'OverconstrainedError' || n === 'ConstraintNotSatisfiedError') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks",
        environmentDetails: getSDKCallDetails()
      });

      alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks");
      return (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks";
    } else if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: (deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user",
        environmentDetails: getSDKCallDetails()
      });

      alert((deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user");
      return (deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user";
    } else if (n === 'TypeError') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "No media tracks have been requested",
        environmentDetails: getSDKCallDetails()
      });

      return "No media tracks have been requested";
    } else {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "Unknown error: " + err,
        environmentDetails: getSDKCallDetails()
      });

      return "Unknown error: " + err;
    }
  },
      startMedia = function startMedia(media) {
    consoleLogging && console.log("[SDK][startMedia] called with: ", media);
    media.play()["catch"](function (err) {
      if (err.name === 'NotAllowedError') {
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[startMedia] Browser doesn't allow playing media: " + err,
          environmentDetails: getSDKCallDetails()
        });
      } else {
        if (callStopQueue.callStarted) _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[startMedia] Error in media.play(): " + err,
          environmentDetails: getSDKCallDetails()
        });
      }
    });
  },
      restartMedia = function restartMedia(videoTopicName, userId) {
    if (currentCallParams && Object.keys(currentCallParams).length && !callRequestController.cameraPaused) {
      consoleLogging && console.log('[SDK] Sending Key Frame ...');
      var videoTopic = !!videoTopicName ? videoTopicName : callUsers[chatMessaging.userInfo.id].videoTopicName;
      var videoElement = document.getElementById("uiRemoteVideo-".concat(videoTopic));
      var isScreenShare = userId === 'screenShare';

      if (videoElement) {
        var videoTrack = videoElement.srcObject.getTracks()[0];
        var width = isScreenShare ? screenShareInfo.getWidth() : callVideoMinWidth,
            height = isScreenShare ? screenShareInfo.getHeight() : callVideoMinHeight,
            rand = Math.random(),
            newWidth = width - 5,
            newHeight = height - 5;

        if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
          // videoTrack.enable = false;
          newWidth = width - 80;
          newHeight = height - 80;
          videoTrack.applyConstraints({
            // width: {
            //     min: newWidth,
            //     ideal: 1280
            // },
            // height: {
            //     min: newHeight,
            //     ideal: 720
            // },
            width: newWidth,
            height: newHeight,
            advanced: [{
              aspectRatio: 1.77
            }]
          }).then(function (res) {
            videoTrack.enabled = true;
            setTimeout(function () {
              videoTrack.applyConstraints({
                width: width,
                height: height,
                advanced: [{
                  aspectRatio: 1.77
                }]
              });
            }, 500);
          })["catch"](function (e) {
            return consoleLogging && console.log(e);
          });
        } else {
          videoTrack.applyConstraints({
            width: newWidth,
            height: newHeight,
            advanced: [{
              aspectRatio: 1.77
            }]
          }).then(function (res) {
            setTimeout(function () {
              videoTrack.applyConstraints({
                width: width,
                height: height,
                advanced: [{
                  aspectRatio: 1.77
                }]
              });
            }, 500);
          })["catch"](function (e) {
            return consoleLogging && console.log(e);
          });
        }
      }
    }
  },
      subscribeToReceiveOffers = function subscribeToReceiveOffers(jsonMessage) {
    if (jsonMessage.upOrDown === true) {
      //TRUE if participant is sending data on this topic
      sendCallMessage({
        id: 'SUBSCRIBE',
        useComedia: true,
        useSrtp: false,
        topic: jsonMessage.topic,
        mediaType: jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2 : 1 //brokerAddress:brkrAddr

      }, null, {
        timeoutTime: 4000,
        timeoutRetriesCount: 5
      });
    }
  },
      handleProcessSdpOffer = function handleProcessSdpOffer(jsonMessage) {
    var userId = callStateController.findUserIdByTopic(jsonMessage.topic),
        topicManager,
        peer; //callUsers[userId].peers[jsonMessage.topic];

    if (jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
      topicManager = callUsers[userId].videoTopicManager;
      peer = callUsers[userId].videoTopicManager.getPeer();
    } else if (jsonMessage.topic.indexOf('Vo-') !== -1) {
      topicManager = callUsers[userId].audioTopicManager;
      peer = callUsers[userId].audioTopicManager.getPeer();
    }

    if (peer == null) {
      console.warn("[handleProcessSdpAnswer] Skip, no WebRTC Peer");
      return;
    }

    peer.processOffer(jsonMessage.sdpOffer, function (err, sdpAnswer) {
      if (err) {
        console.error("[SDK][handleProcessSdpOffer] Error: " + err);
        stop();
        return;
      }

      sendCallMessage({
        id: 'RECIVE_SDP_ANSWER',
        sdpAnswer: sdpAnswer,
        useComedia: true,
        useSrtp: false,
        topic: jsonMessage.topic,
        mediaType: jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2 : 1
      }, null, {
        timeoutTime: 4000,
        timeoutRetriesCount: 5
      });
      callUsers[userId].topicMetaData[jsonMessage.topic].sdpAnswerReceived = true;
      startMedia(callUsers[userId].htmlElements[jsonMessage.topic]);

      if (userId == 'screenShare' || userId == chatMessaging.userInfo.id) {
        restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000]);
      }
    });
  },
      handleProcessSdpAnswer = function handleProcessSdpAnswer(jsonMessage) {
    var userId = callStateController.findUserIdByTopic(jsonMessage.topic),
        topicManager,
        peer; // = callUsers[userId].peers[jsonMessage.topic];

    if (userId && callUsers[userId]) {
      if (jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
        topicManager = callUsers[userId].videoTopicManager;
        peer = callUsers[userId].videoTopicManager.getPeer();
      } else if (jsonMessage.topic.indexOf('Vo-') !== -1) {
        topicManager = callUsers[userId].audioTopicManager;
        peer = callUsers[userId].audioTopicManager.getPeer();
      }
    }

    if (peer == null) {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleProcessSdpAnswer] Skip, no WebRTC Peer",
        error: peer,
        environmentDetails: getSDKCallDetails()
      });

      return;
    }

    peer.processAnswer(jsonMessage.sdpAnswer, function (err) {
      if (err) {
        sendCallSocketError("[handleProcessSdpAnswer] Error: " + err);

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[handleProcessSdpAnswer] Error: " + err,
          environmentDetails: getSDKCallDetails()
        });

        return;
      }

      consoleLogging && console.log("[SDK][handleProcessSdpAnswer]", jsonMessage, jsonMessage.topic, topicManager.metadata().isIceCandidateIntervalSet().toString());

      if (topicManager.metadata().isIceCandidateIntervalSet()) {
        callUsers[userId].topicMetaData[jsonMessage.topic].sdpAnswerReceived = true;
        startMedia(callUsers[userId].htmlElements[jsonMessage.topic]);

        if (userId == 'screenShare' || userId == chatMessaging.userInfo.id) {
          restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000, 20000]);
        }
      }
    });
  },
      handleAddIceCandidate = function handleAddIceCandidate(jsonMessage) {
    var userId = callStateController.findUserIdByTopic(jsonMessage.topic);
    var peer; //= callUsers[userId].peers[jsonMessage.topic];

    if (jsonMessage.topic.indexOf('Vi-') > -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
      peer = callUsers[userId].videoTopicManager.getPeer();
    } else if (jsonMessage.topic.indexOf('Vo-') > -1) {
      peer = callUsers[userId].audioTopicManager.getPeer();
    }

    if (peer == null) {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleAddIceCandidate] Skip, no WebRTC Peer",
        error: JSON.stringify(peer),
        environmentDetails: getSDKCallDetails()
      });

      return;
    }

    peer.addIceCandidate(jsonMessage.candidate, function (err) {
      if (err) {
        console.error("[handleAddIceCandidate] " + err);

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[handleAddIceCandidate] " + err,
          error: JSON.stringify(jsonMessage.candidate),
          environmentDetails: getSDKCallDetails()
        });

        return;
      }
    });
  },
      handlePartnerFreeze = function handlePartnerFreeze(jsonMessage) {
    if (!!jsonMessage && !!jsonMessage.topic && jsonMessage.topic.substring(0, 2) === 'Vi') {
      restartMedia(jsonMessage.topic);
      setTimeout(function () {
        restartMedia(jsonMessage.topic);
      }, 4000);
      setTimeout(function () {
        restartMedia(jsonMessage.topic);
      }, 8000);
    }
  },
      handleError = function handleError(jsonMessage, sendingTopic, receiveTopic) {
    var errMessage = jsonMessage.message;

    _eventsModule.chatEvents.fireEvent('callEvents', {
      type: 'CALL_ERROR',
      code: 7000,
      message: "Kurento error: " + errMessage,
      environmentDetails: getSDKCallDetails()
    });
  },

  /*
          releaseResource = function (mediaType) {
              let constraint = {
                  audio: mediaType === 'audio',
                  video: (mediaType === 'video' ? {
                      width: 640,
                      framerate: 15
                  } : false)
              }
              navigator.mediaDevices.getUserMedia(constraint).then(function (stream) {
                  stream.getTracks().forEach(function (track) {
                      if(!!track) {
                          track.stop();
                      }
                  });
  
              }).catch(error => {
                  consoleLogging && console.error(error)
              })
          },
  */
  callStop = function callStop() {
    var resetCallOwner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var resetCurrentCallId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var resetCameraPaused = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    // callTopicHealthChecker.stopTopicsHealthCheck();
    _deviceManager["default"].mediaStreams().stopVideoInput();

    _deviceManager["default"].mediaStreams().stopAudioInput();

    _deviceManager["default"].mediaStreams().stopScreenShareInput();

    callStateController.removeAllCallParticipants();

    if (callStopQueue.callStarted) {
      sendCallMessage({
        id: 'CLOSE'
      }, null, {});
      callStopQueue.callStarted = false;
    }

    if (resetCameraPaused) callRequestController.cameraPaused = false;
    callRequestController.callEstablishedInMySide = false;
    callRequestController.callRequestReceived = false;
    clearTimeout(callRequestController.callRequestTimeout);
    if (resetCallOwner) callRequestController.imCallOwner = false;
    currentCallParams = {};
    if (resetCurrentCallId) currentCallId = null;
  },
      restartMediaOnKeyFrame = function restartMediaOnKeyFrame(userId, timeouts) {
    if (callServerController.isJanus()) return;

    for (var i = 0; i < timeouts.length; i++) {
      setTimeout(function () {
        if (typeof callUsers[userId] !== "undefined" && callUsers[userId] && callUsers[userId].videoTopicManager.getPeer()) //callUsers[userId].peers[callUsers[userId].videoTopicName]
          restartMedia(callUsers[userId].videoTopicName, userId);
      }, timeouts[i]);
    }
  },
      sendCallMetaData = function sendCallMetaData(params) {
    var message = {
      id: params.id,
      userid: params.userid,
      content: params.content || undefined
    };
    sendCallMessage({
      id: 'SENDMETADATA',
      message: JSON.stringify(message),
      chatId: currentCallId
    }, null, {});
  },
      handleReceivedMetaData = function handleReceivedMetaData(jsonMessage, uniqueId) {
    var jMessage = JSON.parse(jsonMessage.message);
    var id = jMessage.id;

    if (!id || typeof id === "undefined" || jsonMessage.userid == chatMessaging.userInfo.id) {
      return;
    }

    switch (id) {
      case callMetaDataTypes.POORCONNECTION:
        _eventsModule.chatEvents.fireEvent("callEvents", {
          type: 'POOR_VIDEO_CONNECTION',
          subType: 'SHORT_TIME',
          message: 'Poor connection detected',
          metadata: {
            elementId: "uiRemoteVideo-" + jMessage.content.description,
            topic: jMessage.content.description,
            userId: jMessage.userid
          }
        });

        break;

      case callMetaDataTypes.POORCONNECTIONRESOLVED:
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'POOR_VIDEO_CONNECTION_RESOLVED',
          message: 'Poor connection resolved',
          metadata: {
            elementId: "uiRemoteVideo-" + jMessage.content.description,
            topic: jMessage.content.description,
            userId: jMessage.userid
          }
        });

        break;

      case callMetaDataTypes.CUSTOMUSERMETADATA:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CUSTOM_USER_METADATA',
          userId: jMessage.userid,
          content: jMessage.content
        });

        break;

      case callMetaDataTypes.SCREENSHAREMETADATA:
        screenShareInfo.setWidth(jMessage.content.dimension.width);
        screenShareInfo.setHeight(jMessage.content.dimension.height); // applyScreenShareSizeToElement();

        restartMediaOnKeyFrame('screenShare', [10, 1000, 2000]);

        _eventsModule.chatEvents.fireEvent("callEvents", {
          type: 'SCREENSHARE_METADATA',
          userId: jMessage.userid,
          content: jMessage.content
        });

        break;
    }
  },
      applyScreenShareSizeToElement = function applyScreenShareSizeToElement() {
    var videoElement = callUsers['screenShare'].htmlElements[callUsers['screenShare'].videoTopicName];
    var videoTrack = videoElement.srcObject && videoElement.srcObject.getTracks() && videoElement.srcObject.getTracks().length ? videoElement.srcObject.getTracks()[0] : null;

    if (videoTrack) {
      if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
        videoTrack.enable = false;
        var newWidth = callVideoMinWidth - (Math.ceil(Math.random() * 50) + 20);
        var newHeight = callVideoMinHeight - (Math.ceil(Math.random() * 50) + 20);
        videoTrack.applyConstraints({
          advanced: [{
            width: screenShareInfo.getWidth(),
            height: screenShareInfo.getHeight()
          }, {
            aspectRatio: 1.333
          }]
        }).then(function (res) {
          videoTrack.enabled = true;
          setTimeout(function () {
            videoTrack.applyConstraints({
              "width": screenShareInfo.getWidth(),
              "height": screenShareInfo.getHeight()
            });
          }, 500);
        })["catch"](function (e) {
          return consoleLogging && console.log(e);
        });
      } else {
        videoTrack.applyConstraints({
          "width": screenShareInfo.getWidth() - (Math.ceil(Math.random() * 5) + 5)
        }).then(function (res) {
          setTimeout(function () {
            videoTrack.applyConstraints({
              "width": screenShareInfo.getWidth()
            });
          }, 500);
        })["catch"](function (e) {
          return consoleLogging && console.log(e);
        });
      }
    }
  },
      getSDKCallDetails = function getSDKCallDetails(customData) {
    return {
      currentUser: chatMessaging.userInfo,
      currentServers: {
        callTurnIp: callTurnIp
      },
      isJanus: currentCallId && callServerController.isJanus(),
      screenShareInfo: {
        isStarted: screenShareInfo.isStarted(),
        iAmOwner: screenShareInfo.iAmOwner()
      },
      callId: currentCallId,
      startCallInfo: currentCallParams,
      customData: customData
    };
  };

  this.updateToken = function (newToken) {
    token = newToken;
  };

  this.callMessageHandler = function (callMessage) {
    if (!currentCallId) return;
    var jsonMessage = typeof callMessage.content === 'string' && _utility["default"].isValidJson(callMessage.content) ? JSON.parse(callMessage.content) : callMessage.content,
        uniqueId = jsonMessage.uniqueId;

    if (jsonMessage.done !== 'FALSE' || jsonMessage.done === 'FALSE' && jsonMessage.desc === 'duplicated') {
      asyncRequestTimeouts[uniqueId] && clearTimeout(asyncRequestTimeouts[uniqueId]);
    } else if (jsonMessage.done === 'FALSE') {
      _eventsModule.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "Kurento error: " + (jsonMessage.desc ? jsonMessage.desc : jsonMessage.message),
        environmentDetails: getSDKCallDetails()
      });
    }

    switch (jsonMessage.id) {
      case 'PROCESS_SDP_ANSWER':
        handleProcessSdpAnswer(jsonMessage);
        break;

      case 'RECEIVING_MEDIA':
        // Only for receiving topics from janus, first we subscribe
        subscribeToReceiveOffers(jsonMessage);
        break;

      case 'PROCESS_SDP_OFFER':
        //Then janus sends offers
        handleProcessSdpOffer(jsonMessage);
        break;

      case 'ADD_ICE_CANDIDATE':
        handleAddIceCandidate(jsonMessage);
        break;

      case 'GET_KEY_FRAME':
        if (callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
          restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000, 4000, 8000, 12000]);
        }

        if (callUsers && callUsers['screenShare'] && callUsers['screenShare'].video && screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
          restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000]);
        }

        break;

      case 'FREEZED':
        handlePartnerFreeze(jsonMessage);
        break;

      /*case 'STOPALL':
          if (chatMessaging.messagesCallbacks[uniqueId]) {
              chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
          }
          break;*/

      case 'STOP':
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
        }

        break;

      case 'CLOSE':
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
        }

        break;

      case 'SESSION_NEW_CREATED':
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
        }

        break;

      case 'SESSION_REFRESH':
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
        }

        break;

      case 'RECEIVEMETADATA':
        handleReceivedMetaData(jsonMessage, uniqueId);
        break;

      case 'ERROR':
        handleError(jsonMessage, params.sendingTopic, params.receiveTopic);
        break;

      case 'SEND_SDP_OFFER':
      case 'RECIVE_SDP_OFFER':
      case 'SDP_ANSWER_RECEIVED':
        break;

      default:
        console.warn("[SDK][onmessage] Invalid message, id: " + jsonMessage.id, jsonMessage);

        if (jsonMessage.match(/NOT CREATE SESSION/g)) {
          if (currentCallParams && Object.keys(currentCallParams)) {
            //handleCallSocketOpen(currentCallParams);
            callStateController.createSessionInChat(currentCallParams);
          }
        }

        break;
    }

    chatMessaging.messagesCallbacks[uniqueId] && delete chatMessaging.messagesCallbacks[uniqueId];
  };

  this.asyncInitialized = function (async) {
    asyncClient = async;
    asyncClient.on('asyncReady', function () {
      callStateController.maybeReconnectAllTopics();
    });
  };
  /**
   * Do not process the message if is not for current call
   *
   * @param type
   * @param threadId
   * @return {boolean}
   */


  function shouldNotProcessChatMessage(type, threadId) {
    var restrictedMessageTypes = [_constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.CALL_PARTICIPANT_JOINED, _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.RECONNECT, _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL, _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL, _constants.chatMessageVOTypes.DESTINED_RECORD_CALL, _constants.chatMessageVOTypes.RECORD_CALL, _constants.chatMessageVOTypes.RECORD_CALL_STARTED, _constants.chatMessageVOTypes.END_RECORD_CALL, _constants.chatMessageVOTypes.TERMINATE_CALL, _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE // chatMessageVOTypes.END_CALL
    ];

    if (!callStopQueue.callStarted && restrictedMessageTypes.includes(type)) {
      return true;
    } else {
      return false;
    }
    /* if((!currentCallId || currentCallId && threadId != currentCallId) && restrictedMessageTypes.includes(type)){
        return true;
    } else {
        return false
    } */

  }

  this.handleChatMessages = function (type, messageContent, contentCount, threadId, uniqueId) {
    consoleLogging && console.debug("[SDK][CALL_MODULE][handleChatMessages]", "type:", type, "threadId:", threadId, "currentCallId:", currentCallId, "shouldNotProcessChatMessage:", shouldNotProcessChatMessage(type, threadId));

    if (shouldNotProcessChatMessage(type, threadId)) {
      return;
    }

    switch (type) {
      /**
       * Type 70    Send Call Request
       */
      case _constants.chatMessageVOTypes.CALL_REQUEST:
        callRequestController.callRequestReceived = true;
        callReceived({
          callId: messageContent.callId
        }, function (r) {});

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.threadId = threadId;

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'RECEIVE_CALL',
          result: messageContent
        });

        if (messageContent.callId > 0) {
          if (!currentCallId) {
            currentCallId = messageContent.callId;
          }
        } else {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'PARTNER_RECEIVED_YOUR_CALL',
            result: messageContent
          });
        }

        break;

      /**
       * Type 71    Accept Call Request
       */

      case _constants.chatMessageVOTypes.ACCEPT_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'ACCEPT_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 72    Reject Call Request
       */

      case _constants.chatMessageVOTypes.REJECT_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'REJECT_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 73    Receive Call Request
       */

      case _constants.chatMessageVOTypes.RECEIVE_CALL_REQUEST:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (messageContent.callId > 0) {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'RECEIVE_CALL',
            result: messageContent
          });

          if (!currentCallId) {
            currentCallId = messageContent.callId;
          }
        } else {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'PARTNER_RECEIVED_YOUR_CALL',
            result: messageContent
          });
        }

        break;

      /**
       * Type 74    Start Call (Start sender and receivers)
       */

      case _constants.chatMessageVOTypes.START_CALL:
        if (!callRequestController.iCanAcceptTheCall()) {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'CALL_STARTED_ELSEWHERE',
            message: 'Call already started somewhere else..., aborting...'
          });

          return;
        }

        callStop(false, false, false);

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.callId = threadId;

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STARTED',
          result: messageContent
        });

        if ((0, _typeof2["default"])(messageContent) === 'object' && messageContent.hasOwnProperty('chatDataDto') && !!messageContent.chatDataDto.kurentoAddress) {
          callServerController.setServers(messageContent.chatDataDto.kurentoAddress.split(','));
          startCallWebRTCFunctions({
            video: messageContent.clientDTO.video,
            mute: messageContent.clientDTO.mute,
            sendingTopic: messageContent.clientDTO.topicSend,
            receiveTopic: messageContent.clientDTO.topicReceive,
            screenShare: messageContent.chatDataDto.screenShare,
            brokerAddress: messageContent.chatDataDto.brokerAddressWeb,
            turnAddress: messageContent.chatDataDto.turnAddress,
            internalTurnAddress: messageContent.chatDataDto.internalTurnAddress,
            selfData: messageContent.clientDTO,
            clientsList: messageContent.otherClientDtoList,
            screenShareOwner: +messageContent.chatDataDto.screenShareUser,
            recordingOwner: +messageContent.chatDataDto.recordingUser
          }, function (callDivs) {
            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_DIVS',
              result: callDivs
            });
          });
        } else {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            message: 'Chat Data DTO is not present!',
            environmentDetails: getSDKCallDetails()
          });
        }

        break;

      /**
       * Type 75    End Call Request
       */

      case _constants.chatMessageVOTypes.END_CALL_REQUEST:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'END_CALL',
          result: messageContent
        });

        callStop();
        break;

      /**
       * Type 76   Call Ended
       */

      case _constants.chatMessageVOTypes.END_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ENDED',
          callId: threadId
        });

        if (threadId === currentCallId && callStopQueue.callStarted) callStop();
        break;

      /**
       * Type 77    Get Calls History
       */

      case _constants.chatMessageVOTypes.GET_CALLS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 78    Call Partner Reconnecting
       */

      case _constants.chatMessageVOTypes.RECONNECT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_RECONNECTING',
          result: messageContent
        });

        break;

      /**
       * Type 79    Call Partner Connects
       */

      case _constants.chatMessageVOTypes.CONNECT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_CONNECTED',
          result: messageContent
        });

        if (callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
          restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000, 4000, 8000, 12000]);
        }

        if (callUsers && callUsers['screenShare'] && screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
          restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000]);
        }

        break;

      /**
       * Type 90    Contacts Synced
       */

      case _constants.chatMessageVOTypes.CONTACT_SYNCED:
        _eventsModule.chatEvents.fireEvent('contactEvents', {
          type: 'CONTACTS_SYNCED',
          result: messageContent
        });

        break;

      /**
       * Type 91    Send Group Call Request
       */

      case _constants.chatMessageVOTypes.GROUP_CALL_REQUEST:
        callRequestController.callRequestReceived = true;
        callReceived({
          callId: messageContent.callId
        }, function (r) {});

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (messageContent.callId > 0) {
          if (!currentCallId) {
            currentCallId = messageContent.callId;
          }
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'RECEIVE_CALL',
          result: messageContent
        }); //currentCallId = messageContent.callId;


        break;

      /**
       * Type 92    Call Partner Leave
       * 1. I have left the call (GroupCall)
       * 2. Other person has left the call (GroupCall)
       */

      case _constants.chatMessageVOTypes.LEAVE_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_LEFT',
          callId: threadId,
          result: messageContent
        });

        if (currentCallId != threadId) return; //If I'm the only call participant, stop the call

        if (callUsers && Object.values(callUsers).length >= 1) {
          if (Object.values(callUsers).length < 2) {
            _eventsModule.chatEvents.fireEvent('callEvents', {
              type: 'CALL_ENDED',
              callId: threadId
            });

            callStop();
            return;
          }

          if (!!messageContent[0].userId) {
            //console.log("chatMessageVOTypes.LEAVE_CALL: ", messageContent[0].userId, chatMessaging.userInfo.id)
            if (messageContent[0].userId == chatMessaging.userInfo.id) {
              callStop();
            } else {
              callStateController.removeParticipant(messageContent[0].userId);
              if (screenShareInfo.isStarted() && screenShareInfo.getOwner() === messageContent[0].userId) callStateController.removeScreenShareFromCall();
            }
          }
        }

        break;

      /**
       * Type 93    Add Call Participant
       */

      case _constants.chatMessageVOTypes.ADD_CALL_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 94    Call Participant Joined
       */

      case _constants.chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (Array.isArray(messageContent)) {
          var _loop2 = function _loop2(i) {
            var correctedData = {
              video: messageContent[i].video,
              mute: messageContent[i].mute,
              userId: messageContent[i].userId,
              topicSend: messageContent[i].sendTopic
            };
            callStateController.removeParticipant(correctedData.userId);
            setTimeout(function () {
              callStateController.setupCallParticipant(correctedData);

              if (correctedData.video) {
                callStateController.startParticipantVideo(correctedData.userId);
              }

              if (!correctedData.mute) {
                callStateController.startParticipantAudio(correctedData.userId);
              }
            }, 500);
          };

          for (var i in messageContent) {
            _loop2(i);
          }
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_JOINED',
          result: messageContent
        });

        if (callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
          restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000, 4000, 8000, 12000, 16000, 24000]);
        }

        if (callUsers && callUsers['screenShare'] && callUsers['screenShare'].video && screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
          sendCallMetaData({
            id: callMetaDataTypes.SCREENSHAREMETADATA,
            userid: chatMessaging.userInfo.id,
            content: {
              dimension: {
                width: screenShareInfo.getWidth(),
                height: screenShareInfo.getHeight()
              }
            }
          });
          restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000, 16000, 24000]);
        }

        break;

      /**
       * Type 95    Remove Call Participant
       */

      case _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_REMOVED',
          result: messageContent
        });

        break;

      /**
       * Type 96    Terminate Call
       */

      case _constants.chatMessageVOTypes.TERMINATE_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'TERMINATE_CALL',
          result: messageContent
        });

        callStop();
        break;

      /**
       * Type 97    Mute Call Participant
       */

      case _constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (Array.isArray(messageContent)) {
          var pause;

          for (var _i in messageContent) {
            // pause = messageContent[i].userId == chatMessaging.userInfo.id;
            callUsers[messageContent[_i].userId].audioStopManager.disableStream(); // callStateController.deactivateParticipantStream(
            //     messageContent[i].userId,
            //     'audio',
            //     'mute'
            // )

          }
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_MUTE',
          result: messageContent
        });

        break;

      /**
       * Type 98    UnMute Call Participant
       */

      case _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        var myId = chatMessaging.userInfo.id;

        if (Array.isArray(messageContent)) {
          for (var _i2 in messageContent) {
            var cUserId = messageContent[_i2].userId;

            if (callUsers[cUserId].audioStopManager.isStreamPaused()) {
              if (callUsers[cUserId].audioStopManager.isStreamStopped()) {
                callStateController.activateParticipantStream(cUserId, 'audio', myId === cUserId ? 'send' : 'receive', 'audioTopicName', callUsers[cUserId].topicSend, 'mute');
              } else if (myId === cUserId) {
                currentModuleInstance.resumeMice({});
              }

              callUsers[cUserId].audioStopManager.reset();
            }
            /*                            callStateController.activateParticipantStream(
                                        messageContent[i].userId,
                                        'audio',
                                        //TODO: Should send in here when chat server fixes the bug
                                        'receive',   //(messageContent[i].userId === chatMessaging.userInfo.id ? 'send' : 'receive'),
                                        'audioTopicName',
                                        messageContent[i].sendTopic,
                                        'mute'
                                    );*/

          }
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: generateCallUIList()
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_UNMUTE',
          result: messageContent
        });

        break;

      /**
       * Type 99   Partner rejected call
       */

      case _constants.chatMessageVOTypes.CANCEL_GROUP_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'REJECT_GROUP_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 110    Active Call Participants List
       */

      case _constants.chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 111    Kafka Call Session Created
       */

      case _constants.chatMessageVOTypes.CALL_SESSION_CREATED:
        if (!callRequestController.callEstablishedInMySide) return;

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_SESSION_CREATED',
          result: messageContent
        });

        if (!currentCallId) currentCallId = messageContent.callId; //currentCallId = messageContent.callId;

        break;

      /**
       * Type 113    Turn On Video Call
       */

      case _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (Array.isArray(messageContent)) {
          for (var _i3 in messageContent) {
            callStateController.activateParticipantStream(messageContent[_i3].userId, 'video', messageContent[_i3].userId === chatMessaging.userInfo.id ? 'send' : 'receive', 'videoTopicName', messageContent[_i3].sendTopic, 'video');
          }
        }

        setTimeout(function () {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'CALL_DIVS',
            result: generateCallUIList()
          });
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'TURN_ON_VIDEO_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 114    Turn Off Video Call
       */

      case _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (Array.isArray(messageContent)) {
          for (var _i4 in messageContent) {
            callStateController.deactivateParticipantStream(messageContent[_i4].userId, 'video', 'video');
          }
        }

        setTimeout(function () {
          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'CALL_DIVS',
            result: generateCallUIList()
          });
        });

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'TURN_OFF_VIDEO_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 121    Record Call Request
       */

      case _constants.chatMessageVOTypes.RECORD_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'START_RECORDING_CALL',
          result: messageContent
        });

        restartMediaOnKeyFrame(chatMessaging.userInfo.id, [4000, 8000, 12000, 25000]);
        restartMediaOnKeyFrame("screenShare", [4000, 8000, 12000, 25000]);
        break;

      /**
       * Type 122   End Record Call Request
       */

      case _constants.chatMessageVOTypes.END_RECORD_CALL:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'STOP_RECORDING_CALL',
          result: messageContent
        });

        break;

      /**
       * Type 123   Start Screen Share
       */

      case _constants.chatMessageVOTypes.START_SCREEN_SHARE:
        if (!callRequestController.callEstablishedInMySide) return;
        screenShareInfo.setIsStarted(true);
        screenShareInfo.setOwner(messageContent.screenOwner.id);

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        } else if (!screenShareInfo.iAmOwner()) {
          callStateController.addScreenShareToCall("receive", false);
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'START_SCREEN_SHARE',
          result: messageContent
        });

        break;

      /**
       * Type 124   End Screen Share
       */

      case _constants.chatMessageVOTypes.END_SCREEN_SHARE:
        // screenShareInfo.setIAmOwner(false);
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        } else if (!screenShareInfo.iAmOwner()) {
          consoleLogging && console.log("[SDK][END_SCREEN_SHARE], im not owner of screen");
          callStateController.removeScreenShareFromCall();
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'END_SCREEN_SHARE',
          result: messageContent
        });

        break;

      /**
       * Type 125   Delete From Call List
       */

      case _constants.chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'DELETE_FROM_CALL_LIST',
          result: messageContent
        });

        break;

      /**
       * Type 126   Destinated Record Call Request
       */

      case _constants.chatMessageVOTypes.DESTINED_RECORD_CALL:
        if (!callRequestController.callEstablishedInMySide) return;

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'START_RECORDING_CALL',
          result: messageContent
        });

        restartMediaOnKeyFrame(chatMessaging.userInfo.id, [4000, 8000, 12000, 25000]);
        restartMediaOnKeyFrame("screenShare", [4000, 8000, 12000, 25000]);
        break;

      /**
       * Type 129   Get Calls To Join
       */

      case _constants.chatMessageVOTypes.GET_CALLS_TO_JOIN:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
      * Type 221  Event to tell us p2p call converted to a group call
      */

      case _constants.chatMessageVOTypes.SWITCH_TO_GROUP_CALL_REQUEST:
        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'SWITCH_TO_GROUP_CALL',
          result: messageContent //contains: isGroup, callId, threadId

        });

        break;

      /**
       * Type 222    Call Recording Started
       */

      case _constants.chatMessageVOTypes.RECORD_CALL_STARTED:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_RECORDING_STARTED',
          result: messageContent
        });

        break;

      /**
       * Type 225    Call Recording Started
       */

      case _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _eventsModule.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STICKER',
          result: messageContent
        });

        break;

      /**
       * Type 227    RECALL_THREAD_PARTICIPANT
       */

      case _constants.chatMessageVOTypes.RECALL_THREAD_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;
    }
  };

  this.startCall = function (params, callback) {
    var startCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.CALL_REQUEST,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    },
        content = {
      creatorClientDto: {}
    };

    if (params) {
      if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = callTypes[params.type.toUpperCase()];
      } else {
        content.type = 0x0; // Defaults to AUDIO Call
      }

      content.creatorClientDto.mute = params.mute && typeof params.mute === 'boolean' ? params.mute : false;
      content.mute = params.mute && typeof params.mute === 'boolean' ? params.mute : false;

      if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
        content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
      } else {
        content.creatorClientDto.clientType = callClientType.WEB;
      }

      if (typeof +params.threadId === 'number' && +params.threadId > 0) {
        content.threadId = +params.threadId;
      } else {
        if (Array.isArray(params.invitees) && params.invitees.length) {
          content.invitees = []; //params.invitees;

          for (var i = 0; i < params.invitees.length; i++) {
            var tempInvitee = params.invitees[i];

            if (tempInvitee && typeof tempInvitee.idType === "string") {
              tempInvitee.idType = _constants.inviteeVOidTypes[tempInvitee.idType];
              content.invitees.push(tempInvitee);
            }
          }
        } else {
          _eventsModule.chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
          });

          return;
        }
      }

      if (params.threadInfo && (params.threadInfo.metadata || params.threadInfo.uniqueName)) {
        content.createCallThreadRequest = params.threadInfo;
      }

      startCallData.content = JSON.stringify(content);
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to start call!'
      });

      return;
    }

    callRequestController.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : false;
    callRequestController.callRequestReceived = true;
    callRequestController.callEstablishedInMySide = true;
    callRequestController.imCallOwner = true;

    _deviceManager["default"].grantUserMediaDevicesPermissions({
      video: params.type == 'video',
      audio: !params.mute,
      closeStream: true
    }, function (result) {
      if (result.hasError) {
        callback && callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
        return;
      }

      if (callNoAnswerTimeout) {
        callRequestController.callRequestTimeout = setTimeout(function (metaData) {
          //Reject the call if participant didn't answer
          if (!callStopQueue.callStarted) {
            _eventsModule.chatEvents.fireEvent("callEvents", {
              type: "CALL_NO_ANSWER_TIMEOUT",
              message: "[CALL_SESSION_CREATED] Call request timed out, No answer"
            });

            metaData.callInstance.rejectCall({
              callId: metaData.currentCallId
            });
          }
        }, callNoAnswerTimeout, {
          callInstance: currentModuleInstance,
          currentCallId: currentCallId
        });
      }

      chatMessaging.sendMessage(startCallData, {
        onResult: function onResult(result) {
          callback && callback(result);
        }
      });
    });
  };

  this.startGroupCall = function (params, callback) {
    var startCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GROUP_CALL_REQUEST,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    },
        content = {
      creatorClientDto: {}
    };

    if (params) {
      if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = callTypes[params.type.toUpperCase()];
      } else {
        content.type = 0x0; // Defaults to AUDIO Call
      }

      content.creatorClientDto.mute = typeof params.mute === 'boolean' ? params.mute : false;

      if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
        content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
      } else {
        content.creatorClientDto.clientType = callClientType.WEB;
      }

      if (typeof +params.threadId === 'number' && params.threadId > 0) {
        content.threadId = +params.threadId;
      } else {
        if (Array.isArray(params.invitees)) {
          content.invitees = [];

          for (var i = 0; i < params.invitees.length; i++) {
            var tempInvitee = params.invitees[i];

            if (tempInvitee && typeof tempInvitee.idType === "string") {
              tempInvitee.idType = _constants.inviteeVOidTypes[tempInvitee.idType];
              content.invitees.push(tempInvitee);
            }
          }
        } else {
          _eventsModule.chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
          });

          return;
        }
      }

      if (params.threadInfo && (params.threadInfo.title || params.threadInfo.description || params.threadInfo.metadata || params.threadInfo.uniqueName)) {
        content.createCallThreadRequest = params.threadInfo;
      }

      startCallData.content = JSON.stringify(content);
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to start call!'
      });

      return;
    }

    callRequestController.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : false;
    callRequestController.callRequestReceived = true;
    callRequestController.callEstablishedInMySide = true;
    callRequestController.imCallOwner = true;

    _deviceManager["default"].grantUserMediaDevicesPermissions({
      video: params.type == 'video',
      audio: !params.mute,
      closeStream: true
    }, function (result) {
      if (result.hasError) {
        callback && callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
        return;
      }

      if (callNoAnswerTimeout) {
        callRequestController.callRequestTimeout = setTimeout(function (metaData) {
          //Reject the call if participant didn't answer
          if (!callStopQueue.callStarted) {
            _eventsModule.chatEvents.fireEvent("callEvents", {
              type: "CALL_NO_ANSWER_TIMEOUT",
              message: "[CALL_SESSION_CREATED] Call request timed out, No answer"
            });

            metaData.callInstance.rejectCall({
              callId: metaData.currentCallId
            });
          }
        }, callNoAnswerTimeout, {
          callInstance: currentModuleInstance,
          currentCallId: currentCallId
        });
      }

      chatMessaging.sendMessage(startCallData, {
        onResult: function onResult(result) {
          callback && callback(result);
        }
      });
    });
  };

  this.sendCallMetaData = function (params) {
    sendCallMetaData({
      id: callMetaDataTypes.CUSTOMUSERMETADATA,
      userid: chatMessaging.userInfo.id,
      content: params.content
    });
  };

  this.callReceived = callReceived;

  this.terminateCall = function (params, callback) {
    var terminateCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TERMINATE_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    },
        content = {};

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        terminateCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        });*/

        return;
      }

      terminateCallData.content = JSON.stringify(content);
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to terminate the call!'
      });

      return;
    }

    return chatMessaging.sendMessage(terminateCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.acceptCall = function (params, callback) {
    var acceptCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ACCEPT_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    },
        content = {};

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        acceptCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        });*/

        return;
      }

      content.mute = typeof params.mute === 'boolean' ? params.mute : false;
      content.video = typeof params.video === 'boolean' ? params.video : false;
      content.videoCall = content.video;
      callRequestController.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : callRequestController.cameraPaused;

      if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
        content.clientType = callClientType[params.clientType.toUpperCase()];
      } else {
        content.clientType = callClientType.WEB;
      }

      acceptCallData.content = JSON.stringify(content);

      if (params.joinCall) {
        callRequestController.callRequestReceived = true;
        currentCallId = params.callId;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to accept the call!'
      });

      return;
    }

    callRequestController.imCallOwner = false;
    callRequestController.callEstablishedInMySide = true;
    var isMovingToNewCall = false;
    new Promise(function (resolve, reject) {
      if (callStopQueue.callStarted) {
        isMovingToNewCall = true; // callStop(false);

        _eventsModule.chatEvents.fireEvent("callEvents", {
          type: 'MOVING_TO_NEW_CALL',
          status: 'PROCESSING',
          result: {
            oldCall: currentCallId,
            newCall: params.callId
          }
        });

        endCall({
          callId: currentCallId
        });
        setTimeout(function () {
          resolve(true);
          callRequestController.imCallOwner = false;
          callRequestController.callEstablishedInMySide = true;
          callRequestController.callRequestReceived = true;
          currentCallId = params.callId;

          _eventsModule.chatEvents.fireEvent('callEvents', {
            type: 'CALL_SESSION_CREATED',
            result: {
              callId: params.callId
            }
          });
        }, 3500);
      } else {
        resolve(true);
      }
    }).then(function () {
      if (isMovingToNewCall) _eventsModule.chatEvents.fireEvent("callEvents", {
        type: 'MOVING_TO_NEW_CALL',
        status: 'STARTING',
        result: {
          oldCall: currentCallId,
          newCall: params.callId
        }
      });

      _deviceManager["default"].grantUserMediaDevicesPermissions({
        video: params.video,
        audio: !params.mute,
        closeStream: true
      }, function (result) {
        if (result.hasError) {
          callback && callback({
            hasError: true,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
          });
          return;
        }

        chatMessaging.sendMessage(acceptCallData, {
          onResult: function onResult(result) {
            if (!result.hasError && isMovingToNewCall) {
              _eventsModule.chatEvents.fireEvent("callEvents", {
                type: 'MOVING_TO_NEW_CALL',
                status: 'DONE',
                result: {
                  oldCall: currentCallId,
                  newCall: params.callId
                }
              });
            } else {
              _eventsModule.chatEvents.fireEvent("callEvents", {
                type: 'MOVING_TO_NEW_CALL',
                status: 'FAILED',
                result: {
                  oldCall: currentCallId,
                  newCall: params.callId
                }
              });
            }

            callback && callback(result);
          }
        });
      });
    });
  };

  this.rejectCall = this.cancelCall = function (params, callback) {
    var rejectCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REJECT_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        rejectCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        });*/

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to reject the call!'
      });

      return;
    } // deviceManager.mediaStreams().stopAudioInput();
    // deviceManager.mediaStreams().stopVideoInput();


    return chatMessaging.sendMessage(rejectCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.endCall = endCall;

  this.startRecordingCall = function (params, callback) {
    var recordCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECORD_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token,
      content: {}
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        recordCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid Call id!'
        });*/

        return;
      }

      if (params.destinated === true) {
        recordCallData.chatMessageVOType = _constants.chatMessageVOTypes.DESTINED_RECORD_CALL;
        recordCallData.content.recordType = typeof +params.recordType === 'number' ? params.recordType : 1;
        recordCallData.content.tags = Array.isArray(params.tags) ? params.tags : null;
        recordCallData.content.threadId = typeof +params.threadId === 'number' ? params.threadId : null;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Record call!'
      });

      return;
    }

    return chatMessaging.sendMessage(recordCallData, {
      onResult: function onResult(result) {
        //restartMedia(callTopics['sendVideoTopic']);
        restartMediaOnKeyFrame(chatMessaging.userInfo.id, [100]);
        callback && callback(result);
      }
    });
  };

  this.stopRecordingCall = function (params, callback) {
    var stopRecordingCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.END_RECORD_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        stopRecordingCallData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid Call id!'
        });*/

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Stop Recording the call!'
      });

      return;
    }

    return chatMessaging.sendMessage(stopRecordingCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.startScreenShare = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.START_SCREEN_SHARE,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      subjectId: currentCallId,
      token: token
    };

    if (!sendData.subjectId) {
      raiseCallError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }

    if (screenShareInfo.isStarted()) {
      raiseCallError(_errorHandler.errorList.SCREENSHARE_ALREADY_STARTED, callback, true);
      return;
    }
    /* if (params) {
         if (typeof +params.callId === 'number' && params.callId > 0) {
             sendData.subjectId = +params.callId;
         } else {
             chatEvents.fireEvent('error', {
                 code: 999,
                 message: 'Invalid Call id!'
             });
             return;
         }
     } else {
         chatEvents.fireEvent('error', {
             code: 999,
             message: 'No params have been sent to Share Screen!'
         });
         return;
     }*/


    _deviceManager["default"].grantScreenSharePermission({
      closeStream: false
    }, function (result) {
      if (result.hasError) {
        callback && callback(result); //raiseError({result}, callback, true, {});

        return;
      }

      return chatMessaging.sendMessage(sendData, function (result) {
        consoleLogging && console.log("[sdk][startScreenShare][onResult]: ", result);

        if (result.hasError) {
          _deviceManager["default"].mediaStreams().stopScreenShareInput();
        } else {
          var direction = 'send',
              shareScreen = true;

          if (screenShareInfo.isStarted() && !screenShareInfo.iAmOwner()) {
            direction = 'receive';
            shareScreen = false;
          }

          if (screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
            var qualityObject = calculateScreenSize({
              quality: params.quality
            });
            screenShareInfo.setWidth(qualityObject.width);
            screenShareInfo.setHeight(qualityObject.height);
            sendCallMetaData({
              id: callMetaDataTypes.SCREENSHAREMETADATA,
              userid: chatMessaging.userInfo.id,
              content: {
                dimension: {
                  width: screenShareInfo.getWidth(),
                  height: screenShareInfo.getHeight()
                }
              }
            });
          }

          callStateController.addScreenShareToCall(direction, shareScreen);
        }

        callback && callback(result);
      });
    });
  };

  this.endScreenShare = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.END_SCREEN_SHARE,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token,
      subjectId: currentCallId
    };

    if (!sendData.subjectId) {
      raiseCallError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }

    if (!screenShareInfo.isStarted()) {
      raiseCallError(_errorHandler.errorList.SCREENSHARE_NOT_STARTED, callback, true);
      return;
    }

    if (!screenShareInfo.iAmOwner()) {
      raiseCallError(_errorHandler.errorList.NOT_SCREENSHARE_OWNER, callback, true);
      return;
    }

    if (!callUsers['screenShare'].videoTopicManager.getPeer()) {
      //.peers[callUsers['screenShare'].videoTopicName]
      consoleLogging && console.log('[SDK][endScreenShare] No screenShare connection available');
    } else {
      callStateController.removeScreenShareFromCall();
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  function calculateScreenSize(_ref2) {
    var _ref2$quality = _ref2.quality,
        quality = _ref2$quality === void 0 ? 3 : _ref2$quality;
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

  this.resizeScreenShare = function (params, callback) {
    var result = {};

    if (screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
      var qualityObj = calculateScreenSize({
        quality: params.quality
      });
      screenShareInfo.setWidth(qualityObj.width);
      screenShareInfo.setHeight(qualityObj.height); // applyScreenShareSizeToElement()

      restartMediaOnKeyFrame('screenShare', [10, 1000, 2000]);
      sendCallMetaData({
        id: callMetaDataTypes.SCREENSHAREMETADATA,
        userid: chatMessaging.userInfo.id,
        content: {
          dimension: {
            width: screenShareInfo.getWidth(),
            height: screenShareInfo.getHeight()
          }
        }
      });
      result.hasError = false;
    } else {
      result.hasError = true;
      result.errorMessage = 'You can not apply size to others ScreenShare or ScreenShare is not started';
    }

    callback && callback(result);
  };

  this.getCallsList = function (params, callback) {
    var getCallListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_CALLS,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    },
        content = {};

    if (params) {
      if (typeof params.count === 'number' && params.count >= 0) {
        content.count = +params.count;
      } else {
        content.count = 50;
      }

      if (typeof params.offset === 'number' && params.offset >= 0) {
        content.offset = +params.offset;
      } else {
        content.offset = 0;
      }

      if (typeof params.creatorCoreUserId === 'number' && params.creatorCoreUserId > 0) {
        content.creatorCoreUserId = +params.creatorCoreUserId;
      }

      if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
        content.creatorSsoId = +params.creatorSsoId;
      }

      if (typeof params.name === 'string') {
        content.name = params.name;
      }

      if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = callTypes[params.type.toUpperCase()];
      }

      if (Array.isArray(params.callIds)) {
        content.callIds = params.callIds;
      }

      if (typeof params.threadId === 'number' && +params.threadId > 0) {
        content.threadId = +params.threadId;
      }

      if (typeof params.contactType === 'string') {
        content.contactType = params.contactType;
      }

      if (typeof params.uniqueId === 'string') {
        content.uniqueId = params.uniqueId;
      }

      getCallListData.content = JSON.stringify(content);
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to End the call!'
      });

      return;
    }

    return chatMessaging.sendMessage(getCallListData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.getCallsToJoin = function (params, callback) {
    var getCallListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_CALLS_TO_JOIN,
      pushMsgType: 3,
      token: token
    },
        content = {};

    if (params) {
      if (typeof params.count === 'number' && params.count >= 0) {
        content.count = +params.count;
      } else {
        content.count = 50;
      }

      if (typeof params.offset === 'number' && params.offset >= 0) {
        content.offset = +params.offset;
      } else {
        content.offset = 0;
      }

      if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
        content.creatorSsoId = +params.creatorSsoId;
      }

      if (typeof params.name === 'string') {
        content.name = params.name;
      }

      if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = callTypes[params.type.toUpperCase()];
      }

      if (Array.isArray(params.threadIds)) {
        content.threadIds = params.threadIds;
      }

      if (typeof params.uniqueId === 'string') {
        content.uniqueId = params.uniqueId;
      }

      getCallListData.content = JSON.stringify(content);
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Invalid params'
      });

      return;
    }

    return chatMessaging.sendMessage(getCallListData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.deleteFromCallList = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_FROM_CALL_HISTORY,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.contactType === 'string' && params.contactType.length) {
        sendData.content.contactType = params.contactType;
      } else {
        _eventsModule.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should enter a contactType!'
        });

        return;
      }

      if (Array.isArray(params.callIds)) {
        sendData.content = params.callIds;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Delete a call from Call History!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  this.getCallParticipants = function (params, callback) {
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: {}
    };

    if (params) {
      if (isNaN(params.callId)) {
        _eventsModule.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Call Id should be a valid number!'
        });

        return;
      } else {
        var callId = +params.callId;
        sendMessageParams.subjectId = callId;
        var offset = parseInt(params.offset) > 0 ? parseInt(params.offset) : 0,
            count = parseInt(params.count) > 0 ? parseInt(params.count) : config.getHistoryCount;
        sendMessageParams.content.count = count;
        sendMessageParams.content.offset = offset;
        return chatMessaging.sendMessage(sendMessageParams, {
          onResult: function onResult(result) {
            var returnData = {
              hasError: result.hasError,
              cache: false,
              errorMessage: result.errorMessage,
              errorCode: result.errorCode
            };

            if (!returnData.hasError) {
              var messageContent = result.result,
                  messageLength = messageContent.length,
                  resultData = {
                participants: reformatCallParticipants(messageContent),
                contentCount: result.contentCount,
                hasNext: sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0,
                nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
              };
              returnData.result = resultData;
            }

            callback && callback(returnData);
            /**
             * Delete callback so if server pushes response before
             * cache, cache won't send data again
             */

            callback = undefined;

            if (!returnData.hasError) {
              _eventsModule.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANTS_LIST_CHANGE',
                threadId: callId,
                result: returnData.result
              });
            }
          }
        });
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Get Call Participants!'
      });

      return;
    }
  };

  this.addCallParticipants = function (params, callback) {
    /**
     * + AddCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of CONTACT IDs or inviteeVO Objects
     *    - uniqueId                    {string}
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_CALL_PARTICIPANT,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.contactIds)) {
        sendMessageParams.content = params.contactIds;
      }

      if (Array.isArray(params.usernames)) {
        sendMessageParams.content = [];

        for (var i = 0; i < params.usernames.length; i++) {
          sendMessageParams.content.push({
            id: params.usernames[i],
            idType: _constants.inviteeVOidTypes.TO_BE_USER_USERNAME
          });
        }
      }

      if (Array.isArray(params.coreUserids)) {
        sendMessageParams.content = [];

        for (var _i5 = 0; _i5 < params.coreUserids.length; _i5++) {
          sendMessageParams.content.push({
            id: params.coreUserids[_i5],
            idType: _constants.inviteeVOidTypes.TO_BE_CORE_USER_ID
          });
        }
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  this.removeCallParticipants = function (params, callback) {
    /**
     * + removeCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of Participants UserIds
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.userIds)) {
        sendMessageParams.content = params.userIds;
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  this.muteCallParticipants = function (params, callback) {
    /**
     * + muteCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of Participants UserIds
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.userIds)) {
        sendMessageParams.content = params.userIds;
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  this.unMuteCallParticipants = function (params, callback) {
    /**
     * + unMuteCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of Participants UserIds
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.userIds)) {
        sendMessageParams.content = params.userIds;
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  this.turnOnVideoCall = function (params, callback) {
    var turnOnVideoData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        turnOnVideoData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /*chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        });*/

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to turn on the video call!'
      });

      return;
    }

    var user = callUsers[chatMessaging.userInfo.id];

    if (user && user.videoTopicManager && user.videoTopicManager.getPeer() && (user.videoTopicManager.isPeerConnecting() || user.videoTopicManager.isPeerConnected())) {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Video stream is already open!'
      });

      return;
    }

    return chatMessaging.sendMessage(turnOnVideoData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.turnOffVideoCall = function (params, callback) {
    var turnOffVideoData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL,
      typeCode: generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        turnOffVideoData.subjectId = +params.callId;
      } else {
        (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /* chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        }); */

        return;
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to turn off the video call!'
      });

      return;
    }

    var user = callUsers[chatMessaging.userInfo.id];

    if (user && user.videoTopicManager && user.videoTopicManager.getPeer() && (user.videoTopicManager.isPeerConnecting() || user.videoTopicManager.isPeerFailed() || user.videoTopicManager.isPeerDisconnected())) {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Can not stop stream in current state'
      });

      return;
    }

    return chatMessaging.sendMessage(turnOffVideoData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.disableParticipantsVideoReceive = function (params, callback) {
    if (params) {
      if (Array.isArray(params.userIds) && params.userIds.length) {
        for (var i in params.userIds) {
          callStateController.deactivateParticipantStream(params.userIds[i], 'video', 'video');
        }

        callback && callback({
          hasError: false
        });
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to closeOthersVideoReceive'
      });

      return;
    }
  };

  this.enableParticipantsVideoReceive = function (params, callback) {
    if (params) {
      if (Array.isArray(params.userIds) && params.userIds.length) {
        for (var i in params.userIds) {
          callStateController.activateParticipantStream(params.userIds[i], 'video', 'receive', 'videoTopicName', callUsers[params.userIds[i]].topicSend, 'video');
        }

        callback && callback({
          hasError: false
        });
      }
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to closeOthersVideoReceive'
      });
    }
  };
  /**
   * Pauses camera-send without closing its topic
   * @param params
   * @param callback
   */


  this.pauseCamera = function (params, callback) {
    var me = callUsers[chatMessaging.userInfo.id];
    if (!Object.keys(callUsers).length || !me.videoTopicName || !me.videoTopicManager.getPeer()) //!me.peers[me.videoTopicName]
      return; // me.peers[me.videoTopicName].getLocalStream().getTracks()[0].enabled = false;

    me.videoTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = false;
    callback && callback();
  };

  this.resumeCamera = function (params, callback) {
    var me = callUsers[chatMessaging.userInfo.id];
    if (!Object.keys(callUsers).length || !me.videoTopicName || !me.videoTopicManager.getPeer()) //!me.peers[me.videoTopicName]
      return; // me.peers[me.videoTopicName].getLocalStream().getTracks()[0].enabled = true;

    me.videoTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = true;
    callback && callback();
  };
  /**
   * Pauses mice-send without closing its topic
   * @param params
   * @param callback
   */


  this.pauseMice = function (params, callback) {
    var me = callUsers[chatMessaging.userInfo.id];
    if (!Object.keys(callUsers).length || !me.audioTopicName || !me.audioTopicManager.getPeer()) //me.peers[me.audioTopicName]
      return; // me.peers[me.audioTopicName].getLocalStream().getTracks()[0].enabled = false;

    me.audioTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = false;
    callback && callback();
  };

  this.resumeMice = function (params, callback) {
    var me = callUsers[chatMessaging.userInfo.id];
    if (!Object.keys(callUsers).length || !me.audioTopicName || !me.audioTopicManager.getPeer()) //me.peers[me.audioTopicName]
      return; // me.peers[me.audioTopicName].getLocalStream().getTracks()[0].enabled = true;

    me.audioTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = true;
    callback && callback();
  };

  this.resizeCallVideo = function (params, callback) {
    if (params) {
      if (!!params.width && +params.width > 0) {
        callVideoMinWidth = +params.width;
      }

      if (!!params.height && +params.height > 0) {
        callVideoMinHeight = +params.height;
      }

      if (!callUsers[chatMessaging.userInfo.id]) {
        consoleLogging && console.log("Error in resizeCallVideo(), call not started ");
        return;
      }

      var userObject = callUsers[chatMessaging.userInfo.id]; //userObject.peers[userObject.videoTopicName]

      userObject.videoTopicManager.getPeer().getLocalStream().getTracks()[0].applyConstraints({
        "width": callVideoMinWidth,
        "height": callVideoMinHeight
      }).then(function (res) {
        userObject.htmlElements[userObject.videoTopicName].style.width = callVideoMinWidth + 'px';
        userObject.htmlElements[userObject.videoTopicName].style.height = callVideoMinHeight + 'px';
        callback && callback();
      })["catch"](function (e) {
        _eventsModule.chatEvents.fireEvent('error', {
          code: 999,
          message: e
        });
      });
    } else {
      _eventsModule.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to resize the video call! Send an object like {width: 640, height: 480}'
      });

      return;
    }
  };

  this.sendCallSticker = function (_ref3, callback) {
    var _ref3$sticker = _ref3.sticker,
        sticker = _ref3$sticker === void 0 ? _constants.callStickerTypes.RAISE_HAND : _ref3$sticker;
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: [sticker],
      subjectId: currentCallId
    };

    if (!sendMessageParams.subjectId) {
      (0, _errorHandler.raiseError)(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }

    if (!sticker || !Object.values(_constants.callStickerTypes).includes(sticker)) {
      raiseCallError(_errorHandler.errorList.INVALID_STICKER_NAME, callback, true);
      return;
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.recallThreadParticipant = function (_ref4, callback) {
    var invitees = _ref4.invitees;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECALL_THREAD_PARTICIPANT,
      typeCode: generalTypeCode,
      //params.typeCode,
      content: null,
      subjectId: currentCallId
    };

    if (!invitees || !Array.isArray(invitees) || !invitees.length) {
      raiseCallError(_errorHandler.errorList.INVITEES_LIST_REQUIRED, callback, true, {});
      return;
    }

    sendData.content = []; //params.invitees;

    invitees.forEach(function (item) {
      item.idType = _constants.inviteeVOidTypes[item.idType];
      sendData.content.push(item);
    });
    /* for (let i = 0; i < invitees.length; i++) {
         let tempInvitee = invitees[i];
             if (tempInvitee && typeof tempInvitee.idType === "string") {
             tempInvitee.idType = inviteeVOidTypes[tempInvitee.idType];
             sendData.content.push(tempInvitee);
         }
     }*/

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.deviceManager = _deviceManager["default"];
  this.callStop = callStop;
  this.restartMedia = restartMedia;
}

var _default = ChatCall;
exports["default"] = _default;