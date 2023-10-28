function WebrtcPeerConnection({
    callId,
    direction = 'send',
    rtcPeerConfig,
    connectionStateChange = null,
    iceConnectionStateChange = null,
    onTrackCallback
}) {
    const config = {
        rtcPeerConfig,
        direction,
        offer: null,
        peerConnection: null,
        dataChannel: null,
        candidatesQueue: [],
    };

    function createPeer() {
        try {
            config.peerConnection = new RTCPeerConnection(config.rtcPeerConfig);
        } catch (err) {
            console.error("[SDK][WebrtcPeerConnection][createPeer]", err);
        }

        config.peerConnection.onconnectionstatechange = connectionStateChange;
        config.peerConnection.oniceconnectionstatechange = iceConnectionStateChange;
        config.peerConnection.addEventListener('signalingstatechange', signalingStateChangeCallback);
        config.peerConnection.addEventListener('track', onRemoteTrack);
    }

    createPeer();

    async function onRemoteTrack(event) {
        const { track, streams } = event;
        // const [remoteStream] = event.streams;
        // let newStream = new MediaStream([track])
        track.onunmute = () => {
            let newStream = new MediaStream([track])
            onTrackCallback && onTrackCallback(newStream);
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


    function addTrackToPeer(track, stream){
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
        addTrack(streamTrack, stream) {
            addTrackToPeer(streamTrack, stream);
        },
        dispose() {
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
                                stream.getTracks()
                                    .forEach(track => {track.enabled = false;})
                            })
                    }
                    config.peerConnection.close();
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

            let answer;
            let descriptionInit = {type: "answer", sdp: sdpAnswer};
            answer = new RTCSessionDescription(descriptionInit);

            // let answer = new RTCSessionDescription({
            //     type: 'answer',
            //     sdp: sdpAnswer
            // });

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