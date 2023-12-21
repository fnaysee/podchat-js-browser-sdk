import {StoreEvents} from "./eventEmitter";
import {ReactionsSummariesCache} from "./reactionsSummaries";
import {SDKUser} from "./user";
import {ReactionsListCache} from "./reactionsList";
import {ThreadsList} from "./threads";

function Store(app) {
    return {
        threads: new ThreadsList(app),
        events: new StoreEvents(),
        reactionSummaries: new ReactionsSummariesCache(app),
        reactionsList: new ReactionsListCache(app),
        user: new SDKUser(app),
        threadCallbacks: {},
        sendMessageCallbacks: {},
        messagesCallbacks: {},
        asyncRequestTimeouts: {}
    }
}

export {Store}