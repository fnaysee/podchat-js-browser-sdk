import {threadsList} from "./threads";
import {storeEvents} from "./eventEmitter";
import {reactionsSummariesCache} from "./reactionsSummaries";
import {user} from "./user";

let store = {
    threads: threadsList,
    events: storeEvents,
    reactionSummaries: reactionsSummariesCache,
    user,
    threadCallbacks: {},
    sendMessageCallbacks: {},
    messagesCallbacks: {},
    asyncRequestTimeouts: {}
};

export {store}