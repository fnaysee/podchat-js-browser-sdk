"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _webrtcPeer = require("./webrtcPeer");

var _sharedData = require("../sharedData");

var _store = require("../../store");

var _sdkParams = require("../../sdkParams");

var PeerConnectionManager = /*#__PURE__*/function () {
  function PeerConnectionManager(callId, direction, rtcPeerConfig, onTrackCallback) {
    (0, _classCallCheck2["default"])(this, PeerConnectionManager);
    this._nextTrackMid = 0;
    this._trackList = [];
    this._addTrackQueue = [];
    this._direction = direction;
    this._onTrackCallback = onTrackCallback;
    this._firstSub = true;
    this._canProcessNextTrack = true;
    var defaultConfig = {
      callId: callId,
      direction: direction,
      rtcPeerConfig: rtcPeerConfig
    };
    this._peer = new _webrtcPeer.WebrtcPeerConnection(defaultConfig);
  }

  (0, _createClass2["default"])(PeerConnectionManager, [{
    key: "_nextTrack",
    value: function _nextTrack() {
      if (this._canProcessNextTrack) {
        if (this._direction == 'send' && this._addTrackQueue.length) {
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

      if (this._firstSub) {
        this._peer.peerConnection.onicecandidate = function (_ref) {
          var candidate = _ref.candidate;
          (0, _sharedData.currentCall)().sendCallMessage({
            id: "SEND_ADD_ICE_CANDIDATE",
            token: _sdkParams.sdkParams.token,
            // clientId: currentCall().users().get(store.user().id).user().clientId,
            iceCandidate: JSON.stringify(candidate)
          }, null, {
            timeoutTime: 4000,
            timeoutRetriesCount: 5
          });
        };

        item.stream.getTracks().forEach(function (track) {
          _this._peer.peerConnection.addTrack(track, item.stream); // mline_topic.set(localTrackCounter, line.topic);
          // mline_track.set(localTrackCounter, track);

        });

        this._peer.peerConnection.createOffer().then(function (offer) {
          return _this._peer.peerConnection.setLocalDescription(offer);
        }).then(function () {
          (0, _sharedData.currentCall)().sendCallMessage({
            id: "SEND_SDP_OFFER",
            sdpOffer: _this._peer.peerConnection.localDescription.sdp,
            token: _sdkParams.sdkParams.token,
            // clientId: currentCall().users().get(store.user().id).user().clientId,
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
      } else {
        this._peer.peerConnection.createOffer().then(function (offer) {
          return _this._peer.peerConnection.setLocalDescription(offer);
        }).then(function () {
          (0, _sharedData.currentCall)().sendCallMessage({
            id: "SEND_NEGOTIATION",
            sdpOffer: _this._peer.peerConnection.localDescription.sdp,
            // clientId: currentCall().users().get(store.user().id).user().clientId,
            token: _sdkParams.sdkParams.token,
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
        (0, _sharedData.currentCall)().sendCallMessage({
          id: 'SUBSCRIBE',
          // chatId: getChatId(),
          // clientId: currentCall().users().get(store.user().id).user().clientId,
          token: _sdkParams.sdkParams.token,
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
        (0, _sharedData.currentCall)().sendCallMessage({
          id: 'UPDATE',
          // chatId: getChatId(),
          // clientId: currentCall().users().get(store.user().id).user().clientId,
          token: _sdkParams.sdkParams.token,
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
    key: "handleProcessSDPOfferForReceiveTrack",
    value: function handleProcessSDPOfferForReceiveTrack(jsonMessage) {
      var _this2 = this;

      var topic = JSON.parse(jsonMessage.topic);

      this._peer.peerConnection.onicecandidate = function (_ref2) {
        var candidate = _ref2.candidate;
        (0, _sharedData.currentCall)().sendCallMessage({
          id: "RECIVE_ADD_ICE_CANDIDATE",
          // chatId: getChatId(),
          // clientId: currentCall().users().get(store.user().id).user().clientId,
          // brokerAddress: getBrokerAddress(),
          token: _sdkParams.sdkParams.token,
          iceCandidate: JSON.stringify(candidate) // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]

        }, null, {});
      };

      this._peer.peerConnection.ontrack = function (_ref3) {
        var transceiver = _ref3.transceiver;

        _this2._trackList.forEach(function (item) {
          if (item.topic === topic[0].topic) {
            item.track = transceiver.receiver.track;
          }
        });

        transceiver.receiver.track.onmute = function (ev) {// this._onTrackCallback && this._onTrackCallback();
        };

        transceiver.receiver.track.onunmute = function (ev) {
          _this2._onTrackCallback && _this2._onTrackCallback(transceiver.receiver.track);
        };
      };
    }
  }, {
    key: "addTrack",
    value: function addTrack(data) {
      data.mLine = this._nextTrackMid;

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
    key: "getPeer",
    value: function getPeer() {
      return this._peer;
    }
  }]);
  return PeerConnectionManager;
}();

var _default = PeerConnectionManager;
exports["default"] = _default;