function topicMetaDataManager(params) {
    const config = {
        userId: params.userId,
        topic: params.topic,
        interval: null,
        receivedSdpAnswer: false,
        connectionQualityInterval: null,
        poorConnectionCount: 0,
        poorConnectionResolvedCount: 0,
        isConnectionPoor: false
    }

    return {
        setIsConnectionPoor: function (state) {
            config.isConnectionPoor = state;
        },
        setReceivedSdpAnswer: function (state) {
            config.receivedSdpAnswer = state;
        },
        setIceCandidateInterval: function (id) {
            config.interval = id
        },
        isConnectionPoor: function () {
            return config.isConnectionPoor;
        },
        isReceivedSdpAnswer: function () {
            return config.receivedSdpAnswer;
        },
        isIceCandidateIntervalSet: function () {
            return config.interval !== null;
        },
        clearIceCandidateInterval: function () {
            clearInterval(config.interval);
        }
    }
}

export {topicMetaDataManager}