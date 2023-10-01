"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallTopicManager = CallTopicManager;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _errorHandler = require("../errorHandler");

var _sdkParams = require("../sdkParams");

var _events = require("../../events.module");

var _topicMetaDataManager = require("./topicMetaDataManager");

var _sharedData = require("./sharedData");

var _messaging = require("../../messaging.module");

var _callsList = require("./callsList");

var _webrtcPeer = require("./webrtcPeer");

var _utility = _interopRequireDefault(require("../../utility/utility"));

function CallTopicManager(_ref) {
  var callId = _ref.callId,
      userId = _ref.userId,
      user = _ref.user,
      topic = _ref.topic,
      mediaType = _ref.mediaType,
      direction = _ref.direction,
      deviceManager = _ref.deviceManager,
      isScreenShare = _ref.isScreenShare,
      onHTMLElement = _ref.onHTMLElement;
  var config = {
    callId: callId,
    userId: userId,
    user: user,
    state: 0,
    //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected
    peer: null,
    topic: topic,
    mediaType: mediaType,
    direction: direction,
    isScreenShare: isScreenShare,
    sdpOfferRequestSent: false,
    htmlElement: null,
    topicMetaData: {
      interval: null,
      receivedSdpAnswer: false,
      connectionQualityInterval: null,
      poorConnectionCount: 0,
      poorConnectionResolvedCount: 0,
      isConnectionPoor: false
    },
    isDestroyed: false,
    dataStream: null,
    statusEventsInterval: null,
    audioObject: null,
    alreadyAddedStreamTrackToElement: false
  };
  var metadataInstance = new _topicMetaDataManager.topicMetaDataManager({
    userId: userId,
    topic: topic
  });
  var peerStates = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    FAILED: 3,
    CONNECTED: 4
  };

  function removeStreamHTML() {
    if (!config.htmlElement) return;
    config.htmlElement.srcObject = null;
    config.htmlElement.remove();

    if (document.getElementById('callUserVideo-' + config.user.videoTopicName)) {
      document.getElementById('callUserVideo-' + config.user.videoTopicName).remove();
    }

    delete config.htmlElement;
  }

  function addStreamTrackToElement(stream) {
    if (config.alreadyAddedStreamTrackToElement) return;
    config.alreadyAddedStreamTrackToElement = true;
    config.dataStream = stream;

    if (config.mediaType == 'audio' && direction == 'receive') {
      config.audioObject = new Audio();
      config.audioObject.srcObject = stream;
      config.audioObject.srcObject = stream;
      config.audioObject.autoplay = true;
      config.audioObject.play();
      publicized.watchAudioLevel();
    } else if (config.mediaType == 'audio' && direction == 'send') {
      publicized.watchAudioLevel();
    } else {
      var htmlElement = publicized.getHtmlElement();
      htmlElement.mute = true;
      config.htmlElement.srcObject = stream;

      if (config.mediaType === "video") {
        config.htmlElement.load();
      }

      onHTMLElement(config.htmlElement);
    }
  }

  var publicized = {
    getHtmlElement: function getHtmlElement() {
      var elementUniqueId = _utility["default"].generateUUID();

      if (config.mediaType === 'video' && config.user.video && !config.htmlElement) {
        config.htmlElement = document.createElement('video');
        var el = config.htmlElement;
        el.setAttribute('id', 'callUserVideo-' + config.user.videoTopicName);
        el.setAttribute('class', _sharedData.sharedVariables.callVideoTagClassName);
        el.setAttribute('playsinline', '');
        el.setAttribute('muted', '');
        el.setAttribute('autoplay', '');
        el.setAttribute('data-uniqueId', elementUniqueId);
        el.setAttribute('width', _sharedData.sharedVariables.callVideoMinWidth + 'px');
        el.setAttribute('height', _sharedData.sharedVariables.callVideoMinHeight + 'px'); // el.setAttribute('controls', '');
      }

      return config.htmlElement;
    },
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
    createTopic: function createTopic() {
      var manager = this;

      if (config.peer) {
        return;
      }

      publicized.resumeSendStream();
      this.generateSdpOfferOptions().then(function (options) {
        _sdkParams.sdkParams.consoleLogging && console.debug("[SDK][generateSdpOfferOptions] Options for this request have been resolved: ", {
          options: options
        }, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);
        manager.establishPeerConnection(options);
      })["catch"](function (error) {
        console.error(error);
      });
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
            width: _sharedData.sharedVariables.callVideoMinWidth,
            height: _sharedData.sharedVariables.callVideoMinHeight,
            framerate: 15
          };
        }

        var options = {
          mediaConstraints: mediaConstraints,
          // iceTransportPolicy: 'relay',
          // onicecandidate: (candidate) => {
          //     topicManager.watchForIceCandidates(candidate)
          // },
          configuration: {
            iceServers: (0, _sharedData.currentCall)().getTurnServer((0, _sharedData.currentCall)().callConfig())
          }
        };

        if (config.direction === 'send') {
          if (config.mediaType === 'video') {
            if (config.isScreenShare) {
              (0, _sharedData.currentCall)().deviceManager().grantScreenSharePermission({
                closeStream: false
              }).then(function (stream) {
                // let stream = currentCall().deviceManager().mediaStreams.getScreenShareInput();
                if (!stream) {
                  reject("Error: could not find screenShareInput");
                } else {
                  var onScreenShareEndCallback = function onScreenShareEndCallback(event) {
                    // Click on browser UI stop sharing button
                    if (publicized.isDestroyed()) return;
                    stream.getVideoTracks()[0].removeEventListener("ended", onScreenShareEndCallback);

                    if (!publicized.isDestroyed() && config.peer) {
                      (0, _sharedData.endScreenShare)({
                        callId: config.callId
                      });
                    }
                  };

                  stream.getVideoTracks()[0].addEventListener("ended", onScreenShareEndCallback);
                  options.stream = stream;
                  options.sendSource = 'screen';
                  resolve(options);
                }
              })["catch"](function (error) {
                var errorString = "[SDK][grantScreenSharePermission][catch] " + JSON.stringify(error);
                console.error(errorString);
                (0, _sharedData.currentCall)().raiseCallError(_errorHandler.errorList.SCREENSHARE_PERMISSION_ERROR, null, true);
                publicized.explainUserMediaError(error, 'video', 'screen'); //resolve(options);

                (0, _sharedData.endScreenShare)({
                  callId: config.callId
                });
              });
            } else {
              (0, _sharedData.currentCall)().deviceManager().grantUserMediaDevicesPermissions({
                video: true
              }).then(function () {
                options.stream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getVideoInput();
                resolve(options);
              })["catch"](function (error) {
                reject(error);
              });
            }
          } else if (config.mediaType === 'audio') {
            (0, _sharedData.currentCall)().deviceManager().grantUserMediaDevicesPermissions({
              audio: true
            }).then(function () {
              var audioInput = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getAudioInput();
              (0, _sharedData.currentCall)().deviceManager().watchAudioInputStream((0, _sharedData.currentCall)().raiseCallError);
              options.stream = audioInput;
              resolve(options);
            })["catch"](function (error) {
              reject(error);
            });
          }
        } else {
          resolve(options);
        }

        _sdkParams.sdkParams.consoleLogging && console.log("[SDK][getSdpOfferOptions] ", "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction, "options: ", options);
      });
    },
    establishPeerConnection: function establishPeerConnection(options) {
      var manager = this,
          user = config.user,
          topicElement = config.htmlElement;
      config.state = peerStates.CONNECTING;
      config.peer = new _webrtcPeer.WebrtcPeerConnection({
        callId: config.callId,
        userId: config.userId,
        direction: config.direction,
        mediaType: config.mediaType,
        stream: options.stream,
        rtcPeerConfig: options.configuration,
        connectionStateChange: publicized.onConnectionStateChange,
        iceConnectionStateChange: publicized.onIceConnectionStateChange,
        onTrackCallback: addStreamTrackToElement
      }, function (err) {
        _sdkParams.sdkParams.consoleLogging && console.debug("[SDK][establishPeerConnection][KurentoUtils.WebRtcPeer][WebRtcFunction]: ", {
          options: options
        }, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);

        if (err) {
          var errorString = "[SDK][start/webRtc " + config.direction + "  " + config.mediaType + " Peer] Error: " + publicized.explainUserMediaError(err, config.mediaType);
          console.error(errorString);

          _events.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            code: 7000,
            message: errorString,
            environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
          });

          return;
        }

        if (config.direction === 'send') {
          //publicized.startMedia();
          if ((0, _sharedData.currentCall)().users().get(config.userId).user().cameraPaused) {
            publicized.pauseSendStream();
          }
        }

        if ((0, _sharedData.currentCall)().callServerController().isJanus() && config.direction === 'receive') {
          var msgParams = {
            id: 'REGISTER_RECV_NOTIFICATION',
            topic: config.topic,
            mediaType: config.mediaType === 'video' ? 2 : 1
          };
          (0, _sharedData.currentCall)().sendCallMessage(msgParams, null, {
            timeoutTime: 4000,
            timeoutRetriesCount: 5 // timeoutCallback(){
            //     sendCallMessage(msgParams, null, {});
            // }

          });
        } else {
          config.peer.generateOffer(function (err, sdpOffer) {
            // sdkParams.consoleLogging && console.debug("[SDK][establishPeerConnection][generateOffer] GenerateOffer:: ", " sdpOffer: ", sdpOffer, " err: ", err);
            if (err) {
              var _errorString = "[SDK][start/WebRc " + config.direction + "  " + config.mediaType + " Peer/generateOffer] " + err;

              console.error(_errorString);

              _events.chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: _errorString,
                environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
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
    onConnectionStateChange: function onConnectionStateChange() {
      _events.chatEvents.fireEvent("callStreamEvents", {
        type: 'WEBRTC_CONNECTION_STATE_CHANGE',
        callId: config.callId,
        userId: config.userId,
        topic: config.topic,
        direction: config.direction,
        connectionState: config.peer.peerConnection.connectionState,
        mediaType: config.mediaType
      });

      if (!config.peer || publicized.isDestroyed()) {
        return; //avoid log errors
      }

      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.connectionState);

      if (config.peer.peerConnection.connectionState === 'disconnected') {
        publicized.removeConnectionQualityInterval();
        publicized.removeAudioWatcherInterval();
      }

      if (config.peer.peerConnection.connectionState === "failed") {
        if (publicized.isPeerFailed()) return;
        config.state = peerStates.FAILED;

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(config.topic, ") has failed!"),
          errorInfo: config.peer
        });

        if ((0, _messaging.messenger)().chatState) {
          publicized.shouldReconnectTopic();
        }
      }

      if (config.peer.peerConnection.connectionState === 'connected') {
        config.state = peerStates.CONNECTED;

        if (config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
          config.topicMetaData.connectionQualityInterval = setInterval(function () {
            publicized.checkConnectionQuality();
          }, 1000);
        }
      }
    },
    onIceConnectionStateChange: function onIceConnectionStateChange() {
      if (!config.peer || publicized.isDestroyed()) {
        return; //avoid log errors
      }

      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.iceConnectionState);

      if (config.peer.peerConnection.iceConnectionState === 'disconnected') {
        config.state = peerStates.DISCONNECTED;

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(config.topic, ") is disconnected!"),
          errorInfo: config.peer
        });

        _sdkParams.sdkParams.consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, topic:', config.topic);
      }

      if (config.peer.peerConnection.iceConnectionState === "failed") {
        if (publicized.isPeerFailed()) return;
        config.state = peerStates.FAILED;

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(config.topic, ") has failed!"),
          errorInfo: config.peer
        });

        if ((0, _messaging.messenger)().chatState) {
          publicized.shouldReconnectTopic();
        }
      }

      if (config.peer.peerConnection.iceConnectionState === "connected") {
        config.state = peerStates.CONNECTED;

        if (config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
          config.topicMetaData.connectionQualityInterval = setInterval(function () {
            publicized.checkConnectionQuality();
          }, 1000);
        }

        if (config.mediaType === 'video') {
          if (config.direction === 'receive') {
            _events.chatEvents.fireEvent("callEvents", {
              type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
              userId: config.userId
            });
          }
        }

        config.state = peerStates.CONNECTED; // callRequestController.callEstablishedInMySide = true;

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(config.topic, ") has connected!"),
          errorInfo: config.peer
        });
      }
    },
    sendSDPOfferRequestMessage: function sendSDPOfferRequestMessage(sdpOffer, retries) {
      (0, _sharedData.currentCall)().sendCallMessage({
        id: config.direction === 'send' ? 'SEND_SDP_OFFER' : 'RECIVE_SDP_OFFER',
        sdpOffer: sdpOffer,
        useComedia: true,
        useSrtp: false,
        topic: config.topic,
        mediaType: config.mediaType === 'video' ? 2 : 1
      }, function (result) {
        if (result.done === 'FALSE' && retries > 0) {
          retries -= 1;
          publicized.sendSDPOfferRequestMessage(sdpOffer);
        }
      }, {
        timeoutTime: 4000,
        timeoutRetriesCount: 5
      });
    },
    watchAudioLevel: function watchAudioLevel() {
      var stream = config.dataStream;
      var user = config.user,
          topicMetadata = config.topicMetaData; // Create and configure the audio pipeline

      var analyzer = (0, _sharedData.audioCtx)().createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.1;
      var sourceNode = (0, _sharedData.audioCtx)().createMediaStreamSource(stream);
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
          _events.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: convertToAudioLevel(audioPeakDB),
            isNoise: false,
            isMute: false
          });
        } else if (audioPeakDB !== -Infinity && audioPeakDB < -60 && audioMeter > 0) {
          _events.chatEvents.fireEvent('callStreamEvents', {
            type: 'USER_SPEAKING',
            userId: config.userId,
            audioLevel: 0,
            isNoise: true,
            isMute: false
          });
        } else if (audioPeakDB === -Infinity && audioMeter == 0) {
          _events.chatEvents.fireEvent('callStreamEvents', {
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
    },
    checkConnectionQuality: function checkConnectionQuality() {
      if (!(0, _sharedData.currentCall)() || !(0, _sharedData.currentCall)().users().get(config.userId) || !config.peer || !config.peer.peerConnection) {
        this.removeConnectionQualityInterval();
        this.removeAudioWatcherInterval();
        return;
      }

      config.peer.peerConnection.getStats(null).then(function (stats) {
        // console.log(' watchRTCPeerConnection:: window.setInterval then(stats:', stats)
        // let statsOutput = "";
        var user = config.user,
            topicMetadata = config.topicMetaData;
        stats.forEach(function (report) {
          if (report && report.type && report.type === 'remote-inbound-rtp') {
            // statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
            //     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
            // Now the statistics for this report; we intentially drop the ones we
            // sorted to the top above
            if (!report['roundTripTime'] || report['roundTripTime'] > 1) {
              if (topicMetadata.poorConnectionCount === 10) {
                (0, _sharedData.currentCall)().sendQualityCheckEvent({
                  userId: config.userId,
                  topic: config.topic,
                  mediaType: config.mediaType,
                  isLongTime: true
                });
              }

              if (topicMetadata.poorConnectionCount > 3 && !topicMetadata.isConnectionPoor) {
                _sdkParams.sdkParams.consoleLogging && console.log('[SDK][checkConnectionQuality] Poor connection detected...');
                (0, _sharedData.currentCall)().sendQualityCheckEvent({
                  userId: config.userId,
                  topic: config.topic,
                  mediaType: config.mediaType
                });
                topicMetadata.isConnectionPoor = true;
                topicMetadata.poorConnectionCount = 0;
                topicMetadata.poorConnectionResolvedCount = 0;
              } else {
                config.topicMetaData.poorConnectionCount++;
              }
            } else if (report['roundTripTime'] || report['roundTripTime'] < 1) {
              if (topicMetadata.poorConnectionResolvedCount > 3 && topicMetadata.isConnectionPoor) {
                topicMetadata.poorConnectionResolvedCount = 0;
                topicMetadata.poorConnectionCount = 0;
                topicMetadata.isConnectionPoor = false;
                (0, _sharedData.currentCall)().sendQualityCheckEvent({
                  userId: config.userId,
                  topic: config.topic,
                  mediaType: config.mediaType,
                  isResolved: true
                });
              } else {
                topicMetadata.poorConnectionResolvedCount++;
              }
            } // Object.keys(report).forEach(function (statName) {
            //     if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
            //         statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
            //     }
            // });

          }
        }); // document.querySelector(".stats-box").innerHTML = statsOutput;
      });
    },
    removeConnectionQualityInterval: function removeConnectionQualityInterval() {
      if (config.topicMetaData) {
        config.topicMetaData.poorConnectionCount = 0;
        clearInterval(config.topicMetaData.connectionQualityInterval);
      }
    },
    removeAudioWatcherInterval: function removeAudioWatcherInterval() {
      if (config.topicMetaData) {
        clearInterval(config.topicMetaData.audioLevelInterval);
      }
    },
    shouldReconnectTopic: function shouldReconnectTopic() {
      var iceConnectionState = config.peer.peerConnection.iceConnectionState;

      if (!publicized.isDestroyed()) {
        if (config.peer && iceConnectionState != 'connected') {
          _events.chatEvents.fireEvent('callEvents', {
            type: 'CALL_STATUS',
            errorCode: 7000,
            errorMessage: "Call Peer (".concat(config.topic, ") is not in connected state, reconnecting peer ...!"),
            errorInfo: config.peer
          });

          (0, _sharedData.currentCall)().users().get(config.userId).reconnectTopic(config.mediaType);
        }
      }
    },
    explainUserMediaError: function explainUserMediaError(err, deviceType, deviceSource) {
      /*chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: err,
          environmentDetails: getSDKCallDetails()
      });*/
      var n = err.name;

      if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks",
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        alert("Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks");
        return "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks";
      } else if (n === 'NotReadableError' || n === 'TrackStartError') {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use",
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use");
        return (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use";
      } else if (n === 'OverconstrainedError' || n === 'ConstraintNotSatisfiedError') {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks",
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks");
        return (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks";
      } else if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: (deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user",
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        alert((deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user");
        return (deviceType === 'video' ? deviceSource === 'screen' ? 'ScreenShare' : 'Webcam' : 'Mice') + " permission has been denied by the user";
      } else if (n === 'TypeError') {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "No media tracks have been requested",
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        return "No media tracks have been requested";
      } else {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "Unknown error: " + err,
          environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
        });

        return "Unknown error: " + err;
      }
    },
    stopTopicOnServer: function stopTopicOnServer() {
      return new Promise(function (resolve) {
        (0, _callsList.callsManager)().get(config.callId).sendCallMessage({
          id: 'STOP',
          topic: config.topic
        }, function (result) {
          if (result.done === 'TRUE' || result.done === 'SKIP') {
            // manager.reconnectTopic();
            resolve();
          } else {
            console.warn("[SDK] SDK tried to stop the topic but failed.", config.topic);
          }
        }, {});
      });
    },
    removeTopic: function () {
      var _removeTopic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var manager;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                manager = this;
                if (direction == 'send') publicized.pauseSendStream();

                if (config.peer) {
                  manager.removeConnectionQualityInterval();
                  manager.removeAudioWatcherInterval();
                  removeStreamHTML();
                  config.peer.dispose();
                  config.peer = null;
                  config.state = peerStates.DISCONNECTED;
                }

              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function removeTopic() {
        return _removeTopic.apply(this, arguments);
      }

      return removeTopic;
    }(),
    topicMetaData: function topicMetaData() {
      return config.topicMetaData;
    },

    /**
     * Pauses camera-send without closing its topic
     * @param params
     * @param callback
     */
    pauseSendStream: function pauseSendStream() {
      var localStream;

      switch (config.mediaType) {
        case 'audio':
          localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getAudioInput();
          break;

        case 'video':
          if (config.isScreenShare) {
            localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getScreenShareInput();
          } else {
            localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getVideoInput();
          }

      }

      if (localStream) localStream.getTracks()[0].enabled = false;
    },
    resumeSendStream: function resumeSendStream() {
      var localStream;

      switch (config.mediaType) {
        case 'audio':
          localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getAudioInput();
          break;

        case 'video':
          if (config.isScreenShare) {
            localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getScreenShareInput();
          } else {
            localStream = (0, _sharedData.currentCall)().deviceManager().mediaStreams.getVideoInput();
          }

      }

      if (localStream) localStream.getTracks()[0].enabled = true; // if(config.peer && config.peer.getLocalStream())
      //     config.peer.getLocalStream().getTracks()[0].enabled = true;
    },
    startMedia: function startMedia() {
      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][startMedia] called with: ", config.htmlElement);
      if (!config.htmlElement) return;
      config.htmlElement.play()["catch"](function (err) {
        if (err.name === 'NotAllowedError') {
          _events.chatEvents.fireEvent('callEvents', {
            type: 'CALL_ERROR',
            code: 7000,
            message: "[startMedia] Browser doesn't allow playing media: " + err,
            environmentDetails: (0, _sharedData.currentCall)().getCallDetails()
          });
        }
      });
    },
    restartMediaOnKeyFrame: function restartMediaOnKeyFrame(userId, timeouts) {
      if ((0, _sharedData.currentCall)().callServerController().isJanus()) return;

      for (var i = 0; i < timeouts.length; i++) {
        setTimeout(function () {
          if (!publicized.isDestroyed() && config.peer) publicized.restartMedia();
        }, timeouts[i]);
      }
    },
    restartMedia: function restartMedia() {
      if (!publicized.isDestroyed() && !(0, _sharedData.currentCall)().users().get(config.userId).user().cameraPaused && config.mediaType == 'video') {
        _sdkParams.sdkParams.consoleLogging && console.log('[SDK] Sending Key Frame ...');
        var el = document.getElementById('callUserVideo-' + config.user.videoTopicName);
        if (!el.srcObject) el.srcObject = config.dataStream;
        var videoElement = el;
        var videoTrack = videoElement.srcObject.getTracks()[0];
        videoTrack.enabled = true;
        setTimeout(function () {
          videoTrack.enabled = false;
          setTimeout(function () {
            videoTrack.enabled = true;
          }, 1500);
        }, 1500);

        if (videoElement) {
          var width = config.isScreenShare ? (0, _sharedData.currentCall)().screenShareInfo.getWidth() : _sharedData.sharedVariables.callVideoMinWidth,
              height = config.isScreenShare ? (0, _sharedData.currentCall)().screenShareInfo.getHeight() : _sharedData.sharedVariables.callVideoMinHeight,
              rand = Math.random(),
              newWidth = width - 5,
              newHeight = height - 5;

          if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
            // videoTrack.enable = false;
            newWidth = width - 150;
            newHeight = height - 150;
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
              }, 1500);
            })["catch"](function (e) {
              return _sdkParams.sdkParams.consoleLogging && console.log(e);
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
              }, 1500);
            })["catch"](function (e) {
              return _sdkParams.sdkParams.consoleLogging && console.log(e);
            });
          }
        }
      }
    },
    startStatusPrint: function startStatusPrint() {
      config.statusEventsInterval && clearInterval(config.statusEventsInterval);
      config.statusEventsInterval = setInterval(function () {
        if (!config.peer) {
          config.statusEventsInterval && clearInterval(config.statusEventsInterval);
          return;
        }

        config.peer.peerConnection.getStats(null).then(function (stats) {
          // console.log(' watchRTCPeerConnection:: window.setInterval then(stats:', stats)
          var statsOutput = "";
          var user = config.user,
              topicMetadata = config.topicMetaData;
          stats.forEach(function (report) {
            // if(report && report.type && report.type === 'remote-inbound-rtp') {
            statsOutput += "<h2>Report: ".concat(report.type, "</h2>\n<strong>ID:</strong> ").concat(report.id, "<br>\n") + "<strong>Timestamp:</strong> ".concat(report.timestamp, "<br>\n"); // Now the statistics for this report; we intentially drop the ones we
            // sorted to the top above

            Object.keys(report).forEach(function (statName) {
              if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                statsOutput += "<strong>".concat(statName, ":</strong> ").concat(report[statName], "<br>\n");
              }
            }); // }
          });
          document.getElementById("peer-status-container").innerHTML = statsOutput; // document.querySelector(".stats-box").innerHTML = statsOutput;
        });
      }, 1000);
    },
    updateStream: function updateStream(stream) {
      if (mediaType == 'audio') {
        publicized.removeAudioWatcherInterval();
        config.dataStream = stream;
        publicized.watchAudioLevel();
      } else {
        config.dataStream = stream;
      }

      config.peer.updateStream(stream);
    },
    stopStatusPrint: function stopStatusPrint() {
      config.statusEventsInterval && clearInterval(config.statusEventsInterval);
    },
    isDestroyed: function isDestroyed() {
      return config.isDestroyed;
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                config.isDestroyed = true; // publicized.removeStreamHTML();

                _context2.next = 3;
                return publicized.removeTopic();

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    }
  };
  return publicized;
}