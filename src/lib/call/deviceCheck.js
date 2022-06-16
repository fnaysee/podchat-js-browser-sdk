import '../constants.js'

const deviceList = {
    audioIn: [],
    audioOut: [],
    videoIn: []
};

const deviceStreams = {
    videoIn: null,
    audioIn: null,
    audioOut: null
}

const errorList = [
    {
        code: 12400,
        message: "Could not grant video input permission"
    },
    {
        code: 12401,
        message: "Could not grant audio input permission"
    },
];

const handleError = function (error) {
    let item = errorList.filter(item => item.code == error);
    if(!item.length)
        item = {}

    return item;
}

const deviceManager = {
    getAvailableDevices() {
        deviceManager.getInputDevicesPermissions().then(() => {
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
        });
    },
    canChooseAudioOutputDevice() {
        return navigator.mediaDevices.selectAudioOutput;
    },
    getInputDevices () {

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
    getInputDevicesPermissions({video = false, audio = true}) {
        return new Promise(async (resolve, reject)=> {
            try {
                deviceStreams.audioIn = await deviceManager.getInputDevicePermission({audio: true, video: false});
                deviceStreams.videoIn = await deviceManager.getInputDevicePermission({audio: false, video: true});
            } catch (error) {
                reject(error);
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
                resolve(result);
            }).catch(error => {
                reject(handleError((audio ? 12400 : 12401)))
                //console.log(error)
            });
        });
    }
};

export default deviceManager
