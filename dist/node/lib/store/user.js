"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSDKUser = setSDKUser;
exports.user = user;
var localUser = null;

function setSDKUser(serverUSer) {
  localUser = serverUSer;

  localUser.isMe = function (userId) {
    return localUser.id == userId;
  };
}

function user() {
  return localUser;
}