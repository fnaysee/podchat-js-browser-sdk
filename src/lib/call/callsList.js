import {CallManager} from "./callManager";
import {sdkParams} from "../sdkParams";
import {endCall, sharedVariables} from "./sharedData";

function CallsList() {
    const config = {
        list: {},
        currentCallId: null
    };

    const publicized = {
        async addItem(callId, callConfig) {
            if(Object.values(config.list).filter(item => item != undefined).length) {
                await publicized.destroyAllCalls();
            }

            callsManager().currentCallId = callId;
            config.list[callId] = new CallManager({callId, callConfig});
        },
        async removeItem(callId) {
            callsManager().currentCallId = null;
            if(config.list[callId]) {
                await config.list[callId].destroy();
                delete config.list[callId];
            }
        },
        get(id) {
            return config.list[id]
        },
        routeCallMessage(callId, message) {
            if(config.list[callId])
                config.list[callId].processCallMessage(message)
            else
                sdkParams.consoleLogging && console.warn("[SDK] Skipping call message, call not exists. uniqueId: ", {message})
        },
        destroyAllCalls() {
            return new Promise(resolve=>{
                let allPromises = [];
                for(let i in config.list) {
                    console.log("destroyAllCalls()", i);
                    endCall({callId: i})
                    allPromises.push(publicized.removeItem(i));
                }
                Promise.all(allPromises).then(()=>{
                    resolve()
                })
            })

        }
    }

    return publicized;
}

const callsMgr = new CallsList();

function callsManager() {
    return callsMgr;
}

export {callsManager}