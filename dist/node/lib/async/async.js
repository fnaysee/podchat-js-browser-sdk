"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.async = async;
exports.initAsyncClient = initAsyncClient;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _podasyncWsOnly = _interopRequireDefault(require("podasync-ws-only"));

var _sdkParams = require("../sdkParams");

var _chat = require("../chat");

var AsyncClient = /*#__PURE__*/function () {
  function AsyncClient(_ref) {
    var protocolManager = _ref.protocolManager,
        queueHost = _ref.queueHost,
        queuePort = _ref.queuePort,
        queueUsername = _ref.queueUsername,
        queuePassword = _ref.queuePassword,
        queueReceive = _ref.queueReceive,
        queueSend = _ref.queueSend,
        queueConnectionTimeout = _ref.queueConnectionTimeout,
        onStateChange = _ref.onStateChange,
        _ref$msgLogCallback = _ref.msgLogCallback,
        msgLogCallback = _ref$msgLogCallback === void 0 ? null : _ref$msgLogCallback;
    (0, _classCallCheck2["default"])(this, AsyncClient);
    (0, _defineProperty2["default"])(this, "_peerId", null);
    (0, _defineProperty2["default"])(this, "_chatFullStateObject", {});
    (0, _defineProperty2["default"])(this, "receivedAsyncMessageHandler", function (asyncMessage) {
      /**
       * + Message Received From Async      {object}
       *    - id                            {int}
       *    - senderMessageId               {int}
       *    - senderName                    {string}
       *    - senderId                      {int}
       *    - type                          {int}
       *    - content                       {string}
       */
      if (asyncMessage.senderName === _sdkParams.sdkParams.serverName) {
        var content = JSON.parse(asyncMessage.content);

        _chat.api2.messenger.processChatMessage(content);
      } else {// callModule.callMessageHandler(asyncMessage);
      }
    });
    this._async = new _podasyncWsOnly["default"]({
      protocol: protocolManager.getCurrentProtocol(),
      queueHost: queueHost,
      queuePort: queuePort,
      queueUsername: queueUsername,
      queuePassword: queuePassword,
      queueReceive: queueReceive,
      queueSend: queueSend,
      queueConnectionTimeout: queueConnectionTimeout,
      socketAddress: _sdkParams.sdkParams.socketAddress,
      serverName: _sdkParams.sdkParams.serverName,
      deviceId: _sdkParams.sdkParams.deviceId,
      wsConnectionWaitTime: _sdkParams.sdkParams.wsConnectionWaitTime,
      connectionRetryInterval: _sdkParams.sdkParams.connectionRetryInterval,
      connectionCheckTimeout: _sdkParams.sdkParams.connectionCheckTimeout,
      connectionCheckTimeoutThreshold: _sdkParams.sdkParams.connectionCheckTimeoutThreshold,
      messageTtl: _sdkParams.sdkParams.messageTtl,
      reconnectOnClose: _sdkParams.sdkParams.reconnectOnClose,
      asyncLogging: _sdkParams.sdkParams.asyncLogging,
      logLevel: _sdkParams.sdkParams.consoleLogging ? 3 : 1,
      webrtcConfig: _sdkParams.sdkParams.webrtcConfig,
      retryStepTimerTime: protocolManager.getRetryStepTimerTime(),
      onStartWithRetryStepGreaterThanZero: onStateChange,
      msgLogCallback: msgLogCallback || null
    });

    this._bindMessageListener(); // this._bindListeners();

  }

  (0, _createClass2["default"])(AsyncClient, [{
    key: "_bindMessageListener",
    value: function _bindMessageListener() {
      this._async.on("message", function (params, ack) {
        this.receivedAsyncMessageHandler(params);
        ack && ack();
      });
    }
  }, {
    key: "client",
    get: // _bindListeners() {
    //     this._async.on('asyncReady', this._onAsyncReady);
    //     this._async.on('stateChange', this._onAsyncStateChange);
    //     this._async.on('connect', this._onAsyncConnect);
    //     this._async.on('disconnect', this._onAsyncDisconnect);
    //     this._async.on('reconnect', this._onAsyncReconnect);
    //     this._async.on('reconnecting', this._onAsyncReconnecting);
    //     this._async.on('message', this._onAsyncMessage);
    //     this._async.on('error', this._onAsyncError);
    // }
    //
    // _onAsyncReady() {
    //     this._peerId = this._async.getPeerId();
    //     this._oldPeerId = null;
    //     if (!store.user()) {
    //         getUserAndUpdateSDKState();
    //     } else if (store.user().id > 0) {
    //         chatMessaging.chatState = true;
    //         chatEvents.fireEvent('chatReady');
    //         chatSendQueueHandler();
    //     }
    // }
    //
    // _onAsyncStateChange(state) {
    //     chatEvents.fireEvent('chatState', state);
    //     this._chatFullStateObject = state;
    //
    //     switch (state.socketState) {
    //         case 1: // CONNECTED
    //             protocolManager.resetRetries();
    //             protocolManager.resetTimerTime();
    //             if (state.deviceRegister && state.serverRegister) {
    //                 // chatMessaging.chatState = true;
    //                 // chatMessaging.ping();
    //                 chatMessaging.startChatPing();
    //             }
    //             break;
    //         case 0: // CONNECTING
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             break;
    //         case 2: // CLOSING
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             break;
    //         case 3: // CLOSED
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             // TODO: Check if this is OK or not?!
    //             //chatMessaging.sendPingTimeout && clearTimeout(chatMessaging.sendPingTimeout);
    //             break;
    //     }
    // }
    //
    // _onAsyncConnect(newPeerId) {
    //     this._peerId = newPeerId;
    //     chatEvents.fireEvent('connect');
    //     chatMessaging.ping();
    // }
    //
    // _onAsyncDisconnect(event){
    //     this._oldPeerId = this._peerId;
    //     this._peerId = undefined;
    //     chatEvents.fireEvent('disconnect', event);
    //
    //     chatEvents.fireEvent('callEvents', {
    //         type: 'CALL_ERROR',
    //         code: 7000,
    //         message: 'Call Socket is closed!',
    //         error: event
    //     });
    // }
    // _onAsyncReconnect(newPeerId){
    //     this._peerId = newPeerId;
    //     chatEvents.fireEvent('reconnect');
    // }
    //
    // _onAsyncReconnecting(event) {
    //     sdkParams.consoleLogging && console.log("[SDK][event: asyncClient.reconnecting]")
    //     protocolManager.onAsyncIsReconnecting(event);
    // }
    // _onAsyncMessage(params, ack) {
    //     receivedAsyncMessageHandler(params);
    //     ack && ack();
    // }
    // _onAsyncError(error) {
    //     chatEvents.fireEvent('error', {
    //         code: error.errorCode,
    //         message: error.errorMessage,
    //         error: error.errorEvent
    //     });
    // }
    function get() {
      return this._async;
    }
  }, {
    key: "send",
    value: function send(params) {
      this._async.send(params);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var _this = this;

      this._async.destroy().then(function () {
        _this._async = null;
      });
    }
  }]);
  return AsyncClient;
}();

var asyncClassInstance = null;

function async() {
  return asyncClassInstance.client;
}

function initAsyncClient(_ref2) {
  var protocolManager = _ref2.protocolManager,
      queueHost = _ref2.queueHost,
      queuePort = _ref2.queuePort,
      queueUsername = _ref2.queueUsername,
      queuePassword = _ref2.queuePassword,
      queueReceive = _ref2.queueReceive,
      queueSend = _ref2.queueSend,
      queueConnectionTimeout = _ref2.queueConnectionTimeout,
      onStateChange = _ref2.onStateChange,
      msgLogCallback = _ref2.msgLogCallback,
      onDeviceId = _ref2.onDeviceId;
  asyncClassInstance = new AsyncClient({
    protocolManager: protocolManager,
    queueHost: queueHost,
    queuePort: queuePort,
    queueUsername: queueUsername,
    queuePassword: queuePassword,
    queueReceive: queueReceive,
    queueSend: queueSend,
    queueConnectionTimeout: queueConnectionTimeout,
    onStateChange: onStateChange,
    msgLogCallback: msgLogCallback,
    onDeviceId: onDeviceId
  });
}