"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SDKUser = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var SDKUser = /*#__PURE__*/function () {
  function SDKUser() {
    (0, _classCallCheck2["default"])(this, SDKUser);
    this._user = null;
  }

  (0, _createClass2["default"])(SDKUser, [{
    key: "get",
    value: function get() {
      return this._user;
    }
  }, {
    key: "setUser",
    value: function setUser(data) {
      this._user = data;
    }
  }, {
    key: "isMe",
    value: function isMe(userId) {
      return this._user.id == userId;
    }
  }]);
  return SDKUser;
}();

exports.SDKUser = SDKUser;