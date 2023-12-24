const eventsList = {
    SINGLE_THREAD_UPDATE: "singleThreadUpdate",
    UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
    LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated',
};
function ThreadsList(app){
    let list = [],
        threadsList = {
        eventsList,
        get(id) {
            return list[threadsList.findIndex(id)];
        },
        getAll() {
            return list;
        },
        getPinMessages(ids) {
            let result = [];
            ids.forEach(item => {
                let th = threadsList.get(item);
                if(th.getField('pinMessageVO')) {
                    result.push(th.getField('pinMessageVO'));
                }
            });

            return result;
        },
        findIndex(threadId) {
            return list.findIndex(item => item?.get().id == threadId);
        },
        findOrCreate(thread) {
            let th = threadsList.get(thread.id);
            if(!th) {
                //TODO: make sure we don't break unreadcount
                th = threadsList.save(thread);
            }

            return th;
        },
        save(thread) {
            let localThread;
            let localThreadIndex = threadsList.findIndex(thread.id);
            if (localThreadIndex > -1) {
                list[localThreadIndex].set(thread)
                localThread = list[localThreadIndex];
            } else {
                localThread = new ThreadObject(app, thread);
                localThreadIndex = 0;
                list = [localThread].concat(list);
            }
            app.store.events.emit(eventsList.SINGLE_THREAD_UPDATE, localThread.get());
            return list[localThreadIndex];
        },
        saveMany(newThreads) {
            if (Array.isArray(newThreads)) {
                let nonExistingThreads = [];
                for (let item in newThreads) {
                    let localThreadIndex = threadsList.findIndex(newThreads[item].id);
                    if (localThreadIndex > -1) {
                        list[localThreadIndex].set(newThreads[item]);
                    } else {
                        nonExistingThreads.push(new ThreadObject(app, newThreads[item]));
                    }
                }
                if (nonExistingThreads.length) {
                    list = nonExistingThreads.concat(list);
                }
            }
        },
        remove(id) {
            let localThreadIndex = threadsList.findIndex(id);
            if(localThreadIndex > -1) {
                delete list[localThreadIndex];
            }
        },
        removeAll() {
            list = [];
        }
    };

    return threadsList;
}

function ThreadObject(app, thread) {
    let config = {
        thread,
        isValid: true,
        latestReceivedMessage: null,
        pinMessageRequested: false,
    };

    function makeSureUnreadCountExists(thread){
        if(!thread.unreadCount) {
            if(config.thread.unreadCount)
                thread.unreadCount = config.thread.unreadCount;
            else
                thread.unreadCount = 0;
        }
    }

    makeSureUnreadCountExists(config.thread);

    let publicized = {
        set(thread) {
            makeSureUnreadCountExists(thread)
            config.thread = {...config.thread, ...thread}
        },
        get() {
            return config.thread;
        },
        getField(key) {
            return JSON.parse(JSON.stringify(config.thread[key]));
        },
        update(field, newValue) {
            config.thread[field] = newValue;
            app.store.events.emit(eventsList.SINGLE_THREAD_UPDATE, config.thread)
        },
        unreadCount: {
            set(count, sendEvent = true) {
                config.thread.unreadCount = count;
                if(sendEvent)
                    app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
            },
            get() {
                return config.thread.unreadCount;
            },
            increase() {
                config.thread.unreadCount++;
                app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
            },
            decrease(time) {
                if (time > config.thread.lastSeenMessageTime && config.thread.unreadCount > 0) {
                    config.thread.unreadCount--;
                    app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
                }
            }
        },
        lastSeenMessageTime: {
            set(number) {
                if(number > config.thread.lastSeenMessageTime) {
                    config.thread.lastSeenMessageTime = number;
                }
            },
            get() {
                return config.thread.lastSeenMessageTime
            }
        },
        /**
         * local helper to detect and always replace the correct lastMessageVO in thread
         */
        latestReceivedMessage: {
            getTime() {
                return (config.latestReceivedMessage ? config.latestReceivedMessage.time : 0);
            },
            get(){
                return config.latestReceivedMessage;
            },
            set(message) {
                config.latestReceivedMessage = message;
            }
        },
        pinMessage: {
            hasPinMessage() {
                return config.thread.pinMessageVO;
            },
            isPinMessageRequested() {
                return config.pinMessageRequested;
            },
            setPinMessageRequested(val) {
                return config.pinMessageRequested = val;
            },
            setPinMessage(message) {
                config.thread.pinMessageVO = message;
            },
            removePinMessage(){
                config.thread.pinMessageVO = null;
            }
        },
        isDataValid() {
            return config.isValid;
        }
    };

    return publicized;
}

export {ThreadsList}