"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactionsListCache = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

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
      if (!sticker) sticker = 'all';
      if (!this.messageExists(messageId) || !this._list[messageId][sticker] || !this._list[messageId][sticker][this.genKey(count, offset)]) return null;
      return {
        messageId: messageId,
        sticker: sticker,
        count: count,
        offset: offset,
        reactionVOList: this._list[messageId][sticker][this.genKey(count, offset)] // isValid: this._list[messageId][sticker].isValid

      };
    }
  }, {
    key: "removeCachedData",
    value: function removeCachedData(messageId, sticker) {
      if (!messageId) return this.removeAllMessages(); // return this.invalidateAllMessages();

      if (!sticker) {
        return delete this._list[messageId]; // return this.invalidateMessage(messageId);
      }

      if (this._list[messageId] && this._list[messageId][sticker]) delete this._list[messageId][sticker]; // this._list[messageId][sticker].isValid = false;

      if (this._list[messageId] && this._list[messageId]['all']) delete this._list[messageId]['all']; // this._list[messageId]['all'].isValid = false;
    } // invalidateAllMessages() {
    //     Object.keys(this._list).forEach(item=>{
    //         this.invalidateMessage(item)
    //     })
    //
    // }
    // invalidateMessage(messageId) {
    //     let item = this._list[messageId];
    //     if(item && typeof item === 'object') {
    //         Object.keys(item).forEach(objKey=> {
    //             if(objKey && item[objKey] && typeof item[objKey] === "object") {
    //                 item[objKey].isValid = false;
    //             }
    //         })
    //     }
    // }

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
        this._list[request.messageId][sticker] = {};
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

exports.ReactionsListCache = ReactionsListCache;