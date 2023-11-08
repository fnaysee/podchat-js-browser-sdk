"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DevicePauseStopManager = DevicePauseStopManager;

function DevicePauseStopManager(_ref) {
  var userId = _ref.userId,
      mediaType = _ref.mediaType,
      timeout = _ref.timeout,
      callId = _ref.callId;
  var config = {
    callId: callId,
    userId: userId,
    mediaType: mediaType,
    // 'video' || 'audio'
    paused: false,
    stopped: false,
    timeoutHandler: null,
    timeout: timeout
  };
  var privateFunctions = {
    setTimeout: function setTimeout() {
      if (config.timeoutHandler) {
        this.removeTimeout();
      }
      /**
       * Temporarily disable timeout feature
       */
      //config.timeoutHandler = setTimeout(function () {


      if (config.paused) {
        config.stopped = true;
        app.callsManager.get(callId).users.get(userId).destroyAudio(); //     .deactivateParticipantStream(
        //     config.userId,
        //     config.mediaType,
        //     (config.mediaType === 'video' ? 'video' : 'mute')
        // );
      } //}, config.timeout);

    },
    removeTimeout: function removeTimeout() {
      clearTimeout(config.timeoutHandler);
    }
  };
  return {
    pauseStream: function pauseStream() {
      config.paused = true;
    },
    stopStream: function stopStream() {
      config.stopped = true;
    },
    isStreamPaused: function isStreamPaused() {
      return config.paused;
    },
    isStreamStopped: function isStreamStopped() {
      return config.stopped;
    },
    disableStream: function disableStream() {
      //if(pause)
      this.pauseStream();
      privateFunctions.setTimeout();
    },
    reset: function reset() {
      config.paused = false;
      config.stopped = false;
      privateFunctions.removeTimeout();
    }
  };
}