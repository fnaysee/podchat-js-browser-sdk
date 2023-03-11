import {threadsList} from "./threads";
import {storeEvents} from "./eventEmitter";

let store = {
    threads: threadsList,
    events: storeEvents
};

export {store}