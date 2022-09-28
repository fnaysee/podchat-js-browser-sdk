import '../constants.js'
import { chatEvents } from "../../events.module.js";
import handleError, {errorList, raiseError} from "../errorHandler.js";

const deviceList = {
    audioIn: [],
    audioOut: [],
    videoIn: []
};

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
                let error = raiseError(errorList.SCREENSHARE_PERMISSION_ERROR, callback, true, {eventName: 'callEvents', eventType: 'CALL_ERROR'});
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
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: (audio ? 12400 : 12401),
                    message: error,
                    // environmentDetails: getSDKCallDetails()
                });
                reject(handleError((audio ? 12400 : 12401)))
            });
        });
    },
    mediaStreams(){
        return mediaStreams;
    }
};

export default deviceManager
