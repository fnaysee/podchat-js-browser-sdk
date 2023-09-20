"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reactionsSummariesCache = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _index = require("./index");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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

var ReactionsSummariesCache = /*#__PURE__*/function () {
  function ReactionsSummariesCache(props) {
    (0, _classCallCheck2["default"])(this, ReactionsSummariesCache);
    // super(props);
    this._list = {};
  }

  (0, _createClass2["default"])(ReactionsSummariesCache, [{
    key: "list",
    get: function get() {
      return this._list;
    }
  }, {
    key: "getMany",
    value: function getMany(messageIds) {
      var _this = this;

      var result = [];
      messageIds.forEach(function (msgId) {
        var localItem = _this.getItem(msgId);

        if (localItem && localItem.hasAnyReaction()) result.push({
          reactionCountVO: localItem.reactionCountVO,
          userReaction: localItem.userReaction
        });
      });
      return result;
    }
  }, {
    key: "getItem",
    value: function getItem(messageId) {
      return this._list[messageId];
    }
  }, {
    key: "messageExists",
    value: function messageExists(messageId) {
      return !!this._list[messageId];
    }
  }, {
    key: "filterExists",
    value: function filterExists(messageIds) {
      var _this2 = this;

      return messageIds.filter(function (item) {
        return _this2.messageExists(item);
      });
    }
  }, {
    key: "addMany",
    value: function addMany(data) {
      var _this3 = this;

      data.forEach(function (item) {
        if (!_this3.messageExists(item.messageId)) {
          _this3.initItem(item.messageId, item);
        } else {
          _this3.updateItem(item.messageId, item);
        }
      });
    }
  }, {
    key: "initItem",
    value: function initItem(messageId, data) {
      var cClass = this;
      var item = this.messageExists(messageId);

      if (!item) {
        this._list[messageId] = _objectSpread(_objectSpread({}, data), {}, {
          hasReactionStatus: msgsReactionsStatus.REQUESTED,
          setHasReactionStatus: function setHasReactionStatus(status) {
            cClass._list[messageId].hasReactionStatus = status;
          },
          hasAnyReaction: function hasAnyReaction() {
            return cClass._list[messageId].hasReactionStatus === msgsReactionsStatus.HAS_REACTION;
          },
          hasReaction: function hasReaction(sticker) {
            return !!cClass._list[messageId].reactionCountVO.find(function (item) {
              return item.sticker === sticker;
            });
          }
        });
      }
    }
  }, {
    key: "updateItem",
    value: function updateItem(messageId, item) {
      var _this4 = this;

      var localItem = this.getItem(messageId);

      if (!localItem.hasAnyReaction()) {
        this._list[messageId].reactionCountVO = item.reactionCountVO;
      } else {
        item.reactionCountVO && item.reactionCountVO.forEach(function (itt) {
          if (!localItem.hasReaction(itt.sticker)) {
            _this4._list[messageId].reactionCountVO.push(itt);
          } else {
            _this4._list[messageId].reactionCountVO.forEach(function (it2) {
              if (it2.sticker === itt.sticker) {
                it2.count = itt.count;
              }
            });
          }
        });
      }

      this._list[messageId].setHasReactionStatus(msgsReactionsStatus.HAS_REACTION);

      if (item.userReaction) this._list[messageId].userReaction = item.userReaction;
    }
  }, {
    key: "increaseCount",
    value: function increaseCount(messageId, reaction, userId) {
      var item;

      if (this.messageExists(messageId)) {
        item = this.getItem(messageId);
        var found = false;
        item.reactionCountVO.forEach(function (item) {
          if (item.reaction == reaction) {
            item.count++;
            found = true;
          }
        });

        if (!found) {
          item.reactionCountVO.push({
            sticker: reaction,
            count: 1
          });
        }
      }
    }
  }, {
    key: "decreaseCount",
    value: function decreaseCount(messageId, reaction, userId) {
      if (this.messageExists(messageId)) {
        var message = this.getItem(messageId),
            removed = false;
        message.reactionCountVO.forEach(function (it, index) {
          if (it.reaction == reaction) {
            if (it.count > 1) it.count--;else {
              removed = true;
              delete it.reactionCountVO[index];
            }
          }
        });

        if (removed) {
          message.reactionCountVO = message.reactionCountVO.filter(function (item) {
            return item !== undefined;
          });
        }

        if (!message.reactionCountVO.length) delete this._list[messageId];
      }
    }
  }, {
    key: "maybeUpdateMyReaction",
    value: function maybeUpdateMyReaction(messageId, reactionId, reaction, userId, time) {
      var message = this.getItem(messageId);
      if (!message) return;

      if (userId == _index.store.user().isMe(userId)) {
        if (!message.userReaction) {
          this._list[messageId].userReaction = {
            id: reactionId,
            reaction: reaction,
            time: time
          };
        } else if (message.userReaction.id == reactionId) {
          this._list[messageId].userReaction.reaction = reaction;
          this._list[messageId].userReaction.time = time;
        }
      }
    }
  }, {
    key: "addMyReaction",
    value: function addMyReaction(messageId) {
      var message = this.getItem(messageId);
      if (!message) return;
    }
  }, {
    key: "removeMyReaction",
    value: function removeMyReaction(messageId) {
      var message = this.getItem(messageId);
      if (!message) return;
      if (message.userReaction) delete this._list[messageId].userReaction;
      this._list[messageId] = JSON.parse(JSON.stringify(this._list[messageId]));
    }
  }, {
    key: "removeAllMessages",
    value: function removeAllMessages() {
      this._list = {};
    }
  }]);
  return ReactionsSummariesCache;
}();

var reactionsSummariesCache = new ReactionsSummariesCache();
exports.reactionsSummariesCache = reactionsSummariesCache;