"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messenger = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _sdkParams = require("../sdkParams");

var _dompurify = _interopRequireDefault(require("dompurify"));

var _utility = _interopRequireDefault(require("../../utility/utility"));

var _store = require("../store");

var _async = require("../async/async");

var Messenger = /*#__PURE__*/function () {
  function Messenger() {
    (0, _classCallCheck2["default"])(this, Messenger);
  }

  (0, _createClass2["default"])(Messenger, [{
    key: "sendMessage",
    value: function sendMessage(params) {
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
      var threadId = null,
          asyncPriority = params.asyncPriority > 0 ? params.asyncPriority : _sdkParams.sdkParams.msgPriority,
          messageVO = {
        type: params.chatMessageVOType,
        token: _sdkParams.sdkParams.token,
        tokenIssuer: 1
      };

      if (params.typeCode || _sdkParams.sdkParams.generalTypeCode) {
        messageVO.typeCode = _sdkParams.sdkParams.generalTypeCode; //params.typeCode;
      }

      if (_sdkParams.sdkParams.typeCodeOwnerId) {
        messageVO.ownerId = _sdkParams.sdkParams.typeCodeOwnerId;
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
      } else {
        uniqueId = _utility["default"].generateUUID();
      }

      if (Array.isArray(uniqueId)) {
        messageVO.uniqueId = JSON.stringify(uniqueId);
      } else {
        messageVO.uniqueId = uniqueId;
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
          peerName: _sdkParams.sdkParams.serverName,
          priority: asyncPriority,
          content: JSON.stringify(messageVO),
          ttl: params.messageTtl > 0 ? params.messageTtl : _sdkParams.sdkParams.messageTtl
        },
        uniqueId: messageVO.uniqueId
      };
      (0, _async.async)().send(data);

      if (_sdkParams.sdkParams.asyncRequestTimeout > 0) {}

      return {
        uniqueId: uniqueId,
        threadId: threadId,
        participant: _store.store.user(),
        content: params.content
      };
    }
  }, {
    key: "processChatMessage",
    value: function processChatMessage() {}
  }]);
  return Messenger;
}();

var messenger = new Messenger();
exports.messenger = messenger;