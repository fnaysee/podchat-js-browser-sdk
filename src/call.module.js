import { chatMessageVOTypes } from "./lib/constants"
import KurentoUtils from 'kurento-utils'
// import WebrtcAdapter from 'webrtc-adapter'
import Utility from "./utility/utility"

function ChatCall(params) {

    var //Utility = params.Utility,
        currentModuleInstance = this,
        asyncClient = params.asyncClient,
        chatEvents = params.chatEvents,
        chatMessaging = params.chatMessaging,
        token = params.token,
        asyncRequestTimeouts = {},
        inviteeVOidTypes = {
            TO_BE_USER_SSO_ID: 1,
            TO_BE_USER_CONTACT_ID: 2,
            TO_BE_USER_CELLPHONE_NUMBER: 3,
            TO_BE_USER_USERNAME: 4,
            TO_BE_USER_ID: 5,
            TO_BE_CORE_USER_ID: 6
        },
        callTypes = {
            'VOICE': 0x0,
            'VIDEO': 0x1
        },
        generalTypeCode = params.typeCode,
        callOptions = params.callOptions,
        useInternalTurnAddress = !!(params.callOptions && params.callOptions.useInternalTurnAddress),
        callTurnIp = (params.callOptions
            && params.callOptions.hasOwnProperty('callTurnIp')
            && typeof params.callOptions.callTurnIp === 'string')
            ? params.callOptions.callTurnIp
            : '46.32.6.188',
        callDivId = (params.callOptions
            && params.callOptions.hasOwnProperty('callDivId')
            && typeof params.callOptions.callDivId === 'string')
            ? params.callOptions.callDivId
            : 'call-div',
        callAudioTagClassName = (params.callOptions
            && params.callOptions.hasOwnProperty('callAudioTagClassName')
            && typeof params.callOptions.callAudioTagClassName === 'string')
            ? params.callOptions.callAudioTagClassName
            : '',
        callVideoTagClassName = (params.callOptions
            && params.callOptions.hasOwnProperty('callVideoTagClassName')
            && typeof params.callOptions.callVideoTagClassName === 'string')
            ? params.callOptions.callVideoTagClassName
            : '',
        callVideoMinWidth = (params.callOptions
            && params.callOptions.hasOwnProperty('callVideo')
            && typeof params.callOptions.callVideo === 'object'
            && params.callOptions.callVideo.hasOwnProperty('minWidth'))
            ? params.callOptions.callVideo.minWidth
            : 320,
        callVideoMinHeight = (params.callOptions
            && params.callOptions.hasOwnProperty('callVideo')
            && typeof params.callOptions.callVideo === 'object'
            && params.callOptions.callVideo.hasOwnProperty('minHeight'))
            ? params.callOptions.callVideo.minHeight
            : 180,
        currentCallParams = {},
        currentCallId = null,
        newCallId = null,
        //shouldReconnectCallTimeout = null,
        callMetaDataTypes = {
            POORCONNECTION: 1,
            POORCONNECTIONRESOLVED: 2,
            CUSTOMUSERMETADATA: 3,
            SCREENSHAREMETADATA: 4
        },
        screenShareState = {
            started: false,
            imOwner: false
        },
        screenShareInfo = new screenShareStateManager(),
        callClientType = {
            WEB: 1,
            ANDROID: 2,
            DESKTOP: 3
        },
        callUsers = {},
        callRequestController = {
            callRequestReceived: false,
            callEstablishedInMySide: false,
            iCanAcceptTheCall: function () {
                return callRequestController.callRequestReceived && callRequestController.callEstablishedInMySide;
            },
            cameraPaused: true
        },
        callStopQueue = {
            callStarted: false,
        },
        callServerController = new callServerManager(),
        messageTtl = params.messageTtl || 10000,
        config = {
            getHistoryCount: 50
        },
        callRequestTimeout = (typeof params.callRequestTimeout === 'number' && params.callRequestTimeout >= 0) ? params.callRequestTimeout : 10000,
        consoleLogging = (params.asyncLogging.consoleLogging && typeof params.asyncLogging.consoleLogging === 'boolean')
            ? params.asyncLogging.consoleLogging
            : false,
        callNoAnswerTimeout = params.callOptions.callNoAnswerTimeout || 0,
        callStreamCloseTimeout = params.callOptions.streamCloseTimeout || 10000

    function screenShareStateManager() {
        var config = {
            ownerId: 0,
            imOwner: false,
            isStarted: false,
            width: callVideoMinWidth,
            hight: callVideoMinHeight,

        }

        return {
            setOwner: function (ownerId) {
                config.ownerId = +ownerId;
            },
            setIsStarted: function (isStarted) {
                config.isStarted = isStarted;
            },
            isStarted: function () {
                return config.isStarted;
            },
            iAmOwner: function () {
                return config.ownerId === chatMessaging.userInfo.id
            },
            setWidth: function (width) {
                config.width = width;
            },
            setHeight: function (height) {
                config.height = height;
            },
            getWidth: function (width) {
                return config.width;
            },
            getHeight: function (height) {
                return config.height;
            },
            getOwner: function () {
                return config.ownerId
            },
            setDimension: function (dimension) {
                if(dimension
                    && dimension.width && +dimension.width > 0
                    && dimension.height  && +dimension.height > 0
                ) {
                    screenShareInfo.setHeight(dimension.height);
                    screenShareInfo.setWidth(dimension.width);
                } else {
                    screenShareInfo.setHeight(callVideoMinHeight);
                    screenShareInfo.setWidth(callVideoMinWidth);
                }
            }
        }
    }

    function callServerManager() {
        var config = {
            servers: [],
            currentServerIndex: 0,
        };

        return {
            setServers: function (serversList) {
                config.servers = serversList;
            },
            setCurrentServer: function (query) {
                for(let i in config.servers) {
                    if(config.servers[i].indexOf(query) !== -1) {
                        config.currentServerIndex = i;
                        break;
                    }
                }
            },
            getCurrentServer: function () {
                return config.servers[config.currentServerIndex];
            },
            isJanus: function () {
                return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
            },
            canChangeServer: function () {
                return config.currentServerIndex < config.servers.length - 1;
            },
            changeServer: function () {
                if(this.canChangeServer()) {
                    config.currentServerIndex++;
                }
            }
        }
    }

    function devicePauseStopManager(params) {
        const config = {
            userId: params.userId,
            mediaType: params.mediaType, // 'video' || 'audio'
            paused: false,
            stopped: false,
            timeoutHandler: null,
            timeout: params.timeout
        };

        const privateFunctions = {
            setTimeout: function () {
                if(config.timeoutHandler) {
                    this.removeTimeout();
                }

                /**
                 * Temporarily disable timeout feature
                 */
                //config.timeoutHandler = setTimeout(function () {
                    if(config.paused) {
                        config.stopped = true;

                        callStateController.deactivateParticipantStream(
                            config.userId,
                            config.mediaType,
                            (config.mediaType === 'video' ? 'video' : 'mute')
                        );
                    }
                //}, config.timeout);
            },
            removeTimeout: function () {
                clearTimeout(config.timeoutHandler);
            }
        };

        return {
            pauseStream: function () {
                config.paused = true
            },
            stopStream: function () {
                config.stopped = true
            },
            isStreamPaused: function () {
                return config.paused;
            },
            isStreamStopped: function () {
                return config.stopped;
            },
            disableStream: function () {
                //if(pause)
                this.pauseStream();
                privateFunctions.setTimeout()
            },
            reset: function () {
                config.paused = false;
                config.stopped = false;
                privateFunctions.removeTimeout();
            }
        }
    }

    function callTopicManager(params) {
        const config = {
            userId: params.userId,
            state: 0, //0: disconnected, 1: connecting, 2: failed, 3: connected, 4: disconnected
            peer: null,
            topic: params.topic,
            mediaType: params.mediaType,
            direction: params.direction,
            isScreenShare: false,
        };

        const metadataInstance = new topicMetaDataManager({
            userId: params.userId,
            topic: params.topic,
        });
        const peerStates = {
            DISCONNECTED: 0,
            CONNECTING: 1,
            FAILED: 3,
            CONNECTED: 4
        }

        return {
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
                var topicManager = this;
                return new Promise(function (resolve, reject) {
                    var mediaConstraints = {audio: (config.mediaType === 'audio'), video: (config.mediaType === 'video')};

                    if(config.direction === 'send' && config.mediaType === 'video') {
                        mediaConstraints.video = {
                            width: callVideoMinWidth,
                            height: callVideoMinHeight,
                            framerate: 15
                        }
                    }

                    var options = {
                        mediaConstraints: mediaConstraints,
                        iceTransportPolicy: 'relay',
                        onicecandidate: (candidate) => {
                            topicManager.watchForIceCandidates(candidate)
                        },
                        configuration: {
                            iceServers: callStateController.getTurnServer(currentCallParams)
                        }
                    };

                    options[(config.direction === 'send' ? 'localVideo' : 'remoteVideo')] = callUsers[config.userId].htmlElements[config.topic];

                    if(config.direction === 'send' && config.mediaType === 'video' && config.isScreenShare) {
                        navigator.mediaDevices.getDisplayMedia().then(function (stream) {
                            stream.getVideoTracks()[0].addEventListener("ended", function (event) { // Click on browser UI stop sharing button
                                if(callUsers['screenShare'] && config.peer){
                                    currentModuleInstance.endScreenShare({
                                        callId: currentCallId
                                    });
                                }
                            })
                            options.videoStream = stream;
                            options.sendSource = 'screen';
                            resolve(options);
                        }).catch(function (error) {
                            let errorString = "[SDK][navigator.mediaDevices.getDisplayMedia]" + JSON.stringify(error)
                            console.error(errorString);
                            chatEvents.fireEvent('callEvents', {
                                type: 'CALL_ERROR',
                                code: 7000,
                                message: errorString,
                                environmentDetails: getSDKCallDetails()
                            });
                            explainUserMediaError(error, 'video', 'screen');
                            //resolve(options);
                        });
                    } else {
                        resolve(options);
                    }
                    consoleLogging && console.log("[SDK][getSdpOfferOptions] ", "topic: ", config.topic, "mediaType: ", config.mediaType, "direction: ", config.direction, "options: ", options);
                });
            },
            watchForIceCandidates: function (candidate) {
                var manager = this;

                if (metadataInstance.isIceCandidateIntervalSet()) {
                    return;
                }
                //callUsers[config.userId].topicMetaData[config.topic].interval
                metadataInstance.setIceCandidateInterval(setInterval(function () {
                    if (callUsers[config.userId].topicMetaData[config.topic].sdpAnswerReceived === true) {
                        callUsers[config.userId].topicMetaData[config.topic].sdpAnswerReceived = false;
                        // manager.removeTopicIceCandidateInterval();
                        metadataInstance.clearIceCandidateInterval();
                        sendCallMessage({
                            id: 'ADD_ICE_CANDIDATE',
                            topic: config.topic,
                            candidateDto: candidate
                        })
                    }
                }, 500, {candidate: candidate}));
            },
            establishPeerConnection: function (options) {
                var WebRtcFunction = config.direction === 'send' ? 'WebRtcPeerSendonly' : 'WebRtcPeerRecvonly',
                    manager = this,
                    user = callUsers[config.userId],
                    topicElement = user.htmlElements[config.topic];
                    //topicMetaData = user.topicMetaData[config.topic];

                config.state = peerStates.CONNECTING;
                config.peer = new KurentoUtils.WebRtcPeer[WebRtcFunction](options, function (err) {
                    if (err) {
                        let errorString = "[SDK][start/webRtc " + config.direction + "  " + config.mediaType + " Peer] Error: " + explainUserMediaError(err, config.mediaType);
                        console.error(errorString);
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_ERROR',
                            code: 7000,
                            message: errorString,
                            environmentDetails: getSDKCallDetails()
                        });
                        return;
                    }

                    manager.watchRTCPeerConnection();

                    if(config.direction === 'send') {
                        startMedia(topicElement);
                        if(callRequestController.cameraPaused) {
                            currentModuleInstance.pauseCamera();
                        }
                    }

                    if(callServerController.isJanus() && config.direction === 'receive') {
                        sendCallMessage({
                            id: 'REGISTER_RECV_NOTIFICATION',
                            topic: config.topic,
                            mediaType: (config.mediaType === 'video' ? 2 : 1),
                        });
                    } else {
                        config.peer.generateOffer((err, sdpOffer) => {
                            if (err) {
                                let errorString = "[SDK][start/WebRc " + config.direction + "  " + config.mediaType + " Peer/generateOffer] " + err
                                console.error(errorString);
                                chatEvents.fireEvent('callEvents', {
                                    type: 'CALL_ERROR',
                                    code: 7000,
                                    message: errorString,
                                    environmentDetails: getSDKCallDetails()
                                });
                                return;
                            }
                            manager.sendSDPOfferRequestMessage(sdpOffer, 1);
                        });
                    }
                });
            },
            sendSDPOfferRequestMessage: function (sdpOffer, retries) {
                var manager = this;
                sendCallMessage({
                    id: (config.direction === 'send' ? 'SEND_SDP_OFFER' : 'RECIVE_SDP_OFFER'),
                    sdpOffer: sdpOffer,
                    useComedia: true,
                    useSrtp: false,
                    topic: config.topic,
                    mediaType: (config.mediaType === 'video' ? 2 : 1)
                }, function (result) {
                    if(result.done === 'FALSE' && retries > 0) {
                        retries -= 1;
                        manager.sendSDPOfferRequestMessage(sdpOffer);
                    }
                });
            },
            watchRTCPeerConnection: function () {
                consoleLogging && console.log("[SDK][watchRTCPeerConnection] called with: ", config.userId, config.topic, config.mediaType, config.direction);
                var manager = this,
                    user = callUsers[config.userId];

                consoleLogging && console.log("[SDK][watchRTCPeerConnection] called with: ", callUsers, user);

                config.peer.peerConnection.onconnectionstatechange = function () {
                    if(!user || !config.peer) {
                        return; //avoid log errors
                    }
                    consoleLogging && console.log("[SDK][peerConnection.onconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.connectionState);
                    if (config.peer.peerConnection.connectionState === 'disconnected') {
                        manager.removeConnectionQualityInterval();
                    }

                    if (config.peer.peerConnection.connectionState === "failed") {
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_STATUS',
                            errorCode: 7000,
                            errorMessage: `Call Peer (${config.topic}) has failed!`,
                            errorInfo: config.peer
                        });

                        if(chatMessaging.chatState) {
                            manager.shouldReconnectTopic();
                        }
                    }

                    if(config.peer.peerConnection.connectionState === 'connected') {
                        if(config.mediaType === 'video') {
                            if(config.direction === 'send') {
                                user.topicMetaData[config.topic].connectionQualityInterval = setInterval(function() {
                                    manager.checkConnectionQuality()
                                }, 1000);
                            }

                            if(config.direction === 'receive') {
                                chatEvents.fireEvent("callEvents", {
                                    type: "RECEIVE_VIDEO_CONNECTION_ESTABLISHED",
                                    userId: config.userId
                                })
                            }
                        }

                    }
                }

                config.peer.peerConnection.oniceconnectionstatechange = function () {
                    if(!user || !config.peer) {
                        return; //avoid log errors
                    }

                    consoleLogging && console.log("[SDK][oniceconnectionstatechange] ", "peer: ", config.topic, " peerConnection.connectionState: ", config.peer.peerConnection.iceConnectionState);
                    if (config.peer.peerConnection.iceConnectionState === 'disconnected') {
                        config.state = peerStates.DISCONNECTED;
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_STATUS',
                            errorCode: 7000,
                            errorMessage: `Call Peer (${config.topic}) is disconnected!`,
                            errorInfo: config.peer
                        });

                        consoleLogging && console.log('[SDK][oniceconnectionstatechange]:[disconnected] Internet connection failed, Reconnect your call, topic:', config.topic);
                    }

                    if (config.peer.peerConnection.iceConnectionState === "failed") {
                        config.state = peerStates.FAILED;

                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_STATUS',
                            errorCode: 7000,
                            errorMessage: `Call Peer (${config.topic}) has failed!`,
                            errorInfo: config.peer
                        });
                        if(chatMessaging.chatState) {
                            manager.shouldReconnectTopic();
                        }
                    }

                    if (config.peer.peerConnection.iceConnectionState === "connected") {
                        if (config.direction === 'receive' && config.mediaType === 'audio') {
                            manager.watchAudioLevel();
                        }
                        config.state = peerStates.CONNECTED;
                        callRequestController.callEstablishedInMySide = true;
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
                    , stream = config.peer.getRemoteStream();
                if(config.peer && !stream) {
                    setTimeout(function (){
                        manager.watchAudioLevel()
                    }, 500)
                    return
                }
                const audioSourceNode = audioCtx.createMediaStreamSource(stream)
                    , analyserNode = audioCtx.createScriptProcessor(2048, 1, 1);
                var instant = 0.0, counter = 0;
                analyserNode.onaudioprocess = function(event) {
                    if(!config.peer) {
                        analyserNode.removeEventListener('audioprocess');
                        analyserNode.onaudioprocess = null
                    }

                    counter++;

                    if(counter % 20 !== 0) {
                        return;
                    } else {
                        counter = 0;
                    }

                    const input = event.inputBuffer.getChannelData(0);
                    let i;
                    let sum = 0.0;
                    let clipcount = 0;
                    for (i = 0; i < input.length; ++i) {
                        sum += input[i] * input[i];
                        if (Math.abs(input[i]) > 0.99) {
                            clipcount += 1;
                        }
                    }

                    instant = Math.floor( Math.sqrt(sum / input.length) * 10000);
                    chatEvents.fireEvent('callStreamEvents', {
                        type: 'USER_SPEAKING',
                        userId: config.userId,
                        audioLevel: convertToAudioLevel(instant)
                    })
                };
                analyserNode.fftSize = 256;
                const bufferLength = analyserNode.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                audioSourceNode.connect(analyserNode);
                analyserNode.connect(audioCtx.destination);

                function convertToAudioLevel(soundPower){
                    if(soundPower < 10) {
                        return 0;
                    } else if(soundPower >= 10 && soundPower < 100) {
                        return 1;
                    } else if(soundPower >= 100 && soundPower < 200) {
                        return 2;
                    } else if(soundPower >= 200 && soundPower < 300) {
                        return 3;
                    } else if(soundPower >= 300) {
                        return 4;
                    }
                }
            },
            checkConnectionQuality: function () {
                if(!callUsers[config.userId] || !config.peer || !config.peer.peerConnection) {
                    this.removeConnectionQualityInterval();
                    return;
                }
                config.peer.peerConnection.getStats(null).then(stats => {
                    //console.log(' watchRTCPeerConnection:: window.setInterval then(stats:', stats)
                    //let statsOutput = "";
                    var user = callUsers[config.userId],
                        topicMetadata = user.topicMetaData[config.topic]

                    stats.forEach(report => {
                        if(report && report.type && report.type === 'remote-inbound-rtp') {
                            /*statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                                `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;*/

                            // Now the statistics for this report; we intentially drop the ones we
                            // sorted to the top above
                            if(!report['roundTripTime'] || report['roundTripTime'] > 1) {
                                if(topicMetadata.poorConnectionCount === 10) {
                                    chatEvents.fireEvent('callEvents', {
                                        type: 'POOR_VIDEO_CONNECTION',
                                        subType: 'LONG_TIME',
                                        message: 'Poor connection for a long time',
                                        metadata: {
                                            elementId: "uiRemoteVideo-" + config.topic,
                                            topic: config.topic,
                                            userId: config.userId
                                        }
                                    });
                                }
                                if(topicMetadata.poorConnectionCount > 3 && !topicMetadata.isConnectionPoor) {
                                    //alert('Poor connection detected...');
                                    consoleLogging && console.log('[SDK][checkConnectionQuality] Poor connection detected...');
                                    chatEvents.fireEvent('callEvents', {
                                        type: 'POOR_VIDEO_CONNECTION',
                                        subType: 'SHORT_TIME',
                                        message: 'Poor connection detected',
                                        metadata: {
                                            elementId: "uiRemoteVideo-" + config.topic,
                                            topic: config.topic,
                                            userId: config.userId
                                        }
                                    });
                                    topicMetadata.isConnectionPoor = true;
                                    topicMetadata.poorConnectionCount = 0;
                                    topicMetadata.poorConnectionResolvedCount = 0;

                                    sendCallMetaData({
                                        id: callMetaDataTypes.POORCONNECTION,
                                        userid: config.userId,
                                        content: {
                                            title: 'Poor Connection',
                                            description: config.topic,
                                        }
                                    });
                                } else {
                                    callUsers[config.userId].topicMetaData[config.topic].poorConnectionCount++;
                                }
                            } else if(report['roundTripTime'] || report['roundTripTime'] < 1) {
                                if(topicMetadata.poorConnectionResolvedCount > 3 && topicMetadata.isConnectionPoor) {
                                    topicMetadata.poorConnectionResolvedCount = 0;
                                    topicMetadata.poorConnectionCount = 0;
                                    topicMetadata.isConnectionPoor = false;
                                    chatEvents.fireEvent('callEvents', {
                                        type: 'POOR_VIDEO_CONNECTION_RESOLVED',
                                        message: 'Poor connection resolved',
                                        metadata: {
                                            elementId: "uiRemoteVideo-" + config.topic,
                                            topic: config.topic,
                                            userId: config.userId
                                        }
                                    });

                                    sendCallMetaData({
                                        id: callMetaDataTypes.POORCONNECTIONRESOLVED,
                                        userid: config.userId,
                                        content: {
                                            title: 'Poor Connection Resolved',
                                            description: config.topic
                                        }
                                    });
                                } else {
                                    topicMetadata.poorConnectionResolvedCount++;
                                }
                            }

                            /*Object.keys(report).forEach(function (statName) {
                                if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                                    statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                                }
                            });*/
                        }
                    });

                    //document.querySelector(".stats-box").innerHTML = statsOutput;
                });
            },
            removeConnectionQualityInterval: function () {
                if(callUsers[config.userId] && callUsers[config.userId].topicMetaData[config.topic]) {
                    callUsers[config.userId].topicMetaData[config.topic]['poorConnectionCount'] = 0;
                    clearInterval(callUsers[config.userId].topicMetaData[config.topic]['connectionQualityInterval']);
                }
            },
            shouldReconnectTopic: function () {
                var manager = this,
                    iceConnectionState = config.peer.peerConnection.iceConnectionState;
                if (currentCallParams && Object.keys(currentCallParams).length) {
                    if (callUsers[config.userId]
                        && config.peer
                        && iceConnectionState != 'connected') {
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_STATUS',
                            errorCode: 7000,
                            errorMessage: `Call Peer (${config.topic}) is not in connected state, Restarting call in progress ...!`,
                            errorInfo: config.peer
                        });

                        sendCallMessage({
                            id: 'STOP',
                            topic: config.topic
                        }, function (result) {
                            if (result.done === 'TRUE') {
                                manager.reconnectTopic();
                            } else if (result.done === 'SKIP') {
                               manager.reconnectTopic();
                            } else {
                                consoleLogging && console.log('STOP topic faced a problem', result);
                                endCall({
                                    callId: currentCallId
                                });
                                callStop();
                            }
                        });
                    }
                }
            },
            reconnectTopic: function () {
                const manager = this;
                manager.removeTopic().then(function () {
                    if(config.isScreenShare && screenShareInfo.isStarted()){
                        callStateController.addScreenShareToCall(config.direction, config.direction === 'send');
                    }
                    else {
                        callStateController.appendUserToCallDiv(config.userId, callStateController.generateHTMLElements(config.userId));
                        manager.createTopic();
                    }
                });
            },
            createTopic: function () {
                var manager = this;
                if(callUsers[config.userId] && config.peer) {
                    return;
                }

                this.generateSdpOfferOptions().then(function (options) {
                    manager.establishPeerConnection(options);
                });
            },
            removeTopic: function () {
                let manager = this;
                return new Promise(function (resolve, reject) {
                    if(config.peer) {
                        // this.removeTopicIceCandidateInterval();
                        metadataInstance.clearIceCandidateInterval();
                        manager.removeConnectionQualityInterval();
                        if(config.direction === 'send' && !config.isScreenShare) {
                            var constraint = {
                                audio: config.mediaType === 'audio',
                                video: (config.mediaType === 'video' ? {
                                    width: 640,
                                    framerate: 15
                                } : false)
                            }

                            callStateController.removeStreamHTML(config.userId, config.topic);
                            config.peer.dispose();
                            config.peer = null;
                            config.state = peerStates.DISCONNECTED;

                            navigator.mediaDevices.getUserMedia(constraint).then(function (stream) {
                                stream.getTracks().forEach(function (track) {
                                    if(!!track) {
                                        track.stop();
                                    }
                                });
                            }).catch(error => {
                                console.error("Could not free up some resources", error);
                                resolve(true);
                            });

                            resolve(true);
                        } else {
                            callStateController.removeStreamHTML(config.userId, config.topic);
                            config.peer.dispose();
                            config.peer = null;
                            config.state = peerStates.DISCONNECTED;
                            resolve(true);
                        }
                    }
                })

            },
        }
    }

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

    var init = function () {

        },

        sendCallMessage = function (message, callback) {
            message.token = token;

            var uniqueId;

            if (typeof params.uniqueId != 'undefined') {
                uniqueId = params.uniqueId;
            } else {
                uniqueId = Utility.generateUUID();
            }

            message.uniqueId = uniqueId;

            var data = {
                type: 3,
                content: {
                    peerName: callServerController.getCurrentServer(),// callServerName,
                    priority: 1,
                    content: JSON.stringify(message),
                    ttl: messageTtl
                }
            };

            if (typeof callback == 'function') {
                chatMessaging.messagesCallbacks[uniqueId] = callback;
            }

            asyncClient.send(data, function (res) {
                if (!res.hasError && callback) {
                    if (typeof callback == 'function') {
                        callback(res);
                    }

                    if (chatMessaging.messagesCallbacks[uniqueId]) {
                        delete chatMessaging.messagesCallbacks[uniqueId];
                    }
                }
            });

            if (callRequestTimeout > 0) {
                asyncRequestTimeouts[uniqueId] && clearTimeout(asyncRequestTimeouts[uniqueId]);
                asyncRequestTimeouts[uniqueId] = setTimeout(function () {
                    if (chatMessaging.messagesCallbacks[uniqueId]) {
                        delete chatMessaging.messagesCallbacks[uniqueId];
                    }

                    if(callServerController.canChangeServer() && message.id === 'CREATE_SESSION') {
                        // 'CREATE_SESSION',
                        callServerController.changeServer();
                        sendCallMessage(message, callback);
                        return;
                    }

                    if (typeof callback == 'function') {
                        callback({
                            done: 'SKIP'
                        });
                    }
                }, callRequestTimeout);
            }
        },

        /**
         * Format Data To Make Call Participant
         *
         * This functions reformats given JSON to proper Object
         *
         * @access private
         *
         * @param {object}  messageContent    Json object of thread taken from chat server
         *
         * @param threadId
         * @return {object} participant Object
         */
        formatDataToMakeCallParticipant = function (messageContent) {
            /**
             * + CallParticipantVO                   {object}
             *    - id                           {int}
             *    - joinTime                     {int}
             *    - leaveTime                    {int}
             *    - threadParticipant            {object}
             *    - sendTopic                    {string}
             *    - receiveTopic                 {string}
             *    - brokerAddress                {string}
             *    - active                       {boolean}
             *    - callSession                  {object}
             *    - callStatus                   {int}
             *    - createTime                   {int}
             *    - sendKey                      {string}
             *    - mute                         {boolean}
             */

            var participant = {
                id: messageContent.id,
                joinTime: messageContent.joinTime,
                leaveTime: messageContent.leaveTime,
                sendTopic: messageContent.sendTopic,
                receiveTopic: messageContent.receiveTopic,
                brokerAddress: messageContent.brokerAddress,
                active: messageContent.active,
                callSession: messageContent.callSession,
                callStatus: messageContent.callStatus,
                createTime: messageContent.createTime,
                sendKey: messageContent.sendKey,
                mute: messageContent.mute
            };

            // Add Chat Participant if exist
            if (messageContent.participantVO) {
                participant.participantVO = messageContent.participantVO;
            }

            // Add Call Session if exist
            if (messageContent.callSession) {
                participant.callSession = messageContent.callSession;
            }

            // return participant;
            return JSON.parse(JSON.stringify(participant));
        },

        /**
         * Format Data To Make Call Message
         *
         * This functions reformats given JSON to proper Object
         *
         * @access private
         *
         * @param {object}  messageContent    Json object of thread taken from chat server
         *
         * @return {object} Call message Object
         */
        formatDataToMakeCallMessage = function (threadId, pushMessageVO) {
            /**
             * + CallVO                   {object}
             *    - id                    {int}
             *    - creatorId             {int}
             *    - type                  {int}
             *    - createTime            {string}
             *    - startTime             {string}
             *    - endTime               {string}
             *    - status                {int}
             *    - isGroup               {boolean}
             *    - callParticipants      {object}
             *    - partnerParticipantVO  {object}
             *    - conversationVO        {object}
             */
            var callMessage = {
                id: pushMessageVO.id,
                creatorId: pushMessageVO.creatorId,
                type: pushMessageVO.type,
                createTime: pushMessageVO.createTime,
                startTime: pushMessageVO.startTime,
                endTime: pushMessageVO.endTime,
                status: pushMessageVO.status,
                isGroup: pushMessageVO.isGroup,
                callParticipants: pushMessageVO.callParticipants,
                partnerParticipantVO: pushMessageVO.partnerParticipantVO,
                conversationVO: pushMessageVO.conversationVO
            };

            // return pinMessage;
            return JSON.parse(JSON.stringify(callMessage));
        },

        /**
         * Reformat Call Participants
         *
         * This functions reformats given Array of call Participants
         * into proper call participant
         *
         * @access private
         *
         * @param {object}  participantsContent   Array of Call Participant Objects
         * @param {int}    threadId              Id of call
         *
         * @return {object} Formatted Call Participant Array
         */
        reformatCallParticipants = function (participantsContent) {
            var returnData = [];

            for (var i = 0; i < participantsContent.length; i++) {
                returnData.push(formatDataToMakeCallParticipant(participantsContent[i]));
            }

            return returnData;
        },

        callReceived = function (params, callback) {
            var receiveCallData = {
                chatMessageVOType: chatMessageVOTypes.RECEIVE_CALL_REQUEST,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof +params.callId === 'number' && params.callId > 0) {
                    receiveCallData.subjectId = +params.callId;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invalid call id!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to ReceiveCall()'
                });
                return;
            }

            return chatMessaging.sendMessage(receiveCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        },

        endCall = function (params, callback) {
            consoleLogging && console.log('[SDK][endCall] called...');

            var endCallData = {
                chatMessageVOType: chatMessageVOTypes.END_CALL_REQUEST,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: token
            };

            if (!callRequestController.callEstablishedInMySide) {
                return;
            }

            if (params) {
                if (typeof +params.callId === 'number' && params.callId > 0) {
                    endCallData.subjectId = +params.callId;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invalid call id!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to End the call!'
                });
                return;
            }

            callStop();

            return chatMessaging.sendMessage(endCallData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        },

        startCallWebRTCFunctions = function (params, callback) {
            if (callDivId) {
                var callVideo = (typeof params.video === 'boolean') ? params.video : true,
                    callMute = (typeof params.mute === 'boolean') ? params.mute : false;

                if(params.selfData) {
                    callStateController.setupCallParticipant(params.selfData);
                }

                screenShareInfo.setOwner(params.screenShareOwner);
                screenShareInfo.setIsStarted(!!params.screenShareOwner);

                if(params.recordingOwner) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'START_RECORDING_CALL',
                        result: {
                            id: params.recordingOwner
                        }
                    });
                }

                if(params.clientsList && params.clientsList.length) {
                    for(let i in params.clientsList) {
                        if(params.clientsList[i].userId !== chatMessaging.userInfo.id)
                            callStateController.setupCallParticipant(params.clientsList[i]);
                    }
                }

                callStateController.setupScreenSharingObject(params.screenShare);

                callback && callback(generateCallUIList());

                callStateController.createSessionInChat(Object.assign(params, {
                    callVideo: callVideo,
                    callAudio: !callMute,
                }));
            } else {
                consoleLogging && console.log('No Call DIV has been declared!');
                return;
            }
        },

        generateCallUIList = function () {
            var me = chatMessaging.userInfo.Id;
            var callUIElements = {};
            for(var i in callUsers) {
                let tags = {};
                if(callUsers[i] && callUsers[i].htmlElements){
                    tags.container = callUsers[i].htmlElements.container;
                    if(callUsers[i].htmlElements[callUsers[i].videoTopicName])
                        tags.video = callUsers[i].htmlElements[callUsers[i].videoTopicName];
                    if(callUsers[i].htmlElements[callUsers[i].audioTopicName])
                        tags.audio = callUsers[i].htmlElements[callUsers[i].audioTopicName];

                    callUIElements[i] = tags;
                }
            }
            return {
                uiElements: callUIElements,
            };
        },

        callStateController = {
            createSessionInChat: function (params) {
                currentCallParams = params;
                var callController = this;
                sendCallMessage({
                    id: 'CREATE_SESSION',
                    brokerAddress: params.brokerAddress,
                    turnAddress: params.turnAddress.split(',')[0]
                }, function (res) {
                    if (res.done === 'TRUE') {
                        callStopQueue.callStarted = true;
                        callController.startCall(params);
                    } else if (res.done === 'SKIP') {
                        callStopQueue.callStarted = true;
                        callController.startCall(params);
                    } else {
                        consoleLogging && console.log('CREATE_SESSION faced a problem', res);
                        endCall({
                            callId: currentCallId
                        });
                    }
                });
            },
            startCall: function (params) {
                var callController = this;
                for(var i in callUsers) {
                    if(i === "screenShare") {
                        if(screenShareInfo.isStarted())
                            callStateController.addScreenShareToCall('receive', false);

                        continue;
                    }


                    if(callUsers[i].video) {
                        callController.startParticipantVideo(i);
                    }
                    if(callUsers[i].mute !== undefined && !callUsers[i].mute) {
                        callController.startParticipantAudio(i);
                    }
                }
            },
            setupCallParticipant: function (participant) {
                var user = participant;
                user.topicMetaData = {};
                // user.peers = {};


                user.videoTopicManager = new callTopicManager({
                    userId: user.userId,
                    topic: 'Vi-' + user.topicSend,
                    mediaType: 'video',
                    direction: (user.userId === chatMessaging.userInfo.id ? 'send': 'receive')
                });
                user.audioTopicManager = new callTopicManager({
                    userId: user.userId,
                    topic: 'Vo-' + user.topicSend,
                    mediaType: 'audio',
                    direction: (user.userId === chatMessaging.userInfo.id ? 'send': 'receive')
                });



                if(user.userId === chatMessaging.userInfo.id) {
                    user.direction = 'send';
                } else {
                    user.direction = 'receive';
                }
                user.videoTopicName = 'Vi-' + user.topicSend;
                user.audioTopicName = 'Vo-' + user.topicSend;
                user.audioStopManager = new devicePauseStopManager({
                    userId: user.userId,
                    mediaType: 'audio',
                    timeout: callStreamCloseTimeout
                });
                if(user.mute) {
                    user.audioStopManager.pauseStream();
                    user.audioStopManager.stopStream();
                }
                user.videoStopManager = new devicePauseStopManager({
                    userId: user.userId,
                    mediaType: 'video',
                    timeout: callStreamCloseTimeout
                });
                if(!user.video) {
                    user.videoStopManager.pauseStream();
                    user.videoStopManager.stopStream();
                }
                user.topicMetaData[user.videoTopicName] = {
                    interval: null,
                    receivedSdpAnswer: false,
                    connectionQualityInterval: null,
                    poorConnectionCount: 0,
                    poorConnectionResolvedCount: 0,
                    isConnectionPoor: false
                };
                user.topicMetaData[user.audioTopicName] = {
                    interval: null,
                    receivedSdpAnswer: false,
                    connectionQualityInterval: null,
                    poorConnectionCount: 0,
                    poorConnectionResolvedCount: 0,
                    isConnectionPoor: false
                };
                callUsers[user.userId] = user;
                this.appendUserToCallDiv(user.userId, this.generateHTMLElements(user.userId));
            },
            setupScreenSharingObject: function (topic) {
                var obj = {
                    video: true,
                };
                obj.topicMetaData = {};
                obj.direction = screenShareInfo.iAmOwner() ? 'send' : 'receive';
                obj.videoTopicManager = new callTopicManager({
                    userId: 'screenShare',
                    topic: topic,
                    mediaType: 'video',
                    direction: obj.direction,
                    isScreenShare: true
                });

                obj.videoTopicName = topic;
                obj.topicMetaData[obj.videoTopicName] = {
                    interval: null,
                    receivedSdpAnswer: false,
                    connectionQualityInterval: null,
                    poorConnectionCount: 0,
                    poorConnectionResolvedCount: 0,
                    isConnectionPoor: false
                };
                callUsers['screenShare'] = obj;
                // if(screenShareInfo.isStarted())
                //     this.appendUserToCallDiv('screenShare', this.generateHTMLElements('screenShare'));
                // else
                this.generateHTMLElements('screenShare');
            },
            appendUserToCallDiv: function (userId) {
                if(!callDivId) {
                    consoleLogging && console.log('No Call DIV has been declared!');
                    return;
                }
                var user = callUsers[userId]
                var callParentDiv = document.getElementById(callDivId);
                if(user.video) {
                    if(!document.getElementById("callParticipantWrapper-" + userId)) {
                        if (!document.getElementById("uiRemoteVideo-" + user.videoTopicName)) {
                            user.htmlElements.container.appendChild(user.htmlElements[user.videoTopicName])
                        }
                    }
                    else {
                        document.getElementById("callParticipantWrapper-" + userId).append(user.htmlElements[user.videoTopicName])
                    }
                }
                if(typeof user.mute !== "undefined" && !user.mute){
                    if(!document.getElementById("callParticipantWrapper-" + userId)) {
                        if(!document.getElementById("uiRemoteAudio-" + user.videoTopicName)) {
                            user.htmlElements.container.appendChild(user.htmlElements[user.audioTopicName])
                        }
                    } else {
                        document.getElementById("callParticipantWrapper-" + userId).append(user.htmlElements[user.audioTopicName])
                    }
                }

                if(!document.getElementById("callParticipantWrapper-" + userId))
                    callParentDiv.appendChild(user.htmlElements.container);
            },
            generateHTMLElements: function (userId) {
                var user = callUsers[userId]
                if(!user.htmlElements) {
                    user.htmlElements = {
                        container: document.createElement('div')
                    };
                    var el = user.htmlElements.container;
                    el.setAttribute('id', 'callParticipantWrapper-' + userId);
                    el.classList.add('participant');
                    el.classList.add('wrapper');
                    el.classList.add('user-' + userId);
                    el.classList.add((userId === chatMessaging.userInfo.id ? 'local' : 'remote'));
                }

                if (user.video && !user.htmlElements[user.videoTopicName]) {
                    user.htmlElements[user.videoTopicName] = document.createElement('video');
                    var el = user.htmlElements[user.videoTopicName];
                    el.setAttribute('id', 'uiRemoteVideo-' + user.videoTopicName);
                    el.setAttribute('class', callVideoTagClassName);
                    el.setAttribute('playsinline', '');
                    el.setAttribute('muted', '');
                    el.setAttribute('width', callVideoMinWidth + 'px');
                    el.setAttribute('height', callVideoMinHeight + 'px');
                }

                if (typeof user.mute !== 'undefined' && !user.mute && !user.htmlElements[user.audioTopicName]) {
                    user.htmlElements[user.audioTopicName] = document.createElement('audio');
                    var el = user.htmlElements[user.audioTopicName];
                    el.setAttribute('id', 'uiRemoteAudio-' + user.audioTopicName);
                    el.setAttribute('class', callAudioTagClassName);
                    el.setAttribute('autoplay', '');
                    if(user.direction === 'send')
                        el.setAttribute('muted', '');
                    el.setAttribute('controls', '');
                }

                return user.htmlElements;
            },
            removeParticipant: function (userId) {
                var user = callUsers[userId];
                if(!user)
                    return;

                if(user.videoTopicManager && user.videoTopicManager.getPeer()) {
                    user.videoTopicManager.removeTopic();
                }
                if(user.audioTopicManager && user.audioTopicManager.getPeer()) {
                    user.audioTopicManager.removeTopic();
                }

                if(callUsers[userId]){
                    // callUsers[userId].peers = {};
                    callUsers[userId].topicMetaData = {};
                    callUsers[userId].htmlElements = {};
                    callUsers[userId] = null;
                }
            },
            startParticipantAudio: function (userId) {
                callUsers[userId].audioTopicManager.createTopic()
                // this.createTopic(userId, callUsers[userId].audioTopicName, 'audio', callUsers[userId].direction);
            },
            startParticipantVideo: function (userId) {
                callUsers[userId].videoTopicManager.createTopic()
                // this.createTopic(userId, callUsers[userId].videoTopicName, 'video', callUsers[userId].direction);
            },
            getTurnServer: function (params) {

                if (!!params.turnAddress && params.turnAddress.length > 0
                    || (useInternalTurnAddress && !!params.internalTurnAddress && params.turnAddress.length > 0 )) {

                    var serversTemp = useInternalTurnAddress ? params.internalTurnAddress.split(',') : params.turnAddress.split(','),
                        turnsList = [];

                    for(var i in serversTemp) {
                        turnsList.push({
                            "urls": "turn:" + serversTemp[i],
                            "username": "mkhorrami",
                            "credential": "mkh_123456"
                        })
                    }

                    return turnsList;
                } else {
                    return [
                        {
                            "urls": "turn:" + callTurnIp + ":3478",
                            "username": "mkhorrami",
                            "credential": "mkh_123456"
                        }
                    ];
                }
            },
            maybeReconnectAllTopics: function (){
                if(!callUsers || !Object.keys(callUsers).length || !callRequestController.callEstablishedInMySide)
                    return;

                for(var i in callUsers) {
                    // var videoTopic = callUsers[i].videoTopicName, audioTopic = callUsers[i].audioTopicName;
                    if(callUsers[i]) {
                        if(callUsers[i].videoTopicManager
                            && callUsers[i].videoTopicManager.getPeer()
                            && callUsers[i].videoTopicManager.getPeer().peerConnection.connectionState === 'failed'
                        ) {
                            callUsers[i].videoTopicManager.shouldReconnectTopic()
                        }
                        if(callUsers[i].audioTopicManager
                            && callUsers[i].audioTopicManager.getPeer()
                            && callUsers[i].audioTopicManager.getPeer().peerConnection.connectionState === 'failed'
                        ) {
                            callUsers[i].audioTopicManager.shouldReconnectTopic()
                        }
                    }
                }
            },
            removeStreamHTML : function (userId, topic) {
                if(callUsers[userId] && callUsers[userId].htmlElements && callUsers[userId].htmlElements[topic]){
                    const stream = callUsers[userId].htmlElements[topic].srcObject;
                    if (!!stream) {
                        const tracks = stream.getTracks();

                        if (!!tracks) {
                            tracks.forEach(function (track) {
                                track.stop();
                            });
                        }

                        callUsers[userId].htmlElements[topic].srcObject = null;
                    }

                    callUsers[userId].htmlElements[topic].remove();
                    delete (callUsers[userId].htmlElements[topic]);
                }
            },
            addScreenShareToCall: function (direction, shareScreen) {
                if(direction !== callUsers["screenShare"].direction) {
                    callUsers['screenShare'].direction = direction;
                    callUsers['screenShare'].videoTopicManager.setDirection(direction);
                }
                callUsers['screenShare'].videoTopicManager.setIsScreenShare(shareScreen);

                var callController = this,
                    screenShare = callUsers["screenShare"];
                if(!screenShare.videoTopicManager.getPeer()) {
                    if(!screenShare.htmlElements[screenShare.videoTopicName]) {
                        callStateController.generateHTMLElements('screenShare');
                    }
                    setTimeout(function () {
                        callStateController.appendUserToCallDiv('screenShare');
                        screenShare.videoTopicManager.createTopic();
                   });
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_DIVS',
                        result: generateCallUIList()
                    });
                } else {
                    screenShare.videoTopicManager.removeTopic();
                    if(!screenShare.htmlElements[screenShare.videoTopicName]) {
                        callStateController.generateHTMLElements('screenShare');
                    }
                    callStateController.appendUserToCallDiv('screenShare');
                    screenShare.videoTopicManager.createTopic();
                    startMedia(screenShare.htmlElements[screenShare.videoTopicName])
                }
            },
            removeScreenShareFromCall: function () {
                var screenShare = callUsers["screenShare"];
                if(screenShare && screenShareInfo.isStarted()) {
                    screenShareInfo.setIsStarted(false);
                    screenShare.videoTopicManager.removeTopic();
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_DIVS',
                        result: generateCallUIList()
                    });
                }
            },
            removeAllCallParticipants: function () {
                var removeAllUsersPromise = new Promise(function (resolve, reject) {
                    var index = 0;
                    for (var i in callUsers) {
                        index++;
                        var user = callUsers[i];
                        if (user) {
                            if(user.videoTopicManager && user.videoTopicManager.getPeer()) {
                                user.videoTopicManager.removeTopic();
                            }
                            if(user.audioTopicManager && user.audioTopicManager.getPeer()) {
                                user.audioTopicManager.removeTopic();
                            }

                            setTimeout(function (){
                                if(callUsers[i]){
                                    // callUsers[i].peers = {};
                                    callUsers[i].topicMetaData = {};
                                    callUsers[i].htmlElements = {};
                                    callUsers[i] = null;
                                }

                                if(index === Object.keys(callUsers).length)
                                    resolve();
                            }, 200);
                        }
                    }
                });

                removeAllUsersPromise.then(function (){
                    callUsers = {};
                });
            },
            findUserIdByTopic: function (topic) {
                for(var i in callUsers) {
                    if (callUsers[i] && (callUsers[i].videoTopicName === topic || callUsers[i].audioTopicName === topic)) {
                        //peer = callUsers[i].peers[jsonMessage.topic];
                        return i;
                    }
                }
            },
            activateParticipantStream: function (userId, mediaType, direction, topicNameKey, sendTopic, mediaKey) {
                if(callUsers[userId]) {
                    callUsers[userId][mediaKey] = (mediaKey !== 'mute');
                    callUsers[userId][topicNameKey] = (mediaType === 'audio'?  'Vo-':  'Vi-') + sendTopic;

                    var user = callUsers[userId];
                    callStateController.appendUserToCallDiv(userId, callStateController.generateHTMLElements(userId));
                    setTimeout(function () {
                        callUsers[userId][mediaType + 'TopicManager'].createTopic();
                        // callStateController.createTopic(userId, user[topicNameKey], mediaType, direction);
                    })
                }
            },
            deactivateParticipantStream: function (userId, mediaType, mediaKey) {
                callUsers[userId][mediaKey] = (mediaKey === 'mute' ? true : false);
                var user = callUsers[userId];
                var topicNameKey = mediaType === 'audio' ? 'audioTopicName' : 'videoTopicName';
                callUsers[userId][mediaType + 'TopicManager'].removeTopic();
            },
            setMediaBitrates: function (sdp) {
                return this.setMediaBitrate(this.setMediaBitrate(sdp, "video", 400), "audio", 50);
            },
            setMediaBitrate: function (sdp, media, bitrate) {
                var lines = sdp.split("\n");
                var line = -1;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf("m=" + media) === 0) {
                        line = i;
                        break;
                    }
                }
                if (line === -1) {
                    consoleLogging && console.debug("[SDK][setMediaBitrate] Could not find the m line for", media);
                    return sdp;
                }
                consoleLogging && console.debug("[SDK][setMediaBitrate] Found the m line for", media, "at line", line);

                // Pass the m line
                line++;

                // Skip i and c lines
                /* while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
                    line++;
                }*/

                // If we're on a b line, replace it
                if (lines[line].indexOf("b") === 0) {
                    consoleLogging && console.debug("[SDK][setMediaBitrate] Replaced b line at line", line);
                    lines[line] = "b=AS:" + bitrate;
                    return lines.join("\n");
                }

                // Add a new b line
                consoleLogging && console.debug("[SDK][setMediaBitrate] Adding new b line before line", line);
                var newLines = lines.slice(0, line);
                newLines.push("b=AS:" + bitrate + "\r");
                newLines = newLines.concat(lines.slice(line, lines.length));
                consoleLogging && console.debug("[SDK][setMediaBitrate] output: ", newLines.join("\n"));
                return newLines.join("\n")
            },
        },

        sendCallSocketError = function (message) {
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: message,
                environmentDetails: getSDKCallDetails()
            });

            sendCallMessage({
                id: 'ERROR',
                message: message,
            });
        },

        explainUserMediaError = function (err, deviceType, deviceSource) {
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
                    environmentDetails: getSDKCallDetails()
                });
                alert("Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks");
                return "Missing " + (deviceType === 'video' ? 'webcam' : 'mice') + " for required tracks";
            } else if (n === 'NotReadableError' || n === 'TrackStartError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use",
                    environmentDetails: getSDKCallDetails()
                });

                alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use");
                return (deviceType === 'video' ? 'Webcam' : 'Mice') + " is already in use";
            } else if (n === 'OverconstrainedError' || n === 'ConstraintNotSatisfiedError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks",
                    environmentDetails: getSDKCallDetails()
                });
                alert((deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks");
                return (deviceType === 'video' ? 'Webcam' : 'Mice') + " doesn't provide required tracks";
            } else if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: (deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user",
                    environmentDetails: getSDKCallDetails()
                });
                alert((deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user");
                return (deviceType === 'video' ? (deviceSource === 'screen'? 'ScreenShare' : 'Webcam') : 'Mice') + " permission has been denied by the user";
            } else if (n === 'TypeError') {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "No media tracks have been requested",
                    environmentDetails: getSDKCallDetails()
                });
                return "No media tracks have been requested";
            } else {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "Unknown error: " + err,
                    environmentDetails: getSDKCallDetails()
                });
                return "Unknown error: " + err;
            }
        },

        startMedia = function (media) {
            consoleLogging && console.log("[SDK][startMedia] called with: ", media);
            media.play().catch((err) => {
                if (err.name === 'NotAllowedError') {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: "[startMedia] Browser doesn't allow playing media: " + err,
                        environmentDetails: getSDKCallDetails()
                    });
                } else {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: "[startMedia] Error in media.play(): " + err,
                        environmentDetails: getSDKCallDetails()
                    });
                }
            });
        },

        restartMedia = function (videoTopicParam) {
            if (currentCallParams && Object.keys(currentCallParams).length) {
                consoleLogging && console.log('[SDK] Sending Key Frame ...');

                var videoTopic = !!videoTopicParam ? videoTopicParam : callUsers[chatMessaging.userInfo.id].videoTopicName;
                let videoElement = document.getElementById(`uiRemoteVideo-${videoTopic}`);

                if (videoElement) {
                    let videoTrack = videoElement.srcObject.getTracks()[0];

                    if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
                        videoTrack.enable = false;
                        let newWidth = callVideoMinWidth - (Math.ceil(Math.random() * 50) + 20);
                        let newHeight = callVideoMinHeight - (Math.ceil(Math.random() * 50) + 20);

                        videoTrack.applyConstraints({
                            // width: {
                            //     min: newWidth,
                            //     ideal: 1280
                            // },
                            // height: {
                            //     min: newHeight,
                            //     ideal: 720
                            // },
                            advanced: [
                                {
                                    width: newWidth,
                                    height: newHeight
                                },
                                {
                                    aspectRatio: 1.333
                                }
                            ]
                        }).then((res) => {
                            videoTrack.enabled = true;
                            setTimeout(() => {
                                videoTrack.applyConstraints({
                                    "width": callVideoMinWidth,
                                    "height": callVideoMinHeight
                                });
                            }, 500);
                        }).catch(e => consoleLogging && console.log(e));
                    } else {
                        videoTrack.applyConstraints({
                            "width": callVideoMinWidth - (Math.ceil(Math.random() * 5) + 5)
                        }).then((res) => {
                            setTimeout(function () {
                                videoTrack.applyConstraints({
                                    "width": callVideoMinWidth
                                });
                            }, 500);
                        }).catch(e => consoleLogging && console.log(e));
                    }
                }
            }
        },

        subscribeToReceiveOffers = function (jsonMessage) {
            if(jsonMessage.upOrDown === true) { //TRUE if participant is sending data on this topic
                sendCallMessage({
                    id: 'SUBSCRIBE',
                    useComedia: true,
                    useSrtp: false,
                    topic: jsonMessage.topic,
                    mediaType: (jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2  : 1)
                    //brokerAddress:brkrAddr
                });
            }
        },

        handleProcessSdpOffer = function (jsonMessage) {
            var userId = callStateController.findUserIdByTopic(jsonMessage.topic),
                topicManager,
                peer; //callUsers[userId].peers[jsonMessage.topic];

            if(jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1 ) {
                topicManager = callUsers[userId].videoTopicManager
                peer = callUsers[userId].videoTopicManager.getPeer();
            } else if(jsonMessage.topic.indexOf('Vo-') !== -1) {
                topicManager = callUsers[userId].audioTopicManager;
                peer = callUsers[userId].audioTopicManager.getPeer();
            }

            if (peer == null) {
                console.warn("[handleProcessSdpAnswer] Skip, no WebRTC Peer");
                return;
            }

            peer.processOffer(jsonMessage.sdpOffer, function (err, sdpAnswer) {
                if (err) {
                    console.error("[SDK][handleProcessSdpOffer] Error: " + err);
                    stop();
                    return;
                }

                sendCallMessage({
                    id: 'RECIVE_SDP_ANSWER',
                    sdpAnswer: sdpAnswer,
                    useComedia: true,
                    useSrtp: false,
                    topic: jsonMessage.topic,
                    mediaType: (jsonMessage.topic.indexOf('screen-Share') !== -1 || jsonMessage.topic.indexOf('Vi-') !== -1 ? 2 : 1)
                });

                callUsers[userId].topicMetaData[jsonMessage.topic].sdpAnswerReceived = true;
                startMedia(callUsers[userId].htmlElements[jsonMessage.topic]);
                if(userId == 'screenShare' || userId == chatMessaging.userInfo.id) {
                    restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000]);
                }
            });
        },

        handleProcessSdpAnswer = function (jsonMessage) {
            var userId = callStateController.findUserIdByTopic(jsonMessage.topic),
                topicManager,
                peer; // = callUsers[userId].peers[jsonMessage.topic];

            if(userId && callUsers[userId]) {
                if(jsonMessage.topic.indexOf('Vi-') !== -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
                    topicManager = callUsers[userId].videoTopicManager;
                    peer = callUsers[userId].videoTopicManager.getPeer();
                } else if(jsonMessage.topic.indexOf('Vo-') !== -1) {
                    topicManager = callUsers[userId].audioTopicManager;
                    peer = callUsers[userId].audioTopicManager.getPeer();
                }
            }


            if (peer == null) {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "[handleProcessSdpAnswer] Skip, no WebRTC Peer",
                    error: peer,
                    environmentDetails: getSDKCallDetails()
                });
                return;
            }

            peer.processAnswer(jsonMessage.sdpAnswer, (err) => {
                if (err) {
                    sendCallSocketError("[handleProcessSdpAnswer] Error: " + err);

                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: "[handleProcessSdpAnswer] Error: " + err,
                        environmentDetails: getSDKCallDetails()
                    });

                    return;
                }

                consoleLogging && console.log("[SDK][handleProcessSdpAnswer]", jsonMessage, jsonMessage.topic);

                if (topicManager.metadata().isIceCandidateIntervalSet()){
                    callUsers[userId].topicMetaData[jsonMessage.topic].sdpAnswerReceived = true;
                    startMedia(callUsers[userId].htmlElements[jsonMessage.topic]);
                    if (userId == 'screenShare' || userId == chatMessaging.userInfo.id) {
                        restartMediaOnKeyFrame(userId, [2000, 4000, 8000, 12000, 20000]);
                    }
                }
            });
        },

        handleAddIceCandidate = function (jsonMessage) {
            var userId = callStateController.findUserIdByTopic(jsonMessage.topic);

            let peer; //= callUsers[userId].peers[jsonMessage.topic];

            if(jsonMessage.topic.indexOf('Vi-') > -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
                peer = callUsers[userId].videoTopicManager.getPeer();
            } else if(jsonMessage.topic.indexOf('Vo-') > -1) {
                peer = callUsers[userId].audioTopicManager.getPeer();
            }

            if (peer == null) {
                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ERROR',
                    code: 7000,
                    message: "[handleAddIceCandidate] Skip, no WebRTC Peer",
                    error: JSON.stringify(peer),
                    environmentDetails: getSDKCallDetails()
                });
                return;
            }

            peer.addIceCandidate(jsonMessage.candidate, (err) => {
                if (err) {
                    console.error("[handleAddIceCandidate] " + err);

                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: "[handleAddIceCandidate] " + err,
                        error: JSON.stringify(jsonMessage.candidate),
                        environmentDetails: getSDKCallDetails()
                    });

                    return;
                }
            });
        },

        handlePartnerFreeze = function (jsonMessage) {
            if (!!jsonMessage && !!jsonMessage.topic && jsonMessage.topic.substring(0, 2) === 'Vi') {
                restartMedia(jsonMessage.topic);
                setTimeout(function () {
                    restartMedia(jsonMessage.topic)
                }, 4000);
                setTimeout(function () {
                    restartMedia(jsonMessage.topic)
                }, 8000);
            }
        },

        handleError = function (jsonMessage, sendingTopic, receiveTopic) {
            const errMessage = jsonMessage.message;

            chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: "Kurento error: " + errMessage,
                environmentDetails: getSDKCallDetails()
            });
        },

        releaseResource = function (mediaType) {
            var constraint = {
                audio: mediaType === 'audio',
                video: (mediaType === 'video' ? {
                    width: 640,
                    framerate: 15
                } : false)
            }
            navigator.mediaDevices.getUserMedia(constraint).then(function (stream) {
                stream.getTracks().forEach(function (track) {
                    if(!!track) {
                        track.stop();
                    }
                });

            }).catch(error => {
                consoleLogging && console.error(error)
            })
        },

        callStop = function () {
            if(callUsers) {
                let me = callUsers[chatMessaging.userInfo.id];
                if(me) {
                    if(me.video)
                        releaseResource('video');
                    if(!me.mute)
                        releaseResource('audio');
                }
            }

            callStateController.removeAllCallParticipants();

            if (callStopQueue.callStarted) {
                sendCallMessage({
                    id: 'CLOSE'
                });
                callStopQueue.callStarted = false;
            }

            callRequestController.cameraPaused = false;
            callRequestController.callEstablishedInMySide = false;
            callRequestController.callRequestReceived = false;
            currentCallParams = {};
            currentCallId = null;
        },

        restartMediaOnKeyFrame = function (userId, timeouts) {
            if(callServerController.isJanus())
                return;

            for (var i = 0; i < timeouts.length; i++) {
                setTimeout(function () {
                    if(typeof callUsers[userId] !== "undefined" && callUsers[userId] && callUsers[userId].videoTopicManager.getPeer()) //callUsers[userId].peers[callUsers[userId].videoTopicName]
                        restartMedia(callUsers[userId].videoTopicName);
                }, timeouts[i]);
            }
        },

        sendCallMetaData = function (params) {
            var message =  {
                id: params.id,
                userid: params.userid,
                content: params.content || undefined
            };

            sendCallMessage({
                id: 'SENDMETADATA',
                message: JSON.stringify(message),
                chatId: currentCallId
            });
        },

        handleReceivedMetaData = function (jsonMessage, uniqueId) {
            var jMessage = JSON.parse(jsonMessage.message);
            var id = jMessage.id;
            if(!id || typeof id === "undefined" || jsonMessage.userid == chatMessaging.userInfo.id) {
                return;
            }

            switch (id) {
                case callMetaDataTypes.POORCONNECTION:
                    chatEvents.fireEvent("callEvents", {
                        type: 'POOR_VIDEO_CONNECTION',
                        subType: 'SHORT_TIME',
                        message: 'Poor connection detected',
                        metadata: {
                            elementId: "uiRemoteVideo-" + jMessage.content.description,
                            topic: jMessage.content.description,
                            userId: jMessage.userid
                        }
                    });
                    break;
                case callMetaDataTypes.POORCONNECTIONRESOLVED:
                    chatEvents.fireEvent('callEvents', {
                        type: 'POOR_VIDEO_CONNECTION_RESOLVED',
                        message: 'Poor connection resolved',
                        metadata: {
                            elementId: "uiRemoteVideo-" + jMessage.content.description,
                            topic: jMessage.content.description,
                            userId: jMessage.userid
                        }
                    });
                    break;
                case callMetaDataTypes.CUSTOMUSERMETADATA:
                    if (chatMessaging.messagesCallbacks[uniqueId]) {
                        chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                    }
                    chatEvents.fireEvent('callEvents', {
                        type: 'CUSTOM_USER_METADATA',
                        userId: jMessage.userid,
                        content: jMessage.content
                    });
                    break;
                case callMetaDataTypes.SCREENSHAREMETADATA:
                    screenShareInfo.setWidth(jMessage.content.dimension.width);
                    screenShareInfo.setHeight(jMessage.content.dimension.height);
                    applyScreenShareSizeToElement();
                    chatEvents.fireEvent("callEvents", {
                        type: 'SCREENSHARE_METADATA',
                        userId: jMessage.userid,
                        content: jMessage.content
                    });
                    break;
            }

        },

        applyScreenShareSizeToElement = function () {
            var videoElement = callUsers['screenShare'].htmlElements[callUsers['screenShare'].videoTopicName];
            let videoTrack = (videoElement.srcObject
                && videoElement.srcObject.getTracks()
                && videoElement.srcObject.getTracks().length ? videoElement.srcObject.getTracks()[0] : null);

            if(videoTrack) {
                if (navigator && !!navigator.userAgent.match(/firefox/gi)) {
                    videoTrack.enable = false;
                    let newWidth = callVideoMinWidth - (Math.ceil(Math.random() * 50) + 20);
                    let newHeight = callVideoMinHeight - (Math.ceil(Math.random() * 50) + 20);

                    videoTrack.applyConstraints({
                        advanced: [
                            {
                                width: screenShareInfo.getWidth(),
                                height: screenShareInfo.getHeight()
                            },
                            {
                                aspectRatio: 1.333
                            }
                        ]
                    }).then((res) => {
                        videoTrack.enabled = true;
                        setTimeout(() => {
                            videoTrack.applyConstraints({
                                "width": screenShareInfo.getWidth(),
                                "height": screenShareInfo.getHeight()
                            });
                        }, 500);
                    }).catch(e => consoleLogging && console.log(e));
                } else {
                    videoTrack.applyConstraints({
                        "width": screenShareInfo.getWidth() - (Math.ceil(Math.random() * 5) + 5)
                    }).then((res) => {
                        setTimeout(function () {
                            videoTrack.applyConstraints({
                                "width": screenShareInfo.getWidth()
                            });
                        }, 500);
                    }).catch(e => consoleLogging && console.log(e));
                }
            }
        },

        getSDKCallDetails = function (customData) {
            return {
                currentUser: chatMessaging.userInfo,
                currentServers: {
                    callTurnIp,

                },
                isJanus: currentCallId && callServerController.isJanus(),
                screenShareInfo: {
                    isStarted: screenShareInfo.isStarted(),
                    iAmOwner: screenShareInfo.iAmOwner(),
                },
                callId: currentCallId,
                startCallInfo: currentCallParams,
                customData
            }
        }

    this.updateToken = function (newToken) {
        token = newToken;
    }

    this.callMessageHandler = function (callMessage) {
        var jsonMessage = (typeof callMessage.content === 'string' && Utility.isValidJson(callMessage.content))
            ? JSON.parse(callMessage.content)
            : callMessage.content,
            uniqueId = jsonMessage.uniqueId;


        asyncRequestTimeouts[uniqueId] && clearTimeout(asyncRequestTimeouts[uniqueId]);

        if(jsonMessage.done === 'FALSE') {
            chatEvents.fireEvent('callEvents', {
                type: 'CALL_ERROR',
                code: 7000,
                message: "Kurento error: " + (jsonMessage.desc ? jsonMessage.desc : jsonMessage.message),
                environmentDetails: getSDKCallDetails()
            });
        }

        switch (jsonMessage.id) {
            case 'PROCESS_SDP_ANSWER':
                handleProcessSdpAnswer(jsonMessage);
                break;
            case 'RECEIVING_MEDIA': // Only for receiving topics from janus, first we subscribe
                subscribeToReceiveOffers(jsonMessage);
                break;
            case 'PROCESS_SDP_OFFER':  //Then janus sends offers
                handleProcessSdpOffer(jsonMessage);
                break;
            case 'ADD_ICE_CANDIDATE':
                handleAddIceCandidate(jsonMessage);
                break;

            case 'GET_KEY_FRAME':
                if(callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
                    restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000,4000,8000,12000]);
                }
                if(callUsers && callUsers['screenShare']
                    && callUsers['screenShare'].video
                    && screenShareInfo.isStarted()
                    && screenShareInfo.iAmOwner()
                ) {
                    restartMediaOnKeyFrame('screenShare', [2000,4000,8000,12000]);
                }
                break;

            case 'FREEZED':
                handlePartnerFreeze(jsonMessage);
                break;

            /*case 'STOPALL':
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                }
                break;*/

            case 'STOP':
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                }
                break;

            case 'CLOSE':
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                }
                break;

            case 'SESSION_NEW_CREATED':
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                }
                break;

            case 'SESSION_REFRESH':
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](jsonMessage);
                }
                break;

            case 'RECEIVEMETADATA':
                handleReceivedMetaData(jsonMessage, uniqueId);

                break;

            case 'ERROR':
                handleError(jsonMessage, params.sendingTopic, params.receiveTopic);
                break;

            default:
                console.warn("[SDK][onmessage] Invalid message, id: " + jsonMessage.id, jsonMessage);
                if (jsonMessage.match(/NOT CREATE SESSION/g)) {
                    if (currentCallParams && Object.keys(currentCallParams)) {
                        //handleCallSocketOpen(currentCallParams);
                        callStateController.createSessionInChat(currentCallParams);
                    }
                }
                break;
        }
    };

    this.asyncInitialized = function (async) {
        asyncClient = async;

        asyncClient.on('asyncReady', function (){
            callStateController.maybeReconnectAllTopics();
        })
    };

    this.handleChatMessages = function(type, chatMessageVOTypes, messageContent, contentCount, threadId, uniqueId) {
        switch (type) {
            /**
             * Type 70    Send Call Request
             */
            case chatMessageVOTypes.CALL_REQUEST:
                callRequestController.callRequestReceived = true;
                callReceived({
                    callId: messageContent.callId
                }, function (r) {

                });

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'RECEIVE_CALL',
                    result: messageContent
                });

                if (messageContent.callId > 0) {
                    if(!currentCallId ) {
                        currentCallId = messageContent.callId;
                    }
                    else
                        newCallId = messageContent.callId;
                } else {
                    chatEvents.fireEvent('callEvents', {
                        type: 'PARTNER_RECEIVED_YOUR_CALL',
                        result: messageContent
                    });
                }

                break;

            /**
             * Type 71    Accept Call Request
             */
            case chatMessageVOTypes.ACCEPT_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'ACCEPT_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 72    Reject Call Request
             */
            case chatMessageVOTypes.REJECT_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'REJECT_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 73    Receive Call Request
             */
            case chatMessageVOTypes.RECEIVE_CALL_REQUEST:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if (messageContent.callId > 0) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'RECEIVE_CALL',
                        result: messageContent
                    });
                    if(!currentCallId ) {
                        currentCallId = messageContent.callId;
                    }
                    else
                        newCallId = messageContent.callId;
                } else {
                    chatEvents.fireEvent('callEvents', {
                        type: 'PARTNER_RECEIVED_YOUR_CALL',
                        result: messageContent
                    });
                }

                break;

            /**
             * Type 74    Start Call Request
             */
            case chatMessageVOTypes.START_CALL:
                if(!callRequestController.iCanAcceptTheCall()) {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_STARTED_ELSEWHERE',
                        message: 'Call already started somewhere else..., aborting...'
                    });
                    return;
                }

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_STARTED',
                    result: messageContent
                });

                if (typeof messageContent === 'object'
                    && messageContent.hasOwnProperty('chatDataDto')
                    && !!messageContent.chatDataDto.kurentoAddress) {

                    callServerController.setServers(messageContent.chatDataDto.kurentoAddress.split(','));

                    startCallWebRTCFunctions({
                        video: messageContent.clientDTO.video,
                        mute: messageContent.clientDTO.mute,
                        sendingTopic: messageContent.clientDTO.topicSend,
                        receiveTopic: messageContent.clientDTO.topicReceive,
                        screenShare: messageContent.chatDataDto.screenShare,
                        brokerAddress: messageContent.chatDataDto.brokerAddressWeb,
                        turnAddress: messageContent.chatDataDto.turnAddress,
                        internalTurnAddress: messageContent.chatDataDto.internalTurnAddress,
                        selfData: messageContent.clientDTO,
                        clientsList: messageContent.otherClientDtoList,
                        screenShareOwner: +messageContent.chatDataDto.screenShareUser,
                        recordingOwner: +messageContent.chatDataDto.recordingUser
                    }, function (callDivs) {
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_DIVS',
                            result: callDivs
                        });
                    });
                } else {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        message: 'Chat Data DTO is not present!',
                        environmentDetails: getSDKCallDetails()
                    });
                }

                break;

            /**
             * Type 75    End Call Request
             */
            case chatMessageVOTypes.END_CALL_REQUEST:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'END_CALL',
                    result: messageContent
                });

                callStop();

                break;

            /**
             * Type 76   Call Ended
             */
            case chatMessageVOTypes.END_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_ENDED',
                    callId: threadId
                });

                if(threadId === currentCallId)
                    callStop();

                break;

            /**
             * Type 77    Get Calls History
             */
            case chatMessageVOTypes.GET_CALLS:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                break;

            /**
             * Type 78    Call Partner Reconnecting
             */
            case chatMessageVOTypes.RECONNECT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_RECONNECTING',
                    result: messageContent
                });

                break;

            /**
             * Type 79    Call Partner Connects
             */
            case chatMessageVOTypes.CONNECT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_CONNECTED',
                    result: messageContent
                });
                if(callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
                    restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000,4000,8000,12000]);
                }
                if(callUsers && callUsers['screenShare']
                    && screenShareInfo.isStarted()
                    && screenShareInfo.iAmOwner()
                ) {
                    restartMediaOnKeyFrame('screenShare', [2000,4000,8000,12000]);
                }
                break;

            /**
             * Type 90    Contacts Synced
             */
            case chatMessageVOTypes.CONTACT_SYNCED:
                chatEvents.fireEvent('contactEvents', {
                    type: 'CONTACTS_SYNCED',
                    result: messageContent
                });
                break;

            /**
             * Type 91    Send Group Call Request
             */
            case chatMessageVOTypes.GROUP_CALL_REQUEST:
                callRequestController.callRequestReceived = true;
                callReceived({
                    callId: messageContent.callId
                }, function (r) {});

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if (messageContent.callId > 0) {
                    if(!currentCallId ) {
                        currentCallId = messageContent.callId;
                    }
                    else
                        newCallId = messageContent.callId;
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'RECEIVE_CALL',
                    result: messageContent
                });

                //currentCallId = messageContent.callId;

                break;

            /**
             * Type 92    Call Partner Leave
             */
            case chatMessageVOTypes.LEAVE_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_LEFT',
                    result: messageContent
                });

                if (!!messageContent[0].userId) {
                    callStateController.removeParticipant(messageContent[0].userId);
                    if(screenShareInfo.isStarted() && screenShareInfo.getOwner() === messageContent[0].userId)
                        callStateController.removeScreenShareFromCall()

/*                        if(messageContent[0].userId === chatMessaging.userInfo.id) {
                        chatEvents.fireEvent('callEvents', {
                            type: 'CALL_ENDED',
                            callId: threadId
                        });
                    }*/
                }

                //If I'm the only call participant, stop the call
                if(callUsers) {
                    if(Object.values(callUsers).length < 2) {
                        callStop()
                    }
                }

                break;

            /**
             * Type 93    Add Call Participant
             */
            case chatMessageVOTypes.ADD_CALL_PARTICIPANT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                break;

            /**
             * Type 94    Call Participant Joined
             */
            case chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                if(Array.isArray(messageContent)) {
                    for (var i in messageContent) {
                        var correctedData = {
                            video: messageContent[i].video,
                            mute: messageContent[i].mute,
                            userId: messageContent[i].userId,
                            topicSend: messageContent[i].sendTopic
                        }
                        callStateController.setupCallParticipant(correctedData);
                        if(correctedData.video) {
                            callStateController.startParticipantVideo(correctedData.userId);
                        }
                        if(!correctedData.mute) {
                            callStateController.startParticipantAudio(correctedData.userId);
                        }
                    }
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: generateCallUIList()
                });

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_JOINED',
                    result: messageContent
                });

                if(callUsers && callUsers[chatMessaging.userInfo.id] && callUsers[chatMessaging.userInfo.id].video) {
                    restartMediaOnKeyFrame(chatMessaging.userInfo.id, [2000, 4000, 8000, 12000, 16000, 24000]);

                }
                if(callUsers && callUsers['screenShare']
                    && callUsers['screenShare'].video
                    && screenShareInfo.isStarted()
                    && screenShareInfo.iAmOwner()
                ) {
                    sendCallMetaData({
                        id: callMetaDataTypes.SCREENSHAREMETADATA,
                        userid: chatMessaging.userInfo.id,
                        content: {
                            dimension: {
                                width: screenShareInfo.getWidth(),
                                height: screenShareInfo.getHeight()
                            }
                        }
                    });
                    restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000, 16000, 24000]);
                }

                break;

            /**
             * Type 95    Remove Call Participant
             */
            case chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_REMOVED',
                    result: messageContent
                });


                break;

            /**
             * Type 96    Terminate Call
             */
            case chatMessageVOTypes.TERMINATE_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'TERMINATE_CALL',
                    result: messageContent
                });

                callStop();

                break;

            /**
             * Type 97    Mute Call Participant
             */
            case chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                if(Array.isArray(messageContent)){
                    let pause;
                    for(var i in messageContent) {
                        // pause = messageContent[i].userId == chatMessaging.userInfo.id;
                        callUsers[messageContent[i].userId].audioStopManager.disableStream();
                        // callStateController.deactivateParticipantStream(
                        //     messageContent[i].userId,
                        //     'audio',
                        //     'mute'
                        // )
                    }
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: generateCallUIList()
                });

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_MUTE',
                    result: messageContent
                });

                break;

            /**
             * Type 98    UnMute Call Participant
             */
            case chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                var myId = chatMessaging.userInfo.id;

                if(Array.isArray(messageContent)) {
                    for(let i in messageContent) {
                        let cUserId = messageContent[i].userId;

                        if(callUsers[cUserId].audioStopManager.isStreamPaused()) {
                            if (callUsers[cUserId].audioStopManager.isStreamStopped()) {

                                callStateController.activateParticipantStream(
                                    cUserId,
                                    'audio',
                                    (myId === cUserId ? 'send' : 'receive'),
                                    'audioTopicName',
                                    callUsers[cUserId].topicSend,
                                    'mute'
                                );
                            } else if(myId === cUserId){
                                currentModuleInstance.resumeMice({});
                            }
                            callUsers[cUserId].audioStopManager.reset();
                        }


/*                            callStateController.activateParticipantStream(
                            messageContent[i].userId,
                            'audio',
                            //TODO: Should send in here when chat server fixes the bug
                            'receive',   //(messageContent[i].userId === chatMessaging.userInfo.id ? 'send' : 'receive'),
                            'audioTopicName',
                            messageContent[i].sendTopic,
                            'mute'
                        );*/
                    }
                }


                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: generateCallUIList()
                });

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_PARTICIPANT_UNMUTE',
                    result: messageContent
                });

                break;

            /**
             * Type 99   Partner rejected call
             */
            case chatMessageVOTypes.CANCEL_GROUP_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'REJECT_GROUP_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 110    Active Call Participants List
             */
            case chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                break;

            /**
             * Type 111    Kafka Call Session Created
             */
            case chatMessageVOTypes.CALL_SESSION_CREATED:
                if(!callRequestController.callEstablishedInMySide)
                    return;

                chatEvents.fireEvent('callEvents', {
                    type: 'CALL_SESSION_CREATED',
                    result: messageContent
                });

                if(!currentCallId)
                    currentCallId = messageContent.callId;
                else
                    newCallId = messageContent.callId;

                //currentCallId = messageContent.callId;

                break;

            /**
             * Type 113    Turn On Video Call
             */
            case chatMessageVOTypes.TURN_ON_VIDEO_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(Array.isArray(messageContent)) {
                    for(var i in messageContent) {
                        callStateController.activateParticipantStream(
                            messageContent[i].userId,
                            'video',
                            (messageContent[i].userId === chatMessaging.userInfo.id ? 'send' : 'receive'),
                            'videoTopicName',
                            messageContent[i].sendTopic,
                            'video'
                        );
                    }
                }

                setTimeout(function () {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_DIVS',
                        result: generateCallUIList()
                    });
                })

                chatEvents.fireEvent('callEvents', {
                    type: 'TURN_ON_VIDEO_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 114    Turn Off Video Call
             */
            case chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                if(Array.isArray(messageContent)) {
                    for(var i in messageContent) {
                        callStateController.deactivateParticipantStream(
                            messageContent[i].userId,
                            'video',
                            'video'
                        )
                    }
                }

                setTimeout(function () {
                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_DIVS',
                        result: generateCallUIList()
                    });
                })

                chatEvents.fireEvent('callEvents', {
                    type: 'TURN_OFF_VIDEO_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 121    Record Call Request
             */
            case chatMessageVOTypes.RECORD_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'START_RECORDING_CALL',
                    result: messageContent
                });

                restartMediaOnKeyFrame(chatMessaging.userInfo.id, [4000,8000,12000,25000]);
                restartMediaOnKeyFrame("screenShare", [4000,8000,12000,25000]);

                break;

            /**
             * Type 122   End Record Call Request
             */
            case chatMessageVOTypes.END_RECORD_CALL:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'STOP_RECORDING_CALL',
                    result: messageContent
                });

                break;

            /**
             * Type 123   Start Screen Share
             */
            case chatMessageVOTypes.START_SCREEN_SHARE:
                if(!callRequestController.callEstablishedInMySide)
                    return;

                screenShareInfo.setIsStarted(true);
                screenShareInfo.setOwner(messageContent.screenOwner.id);

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                } else if(!screenShareInfo.iAmOwner()) {
                    callStateController.addScreenShareToCall("receive", false)
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'START_SCREEN_SHARE',
                    result: messageContent
                });

                break;

            /**
             * Type 124   End Screen Share
             */
            case chatMessageVOTypes.END_SCREEN_SHARE:
                // screenShareInfo.setIAmOwner(false);

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                } else if (!screenShareInfo.iAmOwner()) {
                   consoleLogging && console.log("[SDK][END_SCREEN_SHARE], im not owner of screen");
                   callStateController.removeScreenShareFromCall();
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'END_SCREEN_SHARE',
                    result: messageContent
                });

                break;

            /**
             * Type 125   Delete From Call List
             */
            case chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'DELETE_FROM_CALL_LIST',
                    result: messageContent
                });

                break;
            /**
             * Type 126   Destinated Record Call Request
             */
            case chatMessageVOTypes.DESTINATED_RECORD_CALL:
                if(!callRequestController.callEstablishedInMySide)
                    return;

                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }

                chatEvents.fireEvent('callEvents', {
                    type: 'START_RECORDING_CALL',
                    result: messageContent
                });

                restartMediaOnKeyFrame(chatMessaging.userInfo.id, [4000,8000,12000,25000]);

                restartMediaOnKeyFrame("screenShare", [4000,8000,12000,25000]);

                break;

            /**
             * Type 129   Get Calls To Join
             */
            case chatMessageVOTypes.GET_CALLS_TO_JOIN:
                if (chatMessaging.messagesCallbacks[uniqueId]) {
                    chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                }
                break;
        }
    }

    this.startCall = function (params, callback) {
        var startCallData = {
            chatMessageVOType: chatMessageVOTypes.CALL_REQUEST,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        }, content = {
            creatorClientDto: {}
        };

        if (params) {
            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            } else {
                content.type = 0x0; // Defaults to AUDIO Call
            }

            content.creatorClientDto.mute = (params.mute && typeof params.mute === 'boolean') ? params.mute : false;
            content.mute = (params.mute && typeof params.mute === 'boolean') ? params.mute : false;

            if (params.clientType
                && typeof params.clientType === 'string'
                && callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.creatorClientDto.clientType = callClientType.WEB;
            }

            if (typeof +params.threadId === 'number' && +params.threadId > 0) {
                content.threadId = +params.threadId;
            } else {
                if (Array.isArray(params.invitees) && params.invitees.length) {
                    content.invitees = [];//params.invitees;
                    for (var i = 0; i < params.invitees.length; i++) {
                        var tempInvitee = params.invitees[i];

                        if (tempInvitee && typeof tempInvitee.idType === "string") {
                            tempInvitee.idType = inviteeVOidTypes[tempInvitee.idType];
                            content.invitees.push(tempInvitee);
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
                    });
                    return;
                }
            }

            if(params.threadInfo
                && (params.threadInfo.metadata
                    || params.threadInfo.uniqueName)
            ) {
                content.createCallThreadRequest = params.threadInfo
            }

            startCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
            });
            return;
        }

        callRequestController.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : false;
        callRequestController.callRequestReceived = true;
        callRequestController.callEstablishedInMySide = true;

        if(callNoAnswerTimeout) {
            //TODO: Remove timeout when call ends fast
            setTimeout( function(metaData) {
                //Reject the call if participant didn't answer
                if(!callStopQueue.callStarted ) {
                    chatEvents.fireEvent("callEvents", {
                        type: "CALL_NO_ANSWER_TIMEOUT",
                        message: "[CALL_SESSION_CREATED] Call request timed out, No answer",
                    });

                    metaData.callInstance.rejectCall({
                        callId: metaData.currentCallId
                    });
                }
            }, callNoAnswerTimeout, {callInstance: currentModuleInstance, currentCallId: currentCallId});
        }

        return chatMessaging.sendMessage(startCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.startGroupCall = function (params, callback) {
        var startCallData = {
            chatMessageVOType: chatMessageVOTypes.GROUP_CALL_REQUEST,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        }, content = {
            creatorClientDto: {}
        };

        if (params) {
            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            } else {
                content.type = 0x0; // Defaults to AUDIO Call
            }

            content.creatorClientDto.mute = (typeof params.mute === 'boolean') ? params.mute : false;

            if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.creatorClientDto.clientType = callClientType.WEB;
            }

            if (typeof +params.threadId === 'number' && params.threadId > 0) {
                content.threadId = +params.threadId;
            } else {
                if (Array.isArray(params.invitees)) {
                    content.invitees = [];

                    for (var i = 0; i < params.invitees.length; i++) {
                        var tempInvitee = params.invitees[i];

                        if (tempInvitee && typeof tempInvitee.idType === "string") {
                            tempInvitee.idType = inviteeVOidTypes[tempInvitee.idType];
                            content.invitees.push(tempInvitee);
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
                    });
                    return;
                }
            }

            if(params.threadInfo
                && (params.threadInfo.title
                    || params.threadInfo.description
                    || params.threadInfo.metadata
                    || params.threadInfo.uniqueName)
            ) {
                content.createCallThreadRequest = params.threadInfo
            }

            startCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
            });
            return;
        }

        callRequestController.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : false;
        callRequestController.callRequestReceived = true;
        callRequestController.callEstablishedInMySide = true;

        return chatMessaging.sendMessage(startCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.sendCallMetaData = function (params) {
        sendCallMetaData({
            id: callMetaDataTypes.CUSTOMUSERMETADATA,
            userid: chatMessaging.userInfo.id,
            content: params.content
        });
    };

    this.callReceived = callReceived;

    this.terminateCall = function (params, callback) {
        var terminateCallData = {
            chatMessageVOType: chatMessageVOTypes.TERMINATE_CALL,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        }, content = {};

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                terminateCallData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid call id!'
                });
                return;
            }

            terminateCallData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to terminate the call!'
            });
            return;
        }

        return chatMessaging.sendMessage(terminateCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.acceptCall = function (params, callback) {
        var acceptCallData = {
            chatMessageVOType: chatMessageVOTypes.ACCEPT_CALL,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        }, content = {};

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                acceptCallData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid call id!'
                });
                return;
            }

            content.mute = (typeof params.mute === 'boolean') ? params.mute : false;

            content.video = (typeof params.video === 'boolean') ? params.video : false;

            content.videoCall = content.video;

            callRequestController.cameraPaused = (typeof params.cameraPaused === 'boolean') ? params.cameraPaused : callRequestController.cameraPaused;

            if (params.clientType && typeof params.clientType === 'string' && callClientType[params.clientType.toUpperCase()] > 0) {
                content.clientType = callClientType[params.clientType.toUpperCase()];
            } else {
                content.clientType = callClientType.WEB;
            }

            acceptCallData.content = JSON.stringify(content);

            if(params.joinCall) {
                callRequestController.callRequestReceived = true;
                currentCallId = params.callId;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to accept the call!'
            });
            return;
        }
        callRequestController.callEstablishedInMySide = true;
        return chatMessaging.sendMessage(acceptCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.rejectCall = this.cancelCall = function (params, callback) {
        var rejectCallData = {
            chatMessageVOType: chatMessageVOTypes.REJECT_CALL,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                rejectCallData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to reject the call!'
            });
            return;
        }

        return chatMessaging.sendMessage(rejectCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.endCall = endCall;

    this.startRecordingCall = function (params, callback) {
        var recordCallData = {
            chatMessageVOType: chatMessageVOTypes.RECORD_CALL,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token,
            content: {}
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                recordCallData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid Call id!'
                });
                return;
            }

            if(params.destinated === true) {
                recordCallData.chatMessageVOType = chatMessageVOTypes.DESTINATED_RECORD_CALL;
                recordCallData.content.recordType = typeof +params.recordType === 'number' ? params.recordType : 1;
                recordCallData.content.tags = Array.isArray(params.tags) ? params.tags : null;
                recordCallData.content.threadId = typeof +params.threadId === 'number' ? params.threadId : null;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Record call!'
            });
            return;
        }

        return chatMessaging.sendMessage(recordCallData, {
            onResult: function (result) {
                //restartMedia(callTopics['sendVideoTopic']);
                restartMediaOnKeyFrame(chatMessaging.userInfo.id, [100])
                callback && callback(result);
            }
        });
    };

    this.stopRecordingCall = function (params, callback) {
        var stopRecordingCallData = {
            chatMessageVOType: chatMessageVOTypes.END_RECORD_CALL,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                stopRecordingCallData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid Call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Stop Recording the call!'
            });
            return;
        }

        return chatMessaging.sendMessage(stopRecordingCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.startScreenShare = function (params, callback) {
        var sendData = {
            chatMessageVOType: chatMessageVOTypes.START_SCREEN_SHARE,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                sendData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid Call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Share Screen!'
            });
            return;
        }

        return chatMessaging.sendMessage(sendData, {
            onResult: function (result) {
                consoleLogging && console.log("[sdk][startScreenShare][onResult]: ", result);
                if(!result.hasError) {
                    var direction = 'send', shareScreen = true;

                    if(screenShareInfo.isStarted() && !screenShareInfo.iAmOwner()){
                        direction = 'receive';
                        shareScreen = false;
                    }

                    if(screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
                        screenShareInfo.setWidth(callVideoMinWidth);
                        screenShareInfo.setHeight(callVideoMinHeight);
                        sendCallMetaData({
                            id: callMetaDataTypes.SCREENSHAREMETADATA,
                            userid: chatMessaging.userInfo.id,
                            content: {
                                dimension: {
                                    width: screenShareInfo.getWidth(),
                                    height: screenShareInfo.getHeight()
                                }
                            }
                        });
                    }

                    callStateController.addScreenShareToCall(direction, shareScreen);
                }
                callback && callback(result);
            }
        });
    };

    this.endScreenShare = function (params, callback) {
        var sendData = {
            chatMessageVOType: chatMessageVOTypes.END_SCREEN_SHARE,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                sendData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid Call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to End Screen Sharing!'
            });
            return;
        }

        if(!screenShareInfo.iAmOwner()) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'You can not end others screen sharing!'
            });
            return;
        }

        if(!callUsers['screenShare'].videoTopicManager.getPeer()) { //.peers[callUsers['screenShare'].videoTopicName]
            consoleLogging && console.log('[SDK][endScreenShare] No screenShare connection available');
        } else {
            callStateController.removeScreenShareFromCall();
        }

        return chatMessaging.sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.resizeScreenShare = function (params, callback) {
        var result = {}
        if(screenShareInfo.isStarted() && screenShareInfo.iAmOwner()) {
            var screenSize = window.screen
                , qualities = [
                    {
                        width: Math.round(screenSize.width / 3),
                        height: Math.round(window.screen.height / 3)
                    },
                    {
                        width: Math.round(screenSize.width / 2),
                        height: Math.round(screenSize.height / 2)
                    },
                    {
                        width: screenSize.width,
                        height: screenSize.height
                    },
                    {
                        width: Math.round(screenSize.width * 1.6),
                        height: Math.round(screenSize.height * 1.6)
                    },
                ]
                , selectedQuality = params.quality ? +params.quality - 1 : 3
                , qualityObj = qualities[selectedQuality];

            screenShareInfo.setWidth(qualityObj.width);
            screenShareInfo.setHeight(qualityObj.height);

            applyScreenShareSizeToElement()

            sendCallMetaData({
                id: callMetaDataTypes.SCREENSHAREMETADATA,
                userid: chatMessaging.userInfo.id,
                content: {
                    dimension: {
                        width: screenShareInfo.getWidth(),
                        height: screenShareInfo.getHeight()
                    }
                }
            })

            result.hasError = false;
        } else {
            result.hasError = true;
            result.errorMessage = 'You can not apply size to others ScreenShare or ScreenShare is not started'
        }

        callback && callback(result);
    };

    this.getCallsList = function (params, callback) {
        var getCallListData = {
            chatMessageVOType: chatMessageVOTypes.GET_CALLS,
            typeCode: generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: token
        }, content = {};

        if (params) {
            if (typeof params.count === 'number' && params.count >= 0) {
                content.count = +params.count;
            } else {
                content.count = 50;
            }

            if (typeof params.offset === 'number' && params.offset >= 0) {
                content.offset = +params.offset;
            } else {
                content.offset = 0;
            }

            if (typeof params.creatorCoreUserId === 'number' && params.creatorCoreUserId > 0) {
                content.creatorCoreUserId = +params.creatorCoreUserId;
            }

            if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
                content.creatorSsoId = +params.creatorSsoId;
            }

            if (typeof params.name === 'string') {
                content.name = params.name;
            }

            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            }

            if (Array.isArray(params.callIds)) {
                content.callIds = params.callIds;
            }

            if (typeof params.threadId === 'number' && +params.threadId > 0) {
                content.threadId = +params.threadId;
            }

            if (typeof params.contactType === 'string') {
                content.contactType = params.contactType;
            }

            if (typeof params.uniqueId === 'string') {
                content.uniqueId = params.uniqueId;
            }

            getCallListData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to End the call!'
            });
            return;
        }

        return chatMessaging.sendMessage(getCallListData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.getCallsToJoin = function (params, callback) {
        var getCallListData = {
            chatMessageVOType: chatMessageVOTypes.GET_CALLS_TO_JOIN,
            pushMsgType: 3,
            token: token
        }, content = {};

        if (params) {
            if (typeof params.count === 'number' && params.count >= 0) {
                content.count = +params.count;
            } else {
                content.count = 50;
            }

            if (typeof params.offset === 'number' && params.offset >= 0) {
                content.offset = +params.offset;
            } else {
                content.offset = 0;
            }

            if (typeof params.creatorSsoId === 'number' && params.creatorSsoId > 0) {
                content.creatorSsoId = +params.creatorSsoId;
            }

            if (typeof params.name === 'string') {
                content.name = params.name;
            }

            if (typeof params.type === 'string' && callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = callTypes[params.type.toUpperCase()];
            }

            if (Array.isArray(params.threadIds)) {
                content.threadIds = params.threadIds;
            }

            if (typeof params.uniqueId === 'string') {
                content.uniqueId = params.uniqueId;
            }

            getCallListData.content = JSON.stringify(content);
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Invalid params'
            });
            return;
        }

        return chatMessaging.sendMessage(getCallListData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.deleteFromCallList = function (params, callback) {
        var sendData = {
            chatMessageVOType: chatMessageVOTypes.DELETE_FROM_CALL_HISTORY,
            typeCode: generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.contactType === 'string' && params.contactType.length) {
                sendData.content.contactType = params.contactType;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'You should enter a contactType!'
                });
                return;
            }

            if (Array.isArray(params.callIds)) {
                sendData.content = params.callIds;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Delete a call from Call History!'
            });
            return;
        }

        return chatMessaging.sendMessage(sendData, {
            onResult: function (result) {
                var returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    var messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.getCallParticipants = function (params, callback) {
        var sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS,
            typeCode: generalTypeCode,//params.typeCode,
            content: {}
        };

        if (params) {
            if (isNaN(params.callId)) {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Call Id should be a valid number!'
                });
                return;
            } else {
                var callId = +params.callId;
                sendMessageParams.subjectId = callId;

                var offset = (parseInt(params.offset) > 0)
                    ? parseInt(params.offset)
                    : 0,
                    count = (parseInt(params.count) > 0)
                        ? parseInt(params.count)
                        : config.getHistoryCount;

                sendMessageParams.content.count = count;
                sendMessageParams.content.offset = offset;

                return chatMessaging.sendMessage(sendMessageParams, {
                    onResult: function (result) {
                        var returnData = {
                            hasError: result.hasError,
                            cache: false,
                            errorMessage: result.errorMessage,
                            errorCode: result.errorCode
                        };

                        if (!returnData.hasError) {
                            var messageContent = result.result,
                                messageLength = messageContent.length,
                                resultData = {
                                    participants: reformatCallParticipants(messageContent),
                                    contentCount: result.contentCount,
                                    hasNext: (sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0),
                                    nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
                                };

                            returnData.result = resultData;
                        }

                        callback && callback(returnData);
                        /**
                         * Delete callback so if server pushes response before
                         * cache, cache won't send data again
                         */
                        callback = undefined;

                        if (!returnData.hasError) {
                            chatEvents.fireEvent('callEvents', {
                                type: 'CALL_PARTICIPANTS_LIST_CHANGE',
                                threadId: callId,
                                result: returnData.result
                            });
                        }
                    }
                });
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to Get Call Participants!'
            });
            return;
        }
    };

    this.addCallParticipants = function (params, callback) {
        /**
         * + AddCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of CONTACT IDs or inviteeVO Objects
         *    - uniqueId                    {string}
         */

        var sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.ADD_CALL_PARTICIPANT,
            typeCode: generalTypeCode,//params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.contactIds)) {
                sendMessageParams.content = params.contactIds;
            }

            if (Array.isArray(params.usernames)) {
                sendMessageParams.content = [];
                for (var i = 0; i < params.usernames.length; i++) {
                    sendMessageParams.content.push({
                        id: params.usernames[i],
                        idType: inviteeVOidTypes.TO_BE_USER_USERNAME
                    });
                }
            }

            if (Array.isArray(params.coreUserids)) {
                sendMessageParams.content = [];
                for (var i = 0; i < params.coreUserids.length; i++) {
                    sendMessageParams.content.push({
                        id: params.coreUserids[i],
                        idType: inviteeVOidTypes.TO_BE_CORE_USER_ID
                    });
                }
            }
        }

        return chatMessaging.sendMessage(sendMessageParams, {
            onResult: function (result) {
                var returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    var messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.removeCallParticipants = function (params, callback) {
        /**
         * + removeCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        var sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.REMOVE_CALL_PARTICIPANT,
            typeCode: generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        return chatMessaging.sendMessage(sendMessageParams, {
            onResult: function (result) {
                var returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    var messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.muteCallParticipants = function (params, callback) {
        /**
         * + muteCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        var sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.MUTE_CALL_PARTICIPANT,
            typeCode: generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        //TODO: should be moved to event 113 when server fixes

        // currentModuleInstance.pauseMice({});
        // callUsers[chatMessaging.userInfo.id].audioStopManager.disableStream();

        return chatMessaging.sendMessage(sendMessageParams, {
            onResult: function (result) {
                var returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    var messageContent = result.result;
                    returnData.result = messageContent;
                }
                callback && callback(returnData);
            }
        });
    };

    this.unMuteCallParticipants = function (params, callback) {
        /**
         * + unMuteCallParticipantsRequest     {object}
         *    - subjectId                   {int}
         *    + content                     {list} List of Participants UserIds
         */

        var sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT,
            typeCode: generalTypeCode, //params.typeCode,
            content: []
        };

        if (params) {
            if (typeof params.callId === 'number' && params.callId > 0) {
                sendMessageParams.subjectId = params.callId;
            }

            if (Array.isArray(params.userIds)) {
                sendMessageParams.content = params.userIds;
            }
        }

        //TODO: Should be moved to event from chat server (when chat server fixes the bug)
        //var myId = chatMessaging.userInfo.id
            //, myUser = callUsers[myId];

/*            if(myUser.audioStopManager.isStreamPaused()) {
            if (myUser.audioStopManager.isStreamStopped()){
                callStateController.activateParticipantStream(
                    myId,
                    'audio',
                    'send',
                    'audioTopicName',
                    myUser.topicSend,
                    'mute'
                );
            } else {
                currentModuleInstance.resumeMice({});
            }
            myUser.audioStopManager.reset();
        }*/

        return chatMessaging.sendMessage(sendMessageParams, {
            onResult: function (result) {
                var returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };
                if (!returnData.hasError) {
                    var messageContent = result.result;
                    returnData.result = messageContent;

                }
                callback && callback(returnData);
            }
        });
    };

    this.turnOnVideoCall = function (params, callback) {
        var turnOnVideoData = {
            chatMessageVOType: chatMessageVOTypes.TURN_ON_VIDEO_CALL,
            typeCode: generalTypeCode,//params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                turnOnVideoData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to turn on the video call!'
            });
            return;
        }

        var user = callUsers[chatMessaging.userInfo.id];

        if(user
            && user.videoTopicManager
            && user.videoTopicManager.getPeer()
            && (
                user.videoTopicManager.isPeerConnecting()
                || user.videoTopicManager.isPeerConnected()
            )) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Video stream is already open!'
            });
            return;
        }

        return chatMessaging.sendMessage(turnOnVideoData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.turnOffVideoCall = function (params, callback) {
        var turnOffVideoData = {
            chatMessageVOType: chatMessageVOTypes.TURN_OFF_VIDEO_CALL,
            typeCode: generalTypeCode,//params.typeCode,
            pushMsgType: 3,
            token: token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                turnOffVideoData.subjectId = +params.callId;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Invalid call id!'
                });
                return;
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to turn off the video call!'
            });
            return;
        }

        var user = callUsers[chatMessaging.userInfo.id];
        if(user
            && user.videoTopicManager
            && user.videoTopicManager.getPeer()

            && (
                user.videoTopicManager.isPeerConnecting()
                || user.videoTopicManager.isPeerFailed()
                || user.videoTopicManager.isPeerDisconnected()
            )
            ) {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'Can not stop stream in current state'
            });
            return;
        }

        return chatMessaging.sendMessage(turnOffVideoData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    };

    this.disableParticipantsVideoReceive = function (params, callback) {
        if (params) {
            if (Array.isArray(params.userIds) && params.userIds.length) {
                for( var i in params.userIds) {
                    callStateController.deactivateParticipantStream(
                        params.userIds[i],
                        'video',
                        'video'
                    );
                }
                callback && callback({hasError: false});
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to closeOthersVideoReceive'
            });
            return;
        }
    };

    this.enableParticipantsVideoReceive = function (params, callback) {
        if (params) {
            if (Array.isArray(params.userIds) && params.userIds.length) {
                for( var i in params.userIds) {
                    callStateController.activateParticipantStream(
                        params.userIds[i],
                        'video',
                        'receive',
                        'videoTopicName',
                        callUsers[params.userIds[i]].topicSend,
                        'video'
                    );
                }
                callback && callback({hasError: false});
            }
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to closeOthersVideoReceive'
            });
        }
    };

    /**
     * Pauses camera-send without closing its topic
     * @param params
     * @param callback
     */
    this.pauseCamera = function (params, callback) {
        var me = callUsers[chatMessaging.userInfo.id];

        if(!Object.keys(callUsers).length || !me.videoTopicName || !me.videoTopicManager.getPeer())//!me.peers[me.videoTopicName]
            return;

        // me.peers[me.videoTopicName].getLocalStream().getTracks()[0].enabled = false;
        me.videoTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = false;
        callback && callback();
    };

    this.resumeCamera = function (params, callback) {
        var me = callUsers[chatMessaging.userInfo.id]
        if(!Object.keys(callUsers).length || !me.videoTopicName || !me.videoTopicManager.getPeer())//!me.peers[me.videoTopicName]
            return;

        // me.peers[me.videoTopicName].getLocalStream().getTracks()[0].enabled = true;
        me.videoTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = true;
        callback && callback();
    };

    /**
     * Pauses mice-send without closing its topic
     * @param params
     * @param callback
     */
    this.pauseMice = function (params, callback) {
        var me = callUsers[chatMessaging.userInfo.id];
        if(!Object.keys(callUsers).length || !me.audioTopicName || !me.audioTopicManager.getPeer())//me.peers[me.audioTopicName]
            return;

        // me.peers[me.audioTopicName].getLocalStream().getTracks()[0].enabled = false;
        me.audioTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = false;
        callback && callback();
    };

    this.resumeMice = function (params, callback) {
        var me = callUsers[chatMessaging.userInfo.id];
        if(!Object.keys(callUsers).length || !me.audioTopicName || !me.audioTopicManager.getPeer())//me.peers[me.audioTopicName]
            return;

        // me.peers[me.audioTopicName].getLocalStream().getTracks()[0].enabled = true;
        me.audioTopicManager.getPeer().getLocalStream().getTracks()[0].enabled = true;
        callback && callback();
    };

    this.resizeCallVideo = function (params, callback) {
        if (params) {
            if (!!params.width && +params.width > 0) {
                callVideoMinWidth = +params.width;
            }

            if (!!params.height && +params.height > 0) {
                callVideoMinHeight = +params.height;
            }

            if(!callUsers[chatMessaging.userInfo.id]){
                consoleLogging && console.log("Error in resizeCallVideo(), call not started ");
                return;
            }

            var userObject = callUsers[chatMessaging.userInfo.id]
            //userObject.peers[userObject.videoTopicName]
            userObject.videoTopicManager.getPeer()
                .getLocalStream()
                .getTracks()[0]
                .applyConstraints({
                "width": callVideoMinWidth,
                "height": callVideoMinHeight
            })
                .then((res) => {
                    userObject.htmlElements[userObject.videoTopicName].style.width = callVideoMinWidth + 'px';
                    userObject.htmlElements[userObject.videoTopicName].style.height = callVideoMinHeight + 'px';
                    callback && callback();
                })
                .catch((e) => {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: e
                    });
                });
        } else {
            chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to resize the video call! Send an object like {width: 640, height: 480}'
            });
            return;
        }
    };

    this.callStop = callStop;

    this.restartMedia = restartMedia;
}

export default ChatCall
