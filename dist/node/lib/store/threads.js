"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ThreadsList = ThreadsList;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var eventsList = {
  SINGLE_THREAD_UPDATE: "singleThreadUpdate",
  UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
  LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated'
};

function ThreadsList(app) {
  var list = [],
      threadsList = {
    eventsList: eventsList,
    get: function get(id) {
      return list[threadsList.findIndex(id)];
    },
    getAll: function getAll() {
      return list;
    },
    getPinMessages: function getPinMessages(ids) {
      var result = [];
      ids.forEach(function (item) {
        var th = threadsList.get(item);

        if (th.getField('pinMessageVO')) {
          result.push(th.getField('pinMessageVO'));
        }
      });
      return result;
    },
    findIndex: function findIndex(threadId) {
      return list.findIndex(function (item) {
        return (item === null || item === void 0 ? void 0 : item.get().id) == threadId;
      });
    },
    findOrCreate: function findOrCreate(thread) {
      var th = threadsList.get(thread.id);

      if (!th) {
        //TODO: make sure we don't break unreadcount
        th = threadsList.save(thread);
      }

      return th;
    },
    save: function save(thread) {
      var localThread;
      var localThreadIndex = threadsList.findIndex(thread.id);

      if (localThreadIndex > -1) {
        list[localThreadIndex].set(thread);
        localThread = list[localThreadIndex];
      } else {
        localThread = new ThreadObject(app, thread);
        localThreadIndex = 0;
        list = [localThread].concat(list);
      }

      app.store.events.emit(eventsList.SINGLE_THREAD_UPDATE, localThread.get());
      return list[localThreadIndex];
    },
    saveMany: function saveMany(newThreads) {
      if (Array.isArray(newThreads)) {
        var nonExistingThreads = [];

        for (var item in newThreads) {
          var localThreadIndex = threadsList.findIndex(newThreads[item].id);

          if (localThreadIndex > -1) {
            list[localThreadIndex].set(newThreads[item]);
          } else {
            nonExistingThreads.push(new ThreadObject(app, newThreads[item]));
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
    },
    removeAll: function removeAll() {
      list = [];
    }
  };
  return threadsList;
}

function ThreadObject(app, thread) {
  var config = {
    thread: thread,
    isValid: true,
    latestReceivedMessage: null,
    pinMessageRequested: false
  };

  function makeSureUnreadCountExists(thread) {
    if (!thread.unreadCount) {
      if (config.thread.unreadCount) thread.unreadCount = config.thread.unreadCount;else thread.unreadCount = 0;
    }
  }

  makeSureUnreadCountExists(config.thread);
  var publicized = {
    set: function set(thread) {
      makeSureUnreadCountExists(thread);
      config.thread = _objectSpread(_objectSpread({}, config.thread), thread);
    },
    get: function get() {
      return config.thread;
    },
    getField: function getField(key) {
      return JSON.parse(JSON.stringify(config.thread[key]));
    },
    update: function update(field, newValue) {
      config.thread[field] = newValue;
      app.store.events.emit(eventsList.SINGLE_THREAD_UPDATE, config.thread);
    },
    unreadCount: {
      set: function set(count) {
        var sendEvent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        config.thread.unreadCount = count;
        if (sendEvent) app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
      },
      get: function get() {
        return config.thread.unreadCount;
      },
      increase: function increase() {
        config.thread.unreadCount++;
        app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
      },
      decrease: function decrease(time) {
        if (time > config.thread.lastSeenMessageTime && config.thread.unreadCount > 0) {
          config.thread.unreadCount--;
          app.store.events.emit(eventsList.UNREAD_COUNT_UPDATED, config.thread);
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

    /**
     * local helper to detect and always replace the correct lastMessageVO in thread
     */
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
    },
    pinMessage: {
      hasPinMessage: function hasPinMessage() {
        return config.thread.pinMessageVO;
      },
      isPinMessageRequested: function isPinMessageRequested() {
        return config.pinMessageRequested;
      },
      setPinMessageRequested: function setPinMessageRequested(val) {
        return config.pinMessageRequested = val;
      },
      setPinMessage: function setPinMessage(message) {
        config.thread.pinMessageVO = message;
      },
      removePinMessage: function removePinMessage() {
        config.thread.pinMessageVO = null;
      }
    },
    isDataValid: function isDataValid() {
      return config.isValid;
    }
  };
  return publicized;
}