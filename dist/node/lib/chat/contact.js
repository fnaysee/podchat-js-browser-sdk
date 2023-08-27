"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contact = void 0;

var _constants = require("../constants");

var _sdkParams = require("../sdkParams");

var _events = require("../../events.module");

var _index = require("./index");

var _utility = _interopRequireDefault(require("../../utility/utility"));

function get(_ref) {
  var _ref$count = _ref.count,
      count = _ref$count === void 0 ? 25 : _ref$count,
      _ref$offset = _ref.offset,
      offset = _ref$offset === void 0 ? 0 : _ref$offset,
      _ref$query = _ref.query,
      query = _ref$query === void 0 ? null : _ref$query,
      _ref$email = _ref.email,
      email = _ref$email === void 0 ? null : _ref$email,
      _ref$cellphoneNumber = _ref.cellphoneNumber,
      cellphoneNumber = _ref$cellphoneNumber === void 0 ? null : _ref$cellphoneNumber,
      _ref$contactId = _ref.contactId,
      contactId = _ref$contactId === void 0 ? null : _ref$contactId,
      _ref$username = _ref.username,
      username = _ref$username === void 0 ? null : _ref$username,
      _ref$coreUserId = _ref.coreUserId,
      coreUserId = _ref$coreUserId === void 0 ? null : _ref$coreUserId;
  var content = {};
  content.uniqueId = _utility["default"].generateUUID();
  content.size = count;
  content.offset = offset;
  content.query = query;

  if (typeof query === 'string') {
    content.query = query;
  }

  if (typeof email === 'string') {
    content.email = email;
  }

  if (typeof cellphoneNumber === 'string') {
    content.cellphoneNumber = cellphoneNumber;
  }

  if (parseInt(contactId) > 0) {
    content.id = contactId;
  }

  if (typeof username === 'string') {
    content.username = username;
  }

  if (typeof coreUserId !== "undefined") {
    content.coreUserId = coreUserId;
  }

  var sendMessageParams = {
    chatMessageVOType: _constants.chatMessageVOTypes.GET_CONTACTS,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: content
  };
  /**
   * Retrieve Contacts from server
   */

  return _index.api2.messenger.sendMessage(sendMessageParams);
}

var contact = {
  get: get,
  onGetResult: null
};
exports.contact = contact;