import '../constants.js'
import {errorList} from "../errorHandler.js";

const deviceList = {
    audioIn: [],
    audioOut: [],
    videoIn: []
};

const streamsMetada = {
    audioInWatcherId: null
}

const deviceStreams = {
    videoIn: null,
    audioIn: null,
    audioOut: null,
    screenShare: null
};

const mediaStreams = {
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
    stopAudioInput() {
        if(!deviceStreams.audioIn)
            return;

        deviceStreams.audioIn.getTracks().forEach(track =>{
            if(!!track) {
                track.stop();
            }
        });

        deviceStreams.audioIn = null;
    },
    stopVideoInput() {
        if(!deviceStreams.videoIn)
           return;

        deviceStreams.videoIn.getTracks().forEach(track => {
            track.stop();
        })

        deviceStreams.videoIn = null;
    },
    stopScreenShareInput() {
        if(!deviceStreams.screenShare)
            return;

        deviceStreams.screenShare.getTracks().forEach(track => {
            track.stop();
        })

        deviceStreams.screenShare = null;
    }
}

const deviceManager = {
    // getAvailableDevices() {
    //     // deviceManager.changeAudioOutputDevice();
    //     navigator.mediaDevices.enumerateDevices()
    //         .then(function(devices) {
    //             devices.forEach(function(device) {
    //                 console.log(device)
    //                 console.log(device.kind + ": " + device.label +
    //                     " id = " + device.deviceId);
    //             });
    //         })
    //         .catch(function(err) {
    //             console.log(err.name + ": " + err.message);
    //         });
    // },
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
            .then( (device) => {
                console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
            })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
            });
    },
    grantScreenSharePermission({closeStream = false}, callback = null) {
        return new Promise((resolve, reject) => {
            if(mediaStreams.getScreenShareInput()){
                if(!mediaStreams.getScreenShareInput().active) {
                    mediaStreams.stopScreenShareInput();
                } else {
                    // console.log("exists resolving")
                    resolve(mediaStreams.getScreenShareInput());
                    return;
                }
            }

            navigator.mediaDevices.getDisplayMedia({
                audio: false,
                video: true
            }).then(stream => {
                mediaStreams.setScreenShareInput(stream);

                if(closeStream) {
                    mediaStreams.stopScreenShareInput();
                }

                callback && callback({
                    hasError: false
                })
                resolve(stream);
            }).catch(e => {
                let error = app.errorHandler.raiseError(errorList.SCREENSHARE_PERMISSION_ERROR, callback, true, {eventName: 'callEvents', eventType: 'CALL_ERROR'});
                reject(error);
            });
        });
    },
    grantUserMediaDevicesPermissions({video = false, audio = false, closeStream = false}, callback = null) {
        return new Promise(async (resolve, reject)=> {
            try {
                if(audio)
                    await deviceManager.getInputDevicePermission({audio: true});
                if(video)
                    await deviceManager.getInputDevicePermission({video: {
                            width: 320,
                            framerate: 10
                    }});

                if(closeStream) {
                    if(audio)
                        mediaStreams.stopAudioInput();
                    if(video)
                        mediaStreams.stopVideoInput();
                }

                if(callback)
                    callback({hasError: false});

                resolve({hasError: false});
            } catch (error) {
                let parsedError = {
                    hasError: true,
                    errorCode: error.code,
                    errorMessage: error.message
                }

                if(callback)
                    callback(parsedError);

                reject(parsedError);
            }
        });
    },
    getInputDevicePermission({
        audio = false,
        video = false,
    }) {
        return new Promise((resolve, reject) => {
            if(video && mediaStreams.getVideoInput()) {
                resolve(mediaStreams.getVideoInput());
                return;
            }
            if(audio && mediaStreams.getAudioInput()) {
                resolve(mediaStreams.getAudioInput());
                return;
            }

            navigator.mediaDevices.getUserMedia({audio, video}).then(stream => {
                if(audio)
                    mediaStreams.setAudioInput(stream);
                if(video)
                    mediaStreams.setVideoInput(stream);

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
    mediaStreams(){
        return mediaStreams;
    },
    watchAudioInputStream(callErrorHandler) {
        streamsMetada.audioInWatcherId = setInterval(() => {
            if(!deviceManager.mediaStreams().getAudioInput()) {
                clearInterval(streamsMetada.audioInWatcherId);
                return;
            }
            const audioTracks = deviceManager.mediaStreams().getAudioInput()?.getAudioTracks();

            if (audioTracks.length === 0) {
                callErrorHandler(errorList.NO_AUDIO_TRACKS_AVAILABLE, null, true, {});
                clearInterval(streamsMetada.audioInWatcherId);
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
                clearInterval(streamsMetada.audioInWatcherId);
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
                clearInterval(streamsMetada.audioInWatcherId);
            }
        }, 10000)
    }
};

export default deviceManager
