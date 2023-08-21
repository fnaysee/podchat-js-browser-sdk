"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSDKUser = setSDKUser;
exports.user = user;

function User(user) {
  var config = {
    user: user
  };
  return {
    id: user.id,
    get: function get() {
      return config.user;
    }
  };
}

var localUser = null;

function setSDKUser(serverUSer) {
  localUser = serverUSer; //new User(serverUSer);
}

function user() {
  return localUser;
}