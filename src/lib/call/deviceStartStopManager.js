import {store} from "../store";
import {callsManager} from "./callsList";

function DevicePauseStopManager({userId, mediaType, timeout, callId}) {
    const config = {
        callId,
        userId,
        mediaType, // 'video' || 'audio'
        paused: false,
        stopped: false,
        timeoutHandler: null,
        timeout
    };

    const privateFunctions = {
        setTimeout: function () {
            if(config.timeoutHandler) {
                this.removeTimeout();
            }

            /**
             * Temporarily disable timeout feature
             */
            //config.timeoutHandler = setTimeout(function () {
            if(config.paused) {
                config.stopped = true;

                callsManager.get(callId).users.get(userId).destroyAudio()
                //     .deactivateParticipantStream(
                //     config.userId,
                //     config.mediaType,
                //     (config.mediaType === 'video' ? 'video' : 'mute')
                // );
            }
            //}, config.timeout);
        },
        removeTimeout: function () {
            clearTimeout(config.timeoutHandler);
        }
    };

    return {
        pauseStream: function () {
            config.paused = true
        },
        stopStream: function () {
            config.stopped = true
        },
        isStreamPaused: function () {
            return config.paused;
        },
        isStreamStopped: function () {
            return config.stopped;
        },
        disableStream: function () {
            //if(pause)
            this.pauseStream();
            privateFunctions.setTimeout()
        },
        reset: function () {
            config.paused = false;
            config.stopped = false;
            privateFunctions.removeTimeout();
        }
    }
}

export {DevicePauseStopManager}