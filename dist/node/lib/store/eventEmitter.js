"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StoreEvents = StoreEvents;

var _events = _interopRequireDefault(require("events"));

var Emitter = new _events["default"]();

function StoreEvents() {
  return {
    on: function on(eventName, callback) {
      Emitter.on(eventName, callback);
    },
    off: function off(eventName) {
      Emitter.off(eventName);
    },
    emit: function emit(eventName, data) {
      Emitter.emit(eventName, data);
    }
  };
}