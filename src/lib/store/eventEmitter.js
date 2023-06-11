import EventEmitter from "events";
const Emitter = new EventEmitter();

const storeEvents = {
    on(eventName, callback) {
        Emitter.on(eventName, callback)
    },
    off(eventName) {
        Emitter.off(eventName);
    },
    emit(eventName, data) {
        Emitter.emit(eventName, data);
    }
}

export {storeEvents}