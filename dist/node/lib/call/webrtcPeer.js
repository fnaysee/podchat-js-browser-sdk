"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebrtcPeerConnection = WebrtcPeerConnection;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

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
    try {
      config.peerConnection = new RTCPeerConnection(config.rtcPeerConfig);
    } catch (err) {
      console.error("[SDK][WebrtcPeerConnection][createPeer]", err);
      onCreatePeerCallback && onCreatePeerCallback(err);
    } // config.peerConnection.onicecandidate = handleicecandidate(lasticecandidate);


    config.peerConnection.onconnectionstatechange = connectionStateChange;
    config.peerConnection.oniceconnectionstatechange = iceConnectionStateChange;
    config.peerConnection.addEventListener('signalingstatechange', signalingStateChangeCallback);
    config.peerConnection.addEventListener('track', onRemoteTrack); // config.peerConnection.onicecandidate = onIceCandidate

    if (config.peerConnection.signalingState === 'closed') {
      onCreatePeerCallback && onCreatePeerCallback('[SDK][WebRtcModule] The peer connection object is in "closed" state. This is most likely due to an invocation of the dispose method before accepting in the dialogue');
    }

    if (direction === 'send') {
      stream.getTracks().forEach(addTrackToPeer); // if(config.mediaType === "video")
      //     onTrackCallback(stream);

      onTrackCallback && onTrackCallback(stream);
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
    _onRemoteTrack = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(event) {
      var track, streams;
      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              track = event.track, streams = event.streams; // const [remoteStream] = event.streams;
              // let newStream = new MediaStream([track])

              track.onunmute = function () {
                var newStream = new MediaStream([track]);
                onTrackCallback && onTrackCallback(newStream);
              };

            case 2:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
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
      if (config.peerConnection) {
        config.peerConnection.ontrack = null;
        config.peerConnection.onremovetrack = null;
        config.peerConnection.onicecandidate = null;
        config.peerConnection.oniceconnectionstatechange = null;
        config.peerConnection.onsignalingstatechange = null;

        if (config.peerConnection.signalingState !== 'closed') {
          if (direction != 'send') {
            getRemoteStreams().forEach(function (stream) {
              stream.getTracks().forEach(function (track) {
                track.enabled = false;
              });
            });
          }

          config.peerConnection.close();
        }

        config.peerConnection = null;
      }
    },
    generateOffer: function generateOffer(callback) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (config.direction == 'send') {
                  config.peerConnection.getTransceivers().forEach(function (transceiver) {
                    transceiver.direction = "sendonly";
                  });
                } else {
                  config.peerConnection.addTransceiver(config.mediaType, {
                    direction: 'recvonly'
                  });
                }

                _context.prev = 1;
                _context.next = 4;
                return config.peerConnection.setLocalDescription();

              case 4:
                callback && callback(null, config.peerConnection.localDescription.sdp);
                _context.next = 10;
                break;

              case 7:
                _context.prev = 7;
                _context.t0 = _context["catch"](1);
                callback && callback(_context.t0, null);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[1, 7]]);
      }))();
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
    },
    updateStream: function updateStream(stream) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var localTrack, sender;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                localTrack = stream.getTracks()[0];
                sender = config.peerConnection.getSenders()[0];

                if (sender) {
                  _context2.next = 6;
                  break;
                }

                config.peerConnection.addTrack(localTrack); // will create sender, streamless track must be handled on another side here

                _context2.next = 8;
                break;

              case 6:
                _context2.next = 8;
                return sender.replaceTrack(localTrack);

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    }
  };
}