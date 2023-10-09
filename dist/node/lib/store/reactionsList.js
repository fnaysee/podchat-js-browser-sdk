"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reactionsListCache = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _index = require("./index");

var list = [];
var eventsList = {
  SINGLE_THREAD_UPDATE: "singleThreadUpdate",
  UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
  LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated'
};
var msgsReactionsStatus = {
  REQUESTED: 1,
  IS_EMPTY: 2,
  HAS_REACTION: 3
};

var ReactionsListCache = /*#__PURE__*/function () {
  function ReactionsListCache(props) {
    (0, _classCallCheck2["default"])(this, ReactionsListCache);
    // super(props);
    this._list = {};
  }

  (0, _createClass2["default"])(ReactionsListCache, [{
    key: "list",
    get: function get() {
      return this._list;
    }
  }, {
    key: "getItem",
    value: function getItem(messageId) {
      var sticker = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var count = arguments.length > 2 ? arguments[2] : undefined;
      var offset = arguments.length > 3 ? arguments[3] : undefined;
      if (!this.messageExists(messageId) || !this._list[messageId][sticker] || !this._list[messageId][sticker][this.genKey(count, offset)]) return null;
      return {
        messageId: messageId,
        sticker: sticker,
        count: count,
        offset: offset,
        reactionVOList: this._list[messageId][sticker][this.genKey(count, offset)],
        isValid: this._list[messageId][sticker].isValid
      };
    }
  }, {
    key: "invalidateCache",
    value: function invalidateCache(messageId, sticker) {
      if (!messageId) return this.invalidateAllMessages();

      if (!sticker) {
        return this.invalidateMessage(messageId);
      }

      if (this._list[messageId] && this._list[messageId][sticker]) this._list[messageId][sticker].isValid = false;
      if (this._list[messageId] && this._list[messageId]['all']) this._list[messageId]['all'].isValid = false;
    }
  }, {
    key: "invalidateAllMessages",
    value: function invalidateAllMessages() {
      var _this = this;

      Object.keys(this._list).forEach(function (item) {
        _this.invalidateMessage(item);
      });
    }
  }, {
    key: "invalidateMessage",
    value: function invalidateMessage(messageId) {
      var item = this._list[messageId];

      if (item && (0, _typeof2["default"])(item) === 'object') {
        Object.keys(item).forEach(function (objKey) {
          if (objKey && item[objKey] && (0, _typeof2["default"])(item[objKey]) === objKey) {
            item[objKey].isValid = false;
          }
        });
      }
    }
  }, {
    key: "messageExists",
    value: function messageExists(messageId) {
      return !!this._list[messageId];
    }
  }, {
    key: "stickerExists",
    value: function stickerExists(messageId) {
      var sticker = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (!sticker) return !!this._list[messageId] && !!this._list[messageId]['all'];else return !!this._list[messageId] && !!this._list[messageId][sticker];
    }
  }, {
    key: "save",
    value: function save(request, result) {
      var cClass = this,
          sticker = request.sticker ? request.sticker : 'all';

      if (!this.messageExists(request.messageId)) {
        this._list[request.messageId] = {};
      }

      if (!this.stickerExists(request.messageId, sticker)) {
        this._list[request.messageId][sticker] = {
          isValid: true
        };
      }

      this._list[request.messageId][sticker][this.genKey(request.count, request.offset)] = result;
    }
  }, {
    key: "genKey",
    value: function genKey(count, offset) {
      return "count:".concat(count, ",offset:").concat(offset);
    }
  }, {
    key: "removeAllMessages",
    value: function removeAllMessages() {
      this._list = {};
    }
  }]);
  return ReactionsListCache;
}();

var reactionsListCache = new ReactionsListCache();
exports.reactionsListCache = reactionsListCache;