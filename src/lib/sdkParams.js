function SDKParams(){
    return {
        token:"111",
        generalTypeCode: "default",
        typeCodeOwnerId: null,
        mapApiKey: '8b77db18704aa646ee5aaea13e7370f4f88b9e8c',
        productEnv: 'undefined',
        forceWaitQueueInMemory: false,
        grantDeviceIdFromSSO: false,
        deliveryIntervalPitch: 2000,
        seenIntervalPitch: 2000,
        systemMessageIntervalPitch: 1000,
        messagesDelivery: {},
        messagesSeen: {},
        deliveryInterval: undefined,
        seenInterval: undefined,
        getImageFromLinkObjects: {},
        locationPingTypes: {
            'CHAT': 1,
            'THREAD': 2,
            'CONTACTS': 3
        },
        isTypingInterval: undefined,
        protocol: 'websocket',
        deviceId: undefined,
        socketAddress: "",
        serverName: "",
        wsConnectionWaitTime: 0,
        connectionRetryInterval: 0,
        msgPriority: 1,
        messageTtl: 10000,
        reconnectOnClose: false,
        asyncLogging: undefined,
        chatPingMessageInterval: 20000,
        getUserInfoTimeout: undefined,
        connectionCheckTimeout: 0,
        httpRequestTimeout: 0,
        asyncRequestTimeout: 0,
        connectionCheckTimeoutThreshold: undefined,
        httpUploadRequestTimeout: 0,
        actualTimingLog: false,
        consoleLogging: false,
        fullResponseObject: false,
        webrtcConfig: null,
        callOptions: {},
        asyncPriority: undefined
    }
}


export {SDKParams};