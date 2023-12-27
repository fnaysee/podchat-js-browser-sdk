"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _callUsers = _interopRequireDefault(require("./callUsers"));

var _utility = _interopRequireDefault(require("../../../utility/utility"));

var _callServerManager = _interopRequireDefault(require("../callServerManager"));

var _constants = require("../../constants");

var _errorHandler = require("../../errorHandler");

var _peerConnectionManager = _interopRequireDefault(require("./peerConnectionManager"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function MultiTrackCallManager(_ref) {
  var app = _ref.app,
      callId = _ref.callId,
      callConfig = _ref.callConfig;
  var config = {
    callId: callId,
    callConfig: callConfig,
    users: new _callUsers["default"]({
      app: app,
      callId: callId
    }),
    callServerController: new _callServerManager["default"](app),
    screenShareInfo: new ScreenShareStateManager(app),
    deviceManager: null,
    sendPeerManager: null,
    receivePeerManager: null
  };
  var inquiryCallCounter = 0;

  function socketConnectListener() {
    sendCallMessage({
      id: 'REQUEST_RECEIVING_MEDIA',
      token: app.sdkParams.token,
      chatId: config.callId,
      brokerAddress: config.callConfig.brokerAddress
    }, null, {});
    if (!failedPeers.length) return;

    if (!inquiryCallCounter) {
      // if (new Date().getTime() - (10 * 1000) > peerFailedTime) {
      inquiryCallCounter++;
      app.call.inquiryCallParticipants.inquiryCallParticipants({}, function (result) {
        if (!result.hasError) {
          inquiryCallCounter = 0;
          doReconnect();
        } else {
          if (result.errorCode == 171) {
            app.call.endCall({
              callId: config.callId
            }, null);
            app.chatEvents.fireEvent('callEvents', {
              type: 'YOU_DROPPED_FROM_CALL',
              result: {
                callId: config.callId,
                userId: app.store.user.get().id
              }
            });
          } else if (result.errorCode == 163) {
            app.call.endCall({
              callId: config.callId
            }, null);
            app.chatEvents.fireEvent('callEvents', {
              type: 'CALL_ENDED',
              callId: config.callId
            });
          }

          app.callsManager.removeItem(config.callId);
        } // console.log('debug inquiryCallParticipants result', {result});

      }); // } else {
      //     doReconnect();
      // }
    }

    function doReconnect() {
      var _loop = function _loop() {
        var dir = failedPeers.shift();
        destroyPeerManager(dir);
        createPeerManager(dir);
        setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!(dir === 'send')) {
                    _context.next = 6;
                    break;
                  }

                  _context.next = 3;
                  return config.users.stopAllSenders();

                case 3:
                  config.users.startAllsenders();
                  _context.next = 8;
                  break;

                case 6:
                  Object.values(config.users.getAll()).forEach(function (user) {
                    if (!user.isMe()) {
                      user.setVideoIsOpen(false);
                      user.setAudioIsOpen(false);
                    }
                  });
                  sendCallMessage({
                    id: 'REQUEST_RECEIVING_MEDIA',
                    token: app.sdkParams.token,
                    chatId: config.callId,
                    brokerAddress: config.callConfig.brokerAddress
                  }, null, {}); // await config.users.stopAllReceivers();
                  // config.users.startAllReceivers();

                case 8:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        })), 200);
      };

      while (failedPeers.length) {
        _loop();
      }
    }
  }

  var failedPeers = [];
  var peerFailedTime;

  function onPeerFailed(direction) {
    peerFailedTime = new Date().getTime();
    failedPeers.push(direction);

    if (app.messenger.chatState) {
      socketConnectListener();
    }
  }

  function destroyPeerManager(direction) {
    if (direction === 'send') {
      config.sendPeerManager.destroy();
      config.sendPeerManager = null;
    } else {
      config.receivePeerManager.destroy();
      config.receivePeerManager = null;
    }
  }

  function createPeerManager(direction) {
    if (direction === 'send') {
      config.sendPeerManager = new _peerConnectionManager["default"]({
        app: app,
        callId: callId,
        direction: 'send',
        rtcPeerConfig: {
          iceServers: publicized.getTurnServer(publicized.callConfig()),
          iceTransportPolicy: 'relay'
        },
        brokerAddress: config.callConfig.brokerAddress,
        onPeerFailed: onPeerFailed
      });
    } else {
      config.receivePeerManager = new _peerConnectionManager["default"]({
        app: app,
        callId: callId,
        direction: 'receive',
        rtcPeerConfig: {
          iceServers: publicized.getTurnServer(publicized.callConfig()),
          iceTransportPolicy: 'relay'
        },
        brokerAddress: config.callConfig.brokerAddress,
        onPeerFailed: onPeerFailed
      });
    }
  }

  function startCallWebRTCFunctions(callConfig) {
    config.callServerController.setServers(callConfig.kurentoAddress); // console.log('debug startCallWebRTCFunctions:: ', {
    //     iceServers: publicized.getTurnServer(publicized.callConfig()),
    //     iceTransportPolicy: 'relay',
    // });

    createPeerManager('send');
    createPeerManager('receive');
    app.chatEvents.on('chatReady', socketConnectListener);

    if (app.call.sharedVariables.callDivId) {
      new Promise(function (resolve) {
        var callVideo = typeof callConfig.video === 'boolean' ? callConfig.video : true,
            callMute = typeof callConfig.mute === 'boolean' ? callConfig.mute : false;
        config.deviceManager = app.call.sharedVariables.deviceManager;
        app.call.sharedVariables.deviceManager = null;

        if (callConfig.selfData) {
          callConfig.selfData.callId = config.callId;
          callConfig.selfData.cameraPaused = callConfig.cameraPaused;
          callConfig.selfData.brokerAddress = config.callConfig.brokerAddress;
          config.users.addItem(callConfig.selfData); // callStateController.setupCallParticipant(params.selfData);
        }

        config.screenShareInfo.setOwner(callConfig.screenShareOwner);
        config.screenShareInfo.setIsStarted(!!callConfig.screenShareOwner);

        if (callConfig.recordingOwner) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_RECORDING_STARTED',
            result: {
              id: callConfig.recordingOwner
            }
          });
        }

        if (callConfig.clientsList && callConfig.clientsList.length) {
          for (var i in callConfig.clientsList) {
            if (callConfig.clientsList[i].userId !== app.store.user.get().id) {
              callConfig.clientsList[i].callId = config.callId;
              callConfig.clientsList[i].cameraPaused = false;
              callConfig.clientsList[i].brokerAddress = config.callConfig.brokerAddress;
              config.users.addItem(callConfig.clientsList[i]);
            }
          }
        }

        config.callConfig.screenShareObject = {
          callId: config.callId,
          cameraPaused: false,
          userId: "screenShare",
          topicSend: callConfig.screenShare
        };
        config.screenShareInfo.setIsStarted(!!config.callConfig.screenShareOwner);

        if (config.screenShareInfo.isStarted()) {
          var clientId = callConfig.screenShare.split('-')[2];
          var screenOwnerClientId;

          var _iterator = _createForOfIteratorHelper(callConfig.clientsList),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var user = _step.value;

              if (user.userId == config.callConfig.screenShareOwner) {
                screenOwnerClientId = user.clientId;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }

          config.callConfig.screenShareObject.clientId = screenOwnerClientId;
          config.callConfig.screenShareObject.brokerAddress = config.callConfig.brokerAddress;
          config.screenShareInfo.setOwner(config.callConfig.screenShareOwner);
          config.users.addItem(config.callConfig.screenShareObject, "screenShare");
        }

        config.callConfig.callVideo = callVideo;
        config.callConfig.callAudio = callMute;
        createSessionInChat();
        resolve();
      }).then(function () {
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });
    } else {
      app.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
    }
  }

  function createSessionInChat() {
    app.call.callStopQueue.callStarted = true;

    var message = {
      id: 'CREATE_SESSION',
      brokerAddress: config.callConfig.brokerAddress,
      turnAddress: config.callConfig.turnAddress.split(',')[0],
      chatId: callId,
      // clientId: app.sdkParams.token
      token: app.sdkParams.token
    },
        onResultCallback = function onResultCallback(res) {
      if (res.done === 'TRUE') {
        app.call.callStopQueue.callStarted = true;
        var user = config.users.get(app.store.user.get().id); //Start my own senders

        if (user.user().video) {
          user.startVideo(user.user().topicSend, null);
        }

        if (!user.user().mute) {
          user.startAudio(user.user().topicSend, null);
        }
      } else {
        app.callsManager.removeItem(config.callId); // endCall({callId: config.callId});
        // callStop(true, true);
      }
    };

    sendCallMessage(message, onResultCallback, {
      timeoutTime: 4000,
      timeoutRetriesCount: 5
    });
  }

  function callStop() {
    return _callStop.apply(this, arguments);
  }

  function _callStop() {
    _callStop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
      var resetCurrentCallId,
          resetCameraPaused,
          _args8 = arguments;
      return _regenerator["default"].wrap(function _callee7$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              resetCurrentCallId = _args8.length > 0 && _args8[0] !== undefined ? _args8[0] : true;
              resetCameraPaused = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : true;
              _context8.next = 4;
              return config.users.destroy();

            case 4:
              if (app.call.callStopQueue.callStarted) {
                sendCallMessage({
                  id: 'EXIT_CLIENT',
                  token: app.sdkParams.token
                }, null, {});
                app.call.callStopQueue.callStarted = false;
              }

              if (resetCameraPaused) app.call.joinCallParams.cameraPaused = false;
              clearTimeout(config.callRequestTimeout);
              config.callConfig = {};
              if (resetCurrentCallId) config.callId = null;

            case 9:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee7);
    }));
    return _callStop.apply(this, arguments);
  }

  function sendCallMessage(message, callback, _ref3) {
    var _ref3$timeoutTime = _ref3.timeoutTime,
        timeoutTime = _ref3$timeoutTime === void 0 ? 0 : _ref3$timeoutTime,
        _ref3$timeoutRetriesC = _ref3.timeoutRetriesCount,
        timeoutRetriesCount = _ref3$timeoutRetriesC === void 0 ? 0 : _ref3$timeoutRetriesC;
    message.token = app.sdkParams.token; // let uniqueId;

    if (!message.uniqueId) {
      message.uniqueId = _utility["default"].generateUUID();
    } // message.uniqueId = uniqueId;


    message.chatId = config.callId;
    var data = {
      type: 3,
      content: {
        peerName: config.callServerController.getCurrentServer(),
        // callServerName,
        priority: 1,
        content: JSON.stringify(message),
        ttl: app.sdkParams.messageTtl
      }
    };

    if (typeof callback == 'function') {
      app.store.messagesCallbacks[message.uniqueId] = callback;
    }

    app.call.sharedVariables.asyncClient.send(data, function (res) {});

    if (timeoutTime || app.call.sharedVariables.globalCallRequestTimeout > 0) {
      app.store.asyncRequestTimeouts[message.uniqueId] && clearTimeout(app.store.asyncRequestTimeouts[message.uniqueId]);
      app.store.asyncRequestTimeouts[message.uniqueId] = setTimeout(function () {
        if (app.store.messagesCallbacks[message.uniqueId]) {
          delete app.store.messagesCallbacks[message.uniqueId];
        }

        if (timeoutRetriesCount) {
          app.sdkParams.consoleLogging && console.log("[SDK][sendCallMessage] Retrying call request. uniqueId :" + message.uniqueId, {
            message: message
          }); //timeoutCallback();

          sendCallMessage(message, callback, {
            timeoutTime: timeoutTime,
            timeoutRetriesCount: timeoutRetriesCount - 1
          });
        } else if (typeof callback == 'function') {
          /**
           * Request failed
           */
          callback({
            done: 'SKIP'
          });
        }
      }, timeoutTime || app.call.sharedVariables.globalCallRequestTimeout);
    }
  }

  function handleReceivingTracksChanges(jsonMessage) {
    if (jsonMessage && jsonMessage.recvList && jsonMessage.recvList.length) {
      try {
        var processedTopics = [];
        var list = JSON.parse(jsonMessage.recvList);

        for (var i = list.length - 1; i >= 0; i--) {
          if (!processedTopics.includes(list[i].topic)) {
            processedTopics.push(list[i].topic);
            var userId = config.users.findUserIdByTopic(list[i].topic);
            var user = config.users.get(userId);

            if (user) {
              if (user.isScreenShare() && !config.screenShareInfo.iAmOwner() || !user.isMe()) {
                user.processTrackChange(list[i]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Unable to parse receive list', error);
      }
    }
  }

  function handleProcessSdpOffer(jsonMessage) {
    config.receivePeerManager.removeRequestTimeout(jsonMessage.uniqueId);
    if (jsonMessage.topic && jsonMessage.topic.length) config.receivePeerManager.handleProcessSDPOfferForReceiveTrack(jsonMessage, function () {});
  }

  function handleProcessSdpAnswer(jsonMessage) {
    var peer = config.sendPeerManager.getPeer();

    if (peer == null) {
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleProcessSdpAnswer] Skip, no WebRTC Peer",
        error: peer,
        environmentDetails: getCallDetails()
      });
      return;
    }

    peer.processAnswer(jsonMessage.sdpAnswer, function (err) {
      if (err) {
        sendCallSocketError("[handleProcessSdpAnswer] Error: " + err);
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[handleProcessSdpAnswer] Error: " + err,
          environmentDetails: getCallDetails()
        });
        return;
      }

      config.sendPeerManager.processingCurrentTrackCompleted();
      app.sdkParams.consoleLogging && console.log("[SDK][handleProcessSdpAnswer]", jsonMessage);
    });
  }

  function handleSendAddIceCandidate(jsonMessage) {
    var peer = config.sendPeerManager.getPeer();

    if (!peer) {
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleSendAddIceCandidate] Skip, no WebRTC Peer",
        error: JSON.stringify(peer),
        environmentDetails: getCallDetails()
      });
      return;
    }

    if (jsonMessage.candidate && jsonMessage.candidate.length) {
      var candidate = JSON.parse(jsonMessage.candidate);
      config.sendPeerManager.addIceCandidateToQueue(candidate);
    }
  } // let receiveAddIceCandidates = [];


  function handleReceiveAddIceCandidate(jsonMessage) {
    var peer = config.receivePeerManager.getPeer();

    if (!peer) {
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleReceiveAddIceCandidate] Skip, no WebRTC Peer",
        error: JSON.stringify(peer),
        environmentDetails: getCallDetails()
      });
      return;
    }

    if (jsonMessage.candidate && jsonMessage.candidate.length) {
      var candidate = JSON.parse(jsonMessage.candidate);
      config.receivePeerManager.addIceCandidateToQueue(candidate);
    }
  }

  function getCallDetails(customData) {
    return _objectSpread({
      currentUser: app.store.user.get(),
      currentServers: {
        callTurnIp: app.call.sharedVariables.callTurnIp
      },
      isJanus: config.callId && config.callServerController.isJanus(),
      screenShareInfo: {
        isStarted: config.screenShareInfo.isStarted(),
        iAmOwner: config.screenShareInfo.iAmOwner()
      },
      callId: config.callId,
      startCallInfo: config.callConfig
    }, customData);
  }

  function sendCallSocketError(message) {
    app.chatEvents.fireEvent('callEvents', {
      type: 'CALL_ERROR',
      code: 7000,
      message: message,
      environmentDetails: getCallDetails()
    });
    sendCallMessage({
      id: 'ERROR',
      message: message
    }, null, {});
  }

  function handleReceivedMetaData(jsonMessage, uniqueId) {
    var jMessage = JSON.parse(jsonMessage.message);
    var id = jMessage.id;

    if (!id || typeof id === "undefined" || jsonMessage.userid == app.store.user.get().id) {
      return;
    }

    switch (id) {
      case _constants.callMetaDataTypes.POORCONNECTION:
        publicized.sendQualityCheckEvent({
          userId: jMessage.userid,
          topic: jMessage.content.description,
          //jMessage.topic,
          mediaType: jMessage.content.description.indexOf('Vi') !== -1 ? 'video' : 'audio',
          //jMessage.mediaType,
          canSendCallMetaData: false
        });
        break;

      case _constants.callMetaDataTypes.POORCONNECTIONRESOLVED:
        publicized.sendQualityCheckEvent({
          userId: jMessage.userid,
          topic: jMessage.content.description,
          mediaType: jMessage.content.description.indexOf('Vi') !== -1 ? 'video' : 'audio',
          isResolved: true,
          canSendCallMetaData: false
        });
        break;

      case _constants.callMetaDataTypes.CUSTOMUSERMETADATA:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](jsonMessage);
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CUSTOM_USER_METADATA',
          userId: jMessage.userid,
          content: jMessage.content
        });
        break;

      case _constants.callMetaDataTypes.SCREENSHAREMETADATA:
        if (config.screenShareInfo.isStarted()) {
          config.screenShareInfo.setWidth(jMessage.content.dimension.width);
          config.screenShareInfo.setHeight(jMessage.content.dimension.height);
          app.chatEvents.fireEvent("callEvents", {
            type: 'SCREENSHARE_METADATA',
            userId: jMessage.userid,
            content: jMessage.content
          });
        }

        break;
    }
  }

  function handleSlowLink(jsonMessage) {
    console.log('handleSlowLink ', {
      jsonMessage: jsonMessage
    });
    var userId = config.users.findUserIdByClientId(jsonMessage.client);
    config.users.get(userId).startSLowLink();
  }

  function sendCallMetaData(params) {
    var message = {
      id: params.id,
      userid: params.userid,
      content: params.content || undefined
    };
    sendCallMessage({
      id: 'SENDMETADATA',
      message: JSON.stringify(message),
      chatId: config.callId
    }, null, {});
  }

  function handleError(jsonMessage, sendingTopic, receiveTopic) {
    var errMessage = jsonMessage.message;
    app.chatEvents.fireEvent('callEvents', {
      type: 'CALL_ERROR',
      code: 7000,
      message: "Kurento error: " + errMessage,
      environmentDetails: getCallDetails()
    });
  }

  var publicized = {
    callServerController: function callServerController() {
      return config.callServerController;
    },
    callConfig: function callConfig() {
      return config.callConfig;
    },
    callStop: callStop,
    endCall: app.call.endCall,
    users: function users() {
      return config.users;
    },
    deviceManager: function deviceManager() {
      return config.deviceManager;
    },
    sendCallDivs: function sendCallDivs() {
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_DIVS',
        result: config.users.generateCallUIList()
      });
    },
    screenShareInfo: config.screenShareInfo,
    raiseCallError: function raiseCallError(errorObject, callBack, fireEvent) {
      app.errorHandler.raiseError(errorObject, callBack, fireEvent, {
        eventName: 'callEvents',
        eventType: 'CALL_ERROR',
        environmentDetails: getCallDetails()
      });
    },
    getCallDetails: getCallDetails,
    sendCallMessage: sendCallMessage,
    sendPeerManager: function sendPeerManager() {
      return config.sendPeerManager;
    },
    receivePeerManager: function receivePeerManager() {
      return config.receivePeerManager;
    },
    getTurnServer: function getTurnServer(params) {
      if (!!params.turnAddress && params.turnAddress.length > 0 || app.call.sharedVariables.useInternalTurnAddress && !!params.internalTurnAddress && params.turnAddress.length > 0) {
        var serversTemp = app.call.sharedVariables.useInternalTurnAddress ? params.internalTurnAddress.split(',') : params.turnAddress.split(','),
            turnsList = [];

        for (var i in serversTemp) {
          turnsList.push({
            "urls": "turn:" + serversTemp[i],
            "username": "mkhorrami",
            "credential": "mkh_123456"
          });
        }

        return turnsList;
      } else {
        return [{
          "urls": "turn:" + app.call.sharedVariables.callTurnIp + ":3478",
          "username": "mkhorrami",
          "credential": "mkh_123456"
        }];
      }
    },
    sendQualityCheckEvent: function sendQualityCheckEvent(_ref4) {
      var userId = _ref4.userId,
          topic = _ref4.topic,
          mediaType = _ref4.mediaType,
          _ref4$isLongTime = _ref4.isLongTime,
          isLongTime = _ref4$isLongTime === void 0 ? false : _ref4$isLongTime,
          _ref4$isResolved = _ref4.isResolved,
          isResolved = _ref4$isResolved === void 0 ? false : _ref4$isResolved,
          _ref4$canSendCallMeta = _ref4.canSendCallMetaData,
          canSendCallMetaData = _ref4$canSendCallMeta === void 0 ? true : _ref4$canSendCallMeta;

      if (mediaType === 'video') {
        //TODO: Deprecated!
        app.chatEvents.fireEvent('callEvents', {
          type: isResolved ? 'POOR_VIDEO_CONNECTION_RESOLVED' : 'POOR_VIDEO_CONNECTION',
          subType: isResolved ? undefined : isLongTime ? 'LONG_TIME' : 'SHORT_TIME',
          message: 'Poor connection resolved',
          metadata: {
            elementId: "uiRemoteVideo-" + topic,
            topic: topic,
            userId: userId
          }
        });
      }

      app.chatEvents.fireEvent('callEvents', {
        type: isResolved ? 'POOR_CONNECTION_RESOLVED' : 'POOR_CONNECTION',
        subType: isResolved ? undefined : isLongTime ? 'LONG_TIME' : 'SHORT_TIME',
        message: "Poor connection ".concat(isResolved ? 'resolved' : ''),
        metadata: {
          media: mediaType,
          elementId: "uiRemoteVideo-" + topic,
          topic: topic,
          userId: userId
        }
      });

      if (canSendCallMetaData) {
        sendCallMetaData({
          id: isResolved ? _constants.callMetaDataTypes.POORCONNECTIONRESOLVED : _constants.callMetaDataTypes.POORCONNECTION,
          userid: userId,
          content: {
            title: "Poor Connection ".concat(isResolved ? 'Resolved' : ''),
            description: topic
          }
        });
      }
    },
    processCallMessage: function processCallMessage(message) {
      var uniqueId = message.uniqueId;

      if (message.done !== 'FALSE' || message.done === 'FALSE' && message.desc === 'duplicated') {
        app.store.asyncRequestTimeouts[uniqueId] && clearTimeout(app.store.asyncRequestTimeouts[uniqueId]);
      } else if (message.done === 'FALSE') {
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "Kurento error: " + (message.desc ? message.desc : message.message),
          environmentDetails: getCallDetails()
        });
      }

      switch (message.id) {
        case 'PROCESS_SDP_ANSWER':
          //For send connection 1
          handleProcessSdpAnswer(message);
          break;

        case 'SEND_COMPLETE':
          //For send connection 2
          // config.sendPeerManager.processingCurrentTrackCompleted();
          break;

        case 'RECEIVING_MEDIA': // Only for receiving topics from janus, first we subscribe

        case 'UNPUBLISHED':
          handleReceivingTracksChanges(message);
          break;

        case 'PROCESS_SDP_OFFER': //Then janus sends offers

        case 'PROCESS_SDP_UPDATE':
          handleProcessSdpOffer(message);
          break;

        case 'SEND_ADD_ICE_CANDIDATE':
          handleSendAddIceCandidate(message);

        case 'RECIVE_ADD_ICE_CANDIDATE':
          handleReceiveAddIceCandidate(message);
          break;

        case 'JOIN_AADDITIONN_COMPLETE':
          // For receive connections 2
          // console.log("join completed. trying next if any")
          // let recvData = message.addition;
          // if(recvData && recvData.length) {
          //     try {
          //         recvData = JSON.parse(recvData);
          //     } catch (error) {
          //         console.error('Unable to parse JOIN_AADDITIONN_COMPLETE result', error);
          //     }
          //     let userId = config.users.findUserIdByTopic(recvData[0].topic);
          //     if(recvData[0].topic.indexOf('Vo-') > -1) {
          //         let el = config.users.get(userId).getAudioHtmlElement();
          //         config.htmlElements[config.user.audioTopicName] = el;
          //         config.users.get(userId).appendAudioToCallDiv();
          //     } else {
          //         let el = config.users.get(userId).getVideoHtmlElement();
          //         config.htmlElements[config.user.videoTopicName] = el;
          //         config.users.get(userId).appendVideoToCallDiv();
          //     }
          // }
          config.receivePeerManager.processingCurrentTrackCompleted();
          break;

        case 'GET_KEY_FRAME':
          // let user = config.users.get(store.user().id);
          // if (user && user.user().video) {
          //     user.videoTopicManager().restartMediaOnKeyFrame([2000, 4000, 8000, 12000]);
          // }
          // let screenShareuser = config.users.get('screenShare');
          // if (screenShareuser
          //     && screenShareuser.user().video
          //     && config.screenShareInfo.isStarted()
          //     && config.screenShareInfo.iAmOwner()
          // ) {
          //     screenShareuser.videoTopicManager().restartMediaOnKeyFrame([2000, 4000, 8000, 12000]);
          // }
          break;

        case 'STOP':
          if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'EXIT_CLIENT':
        case 'CLOSE':
          if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'SLOW_LINK':
          handleSlowLink(message);
          break;

        case 'SESSION_NEW_CREATED':
        case 'SESSION_REFRESH':
          if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'RECEIVEMETADATA':
          handleReceivedMetaData(message, uniqueId);
          break;

        case 'ERROR':
          config.receivePeerManager.requestReceiveError(uniqueId);
          publicized.raiseCallError(app.errorHandler.getFilledErrorObject(_objectSpread(_objectSpread({}, _errorHandler.errorList.CALL_SERVER_ERROR), {}, {
            replacements: [JSON.stringify(message)]
          })), null, true);
          break;

        default:
          console.warn("[SDK][onmessage] Invalid message, id: " + message.id, message); // if (jsonMessage.match(/NOT CREATE SESSION/g)) {
          //     if (currentCallParams && Object.keys(currentCallParams)) {
          //         //handleCallSocketOpen(currentCallParams);
          //         callStateController.createSessionInChat(currentCallParams);
          //     }
          // }

          break;
      }

      app.store.messagesCallbacks[uniqueId] && delete app.store.messagesCallbacks[uniqueId];
    },
    handleParticipantJoin: function handleParticipantJoin(messageContent) {
      if (Array.isArray(messageContent)) {
        var _loop2 = function _loop2(i) {
          var correctedData = {
            video: messageContent[i].video,
            mute: messageContent[i].mute,
            userId: messageContent[i].userId,
            topicSend: messageContent[i].sendTopic,
            clientId: messageContent[i].participantVO.ssoId,
            autoStartStreams: true,
            callId: config.callId,
            cameraPaused: false
          };

          if (!config.users.get(correctedData.userId)) {
            new Promise(function (resolve) {
              config.users.addItem(correctedData);
              resolve();
            }).then(function () {
              app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.users.generateCallUIList()
              });
            });
          } else {
            config.users.removeItem(correctedData.userId);
            new Promise(function (resolve) {
              config.users.addItem(correctedData);
              resolve();
            }).then(function () {
              app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.users.generateCallUIList()
              });
            });
          }
        };

        for (var i in messageContent) {
          _loop2(i);
        }
      }

      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_PARTICIPANT_JOINED',
        result: messageContent
      });

      if (config.users.get(app.store.user.get().id).video) {
        config.users.get(app.store.user.get().id).videoTopicManager().restartMediaOnKeyFrame(app.store.user.get().id, [2000, 4000, 8000, 12000, 16000, 24000]);
      }

      if (config.screenShareInfo.isStarted() && config.screenShareInfo.iAmOwner()) {
        sendCallMetaData({
          id: _constants.callMetaDataTypes.SCREENSHAREMETADATA,
          userid: app.store.user.get().id,
          content: {
            dimension: {
              width: config.screenShareInfo.getWidth(),
              height: config.screenShareInfo.getHeight()
            }
          }
        }); // config.users.get('screenShare').videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000, 4000, 8000, 12000, 16000, 24000]);
      }
    },
    handleParticipantLeft: function handleParticipantLeft(messageContent, threadId) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                app.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_PARTICIPANT_LEFT',
                  callId: threadId,
                  result: messageContent
                }); //If I'm the only call participant, stop the call

                if (!(Object.values(config.users.getAll()).length < 2)) {
                  _context2.next = 5;
                  break;
                }

                app.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_ENDED',
                  callId: config.callId
                });
                app.callsManager.removeItem(config.callId);
                return _context2.abrupt("return");

              case 5:
                if (!messageContent[0].userId) {
                  _context2.next = 13;
                  break;
                }

                if (!(messageContent[0].userId == app.store.user.get().id)) {
                  _context2.next = 10;
                  break;
                }

                // await callStop();
                app.callsManager.removeItem(config.callId);
                _context2.next = 13;
                break;

              case 10:
                _context2.next = 12;
                return config.users.removeItem(messageContent[0].userId);

              case 12:
                if (config.screenShareInfo.isStarted() && config.screenShareInfo.getOwner() === messageContent[0].userId) {
                  config.users.removeItem("screenShare");
                } //callStateController.removeScreenShareFromCall()


              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    handleParticipantMute: function handleParticipantMute(messageContent) {
      if (Array.isArray(messageContent)) {
        for (var i in messageContent) {
          var user = config.users.get(messageContent[i].userId);

          if (user) {
            user.stopAudio();
          }
        }
      }

      setTimeout(function () {
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_PARTICIPANT_MUTE',
        result: messageContent
      });
    },
    handleParticipantUnMute: function handleParticipantUnMute(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var _loop3, i;

        return _regenerator["default"].wrap(function _callee3$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!Array.isArray(messageContent)) {
                  _context4.next = 8;
                  break;
                }

                _loop3 = /*#__PURE__*/_regenerator["default"].mark(function _loop3(i) {
                  var user;
                  return _regenerator["default"].wrap(function _loop3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          user = config.users.get(messageContent[i].userId);

                          if (!(user && user.isMe())) {
                            _context3.next = 6;
                            break;
                          }

                          if (user.user.mute) {
                            _context3.next = 5;
                            break;
                          }

                          _context3.next = 5;
                          return user.destroyAudio();

                        case 5:
                          setTimeout(function () {
                            user.startAudio(messageContent[i].sendTopic);
                          }, 50);

                        case 6:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _loop3);
                });
                _context4.t0 = _regenerator["default"].keys(messageContent);

              case 3:
                if ((_context4.t1 = _context4.t0()).done) {
                  _context4.next = 8;
                  break;
                }

                i = _context4.t1.value;
                return _context4.delegateYield(_loop3(i), "t2", 6);

              case 6:
                _context4.next = 3;
                break;

              case 8:
                setTimeout(function () {
                  app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                  });
                });
                app.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_PARTICIPANT_UNMUTE',
                  result: messageContent
                });

              case 10:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee3);
      }))();
    },
    handleParticipantVideoOn: function handleParticipantVideoOn(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        var i, user;
        return _regenerator["default"].wrap(function _callee4$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!Array.isArray(messageContent)) {
                  _context5.next = 12;
                  break;
                }

                _context5.t0 = _regenerator["default"].keys(messageContent);

              case 2:
                if ((_context5.t1 = _context5.t0()).done) {
                  _context5.next = 12;
                  break;
                }

                i = _context5.t1.value;
                user = config.users.get(messageContent[i].userId);

                if (!(user && user.isMe())) {
                  _context5.next = 10;
                  break;
                }

                if (!user.user.video) {
                  _context5.next = 9;
                  break;
                }

                _context5.next = 9;
                return user.stopVideo();

              case 9:
                user.startVideo(messageContent[i].sendTopic);

              case 10:
                _context5.next = 2;
                break;

              case 12:
                setTimeout(function () {
                  app.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                  });
                });
                app.chatEvents.fireEvent('callEvents', {
                  type: 'TURN_ON_VIDEO_CALL',
                  result: messageContent
                });

              case 14:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee4);
      }))();
    },
    handleParticipantVideoOff: function handleParticipantVideoOff(messageContent) {
      if (Array.isArray(messageContent)) {
        for (var i in messageContent) {
          var user = config.users.get(messageContent[i].userId);
          if (user) user.stopVideo();
        }
      }

      setTimeout(function () {
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });
      app.chatEvents.fireEvent('callEvents', {
        type: 'TURN_OFF_VIDEO_CALL',
        result: messageContent
      });
    },
    handleStartScreenShare: function handleStartScreenShare(messageContent) {
      app.sdkParams.consoleLogging && console.log("[sdk][startScreenShare][onResult]: ", messageContent);

      var result = _utility["default"].createReturnData(false, '', 0, messageContent, null);

      if (result.hasError) {
        // endScreenShare({}, null);
        config.users.removeItem("screenShare");
        return;
      }

      var direction = 'send',
          shareScreen = true;
      config.screenShareInfo.setIsStarted(true);
      config.screenShareInfo.setOwner(messageContent.screenOwner.id);

      if (config.screenShareInfo.isStarted() && !config.screenShareInfo.iAmOwner()) {
        direction = 'receive';
        shareScreen = false;
      }

      if (config.screenShareInfo.isStarted() && config.screenShareInfo.iAmOwner()) {
        var qualityObject = app.call.calculateScreenSize({
          quality: app.call.sharedVariables.startScreenSharetParams.quality
        });
        config.screenShareInfo.setWidth(qualityObject.width);
        config.screenShareInfo.setHeight(qualityObject.height);
        sendCallMetaData({
          id: _constants.callMetaDataTypes.SCREENSHAREMETADATA,
          userid: app.store.user.get().id,
          content: {
            dimension: {
              width: config.screenShareInfo.getWidth(),
              height: config.screenShareInfo.getHeight()
            }
          }
        });
      } // callStateController.addScreenShareToCall(direction, shareScreen);


      if (config.screenShareInfo.iAmOwner()) {
        setTimeout(function () {
          doThings();
        }, 1000);
      } else {
        doThings();
      }

      function doThings() {
        callConfig.screenShareObject.callId = config.callId;
        var clientId = messageContent.topicSend.split('-')[2];
        callConfig.screenShareObject.clientId = clientId; //config.users.get(app.store.user.get().id).user().clientId;

        callConfig.screenShareObject.cameraPaused = false;
        callConfig.screenShareObject.userId = "screenShare";
        config.users.addItem(callConfig.screenShareObject, "screenShare");
        app.chatEvents.fireEvent('callEvents', {
          type: 'START_SCREEN_SHARE',
          result: messageContent
        });
      }
    },
    handleEndScreenShare: function handleEndScreenShare(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                config.screenShareInfo.setIsStarted(false);
                config.screenShareInfo.setOwner(messageContent.screenOwner.id);
                _context6.next = 4;
                return config.users.removeItem('screenShare');

              case 4:
                _context6.next = 6;
                return config.deviceManager.mediaStreams.stopScreenShareInput();

              case 6:
                app.chatEvents.fireEvent('callEvents', {
                  type: 'END_SCREEN_SHARE',
                  result: messageContent
                });
                app.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_DIVS',
                  result: config.users.generateCallUIList()
                });

              case 8:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee5);
      }))();
    },
    pauseCamera: function pauseCamera() {
      var me = config.users.get(app.store.user.get().id);
      if (!me || !me.user().video || !me.user().videoTopicName) return;
      me.pauseVideoSendStream();
    },
    resumeCamera: function resumeCamera() {
      var me = config.users.get(app.store.user.get().id);
      if (!me || !me.user().videoTopicName || !me.user().video) //!me.peers[me.videoTopicName]
        return;
      me.resumeVideoSendStream();
    },
    pauseMice: function pauseMice() {
      var me = config.users.get(app.store.user.get().id);
      if (!me || !me.user().audioTopicName || me.user().mute) //!me.peers[me.videoTopicName]
        return;
      me.pauseAudioSendStream();
    },
    resumeMice: function resumeMice() {
      var me = config.users.get(app.store.user.get().id);
      if (!me || !me.user().audioTopicName || me.user().mute) //!me.peers[me.videoTopicName]
        return;
      me.resumeAudioSendStream();
    },
    onChatConnectionReconnect: function onChatConnectionReconnect() {
      return; //First count all failed topics

      var ftCount = 0,
          totalTopics = 0;
      Object.values(config.users.getAll()).forEach(function (item) {
        if (item.user().video) {
          totalTopics++;

          if (item.videoTopicManager().isPeerFailed()) {
            ftCount++;
          }
        }

        if (!item.user().mute) {
          totalTopics++;

          if (item.audioTopicManager().isPeerFailed()) {
            ftCount++;
          }
        }
      }); //If only some topics are failed

      if (ftCount < totalTopics) {
        Object.values(config.users.getAll()).forEach(function (item) {
          if (item.user().video) {
            totalTopics++;

            if (item.videoTopicManager().isPeerFailed()) {
              item.reconnectTopic("video");
            }
          }

          if (!item.user().mute) {
            totalTopics++;

            if (item.audioTopicManager().isPeerFailed()) {
              item.reconnectTopic("audio");
            }
          }
        });
      } else {//Inquiry the call
      }
    },
    destroy: function destroy() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                app.chatEvents.off('chatReady', socketConnectListener);
                _context7.next = 3;
                return config.deviceManager.mediaStreams.stopAudioInput();

              case 3:
                _context7.next = 5;
                return config.deviceManager.mediaStreams.stopVideoInput();

              case 5:
                _context7.next = 7;
                return config.deviceManager.mediaStreams.stopScreenShareInput();

              case 7:
                config.sendPeerManager.destroy();
                config.receivePeerManager.destroy();
                return _context7.abrupt("return", callStop());

              case 10:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee6);
      }))();
    }
  };
  setTimeout(function () {
    startCallWebRTCFunctions(config.callConfig);
  }, 50);
  return publicized;
}

function ScreenShareStateManager(app) {
  var config = {
    ownerId: 0,
    imOwner: false,
    isStarted: false,
    width: app.call.sharedVariables.callVideoMinWidth,
    height: app.call.sharedVariables.callVideoMinHeight
  };
  return {
    setOwner: function setOwner(ownerId) {
      config.ownerId = +ownerId;
    },
    setIsStarted: function setIsStarted(isStarted) {
      config.isStarted = isStarted;
    },
    isStarted: function isStarted() {
      return config.isStarted;
    },
    iAmOwner: function iAmOwner() {
      return config.ownerId === app.store.user.get().id;
    },
    setWidth: function setWidth(width) {
      config.width = width;
    },
    setHeight: function setHeight(height) {
      config.height = height;
    },
    getWidth: function getWidth(width) {
      return config.width;
    },
    getHeight: function getHeight(height) {
      return config.height;
    },
    getOwner: function getOwner() {
      return config.ownerId;
    },
    setDimension: function setDimension(dimension) {
      if (dimension && dimension.width && +dimension.width > 0 && dimension.height && +dimension.height > 0) {
        config.screenShareInfo.setHeight(dimension.height);
        config.screenShareInfo.setWidth(dimension.width);
      } else {
        config.screenShareInfo.setHeight(app.call.sharedVariables.callVideoMinHeight);
        config.screenShareInfo.setWidth(app.call.sharedVariables.callVideoMinWidth);
      }
    }
  };
}

var _default = MultiTrackCallManager;
exports["default"] = _default;