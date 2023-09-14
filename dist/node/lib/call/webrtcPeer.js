"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebrtcPeerConnection = WebrtcPeerConnection;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function WebrtcPeerConnection(_ref, onCreatePeerCallback) {
  var callId = _ref.callId,
      userId = _ref.userId,
      _ref$direction = _ref.direction,
      direction = _ref$direction === void 0 ? 'send' : _ref$direction,
      _ref$mediaType = _ref.mediaType,
      mediaType = _ref$mediaType === void 0 ? 'video' : _ref$mediaType,
      rtcPeerConfig = _ref.rtcPeerConfig,
      stream = _ref.stream,
      _ref$connectionStateC = _ref.connectionStateChange,
      connectionStateChange = _ref$connectionStateC === void 0 ? null : _ref$connectionStateC,
      _ref$iceConnectionSta = _ref.iceConnectionStateChange,
      iceConnectionStateChange = _ref$iceConnectionSta === void 0 ? null : _ref$iceConnectionSta,
      onTrackCallback = _ref.onTrackCallback;
  var config = {
    rtcPeerConfig: rtcPeerConfig,
    direction: direction,
    mediaType: mediaType,
    offer: null,
    peerConnection: null,
    dataChannel: null,
    stream: stream,
    candidatesQueue: []
  };

  function createPeer() {
    console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer() ');

    try {
      config.peerConnection = new RTCPeerConnection(config.rtcPeerConfig);
    } catch (err) {
      console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer().catch ');
      console.error("[SDK][WebrtcPeerConnection][createPeer]", err);
      onCreatePeerCallback && onCreatePeerCallback(err);
    } // config.peerConnection.onicecandidate = handleicecandidate(lasticecandidate);


    config.peerConnection.onconnectionstatechange = connectionStateChange;
    config.peerConnection.oniceconnectionstatechange = iceConnectionStateChange;
    config.peerConnection.addEventListener('signalingstatechange', signalingStateChangeCallback);
    config.peerConnection.addEventListener('track', onRemoteTrack); // config.peerConnection.onicecandidate = onIceCandidate

    if (config.peerConnection.signalingState === 'closed') {
      console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer().signalingState closed');
      onCreatePeerCallback && onCreatePeerCallback('[SDK][WebRtcModule] The peer connection object is in "closed" state. This is most likely due to an invocation of the dispose method before accepting in the dialogue');
    }

    if (direction === 'send') {
      console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer() ', {
        mediaType: mediaType,
        direction: direction
      });
      stream.getTracks().forEach(addTrackToPeer); // if(config.mediaType === "video")
      //     onTrackCallback(stream);

      onTrackCallback(stream);
    }

    setTimeout(function () {
      onCreatePeerCallback && onCreatePeerCallback(null);
    });
  }

  createPeer();

  function onRemoteTrack(_x) {
    return _onRemoteTrack.apply(this, arguments);
  }

  function _onRemoteTrack() {
    _onRemoteTrack = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(event) {
      var _event$streams, remoteStream, newStream;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _event$streams = (0, _slicedToArray2["default"])(event.streams, 1), remoteStream = _event$streams[0];
              newStream = new MediaStream([event.track]);
              console.log('unmute::: callId: ', callId, ' user: ', userId, ' onRemoteTrack', {
                event: event,
                direction: direction,
                mediaType: mediaType
              });
              onTrackCallback(newStream);

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    return _onRemoteTrack.apply(this, arguments);
  }

  function getLocalStreams() {
    if (!config.peerConnection) return [];
    var stream = new MediaStream();
    config.peerConnection.getSenders().forEach(function (sender) {
      stream.addTrack(sender.track);
    });
    return [stream];
  }

  ;

  function getRemoteStreams() {
    if (!config.peerConnection) return [];
    var stream = new MediaStream();
    config.peerConnection.getReceivers().forEach(function (sender) {
      stream.addTrack(sender.track);
    });
    return [stream];
  }

  ;

  function addTrackToPeer(track) {
    console.log('unmute::: callId: ', callId, 'user: ', userId, ' addTrackToPeer ', {
      mediaType: mediaType,
      direction: direction,
      track: track,
      stream: stream
    });
    config.peerConnection.addTrack(track, stream);
  }

  function signalingStateChangeCallback() {
    switch (config.peerConnection.signalingState) {
      case 'stable':
        addTheCandidates();
        break;

      case 'closed': //TODO: notify topicManager to do sth

    }
  }

  function addTheCandidates() {
    while (config.candidatesQueue.length) {
      var entry = config.candidatesQueue.shift();
      config.peerConnection.addIceCandidate(entry.candidate, entry.callback, entry.callback);
    }
  }

  return {
    peerConnection: config.peerConnection,
    dispose: function dispose() {
      console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing ', {
        mediaType: mediaType,
        direction: direction
      });

      if (config.peerConnection) {
        config.peerConnection.ontrack = null;
        config.peerConnection.onremovetrack = null;
        config.peerConnection.onicecandidate = null;
        config.peerConnection.oniceconnectionstatechange = null;
        config.peerConnection.onsignalingstatechange = null;

        if (config.peerConnection.signalingState !== 'closed') {
          if (direction != 'send') {
            getRemoteStreams().forEach(function (stream) {
              console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing, clear remote tracks ', {
                mediaType: mediaType,
                direction: direction,
                stream: stream
              });
              stream.getTracks().forEach(function (track) {
                track.enabled = false;
              });
            });
          }

          config.peerConnection.close();
          console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing, closed ', {
            mediaType: mediaType,
            direction: direction,
            stream: stream
          });
        }

        config.peerConnection = null;
      }
    },
    generateOffer: function generateOffer(callback) {
      if (config.direction == 'send') {
        config.peerConnection.getTransceivers().forEach(function (transceiver) {
          transceiver.direction = "sendonly";
        });
      } else {
        config.peerConnection.addTransceiver(config.mediaType, {
          direction: 'recvonly'
        });
      }

      config.peerConnection.createOffer().then(function (offer) {
        return config.peerConnection.setLocalDescription(offer);
      }, function (error) {
        callback && callback(error, null);
      }).then(function (result) {
        //TODO: handle set offer result
        callback && callback(null, config.peerConnection.localDescription.sdp);
      }, function (error) {
        //TODO: handle set offer failed
        // console.debug("[SDK][WebRtcModule] Set offer failed. Error:", error);
        callback && callback(error, null);
      });
    },
    processOffer: function processOffer(sdpOffer, callback) {
      callback = callback.bind(this);
      var offer = new RTCSessionDescription({
        type: 'offer',
        sdp: sdpOffer
      });

      if (config.peerConnection.signalingState === 'closed') {
        return callback('[SDK][WebRtcModule] PeerConnection is closed');
      }

      config.peerConnection.setRemoteDescription(offer).then(function () {
        return; //setRemoteStream()
      }).then(function () {
        return config.peerConnection.createAnswer();
      }).then(function (answer) {
        console.debug('[SDK][WebRtcModule] Created SDP answer');
        return config.peerConnection.setLocalDescription(answer);
      }).then(function () {
        var localDescription = config.peerConnection.localDescription; // console.debug('[SDK][WebRtcModule] Local description set\n', localDescription.sdp)

        callback(null, localDescription.sdp);
      })["catch"](callback);
    },
    processAnswer: function processAnswer(sdpAnswer, callback) {
      if (config.peerConnection.signalingState === 'closed') {
        return callback('[SDK][WebRtcModule] PeerConnection is closed');
      }

      if (config.peerConnection.signalingState === 'stable') {
        return callback('[SDK][WebRtcModule] PeerConnection is already stable');
      }

      var answer = new RTCSessionDescription({
        type: 'answer',
        sdp: sdpAnswer
      });
      config.peerConnection.setRemoteDescription(answer).then(function () {
        // if (config.direction != 'send') {
        //setRemoteStream()
        // }
        callback && callback();
      }, function (error) {
        // console.log("config.peerConnection.setRemoteDescription",
        //     config.peerConnection.signalingState,
        //     config.peerConnection.mediaType,
        //     config.peerConnection.direction,
        // )
        callback && callback(error);
      });
    },
    addIceCandidate: function addIceCandidate(candidate, callback) {
      config.candidatesQueue.push({
        candidate: new RTCIceCandidate(candidate),
        callback: callback
      }); // console.log("[SDK][WebRtcModule] Remote ICE candidate received", candidate)

      if (config.peerConnection.signalingState === 'stable') {
        addTheCandidates();
      }
    },
    getRemoteStream: function getRemoteStream(index) {
      if (config.peerConnection) {
        return config.peerConnection.getRemoteStreams()[index || 0];
      }
    },
    getLocalStream: function getLocalStream(index) {
      if (config.peerConnection) {
        return config.peerConnection.getLocalStreams()[index || 0];
      }
    },
    onConnectionStable: function onConnectionStable(callback) {
      config.peerConnection.addEventListener('signalingstatechange', function () {
        if (config.peerConnection.signalingState === 'stable') {
          callback && callback();
        }
      });
    }
  };
}