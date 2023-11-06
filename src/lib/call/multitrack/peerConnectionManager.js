import {WebrtcPeerConnection} from "./webrtcPeer";
import {currentCall} from "../sharedData";
import {sdkParams} from "../../sdkParams";
import {chatEvents} from "../../../events.module";
import {messenger} from "../../../messaging.module";
import {de} from "faker/lib/locales";

class PeerConnectionManager {
    constructor(callId, direction, rtcPeerConfig, brokerAddress) {
        this._callId = callId;
        this._brokerAddress = brokerAddress;
        this._nextTrackMid = 0;
        this._trackList = [];
        this._addTrackQueue = [];
        this._direction = direction;
        this._firstSub = true;
        this._canProcessNextTrack = true;
        this._isDestroyed = false;
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

        this._peer = new WebrtcPeerConnection(this._defaultConfig);
    }

    _nextTrack() {
        if(this._canProcessNextTrack) {
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
        this._peer.peerConnection.onicecandidate = ({candidate}) => {
            currentCall().sendCallMessage({
                id: "SEND_ADD_ICE_CANDIDATE",
                token: sdkParams.token,
                chatId: this._callId,
                brokerAddress: this._brokerAddress,
                // clientId: currentCall().users().get(store.user().id).user().clientId,
                iceCandidate: JSON.stringify(candidate),
            }, null, {});
        };
        let localStream;
        if(item.topic.indexOf('Vi-') > -1) {
            localStream = currentCall().deviceManager().mediaStreams.getVideoInput();
            if(localStream) {
                this._peer.addTrack(localStream.getTracks()[0], localStream);
            }
        } else {
            localStream = currentCall().deviceManager().mediaStreams.getAudioInput();
            if(localStream) {
                this._peer.addTrack(localStream.getTracks()[0], localStream);
            }
        }
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
                    currentCall().sendCallMessage({
                        id: "SEND_SDP_OFFER",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        token: sdkParams.token,
                        chatId: this._callId,
                        brokerAddress: this._brokerAddress,

                        // clientId: currentCall().users().get(store.user().id).user().clientId,
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
                    console.log('debug _requestAddSendTrack 7 createOffer sdp: ', this._peer.peerConnection.localDescription.sdp);
                    currentCall().sendCallMessage({
                        id: "SEND_NEGOTIATION",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        // clientId: currentCall().users().get(store.user().id).user().clientId,
                        token: sdkParams.token,
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

    _requestReceiveTrack(item) {
        if (this._firstSub) {
            this._firstSub = false;

            currentCall().sendCallMessage({
                id: 'SUBSCRIBE',
                // chatId: getChatId(),
                // clientId: currentCall().users().get(store.user().id).user().clientId,
                token: sdkParams.token,
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
            currentCall().sendCallMessage({
                id: 'UPDATE',
                // chatId: getChatId(),
                // clientId: currentCall().users().get(store.user().id).user().clientId,
                token: sdkParams.token,
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
        }
    }

    _unlockProcessingNextTrack(){
        this._canProcessNextTrack = true;
    }

    _setPeerState(state) {
        this._state = state;
    }

    addTrack(data) {
        data.mline = this._nextTrackMid;
        this._trackList.push(data);
        this._addTrackQueue.push(data);
        this._nextTrackMid++;
        this._nextTrack();
    }

    processingCurrentTrackCompleted() {
        this._unlockProcessingNextTrack();
        this._nextTrack();
    }

    isPeerConnecting () {
        return this._state === this._peerStates.CONNECTING;
    }
    isPeerFailed () {
        return this._state === this._peerStates.FAILED;
    }
    isPeerConnected () {
        return this._state === this._peerStates.CONNECTED;
    }
    isPeerDisconnected () {
        return this._state === this._peerStates.DISCONNECTED;
    }

    _onConnectionStateChange() {
        console.log('debug _onConnectionStateChange', this._direction, this._peer.peerConnection.connectionState)
        chatEvents.fireEvent("callStreamEvents", {
            type: 'WEBRTC_CONNECTION_STATE_CHANGE',
            callId: this._callId,
            direction: this._direction,
            connectionState: this._peer.peerConnection.connectionState,
        });

        if(this.isDestroyed()) {
            return; //avoid log errors
        }

        sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.connectionState);
        if (this._peer.peerConnection.connectionState === 'disconnected') {
            //TODO: implement
            // publicized.removeConnectionQualityInterval();
            // publicized.removeAudioWatcherInterval();
        }

        if (this._peer.peerConnection.connectionState === "failed") {
            if(this.isPeerFailed())
                return;

            this._state = this._peerStates.FAILED;
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) has failed!`,
                errorInfo: this._peer.peerConnection
            });

            if(messenger().chatState) {
                this.shouldReconnectTopic();
            }
        }

        if(this._peer.peerConnection.connectionState === 'connected') {
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
        console.log('debug _onIceConnectionStateChange', this._direction, this._peer.peerConnection.connectionState)

        if(!this._peer || this.isDestroyed()) {
            return; //avoid log errors
        }

        sdkParams.consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", this._direction, " peerConnection.connectionState: ", this._peer.peerConnection.iceConnectionState);
        if (this._peer.peerConnection.iceConnectionState === 'disconnected') {
            // config.state = this._peerStates.DISCONNECTED;
            this._state = this._peerStates.DISCONNECTED;
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) is disconnected!`,
                errorInfo: this._peer
            });

            sdkParams.consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, peer:', this._direction);
        }

        if (this._peer.peerConnection.iceConnectionState === "failed") {
            if(this.isPeerFailed())
                return;

            this._state = this._peerStates.FAILED;

            chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) has failed!`,
                errorInfo: this._peer
            });
            if(messenger().chatState) {
                // publicized.shouldReconnectTopic();
            }
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
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_STATUS',
                errorCode: 7000,
                errorMessage: `Call Peer (${this._direction}) has connected!`,
                errorInfo: this._peer.peerConnection
            });
        }
    }

    shouldReconnectTopic() {
        let iceConnectionState = this._peer.peerConnection.iceConnectionState;
        if (!this.isDestroyed()) {
            if (this._peer
                && iceConnectionState != 'connected') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_STATUS',
                    errorCode: 7000,
                    errorMessage: `Call Peer (${this._direction}) is not in connected state, reconnecting peer ...!`,
                    errorInfo: this._peer
                });

                this.reconnectPeer();
            }
        }
    }

    reconnectPeer() {
        this._destroyPeer();
        this._peer = new WebrtcPeerConnection(this._defaultConfig);
    }

    handleProcessSDPOfferForReceiveTrack(jsonMessage, callback) {
        console.log('ooooooooooooooooooooooo ', {jsonMessage})
        let topics = JSON.parse(jsonMessage.topic);
        let currentTrackData;
        this._trackList.forEach(item => {
            if(item.topic === topics[0].topic) {
                // item.track = transceiver.receiver.track;
                currentTrackData = item;
            }
        });
        this._peer.peerConnection.onicecandidate = ({candidate}) => {
            currentCall().sendCallMessage({
                id: "RECIVE_ADD_ICE_CANDIDATE",
                // chatId: getChatId(),
                // clientId: currentCall().users().get(store.user().id).user().clientId,
                brokerAddress: this._brokerAddress,
                token: sdkParams.token,
                chatId: this._callId,
                iceCandidate: JSON.stringify(candidate),
                // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]
            }, null, {});
        };

        this._peer.peerConnection.ontrack = ({transceiver}) => {
            currentTrackData.track = transceiver.receiver.track;
            currentTrackData.onTrackCallback(currentTrackData, transceiver.receiver.track);
        };
        this._peer.processOffer(jsonMessage.sdpOffer, (error, sdpAnswer)=>{
            if(error) {
                return;
            }

            currentCall().sendCallMessage({
                id: "RECIVE_SDP_ANSWER",
                sdpAnswer,
                // clientId: getClientId(),
                token: sdkParams.token,
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

    getPeer(){
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

    isDestroyed(){
        return this._isDestroyed;
    }

}

export default PeerConnectionManager