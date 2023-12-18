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
    findUserIdByClientId: function findUserIdByClientId(clientId) {
      for (var i in config.list) {
        if (config.list[i] && config.list[i].user().clientId == clientId) {
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
    stopTracks: function stopTracks(user) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!user.user().video) {
                  _context2.next = 3;
                  break;
                }

                _context2.next = 3;
                return user.destroyVideo();

              case 3:
                if (user.user().mute) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 6;
                return user.destroyAudio();

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    startTracks: function startTracks(user) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (user.user().video) user.startVideo(user.user().topicSend);
                if (!user.user().mute) user.startAudio(user.user().topicSend);

              case 2:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    stopAllReceivers: function stopAllReceivers() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        var i, user;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.t0 = _regenerator["default"].keys(config.list);

              case 1:
                if ((_context4.t1 = _context4.t0()).done) {
                  _context4.next = 9;
                  break;
                }

                i = _context4.t1.value;
                user = config.list[i];

                if (!(user && !user.isMe())) {
                  _context4.next = 7;
                  break;
                }

                _context4.next = 7;
                return publicized.stopTracks(user);

              case 7:
                _context4.next = 1;
                break;

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    },
    startAllReceivers: function startAllReceivers() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        var i, user;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = _regenerator["default"].keys(config.list);

              case 1:
                if ((_context5.t1 = _context5.t0()).done) {
                  _context5.next = 9;
                  break;
                }

                i = _context5.t1.value;
                user = config.list[i];

                if (!(user && !user.isMe())) {
                  _context5.next = 7;
                  break;
                }

                _context5.next = 7;
                return publicized.startTracks(user);

              case 7:
                _context5.next = 1;
                break;

              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }))();
    },
    stopAllSenders: function stopAllSenders() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        var me;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                me = publicized.get(app.store.user.get().id);

                if (config.isMe) {
                  app.call.currentCall().sendPeerManager().removeTrack(config.user.videoTopicName);
                  app.call.currentCall().sendPeerManager().removeTrack(config.user.audioTopicName);
                }

                _context6.next = 4;
                return publicized.stopTracks(me);

              case 4:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }))();
    },
    startAllsenders: function startAllsenders() {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var me;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                me = publicized.get(app.store.user.get().id);
                publicized.startTracks(me);

              case 2:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }))();
    }
  };
  return publicized;
}

var _default = CallUsers;
exports["default"] = _default;