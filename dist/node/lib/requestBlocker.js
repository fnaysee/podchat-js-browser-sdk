"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function RequestBlocker() {
  var requestsList = [];
  var limitedTypes = {
    START_STOP_CALL: "START_STOP_CALL",
    START_STOP_VIDEO_VOICE: 'START_STOP_VIDEO_VOICE'
  };

  function find(key) {
    return requestsList.find(function (item) {
      return item && item.key == key;
    });
  }

  function add(_ref) {
    var uniqueId = _ref.uniqueId,
        _ref$time = _ref.time,
        time = _ref$time === void 0 ? null : _ref$time,
        key = _ref.key,
        _ref$blockTimeSeconds = _ref.blockTimeSeconds,
        blockTimeSeconds = _ref$blockTimeSeconds === void 0 ? 1 : _ref$blockTimeSeconds;
    // if(!uniqueId)
    //     uniqueId = Utility.generateUUID();
    if (!time) time = new Date().getTime(); // app.chatEvents.fireEvent("requestBlocker", {
    //     type: "REQUESTS_BLOCKED",
    //     key: key
    // });

    blockTimeSeconds *= 1000;
    requestsList.push({
      uniqueId: uniqueId,
      time: time,
      key: key,
      blockTimeSeconds: blockTimeSeconds,
      timeout: setTimeout(function () {
        remove(uniqueId);
      }, blockTimeSeconds)
    });
  }

  function isKeyBlocked(key) {
    var filteredRequest = find(key);

    if (!filteredRequest) {
      return false;
    }

    var cTime = new Date().getTime();

    if (filteredRequest.time + filteredRequest.blockTimeSeconds > cTime) {
      // alert(`Request Blocked
      // \nSDK Prevents fast calls to specific apis. Please prevent this in your UI.
      // \nCurrent api can be requested after at least ${filteredRequests[i].blockTimeSeconds} seconds.`);
      return true;
    } else {
      remove(filteredRequest.uniqueId);
    }

    return false;
  }

  function remove(uniqueId) {
    var index = requestsList.findIndex(function (item) {
      return item && item.uniqueId == uniqueId;
    });

    if (index > -1) {
      // if(requestsList[index].time + 8000 < new Date().getTime()) {
      clearTimeout(requestsList[index].timeout);
      delete requestsList[index]; // }
    }
  }

  function getRemainingTime(key) {
    var filteredRequest = find(key);

    if (!filteredRequest) {
      return 0;
    }

    var cTime = new Date().getTime();
    console.log({
      filteredRequest: filteredRequest
    }, filteredRequest.time + filteredRequest.blockTimeSeconds - cTime);
    return new Date(filteredRequest.time + filteredRequest.blockTimeSeconds - cTime).getSeconds();
  }

  return {
    add: add,
    remove: remove,
    isKeyBlocked: isKeyBlocked,
    limitedTypes: limitedTypes,
    getRemainingTime: getRemainingTime
  };
}

var _default = RequestBlocker;
exports["default"] = _default;