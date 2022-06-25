"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startTopicsHealthCheck = startTopicsHealthCheck;
exports.stopTopicsHealthCheck = stopTopicsHealthCheck;

var _eventsModule = require("../../events.module.js");

var healthCheckerInterval = null,
    generateCallUIList;

function startTopicsHealthCheck(callUiGenerator) {
  generateCallUIList = callUiGenerator;
  healthCheckerInterval = setInterval(function () {
    checkHealth();
  }, 20000);
}

function stopTopicsHealthCheck() {
  clearInterval(healthCheckerInterval);
}

function checkHealth(users) {
  var foundProblem = false;
  users.forEach(function (user) {
    if (user.video) {
      if (user.videoTopicManager && !user.videoTopicManager.isPeerConnecting() && (user.videoTopicManager.isPeerFailed() || user.videoTopicManager.isPeerDisconnected())) {
        user.videoTopicManager.removeTopic().then(function () {
          user.videoTopicManager.createTopic();
        });
        foundProblem = true;
      }
    }

    if (!user.mute) {
      if (user.audioTopicManager.isPeerFailed()) {
        user.audioTopicManager.removeTopic().then(function () {
          user.audioTopicManager.createTopic();
        });
        foundProblem = true;
      }
    }
  });

  if (foundProblem) {
    _eventsModule.chatEvents.fireEvent('callEvents', {
      type: 'CALL_DIVS',
      result: generateCallUIList()
    });
  }
}