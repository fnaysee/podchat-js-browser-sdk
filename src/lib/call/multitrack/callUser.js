import {sdkParams} from "../../sdkParams";

import {
    audioCtx,
    currentCall,
    sharedVariables
} from "../sharedData";
import {callsManager} from "../callsList";
import {store} from "../../store";
import Utility from "../../../utility/utility";
import {chatEvents} from "../../../events.module";

function CallUser(user) {
    const config = {
        callId: user.callId,
        userId: user.userId,
        user,
        isMe: user.userId == store.user().id,
        containerTag: null,
        htmlElements: {},
        videoTopicManager: null,
        audioTopicManager: null,
        videoIsOpen: false,
        audioIsOpen: false
    };

    const publicized = {
        userId() {
            return config.userId;
        },
        isMe() {
            return config.userId == store.user().id;
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
                el.setAttribute('class', sharedVariables.callVideoTagClassName);
                el.setAttribute('playsinline', '');
                el.setAttribute('muted', '');
                el.setAttribute('autoplay', '');
                el.setAttribute('data-uniqueId', elementUniqueId);
                el.setAttribute('width', sharedVariables.callVideoMinWidth + 'px');
                el.setAttribute('height', sharedVariables.callVideoMinHeight + 'px');
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
            if (!sharedVariables.callDivId) {
                sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(sharedVariables.callDivId),
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
            if (!sharedVariables.callDivId) {
                sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(sharedVariables.callDivId),
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

            if (!userContainer) {
                callParentDiv.appendChild(config.htmlElements.container);
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId)
            }
            if (user.video) {
                if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
                    console.log('debug appendVideoToCallDiv 995', config.user.videoTopicName, config.htmlElements[config.user.videoTopicName])
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.htmlElements[config.user.videoTopicName].play();
                }
            }

            currentCall().sendCallDivs()
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
                currentCall().deviceManager().grantUserMediaDevicesPermissions({audio: true}).then(() => {
                    currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.audioTopicName,
                        mediaType: 1,
                        stream: currentCall().deviceManager().mediaStreams.getAudioInput(),
                        onTrackCallback
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                currentCall().receivePeerManager().addTrack({
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
                currentCall().deviceManager().grantUserMediaDevicesPermissions({video: true}).then(() => {
                    currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.videoTopicName,
                        mediaType: 0,
                        stream: currentCall().deviceManager().mediaStreams.getVideoInput(),
                        onTrackCallback
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                currentCall().receivePeerManager().addTrack({
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
            await publicized.destroyAudio();
        },
        async destroyAudio() {
            if (config.htmlElements[config.user.audioTopicName]) {
                config.htmlElements[config.user.audioTopicName].remove();
                delete config.htmlElements[config.user.audioTopicName];
            }
        },
        async stopVideo() {
            config.videoIsOpen = false;
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
                    console.log('debug 111 processTrackChange 1', conf, conf.topic, conf.topic.replace('Vi-', ''))
                    publicized.startVideo(conf.topic.replace('Vi-', ''));
                } else if (config.videoIsOpen && !conf.isReceiving) {
                    config.videoIsOpen = false;
                    publicized.stopVideo();
                }
            } else if (conf.topic.indexOf('Vo-') > -1) {
                if (!config.audioIsOpen && conf.isReceiving) {
                    console.log('debug  111 processTrackChange 2', conf, conf.topic, conf.topic.replace('Vo-', ''))
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
            const analyzer = audioCtx().createAnalyser();
            analyzer.fftSize = 512;
            analyzer.smoothingTimeConstant = 0.1;
            const sourceNode = audioCtx().createMediaStreamSource(stream);
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
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: convertToAudioLevel(audioPeakDB),
                        isNoise: false,
                        isMute: false
                    });
                } else if (audioPeakDB !== -Infinity && audioPeakDB < -60 && audioMeter > 0) {
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: 0,
                        isNoise: true,
                        isMute: false
                    });
                } else if (audioPeakDB === -Infinity && audioMeter == 0) {
                    chatEvents.fireEvent('callStreamEvents', {
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
                console.log('debug onTrackCallback 111', el, config.user, config.user.videoTopicName, config.htmlElement)

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

function CallScreenShare(user) {
    const config = {
        callId: user.callId,
        userId: user.userId,
        isMe: user.userId == store.user().id,
        user,
        type: "screenShare",
        containerTag: null,
        htmlElements: {},
        videoTopicManager: null
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
            if (!sharedVariables.callDivId) {
                sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
            let user = config.user,
                callParentDiv = document.getElementById(sharedVariables.callDivId),
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId);

            if (!userContainer) {
                callParentDiv.appendChild(config.htmlElements.container);
                userContainer = document.getElementById("callParticipantWrapper-" + config.userId)
            }
            if (user.video && config.videoTopicManager) {
                if (!document.getElementById("callUserVideo-" + config.user.videoTopicName)) {
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.videoTopicManager.startMedia();
                }
            }

            // if(currentCall().screenShareInfo.iAmOwner())
            config.videoTopicManager?.restartMediaOnKeyFrame("screenShare", [1000, 4000]);
            // else {
            //     config.videoTopicManager?.restartMediaOnKeyFrame("screenShare", [1000, 3000, 6000]);
            // }

            currentCall().sendCallDivs()
        },
        videoTopicManager() {
            return config.videoTopicManager;
        },
        audioTopicManager() {
            return config.audioTopicManager;
        },
        audioStopManager() {
            return config.user.audioStopManager
        },
        startAudio(sendTopic) {
            return;
        },
        startVideo(sendTopic) {
            // config.user.videoTopicName = sendTopic;


            config.user.video = true;
            currentCall().sendPeerManager(config.user, 'video');
            // config.videoTopicManager = new CallTopicManager({
            //     callId: config.user.callId,
            //     userId: config.user.userId,
            //     topic: config.user.videoTopicName,
            //     mediaType: 'video',
            //     direction: (callsManager().get(config.callId).screenShareInfo.iAmOwner() ? 'send' : 'receive'),
            //     user: config.user,
            //     isScreenShare: true,
            //     onHTMLElement(el) {
            //         config.htmlElements[config.user.videoTopicName] = el;
            //         publicized.appendVideoToCallDiv();
            //     }
            // });
            // config.videoTopicManager.createTopic();
        },
        async reconnectTopic(media) {
            await config.videoTopicManager.stopTopicOnServer();
            await publicized.destroyVideo()
            await publicized.startVideo(config.user.topic)
        },
        async destroy() {
            if (config.videoTopicManager && config.videoTopicManager.getPeer()) {
                await config.videoTopicManager.destroy();
            }
            // user.topicMetaData = {};
            config.htmlElements = {};
            user = null;
        },
        destroyAudio() {
            return new Promise(resolve => {
                resolve()
            })
        },
        async destroyVideo() {
            await config.videoTopicManager.destroy();
            delete config.htmlElements[config.user.videoTopicName];
            config.videoTopicManager = null;
        },
    }

    function setup(user) {
        let iAmOwner = callsManager().get(config.callId).screenShareInfo.iAmOwner();

        let obj = {
            video: true,
            callId: user.callId,
            userId: user.userId,
            topic: user.topicSend
        };

        obj.direction = iAmOwner ? 'send' : 'receive';
        obj.videoTopicName = config.topic;
        config.user = obj;

        // publicized.appendUserToCallDiv(generateContainerElement())
        generateContainerElement();

        // if(config.user.video)
        //     publicized.startVideo(obj.topic);
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

    function generateVideoElement() {
        if (config.user.video && !config.htmlElements[config.user.videoTopicName]) {
            let el = config.videoTopicManager.getHtmlElement();
            config.htmlElements[config.user.videoTopicName] = el;
        }
    }

    setup(user);
    return publicized;
}

export {CallUser, CallScreenShare}