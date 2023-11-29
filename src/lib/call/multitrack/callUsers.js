import {CallUser, CallScreenShare} from "./callUser";

function CallUsers({app, callId}) {
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

    const publicized = {
        addItem(memberObject, type = "user") {
            if (type == 'user')
                config.list[memberObject.userId] = new CallUser(app, memberObject);
            else if (type == 'screenShare') {
                config.list[memberObject.userId] = new CallScreenShare(app, memberObject);
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
        generateCallUIList: function () {
            let me = app.store.user.get().id
                , callUIElements = {};

            if (!app.callsManager.get(config.callId))
                return;

            for (let i in config.list) {
                let tags = {};
                let HTMLElements = config.list[i].getHTMLElements();
                config.list[i] && console.log('HTMLElements:: ', {HTMLElements}, config.list[i], config.list[i].user(), config.list[i].user().videoTopicName);
                if (config.list[i] && HTMLElements) {
                    tags.container = HTMLElements.container;
                    if ((i === 'screenShare' && app.call.currentCall().screenShareInfo.isStarted())
                        || i != 'screenShare' && config.list[i].user().video && HTMLElements[config.list[i].user().videoTopicName])
                        tags.video = HTMLElements[config.list[i].user().videoTopicName];
                    // if (!config.list[i].mute && config.list[i].getHTMLElements()[config.list[i].user().audioTopicName])
                    //     tags.audio = config.list[i].getHTMLElements()[config.list[i].user().audioTopicName];

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
        async reconnectAllUsers() {
            for (let i in config.list) {
                let user = config.list[i];
                if (user ) {
                    if(user.user().video)
                        await user.stopVideo();
                    if(!user.user().mute)
                        await user.stopAudio();

                    setTimeout(()=>{
                        if(user.user().video)
                            user.startVideo(user.user().topicSend);
                        if(!user.user().mute)
                            user.startAudio(user.user().topicSend);
                    }, 500)
                }
            }
        }
    }

    return publicized;
}

export default CallUsers