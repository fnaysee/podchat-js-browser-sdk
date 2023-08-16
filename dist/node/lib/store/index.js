"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.store = void 0;

var _threads = require("./threads");

var _eventEmitter = require("./eventEmitter");

var _user = require("./user");

var store = {
  threads: _threads.threadsList,
  events: _eventEmitter.storeEvents,
  user: _user.user,
  threadCallbacks: {},
  sendMessageCallbacks: {},
  messagesCallbacks: {},
  asyncRequestTimeouts: {}
};
exports.store = store;