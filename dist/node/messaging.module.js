"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _constants = require("./lib/constants");

var _dompurify = _interopRequireDefault(require("dompurify"));

var _utility = _interopRequireDefault(require("./utility/utility"));

var _errorHandler = require("./lib/errorHandler");

/**
 * Communicates with chat server
 * @param app
 * @param params
 * @constructor
 */
function ChatMessaging(app, params) {
  var currentModuleInstance = this,
      asyncClient = params.asyncClient; //Utility = params.Utility,
  // consoleLogging = app.sdkParams.consoleLogging,
  //generalTypeCode = app.sdkParams.generalTypeCode,
  //chatPingMessageInterval = params.chatPingMessageInterval,
  //asyncRequestTimeout = params.asyncRequestTimeout,
  //messageTtl = params.messageTtl,
  //serverName = params.serverName,
  //msgPriority = params.msgPriority,
  //typeCodeOwnerId = app.sdkParams.typeCodeOwnerId || null;

  this.threadCallbacks = {};
  this.sendMessageCallbacks = {}; // this.messagesCallbacks = {};
  // this.asyncRequestTimeouts = {};
  // this.sendPingTimeout = null;

  this.chatState = false;
  this.userInfo = null;
  /**
   * sendPingTimeout removed,
   *
   */

  this.startChatPing = function () {
    app.sdkParams.chatPingMessageInterval && clearInterval(app.sdkParams.chatPingMessageInterval);
    app.sdkParams.chatPingMessageInterval = setInterval(function () {
      currentModuleInstance.ping();
    }, 20000); //TODO: chatPingMessageInterval
  };

  this.stopChatPing = function () {
    clearInterval(app.sdkParams.chatPingMessageInterval);
  };

  this.asyncInitialized = function (client) {
    asyncClient = client;
  };
  /**
   * Send Message
   *
   * All socket messages go through this function
   *
   * @access private
   *
   * @param {string}    token           SSO Token of current user
   * @param {string}    tokenIssuer     Issuer of token (default : 1)
   * @param {int}       type            Type of message (object : chatMessageVOTypes)
   * @param {string}    typeCode        Type of contact who is going to receive the message
   * @param {int}       messageType     Type of Message, in order to filter messages
   * @param {long}      subjectId       Id of chat thread
   * @param {string}    uniqueId        Tracker id for client
   * @param {string}    content         Content of message
   * @param {long}      time            Time of message, filled by chat server
   * @param {string}    medadata        Metadata for message (Will use when needed)
   * @param {string}    systemMedadata  Metadata for message (To be Set by client)
   * @param {long}      repliedTo       Id of message to reply to (Should be filled by client)
   * @param {function}  callback        The callback function to run after
   *
   * @return {object} Instant Function Return
   */


  this.sendMessage = function (params, callbacks, recursiveCallback) {
    var _currentModuleInstanc;

    if (!currentModuleInstance.chatState && _constants.chatMessageVOTypes.USER_INFO != params.chatMessageVOType) {
      var clbck;

      if (!callbacks) {
        clbck = null;
      } else if (typeof callbacks === "function") {
        clbck = callbacks;
      } else if (callbacks.onResult) {
        clbck = callbacks.onResult;
      }

      app.errorHandler.raiseError(_errorHandler.errorList.SOCKET_NOT_CONNECTED, clbck, true, {});
      return;
    }
    /**
     * + ChatMessage        {object}
     *    - token           {string}
     *    - tokenIssuer     {string}
     *    - type            {int}
     *    - typeCode        {string}
     *    - messageType     {int}
     *    - subjectId       {int}
     *    - uniqueId        {string}
     *    - content         {string}
     *    - time            {int}
     *    - medadata        {string}
     *    - systemMedadata  {string}
     *    - repliedTo       {int}
     */


    var threadId = null;
    var asyncPriority = params.asyncPriority > 0 ? params.asyncPriority : app.sdkParams.msgPriority;
    var messageVO = {
      type: params.chatMessageVOType,
      token: app.sdkParams.token,
      tokenIssuer: 1
    };

    if (params.typeCode || app.sdkParams.generalTypeCode) {
      messageVO.typeCode = app.sdkParams.generalTypeCode; //params.typeCode;
    }

    if (app.sdkParams.typeCodeOwnerId) {
      messageVO.ownerId = app.sdkParams.typeCodeOwnerId;
    }

    if (params.messageType) {
      messageVO.messageType = params.messageType;
    }

    if (params.subjectId) {
      threadId = params.subjectId;
      messageVO.subjectId = params.subjectId;
    }

    if (params.content) {
      if ((0, _typeof2["default"])(params.content) == 'object') {
        messageVO.content = JSON.stringify(params.content);
      } else {
        messageVO.content = params.content;

        if (_dompurify["default"].isSupported) {
          messageVO.content = _dompurify["default"].sanitize(messageVO.content, {
            ALLOWED_TAGS: []
          });
        }
      }
    }

    if (params.metadata) {
      messageVO.metadata = params.metadata;
    }

    if (params.systemMetadata) {
      messageVO.systemMetadata = params.systemMetadata;
    }

    if (params.repliedTo) {
      messageVO.repliedTo = params.repliedTo;
    }

    var uniqueId;

    if (typeof params.uniqueId != 'undefined') {
      uniqueId = params.uniqueId;
    } else if (params.chatMessageVOType !== _constants.chatMessageVOTypes.PING) {
      uniqueId = _utility["default"].generateUUID();
    }

    if (Array.isArray(uniqueId)) {
      messageVO.uniqueId = JSON.stringify(uniqueId);
    } else {
      messageVO.uniqueId = uniqueId;
    }

    if ((0, _typeof2["default"])(callbacks) == 'object') {
      if (callbacks.onSeen || callbacks.onDeliver || callbacks.onSent) {
        if (!app.store.threadCallbacks[threadId]) {
          app.store.threadCallbacks[threadId] = {};
        }

        app.store.threadCallbacks[threadId][uniqueId] = {};
        app.store.sendMessageCallbacks[uniqueId] = {};

        if (callbacks.onSent) {
          app.store.sendMessageCallbacks[uniqueId].onSent = callbacks.onSent;
          app.store.threadCallbacks[threadId][uniqueId].onSent = false;
          app.store.threadCallbacks[threadId][uniqueId].uniqueId = uniqueId;
        }

        if (callbacks.onSeen) {
          app.store.sendMessageCallbacks[uniqueId].onSeen = callbacks.onSeen;
          app.store.threadCallbacks[threadId][uniqueId].onSeen = false;
        }

        if (callbacks.onDeliver) {
          app.store.sendMessageCallbacks[uniqueId].onDeliver = callbacks.onDeliver;
          app.store.threadCallbacks[threadId][uniqueId].onDeliver = false;
        }
      } else if (callbacks.onResult) {
        app.store.messagesCallbacks[uniqueId] = callbacks.onResult;
      }
    } else if (typeof callbacks == 'function') {
      app.store.messagesCallbacks[uniqueId] = callbacks;
    }
    /**
     * Message to send through async SDK
     *
     * + MessageWrapperVO  {object}
     *    - type           {int}       Type of ASYNC message based on content
     *    + content        {string}
     *       -peerName     {string}    Name of receiver Peer
     *       -receivers[]  {int}      Array of receiver peer ids (if you use this, peerName will be ignored)
     *       -priority     {int}       Priority of message 1-10, lower has more priority
     *       -messageId    {int}      Id of message on your side, not required
     *       -ttl          {int}      Time to live for message in milliseconds
     *       -content      {string}    Chat Message goes here after stringifying
     *    - trackId        {int}      Tracker id of message that you receive from DIRANA previously (if you are replying a sync message)
     */


    var data = {
      type: parseInt(params.pushMsgType) > 0 ? params.pushMsgType : 3,
      content: {
        peerName: app.sdkParams.serverName,
        priority: asyncPriority,
        content: JSON.stringify(messageVO),
        ttl: params.messageTtl > 0 ? params.messageTtl : app.sdkParams.messageTtl
      },
      uniqueId: messageVO.uniqueId
    };
    asyncClient.send(data, function (res) {
      if (!res.hasError && callbacks) {
        if (typeof callbacks == 'function') {
          callbacks(res);
        } else if ((0, _typeof2["default"])(callbacks) == 'object' && typeof callbacks.onResult == 'function') {
          callbacks.onResult(res);
        }

        if (app.store.messagesCallbacks[uniqueId]) {
          delete app.store.messagesCallbacks[uniqueId];
        }
      }
    });

    if (app.sdkParams.asyncRequestTimeout > 0) {
      app.store.asyncRequestTimeouts[uniqueId] && clearTimeout(app.store.asyncRequestTimeouts[uniqueId]);
      app.store.asyncRequestTimeouts[uniqueId] = setTimeout(function () {
        if (typeof callbacks == 'function') {
          callbacks({
            hasError: true,
            errorCode: 408,
            errorMessage: 'Async Request Timed Out!'
          });
        } else if ((0, _typeof2["default"])(callbacks) == 'object' && typeof callbacks.onResult == 'function') {
          callbacks.onResult({
            hasError: true,
            errorCode: 408,
            errorMessage: 'Async Request Timed Out!'
          });
        }

        if (app.store.messagesCallbacks[uniqueId]) {
          delete app.store.messagesCallbacks[uniqueId];
        }

        if (app.store.sendMessageCallbacks[uniqueId]) {
          delete app.store.sendMessageCallbacks[uniqueId];
        }

        if (!!app.store.threadCallbacks[threadId] && app.store.threadCallbacks[threadId][uniqueId]) {
          app.store.threadCallbacks[threadId][uniqueId] = {};
          delete app.store.threadCallbacks[threadId][uniqueId];
        }
      }, app.sdkParams.asyncRequestTimeout);
    }
    /*          currentModuleInstance.sendPingTimeout && clearTimeout(currentModuleInstance.sendPingTimeout);
            currentModuleInstance.sendPingTimeout = setTimeout(function () {
                currentModuleInstance.ping();
            }, chatPingMessageInterval); */


    recursiveCallback && recursiveCallback();
    return {
      uniqueId: uniqueId,
      threadId: threadId,
      participant: (_currentModuleInstanc = currentModuleInstance.userInfo) === null || _currentModuleInstanc === void 0 ? void 0 : _currentModuleInstanc.id,
      // currentModuleInstance.userInfo,
      content: params.content
    };
  };
  /**
   * Ping
   *
   * This Function sends ping message to keep user connected to
   * chat server and updates its status
   *
   * @access private
   *
   * @return {undefined}
   */


  this.ping = function () {
    if (currentModuleInstance.chatState && typeof currentModuleInstance.userInfo !== 'undefined') {
      /**
       * Ping messages should be sent ASAP, because
       * we don't want to wait for send queue, we send them
       * right through async from here
       */
      currentModuleInstance.sendMessage({
        chatMessageVOType: _constants.chatMessageVOTypes.PING,
        pushMsgType: 3
      });
    }
  };
}

var _default = ChatMessaging;
exports["default"] = _default;