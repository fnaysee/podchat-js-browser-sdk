import Utility from "../../../utility/utility";

function CallUser(app, user) {
    const config = {
        callId: user.callId,
        userId: user.userId,
        user,
        isMe: user.userId == app.store.user.get().id,
        containerTag: null,
        htmlElements: {},
        videoIsOpen: false,
        audioIsOpen: false
    };

    const publicized = {
        userId() {
            return config.userId;
        },
        isMe() {
            return config.userId == app.store.user.get().id;
        },
        isScreenShare() {
            return false;
        },
        user() {
            return config.user;
        },
        getHTMLElements() {
            return config.htmlElements;
        },
        getVideoHtmlElement() {
            let elementUniqueId = Utility.generateUUID();
            if (config.user.video && !config.htmlElement) {
                config.htmlElement = document.createElement('video');
                let el = config.htmlElement;
                el.setAttribute('id', 'callUserVideo-' + config.user.videoTopicName);
                el.setAttribute('class', app.call.sharedVariables.callVideoTagClassName);
                el.setAttribute('playsinline', '');
                el.setAttribute('muted', '');
                el.setAttribute('autoplay', '');
                el.setAttribute('data-uniqueId', elementUniqueId);
                el.setAttribute('width', app.call.sharedVariables.callVideoMinWidth + 'px');
                el.setAttribute('height', app.call.sharedVariables.callVideoMinHeight + 'px');
                // el.setAttribute('controls', '');
            }

            return config.htmlElement;
        },
        getAudioHtmlElement(stream) {
            if (!config.isMe) {
                config.audioObject = new Audio();
                config.audioObject.srcObject = stream;
                config.audioObject.srcObject = stream;
                config.audioObject.autoplay = true;

                config.audioObject.play();
                publicized.watchAudioLevel();
            }
        },
        appendAudioToCallDiv() {
            if (!app.call.sharedVariables.callDivId) {
                app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

            if (!userContainer) {
                callParentDiv.appendChild(config.htmlElements.container);
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId)
            }
            if (typeof user.mute !== "undefined" && !user.mute && config.audioTopicManager) {
                if (!document.getElementById("callUserAudio-" + config.user.audioTopicName)) {
                    userContainer.appendChild(config.htmlElements[config.user.audioTopicName]);
                    config.audioTopicManager.startMedia();
                    config.audioTopicManager.watchAudioLevel();
                }
            }
        },
        appendVideoToCallDiv() {
            if (!app.call.sharedVariables.callDivId) {
                app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

            if (!userContainer) {
                callParentDiv.appendChild(config.htmlElements.container);
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId)
            }
            if (user.video) {
                if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.htmlElements[config.user.videoTopicName].play();
                }
            }

            app.call.currentCall().sendCallDivs()
        },
        videoTopicManager() {
            return config.videoTopicManager;
        },
        audioTopicManager() {
            return config.audioTopicManager;
        },
        async startAudio(sendTopic) {
            config.audioIsOpen = true;
            config.user.mute = false;
            if (config.isMe) {
                app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({audio: true}).then(() => {
                    app.call.currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.audioTopicName,
                        mediaType: 1,
                        stream: app.call.currentCall().deviceManager().mediaStreams.getAudioInput(),
                        onTrackCallback
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                app.call.currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.audioTopicName,
                    mediaType: 1,
                    onTrackCallback
                });
            }
         },
        async startVideo(sendTopic) {
            config.user.video = true;
            config.videoIsOpen = true;
            if (config.isMe) {
                app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({video: true}).then(() => {
                    app.call.currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.videoTopicName,
                        mediaType: 0,
                        stream: app.call.currentCall().deviceManager().mediaStreams.getVideoInput(),
                        onTrackCallback
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                app.call.currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.videoTopicName,
                    mediaType: 0,
                    onTrackCallback
                })
            }
        },
        async destroy() {
            await publicized.destroyVideo();
            await publicized.destroyAudio();
            config.htmlElements = {};
            user = null;
        },
        async stopAudio() {
            config.user.mute = true;
            config.audioIsOpen = false;

            if(config.isMe)
                app.call.currentCall().sendPeerManager().removeTrack(config.user.audioTopicName);

            await publicized.destroyAudio();
        },
        async destroyAudio() {
            if (config.htmlElements[config.user.audioTopicName]) {
                config.htmlElements[config.user.audioTopicName].remove();
                delete config.htmlElements[config.user.audioTopicName];
            }
        },
        async stopVideo() {
            config.user.video = false;
            config.videoIsOpen = false;

            if(config.isMe)
                app.call.currentCall().sendPeerManager().removeTrack(config.user.videoTopicName)

            await publicized.destroyVideo();
        },
        async destroyVideo() {
            if (config.htmlElements[config.user.videoTopicName]) {
                config.htmlElements[config.user.videoTopicName].remove();
                delete config.htmlElements[config.user.videoTopicName];
            }
        },
        processTrackChange(conf) {
            if (conf.topic.indexOf('Vi-') > -1) {
                if (!config.videoIsOpen && conf.isReceiving) {
                    publicized.startVideo(conf.topic.replace('Vi-', ''));
                } else if (config.videoIsOpen && !conf.isReceiving) {
                    config.videoIsOpen = false;
                    publicized.stopVideo();
                }
            } else if (conf.topic.indexOf('Vo-') > -1) {
                if (!config.audioIsOpen && conf.isReceiving) {
                    publicized.startAudio(conf.topic.replace('Vo-', ''));
                } else if (config.audioIsOpen && !conf.isReceiving) {
                    config.user.mute = true;
                    config.audioIsOpen = false;
                    publicized.stopAudio();
                }
            }
        },
        watchAudioLevel: function () {
            const stream = config.dataStream;

            let user = config.user,
                topicMetadata = config.topicMetaData;
            // Create and configure the audio pipeline
            const analyzer = app.call.audioCtx().createAnalyser();
            analyzer.fftSize = 512;
            analyzer.smoothingTimeConstant = 0.1;
            const sourceNode = app.call.audioCtx().createMediaStreamSource(stream);
            sourceNode.connect(analyzer);

            // Analyze the sound
            topicMetadata.audioLevelInterval = setInterval(() => {
                // Compute the max volume level (-Infinity...0)
                const fftBins = new Float32Array(analyzer.frequencyBinCount); // Number of values manipulated for each sample
                analyzer.getFloatFrequencyData(fftBins);
                // audioPeakDB varies from -Infinity up to 0
                const audioPeakDB = Math.max(...fftBins);

                // Compute a wave (0...)
                const frequencyRangeData = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(frequencyRangeData);
                const sum = frequencyRangeData.reduce((p, c) => p + c, 0);
                // audioMeter varies from 0 to 10
                const audioMeter = Math.sqrt(sum / frequencyRangeData.length);

                //console.log({audioMeter}, {audioPeakDB});


                if (audioPeakDB > -50 && audioMeter > 0) {
                    app.chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: convertToAudioLevel(audioPeakDB),
                        isNoise: false,
                        isMute: false
                    });
                } else if (audioPeakDB !== -Infinity && audioPeakDB < -60 && audioMeter > 0) {
                    app.chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: 0,
                        isNoise: true,
                        isMute: false
                    });
                } else if (audioPeakDB === -Infinity && audioMeter == 0) {
                    app.chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: 0,
                        isNoise: false,
                        isMute: true
                    });
                }
            }, 500);

            function convertToAudioLevel(soundPower) {
                if (soundPower <= -60) {
                    return 0;
                } else if (soundPower >= -60 && soundPower < -50) {
                    return 1;
                } else if (soundPower >= -50 && soundPower < -40) {
                    return 2;
                } else if (soundPower >= -40 && soundPower < 30) {
                    return 3;
                } else if (soundPower >= -30) {
                    return 4;
                }
            }
        },
    }

    function onTrackCallback(line, track) {
        let stream = new MediaStream([track]);
        let isAudio = (line.topic.indexOf('Vo-') > -1);
        console.log('debug', 991);

        if (config.isMe) {
            if (isAudio) {
                //TODO: implement
                // publicized.watchAudioLevel();

            } else {
                let el = publicized.getVideoHtmlElement();
                el.srcObject = stream;
                config.htmlElements[config.user.videoTopicName] = el;
                console.log('debug', 992, {el}, config.user.videoTopicName)
                publicized.appendVideoToCallDiv();
            }
        } else {
            if (isAudio) {
                config.audioObject = new Audio();
                config.audioObject.srcObject = stream;
                config.audioObject.srcObject = stream;
                config.audioObject.autoplay = true;

                config.audioObject.play();
                //TODO: implement
                // publicized.watchAudioLevel();
            } else {
                let el = publicized.getVideoHtmlElement();
                el.srcObject = stream;
                config.htmlElements[config.user.videoTopicName] = el;
                publicized.appendVideoToCallDiv();
            }
        }
    }

    function setup(participant) {
        config.user = participant;

        if (config.isMe) {
            config.user.direction = 'send';
        } else {
            config.user.direction = 'receive';
        }
        config.user.videoTopicName = 'Vi-' + config.user.topicSend;
        config.user.audioTopicName = 'Vo-' + config.user.topicSend;
        generateContainerElement();
        //
    }

    function generateContainerElement() {
        if (!config.htmlElements.container) {
            config.htmlElements.container = document.createElement('div');
            let el = config.htmlElements.container;
            el.setAttribute('id', 'callParticipantWrapper-' + config.userId);
            el.classList.add('participant');
            el.classList.add('wrapper');
            el.classList.add('user-' + config.userId);
            el.classList.add((config.isMe ? 'local' : 'remote'));
        }

        return config.htmlElements;
    }

    setup(user);
    return publicized;
}

function CallScreenShare(app, user) {
    const config = {
        callId: user.callId,
        userId: user.userId,
        isMe: user.userId == app.store.user.get().id,
        user,
        videoIsOpen: false,
        type: "screenShare",
        containerTag: null,
        htmlElements: {},
        videoStream: null
    };
    const publicized = {
        isMe() {
            return false;
        },
        isScreenShare() {
            return true;
        },
        user() {
            return config.user;
        },
        getHTMLElements() {
            return config.htmlElements;
        },
        appendVideoToCallDiv() {
            if (!app.call.sharedVariables.callDivId) {
                app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(app.call.sharedVariables.callDivId),
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

            if (!userContainer) {
                callParentDiv.appendChild(config.htmlElements.container);
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);
            }
            if (user.video) {
                if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.videoStream.getTracks()[0].enabled = true;
                    setTimeout(()=>{
                        let el = document.getElementById("callUserVideo-" + config.user.videoTopicName);
                        if(!el)
                            return;
                        el.addEventListener('loadedmetadata', playTheTag);
                        el.srcObject = config.videoStream;

                        function playTheTag() {
                            el.play();
                        }
                    }, 500);

                    // config.htmlElements[config.user.videoTopicName].srcObject = config.videoStream
                    // config.htmlElements[config.user.videoTopicName].play();
                }
            }

            app.call.currentCall().sendCallDivs();
        },
        audioStopManager() {
            return config.user.audioStopManager
        },
        startAudio(sendTopic) {
            return;
        },
        startVideo(sendTopic) {
            config.user.video = true;
            config.videoIsOpen = true;
            let iAmOwner = app.call.currentCall().screenShareInfo.iAmOwner();

            if (iAmOwner) {
                app.call.currentCall().deviceManager().grantScreenSharePermission({closeStream: false}).then(stream => {

                    if(!stream) {
                        alert("Error: could not find screenShareInput");
                    } else {
                        stream.getVideoTracks()[0].addEventListener("ended", onScreenShareEndCallback);

                        function onScreenShareEndCallback(event) { // Click on browser UI stop sharing button
                            if (!config.user)
                                return;

                            stream.getVideoTracks()[0].removeEventListener("ended", onScreenShareEndCallback);
                            if (app.call.currentCall() && app.call.currentCall().screenShareInfo.isStarted()) {
                                app.call.endScreenShare({
                                    callId: config.callId
                                });
                            }
                        }
                    }

                    app.call.currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.videoTopicName,
                        mediaType: 2,
                        isScreenShare: true,
                        stream: app.call.currentCall().deviceManager().mediaStreams.getScreenShareInput(),
                        onTrackCallback
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                app.call.currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.videoTopicName,
                    mediaType: 2,
                    isScreenShare: true,
                    onTrackCallback
                })
            }
        },
        processTrackChange(conf) {
            if (conf.topic.indexOf('Vi-') > -1) {
                if (!config.videoIsOpen && conf.isReceiving) {
                    publicized.startVideo(conf.topic.replace('Vi-', ''));
                } else if (config.videoIsOpen && !conf.isReceiving) {
                    config.videoIsOpen = false;
                    publicized.stopVideo();
                }
            }
        },
        async reconnectTopic(media) {
            await config.videoTopicManager.stopTopicOnServer();
            await publicized.destroyVideo()
            await publicized.startVideo(config.user.topic)
        },
        async destroy() {
            // user.topicMetaData = {};
            await publicized.stopVideo();
            config.htmlElements = {};
            config.user = null;
        },
        async stopVideo(){
            config.user.video = false;
            config.videoIsOpen = false;

            let iAmOwner = app.call.currentCall().screenShareInfo?.iAmOwner();

            if(iAmOwner)
                app.call.currentCall().sendPeerManager().removeTrack(config.user.videoTopicName)

            await publicized.destroyVideo();
        },
        destroyAudio() {
            return new Promise(resolve => {
                resolve()
            })
        },
        async destroyVideo() {
            return new Promise(resolve => {
                let el = document.getElementById(`callUserVideo-${config.user.videoTopicName}`);
                if (el) {
                    el.remove();
                    config.htmlElements[config.user.videoTopicName].remove();
                    delete config.htmlElements[config.user.videoTopicName];
                }
                resolve();
            })
        }
    }

    function setup(user) {
        let iAmOwner = app.call.currentCall().screenShareInfo.iAmOwner();

        let obj = {
            video: true,
            callId: user.callId,
            userId: user.userId,
            topic: user.topicSend,
            clientId: user.clientId
        };

        obj.direction = iAmOwner ? 'send' : 'receive';
        obj.videoTopicName = `Vi-send-${obj.callId}-screenShare`;//config.topic;
        config.user = obj;

        // publicized.appendUserToCallDiv(generateContainerElement())
        generateContainerElement();

        if(config.user.video && app.call.currentCall().screenShareInfo.iAmOwner())
            publicized.startVideo(obj.topic);
    }

    function generateContainerElement() {
        if (!config.htmlElements.container) {
            config.htmlElements.container = document.createElement('div');
            let el = config.htmlElements.container;
            el.setAttribute('id', 'callParticipantWrapper-' + config.userId);
            el.classList.add('participant');
            el.classList.add('wrapper');
            el.classList.add('user-' + config.userId);
            el.classList.add((config.isMe ? 'local' : 'remote'));
        }

        return config.htmlElements;
    }

    function getVideoHtmlElement() {
        let elementUniqueId = Utility.generateUUID();
        if (config.user.video && !config.htmlElement) {
            config.htmlElement = document.createElement('video');
            let el = config.htmlElement;
            el.setAttribute('id', 'callUserVideo-' + config.user.videoTopicName);
            el.setAttribute('class', app.call.sharedVariables.callVideoTagClassName);
            el.setAttribute('playsinline', '');
            el.setAttribute('muted', '');
            el.setAttribute('autoplay', '');
            el.setAttribute('data-uniqueId', elementUniqueId);
            el.setAttribute('width', app.call.sharedVariables.callVideoMinWidth + 'px');
            el.setAttribute('height', app.call.sharedVariables.callVideoMinHeight + 'px');
            // el.setAttribute('controls', '');
        }

        return config.htmlElement;
    }

    function onTrackCallback(line, track) {
        let stream = new MediaStream([track]);
        config.videoStream = stream;
        let el = getVideoHtmlElement();
        // el.addEventListener('loadedmetadata', playTheTag);
        // el.srcObject = stream;
        config.htmlElements[config.user.videoTopicName] = el;
        publicized.appendVideoToCallDiv();
    }

    setup(user);
    return publicized;
}

export {CallUser, CallScreenShare}