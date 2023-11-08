"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CallUsers = CallUsers;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _callUser = require("./callUser");

function CallUsers(_ref) {
  var app = _ref.app,
      callId = _ref.callId;
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

  var publicized = {
    addItem: function addItem(memberObject) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "user";
      if (type == 'user') config.list[memberObject.userId] = new _callUser.CallUser(app, memberObject);else if (type == 'screenShare') {
        config.list[memberObject.userId] = new _callUser.CallScreenShare(app, memberObject);
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
    generateCallUIList: function generateCallUIList() {
      var me = app.store.user.get().id,
          callUIElements = {};
      if (!app.callsManager.get(config.callId)) return;

      for (var i in config.list) {
        var tags = {};
        var HTMLElements = config.list[i].getHTMLElements();
        config.list[i] && console.log('HTMLElements:: ', {
          HTMLElements: HTMLElements
        }, config.list[i], config.list[i].user(), config.list[i].user().videoTopicName);

        if (config.list[i] && HTMLElements) {
          tags.container = HTMLElements.container;
          if (i === 'screenShare' && app.call.currentCall().screenShareInfo.isStarted() || i != 'screenShare' && config.list[i].user().video && HTMLElements[config.list[i].user().videoTopicName]) tags.video = HTMLElements[config.list[i].user().videoTopicName]; // if (!config.list[i].mute && config.list[i].getHTMLElements()[config.list[i].user().audioTopicName])
          //     tags.audio = config.list[i].getHTMLElements()[config.list[i].user().audioTopicName];

          callUIElements[i] = tags;
        }
      }

      return {
        uiElements: callUIElements
      };
    },
    findUserIdByTopic: function findUserIdByTopic(topic) {
      for (var i in config.list) {
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