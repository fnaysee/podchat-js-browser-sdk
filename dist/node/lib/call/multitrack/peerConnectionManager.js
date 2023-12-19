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

var _utility = _interopRequireDefault(require("../../../utility/utility"));

var PeerConnectionManager = /*#__PURE__*/function () {
  function PeerConnectionManager(_ref) {
    var app = _ref.app,
        callId = _ref.callId,
        direction = _ref.direction,
        rtcPeerConfig = _ref.rtcPeerConfig,
        brokerAddress = _ref.brokerAddress,
        onPeerFailed = _ref.onPeerFailed;
    (0, _classCallCheck2["default"])(this, PeerConnectionManager);
    this._app = app;
    this._callId = callId;
    this._brokerAddress = brokerAddress;
    this._nextTrackMid = 0;
    this._trackList = [];
    this._addTrackQueue = [];
    this._addIceQueue = [];
    this._direction = direction;
    this._firstSub = true;
    this._canProcessNextTrack = true;
    this._isDestroyed = false;
    this._requestTimeouts = {};
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
    this._onPeerFailed = onPeerFailed;
    this._peer = new _webrtcPeer.WebrtcPeerConnection(this._defaultConfig);
    this.watchConnectionStateChange();
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
      var localTrackIndex;

      var sender = this._peer.peerConnection.getSenders().find(function (s, index) {
        if (s.track == item.stream.getTracks()[0]) {
          localTrackIndex = index;
          return true;
        }
      });

      if (sender) {
        console.warn('Track already exists in connection, direction: send');
        item.onTrackCallback(item, item.stream.getTracks()[localTrackIndex]);
        return;
      }

      var localStream;

      if (item.topic.indexOf('Vi-') > -1) {
        if (item.isScreenShare) {
          localStream = this._app.call.currentCall().deviceManager().mediaStreams.getScreenShareInput();
        } else {
          localStream = this._app.call.currentCall().deviceManager().mediaStreams.getVideoInput();
        }

        if (localStream) {
          this._peer.addTrack(localStream.getTracks()[0], localStream);
        }
      } else {
        localStream = this._app.call.currentCall().deviceManager().mediaStreams.getAudioInput();

        if (localStream) {
          this._peer.addTrack(localStream.getTracks()[0], localStream);
        }
      }

      this._peer.peerConnection.onicecandidate = function (_ref2) {
        var candidate = _ref2.candidate;

        _this._app.call.currentCall().sendCallMessage({
          id: "SEND_ADD_ICE_CANDIDATE",
          token: _this._app.sdkParams.token,
          chatId: _this._callId,
          brokerAddress: _this._brokerAddress,
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          iceCandidate: JSON.stringify(candidate)
        }, null, {});
      };

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
    key: "_requestRemoveSendTrack",
    value: function _requestRemoveSendTrack(item) {
      var _this2 = this;

      var localTrackIndex;

      var sender = this._peer.peerConnection.getSenders().find(function (s, index) {
        if (s.track == item.stream.getTracks()[0]) {
          localTrackIndex = index;
          return true;
        }
      });

      if (sender) {
        this._peer.peerConnection.removeTrack(sender);

        this._trackList.forEach(function (it, index) {
          if (item.topic == it.topic) {
            delete _this2._trackList[index];
          }
        });

        this._peer.peerConnection.createOffer().then(function (offer) {
          return _this2._peer.peerConnection.setLocalDescription(offer);
        }).then(function () {
          _this2._app.call.currentCall().sendCallMessage({
            id: "SEND_NEGOTIATION",
            sdpOffer: _this2._peer.peerConnection.localDescription.sdp,
            // clientId: getClientId(),
            token: _this2._app.sdkParams.token,
            chatId: _this2._callId,
            // brokerAddress: getBrokerAddress(),
            // chatId: getChatId(),
            brokerAddress: _this2._brokerAddress,
            deletion: [{
              /*clientId: getClientId(),*/
              mline: item.mline,
              topic: item.topic
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
        var uuid = _utility["default"].generateUUID();

        this._app.call.currentCall().sendCallMessage({
          id: 'UPDATE',
          uniqueId: uuid,
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

        this.setRequestTimeout(uuid, {
          callback: item.onOpenFailure,
          item: item
        });
      }
    }
  }, {
    key: "setRequestTimeout",
    value: function setRequestTimeout(uuid, _ref3) {
      var _this3 = this;

      var callback = _ref3.callback,
          item = _ref3.item;
      this._requestTimeouts[uuid] = {
        callback: callback,
        topic: item.topic,
        timeout: setTimeout(function () {
          _this3.removeFailedTrack(item);

          _this3.processingCurrentTrackCompleted();

          callback && callback(item);
          delete _this3._requestTimeouts[uuid];
        }, 5000)
      };
    }
  }, {
    key: "removeFailedTrack",
    value: function removeFailedTrack(item) {
      this._addTrackQueue = this._addTrackQueue.filter(function (it) {
        return it.topic != item.topic;
      });
      this._trackList = this._trackList.filter(function (it) {
        return it.topic != item.topic;
      });
    }
  }, {
    key: "requestReceiveError",
    value: function requestReceiveError(uuid) {
      var _this4 = this;

      if (this._requestTimeouts[uuid]) {
        var item = this._trackList.find(function (item) {
          return item && item.topic === _this4._requestTimeouts[uuid].topic;
        });

        this.removeRequestTimeout(uuid);
        this.removeFailedTrack(item);
        this.processingCurrentTrackCompleted();
        item.onOpenFailure(item);
      }
    }
  }, {
    key: "removeRequestTimeout",
    value: function removeRequestTimeout(uuid) {
      var record = this._requestTimeouts[uuid];

      if (record) {
        if (record.timeout) clearTimeout(record.timeout);
        delete this._requestTimeouts[uuid];
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
      if (this._direction == 'send') {
        data.mline = this._nextTrackMid;
        this._nextTrackMid++;
      }

      this._trackList.push(data);

      this._addTrackQueue.push(data);

      this._nextTrack();
    }
  }, {
    key: "removeTrack",
    value: function removeTrack(topic) {
      var item = this._trackList.find(function (item) {
        return item && item.topic === topic;
      });

      if (item) this._requestRemoveSendTrack(item);
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
      if (!this._peer || this.isDestroyed()) {
        return; //avoid log errors
      }

      this._app.chatEvents.fireEvent("callStreamEvents", {
        type: 'WEBRTC_CONNECTION_STATE_CHANGE',
        callId: this._callId,
        direction: this._direction,
        connectionState: this._peer.peerConnection.connectionState
      });

      this._app.sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.connectionState);

      if (this._peer.peerConnection.connectionState === 'disconnected') {//TODO: implement
        // publicized.removeConnectionQualityInterval();
        // publicized.removeAudioWatcherInterval();
      }

      if (this._peer.peerConnection.connectionState === "failed") {
        if (this.isPeerFailed()) return;

        this._handlePeerFailed();
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

        this._handlePeerFailed(); // if(this._app.messenger.chatState) {
        // // publicized.shouldReconnectTopic();
        // }

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
    key: "_handlePeerFailed",
    value: function _handlePeerFailed() {
      this._state = this._peerStates.FAILED;

      this._app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_STATUS',
        errorCode: 7000,
        errorMessage: "Call Peer (".concat(this._direction, ") has failed!"),
        errorInfo: this._peer
      });

      this._onPeerFailed(this._direction);
    }
  }, {
    key: "addIceCandidateToQueue",
    value: function addIceCandidateToQueue(candidate) {
      var _this5 = this;

      this.addIceCandidate(candidate)["catch"](function (error) {
        // console.log('debug addIceCandidateToQueue catch', error, this)
        _this5._addIceQueue.push(candidate);
      });
    }
  }, {
    key: "watchConnectionStateChange",
    value: function watchConnectionStateChange() {
      var _this6 = this;

      this._peer.peerConnection.onsignalingstatechange = function (event) {
        if (_this6._peer.peerConnection.signalingState === 'stable') {
          _this6._addIceQueue.forEach(function (item) {
            _this6.addIceCandidate(item);
          });
        }
      };
    }
  }, {
    key: "addIceCandidate",
    value: function () {
      var _addIceCandidate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(data) {
        var _this7 = this;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  _this7._peer.peerConnection.addIceCandidate(data)["catch"](function (err) {
                    if (err) {
                      console.warn("[peerConnectionManager addIceCandidate" + _this7._direction + "] " + err);
                      reject(err); // this._app.chatEvents.fireEvent('callEvents', {
                      //     type: 'CALL_ERROR',
                      //     code: 7000,
                      //     message: "[" + key + "] " + err,
                      //     error: JSON.stringify(data),
                      //     environmentDetails: getCallDetails()
                      // });
                    }
                  });
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function addIceCandidate(_x) {
        return _addIceCandidate.apply(this, arguments);
      }

      return addIceCandidate;
    }() // shouldReconnectTopic() {
    //     let iceConnectionState = this._peer.peerConnection.iceConnectionState;
    //     if (!this.isDestroyed()) {
    //         if (this._peer
    //             && iceConnectionState != 'connected') {
    //             this._app.chatEvents.fireEvent('callEvents', {
    //                 type: 'CALL_STATUS',
    //                 errorCode: 7000,
    //                 errorMessage: `Call Peer (${this._direction}) is not in connected state, reconnecting peer ...!`,
    //                 errorInfo: this._peer
    //             });
    //
    //             this.reconnectPeer();
    //         }
    //     }
    // }

  }, {
    key: "reconnectPeer",
    value: function reconnectPeer() {
      this._destroyPeer();

      this._peer = new _webrtcPeer.WebrtcPeerConnection(this._defaultConfig);
    }
  }, {
    key: "handleProcessSDPOfferForReceiveTrack",
    value: function handleProcessSDPOfferForReceiveTrack(jsonMessage, callback) {
      var _this8 = this;

      var topics = JSON.parse(jsonMessage.topic);
      var currentTrackData;

      this._trackList.forEach(function (item) {
        if (item.topic === topics[0].topic) {
          // item.track = transceiver.receiver.track;
          currentTrackData = item;
        }
      });

      this._peer.peerConnection.onicecandidate = function (_ref4) {
        var candidate = _ref4.candidate;

        _this8._app.call.currentCall().sendCallMessage({
          id: "RECIVE_ADD_ICE_CANDIDATE",
          // chatId: getChatId(),
          // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
          brokerAddress: _this8._brokerAddress,
          token: _this8._app.sdkParams.token,
          chatId: _this8._callId,
          iceCandidate: JSON.stringify(candidate) // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]

        }, null, {});
      };

      this._peer.peerConnection.ontrack = function (infoData) {
        var transceiver = infoData.transceiver;
        currentTrackData.track = transceiver.receiver.track;
        currentTrackData.onTrackCallback(currentTrackData, transceiver.receiver.track);
      };

      this._peer.processOffer(jsonMessage.sdpOffer, function (error, sdpAnswer) {
        if (error) {
          return;
        }

        _this8._app.call.currentCall().sendCallMessage({
          id: "RECIVE_SDP_ANSWER",
          sdpAnswer: sdpAnswer,
          // clientId: getClientId(),
          token: _this8._app.sdkParams.token,
          brokerAddress: _this8._brokerAddress,
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
      var _destroy = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this._isDestroyed = true;

                this._destroyPeer();

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
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