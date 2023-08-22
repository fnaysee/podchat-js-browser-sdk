import Async from "podasync-ws-only";
import {sdkParams} from "../sdkParams";
import {api2} from "../chat";

class AsyncClient {
    _async = null;
    _peerId = null;
    _chatFullStateObject = {};

    constructor(
        {
            protocolManager,
            queueHost,
            queuePort,
            queueUsername,
            queuePassword,
            queueReceive,
            queueSend,
            queueConnectionTimeout,
            onStateChange,
            msgLogCallback = null,
        }) {
        this._async = new Async({
            protocol: protocolManager.getCurrentProtocol(),
            queueHost: queueHost,
            queuePort: queuePort,
            queueUsername: queueUsername,
            queuePassword: queuePassword,
            queueReceive: queueReceive,
            queueSend: queueSend,
            queueConnectionTimeout: queueConnectionTimeout,
            socketAddress: sdkParams.socketAddress,
            serverName: sdkParams.serverName,
            deviceId: sdkParams.deviceId,
            wsConnectionWaitTime: sdkParams.wsConnectionWaitTime,
            connectionRetryInterval: sdkParams.connectionRetryInterval,
            connectionCheckTimeout: sdkParams.connectionCheckTimeout,
            connectionCheckTimeoutThreshold: sdkParams.connectionCheckTimeoutThreshold,
            messageTtl: sdkParams.messageTtl,
            reconnectOnClose: sdkParams.reconnectOnClose,
            asyncLogging: sdkParams.asyncLogging,
            logLevel: (sdkParams.consoleLogging ? 3 : 1),
            webrtcConfig: sdkParams.webrtcConfig,
            retryStepTimerTime: protocolManager.getRetryStepTimerTime(),
            onStartWithRetryStepGreaterThanZero: onStateChange,
            msgLogCallback: msgLogCallback || null
        });
        this._chatFullStateObject = {};

        this._bindMessageListener();
        // this._bindListeners();
    }

    _bindMessageListener(){
        this._async.on("message", function (params, ack){
            this.receivedAsyncMessageHandler(params);
            ack && ack();
        })
    }
    receivedAsyncMessageHandler = function (asyncMessage) {
        /**
         * + Message Received From Async      {object}
         *    - id                            {int}
         *    - senderMessageId               {int}
         *    - senderName                    {string}
         *    - senderId                      {int}
         *    - type                          {int}
         *    - content                       {string}
         */
        if (asyncMessage.senderName === sdkParams.serverName) {
            let content = JSON.parse(asyncMessage.content);
            api2.messenger.processChatMessage(content)
        } else {
            // callModule.callMessageHandler(asyncMessage);
        }
    }

    // _bindListeners() {
    //     this._async.on('asyncReady', this._onAsyncReady);
    //     this._async.on('stateChange', this._onAsyncStateChange);
    //     this._async.on('connect', this._onAsyncConnect);
    //     this._async.on('disconnect', this._onAsyncDisconnect);
    //     this._async.on('reconnect', this._onAsyncReconnect);
    //     this._async.on('reconnecting', this._onAsyncReconnecting);
    //     this._async.on('message', this._onAsyncMessage);
    //     this._async.on('error', this._onAsyncError);
    // }
    //
    // _onAsyncReady() {
    //     this._peerId = this._async.getPeerId();
    //     this._oldPeerId = null;
    //     if (!store.user()) {
    //         getUserAndUpdateSDKState();
    //     } else if (store.user().id > 0) {
    //         chatMessaging.chatState = true;
    //         chatEvents.fireEvent('chatReady');
    //         chatSendQueueHandler();
    //     }
    // }
    //
    // _onAsyncStateChange(state) {
    //     chatEvents.fireEvent('chatState', state);
    //     this._chatFullStateObject = state;
    //
    //     switch (state.socketState) {
    //         case 1: // CONNECTED
    //             protocolManager.resetRetries();
    //             protocolManager.resetTimerTime();
    //             if (state.deviceRegister && state.serverRegister) {
    //                 // chatMessaging.chatState = true;
    //                 // chatMessaging.ping();
    //                 chatMessaging.startChatPing();
    //             }
    //             break;
    //         case 0: // CONNECTING
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             break;
    //         case 2: // CLOSING
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             break;
    //         case 3: // CLOSED
    //             chatMessaging.chatState = false;
    //             chatMessaging.stopChatPing();
    //             // TODO: Check if this is OK or not?!
    //             //chatMessaging.sendPingTimeout && clearTimeout(chatMessaging.sendPingTimeout);
    //             break;
    //     }
    // }
    //
    // _onAsyncConnect(newPeerId) {
    //     this._peerId = newPeerId;
    //     chatEvents.fireEvent('connect');
    //     chatMessaging.ping();
    // }
    //
    // _onAsyncDisconnect(event){
    //     this._oldPeerId = this._peerId;
    //     this._peerId = undefined;
    //     chatEvents.fireEvent('disconnect', event);
    //
    //     chatEvents.fireEvent('callEvents', {
    //         type: 'CALL_ERROR',
    //         code: 7000,
    //         message: 'Call Socket is closed!',
    //         error: event
    //     });
    // }
    // _onAsyncReconnect(newPeerId){
    //     this._peerId = newPeerId;
    //     chatEvents.fireEvent('reconnect');
    // }
    //
    // _onAsyncReconnecting(event) {
    //     sdkParams.consoleLogging && console.log("[SDK][event: asyncClient.reconnecting]")
    //     protocolManager.onAsyncIsReconnecting(event);
    // }
    // _onAsyncMessage(params, ack) {
    //     receivedAsyncMessageHandler(params);
    //     ack && ack();
    // }
    // _onAsyncError(error) {
    //     chatEvents.fireEvent('error', {
    //         code: error.errorCode,
    //         message: error.errorMessage,
    //         error: error.errorEvent
    //     });
    // }

    get client(){
        return this._async;
    }
    send(params) {
        this._async.send(params)
    }

    destroy(){
        this._async.destroy().then(()=>{
            this._async = null;
        })
    }
}

let asyncClassInstance = null;
function async() {
    return asyncClassInstance.client;
}

function initAsync(
    {
       protocolManager,
       queueHost,
       queuePort,
       queueUsername,
       queuePassword,
       queueReceive,
       queueSend,
       queueConnectionTimeout,
       onStateChange,
       msgLogCallback,
       onDeviceId
   }) {
    asyncClassInstance = new AsyncClient({
        protocolManager,
        queueHost,
        queuePort,
        queueUsername,
        queuePassword,
        queueReceive,
        queueSend,
        queueConnectionTimeout,
        onStateChange,
        msgLogCallback,
        onDeviceId
    });
}

export {async, initAsync}