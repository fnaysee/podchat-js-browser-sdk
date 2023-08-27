"use strict";

var _sdkParams = require("../sdkParams");

var _events = require("../../events.module");

var _async = require("./async");

function ProtocolManager(_ref) {
  var _ref$protocol = _ref.protocol,
      protocol = _ref$protocol === void 0 ? 'auto' : _ref$protocol;
  var config = {
    switchingEnabled: protocol == "auto",
    currentProtocol: protocol == "auto" ? 'websocket' : protocol,
    failOverProtocol: protocol == "auto" || protocol == "websocket" ? 'webrtc' : 'websocket',
    retries: 0,
    allowedRetries: {
      websocket: _sdkParams.sdkParams.protocolSwitching && typeof _sdkParams.sdkParams.protocolSwitching.websocket !== "undefined" ? _sdkParams.sdkParams.protocolSwitching.websocket : 1,
      webrtc: _sdkParams.sdkParams.protocolSwitching && typeof _sdkParams.sdkParams.protocolSwitching.webrtc !== "undefined" ? _sdkParams.sdkParams.protocolSwitching.webrtc : 1
    },
    currentWaitTime: 0
  };

  function canRetry() {
    return config.retries <= config.allowedRetries[config.currentProtocol];
  }

  function _switchProtocol(protocol) {
    var canResetRetries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    (0, _async.async)().logout().then(function () {
      var current;

      if (protocol) {
        current = protocol.toLowerCase();
        config.failOverProtocol = current == "webrtc" ? "websocket" : "webrtc";
        config.currentProtocol = current;
      } else {
        current = config.currentProtocol;
        config.currentProtocol = config.failOverProtocol;
        config.failOverProtocol = current;
      }

      _sdkParams.sdkParams.consoleLogging && console.log("[SDK]|/| switchProtocol: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime);

      _events.chatEvents.fireEvent("autoSwitchAsyncProtocol", {
        current: config.currentProtocol,
        previous: config.failOverProtocol
      });

      if (canResetRetries) config.retries = 1;
      initAsync();
    });
  }

  function _resetRetries() {
    config.retries = 0;
  }

  var publics = {
    switchProtocol: function switchProtocol(protocol) {
      if (protocol == 'auto') {
        config.switchingEnabled = true;

        _switchProtocol("websocket");
      } else {
        config.switchingEnabled = false;

        _switchProtocol(protocol);
      }
    },
    increaseRetries: function increaseRetries() {
      config.retries += 1;
    },
    canRetry: canRetry,
    getCurrentProtocol: function getCurrentProtocol() {
      return config.currentProtocol;
    },
    resetRetries: function resetRetries() {
      _resetRetries();
    },
    resetTimerTime: function resetTimerTime(time) {
      config.currentWaitTime = typeof time != "undefined" ? time : 0;
    },
    onAsyncIsReconnecting: function onAsyncIsReconnecting(event) {
      _sdkParams.sdkParams.consoleLogging && console.log("[SDK]|/| onAsyncIsReconnecting: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime);
      publics.increaseRetries();

      if (config.currentWaitTime < 64) {
        config.currentWaitTime += 3;
      }

      if (!canRetry() && config.switchingEnabled) {
        _switchProtocol();
      }
    },
    getRetryStepTimerTime: function getRetryStepTimerTime() {
      return config.currentWaitTime;
    },
    reconnectAsync: function reconnectAsync() {
      publics.resetTimerTime();

      if (config.switchingEnabled) {
        if (canRetry()) {
          publics.increaseRetries();

          _switchProtocol(config.currentProtocol, false); // asyncClient.reconnectSocket();

        } else {
          _switchProtocol();
        }
      } else {
        // switchProtocol(config.currentProtocol);
        (0, _async.async)().reconnectSocket();
      }
    }
  };
  return publics;
}