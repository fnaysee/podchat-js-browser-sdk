let list = [];
const eventsList = {
    SINGLE_THREAD_UPDATE: "singleThreadUpdate",
    UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
    LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated',
};
function ThreadsList(app){
    let threadsList = {
        eventsList,
        get(id) {
            return list[threadsList.findIndex(id)];
        },
        getAll() {
            return list;
        },
        findIndex(threadId) {
            return list.findIndex(item => item?.get().id == threadId);
        },
        save(thread) {
            let localThread;
            let localThreadIndex = threadsList.findIndex(thread.id);
            if (localThreadIndex > -1) {
                list[localThreadIndex].set(thread)
                localThread = list[localThreadIndex];
            } else {
                localThread = new ThreadObject(app, thread);
                list = [localThread].concat(list);

            }
            app.store.events.emit(eventsList.SINGLE_THREAD_UPDATE, localThread.get());
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
        }
    };

    return threadsList;
}

function ThreadObject(app, thread) {
    let config = {
        thread,
        latestReceivedMessage: null
    };


    function makeSureUnreadCountExists(thread){
        if(!thread.unreadCount){
            if(config.thread.unreadCount)
                thread.unreadCount = config.thread.unreadCount;
            else
                thread.unreadCount = 0;
        }
    }

    makeSureUnreadCountExists(config.thread);

    return {
        set(thread) {
            makeSureUnreadCountExists(thread)
            config.thread = {...config.thread, ...thread}
        },
        get() {
            return config.thread;
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
                return (config.latestReceivedMessage ? config.latestReceivedMessage.time : 0)
            },
            get(){
                return config.latestReceivedMessage
            },
            set(message) {
                config.latestReceivedMessage = message
            }
        }
    };
}

export {ThreadsList}