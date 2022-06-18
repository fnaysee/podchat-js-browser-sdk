"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorList = exports["default"] = void 0;
var errorList = [{
  code: 12400,
  message: "Could not grant video input permission"
}, {
  code: 12401,
  message: "Could not grant audio input permission"
}, {
  code: 12402,
  message: "Could not grant audio out permission"
}, {
  code: 12403,
  message: "Current environment does not supports user media devices"
}];
exports.errorList = errorList;

var handleError = function handleError(error) {
  var item = errorList.filter(function (item) {
    return item.code == error;
  });
  if (!item.length) return {};
  return item[0];
};

var _default = handleError;
exports["default"] = _default;