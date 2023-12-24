"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = Store;

var _eventEmitter = require("./eventEmitter");

var _reactionsSummaries = require("./reactionsSummaries");

var _user = require("./user");

var _reactionsList = require("./reactionsList");

var _threads = require("./threads");

function Store(app) {
  return {
    threads: new _threads.ThreadsList(app),
    events: new _eventEmitter.StoreEvents(),
    reactionSummaries: new _reactionsSummaries.ReactionsSummariesCache(app),
    reactionsList: new _reactionsList.ReactionsListCache(app),
    user: new _user.SDKUser(app),
    threadCallbacks: {},
    sendMessageCallbacks: {},
    messagesCallbacks: {},
    asyncRequestTimeouts: {}
  };
}