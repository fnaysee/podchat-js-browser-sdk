import EventEmitter from "events";
const Emitter = new EventEmitter();

function StoreEvents(){
    return {
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
}

export {StoreEvents}