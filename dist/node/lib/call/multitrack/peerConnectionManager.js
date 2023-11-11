"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _webrtcPeer = require("./webrtcPeer");

var PeerConnectionManager = /*#__PURE__*/function () {
  function PeerConnectionManager(app, callId, direction, rtcPeerConfig, brokerAddress) {
    (0, _classCallCheck2["default"])(this, PeerConnectionManager);
    this._app = app;
    this._callId = callId;
    this._brokerAddress = brokerAddress;
    this._nextTrackMid = 0;
    this._trackList = [];
    this._addTrackQueue = [];
    this._direction = direction;
    this._firstSub = true;
    this._canProcessNextTrack = true;
    this._isDestroyed = false;
    this._peerStates = {
      DISCONNECTED: 0,
      CONNECTING: 1,
      FAILED: 3,
      CONNECTED: 4
    };
    this._state = 0; //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected

    this._defaultConfig = {
      callId: callId,
      direction: direction,
      rtcPeerConfig: rtcPeerConfig,
      connectionStateChange: this._onConnectionStateChange.bind(this),
      iceConnectionStateChange: this._onIceConnectionStateChange.bind(this)
    };
    this._peer = new _webrtcPeer.WebrtcPeerConnection(this._defaultConfig);
  }

  (0, _createClass2["default"])(PeerConnectionManager, [{
    key: "_nextTrack",
    value: function _nextTrack() {
      if (this._canProcessNextTrack) {
        if (this._direction == 'send' && this._canProcessNextTrack && this._addTrackQueue.length) {
          this._canProcessNextTrack = false;

          var item = this._addTrackQueue.shift();

          this._requestAddSendTrack(item);
        } else if (this._direction == 'receive' && this._canProcessNextTrack && this._addTrackQueue.length) {
          this._canProcessNextTrack = false;

          var _item = this._addTrackQueue.shift();

          this._requestReceiveTrack(_item);
        }
      }
    }
  }, {
    key: "_requestAddSendTrack",
    value: function _requestAddSendTrack(item) {
      var _this = this;

      var that = this;

      this._peer.peerConnection.onicecandidate = function (_ref) {
        var candidate = _ref.candidate;

        _this._app.call.currentCall().sendCallMessage({
          id: "SEND_ADD_ICE_CANDIDATE",
          token: _this._app.sdkParams.token,
          chatId: _this._callId,
          brokerAddress: _this._brokerAddress,
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          iceCandidate: JSON.stringify(candidate)
        }, null, {});
      };

      var localStream;

      if (item.topic.indexOf('Vi-') > -1) {
        localStream = this._app.call.currentCall().deviceManager().mediaStreams.getVideoInput();

        if (localStream) {
          this._peer.addTrack(localStream.getTracks()[0], localStream);
        }
      } else {
        localStream = this._app.call.currentCall().deviceManager().mediaStreams.getAudioInput();

        if (localStream) {
          this._peer.addTrack(localStream.getTracks()[0], localStream);
        }
      }

      item.onTrackCallback(item, localStream.getTracks()[0]); // item.stream.getTracks().forEach(track => {
      //     this._peer.addTrack(track, item.stream);
      //     // mline_topic.set(localTrackCounter, line.topic);
      //     // mline_track.set(localTrackCounter, track);
      // });

      if (this._firstSub) {
        this._firstSub = false;

        that._peer.peerConnection.createOffer().then(function (offer) {
          return that._peer.peerConnection.setLocalDescription(offer);
        }).then(function () {
          _this._app.call.currentCall().sendCallMessage({
            id: "SEND_SDP_OFFER",
            sdpOffer: _this._peer.peerConnection.localDescription.sdp,
            token: _this._app.sdkParams.token,
            chatId: _this._callId,
            brokerAddress: _this._brokerAddress,
            // clientId: currentCall().users().get(this._app.store.user().id).user().clientId,
            // brokerAddress: getBrokerAddress(),
            // chatId: getChatId(),
            addition: [{
              // clientId: getClientId(),
              mline: item.mline,
              topic: item.topic,
              mediaType: item.mediaType
            }]
          }, null, {});
        })["catch"](function (error) {
          return console.error({
            error: error
          });
        });
      } else {
        that._peer.peerConnection.createOffer().then(function (offer) {
          return that._peer.peerConnection.setLocalDescription(offer);
        }).then(function () {
          console.log('debug _requestAddSendTrack 7 createOffer sdp: ', _this._peer.peerConnection.localDescription.sdp);

          _this._app.call.currentCall().sendCallMessage({
            id: "SEND_NEGOTIATION",
            sdpOffer: _this._peer.peerConnection.localDescription.sdp,
            // clientId: currentCall().users().get(this._app.store.user().id).user().clientId,
            token: _this._app.sdkParams.token,
            chatId: _this._callId,
            brokerAddress: _this._brokerAddress,
            // brokerAddress: getBrokerAddress(),
            // chatId: getChatId(),
            addition: [{
              // clientId: getClientId(),
              mline: item.mline,
              topic: item.topic,
              mediaType: item.mediaType
            }]
          }, null, {});
        });
      }
    }
  }, {
    key: "_requestReceiveTrack",
    value: function _requestReceiveTrack(item) {
      if (this._firstSub) {
        this._firstSub = false;

        this._app.call.currentCall().sendCallMessage({
          id: 'SUBSCRIBE',
          // chatId: getChatId(),
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          token: this._app.sdkParams.token,
          chatId: this._callId,
          brokerAddress: this._brokerAddress,
          addition: [{
            // id: line.id,
            // chatId: line.chatId,
            clientId: item.clientId,
            mline: item.mline,
            topic: item.topic,
            mediaType: item.mediaType
          }]
        }, null, {});
      } else {
        this._app.call.currentCall().sendCallMessage({
          id: 'UPDATE',
          // chatId: getChatId(),
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          token: this._app.sdkParams.token,
          chatId: this._callId,
          brokerAddress: this._brokerAddress,
          addition: [{
            // id: line.id,
            // chatId: line.chatId,
            clientId: item.clientId,
            mline: item.mline,
            topic: item.topic,
            mediaType: item.mediaType
          }]
        }, null, {});
      }
    }
  }, {
    key: "_unlockProcessingNextTrack",
    value: function _unlockProcessingNextTrack() {
      this._canProcessNextTrack = true;
    }
  }, {
    key: "_setPeerState",
    value: function _setPeerState(state) {
      this._state = state;
    }
  }, {
    key: "addTrack",
    value: function addTrack(data) {
      data.mline = this._nextTrackMid;

      this._trackList.push(data);

      this._addTrackQueue.push(data);

      this._nextTrackMid++;

      this._nextTrack();
    }
  }, {
    key: "processingCurrentTrackCompleted",
    value: function processingCurrentTrackCompleted() {
      this._unlockProcessingNextTrack();

      this._nextTrack();
    }
  }, {
    key: "isPeerConnecting",
    value: function isPeerConnecting() {
      return this._state === this._peerStates.CONNECTING;
    }
  }, {
    key: "isPeerFailed",
    value: function isPeerFailed() {
      return this._state === this._peerStates.FAILED;
    }
  }, {
    key: "isPeerConnected",
    value: function isPeerConnected() {
      return this._state === this._peerStates.CONNECTED;
    }
  }, {
    key: "isPeerDisconnected",
    value: function isPeerDisconnected() {
      return this._state === this._peerStates.DISCONNECTED;
    }
  }, {
    key: "_onConnectionStateChange",
    value: function _onConnectionStateChange() {
      console.log('debug _onConnectionStateChange', this._direction, this._peer.peerConnection.connectionState);

      this._app.chatEvents.fireEvent("callStreamEvents", {
        type: 'WEBRTC_CONNECTION_STATE_CHANGE',
        callId: this._callId,
        direction: this._direction,
        connectionState: this._peer.peerConnection.connectionState
      });

      if (this.isDestroyed()) {
        return; //avoid log errors
      }

      this._app.sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.connectionState);

      if (this._peer.peerConnection.connectionState === 'disconnected') {//TODO: implement
        // publicized.removeConnectionQualityInterval();
        // publicized.removeAudioWatcherInterval();
      }

      if (this._peer.peerConnection.connectionState === "failed") {
        if (this.isPeerFailed()) return;
        this._state = this._peerStates.FAILED;

        this._app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(this._direction, ") has failed!"),
          errorInfo: this._peer.peerConnection
        });

        if (this._app.messenger.chatState) {
          this.shouldReconnectTopic();
        }
      }

      if (this._peer.peerConnection.connectionState === 'connected') {
        this._state = this._peerStates.CONNECTED; //TODO: implement new poorconnection
        // if(this._direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
        //     config.topicMetaData.connectionQualityInterval = setInterval(function() {
        //         publicized.checkConnectionQuality();
        //     }, 1000);
        // }
      }
    }
  }, {
    key: "_onIceConnectionStateChange",
    value: function _onIceConnectionStateChange() {
      console.log('debug _onIceConnectionStateChange', this._direction, this._peer.peerConnection.connectionState);

      if (!this._peer || this.isDestroyed()) {
        return; //avoid log errors
      }

      this._app.sdkParams.consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.iceConnectionState);

      if (this._peer.peerConnection.iceConnectionState === 'disconnected') {
        // config.state = this._peerStates.DISCONNECTED;
        this._state = this._peerStates.DISCONNECTED;

        this._app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(this._direction, ") is disconnected!"),
          errorInfo: this._peer
        });

        this._app.sdkParams.consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, peer:', this._direction);
      }

      if (this._peer.peerConnection.iceConnectionState === "failed") {
        if (this.isPeerFailed()) return;
        this._state = this._peerStates.FAILED;

        this._app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(this._direction, ") has failed!"),
          errorInfo: this._peer
        });

        if (this._app.messenger.chatState) {// publicized.shouldReconnectTopic();
        }
      }

      if (this._peer.peerConnection.iceConnectionState === "connected") {
        this._state = this._peerStates.CONNECTED; //TODO: implement
        // if(config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
        //     config.topicMetaData.connectionQualityInterval = setInterval(function() {
        //         publicized.checkConnectionQuality();
        //     }, 1000);
        // }
        // if(config.mediaType === 'video' ) {
        //     if(config.direction === 'receive') {
        //         chatEvents.fireEvent("callEvents", {
        //             type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
        //             userId: this._userId
        //         })
        //     }
        // }

        this._state = this._peerStates.CONNECTED; // callRequestController.callEstablishedInMySide = true;

        this._app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STATUS',
          errorCode: 7000,
          errorMessage: "Call Peer (".concat(this._direction, ") has connected!"),
          errorInfo: this._peer.peerConnection
        });
      }
    }
  }, {
    key: "shouldReconnectTopic",
    value: function shouldReconnectTopic() {
      var iceConnectionState = this._peer.peerConnection.iceConnectionState;

      if (!this.isDestroyed()) {
        if (this._peer && iceConnectionState != 'connected') {
          this._app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_STATUS',
            errorCode: 7000,
            errorMessage: "Call Peer (".concat(this._direction, ") is not in connected state, reconnecting peer ...!"),
            errorInfo: this._peer
          });

          this.reconnectPeer();
        }
      }
    }
  }, {
    key: "reconnectPeer",
    value: function reconnectPeer() {
      this._destroyPeer();

      this._peer = new _webrtcPeer.WebrtcPeerConnection(this._defaultConfig);
    }
  }, {
    key: "handleProcessSDPOfferForReceiveTrack",
    value: function handleProcessSDPOfferForReceiveTrack(jsonMessage, callback) {
      var _this2 = this;

      console.log('ooooooooooooooooooooooo ', {
        jsonMessage: jsonMessage
      });
      var topics = JSON.parse(jsonMessage.topic);
      var currentTrackData;

      this._trackList.forEach(function (item) {
        if (item.topic === topics[0].topic) {
          // item.track = transceiver.receiver.track;
          currentTrackData = item;
        }
      });

      this._peer.peerConnection.onicecandidate = function (_ref2) {
        var candidate = _ref2.candidate;

        _this2._app.call.currentCall().sendCallMessage({
          id: "RECIVE_ADD_ICE_CANDIDATE",
          // chatId: getChatId(),
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          brokerAddress: _this2._brokerAddress,
          token: _this2._app.sdkParams.token,
          chatId: _this2._callId,
          iceCandidate: JSON.stringify(candidate) // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]

        }, null, {});
      };

      this._peer.peerConnection.ontrack = function (_ref3) {
        var transceiver = _ref3.transceiver;
        currentTrackData.track = transceiver.receiver.track;
        currentTrackData.onTrackCallback(currentTrackData, transceiver.receiver.track);
      };

      this._peer.processOffer(jsonMessage.sdpOffer, function (error, sdpAnswer) {
        if (error) {
          return;
        }

        _this2._app.call.currentCall().sendCallMessage({
          id: "RECIVE_SDP_ANSWER",
          sdpAnswer: sdpAnswer,
          // clientId: getClientId(),
          token: _this2._app.sdkParams.token,
          // brokerAddress: getBrokerAddress(),
          // chatId: getChatId(),
          addition: [{
            // chatId: topic[0].chatId,
            clientId: topics[0].clientId,
            mline: topics[0].mline,
            topic: topics[0].topic,
            mediaType: topics[0].mediaType
          }]
        }, null, {});
      });
    }
  }, {
    key: "getPeer",
    value: function getPeer() {
      return this._peer;
    }
  }, {
    key: "_destroyPeer",
    value: function _destroyPeer() {
      this._peer.dispose();

      this._peer = null;
    }
  }, {
    key: "destroy",
    value: function () {
      var _destroy = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this._isDestroyed = true;

                this._destroyPeer();

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function destroy() {
        return _destroy.apply(this, arguments);
      }

      return destroy;
    }()
  }, {
    key: "isDestroyed",
    value: function isDestroyed() {
      return this._isDestroyed;
    }
  }]);
  return PeerConnectionManager;
}();

var _default = PeerConnectionManager;
exports["default"] = _default;