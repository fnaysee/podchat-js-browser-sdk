"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.topicMetaDataManager = topicMetaDataManager;

function topicMetaDataManager(params) {
  var config = {
    userId: params.userId,
    topic: params.topic,
    interval: null,
    receivedSdpAnswer: false,
    connectionQualityInterval: null,
    poorConnectionCount: 0,
    poorConnectionResolvedCount: 0,
    isConnectionPoor: false
  };
  return {
    setIsConnectionPoor: function setIsConnectionPoor(state) {
      config.isConnectionPoor = state;
    },
    setReceivedSdpAnswer: function setReceivedSdpAnswer(state) {
      config.receivedSdpAnswer = state;
    },
    setIceCandidateInterval: function setIceCandidateInterval(id) {
      config.interval = id;
    },
    isConnectionPoor: function isConnectionPoor() {
      return config.isConnectionPoor;
    },
    isReceivedSdpAnswer: function isReceivedSdpAnswer() {
      return config.receivedSdpAnswer;
    },
    isIceCandidateIntervalSet: function isIceCandidateIntervalSet() {
      return config.interval !== null;
    },
    clearIceCandidateInterval: function clearIceCandidateInterval() {
      clearInterval(config.interval);
    }
  };
}