"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectDestructuringEmpty2 = _interopRequireDefault(require("@babel/runtime/helpers/objectDestructuringEmpty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _constants = require("./lib/constants");

var _utility = _interopRequireDefault(require("./utility/utility"));

var _errorHandler = require("./lib/errorHandler");

var _callsList = _interopRequireDefault(require("./lib/call/callsList"));

var _deviceManager = require("./lib/call/deviceManager2");

var _call = _interopRequireDefault(require("./lib/call/call"));

var _callServerManager = _interopRequireDefault(require("./lib/call/callServerManager"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function ChatCall(app, params) {
  var _app$sdkParams$callOp, _app$sdkParams$callOp2;

  app.call = new _call["default"](app);
  app.callsManager = new _callsList["default"](app);
  var callServerController = new _callServerManager["default"](app);
  var //Utility = params.Utility,
  currentModuleInstance = this,
      //app.chatEvents = params.app.chatEvents,
  callRequestController = {
    imCallOwner: false,
    callRequestReceived: false,
    callEstablishedInMySide: false,
    callRequestTimeout: null,
    iRequestedCall: false,
    iAcceptedCall: false,
    canProcessStartCall: function canProcessStartCall(callId) {
      app.sdkParams.consoleLogging && console.log("[SDK] canProcessStartCall:", {
        callId: callId
      }, {
        acceptedCallId: app.call.sharedVariables.acceptedCallId
      }, callRequestController.iAcceptedCall, callRequestController.iAcceptedCall && app.call.sharedVariables.acceptedCallId == callId);
      if (callRequestController.iAcceptedCall && app.call.sharedVariables.acceptedCallId == callId || callRequestController.iRequestedCall && app.call.sharedVariables.requestedCallId == callId) return true;
      return false;
    }
  },
      // generalTypeCode = params.typeCode,
  currentCallParams = {},
      latestCallRequestId = null,
      screenShareInfo = new screenShareStateManager(app),
      //shouldReconnectCallTimeout = null,
  screenShareState = {
    started: false,
    imOwner: false
  },
      callUsers = {},
      //callServerManager(),
  //callTopicHealthChecker = new peersHealthChecker(),
  //messageTtl = params.messageTtl || 10000,
  callOptions = app.sdkParams.callOptions,
      config = {
    getHistoryCount: 25
  };
  app.call.sharedVariables.useInternalTurnAddress = !!(callOptions && callOptions.useInternalTurnAddress);
  app.call.sharedVariables.globalCallRequestTimeout = app.sdkParams.callRequestTimeout;
  app.call.sharedVariables.callTurnIp = callOptions && callOptions.hasOwnProperty('callTurnIp') && typeof callOptions.callTurnIp === 'string' ? callOptions.callTurnIp : '46.32.6.188';
  app.call.sharedVariables.callDivId = callOptions && callOptions.hasOwnProperty('callDivId') && typeof callOptions.callDivId === 'string' ? callOptions.callDivId : 'call-div';
  app.call.sharedVariables.callAudioTagClassName = callOptions && callOptions.hasOwnProperty('callAudioTagClassName') && typeof callOptions.callAudioTagClassName === 'string' ? callOptions.callAudioTagClassName : '';
  app.call.sharedVariables.callVideoTagClassName = callOptions && callOptions.hasOwnProperty('callVideoTagClassName') && typeof callOptions.callVideoTagClassName === 'string' ? callOptions.callVideoTagClassName : '';
  app.call.sharedVariables.callVideoMinWidth = callOptions && callOptions.hasOwnProperty('callVideo') && (0, _typeof2["default"])(callOptions.callVideo) === 'object' && callOptions.callVideo.hasOwnProperty('minWidth') ? callOptions.callVideo.minWidth : 320;
  app.call.sharedVariables.callVideoMinHeight = callOptions && callOptions.hasOwnProperty('callVideo') && (0, _typeof2["default"])(callOptions.callVideo) === 'object' && callOptions.callVideo.hasOwnProperty('minHeight') ? callOptions.callVideo.minHeight : 180;
  app.call.sharedVariables.callNoAnswerTimeout = ((_app$sdkParams$callOp = app.sdkParams.callOptions) === null || _app$sdkParams$callOp === void 0 ? void 0 : _app$sdkParams$callOp.callNoAnswerTimeout) || 0;
  app.call.sharedVariables.callStreamCloseTimeout = ((_app$sdkParams$callOp2 = app.sdkParams.callOptions) === null || _app$sdkParams$callOp2 === void 0 ? void 0 : _app$sdkParams$callOp2.streamCloseTimeout) || 10000;

  function screenShareStateManager(app) {
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
          screenShareInfo.setHeight(dimension.height);
          screenShareInfo.setWidth(dimension.width);
        } else {
          screenShareInfo.setHeight(app.call.sharedVariables.callVideoMinHeight);
          screenShareInfo.setWidth(app.call.sharedVariables.callVideoMinWidth);
        }
      }
    };
  }

  function callServerManager() {
    var config = {
      servers: [],
      currentServerIndex: 0
    };
    return {
      setServers: function setServers(serversList) {
        config.servers = serversList;
        config.currentServerIndex = 0;
      },
      getCurrentServer: function getCurrentServer() {
        return config.servers[0]; //config.currentServerIndex];
      },
      isJanus: function isJanus() {
        return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
      },
      canChangeServer: function canChangeServer() {
        return config.currentServerIndex < config.servers.length - 1;
      },
      changeServer: function changeServer() {
        if (this.canChangeServer()) {
          app.sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
          config.currentServerIndex++;
        }
      }
    };
  }

  var init = function init() {},
      raiseCallError = function raiseCallError(errorObject, callBack, fireEvent) {
    app.errorHandler.raiseError(errorObject, callBack, fireEvent, {
      eventName: 'callEvents',
      eventType: 'CALL_ERROR',
      environmentDetails: getSDKCallDetails()
    });
  },
      sendCallMessage = function sendCallMessage(message, callback, _ref) {
    var _ref$timeoutTime = _ref.timeoutTime,
        timeoutTime = _ref$timeoutTime === void 0 ? 0 : _ref$timeoutTime,
        _ref$timeoutRetriesCo = _ref.timeoutRetriesCount,
        timeoutRetriesCount = _ref$timeoutRetriesCo === void 0 ? 0 : _ref$timeoutRetriesCo;
    message.token = app.sdkParams.token;
    var uniqueId;

    if (!message.uniqueId) {
      message.uniqueId = _utility["default"].generateUUID();
    } // message.uniqueId = uniqueId;


    message.chatId = app.callsManager.currentCallId;
    var data = {
      type: 3,
      content: {
        peerName: callServerController.getCurrentServer(),
        // callServerName,
        priority: 1,
        content: JSON.stringify(message),
        ttl: app.sdkParams.messageTtl
      }
    };

    if (typeof callback == 'function') {
      app.store.messagesCallbacks[message.uniqueId] = callback;
    }

    app.call.sharedVariables.asyncClient.send(data, function (res) {
      if (!res.hasError && callback) {// if (typeof callback == 'function') {
        //     callback(res);
        // }
        // if (app.store.messagesCallbacks[uniqueId]) {
        //     delete app.store.messagesCallbacks[uniqueId];
        // }
      }
    });

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
        /*  if (app.store.messagesCallbacks[uniqueId]) {
              delete app.store.messagesCallbacks[uniqueId];
          }*/

      }, timeoutTime || app.call.sharedVariables.globalCallRequestTimeout);
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
  formatDataToMakeCallParticipant = function formatDataToMakeCallParticipant(messageContent) {
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
    }; // Add Chat Participant if exist

    if (messageContent.participantVO) {
      participant.participantVO = messageContent.participantVO;
    } // Add Call Session if exist


    if (messageContent.callSession) {
      participant.callSession = messageContent.callSession;
    } // return participant;


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
  formatDataToMakeCallMessage = function formatDataToMakeCallMessage(threadId, pushMessageVO) {
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
    }; // return pinMessage;

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
  reformatCallParticipants = function reformatCallParticipants(participantsContent) {
    var returnData = [];

    for (var i = 0; i < participantsContent.length; i++) {
      returnData.push(formatDataToMakeCallParticipant(participantsContent[i]));
    }

    return returnData;
  },
      callReceived = function callReceived(params, callback) {
    var receiveCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECEIVE_CALL_REQUEST,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        receiveCallData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        /* app.chatEvents.fireEvent('error', {
            code: 999,
            message: 'Invalid call id!'
        }); */

        return;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to ReceiveCall()'
      });
      return;
    }

    return app.messenger.sendMessage(receiveCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      sendCallMetaData = function sendCallMetaData(params) {
    var message = {
      id: params.id,
      userid: params.userid,
      content: params.content || undefined
    };
    sendCallMessage({
      id: 'SENDMETADATA',
      message: JSON.stringify(message),
      chatId: app.callsManager.currentCallId
    }, null, {});
  },
      getSDKCallDetails = function getSDKCallDetails(customData) {
    return {
      currentUser: app.store.user.get(),
      currentServers: {
        callTurnIp: app.call.sharedVariables.callTurnIp
      },
      isJanus: app.callsManager.currentCallId && callServerController.isJanus(),
      screenShareInfo: {
        isStarted: screenShareInfo.isStarted(),
        iAmOwner: screenShareInfo.iAmOwner()
      },
      callId: app.callsManager.currentCallId,
      startCallInfo: currentCallParams,
      customData: customData
    };
  };

  this.callMessageHandler = function (callMessage) {
    var jsonMessage = typeof callMessage.content === 'string' && _utility["default"].isValidJson(callMessage.content) ? JSON.parse(callMessage.content) : callMessage.content;

    if (jsonMessage.chatId) {
      app.callsManager.routeCallMessage(jsonMessage.chatId, jsonMessage);
    } else {
      app.sdkParams.consoleLogging && console.warn("[SDK] Skipping call message, no chatId is available. ", {
        jsonMessage: jsonMessage
      });
    }
  };

  this.asyncInitialized = function (async) {
    app.call.sharedVariables.asyncClient = async;
    app.call.sharedVariables.asyncClient.on('asyncReady', function () {
      // callStateController.maybeReconnectAllTopics();
      if (app.callsManager.currentCallId) {
        app.callsManager.get(app.callsManager.currentCallId).onChatConnectionReconnect();
      }
    });
  };
  /**
   * Do not process the message if is not for current call
   *
   * @param type
   * @param threadId
   * @return {boolean}
   */


  function shouldNotProcessChatMessage(type, threadId) {
    var restrictedMessageTypes = [_constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.CALL_PARTICIPANT_JOINED, _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT, _constants.chatMessageVOTypes.RECONNECT, _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL, _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL, _constants.chatMessageVOTypes.DESTINED_RECORD_CALL, _constants.chatMessageVOTypes.RECORD_CALL, _constants.chatMessageVOTypes.RECORD_CALL_STARTED, _constants.chatMessageVOTypes.END_RECORD_CALL, _constants.chatMessageVOTypes.TERMINATE_CALL, _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE, _constants.chatMessageVOTypes.CALL_RECORDING_FAILED // chatMessageVOTypes.END_CALL
    ];

    if (!app.call.callStopQueue.callStarted && restrictedMessageTypes.includes(type)) {
      return true;
    } else {
      return false;
    }
  }

  this.handleChatMessages = function (type, messageContent, contentCount, threadId, uniqueId) {
    app.sdkParams.consoleLogging && console.debug("[SDK][CALL_MODULE][handleChatMessages]", "type:", type, "threadId:", threadId, "currentCallId:", app.callsManager.currentCallId, "latestCallRequestId:", latestCallRequestId, "shouldNotProcessChatMessage:", shouldNotProcessChatMessage(type, threadId));

    if (shouldNotProcessChatMessage(type, threadId)) {
      return;
    }

    switch (type) {
      /**
       * Type 70    Send Call Request
       */
      case _constants.chatMessageVOTypes.CALL_REQUEST:
        // callRequestController.callRequestReceived = true;
        callReceived({
          callId: messageContent.callId
        }, function (r) {});

        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.threadId = threadId;
        app.chatEvents.fireEvent('callEvents', {
          type: 'RECEIVE_CALL',
          result: messageContent
        });

        if (messageContent.callId > 0) {
          // if(!currentCallId ) {
          latestCallRequestId = messageContent.callId; // }
        } else {
          app.chatEvents.fireEvent('callEvents', {
            type: 'PARTNER_RECEIVED_YOUR_CALL',
            result: messageContent
          });
        }

        break;

      /**
       * Type 71    Accept Call Request
       */

      case _constants.chatMessageVOTypes.ACCEPT_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'ACCEPT_CALL',
          result: messageContent
        });
        break;

      /**
       * Type 72    Reject Call Request
       */

      case _constants.chatMessageVOTypes.REJECT_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.callId = threadId;
        app.chatEvents.fireEvent('callEvents', {
          type: 'REJECT_CALL',
          result: messageContent
        });
        break;

      /**
       * Type 73    Receive Call Request
       */

      case _constants.chatMessageVOTypes.RECEIVE_CALL_REQUEST:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (messageContent.callId > 0) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'RECEIVE_CALL',
            result: messageContent
          }); // if(!currentCallId ) {

          latestCallRequestId = messageContent.callId; // }
        } else if (callRequestController.iRequestedCall) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'PARTNER_RECEIVED_YOUR_CALL',
            result: messageContent
          });
        }

        break;

      /**
       * Type 74    Start Call (Start sender and receivers)
       */

      case _constants.chatMessageVOTypes.START_CALL:
        if (!callRequestController.canProcessStartCall(threadId)) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_STARTED_ELSEWHERE',
            message: 'Call already started somewhere else..., aborting...'
          });
          return;
        }

        callRequestController.iRequestedCall = false;
        callRequestController.iAcceptedCall = false;
        app.callsManager.currentCallId = threadId;
        processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId); // if(callsManager().currentCallId) {
        //     endCall({callId: callsManager().currentCallId});
        //     // callStop( true, false);
        //     setTimeout(()=>{
        //         callsManager().currentCallId = threadId;
        //         processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId);
        //     }, 5000);
        // } else {
        //     callsManager().currentCallId = threadId;
        //     processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId);
        // }

        break;

      /**
       * Type 75    End Call Request
       */

      case _constants.chatMessageVOTypes.END_CALL_REQUEST:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'END_CALL',
          result: messageContent
        });
        app.callsManager.removeItem(threadId); // callStop();

        break;

      /**
       * Type 76   Call Ended
       */

      case _constants.chatMessageVOTypes.END_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_ENDED',
          callId: threadId
        });

        if (threadId === app.callsManager.currentCallId && app.call.callStopQueue.callStarted) {
          app.callsManager.removeItem(threadId); // callStop();
        }

        break;

      /**
       * Type 77    Get Calls History
       */

      case _constants.chatMessageVOTypes.GET_CALLS:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 78    Call Partner Reconnecting
       */

      case _constants.chatMessageVOTypes.RECONNECT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.uniqueId = uniqueId;
        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_RECONNECTING',
          result: messageContent
        });
        break;

      /**
       * Type 79    Call Partner Connects
       */

      case _constants.chatMessageVOTypes.CONNECT:
        if (!app.callsManager.currentCallId) return;

        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_CONNECTED',
          result: messageContent
        });

        if (callUsers && callUsers[app.store.user.get().id] && callUsers[app.store.user().id].video) {
          app.call.currentCall().users().get(app.store.user.get().id).videoTopicManager().restartMediaOnKeyFrame(app.store.user.get().id, [2000, 4000, 8000, 12000]);
        } // if(callUsers && callUsers['screenShare']
        //     && screenShareInfo.isStarted()
        //     && screenShareInfo.iAmOwner()
        // ) {
        //     currentCall().users().get(store.user().id).videoTopicManager().restartMediaOnKeyFrame('screenShare', [2000,4000,8000,12000]);
        // }


        break;

      /**
       * Type 90    Contacts Synced
       */

      case _constants.chatMessageVOTypes.CONTACT_SYNCED:
        app.chatEvents.fireEvent('contactEvents', {
          type: 'CONTACTS_SYNCED',
          result: messageContent
        });
        break;

      /**
       * Type 91    Send Group Call Request
       */

      case _constants.chatMessageVOTypes.GROUP_CALL_REQUEST:
        // callRequestController.callRequestReceived = true;
        callReceived({
          callId: messageContent.callId
        }, function (r) {});

        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (messageContent.callId > 0) {
          // if(!currentCallId ) {
          latestCallRequestId = messageContent.callId; // }
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'RECEIVE_CALL',
          result: messageContent
        }); //currentCallId = messageContent.callId;

        break;

      /**
       * Type 92    Call Partner Leave
       * 1. I have left the call (GroupCall)
       * 2. Other person has left the call (GroupCall)
       */

      case _constants.chatMessageVOTypes.LEAVE_CALL:
        if (app.callsManager.currentCallId != threadId) return;
        app.callsManager.get(threadId).handleParticipantLeft(messageContent, threadId);
        break;

      /**
       * Type 93    Add Call Participant
       */

      case _constants.chatMessageVOTypes.ADD_CALL_PARTICIPANT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 94    Call Participant Joined
       */

      case _constants.chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
        if (app.callsManager.currentCallId != threadId) return;
        app.callsManager.get(threadId).handleParticipantJoin(messageContent);
        break;

      /**
       * Type 95    Remove Call Participant
       */

      case _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_PARTICIPANT_REMOVED',
          result: messageContent
        });
        break;

      /**
       * Type 96    Terminate Call
       */

      case _constants.chatMessageVOTypes.TERMINATE_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'TERMINATE_CALL',
          result: messageContent
        });

        if (threadId === app.callsManager.currentCallId) {
          app.callsManager.removeItem(threadId);
        }

        break;

      /**
       * Type 97    Mute Call Participant
       */

      case _constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (!app.callsManager.currentCallId) return;
        app.callsManager.get(threadId).handleParticipantMute(messageContent);
        break;

      /**
       * Type 98    UnMute Call Participant
       */

      case _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.callsManager.get(threadId).handleParticipantUnMute(messageContent);
        break;

      /**
       * Type 99   Partner rejected call
       */

      case _constants.chatMessageVOTypes.CANCEL_GROUP_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        messageContent.callId = threadId;
        app.chatEvents.fireEvent('callEvents', {
          type: 'REJECT_GROUP_CALL',
          result: messageContent
        });
        break;

      /**
       * Type 110    Active Call Participants List
       */

      case _constants.chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 111    Kafka Call Session Created
       */

      case _constants.chatMessageVOTypes.CALL_SESSION_CREATED:
        // if(!callRequestController.callEstablishedInMySide)
        //     return;
        if (callRequestController.iRequestedCall) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'CALL_SESSION_CREATED',
            result: messageContent
          }); // if(!requestedCallId) {

          app.call.sharedVariables.requestedCallId = messageContent.callId;
        } // }


        break;

      /**
       * Type 113    Turn On Video Call
       */

      case _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (!app.callsManager.currentCallId) return;
        app.callsManager.get(threadId).handleParticipantVideoOn(messageContent);
        break;

      /**
       * Type 114    Turn Off Video Call
       */

      case _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (!app.callsManager.currentCallId) return;
        app.callsManager.get(threadId).handleParticipantVideoOff(messageContent);
        break;

      /**
       * Type 121    Record Call Request
       */

      case _constants.chatMessageVOTypes.RECORD_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (!app.call.currentCall()) {
          return;
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'START_RECORDING_CALL',
          result: messageContent
        });
        if (app.call.currentCall().users().get("screenShare")) app.call.currentCall().users().get("screenShare").videoTopicManager().restartMediaOnKeyFrame("screenShare", [4000, 8000, 12000, 25000]);
        break;

      /**
       * Type 122   End Record Call Request
       */

      case _constants.chatMessageVOTypes.END_RECORD_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'STOP_RECORDING_CALL',
          result: messageContent
        });
        break;

      /**
       * Type 123   Start Screen Share
       */

      case _constants.chatMessageVOTypes.START_SCREEN_SHARE:
        if (!app.call.currentCall()) return;
        app.call.currentCall().handleStartScreenShare(messageContent);

        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 124   End Screen Share
       */

      case _constants.chatMessageVOTypes.END_SCREEN_SHARE:
        // screenShareInfo.setIAmOwner(false);
        if (app.callsManager.currentCallId) app.callsManager.get(threadId).handleEndScreenShare(messageContent);
        break;

      /**
       * Type 125   Delete From Call List
       */

      case _constants.chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'DELETE_FROM_CALL_LIST',
          result: messageContent
        });
        break;

      /**
       * Type 126   Destinated Record Call Request
       */

      case _constants.chatMessageVOTypes.DESTINED_RECORD_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (!app.call.currentCall()) return;
        app.chatEvents.fireEvent('callEvents', {
          type: 'START_RECORDING_CALL',
          result: messageContent
        });
        app.call.currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame(app.store.user.get().id, [4000, 8000, 12000, 25000]);
        app.call.currentCallMyUser().videoTopicManager().restartMediaOnKeyFrame("screenShare", [4000, 8000, 12000, 25000]);
        break;

      /**
       * Type 129   Get Calls To Join
       */

      case _constants.chatMessageVOTypes.GET_CALLS_TO_JOIN:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
      * Type 221  Event to tell us p2p call converted to a group call
      */

      case _constants.chatMessageVOTypes.SWITCH_TO_GROUP_CALL_REQUEST:
        app.chatEvents.fireEvent('callEvents', {
          type: 'SWITCH_TO_GROUP_CALL',
          result: messageContent //contains: isGroup, callId, threadId

        });
        break;

      /**
       * Type 222    Call Recording Started
       */

      case _constants.chatMessageVOTypes.RECORD_CALL_STARTED:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_RECORDING_STARTED',
          result: messageContent
        });
        break;

      /**
       * Type 225    CALL STICKER SYSTEM MESSAGE
       */

      case _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_STICKER',
          result: messageContent
        });
        break;

      /**
       * Type 227    RECALL_THREAD_PARTICIPANT
       */

      case _constants.chatMessageVOTypes.RECALL_THREAD_PARTICIPANT:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
      * Type 228   INQUIRY_CALL
      */

      case _constants.chatMessageVOTypes.INQUIRY_CALL:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 230    CALL_RECORDING_FAILED
       */

      case _constants.chatMessageVOTypes.CALL_RECORDING_FAILED:
        if (app.store.messagesCallbacks[uniqueId]) {
          app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        app.chatEvents.fireEvent('callEvents', {
          type: 'CALL_RECORDING_FAILED',
          result: messageContent
        });
        break;
    }
  };

  function processChatStartCallEvent(type, messageContent, contentCount, threadId, uniqueId) {
    if (app.store.messagesCallbacks[uniqueId]) {
      app.store.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
    }

    app.call.callStopQueue.callStarted = true;
    messageContent.callId = threadId;
    app.chatEvents.fireEvent('callEvents', {
      type: 'CALL_STARTED',
      result: messageContent
    });

    if ((0, _typeof2["default"])(messageContent) === 'object' && messageContent.hasOwnProperty('chatDataDto') && !!messageContent.chatDataDto.kurentoAddress) {
      var options = {
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
        recordingOwner: +messageContent.chatDataDto.recordingUser,
        kurentoAddress: messageContent.chatDataDto.kurentoAddress.split(','),
        cameraPaused: app.call.joinCallParams.cameraPaused
      };
      app.callsManager.addItem(threadId, options);
    } else {
      app.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        message: 'Chat Data DTO is not present!',
        environmentDetails: getSDKCallDetails()
      });
    }
  }

  this.startCall = /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(params, callback) {
      var startCallData, content, i, tempInvitee;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              startCallData = {
                chatMessageVOType: _constants.chatMessageVOTypes.CALL_REQUEST,
                typeCode: app.sdkParams.generalTypeCode,
                //params.typeCode,
                pushMsgType: 3,
                token: app.sdkParams.token
              }, content = {
                creatorClientDto: {}
              };

              if (!params) {
                _context.next = 21;
                break;
              }

              if (typeof params.type === 'string' && app.call.callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = app.call.callTypes[params.type.toUpperCase()];
              } else {
                content.type = 0x0; // Defaults to AUDIO Call
              }

              content.creatorClientDto.mute = params.mute && typeof params.mute === 'boolean' ? params.mute : false;
              content.mute = params.mute && typeof params.mute === 'boolean' ? params.mute : false;

              if (params.clientType && typeof params.clientType === 'string' && app.call.callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = app.call.callClientType[params.clientType.toUpperCase()];
              } else {
                content.creatorClientDto.clientType = app.call.callClientType.WEB;
              }

              if (!(typeof +params.threadId === 'number' && +params.threadId > 0)) {
                _context.next = 10;
                break;
              }

              content.threadId = +params.threadId;
              _context.next = 17;
              break;

            case 10:
              if (!(Array.isArray(params.invitees) && params.invitees.length)) {
                _context.next = 15;
                break;
              }

              content.invitees = []; //params.invitees;

              for (i = 0; i < params.invitees.length; i++) {
                tempInvitee = params.invitees[i];

                if (tempInvitee && typeof tempInvitee.idType === "string") {
                  tempInvitee.idType = _constants.inviteeVOidTypes[tempInvitee.idType];
                  content.invitees.push(tempInvitee);
                }
              }

              _context.next = 17;
              break;

            case 15:
              app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
              });
              return _context.abrupt("return");

            case 17:
              if (params.threadInfo && (params.threadInfo.metadata || params.threadInfo.uniqueName)) {
                content.createCallThreadRequest = params.threadInfo;
              }

              startCallData.content = JSON.stringify(content);
              _context.next = 23;
              break;

            case 21:
              app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
              });
              return _context.abrupt("return");

            case 23:
              app.call.joinCallParams.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : false;
              callRequestController.iRequestedCall = true;
              if (!app.call.sharedVariables.deviceManager) app.call.sharedVariables.deviceManager = new _deviceManager.DeviceManager(app);
              app.call.sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
                video: params.type == 'video',
                audio: !params.mute,
                closeStream: true
              }, function (result) {
                if (result.hasError) {
                  callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage
                  });
                  return;
                }

                if (app.call.sharedVariables.callNoAnswerTimeout) {
                  callRequestController.callRequestTimeout = setTimeout(function (metaData) {
                    //Reject the call if participant didn't answer
                    if (!app.call.callStopQueue.callStarted) {
                      app.chatEvents.fireEvent("callEvents", {
                        type: "CALL_NO_ANSWER_TIMEOUT",
                        message: "[CALL_SESSION_CREATED] Call request timed out, No answer"
                      });
                      metaData.callInstance.rejectCall({
                        callId: metaData.currentCallId
                      });
                    }
                  }, app.call.sharedVariables.callNoAnswerTimeout, {
                    callInstance: currentModuleInstance,
                    currentCallId: app.callsManager.currentCallId
                  });
                }

                app.callsManager.destroyAllCalls();
                app.messenger.sendMessage(startCallData, {
                  onResult: function onResult(result) {
                    callback && callback(result);
                  }
                });
              });

            case 27:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  this.startGroupCall = /*#__PURE__*/function () {
    var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(params, callback) {
      var startCallData, content, i, tempInvitee;
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              startCallData = {
                chatMessageVOType: _constants.chatMessageVOTypes.GROUP_CALL_REQUEST,
                typeCode: app.sdkParams.generalTypeCode,
                //params.typeCode,
                pushMsgType: 3,
                token: app.sdkParams.token
              }, content = {
                creatorClientDto: {}
              };

              if (!params) {
                _context2.next = 20;
                break;
              }

              if (typeof params.type === 'string' && app.call.callTypes.hasOwnProperty(params.type.toUpperCase())) {
                content.type = app.call.callTypes[params.type.toUpperCase()];
              } else {
                content.type = 0x0; // Defaults to AUDIO Call
              }

              content.creatorClientDto.mute = typeof params.mute === 'boolean' ? params.mute : false;

              if (params.clientType && typeof params.clientType === 'string' && app.call.callClientType[params.clientType.toUpperCase()] > 0) {
                content.creatorClientDto.clientType = app.call.callClientType[params.clientType.toUpperCase()];
              } else {
                content.creatorClientDto.clientType = app.call.callClientType.WEB;
              }

              if (!(typeof +params.threadId === 'number' && params.threadId > 0)) {
                _context2.next = 9;
                break;
              }

              content.threadId = +params.threadId;
              _context2.next = 16;
              break;

            case 9:
              if (!Array.isArray(params.invitees)) {
                _context2.next = 14;
                break;
              }

              content.invitees = [];

              for (i = 0; i < params.invitees.length; i++) {
                tempInvitee = params.invitees[i];

                if (tempInvitee && typeof tempInvitee.idType === "string") {
                  tempInvitee.idType = _constants.inviteeVOidTypes[tempInvitee.idType];
                  content.invitees.push(tempInvitee);
                }
              }

              _context2.next = 16;
              break;

            case 14:
              app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'Invitees list is empty! Send an array of invitees to start a call with, Or send a Thread Id to start a call with current participants'
              });
              return _context2.abrupt("return");

            case 16:
              if (params.threadInfo && (params.threadInfo.title || params.threadInfo.description || params.threadInfo.metadata || params.threadInfo.uniqueName)) {
                content.createCallThreadRequest = params.threadInfo;
              }

              startCallData.content = JSON.stringify(content);
              _context2.next = 22;
              break;

            case 20:
              app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to start call!'
              });
              return _context2.abrupt("return");

            case 22:
              app.call.joinCallParams.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : false;
              callRequestController.iRequestedCall = true;
              if (!app.call.sharedVariables.deviceManager) app.call.sharedVariables.deviceManager = new _deviceManager.DeviceManager(app);
              app.call.sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
                video: params.type == 'video',
                audio: !params.mute,
                closeStream: true
              }, function (result) {
                if (result.hasError) {
                  callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage
                  });
                  return;
                }

                if (app.call.sharedVariables.callNoAnswerTimeout) {
                  callRequestController.callRequestTimeout = setTimeout(function (metaData) {
                    //Reject the call if participant didn't answer
                    if (!app.call.callStopQueue.callStarted) {
                      app.chatEvents.fireEvent("callEvents", {
                        type: "CALL_NO_ANSWER_TIMEOUT",
                        message: "[CALL_SESSION_CREATED] Call request timed out, No answer"
                      });
                      metaData.callInstance.rejectCall({
                        callId: metaData.currentCallId
                      });
                    }
                  }, app.call.sharedVariables.callNoAnswerTimeout, {
                    callInstance: currentModuleInstance,
                    currentCallId: app.callsManager.currentCallId
                  });
                }

                app.messenger.sendMessage(startCallData, {
                  onResult: function onResult(result) {
                    callback && callback(result);
                  }
                });
              });

            case 26:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x3, _x4) {
      return _ref3.apply(this, arguments);
    };
  }();

  this.sendCallMetaData = function (params) {
    sendCallMetaData({
      id: _constants.callMetaDataTypes.CUSTOMUSERMETADATA,
      userid: app.store.user.get().id,
      content: params.content
    });
  };

  this.callReceived = callReceived;

  this.terminateCall = function (params, callback) {
    var terminateCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TERMINATE_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token
    },
        content = {};

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        terminateCallData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }

      terminateCallData.content = JSON.stringify(content);
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to terminate the call!'
      });
      return;
    }

    return app.messenger.sendMessage(terminateCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.acceptCall = /*#__PURE__*/function () {
    var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(params, callback) {
      var acceptCallData, content;
      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              acceptCallData = {
                chatMessageVOType: _constants.chatMessageVOTypes.ACCEPT_CALL,
                typeCode: app.sdkParams.generalTypeCode,
                //params.typeCode,
                pushMsgType: 3,
                token: app.sdkParams.token
              }, content = {};

              if (!params) {
                _context3.next = 16;
                break;
              }

              if (!(typeof +params.callId === 'number' && params.callId > 0)) {
                _context3.next = 6;
                break;
              }

              acceptCallData.subjectId = +params.callId;
              _context3.next = 8;
              break;

            case 6:
              app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
              return _context3.abrupt("return");

            case 8:
              content.mute = typeof params.mute === 'boolean' ? params.mute : false;
              content.video = typeof params.video === 'boolean' ? params.video : false;
              content.videoCall = content.video;
              app.call.joinCallParams.cameraPaused = typeof params.cameraPaused === 'boolean' ? params.cameraPaused : callRequestController.cameraPaused;

              if (params.clientType && typeof params.clientType === 'string' && app.call.callClientType[params.clientType.toUpperCase()] > 0) {
                content.clientType = app.call.callClientType[params.clientType.toUpperCase()];
              } else {
                content.clientType = app.call.callClientType.WEB;
              }

              acceptCallData.content = JSON.stringify(content);
              _context3.next = 18;
              break;

            case 16:
              app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to accept the call!'
              });
              return _context3.abrupt("return");

            case 18:
              app.call.sharedVariables.acceptedCallId = parseInt(params.callId);
              callRequestController.iAcceptedCall = true;
              if (!app.call.sharedVariables.deviceManager) app.call.sharedVariables.deviceManager = new _deviceManager.DeviceManager(app);
              app.call.sharedVariables.deviceManager.grantUserMediaDevicesPermissions({
                video: params.video,
                audio: !params.mute,
                closeStream: true
              }, function (result) {
                if (result.hasError) {
                  callback && callback({
                    hasError: true,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage
                  });
                  return;
                }

                app.messenger.sendMessage(acceptCallData, {
                  onResult: function onResult(result) {
                    callback && callback(result);
                  }
                });
              });

            case 22:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function (_x5, _x6) {
      return _ref4.apply(this, arguments);
    };
  }();

  this.rejectCall = this.cancelCall = function (params, callback) {
    var rejectCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REJECT_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        rejectCallData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to reject the call!'
      });
      return;
    }

    return app.messenger.sendMessage(rejectCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.endCall = app.call.endCall;

  this.startRecordingCall = function (params, callback) {
    var recordCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECORD_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token,
      content: {}
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        recordCallData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }

      if (params.destinated === true) {
        recordCallData.chatMessageVOType = _constants.chatMessageVOTypes.DESTINED_RECORD_CALL;
        recordCallData.content.recordType = typeof +params.recordType === 'number' ? params.recordType : 1;
        recordCallData.content.tags = Array.isArray(params.tags) ? params.tags : null;
        recordCallData.content.threadId = typeof +params.threadId === 'number' ? params.threadId : null;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Record call!'
      });
      return;
    }

    return app.messenger.sendMessage(recordCallData, {
      onResult: function onResult(result) {
        if (app.call.currentCall().users().get(app.store.user.get().id) && app.call.currentCall().users().get(app.store.user.get().id).videoTopicManager()) app.call.currentCall().users().get(app.store.user.get().id).videoTopicManager().restartMediaOnKeyFrame(app.store.user.get().id, [100]);
        callback && callback(result);
      }
    });
  };

  this.stopRecordingCall = function (params, callback) {
    var stopRecordingCallData = {
      chatMessageVOType: _constants.chatMessageVOTypes.END_RECORD_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        stopRecordingCallData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Stop Recording the call!'
      });
      return;
    }

    return app.messenger.sendMessage(stopRecordingCallData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.startScreenShare = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.START_SCREEN_SHARE,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      subjectId: app.callsManager.currentCallId,
      token: app.sdkParams.token
    };

    if (!sendData.subjectId) {
      raiseCallError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }

    if (screenShareInfo.isStarted()) {
      raiseCallError(_errorHandler.errorList.SCREENSHARE_ALREADY_STARTED, callback, true);
      return;
    }

    if (params.quality) {
      app.call.sharedVariables.startScreenSharetParams.quality = params.quality;
    }

    app.call.currentCall().deviceManager().grantScreenSharePermission({
      video: params.video,
      audio: !params.mute,
      closeStream: false
    }, function (result) {
      if (result.hasError) {
        callback && callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
        return;
      }

      return app.messenger.sendMessage(sendData, function (result) {
        callback && callback(result);
      });
    });
  };

  this.endScreenShare = app.call.endScreenShare;

  this.resizeScreenShare = function (params, callback) {
    var cCall = app.callsManager.get(app.callsManager.currentCallId);
    var result = {};

    if (!cCall) {
      result.hasError = false;
      callback && callback(result);
      return;
    }

    if (cCall.screenShareInfo.isStarted() && cCall.screenShareInfo.iAmOwner()) {
      var qualityObj = app.call.calculateScreenSize({
        quality: params.quality
      });
      screenShareInfo.setWidth(qualityObj.width);
      screenShareInfo.setHeight(qualityObj.height); // applyScreenShareSizeToElement()

      cCall.users().get("screenShare").videoTopicManager().restartMediaOnKeyFrame('screenShare', [10, 1000, 2000]);
      cCall.sendCallMetaData({
        id: _constants.callMetaDataTypes.SCREENSHAREMETADATA,
        userid: app.store.user.get().id,
        content: {
          dimension: {
            width: cCall.screenShareInfo.getWidth(),
            height: cCall.screenShareInfo.getHeight()
          }
        }
      });
      result.hasError = false;
    } else {
      result.hasError = true;
      result.errorMessage = 'You can not apply size to others ScreenShare or ScreenShare is not started';
    }

    callback && callback(result);
  };

  this.getCallsList = function (params, callback) {
    var getCallListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_CALLS,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token
    },
        content = {};

    if (params) {
      if (typeof params.count === 'number' && params.count >= 0) {
        content.count = +params.count;
      } else {
        content.count = 25;
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

      if (typeof params.type === 'string' && app.call.callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = app.call.callTypes[params.type.toUpperCase()];
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
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to End the call!'
      });
      return;
    }

    return app.messenger.sendMessage(getCallListData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.getCallsToJoin = function (params, callback) {
    var getCallListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_CALLS_TO_JOIN,
      pushMsgType: 3,
      token: app.sdkParams.token
    },
        content = {};

    if (params) {
      if (typeof params.count === 'number' && params.count >= 0) {
        content.count = +params.count;
      } else {
        content.count = 25;
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

      if (typeof params.type === 'string' && app.call.callTypes.hasOwnProperty(params.type.toUpperCase())) {
        content.type = app.call.callTypes[params.type.toUpperCase()];
      }

      if (Array.isArray(params.threadIds)) {
        content.threadIds = params.threadIds;
      }

      if (typeof params.uniqueId === 'string') {
        content.uniqueId = params.uniqueId;
      }

      getCallListData.content = JSON.stringify(content);
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Invalid params'
      });
      return;
    }

    return app.messenger.sendMessage(getCallListData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.deleteFromCallList = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_FROM_CALL_HISTORY,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (typeof params.contactType === 'string' && params.contactType.length) {
        sendData.content.contactType = params.contactType;
      } else {
        app.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should enter a contactType!'
        });
        return;
      }

      if (Array.isArray(params.callIds)) {
        sendData.content = params.callIds;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Delete a call from Call History!'
      });
      return;
    }

    return app.messenger.sendMessage(sendData, {
      onResult: function onResult(result) {
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
      chatMessageVOType: _constants.chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {}
    };

    if (params) {
      if (isNaN(params.callId)) {
        app.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Call Id should be a valid number!'
        });
        return;
      } else {
        var callId = +params.callId;
        sendMessageParams.subjectId = callId;
        var offset = parseInt(params.offset) > 0 ? parseInt(params.offset) : 0,
            count = parseInt(params.count) > 0 ? parseInt(params.count) : config.getHistoryCount;
        sendMessageParams.content.count = count;
        sendMessageParams.content.offset = offset;
        return app.messenger.sendMessage(sendMessageParams, {
          onResult: function onResult(result) {
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
                hasNext: sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0,
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
              app.chatEvents.fireEvent('callEvents', {
                type: 'CALL_PARTICIPANTS_LIST_CHANGE',
                threadId: callId,
                result: returnData.result
              });
            }
          }
        });
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Get Call Participants!'
      });
      return;
    }
  };
  /**
   * This method inquiries call participants from call servers
   */


  this.inquiryCallParticipants = function (_ref5, callback) {
    (0, _objectDestructuringEmpty2["default"])(_ref5);
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.INQUIRY_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: app.callsManager.currentCallId,
      content: {}
    };
    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
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
            contentCount: result.contentCount
          };
          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;
        returnData.result.callId = app.callsManager.currentCallId;

        if (!returnData.hasError) {
          app.chatEvents.fireEvent('callEvents', {
            type: 'ACTIVE_CALL_PARTICIPANTS',
            result: returnData.result
          });
        }
      }
    });
  };

  this.addCallParticipants = function (params, callback) {
    /**
     * + AddCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of CONTACT IDs or inviteeVO Objects
     *    - uniqueId                    {string}
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_CALL_PARTICIPANT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
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
            idType: _constants.inviteeVOidTypes.TO_BE_USER_USERNAME
          });
        }
      }

      if (Array.isArray(params.coreUserids)) {
        sendMessageParams.content = [];

        for (var _i = 0; _i < params.coreUserids.length; _i++) {
          sendMessageParams.content.push({
            id: params.coreUserids[_i],
            idType: _constants.inviteeVOidTypes.TO_BE_CORE_USER_ID
          });
        }
      }
    }

    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
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
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
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

    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
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
    if (app.requestBlocker.isKeyBlocked(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)) {
      app.errorHandler.raiseError(app.errorHandler.getFilledErrorObject(_objectSpread(_objectSpread({}, _errorHandler.errorList.REQUEST_BLOCKED), {}, {
        replacements: ['muteCallParticipants', app.requestBlocker.getRemainingTime(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)]
      })), callback, true, {});
      return;
    }
    /**
     * + muteCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of Participants UserIds
     */


    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [],
      uniqueId: _utility["default"].generateUUID()
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.userIds)) {
        sendMessageParams.content = params.userIds;
      }
    }

    app.requestBlocker.add({
      key: app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE,
      uniqueId: sendMessageParams.uniqueId
    });
    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
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
    if (app.requestBlocker.isKeyBlocked(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)) {
      app.errorHandler.raiseError(app.errorHandler.getFilledErrorObject(_objectSpread(_objectSpread({}, _errorHandler.errorList.REQUEST_BLOCKED), {}, {
        replacements: ['unMuteCallParticipants', app.requestBlocker.getRemainingTime(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)]
      })), callback, true, {});
      return;
    }
    /**
     * + unMuteCallParticipantsRequest     {object}
     *    - subjectId                   {int}
     *    + content                     {list} List of Participants UserIds
     */


    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [],
      uniqueId: _utility["default"].generateUUID()
    };

    if (params) {
      if (typeof params.callId === 'number' && params.callId > 0) {
        sendMessageParams.subjectId = params.callId;
      }

      if (Array.isArray(params.userIds)) {
        sendMessageParams.content = params.userIds;
      }
    }

    app.requestBlocker.add({
      key: app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE,
      uniqueId: sendMessageParams.uniqueId
    });
    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
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
    if (app.requestBlocker.isKeyBlocked(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)) {
      app.errorHandler.raiseError(app.errorHandler.getFilledErrorObject(_objectSpread(_objectSpread({}, _errorHandler.errorList.REQUEST_BLOCKED), {}, {
        replacements: ['turnOnVideoCall', app.requestBlocker.getRemainingTime(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)]
      })), callback, true, {});
      return;
    }

    var turnOnVideoData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token,
      uniqueId: _utility["default"].generateUUID()
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        turnOnVideoData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to turn on the video call!'
      });
      return;
    }

    var call = app.call.currentCall();

    if (!call) {
      app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {}); // app.chatEvents.fireEvent('error', {
      //     code: 999,
      //     message: 'Call not exists'
      // });

      return;
    }

    var user = call.users().get(app.store.user.get().id); //callUsers[store.user().id];

    if (user && user.user().video) {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Video stream is already open!'
      });
      return;
    }

    app.requestBlocker.add({
      key: app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE,
      uniqueId: turnOnVideoData.uniqueId
    });
    return app.messenger.sendMessage(turnOnVideoData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.turnOffVideoCall = function (params, callback) {
    if (app.requestBlocker.isKeyBlocked(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)) {
      app.errorHandler.raiseError(app.errorHandler.getFilledErrorObject(_objectSpread(_objectSpread({}, _errorHandler.errorList.REQUEST_BLOCKED), {}, {
        replacements: ['turnOffVideoCall', app.requestBlocker.getRemainingTime(app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE)]
      })), callback, true, {});
      return;
    }

    var turnOffVideoData = {
      chatMessageVOType: _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: app.sdkParams.token,
      uniqueId: _utility["default"].generateUUID()
    };

    if (params) {
      if (typeof +params.callId === 'number' && params.callId > 0) {
        turnOffVideoData.subjectId = +params.callId;
      } else {
        app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
        return;
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to turn off the video call!'
      });
      return;
    }

    var call = app.call.currentCall();

    if (!call) {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Call not exists'
      });
      return;
    }

    var user = call.users().get(app.store.user.get().id); //callUsers[store.user().id];

    if (!call.callServerController().isJanus() && user && user.videoTopicManager() && user.videoTopicManager().getPeer() && (user.videoTopicManager().isPeerConnecting() || user.videoTopicManager().isPeerFailed() || user.videoTopicManager().isPeerDisconnected())) {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Can not stop stream in current state'
      });
      return;
    }

    if (call.callServerController().isJanus() && call.sendPeerManager() && call.sendPeerManager().getPeer() && (call.sendPeerManager().isPeerConnecting() || call.sendPeerManager().isPeerFailed() || call.sendPeerManager().isPeerDisconnected())) {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Can not stop stream in current state'
      });
      return;
    }

    app.requestBlocker.add({
      key: app.requestBlocker.limitedTypes.START_STOP_VIDEO_VOICE,
      uniqueId: turnOffVideoData.uniqueId
    });
    return app.messenger.sendMessage(turnOffVideoData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.disableParticipantsVideoReceive = function (params, callback) {
    if (params) {
      if (Array.isArray(params.userIds) && params.userIds.length) {
        for (var i in params.userIds) {
          var user = app.call.currentCall().users().get(params.userIds[i]);

          if (user.user().id != "screenShare") {
            user.destroyVideo();
          } // callStateController.deactivateParticipantStream(
          //     params.userIds[i],
          //     'video',
          //     'video'
          // );

        }

        callback && callback({
          hasError: false
        });
      }
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to closeOthersVideoReceive'
      });
      return;
    }
  };

  this.enableParticipantsVideoReceive = function (params, callback) {
    if (params) {
      if (Array.isArray(params.userIds) && params.userIds.length) {
        for (var i in params.userIds) {
          var user = app.call.currentCall().users().get(params.userIds[i]);
          if (!user || !user.user().video) continue;
          user.startVideo(user.user().topicSend);
        }

        callback && callback({
          hasError: false
        });
      }
    } else {
      app.chatEvents.fireEvent('error', {
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
    // let me = callUsers[store.user().id];
    // let currentCall = app.callsManager.get(callsManager().currentCallId);
    if (!app.call.currentCall()) return;
    var me = app.call.currentCall().users().get(app.store.user.get().id);
    if (!me || !me.user().video || !me.videoTopicManager().getPeer()) return;
    me.videoTopicManager().pauseSendStream();
    callback && callback();
  };

  this.resumeCamera = function (params, callback) {
    // let currentCall = callsManager().get(callsManager().currentCallId);
    if (!app.call.currentCall()) return;
    var me = app.call.currentCall().users().get(app.store.user.get().id);
    if (!me || !me.user().videoTopicName || !me.videoTopicManager().getPeer()) //!me.peers[me.videoTopicName]
      return;
    me.videoTopicManager().resumeSendStream();
    callback && callback();
  };
  /**
   * Pauses mice-send without closing its topic
   * @param params
   * @param callback
   */


  this.pauseMice = function (params, callback) {
    var me = app.call.currentCall().users().get(app.store.user.get().id);
    if (!app.call.currentCall() || !me || !me.user().audioTopicName || !me.audioTopicManager().getPeer()) //!me.peers[me.videoTopicName]
      return;
    me.audioTopicManager().pauseSendStream();
    callback && callback();
  };

  this.resumeMice = function (params, callback) {
    var me = app.call.currentCall().users().get(app.store.user.get().id);
    if (!app.call.currentCall || !me || !me.user().audioTopicName || !me.audioTopicManager().getPeer()) //!me.peers[me.videoTopicName]
      return;
    me.audioTopicManager().resumeSendStream();
    callback && callback();
  };

  this.resizeCallVideo = function (params, callback) {
    if (params) {
      if (!!params.width && +params.width > 0) {
        app.call.sharedVariables.callVideoMinWidth = +params.width;
      }

      if (!!params.height && +params.height > 0) {
        app.call.sharedVariables.callVideoMinHeight = +params.height;
      }

      if (!callUsers[app.store.user.get().id]) {
        app.sdkParams.consoleLogging && console.log("Error in resizeCallVideo(), call not started ");
        return;
      }

      var userObject = callUsers[app.store.user.get().id]; //userObject.peers[userObject.videoTopicName]

      userObject.videoTopicManager.getPeer().getLocalStream().getTracks()[0].applyConstraints({
        "width": app.call.sharedVariables.callVideoMinWidth,
        "height": app.call.sharedVariables.callVideoMinHeight
      }).then(function (res) {
        userObject.htmlElements[userObject.videoTopicName].style.width = app.call.sharedVariables.callVideoMinWidth + 'px';
        userObject.htmlElements[userObject.videoTopicName].style.height = app.call.sharedVariables.callVideoMinHeight + 'px';
        callback && callback();
      })["catch"](function (e) {
        app.chatEvents.fireEvent('error', {
          code: 999,
          message: e
        });
      });
    } else {
      app.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to resize the video call! Send an object like {width: 640, height: 480}'
      });
      return;
    }
  };

  this.sendCallSticker = function (_ref6, callback) {
    var _ref6$sticker = _ref6.sticker,
        sticker = _ref6$sticker === void 0 ? _constants.callStickerTypes.RAISE_HAND : _ref6$sticker;
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [sticker],
      subjectId: app.callsManager.currentCallId
    };

    if (!sendMessageParams.subjectId) {
      app.errorHandler.raiseError(_errorHandler.errorList.INVALID_CALLID, callback, true, {});
      return;
    }

    if (!sticker || !Object.values(_constants.callStickerTypes).includes(sticker)) {
      raiseCallError(_errorHandler.errorList.INVALID_STICKER_NAME, callback, true);
      return;
    }

    return app.messenger.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.recallThreadParticipant = function (_ref7, callback) {
    var invitees = _ref7.invitees;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.RECALL_THREAD_PARTICIPANT,
      typeCode: app.sdkParams.generalTypeCode,
      //params.typeCode,
      content: null,
      subjectId: app.callsManager.currentCallId
    };

    if (!invitees || !Array.isArray(invitees) || !invitees.length) {
      raiseCallError(_errorHandler.errorList.INVITEES_LIST_REQUIRED, callback, true, {});
      return;
    }

    sendData.content = []; //params.invitees;

    invitees.forEach(function (item) {
      item.idType = _constants.inviteeVOidTypes[item.idType];
      sendData.content.push(item);
    });
    return app.messenger.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  this.deviceManager = app.call.sharedVariables.deviceManager ? app.call.sharedVariables.deviceManager : app.call.currentCall() ? currentCall().deviceManager() : null;

  this.resetCallStream = /*#__PURE__*/function () {
    var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(_ref8, callback) {
      var userId, _ref8$streamType, streamType, user;

      return _regenerator["default"].wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              userId = _ref8.userId, _ref8$streamType = _ref8.streamType, streamType = _ref8$streamType === void 0 ? 'audio' : _ref8$streamType;

              if (app.call.currentCall()) {
                _context4.next = 4;
                break;
              }

              callback && callback({
                hasError: true
              });
              return _context4.abrupt("return");

            case 4:
              user = app.call.currentCall().users().get(userId);

              if (user) {
                _context4.next = 8;
                break;
              }

              callback && callback({
                hasError: true
              });
              return _context4.abrupt("return");

            case 8:
              _context4.next = 10;
              return user.reconnectTopic(streamType);

            case 10:
              callback && callback({
                hasError: false
              });

            case 11:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    return function (_x7, _x8) {
      return _ref9.apply(this, arguments);
    };
  }();

  this.resetAudioSendStream = function (callback) {
    if (!app.call.currentCall()) {
      callback && callback({
        hasError: true
      });
      return;
    }

    app.call.currentCall().deviceManager().mediaStreams.stopAudioInput();
    app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({
      audio: true
    }).then(function () {
      var user = app.call.currentCall().users().get(app.store.user.get().id);
      user.audioTopicManager().updateStream(app.call.currentCall().deviceManager().mediaStreams.getAudioInput());
      callback && callback({
        hasError: false
      });
    });
  };

  this.resetVideoSendStream = function (callback) {
    if (!app.call.currentCall()) {
      callback && callback({
        hasError: true
      });
      return;
    }

    app.call.currentCall().deviceManager().mediaStreams.setVideoInput();
    app.call.currentCall().deviceManager().grantUserMediaDevicesPermissions({
      audio: true
    }).then(function () {
      var user = app.call.currentCall().users().get(app.store.user.get().id);
      user.videoTopicManager().updateStream(app.call.currentCall().deviceManager().mediaStreams.getVideoInput());
      callback && callback({
        hasError: false
      });
    });
  };

  this.startPrintStatus = function (callUserId, mediaType) {
    console.log(callUserId, mediaType);

    switch (mediaType) {
      case 'audio':
        app.call.currentCall().users().get(callUserId).audioTopicManager().startStatusPrint();
        break;

      case 'video':
        app.call.currentCall().users().get(callUserId).videoTopicManager().startStatusPrint();
    } // currentCall().users().get(callUserId)[mediaType + 'TopicManager']().startStatusPrint();

  };

  this.stopPrintStatus = function (callUserId, mediaType) {
    switch (mediaType) {
      case 'audio':
        app.call.currentCall().users().get(callUserId).audioTopicManager().stopStatusPrint();
        break;

      case 'video':
        app.call.currentCall().users().get(callUserId).videoTopicManager().stopStatusPrint();
    } // currentCall().users().get(callUserId)[mediaType + 'TopicManager']().stopStatusPrint();

  };
}

var _default = ChatCall;
exports["default"] = _default;