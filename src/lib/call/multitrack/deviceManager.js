import '../constants.js'
import {errorList} from "../errorHandler.js";

function MediaStreamManager() {
    const deviceStreams = {
        videoIn: null,
        audioIn: null,
        audioOut: null,
        screenShare: null
    };

    return {
        setAudioInput(stream) {
            deviceStreams.audioIn = stream;
        },
        setVideoInput(stream) {
            deviceStreams.videoIn = stream;
        },
        setScreenShareInput(stream) {
            deviceStreams.screenShare = stream;
        },
        getVideoInput() {
            return deviceStreams.videoIn
        },
        getAudioInput() {
            return deviceStreams.audioIn;
        },
        getScreenShareInput() {
            return deviceStreams.screenShare;
        },
        async stopAudioInput() {
            if(!deviceStreams.audioIn)
                return;

            deviceStreams.audioIn.getTracks().forEach(track =>{
                if(!!track) {
                    track.stop();
                }
            });

            deviceStreams.audioIn = null;
        },
        async stopVideoInput() {
            if(!deviceStreams.videoIn)
                return;

            deviceStreams.videoIn.getTracks().forEach(track => {
                track.stop();
            })

            deviceStreams.videoIn = null;
        },
        async stopScreenShareInput() {
            if(!deviceStreams.screenShare)
                return;

            deviceStreams.screenShare.getTracks().forEach(track => {
                track.stop();
            })

            deviceStreams.screenShare = null;
        }
    }
}

function DeviceManager (app) {
    const config = {
        mediaStreams: new MediaStreamManager(),
        streamsMetada: {
            audioInWatcherId: null
        }
    }

    const deviceManager = {
        getInputDevicePermission({
            audio = false,
            video = false,
        }) {
            return new Promise((resolve, reject) => {
                if (video && config.mediaStreams.getVideoInput()) {
                    resolve(config.mediaStreams.getVideoInput());
                    return;
                }
                if (audio && config.mediaStreams.getAudioInput()) {
                    resolve(config.mediaStreams.getAudioInput());
                    return;
                }

                navigator.mediaDevices.getUserMedia({audio, video}).then(stream => {
                    if (audio)
                        config.mediaStreams.setAudioInput(stream);
                    if (video)
                        config.mediaStreams.setVideoInput(stream);

                    resolve(stream);
                }).catch(error => {
                    app.chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: (audio ? 12400 : 12401),
                        message: error,
                        // environmentDetails: getSDKCallDetails()
                    });
                    reject(app.errorHandler.handleError((audio ? 12400 : 12401)))
                });
            });
        },
        canChooseAudioOutputDevice() {
            return !!navigator.mediaDevices.selectAudioOutput;
        },
        changeAudioOutputDevice() {
            if (!navigator.mediaDevices.selectAudioOutput) {
                console.warn("selectAudioOutput() not supported.");
                return;
            }

            //Display prompt and log selected device or error
            navigator.mediaDevices.selectAudioOutput()
                .then((device) => {
                    console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
                })
                .catch(function (err) {
                    console.log(err.name + ": " + err.message);
                });
        },
        grantScreenSharePermission({closeStream = false}, callback = null) {
            return new Promise((resolve, reject) => {
                if (config.mediaStreams.getScreenShareInput()) {
                    if (!config.mediaStreams.getScreenShareInput().active) {
                        config.mediaStreams.stopScreenShareInput();
                        // resolve(config.mediaStreams.getScreenShareInput());

                    } else {
                        // console.log("exists resolving")
                        resolve(config.mediaStreams.getScreenShareInput());
                        return;
                    }
                }

                navigator.mediaDevices.getDisplayMedia({
                    audio: false,
                    video: true
                }).then(stream => {
                    config.mediaStreams.setScreenShareInput(stream);

                    if (closeStream) {
                        config.mediaStreams.stopScreenShareInput();
                    }

                    callback && callback({
                        hasError: false
                    })
                    resolve(stream);
                }).catch(e => {
                    let error = app.errorHandler.raiseError(errorList.SCREENSHARE_PERMISSION_ERROR, callback, true, {
                        eventName: 'callEvents',
                        eventType: 'CALL_ERROR'
                    });
                    reject(error);
                });
            });
        },
        grantUserMediaDevicesPermissions({video = false, audio = false, closeStream = false}, callback = null) {
            return new Promise(async (resolve, reject) => {
                try {
                    if (audio)
                        await deviceManager.getInputDevicePermission({audio: true});
                    if (video)
                        await deviceManager.getInputDevicePermission({
                            video: {
                                width: 320,
                                framerate: 10
                            }
                        });

                    if (closeStream) {
                        if (audio)
                            config.mediaStreams.stopAudioInput();
                        if (video)
                            config.mediaStreams.stopVideoInput();
                    }

                    if (callback)
                        callback({hasError: false});

                    resolve({hasError: false});
                } catch (error) {
                    let parsedError = {
                        hasError: true,
                        errorCode: error.code,
                        errorMessage: error.message
                    }

                    if (callback)
                        callback(parsedError);

                    reject(parsedError);
                }
            });
        },
        mediaStreams: config.mediaStreams,
        watchAudioInputStream(callErrorHandler) {
            config.streamsMetada.audioInWatcherId && clearInterval(config.streamsMetada.audioInWatcherId)
            config.streamsMetada.audioInWatcherId = setInterval(() => {
                if (!config.mediaStreams.getAudioInput()) {
                    clearInterval(config.streamsMetada.audioInWatcherId);
                    return;
                }
                const audioTracks = config.mediaStreams.getAudioInput()?.getAudioTracks();

                if (audioTracks.length === 0) {
                    callErrorHandler(errorList.NO_AUDIO_TRACKS_AVAILABLE, null, true, {});
                    clearInterval(config.streamsMetada.audioInWatcherId);
                    // No audio from microphone has been captured
                    return;
                }

                // We asked for the microphone so one track
                const track = audioTracks[0];
                if (track.muted) {
                    // Track is muted which means that the track is unable to provide media data.
                    // When muted, a track can't be unmuted.
                    // This track will no more provide data...
                    callErrorHandler(errorList.AUDIO_TRACK_MUTED, null, true, {});
                    clearInterval(config.streamsMetada.audioInWatcherId);
                }

                if (!track.enabled) {
                    // Track is disabled (muted for telephonist) which means that the track provides silence instead of real data.
                    // When disabled, a track can be enabled again.
                    // When in that case, user can't be heard until track is enabled again.
                    callErrorHandler(errorList.AUDIO_TRACK_DISABLED, null, true, {});
                }

                if (track.readyState === "ended") {
                    // Possibly a disconnection of the device
                    // When ended, a track can't be active again
                    // This track will no more provide data
                    callErrorHandler(errorList.AUDIO_TRACK_ENDED, null, true, {});
                    clearInterval(config.streamsMetada.audioInWatcherId);
                }
            }, 10000)
        }
    }

    return deviceManager;
};

export {DeviceManager}
