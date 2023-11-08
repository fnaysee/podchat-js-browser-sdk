"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function CallServerManager(app) {
  var config = {
    servers: [],
    currentServerIndex: 0
  };
  return {
    setServers: function setServers(serversList) {
      config.servers = serversList;
      config.currentServerIndex = 0;
    },
    getCurrentServer: function getCurrentServer() {
      return config.servers[0];
    },
    isJanus: function isJanus() {
      return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
    },
    canChangeServer: function canChangeServer() {
      return config.currentServerIndex < config.servers.length - 1;
    },
    changeServer: function changeServer() {
      if (this.canChangeServer()) {
        app.sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
        config.currentServerIndex++;
      }
    }
  };
}

var _default = CallServerManager;
exports["default"] = _default;