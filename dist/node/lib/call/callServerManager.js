"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallServerManager = CallServerManager;
exports.callServerController = void 0;

var _sdkParams = require("../sdkParams");

function CallServerManager() {
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
        _sdkParams.sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
        config.currentServerIndex++;
      }
    }
  };
}

var callServerController = new CallServerManager();
exports.callServerController = callServerController;