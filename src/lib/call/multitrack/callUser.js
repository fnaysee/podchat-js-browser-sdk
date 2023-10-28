import {sdkParams} from "../../sdkParams";

import {
    currentCall,
    sharedVariables
} from "../sharedData";
import {callsManager} from "../callsList";
import {store} from "../../store";

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
    };

    const publicized = {
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
        appendAudioToCallDiv(){
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
        appendVideoToCallDiv(){
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

            currentCall().sendCallDivs()
        },
        videoTopicManager() {
            return config.videoTopicManager;
        },
        audioTopicManager() {
            return config.audioTopicManager;
        },
        async startAudio(sendTopic) {
            if(config.audioTopicManager)
                return;

            config.user.audioTopicName = 'Vo-' + sendTopic;
            config.user.mute = false;
            if(config.isMe) {
                currentCall().deviceManager().grantUserMediaDevicesPermissions({audio: true}).then(() => {
                    currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.audioTopicName,
                        mediaType: 1,
                        stream: currentCall().deviceManager().mediaStreams.getAudioInput()
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.audioTopicName,
                    mediaType: 1
                });
            }
            // config.audioTopicManager = new CallTopicManager({
            //     callId: config.user.callId,
            //     userId: config.user.userId,
            //     topic: 'Vo-' + config.user.topicSend,
            //     mediaType: 'audio',
            //     direction: (config.user.userId === store.user().id ? 'send' : 'receive'),
            //     user: config.user,
            //     onHTMLElement(el) {
            //         config.htmlElements[config.user.audioTopicName] = el;
            //         publicized.appendAudioToCallDiv();
            //     }
            // });
            // config.audioTopicManager.createTopic();
        },
        async startVideo(sendTopic) {
            if (config.videoTopicManager)
                return;

            config.user.videoTopicName = 'Vi-' + sendTopic;
            config.user.video = true;
            if(config.isMe) {
                currentCall().deviceManager().grantUserMediaDevicesPermissions({video: true}).then(() => {
                    currentCall().sendPeerManager().addTrack({
                        clientId: config.user.clientId,
                        topic: config.user.videoTopicName,
                        mediaType: 0,
                        stream: currentCall().deviceManager().mediaStreams.getVideoInput()
                    });
                }).catch(error => {
                    // reject(error)
                })
            } else {
                currentCall().receivePeerManager().addTrack({
                    clientId: config.user.clientId,
                    topic: config.user.videoTopicName,
                    mediaType: 0
                })
            }
            // config.videoTopicManager = new CallTopicManager({
            //     callId: config.user.callId,
            //     userId: config.user.userId,
            //     topic: 'Vi-' + config.user.topicSend,
            //     mediaType: 'video',
            //     direction: (config.user.userId === store.user().id ? 'send' : 'receive'),
            //     user: config.user,
            //     onHTMLElement(el) {
            //         config.htmlElements[config.user.videoTopicName] = el;
            //         publicized.appendVideoToCallDiv();
            //     }
            // });
            // config.videoTopicManager.createTopic();
        },
        async reconnectTopic(media) {
            if(media == 'audio') {
                await config.audioTopicManager.stopTopicOnServer();
                await publicized.destroyAudio()
                await publicized.startAudio(config.user.topicSend);
            } else {
                await config.videoTopicManager.stopTopicOnServer();
                await publicized.destroyVideo()
                await publicized.startVideo(config.user.topicSend)
            }
        },
        async destroy() {
            if (config.videoTopicManager && config.videoTopicManager.getPeer()) {
                await publicized.destroyVideo();
            }
            if (config.audioTopicManager && config.audioTopicManager.getPeer()) {
                await publicized.destroyAudio();
            }

            // user.topicMetaData = {};
            config.htmlElements = {};
            user = null;
        },
        async stopAudio() {
            config.user.mute = true;
            await publicized.destroyAudio();
        },
        async destroyAudio() {
            config.htmlElements[config.user.videoTopicName].remove();
            delete config.htmlElements[config.user.audioTopicName];
        },
        async stopVideo() {
            config.user.video = false;
            await publicized.destroyVideo();
        },
        async destroyVideo() {
            config.htmlElements[config.user.videoTopicName].remove();
            delete config.htmlElements[config.user.videoTopicName];
        },
        processTrackChange(conf) {
            if(conf.topic.indexOf('Vi-') !== undefined) {
                if(conf.isReceiving) {
                    config.user.video = true;
                    publicized.startVideo(conf.topic.replace('Vi-', ''));
                } else {
                    config.user.video = false;
                    publicized.stopVideo();
                }
            } else if(conf.topic.indexOf('Vo-') !== undefined) {
                if(conf.isReceiving) {
                    config.user.audio = true;
                    publicized.startAudio(conf.topic.replace('Vo-', ''));
                } else {
                    config.user.audio = false;
                    publicized.stopAudio();
                }
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

        if(config.user.video)
            publicized.startVideo(config.user.topicSend);
        if(!config.user.mute)
            publicized.startAudio(config.user.topicSend);
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
        appendVideoToCallDiv(){
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
            config.user.videoTopicName = sendTopic;
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

        if(config.user.video)
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