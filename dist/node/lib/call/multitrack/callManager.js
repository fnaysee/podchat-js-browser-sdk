"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultiTrackCallManager = MultiTrackCallManager;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _callUsers = require("./callUsers");

var _events = require("../../../events.module");

var _sdkParams = require("../../sdkParams");

var _store = require("../../store");

var _sharedData = require("../sharedData");

var _utility = _interopRequireDefault(require("../../../utility/utility"));

var _callServerManager = require("../callServerManager");

var _constants = require("../../constants");

var _errorHandler = require("../../errorHandler");

var _callsList = require("../callsList");

var _webrtcPeer = require("./webrtcPeer");

var _peerConnectionManager = _interopRequireDefault(require("./peerConnectionManager"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function MultiTrackCallManager(_ref) {
  var callId = _ref.callId,
      callConfig = _ref.callConfig;
  var config = {
    callId: callId,
    callConfig: callConfig,
    users: new _callUsers.CallUsers({
      callId: callId
    }),
    callServerController: new _callServerManager.CallServerManager(),
    screenShareInfo: new ScreenShareStateManager(),
    deviceManager: null,
    sendPeerManager: null,
    receivePeerManager: null
  };

  function onTrackCallback() {}

  function startCallWebRTCFunctions(callConfig) {
    config.callServerController.setServers(callConfig.kurentoAddress);
    config.sendPeerManager = new _peerConnectionManager["default"](callId, 'send', {
      iceServers: publicized.getTurnServer(publicized.callConfig()),
      iceTransportPolicy: 'relay'
    }, onTrackCallback);
    config.receivePeerManager = new _peerConnectionManager["default"](callId, 'receive', {
      iceServers: publicized.getTurnServer(publicized.callConfig()),
      iceTransportPolicy: 'relay'
    }, onTrackCallback);

    if (_sharedData.sharedVariables.callDivId) {
      new Promise(function (resolve) {
        var callVideo = typeof callConfig.video === 'boolean' ? callConfig.video : true,
            callMute = typeof callConfig.mute === 'boolean' ? callConfig.mute : false;
        config.deviceManager = _sharedData.sharedVariables.deviceManager;
        _sharedData.sharedVariables.deviceManager = null;

        if (callConfig.selfData) {
          callConfig.selfData.callId = config.callId;
          callConfig.selfData.cameraPaused = callConfig.cameraPaused;
          config.users.addItem(callConfig.selfData); // callStateController.setupCallParticipant(params.selfData);
        }

        config.screenShareInfo.setOwner(callConfig.screenShareOwner);
        config.screenShareInfo.setIsStarted(!!callConfig.screenShareOwner);

        if (callConfig.recordingOwner) {
          _events.chatEvents.fireEvent('callEvents', {
            type: 'CALL_RECORDING_STARTED',
            result: {
              id: params.recordingOwner
            }
          });
        }

        if (callConfig.clientsList && callConfig.clientsList.length) {
          for (var i in callConfig.clientsList) {
            if (callConfig.clientsList[i].userId !== _store.store.user().id) {
              callConfig.clientsList[i].callId = config.callId;
              callConfig.clientsList[i].cameraPaused = false;
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
          config.screenShareInfo.setOwner(config.callConfig.screenShareOwner);
          config.users.addItem(config.callConfig.screenShareObject, "screenShare");
        }

        config.callConfig.callVideo = callVideo;
        config.callConfig.callAudio = callMute;
        createSessionInChat();
        resolve();
      }).then(function () {
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });
    } else {
      _sdkParams.sdkParams.consoleLogging && console.log('No Call DIV has been declared!');
    }
  }

  function createSessionInChat() {
    _sharedData.callStopQueue.callStarted = true;

    var message = {
      id: 'CREATE_SESSION',
      brokerAddress: config.callConfig.brokerAddress,
      turnAddress: config.callConfig.turnAddress.split(',')[0],
      chatId: callId,
      // clientId: sdkParams.token
      token: _sdkParams.sdkParams.token
    },
        onResultCallback = function onResultCallback(res) {
      if (res.done === 'TRUE') {
        _sharedData.callStopQueue.callStarted = true; // callController.startCall(params);
      } else {
        (0, _callsList.callsManager)().removeItem(config.callId); // endCall({callId: config.callId});
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
    _callStop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
      var resetCurrentCallId,
          resetCameraPaused,
          _args7 = arguments;
      return _regenerator["default"].wrap(function _callee6$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              resetCurrentCallId = _args7.length > 0 && _args7[0] !== undefined ? _args7[0] : true;
              resetCameraPaused = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : true;
              _context7.next = 4;
              return config.users.destroy();

            case 4:
              if (_sharedData.callStopQueue.callStarted) {
                sendCallMessage({
                  id: 'CLOSE'
                }, null, {});
                _sharedData.callStopQueue.callStarted = false;
              }

              if (resetCameraPaused) _sharedData.joinCallParams.cameraPaused = false;
              clearTimeout(config.callRequestTimeout);
              config.callConfig = {};
              if (resetCurrentCallId) config.callId = null;

            case 9:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee6);
    }));
    return _callStop.apply(this, arguments);
  }

  function sendCallMessage(message, callback, _ref2) {
    var _ref2$timeoutTime = _ref2.timeoutTime,
        timeoutTime = _ref2$timeoutTime === void 0 ? 0 : _ref2$timeoutTime,
        _ref2$timeoutRetriesC = _ref2.timeoutRetriesCount,
        timeoutRetriesCount = _ref2$timeoutRetriesC === void 0 ? 0 : _ref2$timeoutRetriesC;
    message.token = _sdkParams.sdkParams.token; // let uniqueId;

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
        ttl: _sdkParams.sdkParams.messageTtl
      }
    };

    if (typeof callback == 'function') {
      _store.store.messagesCallbacks[message.uniqueId] = callback;
    }

    _sharedData.sharedVariables.asyncClient.send(data, function (res) {});

    if (timeoutTime || _sharedData.sharedVariables.globalCallRequestTimeout > 0) {
      _store.store.asyncRequestTimeouts[message.uniqueId] && clearTimeout(_store.store.asyncRequestTimeouts[message.uniqueId]);
      _store.store.asyncRequestTimeouts[message.uniqueId] = setTimeout(function () {
        if (_store.store.messagesCallbacks[message.uniqueId]) {
          delete _store.store.messagesCallbacks[message.uniqueId];
        }

        if (timeoutRetriesCount) {
          _sdkParams.sdkParams.consoleLogging && console.log("[SDK][sendCallMessage] Retrying call request. uniqueId :" + message.uniqueId, {
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
      }, timeoutTime || _sharedData.sharedVariables.globalCallRequestTimeout);
    }
  }

  function handleReceivingTracksChanges(jsonMessage) {
    // jsonMessage.recvList
    jsonMessage.recvList.forEach(function (item) {
      var userId = config.users.findUserIdByTopic(item.topic);
      var user = config.users.get(userId);

      if (user) {
        user.processTrackChange();
      } // config.receivePeerManager.addTrack(jsonMessage.recvList)

    });
  }

  function handleProcessSdpOffer(jsonMessage) {
    this.receivePeerManager.handleProcessSDPOfferForReceiveTrack(jsonMessage);
  }

  function handleProcessSdpAnswer(jsonMessage) {
    var peer = config.sendPeerManager.getPeer();

    if (peer == null) {
      _events.chatEvents.fireEvent('callEvents', {
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

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[handleProcessSdpAnswer] Error: " + err,
          environmentDetails: getCallDetails()
        });

        return;
      }

      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][handleProcessSdpAnswer]", jsonMessage, jsonMessage.topic);
    });
  }

  function handleAddIceCandidate(jsonMessage) {
    var userId = config.users.findUserIdByTopic(jsonMessage.topic);

    if (!userId) {
      console.warn("[SDK] Skipping ADD_ICE_CANDIDATE, topic not exists.", {
        jsonMessage: jsonMessage
      });
      return;
    }

    var peer; //= callUsers[userId].peers[jsonMessage.topic];

    if (jsonMessage.topic.indexOf('Vi-') > -1 || jsonMessage.topic.indexOf('screen-Share') !== -1) {
      peer = config.users.get(userId).videoTopicManager();
    } else if (jsonMessage.topic.indexOf('Vo-') > -1) {
      peer = config.users.get(userId).audioTopicManager();
    }

    if (!peer) return;
    peer = peer.getPeer();

    if (peer == null) {
      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: "[handleAddIceCandidate] Skip, no WebRTC Peer",
        error: JSON.stringify(peer),
        environmentDetails: getCallDetails()
      });

      return;
    }

    peer.addIceCandidate(jsonMessage.candidate, function (err) {
      if (err) {
        console.error("[handleAddIceCandidate] " + err);

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ERROR',
          code: 7000,
          message: "[handleAddIceCandidate] " + err,
          error: JSON.stringify(jsonMessage.candidate),
          environmentDetails: getCallDetails()
        });

        return;
      }
    });
  }

  function getCallDetails(customData) {
    return _objectSpread({
      currentUser: _store.store.user,
      currentServers: {
        callTurnIp: _sharedData.sharedVariables.callTurnIp
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
    _events.chatEvents.fireEvent('callEvents', {
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

  function handlePartnerFreeze(jsonMessage) {
    if (!!jsonMessage && !!jsonMessage.topic && jsonMessage.topic.substring(0, 2) === 'Vi') {
      var userId = config.users.findUserIdByTopic();

      if (userId) {
        config.users.get(userId).videoTopicManager().restartMedia();
        setTimeout(function () {
          config.users.get(userId).videoTopicManager().restartMedia();
        }, 4000);
        setTimeout(function () {
          config.users.get(userId).videoTopicManager().restartMedia();
        }, 8000);
      }
    }
  }

  function handleReceivedMetaData(jsonMessage, uniqueId) {
    var jMessage = JSON.parse(jsonMessage.message);
    var id = jMessage.id;

    if (!id || typeof id === "undefined" || jsonMessage.userid == _store.store.user().id) {
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
        if (_store.store.messagesCallbacks[uniqueId]) {
          _store.store.messagesCallbacks[uniqueId](jsonMessage);
        }

        _events.chatEvents.fireEvent('callEvents', {
          type: 'CUSTOM_USER_METADATA',
          userId: jMessage.userid,
          content: jMessage.content
        });

        break;

      case _constants.callMetaDataTypes.SCREENSHAREMETADATA:
        if (config.screenShareInfo.isStarted()) {
          config.screenShareInfo.setWidth(jMessage.content.dimension.width);
          config.screenShareInfo.setHeight(jMessage.content.dimension.height); // applyScreenShareSizeToElement();

          if (config.screenShareInfo.iAmOwner()) {
            setTimeout(function () {
              if (config.users.get('screenShare') && config.users.get('screenShare').videoTopicManager()) config.users.get('screenShare').videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000]);
            }, 2500);
          }

          _events.chatEvents.fireEvent("callEvents", {
            type: 'SCREENSHARE_METADATA',
            userId: jMessage.userid,
            content: jMessage.content
          });
        }

        break;
    }
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

    _events.chatEvents.fireEvent('callEvents', {
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
    endCall: _sharedData.endCall,
    users: function users() {
      return config.users;
    },
    deviceManager: function deviceManager() {
      return config.deviceManager;
    },
    sendCallDivs: function sendCallDivs() {
      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_DIVS',
        result: config.users.generateCallUIList()
      });
    },
    screenShareInfo: config.screenShareInfo,
    raiseCallError: function raiseCallError(errorObject, callBack, fireEvent) {
      (0, _errorHandler.raiseError)(errorObject, callBack, fireEvent, {
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
      if (!!params.turnAddress && params.turnAddress.length > 0 || _sharedData.sharedVariables.useInternalTurnAddress && !!params.internalTurnAddress && params.turnAddress.length > 0) {
        var serversTemp = _sharedData.sharedVariables.useInternalTurnAddress ? params.internalTurnAddress.split(',') : params.turnAddress.split(','),
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
          "urls": "turn:" + _sharedData.sharedVariables.callTurnIp + ":3478",
          "username": "mkhorrami",
          "credential": "mkh_123456"
        }];
      }
    },
    sendQualityCheckEvent: function sendQualityCheckEvent(_ref3) {
      var userId = _ref3.userId,
          topic = _ref3.topic,
          mediaType = _ref3.mediaType,
          _ref3$isLongTime = _ref3.isLongTime,
          isLongTime = _ref3$isLongTime === void 0 ? false : _ref3$isLongTime,
          _ref3$isResolved = _ref3.isResolved,
          isResolved = _ref3$isResolved === void 0 ? false : _ref3$isResolved,
          _ref3$canSendCallMeta = _ref3.canSendCallMetaData,
          canSendCallMetaData = _ref3$canSendCallMeta === void 0 ? true : _ref3$canSendCallMeta;

      if (mediaType === 'video') {
        //TODO: Deprecated!
        _events.chatEvents.fireEvent('callEvents', {
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

      _events.chatEvents.fireEvent('callEvents', {
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
        _store.store.asyncRequestTimeouts[uniqueId] && clearTimeout(_store.store.asyncRequestTimeouts[uniqueId]);
      } else if (message.done === 'FALSE') {
        _events.chatEvents.fireEvent('callEvents', {
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
          // console.log("send completed. trying next if any")
          config.sendPeerManager.processingCurrentTrackCompleted();
          break;

        case 'RECEIVING_MEDIA': // Only for receiving topics from janus, first we subscribe

        case 'UNPUBLISHED':
          handleReceivingTracksChanges(message);
          break;

        case 'PROCESS_SDP_OFFER':
          //Then janus sends offers
          handleProcessSdpOffer(message);
          break;

        case 'ADD_ICE_CANDIDATE':
          handleAddIceCandidate(message);
          break;

        case 'JOIN_AADDITIONN_COMPLETE':
          // For receive connections 2
          console.log("join completed. trying next if any");
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
          if (_store.store.messagesCallbacks[uniqueId]) {
            _store.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'CLOSE':
          if (_store.store.messagesCallbacks[uniqueId]) {
            _store.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'SESSION_NEW_CREATED':
        case 'SESSION_REFRESH':
          if (_store.store.messagesCallbacks[uniqueId]) {
            _store.store.messagesCallbacks[uniqueId](message);
          }

          break;

        case 'RECEIVEMETADATA':
          handleReceivedMetaData(message, uniqueId);
          break;

        case 'ERROR':
          publicized.raiseCallError((0, _errorHandler.getFilledErrorObject)(_objectSpread(_objectSpread({}, _errorHandler.errorList.CALL_SERVER_ERROR), {}, {
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

      _store.store.messagesCallbacks[uniqueId] && delete _store.store.messagesCallbacks[uniqueId];
    },
    handleParticipantJoin: function handleParticipantJoin(messageContent) {
      if (Array.isArray(messageContent)) {
        var _loop = function _loop(i) {
          var correctedData = {
            video: messageContent[i].video,
            mute: messageContent[i].mute,
            userId: messageContent[i].userId,
            topicSend: messageContent[i].sendTopic,
            autoStartStreams: true,
            callId: config.callId,
            cameraPaused: false
          };

          if (!config.users.get(correctedData.userId)) {
            new Promise(function (resolve) {
              config.users.addItem(correctedData);
              resolve();
            }).then(function () {
              _events.chatEvents.fireEvent('callEvents', {
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
              _events.chatEvents.fireEvent('callEvents', {
                type: 'CALL_DIVS',
                result: config.users.generateCallUIList()
              });
            });
          }
        };

        for (var i in messageContent) {
          _loop(i);
        }
      }

      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_PARTICIPANT_JOINED',
        result: messageContent
      });

      if (config.users.get(_store.store.user().id).video) {
        config.users.get(_store.store.user().id).videoTopicManager().restartMediaOnKeyFrame(_store.store.user().id, [2000, 4000, 8000, 12000, 16000, 24000]);
      }

      if (config.screenShareInfo.isStarted() && config.screenShareInfo.iAmOwner()) {
        sendCallMetaData({
          id: _constants.callMetaDataTypes.SCREENSHAREMETADATA,
          userid: _store.store.user().id,
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
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _events.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_PARTICIPANT_LEFT',
                  callId: threadId,
                  result: messageContent
                }); //If I'm the only call participant, stop the call


                if (!(Object.values(config.users.getAll()).length < 2)) {
                  _context.next = 5;
                  break;
                }

                _events.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_ENDED',
                  callId: config.callId
                });

                (0, _callsList.callsManager)().removeItem(config.callId);
                return _context.abrupt("return");

              case 5:
                if (!messageContent[0].userId) {
                  _context.next = 13;
                  break;
                }

                if (!(messageContent[0].userId == _store.store.user().id)) {
                  _context.next = 10;
                  break;
                }

                // await callStop();
                (0, _callsList.callsManager)().removeItem(config.callId);
                _context.next = 13;
                break;

              case 10:
                _context.next = 12;
                return config.users.removeItem(messageContent[0].userId);

              case 12:
                if (config.screenShareInfo.isStarted() && config.screenShareInfo.getOwner() === messageContent[0].userId) {
                  config.users.removeItem("screenShare");
                } //callStateController.removeScreenShareFromCall()


              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
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
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });

      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_PARTICIPANT_MUTE',
        result: messageContent
      });
    },
    handleParticipantUnMute: function handleParticipantUnMute(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _loop2, i;

        return _regenerator["default"].wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!Array.isArray(messageContent)) {
                  _context3.next = 8;
                  break;
                }

                _loop2 = /*#__PURE__*/_regenerator["default"].mark(function _loop2(i) {
                  var user;
                  return _regenerator["default"].wrap(function _loop2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          user = config.users.get(messageContent[i].userId);

                          if (!user) {
                            _context2.next = 6;
                            break;
                          }

                          if (!user.audioTopicManager()) {
                            _context2.next = 5;
                            break;
                          }

                          _context2.next = 5;
                          return user.destroyAudio();

                        case 5:
                          setTimeout(function () {
                            user.startAudio(messageContent[i].sendTopic);
                          }, 50);

                        case 6:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _loop2);
                });
                _context3.t0 = _regenerator["default"].keys(messageContent);

              case 3:
                if ((_context3.t1 = _context3.t0()).done) {
                  _context3.next = 8;
                  break;
                }

                i = _context3.t1.value;
                return _context3.delegateYield(_loop2(i), "t2", 6);

              case 6:
                _context3.next = 3;
                break;

              case 8:
                setTimeout(function () {
                  _events.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                  });
                });

                _events.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_PARTICIPANT_UNMUTE',
                  result: messageContent
                });

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee2);
      }))();
    },
    handleParticipantVideoOn: function handleParticipantVideoOn(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var i, user;
        return _regenerator["default"].wrap(function _callee3$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!Array.isArray(messageContent)) {
                  _context4.next = 12;
                  break;
                }

                _context4.t0 = _regenerator["default"].keys(messageContent);

              case 2:
                if ((_context4.t1 = _context4.t0()).done) {
                  _context4.next = 12;
                  break;
                }

                i = _context4.t1.value;
                user = config.users.get(messageContent[i].userId);

                if (!user) {
                  _context4.next = 10;
                  break;
                }

                if (!user.audioTopicManager()) {
                  _context4.next = 9;
                  break;
                }

                _context4.next = 9;
                return user.stopVideo();

              case 9:
                user.startVideo(messageContent[i].sendTopic);

              case 10:
                _context4.next = 2;
                break;

              case 12:
                setTimeout(function () {
                  _events.chatEvents.fireEvent('callEvents', {
                    type: 'CALL_DIVS',
                    result: config.users.generateCallUIList()
                  });
                });

                _events.chatEvents.fireEvent('callEvents', {
                  type: 'TURN_ON_VIDEO_CALL',
                  result: messageContent
                });

              case 14:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee3);
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
        _events.chatEvents.fireEvent('callEvents', {
          type: 'CALL_DIVS',
          result: config.users.generateCallUIList()
        });
      });

      _events.chatEvents.fireEvent('callEvents', {
        type: 'TURN_OFF_VIDEO_CALL',
        result: messageContent
      });
    },
    handleStartScreenShare: function handleStartScreenShare(messageContent) {
      _sdkParams.sdkParams.consoleLogging && console.log("[sdk][startScreenShare][onResult]: ", messageContent);

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
        var qualityObject = (0, _sharedData.calculateScreenSize)({
          quality: _sharedData.sharedVariables.startScreenSharetParams.quality
        });
        config.screenShareInfo.setWidth(qualityObject.width);
        config.screenShareInfo.setHeight(qualityObject.height);
        sendCallMetaData({
          id: _constants.callMetaDataTypes.SCREENSHAREMETADATA,
          userid: _store.store.user().id,
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
        callConfig.screenShareObject.cameraPaused = false;
        callConfig.screenShareObject.userId = "screenShare";
        config.users.addItem(callConfig.screenShareObject, "screenShare");

        _events.chatEvents.fireEvent('callEvents', {
          type: 'START_SCREEN_SHARE',
          result: messageContent
        });
      }
    },
    handleEndScreenShare: function handleEndScreenShare(messageContent) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                config.screenShareInfo.setIsStarted(false);
                config.screenShareInfo.setOwner(messageContent.screenOwner.id);
                _context5.next = 4;
                return config.users.removeItem('screenShare');

              case 4:
                _context5.next = 6;
                return config.deviceManager.mediaStreams.stopScreenShareInput();

              case 6:
                _events.chatEvents.fireEvent('callEvents', {
                  type: 'END_SCREEN_SHARE',
                  result: messageContent
                });

                _events.chatEvents.fireEvent('callEvents', {
                  type: 'CALL_DIVS',
                  result: config.users.generateCallUIList()
                });

              case 8:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee4);
      }))();
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
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return config.deviceManager.mediaStreams.stopAudioInput();

              case 2:
                _context6.next = 4;
                return config.deviceManager.mediaStreams.stopVideoInput();

              case 4:
                _context6.next = 6;
                return config.deviceManager.mediaStreams.stopScreenShareInput();

              case 6:
                return _context6.abrupt("return", callStop());

              case 7:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee5);
      }))();
    }
  };
  setTimeout(function () {
    startCallWebRTCFunctions(config.callConfig);
  }, 50);
  return publicized;
}

function ScreenShareStateManager() {
  var config = {
    ownerId: 0,
    imOwner: false,
    isStarted: false,
    width: _sharedData.sharedVariables.callVideoMinWidth,
    height: _sharedData.sharedVariables.callVideoMinHeight
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
      return config.ownerId === _store.store.user().id;
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
        config.screenShareInfo.setHeight(_sharedData.sharedVariables.callVideoMinHeight);
        config.screenShareInfo.setWidth(_sharedData.sharedVariables.callVideoMinWidth);
      }
    }
  };
}