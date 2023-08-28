import {errorList} from "../errorHandler";
import {sdkParams} from "../sdkParams";
import KurentoUtils from "kurento-utils";
import {chatEvents} from "../../events.module";
import {topicMetaDataManager} from "./topicMetaDataManager";
import {
    callStopQueue, endScreenShare,
    sharedVariables
} from "./sharedData";
import {messenger} from "../../messaging.module";
import {callsManager} from "./callsList";

function CallTopicManager(
    {
        callId, userId, user, topic, mediaType, direction, deviceManager, isScreenShare
    }) {
    const config = {
        callId,
        userId,
        user,
        state: 0, //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected
        peer: null,
        topic,
        mediaType,
        direction,
        isScreenShare,
        sdpOfferRequestSent: false,
        htmlElement: null,
        topicMetaData: {
            interval: null,
            receivedSdpAnswer: false,
            connectionQualityInterval: null,
            poorConnectionCount: 0,
            poorConnectionResolvedCount: 0,
            isConnectionPoor: false
        },
        isDestroyed: false
    };

    function currentCall() {
        return callsManager().get(config.callId)
    }

    const metadataInstance = new topicMetaDataManager({
        userId,
        topic
    });
    const peerStates = {
        DISCONNECTED: 0,
        CONNECTING: 1,
        FAILED: 3,
        CONNECTED: 4
    }

    function removeStreamHTML() {
        const stream = config.htmlElement.srcObject;
        if (!!stream) {
            const tracks = stream.getTracks();

            if (!!tracks) {
                tracks.forEach(function (track) {
                    track.stop();
                });
            }

            config.htmlElement.srcObject = null;
        }

        config.htmlElement.remove();
        delete config.htmlElement;
    }

    const publicized = {
        getHtmlElement() {
            if (config.mediaType === 'video' && config.user.video && !config.htmlElement) {
                config.htmlElement = document.createElement('video');
                let el = config.htmlElement;
                el.setAttribute('id', 'uiRemoteVideo-' + config.user.videoTopicName);
                el.setAttribute('class', sharedVariables.callVideoTagClassName);
                el.setAttribute('playsinline', '');
                el.setAttribute('muted', '');
                el.setAttribute('width', sharedVariables.callVideoMinWidth + 'px');
                el.setAttribute('height', sharedVariables.callVideoMinHeight + 'px');
            } else if (config.mediaType === 'audio' && typeof config.user.mute !== 'undefined' && !config.user.mute && !config.htmlElement) {
                config.htmlElement = document.createElement('audio');
                let el = config.htmlElement;
                el.setAttribute('id', 'uiRemoteAudio-' + config.user.audioTopicName);
                el.setAttribute('class', sharedVariables.callAudioTagClassName);
                el.setAttribute('autoplay', '');
                if(config.user.direction === 'send')
                    el.setAttribute('muted', '');
                el.setAttribute('controls', '');
            }

            return config.htmlElement;
        },
        setPeerState: function (state) {
            config.state = state;
        },
        setIsScreenShare: function () {
            config.isScreenShare = true;
        },
        setDirection: function (direction) {
            config.direction = direction;
        },
        getPeer: function () {
            return config.peer;
        },
        metadata: function () {
            return metadataInstance;
        },
        isPeerConnecting: function () {
            return config.state === peerStates.CONNECTING;
        },
        isPeerFailed: function () {
            return config.state === peerStates.FAILED;
        },
        isPeerConnected: function () {
            return config.state === peerStates.CONNECTED;
        },
        isPeerDisconnected: function () {
            return config.state === peerStates.DISCONNECTED;
        },
        generateSdpOfferOptions: function () {
            let topicManager = this;
            return new Promise(function (resolve, reject) {
                let mediaConstraints = {audio: (config.mediaType === 'audio'), video: (config.mediaType === 'video')};

                if(config.direction === 'send' && config.mediaType === 'video') {
                    mediaConstraints.video = {
                        width: sharedVariables.callVideoMinWidth,
                        height: sharedVariables.callVideoMinHeight,
                        framerate: 15
                    }
                }

                let options = {
                    mediaConstraints: mediaConstraints,
                    iceTransportPolicy: 'relay',
                    onicecandidate: (candidate) => {
                        topicManager.watchForIceCandidates(candidate)
                    },
                    configuration: {
                        iceServers: currentCall().getTurnServer(currentCall().callConfig())
                    }
                };

                options[(config.direction === 'send' ? 'localVideo' : 'remoteVideo')] = config.htmlElement;

                if(config.direction === 'send') {
                    if(config.mediaType === 'video') {
                        if(config.isScreenShare) {
                            currentCall().deviceManager().grantScreenSharePermission({closeStream: false}).then(stream => {
                                stream.getVideoTracks()[0].addEventListener("ended", onScreenShareEndCallback);
                                function onScreenShareEndCallback(event) { // Click on browser UI stop sharing button
                                    if(publicized.isDestroyed())
                                        return;

                                    stream.getVideoTracks()[0].removeEventListener("ended", onScreenShareEndCallback);
                                    if(!publicized.isDestroyed() && config.peer){
                                        endScreenShare({
                                            callId: config.callId
                                        });
                                    }
                                }
                                options.videoStream = stream;
                                options.sendSource = 'screen';
                                resolve(options);
                            }).catch(function (error) {
                                let errorString = "[SDK][grantScreenSharePermission][catch] " + JSON.stringify(error)
                                console.error(errorString);
                                currentCall().raiseCallError(errorList.SCREENSHARE_PERMISSION_ERROR, null, true);
                                publicized.explainUserMediaError(error, 'video', 'screen');
                                //resolve(options);
                            });
                        } else {
                            currentCall().deviceManager().grantUserMediaDevicesPermissions({video: true}).then(() => {
                                options.videoStream = currentCall().deviceManager().mediaStreams.getVideoInput();
                                resolve(options);
                            }).catch(error => {
                                reject(error)
                            })
                        }
                    } else if(config.mediaType === 'audio') {
                        currentCall().deviceManager().grantUserMediaDevicesPermissions({audio: true}).then(() => {
                            let audioInput = currentCall().deviceManager().mediaStreams.getAudioInput();
                            currentCall().deviceManager().watchAudioInputStream(currentCall().raiseCallError)
                            options.audioStream = audioInput
                            resolve(options);
                        }).catch(error => {
                            reject(error)
                        })
                    }
                } else {
                    resolve(options)
                }

                sdkParams.consoleLogging && console.log("[SDK][getSdpOfferOptions] ", "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction, "options: ", options);
            });
        },
        watchForIceCandidates: function (candidate) {
            let manager = this;

            if (metadataInstance.isIceCandidateIntervalSet()) {
                return;
            }
            //callUsers[config.userId].topicMetaData[config.topic].interval
            metadataInstance.setIceCandidateInterval(setInterval(function () {
                if (config.topicMetaData.sdpAnswerReceived === true) {
                    sdkParams.consoleLogging && console.log("[SDK][watchForIceCandidates][setInterval] sdpAnswerReceived, topic:", config.topic)
                    config.topicMetaData.sdpAnswerReceived = false;
                    // manager.removeTopicIceCandidateInterval();
                    metadataInstance.clearIceCandidateInterval();
                    currentCall().sendCallMessage({
                        id: 'ADD_ICE_CANDIDATE',
                        topic: config.topic,
                        candidateDto: candidate
                    }, null, {})
                }
            }, 500, {candidate: candidate}));
        },
        establishPeerConnection: function (options) {
            console.log(config.topic, 4, "establishPeerConnection");
            let WebRtcFunction = config.direction === 'send' ? 'WebRtcPeerSendonly' : 'WebRtcPeerRecvonly',
                manager = this,
                user = config.user,
                topicElement = config.htmlElement;

            config.state = peerStates.CONNECTING;
            config.peer = new KurentoUtils.WebRtcPeer[WebRtcFunction](options, function (err) {
                sdkParams.consoleLogging && console.debug("[SDK][establishPeerConnection][KurentoUtils.WebRtcPeer][WebRtcFunction]: ", {options}, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);

                if (err) {
                    let errorString = "[SDK][start/webRtc " + config.direction + "  " + config.mediaType + " Peer] Error: " + publicized.explainUserMediaError(err, config.mediaType);
                    console.error(errorString);
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: errorString,
                        environmentDetails: currentCall().getCallDetails()
                    });
                    return;
                }

                manager.watchRTCPeerConnection();

                if(config.direction === 'send') {
                    //publicized.startMedia();
                    if(currentCall().users().get(config.userId).user().cameraPaused) {
                        publicized.pauseSendStream();
                    }
                }

                if(currentCall().callServerController().isJanus() && config.direction === 'receive') {
                    let msgParams = {
                        id: 'REGISTER_RECV_NOTIFICATION',
                        topic: config.topic,
                        mediaType: (config.mediaType === 'video' ? 2 : 1),
                    };
                    currentCall().sendCallMessage(msgParams, null, {
                        timeoutTime: 4000,
                        timeoutRetriesCount: 5,
                        // timeoutCallback(){
                        //     sendCallMessage(msgParams, null, {});
                        // }
                    });
                } else {
                    config.peer.generateOffer((err, sdpOffer) => {
                        sdkParams.consoleLogging && console.debug("[SDK][establishPeerConnection][generateOffer] GenerateOffer:: ", " sdpOffer: ", sdpOffer, " err: ", err);
                        if (err) {
                            let errorString = "[SDK][start/WebRc " + config.direction + "  " + config.mediaType + " Peer/generateOffer] " + err
                            console.error(errorString);
                            chatEvents.fireEvent('callEvents', {
                                type: 'CALL_ERROR',
                                code: 7000,
                                message: errorString,
                                environmentDetails: currentCall().getCallDetails()
                            });
                            return;
                        }
                        if(!config.sdpOfferRequestSent) {
                            config.sdpOfferRequestSent = true;
                            manager.sendSDPOfferRequestMessage(sdpOffer, 1);
                        }
                    });
                }
            });
        },
        sendSDPOfferRequestMessage: function (sdpOffer, retries) {
            currentCall().sendCallMessage({
                id: (config.direction === 'send' ? 'SEND_SDP_OFFER' : 'RECIVE_SDP_OFFER'),
                sdpOffer: sdpOffer,
                useComedia: true,
                useSrtp: false,
                topic: config.topic,
                mediaType: (config.mediaType === 'video' ? 2 : 1)
            }, function (result) {
                if(result.done === 'FALSE' && retries > 0) {
                    retries -= 1;
                    publicized.sendSDPOfferRequestMessage(sdpOffer);
                }
            }, {timeoutTime: 4000, timeoutRetriesCount: 5});
        },
        watchRTCPeerConnection: function () {
            sdkParams.consoleLogging && console.log("[SDK][watchRTCPeerConnection] called with: ", "userId: ", config.userId, "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction);
            let manager = this,
                user = config.user;

            config.peer.peerConnection.onconnectionstatechange = function () {
                chatEvents.fireEvent("callStreamEvents", {
                    type: 'WEBRTC_CONNECTION_STATE_CHANGE',
                    callId: config.callId,
                    userId: user.id,
                    topic: config.topic,
                    direction: config.direction,
                    connectionState: config.peer.peerConnection.connectionState,
                    mediaType: config.mediaType
                });

                if(!user || !config.peer || publicized.isDestroyed()) {
                    return; //avoid log errors
                }

                sdkParams.consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.connectionState);
                if (config.peer.peerConnection.connectionState === 'disconnected') {
                    manager.removeConnectionQualityInterval();
                    manager.removeAudioWatcherInterval();
                }

                if (config.peer.peerConnection.connectionState === "failed") {
                    if(publicized.isPeerFailed())
                        return;

                    config.state = peerStates.FAILED;
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STATUS',
                        errorCode: 7000,
                        errorMessage: `Call Peer (${config.topic}) has failed!`,
                        errorInfo: config.peer
                    });

                    if(messenger().chatState) {
                        manager.shouldReconnectTopic();
                    }
                }

                if(config.peer.peerConnection.connectionState === 'connected') {
                    config.state = peerStates.CONNECTED;
                    if(config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
                        config.topicMetaData.connectionQualityInterval = setInterval(function() {
                            manager.checkConnectionQuality();
                        }, 1000);
                    }
                }
            }

            config.peer.peerConnection.oniceconnectionstatechange = function () {
                if(!user || !config.peer || publicized.isDestroyed()) {
                    return; //avoid log errors
                }

                sdkParams.consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.iceConnectionState);
                if (config.peer.peerConnection.iceConnectionState === 'disconnected') {
                    config.state = peerStates.DISCONNECTED;
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STATUS',
                        errorCode: 7000,
                        errorMessage: `Call Peer (${config.topic}) is disconnected!`,
                        errorInfo: config.peer
                    });

                    sdkParams.consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, topic:', config.topic);
                }

                if (config.peer.peerConnection.iceConnectionState === "failed") {
                    if(publicized.isPeerFailed())
                        return;

                    config.state = peerStates.FAILED;

                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STATUS',
                        errorCode: 7000,
                        errorMessage: `Call Peer (${config.topic}) has failed!`,
                        errorInfo: config.peer
                    });
                    if(messenger().chatState) {
                        manager.shouldReconnectTopic();
                    }
                }

                if (config.peer.peerConnection.iceConnectionState === "connected") {
                    config.state = peerStates.CONNECTED;
                    if (config.mediaType === 'audio') {
                        manager.watchAudioLevel();
                    }
                    if(config.direction === 'send' && !config.topicMetaData.connectionQualityInterval) {
                        config.topicMetaData.connectionQualityInterval = setInterval(function() {
                            // if(config.mediaType === 'video' )
                            manager.checkConnectionQuality();
                            // else
                            //     manager.checkAudioConnectionQuality();
                        }, 1000);
                    }
                    if(config.mediaType === 'video' ) {
                        /*if(config.direction === 'send') {
                            user.topicMetaData[config.topic].connectionQualityInterval = setInterval(function() {
                                manager.checkConnectionQuality()
                            }, 1000);
                        }*/

                        if(config.direction === 'receive') {
                            chatEvents.fireEvent("callEvents", {
                                type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
                                userId: config.userId
                            })
                        }
                    }

                    if (config.direction === 'receive' && config.mediaType === 'audio') {
                        manager.watchAudioLevel();
                    }
                    config.state = peerStates.CONNECTED;
                    // callRequestController.callEstablishedInMySide = true;
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STATUS',
                        errorCode: 7000,
                        errorMessage: `Call Peer (${config.topic}) has connected!`,
                        errorInfo: config.peer
                    });
                }
            }
        },
        watchAudioLevel: function () {
            const manager = this
                , audioCtx = new AudioContext()
                , stream = config.direction === 'receive' ? config.peer.getRemoteStream() : config.peer.getLocalStream();
            if(config.peer && !stream) {
                setTimeout(function (){
                    manager.watchAudioLevel();
                }, 500)
                return
            }

            let user = config.user,
                topicMetadata = config.topicMetaData
            // Create and configure the audio pipeline
            const audioContext = new AudioContext();
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 512;
            analyzer.smoothingTimeConstant = 0.1;
            const sourceNode = audioContext.createMediaStreamSource(stream);
            sourceNode.connect(analyzer);

            // Analyze the sound
            topicMetadata.audioLevelInterval = setInterval(() => {
                // Compute the max volume level (-Infinity...0)
                const fftBins = new Float32Array(analyzer.frequencyBinCount); // Number of values manipulated for each sample
                analyzer.getFloatFrequencyData(fftBins);
                // audioPeakDB varies from -Infinity up to 0
                const audioPeakDB = Math.max(...fftBins);

                // Compute a wave (0...)
                const frequencyRangeData = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(frequencyRangeData);
                const sum = frequencyRangeData.reduce((p, c) => p + c, 0);
                // audioMeter varies from 0 to 10
                const audioMeter = Math.sqrt(sum / frequencyRangeData.length);

                //console.log({audioMeter}, {audioPeakDB});


                if(audioPeakDB > -50 && audioMeter > 0) {
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: convertToAudioLevel(audioPeakDB),
                        isNoise: false,
                        isMute: false
                    });
                } else if(audioPeakDB !== -Infinity && audioPeakDB < -60 && audioMeter > 0) {
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: 0,
                        isNoise: true,
                        isMute: false
                    });
                } else if(audioPeakDB === -Infinity && audioMeter == 0) {
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: 0,
                        isNoise: false,
                        isMute: true
                    });
                }
            }, 300);

            function convertToAudioLevel(soundPower){
                if(soundPower <= -60 ) {
                    return 0;
                } else if(soundPower >= -60 && soundPower < -50) {
                    return 1;
                } else if(soundPower >= -50 && soundPower < -40) {
                    return 2;
                } else if(soundPower >= -40 && soundPower < 30) {
                    return 3;
                } else if(soundPower >= -30) {
                    return 4;
                }
            }
        },
        checkConnectionQuality: function () {
            if(!currentCall()
                || !currentCall().users().get(config.userId)
                || !config.peer || !config.peer.peerConnection) {
                this.removeConnectionQualityInterval();
                this.removeAudioWatcherInterval();
                return;
            }
            config.peer.peerConnection.getStats(null).then(stats => {
                // console.log(' watchRTCPeerConnection:: window.setInterval then(stats:', stats)
                // let statsOutput = "";
                let user = config.user,
                    topicMetadata = config.topicMetaData

                stats.forEach(report => {
                    if(report && report.type && report.type === 'remote-inbound-rtp') {
                        // statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                        //     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

                        // Now the statistics for this report; we intentially drop the ones we
                        // sorted to the top above
                        if(!report['roundTripTime'] || report['roundTripTime'] > 1) {
                            if(topicMetadata.poorConnectionCount === 10) {
                                currentCall().sendQualityCheckEvent({
                                    userId: config.userId,
                                    topic: config.topic,
                                    mediaType: config.mediaType,
                                    isLongTime: true
                                });
                            }
                            if(topicMetadata.poorConnectionCount > 3 && !topicMetadata.isConnectionPoor) {
                                sdkParams.consoleLogging && console.log('[SDK][checkConnectionQuality] Poor connection detected...');
                                currentCall().sendQualityCheckEvent({
                                    userId: config.userId,
                                    topic: config.topic,
                                    mediaType: config.mediaType,
                                });
                                topicMetadata.isConnectionPoor = true;
                                topicMetadata.poorConnectionCount = 0;
                                topicMetadata.poorConnectionResolvedCount = 0;
                            } else {
                                config.topicMetaData.poorConnectionCount++;
                            }
                        } else if(report['roundTripTime'] || report['roundTripTime'] < 1) {
                            if(topicMetadata.poorConnectionResolvedCount > 3 && topicMetadata.isConnectionPoor) {
                                topicMetadata.poorConnectionResolvedCount = 0;
                                topicMetadata.poorConnectionCount = 0;
                                topicMetadata.isConnectionPoor = false;
                                currentCall().sendQualityCheckEvent({
                                    userId: config.userId,
                                    topic: config.topic,
                                    mediaType: config.mediaType,
                                    isResolved: true
                                })
                            } else {
                                topicMetadata.poorConnectionResolvedCount++;
                            }
                        }

                        // Object.keys(report).forEach(function (statName) {
                        //     if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                        //         statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                        //     }
                        // });
                    }
                });


                // document.querySelector(".stats-box").innerHTML = statsOutput;
            });
        },
        removeConnectionQualityInterval: function () {
            if(config.topicMetaData) {
                config.topicMetaData.poorConnectionCount = 0;
                clearInterval(config.topicMetaData.connectionQualityInterval);
            }
        },
        removeAudioWatcherInterval: function () {
            if(config.topicMetaData) {
                clearInterval(config.topicMetaData.audioLevelInterval);
            }
        },
        shouldReconnectTopic: function () {
            let iceConnectionState = config.peer.peerConnection.iceConnectionState;
            if (!publicized.isDestroyed()) {
                if (config.peer
                    && iceConnectionState != 'connected') {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STATUS',
                        errorCode: 7000,
                        errorMessage: `Call Peer (${config.topic}) is not in connected state, reconnecting peer ...!`,
                        errorInfo: config.peer
                    });

                    currentCall().users().get(config.userId).reconnectTopic(config.mediaType);
                }
            }
        },
        explainUserMediaError: function (err, deviceType, deviceSource) {
            /*chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: err,
                environmentDetails: getSDKCallDetails()
            });*/

            const n = err.name;
            if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks",
                    environmentDetails: currentCall().getCallDetails()
                });
                alert("Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks");
                return "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks";
            } else if (n === 'NotReadableError' || n === 'TrackStartError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use",
                    environmentDetails: currentCall().getCallDetails()
                });

                alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use");
                return (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use";
            } else if (n === 'OverconstrainedError' || n === 'ConstraintNotSatisfiedError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks",
                    environmentDetails: currentCall().getCallDetails()
                });
                alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks");
                return (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks";
            } else if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user",
                    environmentDetails: currentCall().getCallDetails()
                });
                alert((deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user");
                return (deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user";
            } else if (n === 'TypeError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "No media tracks have been requested",
                    environmentDetails: currentCall().getCallDetails()
                });
                return "No media tracks have been requested";
            } else {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "Unknown error: " + err,
                    environmentDetails: currentCall().getCallDetails()
                });
                return "Unknown error: " + err;
            }
        },
        createTopic: function () {
            console.log(config.topic, 3, "createTopic");
            let manager = this;
            if(config.peer) {
                return;
            }

            this.generateSdpOfferOptions().then(function (options) {
                sdkParams.consoleLogging && console.debug("[SDK][generateSdpOfferOptions] Options for this request have been resolved: ", {options}, "userId: ", config.userId, "topic: ", config.topic, "direction: ", config.direction);
                manager.establishPeerConnection(options);
            }).catch(error => {
                console.error(error)
            });
        },
        stopTopicOnServer() {
            return new Promise(resolve => {
                callsManager().get(config.callId).sendCallMessage({
                    id: 'STOP',
                    topic: config.topic
                }, function (result) {
                    if (result.done === 'TRUE' || result.done === 'SKIP') {
                        // manager.reconnectTopic();
                        resolve()
                    } else {
                        console.warn("[SDK] SDK tried to stop the topic but failed.", config.topic)
                    }
                }, {});
            })
        },
        removeTopic: async function () {
            let manager = this;
            if(config.peer) {
                config.sdpOfferRequestSent = false;
                // this.removeTopicIceCandidateInterval();
                metadataInstance.clearIceCandidateInterval();
                manager.removeConnectionQualityInterval();
                manager.removeAudioWatcherInterval();

                removeStreamHTML();
                config.peer.dispose();
                config.peer = null;
                config.state = peerStates.DISCONNECTED;
                if(config.direction === 'send' && !config.isScreenShare) {
                    if(config.mediaType === 'audio')
                        await currentCall().deviceManager().mediaStreams.stopAudioInput();
                    if(config.mediaType === 'video'){
                        if(!config.isScreenShare) {
                            // await config.deviceManager.mediaStreams.stopScreenShareInput()
                            //} else {
                            await currentCall().deviceManager().mediaStreams.stopVideoInput();
                            //}
                        }
                        // else {
                        //     await currentCall().deviceManager().mediaStreams.stopScreenShareInput()
                        // }
                    }
                }
            }
        },
        topicMetaData() {
            return config.topicMetaData;
        },
        /**
         * Pauses camera-send without closing its topic
         * @param params
         * @param callback
         */
        pauseSendStream() {
            config.peer.getLocalStream().getTracks()[0].enabled = false;
        },
        resumeSendStream() {
            config.peer.getLocalStream().getTracks()[0].enabled = true;
        },
        startMedia: function () {
            sdkParams.consoleLogging && console.log("[SDK][startMedia] called with: ", config.htmlElement);
            config.htmlElement.play().catch((err) => {
                if (err.name === 'NotAllowedError') {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: "[startMedia] Browser doesn't allow playing media: " + err,
                        environmentDetails: currentCall().getCallDetails()
                    });
                }
            });
        },
        restartMediaOnKeyFrame: function (userId, timeouts) {
            if(currentCall().callServerController().isJanus() )
                return;

            for (let i = 0; i < timeouts.length; i++) {
                setTimeout(function () {
                    if(!publicized.isDestroyed() && config.peer)
                        publicized.restartMedia();
                }, timeouts[i]);
            }
        },
        restartMedia() {
            if (!publicized.isDestroyed() && !currentCall().users().get(config.userId).user().cameraPaused && config.mediaType == 'video') {
                sdkParams.consoleLogging && console.log('[SDK] Sending Key Frame ...');
                let videoElement = config.htmlElement;
                let isScreenShare = userId === 'screenShare';

                if (videoElement) {
                    let videoTrack = videoElement.srcObject.getTracks()[0];

                    let width = isScreenShare ? currentCall().screenShareInfo.getWidth() : sharedVariables.callVideoMinWidth,
                        height = isScreenShare ? currentCall().screenShareInfo.getHeight() : sharedVariables.callVideoMinHeight
                        , rand = Math.random()
                        , newWidth = width - 5
                        , newHeight = height - 5;

                    if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
                        // videoTrack.enable = false;
                        newWidth = width - 80;
                        newHeight = height - 80;
                        videoTrack.applyConstraints({
                            // width: {
                            //     min: newWidth,
                            //     ideal: 1280
                            // },
                            // height: {
                            //     min: newHeight,
                            //     ideal: 720
                            // },
                            width: newWidth,
                            height: newHeight,
                            advanced: [
                                {aspectRatio: 1.77}
                            ]
                        }).then((res) => {
                            videoTrack.enabled = true;
                            setTimeout(() => {
                                videoTrack.applyConstraints({
                                    width,
                                    height,
                                    advanced: [
                                        {aspectRatio: 1.77}
                                    ]
                                });
                            }, 500);
                        }).catch(e => sdkParams.consoleLogging && console.log(e));
                    } else {
                        videoTrack.applyConstraints({
                            width: newWidth,
                            height: newHeight,
                            advanced: [
                                {aspectRatio: 1.77}
                            ]
                        }).then((res) => {
                            setTimeout(function () {
                                videoTrack.applyConstraints({
                                    width: width,
                                    height: height,
                                    advanced: [
                                        {aspectRatio: 1.77}
                                    ]
                                });
                            }, 500);
                        }).catch(e => sdkParams.consoleLogging && console.log(e));
                    }
                }
            }
        },
        isDestroyed(){
            return config.isDestroyed;
        },
        removeStreamHTML,
        async destroy() {
            config.isDestroyed = true;
            // publicized.removeStreamHTML();
            await publicized.removeTopic();
        }
    }

    return publicized
}


export {CallTopicManager}