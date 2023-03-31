import {storeEvents} from "./eventEmitter";

let list = [];
const eventsList = {
    SINGLE_THREAD_UPDATE: "singleThreadUpdate",
    UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
    LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated',
}

const threadsList = {
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
            localThread = new ThreadObject(thread);
            list = [localThread].concat(list);

        }
        storeEvents.emit(eventsList.SINGLE_THREAD_UPDATE, localThread.get());
    },
    saveMany(newThreads) {
        if (Array.isArray(newThreads)) {
            let nonExistingThreads = [];
            for (let item in newThreads) {
                let localThreadIndex = threadsList.findIndex(newThreads[item].id);
                if (localThreadIndex > -1) {
                    list[localThreadIndex].set(newThreads[item]);
                } else {
                    nonExistingThreads.push(new ThreadObject(newThreads[item]));
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
}

function ThreadObject(thread) {
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
            storeEvents.emit(eventsList.SINGLE_THREAD_UPDATE, config.thread)
        },
        unreadCount: {
            set(count) {
                config.thread.unreadCount = count;
                storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
            },
            get() {
                return config.thread.unreadCount;
            },
            increase() {
                config.thread.unreadCount++;
                storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
            },
            decrease(time) {
                if (time > config.thread.lastSeenMessageTime && config.thread.unreadCount > 0) {
                    config.thread.unreadCount--;
                    storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
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

export {threadsList}