import {CallUser, CallScreenShare} from "./callUser";
import {chatEvents} from "../../events.module";
import {callsManager} from "./callsList";
import {messenger} from "../../messaging.module";
import {store} from "../store";

function CallUsers({callId}) {
    const config = {
        list: {},
        callId
    };

    function getHTMLElements() {
        return Object.values(config.list).map(item => item.getHTMLElements())
    }

    function getUser(userId) {
        return config.list[userId];
    }

    function startCall() {
        for (let i in config.list) {
            if (i === "screenShare") {
                if (callsManager().get(config.callId).screenShareInfo.isStarted())
                    addScreenShareToCall('receive', false);

                continue;
            }

            if (config.list[i].video) {
                config.list[i].startParticipantVideo(i);
            }

            if (config.list[i].mute !== undefined && !config.list[i].mute) {
                config.list[i].startParticipantAudio(i);
            }
        }
    }

    function addScreenShareToCall(direction, shareScreen) {
        if (direction !== config.list["screenShare"].direction) {
            config.list['screenShare'].direction = direction;
            config.list['screenShare'].videoTopicManager().setDirection(direction);
        }
        config.list['screenShare'].videoTopicManager().setIsScreenShare(shareScreen);

        let screenShare = config.list["screenShare"];
        if (!screenShare.videoTopicManager.getPeer()) {
            if (!screenShare.htmlElements[screenShare.videoTopicName]) {
                config.list['screenShare'].generateHTMLElements('screenShare');
            }
            setTimeout(function () {
                config.list['screenShare'].appendUserToCallDiv('screenShare');
                screenShare.videoTopicManager.createTopic();
            });
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.generateCallUIList()
            });
        } else {
            screenShare.videoTopicManager().removeTopic();
            if (!screenShare.htmlElements[screenShare.user().videoTopicName]) {
                config.list['screenShare'].generateHTMLElements('screenShare');
            }
            config.list['screenShare'].appendUserToCallDiv();
            screenShare.videoTopicManager().createTopic();

            config.list['screenShare'].videoTopicManager().startMedia()
            // startMedia(screenShare.htmlElements[screenShare.videoTopicName])
        }
    }

    const publicized = {
        addItem(memberObject, type = "user") {
            if (type == 'user')
                config.list[memberObject.userId] = new CallUser(memberObject);
            else if (type == 'screenShare') {
                config.list[memberObject.userId] = new CallScreenShare(memberObject);
            }
        },
        async removeItem(userId) {
            if(config.list[userId]) {
                await config.list[userId].destroy();
                delete config.list[userId];
            }
        },
        get: getUser,
        getAll() {
            return config.list
        },
        getHTMLElements,
        startCall,
        generateCallUIList: function () {
            let me = store.user().id
                , callUIElements = {};

            if (!callsManager().get(config.callId))
                return;

            for (let i in config.list) {
                let tags = {};
                if (config.list[i] && config.list[i].getHTMLElements()) {
                    tags.container = config.list[i].getHTMLElements().container;
                    if ((i === 'screenShare' && callsManager().get(config.callId).screenShareInfo.isStarted())
                        || i != 'screenShare' && config.list[i].user().video && config.list[i].getHTMLElements()[config.list[i].user().videoTopicName])
                        tags.video = config.list[i].getHTMLElements()[config.list[i].user().videoTopicName];
                    if (!config.list[i].mute && config.list[i].getHTMLElements()[config.list[i].user().audioTopicName])
                        tags.audio = config.list[i].getHTMLElements()[config.list[i].user().audioTopicName];

                    callUIElements[i] = tags;
                }
            }

            return {
                uiElements: callUIElements,
            };
        },
        findUserIdByTopic(topic) {
            for (let i in config.list) {
                if (config.list[i] && (config.list[i].user().videoTopicName === topic || config.list[i].user().audioTopicName === topic)) {
                    return i;
                }
            }
        },
        destroy() {
            return new Promise(resolve => {
                let promises = [];
                for (let i in config.list) {
                    let user = config.list[i];
                    if (user) {
                        promises.push(user.destroy())
                    }
                    // delete config.list[i];
                }

                Promise.all(promises).then(()=>{
                    for (let i in config.list) {
                        delete config.list[i];
                    }
                    resolve();
                })
            })

        },
    }

    return publicized;
}

export {CallUsers}