function WebrtcPeerConnection({
    direction = 'send',
    mediaType = 'video',
    rtcPeerConfig,
    stream,
    streamElement,
    connectionStateChange = null,
    iceConnectionStateChange = null,
}, onCreatePeerCallback) {
    const config = {
        rtcPeerConfig,
        direction,
        mediaType,
        offer: null,
        peerConnection: null,
        dataChannel: null,
        stream,
        streamElement,
        candidatesQueue: [],
    };
    function createPeer() {
        try {
            config.peerConnection = new RTCPeerConnection(config.rtcPeerConfig);
        } catch (err) {
            console.error("[SDK][WebrtcPeerConnection][createPeer]", err);
            onCreatePeerCallback && onCreatePeerCallback(err);
        }

        // config.peerConnection.onicecandidate = handleicecandidate(lasticecandidate);
        config.peerConnection.onconnectionstatechange = connectionStateChange;
        config.peerConnection.oniceconnectionstatechange = iceConnectionStateChange;
        config.peerConnection.addEventListener('signalingstatechange', signalingStateChangeCallback);

        if (!config.peerConnection.getLocalStreams && config.peerConnection.getSenders) {
            config.peerConnection.getLocalStreams = function () {
                let stream = new MediaStream();
                config.peerConnection.getSenders().forEach(function (sender) {
                    stream.addTrack(sender.track);
                });
                return [stream];
            };
        }
        if (!config.peerConnection.getRemoteStreams && config.peerConnection.getReceivers) {
            config.peerConnection.getRemoteStreams = function () {
                let stream = new MediaStream();
                config.peerConnection.getReceivers().forEach(function (sender) {
                    stream.addTrack(sender.track);
                });
                return [stream];
            };
        }

        if (config.peerConnection.signalingState === 'closed') {
            onCreatePeerCallback && onCreatePeerCallback(
                '[SDK][WebRtcModule] The peer connection object is in "closed" state. This is most likely due to an invocation of the dispose method before accepting in the dialogue'
            )
        }
        if(mediaType == 'video')
            streamElement.mute = true;

        if(direction === 'send') {
            if(config.mediaType === "video")
                streamElement.srcObject = stream;
            // config.streamElement.mute = true;
            stream.getTracks().forEach(function (track) {
                config.peerConnection.addTrack(track, stream)
            });

            streamElement.play();
        }

        setTimeout(()=>{
            onCreatePeerCallback && onCreatePeerCallback(null);
        })
    }

    createPeer();

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
        // console.log("[SDK][WebRtcModule][addTheCandidates] adding the candidates")
        while (config.candidatesQueue.length) {
            let entry = config.candidatesQueue.shift();
            config.peerConnection.addIceCandidate(entry.candidate, entry.callback, entry.callback);
        }
    }

    function setRemoteStream() {
        if (config.direction != 'send') {
            config.streamElement.pause()

            let stream = config.peerConnection.getRemoteStreams()[0]
            config.streamElement.srcObject = stream
            config.streamElement.load();
            config.streamElement.play();
        }
    }

    return {
        peerConnection: config.peerConnection,
        dispose() {
            if (config.peerConnection) {
                if (config.peerConnection.signalingState === 'closed')
                    return;

                config.peerConnection.getLocalStreams()
                    .forEach(stream => stream.getTracks()
                        .forEach(track => track.stop && track.stop()))
                config.peerConnection.close();
            }
        },
        generateOffer(callback) {
            if(config.direction == 'send') {
                config.peerConnection.getTransceivers()
                    .forEach(function (transceiver) {
                        transceiver.direction = "sendonly";
                    });
            } else {
                config.peerConnection.addTransceiver(config.mediaType, {
                    direction: 'recvonly'
                });
                // if (config.mediaType == 'audio') {
                //     config.peerConnection.addTransceiver('audio', {
                //         direction: 'recvonly'
                //     });
                // }
                //
                // if (config.mediaType == 'video') {
                //     config.peerConnection.addTransceiver('video', {
                //         direction: 'recvonly'
                //     });
                // }
            }
            config.peerConnection.createOffer()
                .then(offer => {
                    return config.peerConnection.setLocalDescription(offer)
                }, error => {
                    callback && callback(error, null);
                })
                .then(result => {
                    //TODO: handle set offer result
                    // console.debug("[SDK][WebRtcModule] Set offer done. result: ", result);
                    callback && callback(null, config.peerConnection.localDescription.sdp);
                }, error => {
                    //TODO: handle set offer failed
                    // console.debug("[SDK][WebRtcModule] Set offer failed. Error:", error);
                    callback && callback(error, null);
                });
        },
        processOffer(sdpOffer, callback) {
            callback = callback.bind(this)

            let offer = new RTCSessionDescription({
                type: 'offer',
                sdp: sdpOffer
            })

            // console.debug('[SDK][WebRtcModule] SDP offer received, setting remote description')

            if (config.peerConnection.signalingState === 'closed') {
                return callback('[SDK][WebRtcModule] PeerConnection is closed')
            }

            config.peerConnection.setRemoteDescription(offer).then(function () {
                return setRemoteStream()
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
            let answer = new RTCSessionDescription({
                type: 'answer',
                sdp: sdpAnswer
            });

            if (config.peerConnection.signalingState === 'closed') {
                return callback('[SDK][WebRtcModule] PeerConnection is closed');
            }

            config.peerConnection.setRemoteDescription(answer)
                .then(() => {
                    if (config.direction != 'send') {
                        setRemoteStream()
                    }

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
        }
    }
}

export {WebrtcPeerConnection}