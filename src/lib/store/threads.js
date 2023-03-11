import {storeEvents} from "./eventEmitter";

let list = [];
const eventsList = {
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
        let localThreadIndex = threadsList.findIndex(thread.id);
        if (localThreadIndex > -1) {
            list[localThreadIndex].set(thread)

        } else {
            list = [new ThreadObject(thread)].concat(list);
        }
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
    const config = {
        thread
    };
    return {
        set(thread) {
            config.thread = {...config.thread, ...thread};
        },
        get() {
            return config.thread;
        },
        update(field, newValue) {
            config.thread[field] = newValue;
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
            },
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
        }
    };
}

export {threadsList}