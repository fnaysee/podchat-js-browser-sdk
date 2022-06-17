import '../constants.js'
import { chatEvents } from "../../events.module.js";
import handleError from "../errorHandler.js";

const deviceList = {
    audioIn: [],
    audioOut: [],
    videoIn: []
};

const deviceStreams = {
    videoIn: null,
    audioIn: null,
    audioOut: null,

};

const mediaStreams = {
    setAudioInput(stream){
        deviceStreams.audioIn = stream;
    },
    setVideoInput(stream){
        deviceStreams.videoIn = stream;
    },
    getVideoInput() {
        return deviceStreams.videoIn
    },
    getAudioInput() {
        return deviceStreams.audioIn;
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

        deviceStreams.videoIn.getTracks().forEach(track =>{
            if(!!track) {
                track.stop();
            }
        });
        deviceStreams.videoIn = null;
    },
}

const deviceManager = {
    getAvailableDevices() {
        // deviceManager.changeAudioOutputDevice();
        navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
                devices.forEach(function(device) {
                    console.log(device)
                    console.log(device.kind + ": " + device.label +
                        " id = " + device.deviceId);
                });
            })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
            });
    },
    canChooseAudioOutputDevice() {
        return navigator.mediaDevices.selectAudioOutput;
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
    getScreenSharePermission() {
        return new Promise(resolve => {
            navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: true
            }).then(result => {
                console.log(result)
                resolve(result);
            })
        });
    },
    grantUserMediaDevicesPermissions({video = false, audio = false}, callback = null) {
        return new Promise(async (resolve, reject)=> {
            try {
                if(audio)
                    await deviceManager.getInputDevicePermission({audio: true});
                if(video)
                    await deviceManager.getInputDevicePermission({video: true});

                if(callback)
                    callback({hasError: false});
                resolve({hasError: false});
            } catch (error) {
                let parsedError = {
                    hasError: true,
                    errorCode: error.code,
                    errorMessage: error.message,

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
            navigator.mediaDevices.getUserMedia({audio, video}).then(result => {
                //console.log(result)
                if(audio)
                    mediaStreams.setAudioInput(result); //= result;
                if(video)
                    mediaStreams.setVideoInput(result); //= result;

                resolve(result);
            }).catch(error => {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: (audio ? 12400 : 12401),
                    message: error,
                    // environmentDetails: getSDKCallDetails()
                });
                reject(handleError((audio ? 12400 : 12401)))
                //console.log(error)
            });
        });
    },
    mediaStreams(){
        return mediaStreams;
    }
};

export default deviceManager
