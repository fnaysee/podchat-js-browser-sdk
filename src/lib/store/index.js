import {threadsList} from "./threads";
import {storeEvents} from "./eventEmitter";
import {user} from "./user";
import {callsManager} from "../call/callsList";

let store = {
    threads: threadsList,
    events: storeEvents,
    user,
    threadCallbacks: {},
    sendMessageCallbacks: {},
    messagesCallbacks: {},
    asyncRequestTimeouts: {},
    callsManager: callsManager
};

export {store}