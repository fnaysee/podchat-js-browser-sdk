import {WebrtcPeerConnection} from "./webrtcPeer";
import Utility from "../../../utility/utility";

class PeerConnectionManager {
    constructor({
                    app,
                    callId,
                    direction,
                    rtcPeerConfig,
                    brokerAddress,
                    onPeerFailed,
                }) {
        this._app = app;
        this._callId = callId;
        this._brokerAddress = brokerAddress;
        this._nextTrackMid = 0;
        this._trackList = [];
        this._addTrackQueue = [];
        this._addIceQueue = [];
        this._direction = direction;
        this._firstSub = true;
        this._canProcessNextTrack = true;
        this._isDestroyed = false;
        this._requestTimeouts = {};
        this._peerStates = {
            DISCONNECTED: 0,
            CONNECTING: 1,
            FAILED: 3,
            CONNECTED: 4
        };
        this._state = 0; //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected
        this._defaultConfig = {
            callId,
            direction,
            rtcPeerConfig,
            connectionStateChange: this._onConnectionStateChange.bind(this),
            iceConnectionStateChange: this._onIceConnectionStateChange.bind(this)
        };
        this._onPeerFailed = onPeerFailed;
        this._peer = new WebrtcPeerConnection(this._defaultConfig);
        this.watchConnectionStateChange()
    }

    _nextTrack() {
        if (this._canProcessNextTrack) {
            if (this._direction == 'send' && this._canProcessNextTrack && this._addTrackQueue.length) {
                this._canProcessNextTrack = false;
                let item = this._addTrackQueue.shift();
                this._requestAddSendTrack(item);
            } else if (this._direction == 'receive' && this._canProcessNextTrack && this._addTrackQueue.length) {
                this._canProcessNextTrack = false;
                let item = this._addTrackQueue.shift();
                this._requestReceiveTrack(item);
            }
        }
    }

    _requestAddSendTrack(item) {
        let that = this;
        let localTrackIndex;
        let sender = this._peer.peerConnection.getSenders().find(function (s, index) {
            if (s.track == item.stream.getTracks()[0]) {
                localTrackIndex = index;
                return true;
            }
        });

        if (sender) {
            console.warn('Track already exists in connection, direction: send');
            item.onTrackCallback(item, item.stream.getTracks()[localTrackIndex])
            return
        }

        let localStream;
        if (item.topic.indexOf('Vi-') > -1) {
            if (item.isScreenShare) {
                localStream = this._app.call.currentCall().deviceManager().mediaStreams.getScreenShareInput();
            } else {
                localStream = this._app.call.currentCall().deviceManager().mediaStreams.getVideoInput();
            }
            if (localStream) {
                this._peer.addTrack(localStream.getTracks()[0], localStream);
            }
        } else {
            localStream = this._app.call.currentCall().deviceManager().mediaStreams.getAudioInput();
            if (localStream) {
                this._peer.addTrack(localStream.getTracks()[0], localStream);
            }
        }
        this._peer.peerConnection.onicecandidate = ({candidate}) => {
            this._app.call.currentCall().sendCallMessage({
                id: "SEND_ADD_ICE_CANDIDATE",
                token: this._app.sdkParams.token,
                chatId: this._callId,
                brokerAddress: this._brokerAddress,
                // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
                iceCandidate: JSON.stringify(candidate),
            }, null, {});
        };

        item.onTrackCallback(item, localStream.getTracks()[0])
        // item.stream.getTracks().forEach(track => {
        //     this._peer.addTrack(track, item.stream);
        //     // mline_topic.set(localTrackCounter, line.topic);
        //     // mline_track.set(localTrackCounter, track);
        // });

        if (this._firstSub) {
            this._firstSub = false;
            that._peer.peerConnection
                .createOffer()
                .then(offer => {
                    return that._peer.peerConnection.setLocalDescription(offer)
                })
                .then(() => {
                    this._app.call.currentCall().sendCallMessage({
                        id: "SEND_SDP_OFFER",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        token: this._app.sdkParams.token,
                        chatId: this._callId,
                        brokerAddress: this._brokerAddress,

                        // clientId: currentCall().users().get(this._app.store.user().id).user().clientId,
                        // brokerAddress: getBrokerAddress(),
                        // chatId: getChatId(),
                        addition: [{
                            // clientId: getClientId(),
                            mline: item.mline,
                            topic: item.topic,
                            mediaType: item.mediaType
                        }]
                    }, null, {});
                })
                .catch(error => console.error({error}));
        } else {
            that._peer.peerConnection
                .createOffer()
                .then(offer => that._peer.peerConnection.setLocalDescription(offer))
                .then(() => {
                    this._app.call.currentCall().sendCallMessage({
                        id: "SEND_NEGOTIATION",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        // clientId: currentCall().users().get(this._app.store.user().id).user().clientId,
                        token: this._app.sdkParams.token,
                        chatId: this._callId,
                        brokerAddress: this._brokerAddress,

                        // brokerAddress: getBrokerAddress(),
                        // chatId: getChatId(),
                        addition: [{
                            // clientId: getClientId(),
                            mline: item.mline,
                            topic: item.topic,
                            mediaType: item.mediaType
                        }]
                    }, null, {});
                });
        }
    }

    _requestRemoveSendTrack(item) {
        let localTrackIndex;
        let sender = this._peer.peerConnection.getSenders().find(function (s, index) {
            if (s.track == item.stream.getTracks()[0]) {
                localTrackIndex = index;
                return true;
            }
        });

        if (sender) {
            this._peer.peerConnection.removeTrack(sender);
            this._trackList.forEach((it, index) => {
                if (item.topic == it.topic) {
                    delete this._trackList[index]
                }
            })

            this._peer.peerConnection
                .createOffer()
                .then(offer => this._peer.peerConnection.setLocalDescription(offer))
                .then(() => {
                    this._app.call.currentCall().sendCallMessage({
                        id: "SEND_NEGOTIATION",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        // clientId: getClientId(),
                        token: this._app.sdkParams.token,
                        chatId: this._callId,
                        // brokerAddress: getBrokerAddress(),
                        // chatId: getChatId(),
                        brokerAddress: this._brokerAddress,
                        deletion: [{
                            /*clientId: getClientId(),*/
                            mline: item.mline,
                            topic: item.topic,
                        }]
                    }, null, {});
                });
        }
    }

    _requestReceiveTrack(item) {
        if (this._firstSub) {
            this._firstSub = false;

            this._app.call.currentCall().sendCallMessage({
                id: 'SUBSCRIBE',
                // chatId: getChatId(),
                // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
                token: this._app.sdkParams.token,
                chatId: this._callId,
                brokerAddress: this._brokerAddress,
                addition: [{
                    // id: line.id,
                    // chatId: line.chatId,
                    clientId: item.clientId,
                    mline: item.mline,
                    topic: item.topic,
                    mediaType: item.mediaType
                }]
            }, null, {});
        } else {
            let uuid = Utility.generateUUID();
            this._app.call.currentCall().sendCallMessage({
                id: 'UPDATE',
                uniqueId: uuid,
                // chatId: getChatId(),
                // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
                token: this._app.sdkParams.token,
                chatId: this._callId,
                brokerAddress: this._brokerAddress,
                addition: [{
                    // id: line.id,
                    // chatId: line.chatId,
                    clientId: item.clientId,
                    mline: item.mline,
                    topic: item.topic,
                    mediaType: item.mediaType
                }]
            }, null, {});
            this.setRequestTimeout(uuid, {callback: item.onOpenFailure, item});
        }
    }

    setRequestTimeout(uuid, {callback, item}) {
        this._requestTimeouts[uuid] = {
            callback,
            topic: item.topic,
            timeout: setTimeout(() => {
                this.removeFailedTrack(item);
                this.processingCurrentTrackCompleted();
                callback && callback(item);
                delete this._requestTimeouts[uuid];
            }, 5000)
        };
    }

    removeFailedTrack(item) {
        this._addTrackQueue = this._addTrackQueue.filter(it => it.topic != item.topic);
        this._trackList = this._trackList.filter(it => it.topic != item.topic);
    }

    requestReceiveError(uuid) {
        if (this._requestTimeouts[uuid]) {
            let item = this._trackList.find(item => {
                return item && item.topic === this._requestTimeouts[uuid].topic;
            });
            this.removeRequestTimeout(uuid);
            this.removeFailedTrack(item);
            this.processingCurrentTrackCompleted();
            item.onOpenFailure(item);
        }
    }

    removeRequestTimeout(uuid){
        let record = this._requestTimeouts[uuid];
        if(record) {
            if(record.timeout)
                clearTimeout(record.timeout);
            delete this._requestTimeouts[uuid];
        }
    }

    _unlockProcessingNextTrack() {
        this._canProcessNextTrack = true;
    }

    _setPeerState(state) {
        this._state = state;
    }

    addTrack(data) {
        if (this._direction == 'send') {
            data.mline = this._nextTrackMid;
            this._nextTrackMid++;
        }

        this._trackList.push(data);
        this._addTrackQueue.push(data);
        this._nextTrack();
    }

    removeTrack(topic) {
        let item = this._trackList.find(item => {
            return item && item.topic === topic;
        });
        if (item)
            this._requestRemoveSendTrack(item);
    }

    processingCurrentTrackCompleted() {
        this._unlockProcessingNextTrack();
        this._nextTrack();
    }

    isPeerConnecting() {
        return this._state === this._peerStates.CONNECTING;
    }

    isPeerFailed() {
        return this._state === this._peerStates.FAILED;
    }

    isPeerConnected() {
        return this._state === this._peerStates.CONNECTED;
    }

    isPeerDisconnected() {
        return this._state === this._peerStates.DISCONNECTED;
    }

    _onConnectionStateChange() {
        if (!this._peer || this.isDestroyed()) {
            return; //avoid log errors
        }

        this._app.chatEvents.fireEvent("callStreamEvents", {
            type: 'WEBRTC_CONNECTION_STATE_CHANGE',
            callId: this._callId,
            direction: this._direction,
            connectionState: this._peer.peerConnection.connectionState,
        });

        this._app.sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.connectionState);
        if (this._peer.peerConnection.connectionState === 'disconnected') {
            //TODO: implement
            // publicized.removeConnectionQualityInterval();
            // publicized.removeAudioWatcherInterval();
        }

        if (this._peer.peerConnection.connectionState === "failed") {
            if (this.isPeerFailed())
                return;

            this._handlePeerFailed();
        }

        if (this._peer.peerConnection.connectionState === 'connected') {
            this._state = this._peerStates.CONNECTED;
            //TODO: implement new poorconnection
            // if(this._direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
            //     config.topicMetaData.connectionQualityInterval = setInterval(function() {
            //         publicized.checkConnectionQuality();
            //     }, 1000);
            // }
        }
    }

    _onIceConnectionStateChange() {
        if (!this._peer || this.isDestroyed()) {
            return; //avoid log errors
        }

        this._app.sdkParams.consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.iceConnectionState);
        if (this._peer.peerConnection.iceConnectionState === 'disconnected') {
            // config.state = this._peerStates.DISCONNECTED;
            this._state = this._peerStates.DISCONNECTED;
            this._app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) is disconnected!`,
                errorInfo: this._peer
            });

            this._app.sdkParams.consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, peer:', this._direction);
        }

        if (this._peer.peerConnection.iceConnectionState === "failed") {
            if (this.isPeerFailed())
                return;

            this._handlePeerFailed();
            // if(this._app.messenger.chatState) {
            // // publicized.shouldReconnectTopic();
            // }
        }

        if (this._peer.peerConnection.iceConnectionState === "connected") {
            this._state = this._peerStates.CONNECTED;
            //TODO: implement
            // if(config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
            //     config.topicMetaData.connectionQualityInterval = setInterval(function() {
            //         publicized.checkConnectionQuality();
            //     }, 1000);
            // }
            // if(config.mediaType === 'video' ) {
            //     if(config.direction === 'receive') {
            //         chatEvents.fireEvent("callEvents", {
            //             type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
            //             userId: this._userId
            //         })
            //     }
            // }

            this._state = this._peerStates.CONNECTED;
            // callRequestController.callEstablishedInMySide = true;
            this._app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) has connected!`,
                errorInfo: this._peer.peerConnection
            });
        }
    }

    _handlePeerFailed(){
        this._state = this._peerStates.FAILED;
        this._app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_STATUS',
            errorCode: 7000,
            errorMessage: `Call Peer (${this._direction}) has failed!`,
            errorInfo: this._peer
        });
        this._onPeerFailed(this._direction);
    }

    addIceCandidateToQueue(candidate) {
        this.addIceCandidate(candidate)
            .catch(error => {
                // console.log('debug addIceCandidateToQueue catch', error, this)
                this._addIceQueue.push(candidate);
            });
    }

    watchConnectionStateChange() {
        this._peer.peerConnection.onsignalingstatechange = (event) => {
            if (this._peer.peerConnection.signalingState === 'stable') {
                this._addIceQueue.forEach(item => {
                    this.addIceCandidate(item);
                });
            }
        }
    }

    async addIceCandidate(data) {
        return new Promise((resolve, reject) => {
            this._peer.peerConnection
                .addIceCandidate(data)
                .catch(err => {
                    if (err) {
                        console.warn("[peerConnectionManager addIceCandidate" + this._direction + "] " + err);
                        reject(err);
                        // this._app.chatEvents.fireEvent('callEvents', {
                        //     type: 'CALL_ERROR',
                        //     code: 7000,
                        //     message: "[" + key + "] " + err,
                        //     error: JSON.stringify(data),
                        //     environmentDetails: getCallDetails()
                        // });
                    }
                });
        });
    }

    // shouldReconnectTopic() {
    //     let iceConnectionState = this._peer.peerConnection.iceConnectionState;
    //     if (!this.isDestroyed()) {
    //         if (this._peer
    //             && iceConnectionState != 'connected') {
    //             this._app.chatEvents.fireEvent('callEvents', {
    //                 type: 'CALL_STATUS',
    //                 errorCode: 7000,
    //                 errorMessage: `Call Peer (${this._direction}) is not in connected state, reconnecting peer ...!`,
    //                 errorInfo: this._peer
    //             });
    //
    //             this.reconnectPeer();
    //         }
    //     }
    // }

    reconnectPeer() {
        this._destroyPeer();
        this._peer = new WebrtcPeerConnection(this._defaultConfig);
    }

    handleProcessSDPOfferForReceiveTrack(jsonMessage, callback) {
        let topics = JSON.parse(jsonMessage.topic);
        let currentTrackData;
        this._trackList.forEach(item => {
            if (item.topic === topics[0].topic) {
                // item.track = transceiver.receiver.track;
                currentTrackData = item;
            }
        });
        this._peer.peerConnection.onicecandidate = ({candidate}) => {
            this._app.call.currentCall().sendCallMessage({
                id: "RECIVE_ADD_ICE_CANDIDATE",
                // chatId: getChatId(),
                // clientId: this._app.call.currentCall().users().get(this._app.store.user().id).user().clientId,
                brokerAddress: this._brokerAddress,
                token: this._app.sdkParams.token,
                chatId: this._callId,
                iceCandidate: JSON.stringify(candidate),
                // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]
            }, null, {});
        };
        this._peer.peerConnection.ontrack = (infoData) => {
            const transceiver = infoData.transceiver;
            currentTrackData.track = transceiver.receiver.track;
            currentTrackData.onTrackCallback(currentTrackData, transceiver.receiver.track);
        };
        this._peer.processOffer(jsonMessage.sdpOffer, (error, sdpAnswer) => {
            if (error) {
                return;
            }

            this._app.call.currentCall().sendCallMessage({
                id: "RECIVE_SDP_ANSWER",
                sdpAnswer,
                // clientId: getClientId(),
                token: this._app.sdkParams.token,
                brokerAddress: this._brokerAddress,
                // brokerAddress: getBrokerAddress(),
                // chatId: getChatId(),
                addition: [{
                    // chatId: topic[0].chatId,
                    clientId: topics[0].clientId,
                    mline: topics[0].mline,
                    topic: topics[0].topic,
                    mediaType: topics[0].mediaType
                }]
            }, null, {});
        });
    }

    getPeer() {
        return this._peer;
    }

    _destroyPeer() {
        this._peer.dispose();
        this._peer = null;
    }

    async destroy() {
        this._isDestroyed = true;
        this._destroyPeer();
    }

    isDestroyed() {
        return this._isDestroyed;
    }

    getPeer() {
        return this._peer;
    }

}

export default PeerConnectionManager