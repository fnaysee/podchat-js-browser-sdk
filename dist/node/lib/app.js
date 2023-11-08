"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _store = require("./store");

var _sdkParams = require("./sdkParams");

var _events = _interopRequireDefault(require("../events.module"));

var _requestBlocker = _interopRequireDefault(require("./requestBlocker"));

var _errorHandler = _interopRequireDefault(require("./errorHandler"));

function App() {
  var app = {};
  app.store = new _store.Store(app);
  app.sdkParams = new _sdkParams.SDKParams();
  app.chatEvents = new _events["default"](app);
  app.requestBlocker = new _requestBlocker["default"](app);
  app.errorHandler = new _errorHandler["default"](app);
  return app;
}

var _default = App;
exports["default"] = _default;