import {threadsList} from "./threads";
import {storeEvents} from "./eventEmitter";
import {user} from "./user";

let store = {
    threads: threadsList,
    events: storeEvents,
    user,
    threadCallbacks: {},
    sendMessageCallbacks: {},
    messagesCallbacks: {},
    asyncRequestTimeouts: {}
};

export {store}