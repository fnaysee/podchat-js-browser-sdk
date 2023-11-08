"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _callManager = require("./callManager");

function CallsList(app) {
  var config = {
    list: {},
    currentCallId: null
  };
  var publicized = {
    addItem: function addItem(callId, callConfig) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!Object.values(config.list).filter(function (item) {
                  return item != undefined;
                }).length) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return publicized.destroyAllCalls();

              case 3:
                app.callsManager.currentCallId = callId;
                config.list[callId] = new _callManager.CallManager({
                  app: app,
                  callId: callId,
                  callConfig: callConfig
                });

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    removeItem: function removeItem(callId) {
      return (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!config.list[callId]) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 3;
                return config.list[callId].destroy();

              case 3:
                delete config.list[callId];

              case 4:
                app.callsManager.currentCallId = null;

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    get: function get(id) {
      return config.list[id];
    },
    routeCallMessage: function routeCallMessage(callId, message) {
      if (config.list[callId]) config.list[callId].processCallMessage(message);else app.sdkParams.consoleLogging && console.warn("[SDK] Skipping call message, call not exists. uniqueId: ", {
        message: message
      });
    },
    destroyAllCalls: function destroyAllCalls() {
      return new Promise(function (resolve) {
        var allPromises = [];

        for (var i in config.list) {
          console.log("destroyAllCalls()", i);
          app.call.endCall({
            callId: i
          });
          allPromises.push(publicized.removeItem(i));
        }

        Promise.all(allPromises).then(function () {
          resolve();
        });
      });
    }
  };
  return publicized;
}

var _default = CallsList;
exports["default"] = _default;