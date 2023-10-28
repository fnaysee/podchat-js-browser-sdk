import {WebrtcPeerConnection} from "./webrtcPeer";
import {currentCall} from "../sharedData";
import {store} from "../../store";
import {sdkParams} from "../../sdkParams";

class PeerConnectionManager {
    constructor(callId, direction, rtcPeerConfig, onTrackCallback) {
        this._nextTrackMid = 0;
        this._trackList = [];
        this._addTrackQueue = [];
        this._direction = direction;
        this._onTrackCallback = onTrackCallback;
        this._firstSub = true;
        this._canProcessNextTrack = true;

        let defaultConfig = {
            callId,
            direction,
            rtcPeerConfig
        };

        this._peer = new WebrtcPeerConnection(defaultConfig);
    }

    _nextTrack() {
        if(this._canProcessNextTrack) {
            if (this._direction == 'send' && this._addTrackQueue.length) {
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
        if (this._firstSub) {
            this._peer.peerConnection.onicecandidate = ({candidate}) => {
                currentCall().sendCallMessage({
                    id: "SEND_ADD_ICE_CANDIDATE",
                    token: sdkParams.token,
                    // clientId: currentCall().users().get(store.user().id).user().clientId,
                    iceCandidate: JSON.stringify(candidate),
                }, null, {
                    timeoutTime: 4000,
                    timeoutRetriesCount: 5
                });
            };

            item.stream.getTracks().forEach(track => {
                this._peer.peerConnection.addTrack(track, item.stream);
                // mline_topic.set(localTrackCounter, line.topic);
                // mline_track.set(localTrackCounter, track);
            });

            this._peer.peerConnection
                .createOffer()
                .then(offer => this._peer.peerConnection.setLocalDescription(offer))
                .then(() => {
                    currentCall().sendCallMessage({
                        id: "SEND_SDP_OFFER",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        token: sdkParams.token,
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
                });
        } else {
            this._peer.peerConnection
                .createOffer()
                .then(offer => this._peer.peerConnection.setLocalDescription(offer))
                .then(() => {
                    currentCall().sendCallMessage({
                        id: "SEND_NEGOTIATION",
                        sdpOffer: this._peer.peerConnection.localDescription.sdp,
                        // clientId: currentCall().users().get(store.user().id).user().clientId,
                        token: sdkParams.token,
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

    handleProcessSDPOfferForReceiveTrack(jsonMessage) {
        let topic = JSON.parse(jsonMessage.topic);

        this._peer.peerConnection.onicecandidate = ({candidate}) => {
            currentCall().sendCallMessage({
                id: "RECIVE_ADD_ICE_CANDIDATE",
                // chatId: getChatId(),
                // clientId: currentCall().users().get(store.user().id).user().clientId,
                // brokerAddress: getBrokerAddress(),
                token: sdkParams.token,
                iceCandidate: JSON.stringify(candidate),
                // addition: [{mline: 0, topic: `Vi-send-${getChatId()}-12345678`}]
            }, null, {});
        };

        this._peer.peerConnection.ontrack = ({transceiver}) => {
            this._trackList.forEach(item=>{
                if(item.topic === topic[0].topic) {
                    item.track = transceiver.receiver.track
                }
            });
            transceiver.receiver.track.onmute = (ev) => {
                // this._onTrackCallback && this._onTrackCallback();
            }
            transceiver.receiver.track.onunmute = (ev) => {
                this._onTrackCallback && this._onTrackCallback(transceiver.receiver.track);
            }
        };
    }

    addTrack(data) {
        data.mLine = this._nextTrackMid;
        this._trackList.push(data);
        this._addTrackQueue.push(data);
        this._nextTrackMid++;
        this._nextTrack();
    }

    processingCurrentTrackCompleted() {
        this._unlockProcessingNextTrack();
        this._nextTrack();
    }

    getPeer(){
        return this._peer;
    }
}

export default PeerConnectionManager