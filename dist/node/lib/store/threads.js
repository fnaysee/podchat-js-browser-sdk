"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.threadsList = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _eventEmitter = require("./eventEmitter");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var list = [];
var eventsList = {
  UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
  LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated'
};
var threadsList = {
  eventsList: eventsList,
  get: function get(id) {
    return list[threadsList.findIndex(id)];
  },
  getAll: function getAll() {
    return list;
  },
  findIndex: function findIndex(threadId) {
    return list.findIndex(function (item) {
      return (item === null || item === void 0 ? void 0 : item.get().id) == threadId;
    });
  },
  save: function save(thread) {
    var localThreadIndex = threadsList.findIndex(thread.id);

    if (localThreadIndex > -1) {
      list[localThreadIndex].set(thread);
    } else {
      list = [new ThreadObject(thread)].concat(list);
    }
  },
  saveMany: function saveMany(newThreads) {
    if (Array.isArray(newThreads)) {
      var nonExistingThreads = [];

      for (var item in newThreads) {
        var localThreadIndex = threadsList.findIndex(newThreads[item].id);

        if (localThreadIndex > -1) {
          list[localThreadIndex].set(newThreads[item]);
        } else {
          nonExistingThreads.push(new ThreadObject(newThreads[item]));
        }
      }

      if (nonExistingThreads.length) {
        list = nonExistingThreads.concat(list);
      }
    }
  },
  remove: function remove(id) {
    var localThreadIndex = threadsList.findIndex(id);

    if (localThreadIndex > -1) {
      delete list[localThreadIndex];
    }
  }
};
exports.threadsList = threadsList;

function ThreadObject(thread) {
  var config = {
    thread: thread,
    latestReceivedMessage: null
  };

  function makeSureUnreadCountExists(thread) {
    if (typeof thread.unreadCount != "number") thread.unreadCount = 0;
  }

  makeSureUnreadCountExists(config.thread);
  return {
    set: function set(thread) {
      makeSureUnreadCountExists(thread);
      console.log("ThreadObject.set, before:", thread, Object.keys(thread));
      config.thread = _objectSpread(_objectSpread({}, config.thread), thread);
      console.log("ThreadObject.set, after:", config.thread);
    },
    get: function get() {
      return config.thread;
    },
    update: function update(field, newValue) {
      config.thread[field] = newValue;
    },
    unreadCount: {
      set: function set(count) {
        config.thread.unreadCount = count;

        _eventEmitter.storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
      },
      get: function get() {
        return config.thread.unreadCount;
      },
      increase: function increase() {
        config.thread.unreadCount++;

        _eventEmitter.storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
      },
      decrease: function decrease(time) {
        if (time > config.thread.lastSeenMessageTime && config.thread.unreadCount > 0) {
          config.thread.unreadCount--;

          _eventEmitter.storeEvents.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
        }
      }
    },
    lastSeenMessageTime: {
      set: function set(number) {
        if (number > config.thread.lastSeenMessageTime) {
          config.thread.lastSeenMessageTime = number;
        }
      },
      get: function get() {
        return config.thread.lastSeenMessageTime;
      }
    },
    latestReceivedMessage: {
      getTime: function getTime() {
        return config.latestReceivedMessage ? config.latestReceivedMessage.time : 0;
      },
      get: function get() {
        return config.latestReceivedMessage;
      },
      set: function set(message) {
        config.latestReceivedMessage = message;
      }
    }
  };
}