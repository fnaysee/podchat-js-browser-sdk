import {sdkParams} from "../sdkParams";
import {chatEvents} from "../../events.module";
import {async} from "./async";

function ProtocolManager({protocol = 'auto'}) {
    const config = {
        switchingEnabled: (protocol == "auto"),
        currentProtocol: (protocol == "auto" ? 'websocket' : protocol),
        failOverProtocol: (protocol == "auto" || protocol == "websocket"  ? 'webrtc' : 'websocket'),
        retries: 0,
        allowedRetries: {
            websocket: (sdkParams.protocolSwitching && typeof sdkParams.protocolSwitching.websocket !== "undefined" ? sdkParams.protocolSwitching.websocket : 1),
            webrtc: (sdkParams.protocolSwitching && typeof sdkParams.protocolSwitching.webrtc !== "undefined" ? sdkParams.protocolSwitching.webrtc : 1)
        },
        currentWaitTime: 0
    };

    function canRetry() {
        return config.retries <= config.allowedRetries[config.currentProtocol];
    }
    function switchProtocol(protocol, canResetRetries = true) {
        async().logout().then(()=>{
            let current;

            if(protocol) {
                current = protocol.toLowerCase();
                config.failOverProtocol = (current == "webrtc" ? "websocket" : "webrtc")
                config.currentProtocol = current;
            } else {
                current = config.currentProtocol;
                config.currentProtocol = config.failOverProtocol;
                config.failOverProtocol = current;
            }

            sdkParams.consoleLogging && console.log("[SDK]|/| switchProtocol: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime)

            chatEvents.fireEvent("autoSwitchAsyncProtocol", {
                current: config.currentProtocol,
                previous: config.failOverProtocol
            });

            if(canResetRetries)
                config.retries = 1;
            initAsync();
        })
    }

    function resetRetries() {
        config.retries = 0;
    }

    const publics =  {
        switchProtocol(protocol) {
            if(protocol == 'auto'){
                config.switchingEnabled = true;
                switchProtocol("websocket")
            } else {
                config.switchingEnabled = false;
                switchProtocol(protocol)
            }
        },
        increaseRetries() {
            config.retries += 1;
        },
        canRetry,
        getCurrentProtocol(){
            return config.currentProtocol;
        },
        resetRetries(){
            resetRetries();
        },
        resetTimerTime(time) {
            config.currentWaitTime = (typeof time != "undefined" ? time : 0);
        },
        onAsyncIsReconnecting(event) {
            sdkParams.consoleLogging && console.log("[SDK]|/| onAsyncIsReconnecting: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime);
            publics.increaseRetries();

            if(config.currentWaitTime < 64) {
                config.currentWaitTime += 3;
            }
            if(!canRetry() && config.switchingEnabled) {
                switchProtocol();
            }
        },
        getRetryStepTimerTime() {
            return config.currentWaitTime;
        },
        reconnectAsync() {
            publics.resetTimerTime();

            if(config.switchingEnabled) {
                if(canRetry()) {
                    publics.increaseRetries();
                    switchProtocol(config.currentProtocol, false);
                    // asyncClient.reconnectSocket();
                } else {
                    switchProtocol();
                }
            } else {
                // switchProtocol(config.currentProtocol);
                async().reconnectSocket()
            }
        }
    };

    return publics;
}