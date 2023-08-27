"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.api2 = void 0;

var _messenger = require("./messenger");

var _contact = require("./contact");

var api2 = {
  messenger: _messenger.messenger,
  contact: _contact.contact
};
exports.api2 = api2;