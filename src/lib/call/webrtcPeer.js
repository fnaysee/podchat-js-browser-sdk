function WebrtcPeerConnection({
    callId,
    userId,
    direction = 'send',
    mediaType = 'video',
    rtcPeerConfig,
    stream,
    connectionStateChange = null,
    iceConnectionStateChange = null,
    onTrackCallback
    // onIceCandidate
}, onCreatePeerCallback) {
    const config = {
        rtcPeerConfig,
        direction,
        mediaType,
        offer: null,
        peerConnection: null,
        dataChannel: null,
        stream,
        candidatesQueue: [],
    };

    function createPeer() {
        console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer() ');

        try {
            config.peerConnection = new RTCPeerConnection(config.rtcPeerConfig);
        } catch (err) {
            console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer().catch ');
            console.error("[SDK][WebrtcPeerConnection][createPeer]", err);
            onCreatePeerCallback && onCreatePeerCallback(err);
        }

        // config.peerConnection.onicecandidate = handleicecandidate(lasticecandidate);
        config.peerConnection.onconnectionstatechange = connectionStateChange;
        config.peerConnection.oniceconnectionstatechange = iceConnectionStateChange;
        config.peerConnection.addEventListener('signalingstatechange', signalingStateChangeCallback);
        config.peerConnection.addEventListener('track', onRemoteTrack);
        // config.peerConnection.onicecandidate = onIceCandidate

        if (config.peerConnection.signalingState === 'closed') {
            console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer().signalingState closed');

            onCreatePeerCallback && onCreatePeerCallback(
                '[SDK][WebRtcModule] The peer connection object is in "closed" state. This is most likely due to an invocation of the dispose method before accepting in the dialogue'
            )
        }

        if(direction === 'send') {
            console.log('unmute::: callId: ', callId, 'user: ', userId, ' createPeer() ', {mediaType, direction, stream});
            stream.getTracks().forEach(addTrackToPeer);

            // if(config.mediaType === "video")
            //     onTrackCallback(stream);
            onTrackCallback(stream);
        }

        setTimeout(()=>{
            onCreatePeerCallback && onCreatePeerCallback(null);
        })
    }

    createPeer();

    async function onRemoteTrack(event) {
        const { track, streams } = event;
        // const [remoteStream] = event.streams;
        // let newStream = new MediaStream([track])
        console.log('unmute::: callId: ', callId, ' user: ', userId, ' onRemoteTrack', {event, direction, mediaType});
        track.onunmute = () => {
            let newStream = new MediaStream([track])
            console.log('unmute::: callId: ', callId, ' user: ', userId, ' onRemoteTrack.unmute', {event, direction, mediaType, streams, newStream});
            onTrackCallback(newStream);
        };
    }


    function getLocalStreams() {
        if(!config.peerConnection)
            return [];

        let stream = new MediaStream();
        config.peerConnection.getSenders().forEach(function (sender) {
            stream.addTrack(sender.track);
        });
        return [stream];
    };

    function getRemoteStreams() {
        if(!config.peerConnection)
            return [];

        let stream = new MediaStream();
        config.peerConnection.getReceivers().forEach(function (sender) {
            stream.addTrack(sender.track);
        });
        return [stream];
    };


    function addTrackToPeer(track){
        console.log('unmute::: callId: ', callId, 'user: ', userId, ' addTrackToPeer ', {mediaType, direction, track, stream});
        config.peerConnection.addTrack(track, stream)
    }

    function signalingStateChangeCallback() {
        switch (config.peerConnection.signalingState) {
            case 'stable':
                addTheCandidates();
                break;
            case 'closed':
                //TODO: notify topicManager to do sth
        }
    }

    function addTheCandidates(){
        while (config.candidatesQueue.length) {
            let entry = config.candidatesQueue.shift();
            config.peerConnection.addIceCandidate(entry.candidate, entry.callback, entry.callback);
        }
    }

    return {
        peerConnection: config.peerConnection,
        dispose() {
            console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing ', {mediaType, direction});
            if (config.peerConnection) {
                config.peerConnection.ontrack = null;
                config.peerConnection.onremovetrack = null;
                config.peerConnection.onicecandidate = null;
                config.peerConnection.oniceconnectionstatechange = null;
                config.peerConnection.onsignalingstatechange = null;
                if (config.peerConnection.signalingState !== 'closed') {
                    if (direction != 'send') {
                        getRemoteStreams()
                            .forEach(stream => {
                                console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing, clear remote tracks ', {mediaType, direction, stream});
                                stream.getTracks()
                                    .forEach(track => {track.enabled = false;})
                            })
                    }
                    config.peerConnection.close();
                    console.log('unmute::: callId: ', callId, 'user: ', userId, ' peer disposing, closed ', {mediaType, direction, stream});
                }
                config.peerConnection = null;
            }
        },
        async generateOffer(callback) {
            if(config.direction == 'send') {
                config.peerConnection.getTransceivers()
                    .forEach(function (transceiver) {
                        transceiver.direction = "sendonly";
                    });
            } else {
                config.peerConnection.addTransceiver(config.mediaType, {
                    direction: 'recvonly'
                });
            }
            try {
                await config.peerConnection.setLocalDescription();
                callback && callback(null, config.peerConnection.localDescription.sdp);
            } catch (error) {
                callback && callback(error, null);
            }
        },
        processOffer(sdpOffer, callback) {
            callback = callback.bind(this)

            let offer = new RTCSessionDescription({
                type: 'offer',
                sdp: sdpOffer
            })

            if (config.peerConnection.signalingState === 'closed') {
                return callback('[SDK][WebRtcModule] PeerConnection is closed')
            }

            config.peerConnection.setRemoteDescription(offer).then(function () {
                return; //setRemoteStream()
            }).then(function () {
                return config.peerConnection.createAnswer()
            }).then(function (answer) {
                console.debug('[SDK][WebRtcModule] Created SDP answer')
                return config.peerConnection.setLocalDescription(answer)
            }).then(function () {
                let localDescription = config.peerConnection.localDescription

                // console.debug('[SDK][WebRtcModule] Local description set\n', localDescription.sdp)
                callback(null, localDescription.sdp)
            }).catch(callback)
        },
        processAnswer(sdpAnswer, callback) {
            if (config.peerConnection.signalingState === 'closed') {
                return callback('[SDK][WebRtcModule] PeerConnection is closed');
            }

            if (config.peerConnection.signalingState === 'stable') {
                return callback('[SDK][WebRtcModule] PeerConnection is already stable');
            }

            let answer = new RTCSessionDescription({
                type: 'answer',
                sdp: sdpAnswer
            });

            config.peerConnection.setRemoteDescription(answer)
                .then(() => {
                    // if (config.direction != 'send') {
                        //setRemoteStream()
                    // }

                    callback && callback();
                }, error => {
                    // console.log("config.peerConnection.setRemoteDescription",
                    //     config.peerConnection.signalingState,
                    //     config.peerConnection.mediaType,
                    //     config.peerConnection.direction,
                    // )
                callback && callback(error);
            });
        },
        addIceCandidate(candidate, callback){
            config.candidatesQueue.push({
                candidate: new RTCIceCandidate(candidate),
                callback: callback
            });
            // console.log("[SDK][WebRtcModule] Remote ICE candidate received", candidate)
            if (config.peerConnection.signalingState === 'stable') {
                addTheCandidates();
            }
        },
        getRemoteStream(index) {
            if (config.peerConnection) {
                return config.peerConnection.getRemoteStreams()[index || 0]
            }
        },
        getLocalStream(index) {
            if (config.peerConnection) {
                return config.peerConnection.getLocalStreams()[index || 0]
            }
        },
        onConnectionStable(callback){
            config.peerConnection.addEventListener('signalingstatechange', ()=>{
                if (config.peerConnection.signalingState === 'stable') {
                    callback && callback();
                }
            });
        },
        async updateStream(stream) {
            let localTrack = stream.getTracks()[0];
            const sender = config.peerConnection.getSenders()[0];
            if (!sender) {
                config.peerConnection.addTrack(localTrack); // will create sender, streamless track must be handled on another side here
            } else {
                await sender.replaceTrack(localTrack); // replaceTrack will do it gently, no new negotiation will be triggered
            }
        }
    }
}

export {WebrtcPeerConnection}