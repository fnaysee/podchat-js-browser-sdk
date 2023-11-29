"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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
    },
    reconnectAllUsers: function reconnectAllUsers() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _loop, i;

        return _regenerator["default"].wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _loop = /*#__PURE__*/_regenerator["default"].mark(function _loop(i) {
                  var user;
                  return _regenerator["default"].wrap(function _loop$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          user = config.list[i];

                          if (!user) {
                            _context2.next = 9;
                            break;
                          }

                          if (!user.user().video) {
                            _context2.next = 5;
                            break;
                          }

                          _context2.next = 5;
                          return user.stopVideo();

                        case 5:
                          if (user.user().mute) {
                            _context2.next = 8;
                            break;
                          }

                          _context2.next = 8;
                          return user.stopAudio();

                        case 8:
                          setTimeout(function () {
                            if (user.user().video) user.startVideo(user.user().topicSend);
                            if (!user.user().mute) user.startAudio(user.user().topicSend);
                          }, 500);

                        case 9:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _loop);
                });
                _context3.t0 = _regenerator["default"].keys(config.list);

              case 2:
                if ((_context3.t1 = _context3.t0()).done) {
                  _context3.next = 7;
                  break;
                }

                i = _context3.t1.value;
                return _context3.delegateYield(_loop(i), "t2", 5);

              case 5:
                _context3.next = 2;
                break;

              case 7:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee2);
      }))();
    }
  };
  return publicized;
}

var _default = CallUsers;
exports["default"] = _default;