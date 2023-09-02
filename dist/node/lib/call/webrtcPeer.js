"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebrtcPeerConnection = WebrtcPeerConnection;

function WebrtcPeerConnection(_ref, onCreatePeerCallback) {
  var _ref$direction = _ref.direction,
      direction = _ref$direction === void 0 ? 'send' : _ref$direction,
      _ref$mediaType = _ref.mediaType,
      mediaType = _ref$mediaType === void 0 ? 'video' : _ref$mediaType,
      rtcPeerConfig = _ref.rtcPeerConfig,
      stream = _ref.stream,
      streamElement = _ref.streamElement,
      _ref$connectionStateC = _ref.connectionStateChange,
      connectionStateChange = _ref$connectionStateC === void 0 ? null : _ref$connectionStateC,
      _ref$iceConnectionSta = _ref.iceConnectionStateChange,
      iceConnectionStateChange = _ref$iceConnectionSta === void 0 ? null : _ref$iceConnectionSta;
  var config = {
    rtcPeerConfig: rtcPeerConfig,
    direction: direction,
    mediaType: mediaType,
    offer: null,
    peerConnection: null,
    dataChannel: null,
    stream: stream,
    streamElement: streamElement,
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

    if (!config.peerConnection.getLocalStreams && config.peerConnection.getSenders) {
      config.peerConnection.getLocalStreams = function () {
        var stream = new MediaStream();
        config.peerConnection.getSenders().forEach(function (sender) {
          stream.addTrack(sender.track);
        });
        return [stream];
      };
    }

    if (!config.peerConnection.getRemoteStreams && config.peerConnection.getReceivers) {
      config.peerConnection.getRemoteStreams = function () {
        var stream = new MediaStream();
        config.peerConnection.getReceivers().forEach(function (sender) {
          stream.addTrack(sender.track);
        });
        return [stream];
      };
    }

    if (config.peerConnection.signalingState === 'closed') {
      onCreatePeerCallback && onCreatePeerCallback('[SDK][WebRtcModule] The peer connection object is in "closed" state. This is most likely due to an invocation of the dispose method before accepting in the dialogue');
    }

    if (mediaType == 'video') streamElement.mute = true;

    if (direction === 'send') {
      if (config.mediaType === "video") streamElement.srcObject = stream; // config.streamElement.mute = true;

      stream.getTracks().forEach(function (track) {
        config.peerConnection.addTrack(track, stream);
      });
      streamElement.play();
    }

    setTimeout(function () {
      onCreatePeerCallback && onCreatePeerCallback(null);
    });
  }

  createPeer();

  function signalingStateChangeCallback() {
    switch (config.peerConnection.signalingState) {
      case 'stable':
        addTheCandidates();
        break;

      case 'closed': //TODO: notify topicManager to do sth

    }
  }

  function addTheCandidates() {
    // console.log("[SDK][WebRtcModule][addTheCandidates] adding the candidates")
    while (config.candidatesQueue.length) {
      var entry = config.candidatesQueue.shift();
      config.peerConnection.addIceCandidate(entry.candidate, entry.callback, entry.callback);
    }
  }

  function setRemoteStream() {
    if (config.direction != 'send') {
      config.streamElement.pause();
      var _stream = config.peerConnection.getRemoteStreams()[0];
      config.streamElement.srcObject = _stream;
      config.streamElement.load();
      config.streamElement.play();
    }
  }

  return {
    peerConnection: config.peerConnection,
    dispose: function dispose() {
      if (config.peerConnection) {
        if (config.peerConnection.signalingState === 'closed') return;
        config.peerConnection.getLocalStreams().forEach(function (stream) {
          return stream.getTracks().forEach(function (track) {
            return track.stop && track.stop();
          });
        });
        config.peerConnection.close();
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
        }); // if (config.mediaType == 'audio') {
        //     config.peerConnection.addTransceiver('audio', {
        //         direction: 'recvonly'
        //     });
        // }
        //
        // if (config.mediaType == 'video') {
        //     config.peerConnection.addTransceiver('video', {
        //         direction: 'recvonly'
        //     });
        // }
      }

      config.peerConnection.createOffer().then(function (offer) {
        return config.peerConnection.setLocalDescription(offer);
      }, function (error) {
        callback && callback(error, null);
      }).then(function (result) {
        //TODO: handle set offer result
        // console.debug("[SDK][WebRtcModule] Set offer done. result: ", result);
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
      }); // console.debug('[SDK][WebRtcModule] SDP offer received, setting remote description')

      if (config.peerConnection.signalingState === 'closed') {
        return callback('[SDK][WebRtcModule] PeerConnection is closed');
      }

      config.peerConnection.setRemoteDescription(offer).then(function () {
        return setRemoteStream();
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
      var answer = new RTCSessionDescription({
        type: 'answer',
        sdp: sdpAnswer
      });

      if (config.peerConnection.signalingState === 'closed') {
        return callback('[SDK][WebRtcModule] PeerConnection is closed');
      }

      config.peerConnection.setRemoteDescription(answer).then(function () {
        if (config.direction != 'send') {
          setRemoteStream();
        }

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