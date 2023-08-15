"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallUsers = CallUsers;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _callUser = require("./callUser");

var _events = require("../../events.module");

var _callsList = require("./callsList");

var _messaging = require("../../messaging.module");

var _store = require("../store");

function CallUsers(_ref) {
  var callId = _ref.callId;
  var config = {
    list: {},
    callId: callId
  };

  function getHTMLElements() {
    return Object.values(config.list).map(function (item) {
      return item.getHTMLElements();
    });
  }

  function getUser(userId) {
    return config.list[userId];
  }

  function startCall() {
    for (var i in config.list) {
      if (i === "screenShare") {
        if (_callsList.callsManager.get(config.callId).screenShareInfo.isStarted()) addScreenShareToCall('receive', false);
        continue;
      }

      if (config.list[i].video) {
        config.list[i].startParticipantVideo(i);
      }

      if (config.list[i].mute !== undefined && !config.list[i].mute) {
        config.list[i].startParticipantAudio(i);
      }
    }
  }

  function addScreenShareToCall(direction, shareScreen) {
    if (direction !== config.list["screenShare"].direction) {
      config.list['screenShare'].direction = direction;
      config.list['screenShare'].videoTopicManager().setDirection(direction);
    }

    config.list['screenShare'].videoTopicManager().setIsScreenShare(shareScreen);
    var screenShare = config.list["screenShare"];

    if (!screenShare.videoTopicManager.getPeer()) {
      if (!screenShare.htmlElements[screenShare.videoTopicName]) {
        config.list['screenShare'].generateHTMLElements('screenShare');
      }

      setTimeout(function () {
        config.list['screenShare'].appendUserToCallDiv('screenShare');
        screenShare.videoTopicManager.createTopic();
      });

      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_DIVS',
        result: config.generateCallUIList()
      });
    } else {
      screenShare.videoTopicManager().removeTopic();

      if (!screenShare.htmlElements[screenShare.user().videoTopicName]) {
        config.list['screenShare'].generateHTMLElements('screenShare');
      }

      config.list['screenShare'].appendUserToCallDiv();
      screenShare.videoTopicManager().createTopic();
      config.list['screenShare'].videoTopicManager().startMedia(); // startMedia(screenShare.htmlElements[screenShare.videoTopicName])
    }
  }

  var publicized = {
    addItem: function addItem(memberObject) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "user";
      if (type == 'user') config.list[memberObject.userId] = new _callUser.CallUser(memberObject);else if (type == 'screenShare') {
        config.list[memberObject.userId] = new _callUser.CallScreenShare(memberObject);
      }
    },
    removeItem: function removeItem(userId) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!config.list[userId]) {
                  _context.next = 4;
                  break;
                }

                _context.next = 3;
                return config.list[userId].destroy();

              case 3:
                delete config.list[userId];

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    get: getUser,
    getAll: function getAll() {
      return config.list;
    },
    getHTMLElements: getHTMLElements,
    startCall: startCall,
    generateCallUIList: function generateCallUIList() {
      var me = _store.store.user().id,
          callUIElements = {};

      if (!_callsList.callsManager.get(config.callId)) return;

      for (var i in config.list) {
        var tags = {};

        if (config.list[i] && config.list[i].getHTMLElements()) {
          tags.container = config.list[i].getHTMLElements().container;
          if (i === 'screenShare' && _callsList.callsManager.get(config.callId).screenShareInfo.isStarted() || i != 'screenShare' && config.list[i].user().video && config.list[i].getHTMLElements()[config.list[i].user().videoTopicName]) tags.video = config.list[i].getHTMLElements()[config.list[i].user().videoTopicName];
          if (!config.list[i].mute && config.list[i].getHTMLElements()[config.list[i].user().audioTopicName]) tags.audio = config.list[i].getHTMLElements()[config.list[i].user().audioTopicName];
          callUIElements[i] = tags;
        }
      }

      return {
        uiElements: callUIElements
      };
    },
    findUserIdByTopic: function findUserIdByTopic(topic) {
      for (var i in config.list) {
        console.log("findUserIdByTopic:: ", topic, config.list[i].user().videoTopicName, config.list[i].user().audioTopicName);

        if (config.list[i] && (config.list[i].user().videoTopicName === topic || config.list[i].user().audioTopicName === topic)) {
          return i;
        }
      }
    },
    destroy: function destroy() {
      return new Promise(function (resolve) {
        var promises = [];

        for (var i in config.list) {
          var user = config.list[i];

          if (user) {
            promises.push(user.destroy());
          } // delete config.list[i];

        }

        Promise.all(promises).then(function () {
          for (var _i in config.list) {
            delete config.list[_i];
          }

          resolve();
        });
      });
    }
  };
  return publicized;
}