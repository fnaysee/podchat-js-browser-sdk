import {CallManager} from "./callManager";

function CallsList(app) {
    const config = {
        list: {},
        currentCallId: null
    };

    const publicized = {
        async addItem(callId, callConfig) {
            if(Object.values(config.list).filter(item => item != undefined).length) {
                await publicized.destroyAllCalls();
            }

            app.callsManager.currentCallId = callId;
            config.list[callId] = new CallManager({app, callId, callConfig});
        },
        async removeItem(callId) {
            if(config.list[callId]) {
                await config.list[callId].destroy();
                delete config.list[callId];
            }
            app.callsManager.currentCallId = null;
        },
        get(id) {
            return config.list[id]
        },
        routeCallMessage(callId, message) {
            if(config.list[callId])
                config.list[callId].processCallMessage(message)
            else
                app.sdkParams.consoleLogging && console.warn("[SDK] Skipping call message, call not exists. uniqueId: ", {message})
        },
        destroyAllCalls() {
            return new Promise(resolve=>{
                let allPromises = [];
                for(let i in config.list) {
                    console.log("destroyAllCalls()", i);
                    app.call.endCall({callId: i})
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

export default CallsList