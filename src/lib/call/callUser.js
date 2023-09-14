import {sdkParams} from "../sdkParams";
import {DevicePauseStopManager} from "./deviceStartStopManager";
import {CallTopicManager} from "./callTopicManager";

import {
    endCall,
    sharedVariables
} from "./sharedData";
import {callsManager} from "./callsList";
import {store} from "../store";

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
        autoStartStreams: user.autoStartStreams
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
                    console.log('counter', config.userId, config.htmlElements, config.user.audioTopicName, config.htmlElements[config.user.audioTopicName])
                    userContainer.appendChild(config.htmlElements[config.user.audioTopicName]);
                    config.audioTopicManager.startMedia();
                    config.audioTopicManager.watchAudioLevel();
                }
            }
        },
        appendVideoToCallDive(){
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
                    console.log('counter', config.userId, config.htmlElements,config.user.videoTopicName, config.htmlElements[config.user.videoTopicName])
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.videoTopicManager.startMedia();
                }
            }
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

            console.log('unmute::: callId: ', config.callId, 'user: ', config.userId, ' startAudio ', {sendTopic}, config.user);
            config.user.audioTopicName = 'Vo-' + sendTopic;
            config.user.mute = false;
            config.audioTopicManager = new CallTopicManager({
                callId: config.user.callId,
                userId: config.user.userId,
                topic: 'Vo-' + config.user.topicSend,
                mediaType: 'audio',
                direction: (config.user.userId === store.user().id ? 'send' : 'receive'),
                user: config.user,
                onHTMLElement(el) {
                    config.htmlElements[config.user.audioTopicName] = el;
                    console.log('unmute::: callId: ', config.callId, 'user: ', config.userId, ' startAudio ', {sendTopic}, config.user);

                        publicized.appendAudioToCallDiv();

                }
            });
            setImmediate(() => {
                config.audioTopicManager.createTopic();
            })
        },
        async startVideo(sendTopic) {
            if(config.videoTopicManager)
                return;

            config.user.videoTopicName = 'Vi-' + sendTopic;
            config.user.video = true;
            config.videoTopicManager = new CallTopicManager({
                callId: config.user.callId,
                userId: config.user.userId,
                topic: 'Vi-' + config.user.topicSend,
                mediaType: 'video',
                direction: (config.user.userId === store.user().id ? 'send' : 'receive'),
                user: config.user,
                onHTMLElement(el) {
                    config.htmlElements[config.user.videoTopicName] = el;
                    publicized.appendVideoToCallDive();
                }
            });
            // await publicized.appendUserToCallDiv(generateVideoElement());
            setImmediate(()=> {
                config.videoTopicManager.createTopic();
            });
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
            if(!config.audioTopicManager)
                return;

            console.log('unmute::: callId: ', config.callId, 'user: ', user.userId, ' destroyAudio()...');
            await config.audioTopicManager.destroy();
            console.log('unmute::: callId: ', config.callId, 'user: ', user.userId, ' audioTopicManager destroyed...');
            delete config.htmlElements[config.user.audioTopicName];
            config.audioTopicManager = null;
        },
        async stopVideo() {
            config.user.video = false;
            await publicized.destroyVideo();
        },
        async destroyVideo() {
            if(!config.videoTopicManager)
                return;

            await config.videoTopicManager.destroy();
            delete config.htmlElements[config.user.videoTopicName];
            config.videoTopicManager = null;
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
        // config.user.audioStopManager = new DevicePauseStopManager({
        //     callId: config.callId,
        //     userId: config.user.userId,
        //     mediaType: 'audio',
        //     timeout: sdkParams.callOptions?.streamCloseTimeout || 10000
        // });
        // if (config.user.mute) {
        //     config.user.audioStopManager.pauseStream();
        //     config.user.audioStopManager.stopStream();
        // }
        // config.user.videoStopManager = new DevicePauseStopManager({
        //     callId: config.callId,
        //     userId: config.user.userId,
        //     mediaType: 'video',
        //     timeout: sdkParams.callOptions?.streamCloseTimeout || 10000
        // });
        // if (!config.user.video) {

            // config.user.videoStopManager.pauseStream();
            // config.user.videoStopManager.stopStream();
        // }

        // publicized.appendUserToCallDiv(generateContainerElement())
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
        appendUserToCallDiv() {
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
                    console.log('counter', config.userId, config.htmlElements,config.user.videoTopicName, config.htmlElements[config.user.videoTopicName])
                    userContainer.appendChild(config.htmlElements[config.user.videoTopicName]);
                    config.videoTopicManager.startMedia();
                }
            }
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
            config.videoTopicManager = new CallTopicManager({
                callId: config.user.callId,
                userId: config.user.userId,
                topic: config.user.videoTopicName,
                mediaType: 'video',
                direction: (callsManager().get(config.callId).screenShareInfo.iAmOwner() ? 'send' : 'receive'),
                user: config.user,
                isScreenShare: true,
                onHTMLElement(el) {
                    config.htmlElements[config.user.videoTopicName] = el;
                    publicized.appendUserToCallDiv();
                }
            });
            // publicized.appendUserToCallDiv(generateVideoElement());
            setImmediate(()=> {
                config.videoTopicManager.createTopic();
            })
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
            if (config.audioTopicManager && config.audioTopicManager.getPeer()) {
                await config.audioTopicManager.destroy();
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
        // if(!config.user.mute)
        //     publicized.startAudio(obj.topic);
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