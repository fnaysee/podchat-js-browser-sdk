'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof3 = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _podasyncWsOnly = _interopRequireDefault(require("podasync-ws-only"));

var _utility = _interopRequireDefault(require("./utility/utility"));

var _dexie = _interopRequireDefault(require("dexie"));

var _call = _interopRequireDefault(require("./call.module"));

var _events = _interopRequireWildcard(require("./events.module"));

var _messaging = _interopRequireDefault(require("./messaging.module"));

var _buildConfig = _interopRequireDefault(require("./buildConfig.json"));

var _deprecateMethods = require("./deprecateMethods");

var _constants = require("./lib/constants");

var _deviceManager = _interopRequireDefault(require("./lib/call/deviceManager.js"));

var _store = require("./lib/store");

var _sdkParams = require("./lib/sdkParams");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof3(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function Chat(params) {
  /*******************************************************
   *          P R I V A T E   V A R I A B L E S          *
   *******************************************************/
  _sdkParams.sdkParams.token = params.token || "111";
  _sdkParams.sdkParams.generalTypeCode = params.typeCode || 'default';
  _sdkParams.sdkParams.typeCodeOwnerId = params.typeCodeOwnerId || null;
  _sdkParams.sdkParams.mapApiKey = params.mapApiKey || '8b77db18704aa646ee5aaea13e7370f4f88b9e8c';
  _sdkParams.sdkParams.productEnv = typeof navigator != 'undefined' ? navigator.product : 'undefined';
  _sdkParams.sdkParams.forceWaitQueueInMemory = params.forceWaitQueueInMemory && typeof params.forceWaitQueueInMemory === 'boolean' ? params.forceWaitQueueInMemory : false;
  _sdkParams.sdkParams.grantDeviceIdFromSSO = params.grantDeviceIdFromSSO && typeof params.grantDeviceIdFromSSO === 'boolean' ? params.grantDeviceIdFromSSO : false;
  _sdkParams.sdkParams.deliveryIntervalPitch = params.deliveryIntervalPitch || 2000;
  _sdkParams.sdkParams.seenIntervalPitch = params.seenIntervalPitch || 2000;
  _sdkParams.sdkParams.systemMessageIntervalPitch = params.systemMessageIntervalPitch || 1000;
  _sdkParams.sdkParams.socketAddress = params.socketAddress;
  _sdkParams.sdkParams.serverName = params.serverName;
  _sdkParams.sdkParams.wsConnectionWaitTime = params.wsConnectionWaitTime;
  _sdkParams.sdkParams.connectionRetryInterval = params.connectionRetryInterval;
  _sdkParams.sdkParams.msgPriority = params.msgPriority;
  _sdkParams.sdkParams.messageTtl = params.messageTtl || 10000;
  _sdkParams.sdkParams.reconnectOnClose = params.reconnectOnClose;
  _sdkParams.sdkParams.asyncLogging = params.asyncLogging;
  _sdkParams.sdkParams.connectionCheckTimeout = params.connectionCheckTimeout;
  _sdkParams.sdkParams.httpRequestTimeout = params.httpRequestTimeout >= 0 ? params.httpRequestTimeout : 0;
  _sdkParams.sdkParams.asyncRequestTimeout = typeof params.asyncRequestTimeout === 'number' && params.asyncRequestTimeout >= 0 ? params.asyncRequestTimeout : 0;
  _sdkParams.sdkParams.connectionCheckTimeoutThreshold = params.connectionCheckTimeoutThreshold;
  _sdkParams.sdkParams.httpUploadRequestTimeout = params.httpUploadRequestTimeout >= 0 ? params.httpUploadRequestTimeout : 0;
  _sdkParams.sdkParams.actualTimingLog = params.asyncLogging.actualTiming && typeof params.asyncLogging.actualTiming === 'boolean' ? params.asyncLogging.actualTiming : false;
  _sdkParams.sdkParams.consoleLogging = params.asyncLogging.consoleLogging && typeof params.asyncLogging.consoleLogging === 'boolean' ? params.asyncLogging.consoleLogging : false;
  _sdkParams.sdkParams.fullResponseObject = params.fullResponseObject || false;
  _sdkParams.sdkParams.webrtcConfig = params.webrtcConfig ? params.webrtcConfig : null;
  _sdkParams.sdkParams.chatPingMessageInterval = params.chatPingMessageInterval;
  _sdkParams.sdkParams.callOptions = params.callOptions;
  _sdkParams.sdkParams.protocol = params.protocol;
  var asyncClient,
      peerId,
      oldPeerId,
      //deviceId,
  //db,
  //queueDb,
  //hasCache = sdkParams.productEnv !== 'ReactNative' && typeof Dexie != 'undefined',
  cacheInMemory = _sdkParams.sdkParams.forceWaitQueueInMemory ? true : false,
      //!hasCache,
  //enableCache = (params.enableCache && typeof params.enableCache === 'boolean') ? params.enableCache : false,
  //canUseCache = hasCache && enableCache,
  //isCacheReady = false,
  //cacheDeletingInProgress = false,
  //cacheExpireTime = params.cacheExpireTime || 2 * 24 * 60 * 60 * 1000,
  cacheSecret = 'VjaaS9YxNdVVAd3cAsRPcU5FyxRcyyV6tG6bFGjjK5RV8JJjLrXNbS5zZxnqUT6Y',
      //cacheSyncWorker,
  //messagesDelivery = {},
  //messagesSeen = {},
  //deliveryInterval,
  //seenInterval,
  //getImageFromLinkObjects = {},
  // locationPingTypes = {
  //     'CHAT': 1,
  //     'THREAD': 2,
  //     'CONTACTS': 3
  // },
  //isTypingInterval,
  //protocol = params.protocol || 'websocket',
  queueHost = params.queueHost,
      queuePort = params.queuePort,
      queueUsername = params.queueUsername,
      queuePassword = params.queuePassword,
      queueReceive = params.queueReceive,
      queueSend = params.queueSend,
      queueConnectionTimeout = params.queueConnectionTimeout,
      //socketAddress = params.socketAddress,
  //serverName = params.serverName || '',
  //wsConnectionWaitTime = params.wsConnectionWaitTime,
  //connectionRetryInterval = params.connectionRetryInterval,
  //msgPriority = params.msgPriority || 1,
  //messageTtl = params.messageTtl || 10000,
  //reconnectOnClose = params.reconnectOnClose,
  //asyncLogging = params.asyncLogging,
  //chatPingMessageInterval = 20000,
  //getUserInfoTimeout,
  config = {
    getHistoryCount: 50
  },
      SERVICE_ADDRESSES = {
    SSO_ADDRESS: params.ssoHost || 'https://accounts.pod.ir',
    PLATFORM_ADDRESS: params.platformHost || 'https://api.pod.ir/srv/core',
    FILESERVER_ADDRESS: params.fileServer || 'https://core.pod.ir',
    PODSPACE_FILESERVER_ADDRESS: params.podSpaceFileServer || 'https://podspace.pod.ir',
    MAP_ADDRESS: params.mapServer || 'https://api.neshan.org/v2'
  },
      SERVICES_PATH = {
    // Grant Devices
    SSO_DEVICES: '/oauth2/grants/devices',
    SSO_GENERATE_KEY: '/handshake/users/',
    SSO_GET_KEY: '/handshake/keys/',
    // Contacts
    ADD_CONTACTS: '/nzh/addContacts',
    UPDATE_CONTACTS: '/nzh/updateContacts',
    REMOVE_CONTACTS: '/nzh/removeContacts',
    SEARCH_CONTACTS: '/nzh/listContacts',
    // File/Image Upload and Download
    UPLOAD_IMAGE: '/nzh/uploadImage',
    GET_IMAGE: '/nzh/image/',
    UPLOAD_FILE: '/nzh/uploadFile',
    GET_FILE: '/nzh/file/',
    // POD Drive Services
    PODSPACE_UPLOAD_FILE_TO_USERGROUP: '/userGroup/uploadFile',
    //TODO: to be removed
    PODSPACE_UPLOAD_FILE_TO_USERGROUP_NEW: '/api/usergroups/{userGroupHash}/files',
    PODSPACE_UPLOAD_IMAGE_TO_USERGROUP: '/userGroup/uploadImage',
    //TODO: to be removed
    PODSPACE_UPLOAD_IMAGE_TO_USERGROUP_NEW: '/api/usergroups/{userGroupHash}/images',
    //PODSPACE_UPLOAD_FILE: '/nzh/drive/uploadFile',
    //PODSPACE_UPLOAD_FILE_FROM_URL: '/nzh/drive/uploadFileFromUrl',
    //TODO: maybe deprecated
    PODSPACE_UPLOAD_IMAGE: '/nzh/drive/uploadImage',
    //TODO: to be removed
    PODSPACE_UPLOAD_IMAGE_NEW: '/api/images',
    PODSPACE_UPLOAD_FILE_NEW: '/api/files',
    PODSPACE_DOWNLOAD_FILE: '/nzh/drive/downloadFile',
    //TODO: to be removed
    PODSPACE_DOWNLOAD_FILE_NEW: '/api/files/{fileHash}',
    PODSPACE_DOWNLOAD_IMAGE: '/nzh/drive/downloadImage',
    //TODO: to be removed
    PODSPACE_DOWNLOAD_IMAGE_NEW: '/api/images/{fileHash}',
    // Neshan Map
    REVERSE: '/reverse',
    SEARCH: '/search',
    ROUTING: '/routing',
    STATIC_IMAGE: '/static'
  },
      CHAT_ERRORS = {
    // Socket Errors
    6000: 'No Active Device found for this Token!',
    6001: 'Invalid Token!',
    6002: 'User not found!',
    // Get User Info Errors
    6100: 'Cant get UserInfo!',
    6101: 'Getting User Info Retry Count exceeded 5 times; Connection Can Not Been Estabilished!',
    // Http Request Errors
    6200: 'Network Error',
    6201: 'URL is not clarified!',
    // File Uploads Errors
    6300: 'Error in uploading File!',
    6301: 'Not an image!',
    6302: 'No file has been selected!',
    6303: 'File upload has been canceled!',
    6304: 'User Group Hash is needed for file sharing!',
    // Cache Database Errors
    6600: 'Your Environment doesn\'t have Databse compatibility',
    6601: 'Database is not defined! (missing db)',
    6602: 'Database Error',
    // Map Errors
    6700: 'You should Enter a Center Location like {lat: " ", lng: " "}'
  },
      getUserInfoRetry = 5,
      getUserInfoRetryCount = 0,
      chatFullStateObject = {},
      httpRequestObject = {},
      //connectionCheckTimeout = params.connectionCheckTimeout,
  // connectionCheckTimeoutThreshold = params.connectionCheckTimeoutThreshold,
  // httpRequestTimeout = (params.httpRequestTimeout >= 0) ? params.httpRequestTimeout : 0,
  // asyncRequestTimeout = (typeof params.asyncRequestTimeout === 'number' && params.asyncRequestTimeout >= 0) ? params.asyncRequestTimeout : 0,
  //callRequestTimeout = (typeof params.callRequestTimeout === 'number' && params.callRequestTimeout >= 0) ? params.callRequestTimeout : 10000,
  // httpUploadRequestTimeout = (params.httpUploadRequestTimeout >= 0) ? params.httpUploadRequestTimeout : 0,
  // actualTimingLog = (params.asyncLogging.actualTiming && typeof params.asyncLogging.actualTiming === 'boolean')
  //     ? params.asyncLogging.actualTiming
  //     : false,
  // consoleLogging = (sdkParams.asyncLogging.consoleLogging && typeof sdkParams.asyncLogging.consoleLogging === 'boolean')
  //     ? params.asyncLogging.consoleLogging
  //     : false,
  minIntegerValue = Number.MAX_SAFE_INTEGER * -1,
      maxIntegerValue = Number.MAX_SAFE_INTEGER,
      chatSendQueue = [],
      chatWaitQueue = [],
      chatUploadQueue = [],
      protocolSwitching = params.protocolSwitching,
      protocolManager = new ProtocolManager({
    protocol: _sdkParams.sdkParams.protocol
  }),
      msgLogCallback = typeof params.msgLogCallback == "function" ? params.msgLogCallback : null; //fullResponseObject = params.fullResponseObject || false,
  //webrtcConfig = (params.webrtcConfig ? params.webrtcConfig : null);

  if (!_sdkParams.sdkParams.consoleLogging) {
    /**
     * Disable kurento-utils logs
     */
    window.Logger = {
      error: function error() {},
      log: function log() {},
      debug: function debug() {}
    };
  }

  (0, _events.initEventHandler)(params);
  var chatMessaging = new _messaging["default"](Object.assign(params, {
    asyncClient: asyncClient
  })),
      callModule = new _call["default"](Object.assign(params, {
    asyncClient: asyncClient,
    chatMessaging: chatMessaging
  }));

  function ProtocolManager(_ref) {
    var _ref$protocol = _ref.protocol,
        protocol = _ref$protocol === void 0 ? 'auto' : _ref$protocol;
    var config = {
      switchingEnabled: protocol == "auto",
      currentProtocol: protocol == "auto" ? 'websocket' : protocol,
      failOverProtocol: protocol == "auto" || protocol == "websocket" ? 'webrtc' : 'websocket',
      retries: 0,
      allowedRetries: {
        websocket: protocolSwitching && typeof protocolSwitching.websocket !== "undefined" ? protocolSwitching.websocket : 1,
        webrtc: protocolSwitching && typeof protocolSwitching.webrtc !== "undefined" ? protocolSwitching.webrtc : 1
      },
      currentWaitTime: 0
    };

    function canRetry() {
      return config.retries <= config.allowedRetries[config.currentProtocol];
    }

    function _switchProtocol(protocol) {
      var canResetRetries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      asyncClient.logout().then(function () {
        var current;

        if (protocol) {
          current = protocol.toLowerCase();
          config.failOverProtocol = current == "webrtc" ? "websocket" : "webrtc";
          config.currentProtocol = current;
        } else {
          current = config.currentProtocol;
          config.currentProtocol = config.failOverProtocol;
          config.failOverProtocol = current;
        }

        _sdkParams.sdkParams.consoleLogging && console.log("[SDK]|/| switchProtocol: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime);

        _events.chatEvents.fireEvent("autoSwitchAsyncProtocol", {
          current: config.currentProtocol,
          previous: config.failOverProtocol
        });

        if (canResetRetries) config.retries = 1;
        initAsync();
      });
    }

    function _resetRetries() {
      config.retries = 0;
    }

    var publics = {
      switchProtocol: function switchProtocol(protocol) {
        if (protocol == 'auto') {
          config.switchingEnabled = true;

          _switchProtocol("websocket");
        } else {
          config.switchingEnabled = false;

          _switchProtocol(protocol);
        }
      },
      increaseRetries: function increaseRetries() {
        config.retries += 1;
      },
      canRetry: canRetry,
      getCurrentProtocol: function getCurrentProtocol() {
        return config.currentProtocol;
      },
      resetRetries: function resetRetries() {
        _resetRetries();
      },
      resetTimerTime: function resetTimerTime(time) {
        config.currentWaitTime = typeof time != "undefined" ? time : 0;
      },
      onAsyncIsReconnecting: function onAsyncIsReconnecting(event) {
        _sdkParams.sdkParams.consoleLogging && console.log("[SDK]|/| onAsyncIsReconnecting: ", "config.currentProtocol: ", config.currentProtocol, "config.currentWaitTime: ", config.currentWaitTime);
        publics.increaseRetries();

        if (config.currentWaitTime < 64) {
          config.currentWaitTime += 3;
        }

        if (!canRetry() && config.switchingEnabled) {
          _switchProtocol();
        }
      },
      getRetryStepTimerTime: function getRetryStepTimerTime() {
        return config.currentWaitTime;
      },
      reconnectAsync: function reconnectAsync() {
        publics.resetTimerTime();

        if (config.switchingEnabled) {
          if (canRetry()) {
            publics.increaseRetries();

            _switchProtocol(config.currentProtocol, false); // asyncClient.reconnectSocket();

          } else {
            _switchProtocol();
          }
        } else {
          // switchProtocol(config.currentProtocol);
          asyncClient.reconnectSocket();
        }
      }
    };
    return publics;
  }
  /*******************************************************
   *            P R I V A T E   M E T H O D S            *
   *******************************************************/


  var init = function init() {
    /**
     * Initialize Cache Databases
     */
    //startCacheDatabases(function () {
    if (_sdkParams.sdkParams.grantDeviceIdFromSSO) {
      var getDeviceIdWithTokenTime = new Date().getTime();
      getDeviceIdWithToken(function (retrievedDeviceId) {
        if (_sdkParams.sdkParams.actualTimingLog) {
          _utility["default"].chatStepLogger('Get Device ID ', new Date().getTime() - getDeviceIdWithTokenTime);
        }

        _sdkParams.sdkParams.deviceId = retrievedDeviceId;
        initAsync();
      });
    } else {
      initAsync();
    } //});

  },

  /**
   * Initialize Async
   *
   * Initializes Async module and sets proper callbacks
   *
   * @access private
   *
   * @return {undefined}
   * @return {undefined}
   */
  initAsync = function initAsync() {
    var asyncGetReadyTime = new Date().getTime();
    asyncClient = new _podasyncWsOnly["default"]({
      protocol: protocolManager.getCurrentProtocol(),
      queueHost: queueHost,
      queuePort: queuePort,
      queueUsername: queueUsername,
      queuePassword: queuePassword,
      queueReceive: queueReceive,
      queueSend: queueSend,
      queueConnectionTimeout: queueConnectionTimeout,
      socketAddress: _sdkParams.sdkParams.socketAddress,
      serverName: _sdkParams.sdkParams.serverName,
      deviceId: _sdkParams.sdkParams.deviceId,
      wsConnectionWaitTime: _sdkParams.sdkParams.wsConnectionWaitTime,
      connectionRetryInterval: _sdkParams.sdkParams.connectionRetryInterval,
      connectionCheckTimeout: _sdkParams.sdkParams.connectionCheckTimeout,
      connectionCheckTimeoutThreshold: _sdkParams.sdkParams.connectionCheckTimeoutThreshold,
      messageTtl: _sdkParams.sdkParams.messageTtl,
      reconnectOnClose: _sdkParams.sdkParams.reconnectOnClose,
      asyncLogging: _sdkParams.sdkParams.asyncLogging,
      logLevel: _sdkParams.sdkParams.consoleLogging ? 3 : 1,
      webrtcConfig: _sdkParams.sdkParams.webrtcConfig,
      retryStepTimerTime: protocolManager.getRetryStepTimerTime(),
      onStartWithRetryStepGreaterThanZero: onStateChange,
      msgLogCallback: msgLogCallback || null,
      onDeviceId: onDeviceId
    });

    function onDeviceId(deviceId) {
      if (!_sdkParams.sdkParams.deviceId) {
        _sdkParams.sdkParams.deviceId = deviceId;
      }

      asyncClient.registerDevice(_sdkParams.sdkParams.deviceId);
    }

    callModule.asyncInitialized(asyncClient);
    chatMessaging.asyncInitialized(asyncClient);
    asyncClient.on('asyncReady', function () {
      if (_sdkParams.sdkParams.actualTimingLog) {
        _utility["default"].chatStepLogger('Async Connection ', new Date().getTime() - asyncGetReadyTime);
      }

      peerId = asyncClient.getPeerId();

      if (!chatMessaging.userInfo) {
        getUserAndUpdateSDKState();
      } else if (chatMessaging.userInfo.id > 0) {
        chatMessaging.chatState = true;

        _events.chatEvents.fireEvent('chatReady');

        chatSendQueueHandler();
      }

      _sdkParams.sdkParams.deliveryInterval && clearInterval(_sdkParams.sdkParams.deliveryInterval);
      _sdkParams.sdkParams.deliveryInterval = setInterval(function () {
        if (Object.keys(_sdkParams.sdkParams.messagesDelivery).length) {
          messagesDeliveryQueueHandler();
        }
      }, _sdkParams.sdkParams.deliveryIntervalPitch);
      _sdkParams.sdkParams.seenInterval && clearInterval(_sdkParams.sdkParams.seenInterval);
      _sdkParams.sdkParams.seenInterval = setInterval(function () {
        if (Object.keys(_sdkParams.sdkParams.messagesSeen).length) {
          messagesSeenQueueHandler();
        }
      }, _sdkParams.sdkParams.seenIntervalPitch); //shouldReconnectCall();
    });
    asyncClient.on('stateChange', onStateChange);

    function onStateChange(state) {
      _events.chatEvents.fireEvent('chatState', state);

      chatFullStateObject = state;

      switch (state.socketState) {
        case 1:
          // CONNECTED
          protocolManager.resetRetries();
          protocolManager.resetTimerTime();

          if (state.deviceRegister && state.serverRegister) {
            // chatMessaging.chatState = true;
            // chatMessaging.ping();
            chatMessaging.startChatPing();
          }

          break;

        case 0:
          // CONNECTING
          chatMessaging.chatState = false;
          chatMessaging.stopChatPing();
          break;

        case 2:
          // CLOSING
          chatMessaging.chatState = false;
          chatMessaging.stopChatPing();
          break;

        case 3:
          // CLOSED
          chatMessaging.chatState = false;
          chatMessaging.stopChatPing(); // TODO: Check if this is OK or not?!
          //chatMessaging.sendPingTimeout && clearTimeout(chatMessaging.sendPingTimeout);

          break;
      }
    }

    asyncClient.on('connect', function (newPeerId) {
      asyncGetReadyTime = new Date().getTime();
      peerId = newPeerId;

      _events.chatEvents.fireEvent('connect');

      chatMessaging.ping();
    });
    asyncClient.on('disconnect', function (event) {
      oldPeerId = peerId;
      peerId = undefined;

      _events.chatEvents.fireEvent('disconnect', event);

      _events.chatEvents.fireEvent('callEvents', {
        type: 'CALL_ERROR',
        code: 7000,
        message: 'Call Socket is closed!',
        error: event
      });
    });
    asyncClient.on('reconnect', function (newPeerId) {
      peerId = newPeerId;

      _events.chatEvents.fireEvent('reconnect');
    });
    asyncClient.on('reconnecting', function (event) {
      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][event: asyncClient.reconnecting]");
      protocolManager.onAsyncIsReconnecting(event);
    });
    asyncClient.on('message', function (params, ack) {
      receivedAsyncMessageHandler(params);
      ack && ack();
    });
    asyncClient.on('error', function (error) {
      _events.chatEvents.fireEvent('error', {
        code: error.errorCode,
        message: error.errorMessage,
        error: error.errorEvent
      });
    });
  },
      getUserAndUpdateSDKState = function getUserAndUpdateSDKState() {
    var getUserInfoTime = new Date().getTime();
    getUserInfo(function (userInfoResult) {
      if (_sdkParams.sdkParams.actualTimingLog) {
        _utility["default"].chatStepLogger('Get User Info ', new Date().getTime() - getUserInfoTime);
      }

      if (!userInfoResult.hasError) {
        chatMessaging.userInfo = userInfoResult.result.user; // getAllThreads({
        //     summary: true,
        //     cache: false
        // });

        chatMessaging.chatState = true;

        _events.chatEvents.fireEvent('chatReady');

        chatSendQueueHandler();
      }
    });
  },

  /**
   * Get Device Id With Token
   *
   * If ssoGrantDevicesAddress set as TRUE, chat agent gets Device ID
   * from SSO server and passes it to Async Module
   *
   * @access private
   *
   * @param {function}  callback    The callback function to run after getting Device Id
   *
   * @return {undefined}
   */
  getDeviceIdWithToken = function getDeviceIdWithToken(callback) {
    var deviceId;
    var params = {
      url: SERVICE_ADDRESSES.SSO_ADDRESS + SERVICES_PATH.SSO_DEVICES,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
      }
    };
    httpRequest(params, function (result) {
      if (!result.hasError) {
        var devices = JSON.parse(result.result.responseText).devices;

        if (devices && devices.length > 0) {
          for (var i = 0; i < devices.length; i++) {
            if (devices[i].current) {
              deviceId = devices[i].uid;
              break;
            }
          }

          if (!deviceId) {
            _events.chatEvents.fireEvent('error', {
              code: 6000,
              message: CHAT_ERRORS[6000],
              error: null
            });
          } else {
            callback(deviceId);
          }
        } else {
          _events.chatEvents.fireEvent('error', {
            code: 6001,
            message: CHAT_ERRORS[6001],
            error: null
          });
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  },

  /**
   * Handshake with SSO to get user's keys
   *
   * In order to Encrypt and Decrypt cache we need a key.
   * We can retrieve encryption keys from SSO, all we
   * need to do is to do a handshake with SSO and
   * get the keys.
   *
   * @access private
   *
   * @param params
   * @param {function}  callback    The callback function to run after Generating Keys
   *
   * @return {undefined}
   */
  generateEncryptionKey = function generateEncryptionKey(params, callback) {
    var data = {
      validity: 10 * 365 * 24 * 60 * 60,
      // 10 Years
      renew: false,
      keyAlgorithm: 'aes',
      keySize: 256
    };

    if (params) {
      if (params.keyAlgorithm !== undefined) {
        data.keyAlgorithm = params.keyAlgorithm;
      }

      if (parseInt(params.keySize) > 0) {
        data.keySize = params.keySize;
      }
    }

    var httpRequestParams = {
      url: SERVICE_ADDRESSES.SSO_ADDRESS + SERVICES_PATH.SSO_GENERATE_KEY,
      method: 'POST',
      data: data,
      headers: {
        'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
      }
    };
    httpRequest(httpRequestParams, function (result) {
      if (!result.hasError) {
        try {
          var response = JSON.parse(result.result.responseText);
        } catch (e) {
          _sdkParams.sdkParams.consoleLogging && console.log(e);
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.error,
          message: result.error_description,
          error: result
        });
      }
    });
  },

  /**
   * Get Encryption Keys by KeyId
   *
   * In order to Encrypt and Decrypt cache we need a key.
   * We can retrieve encryption keys from SSO by sending
   * KeyId to SSO and get related keys
   *
   * @access private
   *
   * @param params
   * @param {function}  callback    The callback function to run after getting Keys
   *
   * @return {undefined}
   */
  getEncryptionKey = function getEncryptionKey(params, callback) {
    var keyId;

    if (params) {
      if (typeof params.keyId !== 'undefined') {
        keyId = params.keyId;
        var httpRequestParams = {
          url: SERVICE_ADDRESSES.SSO_ADDRESS + SERVICES_PATH.SSO_GET_KEY + keyId,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
          }
        };
        httpRequest(httpRequestParams, function (result) {
          if (!result.hasError) {
            try {
              var response = JSON.parse(result.result.responseText);
            } catch (e) {
              _sdkParams.sdkParams.consoleLogging && console.log(e);
            }

            callback && callback({
              hasError: false,
              secretKey: response.secretKey
            });
          } else {
            callback && callback({
              hasError: true,
              code: result.errorCode,
              message: result.errorMessage
            });

            _events.chatEvents.fireEvent('error', {
              code: result.errorCode,
              message: result.errorMessage,
              error: result
            });
          }
        });
      }
    }
  },

  /**
   * HTTP Request class
   *
   * Manages all HTTP Requests
   *
   * @access private
   *
   * @param {object}    params      Given parameters including (Headers, ...)
   * @param {function}  callback    The callback function to run after
   *
   * @return {undefined}
   */
  httpRequest = function httpRequest(params, callback) {
    var url = params.url,
        xhrResponseType = params.responseType || 'text',
        fileSize,
        originalFileName,
        threadId,
        fileUniqueId,
        fileObject,
        data = params.data,
        method = typeof params.method == 'string' ? params.method : 'GET',
        fileUploadUniqueId = typeof params.uniqueId == 'string' ? params.uniqueId : 'uniqueId',
        hasError = false;

    if (!url) {
      callback({
        hasError: true,
        errorCode: 6201,
        errorMessage: CHAT_ERRORS[6201]
      });
      return;
    }

    var hasFile = false;
    httpRequestObject[eval('fileUploadUniqueId')] = new XMLHttpRequest();
    var settings = params.settings;
    httpRequestObject[eval('fileUploadUniqueId')].responseType = xhrResponseType;

    if (data && (0, _typeof2["default"])(data) === 'object' && (data.hasOwnProperty('image') || data.hasOwnProperty('file'))) {
      httpRequestObject[eval('fileUploadUniqueId')].timeout = settings && (0, _typeof2["default"])(parseInt(settings.uploadTimeout)) > 0 && settings.uploadTimeout > 0 ? settings.uploadTimeout : _sdkParams.sdkParams.httpUploadRequestTimeout;
    } else {
      httpRequestObject[eval('fileUploadUniqueId')].timeout = settings && (0, _typeof2["default"])(parseInt(settings.timeout)) > 0 && settings.timeout > 0 ? settings.timeout : _sdkParams.sdkParams.httpRequestTimeout;
    }

    httpRequestObject[eval('fileUploadUniqueId')].addEventListener('error', function (event) {
      if (callback && method === 'POST') {
        if (hasFile) {
          hasError = true;

          _events.chatEvents.fireEvent('fileUploadEvents', {
            threadId: threadId,
            uniqueId: fileUniqueId,
            state: 'UPLOAD_ERROR',
            progress: 0,
            fileInfo: {
              fileName: originalFileName,
              fileSize: fileSize
            },
            fileObject: fileObject,
            errorCode: 6200,
            errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
          });
        }

        callback({
          hasError: true,
          errorCode: 6200,
          errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
        });
      } else {
        if (callback) {
          callback({
            hasError: true,
            errorCode: 6200,
            errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
          });
        }

        if (params.enableDownloadProgressEvents) {
          _events.chatEvents.fireEvent('fileDownloadEvents', {
            hashCode: params.hashCode,
            state: 'DOWNLOAD_ERROR',
            errorCode: 6200,
            errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
          });
        }
      }
    }, false);

    if (params.enableDownloadProgressEvents) {
      httpRequestObject[eval('fileUploadUniqueId')].onprogress = function (event) {
        _events.chatEvents.fireEvent('fileDownloadEvents', {
          hashCode: params.hashCode,
          state: 'DOWNLOADING',
          progress: Math.round(event.loaded / event.total * 100)
        });
      };
    }

    httpRequestObject[eval('fileUploadUniqueId')].addEventListener('abort', function (event) {
      if (callback) {
        if (hasFile) {
          hasError = true;

          _events.chatEvents.fireEvent('fileUploadEvents', {
            threadId: threadId,
            uniqueId: fileUniqueId,
            state: 'UPLOAD_CANCELED',
            progress: 0,
            fileInfo: {
              fileName: originalFileName,
              fileSize: fileSize
            },
            fileObject: fileObject,
            errorCode: 6303,
            errorMessage: CHAT_ERRORS[6303]
          });
        }

        callback({
          hasError: true,
          errorCode: 6303,
          errorMessage: CHAT_ERRORS[6303]
        });
      }
    }, false);

    try {
      if (method === 'GET') {
        if ((0, _typeof2["default"])(data) === 'object' && data !== null) {
          var keys = Object.keys(data);

          if (keys.length > 0) {
            url += '?';

            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              url += key + '=' + data[key];

              if (i < keys.length - 1) {
                url += '&';
              }
            }
          }
        } else if (typeof data === 'string') {
          url += '?' + data;
        }

        httpRequestObject[eval('fileUploadUniqueId')].open(method, url, true);

        if ((0, _typeof2["default"])(params.headers) === 'object') {
          for (var key in params.headers) {
            if (params.headers.hasOwnProperty(key)) httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader(key, params.headers[key]);
          }
        }

        httpRequestObject[eval('fileUploadUniqueId')].send();
      }

      if (method === 'POST' && data) {
        httpRequestObject[eval('fileUploadUniqueId')].open(method, url, true);

        if ((0, _typeof2["default"])(params.headers) === 'object') {
          for (var key in params.headers) {
            if (params.headers.hasOwnProperty(key)) httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader(key, params.headers[key]);
          }
        }

        if ((0, _typeof2["default"])(data) == 'object') {
          if (data.hasOwnProperty('image') || data.hasOwnProperty('file')) {
            hasFile = true;
            var formData = new FormData();

            for (var key in data) {
              if (data.hasOwnProperty(key)) formData.append(key, data[key]);
            }

            fileSize = data.fileSize;
            originalFileName = data.originalFileName;
            threadId = data.threadId;
            fileUniqueId = data.uniqueId;
            fileObject = data['image'] ? data['image'] : data['file'];

            httpRequestObject[eval('fileUploadUniqueId')].upload.onprogress = function (event) {
              if (event.lengthComputable && !hasError) {
                _events.chatEvents.fireEvent('fileUploadEvents', {
                  threadId: threadId,
                  uniqueId: fileUniqueId,
                  state: 'UPLOADING',
                  progress: Math.round(event.loaded / event.total * 100),
                  fileInfo: {
                    fileName: originalFileName,
                    fileSize: fileSize
                  },
                  fileObject: fileObject
                });
              }
            };

            httpRequestObject[eval('fileUploadUniqueId')].send(formData);
          } else {
            httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            var keys = Object.keys(data);

            if (keys.length > 0) {
              var sendData = '';

              for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                sendData += key + '=' + data[key];

                if (i < keys.length - 1) {
                  sendData += '&';
                }
              }
            }

            httpRequestObject[eval('fileUploadUniqueId')].send(sendData);
          }
        } else {
          httpRequestObject[eval('fileUploadUniqueId')].send(data);
        }
      }
    } catch (e) {
      callback && callback({
        hasError: true,
        cache: false,
        errorCode: 6200,
        errorMessage: CHAT_ERRORS[6200] + ' (Request Catch Error)' + e
      });
    }

    httpRequestObject[eval('fileUploadUniqueId')].onreadystatechange = function () {
      if (httpRequestObject[eval('fileUploadUniqueId')].readyState === 4) {
        if (httpRequestObject[eval('fileUploadUniqueId')].status === 200) {
          if (hasFile) {
            hasError = false;
            var fileHashCode = '';

            try {
              var fileUploadResult = JSON.parse(httpRequestObject[eval('fileUploadUniqueId')].response);

              if (!!fileUploadResult && fileUploadResult.hasOwnProperty('result')) {
                fileHashCode = fileUploadResult.result.hashCode;
              }
            } catch (e) {
              _sdkParams.sdkParams.consoleLogging && console.log(e);
            }

            _events.chatEvents.fireEvent('fileUploadEvents', {
              threadId: threadId,
              uniqueId: fileUniqueId,
              fileHash: fileHashCode,
              state: 'UPLOADED',
              progress: 100,
              fileInfo: {
                fileName: originalFileName,
                fileSize: fileSize
              },
              fileObject: fileObject
            });
          }

          callback && callback({
            hasError: false,
            cache: false,
            result: {
              response: httpRequestObject[eval('fileUploadUniqueId')].response,
              responseText: xhrResponseType === 'text' ? httpRequestObject[eval('fileUploadUniqueId')].responseText : '',
              responseHeaders: httpRequestObject[eval('fileUploadUniqueId')].getAllResponseHeaders(),
              responseContentType: httpRequestObject[eval('fileUploadUniqueId')].getResponseHeader('content-type')
            }
          });
        } else {
          if (hasFile) {
            hasError = true;

            _events.chatEvents.fireEvent('fileUploadEvents', {
              threadId: threadId,
              uniqueId: fileUniqueId,
              state: 'UPLOAD_ERROR',
              progress: 0,
              fileInfo: {
                fileName: originalFileName,
                fileSize: fileSize
              },
              fileObject: fileObject,
              errorCode: 6200,
              errorMessage: CHAT_ERRORS[6200] + ' (Request Status != 200)',
              statusCode: httpRequestObject[eval('fileUploadUniqueId')].status
            });
          }

          callback && callback({
            hasError: true,
            errorMessage: xhrResponseType === 'text' ? httpRequestObject[eval('fileUploadUniqueId')].responseText : 'ُAn error accoured!',
            errorCode: httpRequestObject[eval('fileUploadUniqueId')].status
          });
        }
      }
    };
  },

  /**
   * Get User Info
   *
   * This functions gets user info from chat serverName.
   * If info is not retrived the function will attemp
   * 5 more times to get info from erver
   *
   * @recursive
   * @access private
   *
   * @param {function}    callback    The callback function to call after
   *
   * @return {object} Instant function return
   */
  getUserInfo = function getUserInfoRecursive(callback) {
    getUserInfoRetryCount++;

    if (getUserInfoRetryCount > getUserInfoRetry) {
      _sdkParams.sdkParams.getUserInfoTimeout && clearTimeout(_sdkParams.sdkParams.getUserInfoTimeout);
      getUserInfoRetryCount = 0;

      _events.chatEvents.fireEvent('error', {
        code: 6101,
        message: CHAT_ERRORS[6101],
        error: null
      });
    } else {
      _sdkParams.sdkParams.getUserInfoTimeout && clearTimeout(_sdkParams.sdkParams.getUserInfoTimeout);
      _sdkParams.sdkParams.getUserInfoTimeout = setTimeout(function () {
        getUserInfoRecursive(callback);
      }, getUserInfoRetryCount * 10000);
      return chatMessaging.sendMessage({
        chatMessageVOType: _constants.chatMessageVOTypes.USER_INFO,
        typeCode: _sdkParams.sdkParams.generalTypeCode //params.typeCode

      }, {
        onResult: function onResult(result) {
          var returnData = {
            hasError: result.hasError,
            cache: false,
            errorMessage: result.errorMessage,
            errorCode: result.errorCode
          };

          if (!returnData.hasError) {
            _sdkParams.sdkParams.getUserInfoTimeout && clearTimeout(_sdkParams.sdkParams.getUserInfoTimeout);
            var messageContent = result.result;
            var currentUser = formatDataToMakeUser(messageContent);
            returnData.result = {
              user: currentUser
            };
            getUserInfoRetryCount = 0;
            callback && callback(returnData);
            /**
             * Delete callback so if server pushes response
             * before cache, cache won't send data again
             */

            callback = undefined;
          }
        }
      });
    }
  },
      sendSystemMessage = function sendSystemMessage(params) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.SYSTEM_MESSAGE,
      subjectId: params.threadId,
      content: params.content,
      uniqueId: params.uniqueId,
      pushMsgType: 3
    });
  },

  /**
   * Chat Send Message Queue Handler
   *
   * Whenever something pushes into cahtSendQueue
   * this function invokes and does the message
   * sending progress throught async
   *
   * @access private
   *
   * @return {undefined}
   */
  chatSendQueueHandler = function chatSendQueueHandler() {
    if (chatSendQueue.length) {
      var messageToBeSend = chatSendQueue[0];
      /**
       * Getting chatSendQueue from either cache or
       * memory and scrolling through the send queue
       * to send all the messages which are waiting
       * for chatMessaging.chatState to become TRUE
       *
       * There is a small possibility that a Message
       * wouldn't make it through network, so it Will
       * not reach chat server. To avoid losing those
       * messages, we put a clone of every message
       * in waitQ, and when ack of the message comes,
       * we delete that message from waitQ. otherwise
       * we assume that these messages have been failed to
       * send and keep them to be either canceled or resent
       * by user later. When user calls getHistory(), they
       * will have failed messages alongside with typical
       * messages history.
       */

      if (chatMessaging.chatState) {
        getChatSendQueue(0, function (chatSendQueue) {
          deleteFromChatSentQueue(messageToBeSend, function () {
            chatMessaging.sendMessage(messageToBeSend.message, messageToBeSend.callbacks, function () {
              if (chatSendQueue.length) {
                chatSendQueueHandler();
              }
            });
          });
        });
      }
    }
  },
      putInMessagesDeliveryQueue = function putInMessagesDeliveryQueue(threadId, messageId) {
    if (_sdkParams.sdkParams.messagesDelivery.hasOwnProperty(threadId) && typeof _sdkParams.sdkParams.messagesDelivery[threadId] === 'number' && !!_sdkParams.sdkParams.messagesDelivery[threadId]) {
      if (_sdkParams.sdkParams.messagesDelivery[threadId] < messageId) {
        _sdkParams.sdkParams.messagesDelivery[threadId] = messageId;
      }
    } else {
      _sdkParams.sdkParams.messagesDelivery[threadId] = messageId;
    }
  },
      putInMessagesSeenQueue = function putInMessagesSeenQueue(threadId, messageId) {
    if (_sdkParams.sdkParams.messagesSeen.hasOwnProperty(threadId) && typeof _sdkParams.sdkParams.messagesSeen[threadId] === 'number' && !!_sdkParams.sdkParams.messagesSeen[threadId]) {
      if (_sdkParams.sdkParams.messagesSeen[threadId] < messageId) {
        _sdkParams.sdkParams.messagesSeen[threadId] = messageId;
      }
    } else {
      _sdkParams.sdkParams.messagesSeen[threadId] = messageId;
    }
  },

  /**
   * Messages Delivery Queue Handler
   *
   * Whenever something pushes into messagesDelivery
   * this function invokes and does the message
   * delivery progress throught async
   *
   * @access private
   *
   * @return {undefined}
   */
  messagesDeliveryQueueHandler = function messagesDeliveryQueueHandler() {
    if (Object.keys(_sdkParams.sdkParams.messagesDelivery).length) {
      if (chatMessaging.chatState) {
        for (var key in _sdkParams.sdkParams.messagesDelivery) {
          deliver({
            messageId: _sdkParams.sdkParams.messagesDelivery[key]
          });
          delete _sdkParams.sdkParams.messagesDelivery[key];
        }
      }
    }
  },

  /**
   * Messages Seen Queue Handler
   *
   * Whenever something pushes into messagesSeen
   * this function invokes and does the message
   * seen progress throught async
   *
   * @access private
   *
   * @return {undefined}
   */
  messagesSeenQueueHandler = function messagesSeenQueueHandler() {
    if (Object.keys(_sdkParams.sdkParams.messagesSeen).length) {
      if (chatMessaging.chatState) {
        for (var key in _sdkParams.sdkParams.messagesSeen) {
          seen({
            messageId: _sdkParams.sdkParams.messagesSeen[key]
          });
          delete _sdkParams.sdkParams.messagesSeen[key];
        }
      }
    }
  },

  /**
   * Clear Cache
   *
   * Clears Async queue so that all the remained messages will be
   * ignored
   *
   * @access private
   *
   * @return {undefined}
   */
  clearChatServerCaches = function clearChatServerCaches() {
    chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.LOGOUT,
      pushMsgType: 3
    });
  },

  /**
   * Received Async Message Handler
   *
   * This functions parses received message from async
   *
   * @access private
   *
   * @param {object}    asyncMessage    Received Message from Async
   *
   * @return {undefined}
   */
  receivedAsyncMessageHandler = function receivedAsyncMessageHandler(asyncMessage) {
    /**
     * + Message Received From Async      {object}
     *    - id                            {int}
     *    - senderMessageId               {int}
     *    - senderName                    {string}
     *    - senderId                      {int}
     *    - type                          {int}
     *    - content                       {string}
     */
    if (asyncMessage.senderName === _sdkParams.sdkParams.serverName) {
      var content = JSON.parse(asyncMessage.content);
      chatMessageHandler(content);
    } else {
      callModule.callMessageHandler(asyncMessage);
    }
  },

  /**
   * Chat Message Handler
   *
   * Manages received chat messages and do the job
   *
   * @access private
   *
   * @param {object}    chatMessage     Content of Async Message which is considered as Chat Message
   *
   * @return {undefined}
   */
  chatMessageHandler = function chatMessageHandler(chatMessage) {
    if (chatMessage.typeCode && chatMessage.typeCode !== _sdkParams.sdkParams.generalTypeCode) {
      return;
    }

    var threadId = chatMessage.subjectId,
        type = chatMessage.type,
        messageContent = typeof chatMessage.content === 'string' && _utility["default"].isValidJson(chatMessage.content) ? JSON.parse(chatMessage.content) : chatMessage.content,
        contentCount = chatMessage.contentCount,
        uniqueId = chatMessage.uniqueId,
        time = chatMessage.time;
    chatMessaging.asyncRequestTimeouts[uniqueId] && clearTimeout(chatMessaging.asyncRequestTimeouts[uniqueId]);

    switch (type) {
      /**
       * Type 1    Get Threads
       */
      case _constants.chatMessageVOTypes.CREATE_THREAD:
        messageContent.uniqueId = uniqueId;

        if (chatMessaging.messagesCallbacks[uniqueId]) {
          createThread(messageContent, true, true);
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        } else {
          createThread(messageContent, true, false);
        }

        break;

      /**
       * Type 2    Message
       */

      case _constants.chatMessageVOTypes.MESSAGE:
        newMessageHandler(threadId, messageContent);
        break;

      /**
       * Type 3    Message Sent
       */

      case _constants.chatMessageVOTypes.SENT:
        if (chatMessaging.sendMessageCallbacks[uniqueId] && chatMessaging.sendMessageCallbacks[uniqueId].onSent) {
          chatMessaging.sendMessageCallbacks[uniqueId].onSent({
            uniqueId: uniqueId,
            messageId: messageContent,
            threadId: threadId
          });
          delete chatMessaging.sendMessageCallbacks[uniqueId].onSent;
          if (chatMessaging.threadCallbacks[threadId]) chatMessaging.threadCallbacks[threadId][uniqueId].onSent = true;
        }

        break;

      /**
       * Type 4    Message Delivery
       */

      case _constants.chatMessageVOTypes.DELIVERY:
        var threadObject = {
          id: messageContent.conversationId,
          lastSeenMessageId: messageContent.messageId,
          lastSeenMessageTime: messageContent.messageTime,
          lastParticipantId: messageContent.participantId
        };

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_LAST_ACTIVITY_TIME',
          result: {
            thread: threadObject
          }
        }); // if (fullResponseObject) {
        //     getHistory({
        //         offset: 0,
        //         threadId: threadId,
        //         id: messageContent.messageId,
        //         cache: false
        //     }, function (result) {
        //         if (!result.hasError) {
        //             chatEvents.fireEvent('messageEvents', {
        //                 type: 'MESSAGE_DELIVERY',
        //                 result: {
        //                     message: result.result.history[0],
        //                     threadId: threadId,
        //                     senderId: messageContent.participantId
        //                 }
        //             });
        //         }
        //     });
        // } else {
        //     chatEvents.fireEvent('messageEvents', {
        //         type: 'MESSAGE_DELIVERY',
        //         result: {
        //             message: messageContent.messageId,
        //             threadId: threadId,
        //             senderId: messageContent.participantId
        //         }
        //     });
        // }


        sendMessageCallbacksHandler(_constants.chatMessageVOTypes.DELIVERY, threadId, uniqueId);
        break;

      /**
       * Type 5    Message Seen
       */

      case _constants.chatMessageVOTypes.SEEN:
        var threadObject = {
          id: messageContent.conversationId,
          lastSeenMessageId: messageContent.messageId,
          lastSeenMessageTime: messageContent.messageTime,
          lastParticipantId: messageContent.participantId
        };

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_LAST_ACTIVITY_TIME',
          result: {
            thread: threadObject
          }
        });

        _events.chatEvents.fireEvent('messageEvents', {
          type: 'MESSAGE_SEEN',
          result: {
            message: messageContent.messageId,
            threadId: threadId,
            senderId: messageContent.participantId
          }
        });

        sendMessageCallbacksHandler(_constants.chatMessageVOTypes.SEEN, threadId, uniqueId);
        break;

      /**
       * Type 6    Chat Ping
       */

      case _constants.chatMessageVOTypes.PING:
        break;

      /**
       * Type 7    Block Contact
       */

      case _constants.chatMessageVOTypes.BLOCK:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        break;

      /**
       * Type 8    Unblock Blocked User
       */

      case _constants.chatMessageVOTypes.UNBLOCK:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        break;

      /**
       * Type 9   Leave Thread
       */

      case _constants.chatMessageVOTypes.LEAVE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            if (!threadsResult.cache) {
              var threads = threadsResult.result.threads;

              if (threads.length > 0) {
                _events.chatEvents.fireEvent('threadEvents', {
                  type: 'THREAD_LEAVE_PARTICIPANT',
                  result: {
                    thread: threads[0],
                    participant: formatDataToMakeParticipant(messageContent, threadId)
                  }
                });

                _events.chatEvents.fireEvent('threadEvents', {
                  type: 'THREAD_LAST_ACTIVITY_TIME',
                  result: {
                    thread: threads[0]
                  }
                });
              } else {
                _events.chatEvents.fireEvent('threadEvents', {
                  type: 'THREAD_LEAVE_PARTICIPANT',
                  result: {
                    threadId: threadId,
                    participant: formatDataToMakeParticipant(messageContent, threadId)
                  }
                });
              }
            }
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LEAVE_PARTICIPANT',
            result: {
              thread: threadId,
              participant: formatDataToMakeParticipant(messageContent, threadId)
            }
          });

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LAST_ACTIVITY_TIME',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 11    Add Participant to Thread
       */

      case _constants.chatMessageVOTypes.ADD_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [messageContent.id]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_ADD_PARTICIPANTS',
                result: {
                  thread: threads[0]
                }
              });

              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_LAST_ACTIVITY_TIME',
                result: {
                  thread: threads[0]
                }
              });
            }
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_ADD_PARTICIPANTS',
            result: {
              thread: messageContent
            }
          });

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LAST_ACTIVITY_TIME',
            result: {
              thread: messageContent
            }
          });
        }

        break;

      /**
       * Type 13    Get Contacts List
       */

      case _constants.chatMessageVOTypes.GET_CONTACTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 14    Get Threads List
       */

      case _constants.chatMessageVOTypes.GET_THREADS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 15    Get Message History of an Thread
       */

      case _constants.chatMessageVOTypes.GET_HISTORY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 17    Remove sb from thread
       */

      case _constants.chatMessageVOTypes.REMOVED_FROM_THREAD:
        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_REMOVED_FROM',
          result: {
            thread: threadId
          }
        });

        break;

      /**
       * Type 18    Remove a participant from Thread
       */

      case _constants.chatMessageVOTypes.REMOVE_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_REMOVE_PARTICIPANTS',
                result: {
                  thread: threads[0]
                }
              });

              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_LAST_ACTIVITY_TIME',
                result: {
                  thread: threads[0]
                }
              });
            }
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_REMOVE_PARTICIPANTS',
            result: {
              thread: threadId
            }
          });

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LAST_ACTIVITY_TIME',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 19    Mute Thread
       */

      case _constants.chatMessageVOTypes.MUTE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var thread = threadsResult.result.threads[0];
            thread.mute = true;

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_MUTE',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_MUTE',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 20    Unmute muted Thread
       */

      case _constants.chatMessageVOTypes.UNMUTE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var thread = threadsResult.result.threads[0];
            thread.mute = false;

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_UNMUTE',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_UNMUTE',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 21    Update Thread Info
       */

      case _constants.chatMessageVOTypes.UPDATE_THREAD_INFO:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [messageContent.id],
            cache: false
          }, function (threadsResult) {
            var thread = formatDataToMakeConversation(threadsResult.result.threads[0]);

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_INFO_UPDATED',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_INFO_UPDATED',
            result: {
              thread: messageContent
            }
          });
        }

        break;

      /**
       * Type 22    Forward Multiple Messages
       */

      case _constants.chatMessageVOTypes.FORWARD_MESSAGE:
        newMessageHandler(threadId, messageContent);
        break;

      /**
       * Type 23    User Info
       */

      case _constants.chatMessageVOTypes.USER_INFO:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('systemEvents', {
          type: 'SERVER_TIME',
          result: {
            time: time
          }
        });

        break;

      /**
       * Type 25    Get Blocked List
       */

      case _constants.chatMessageVOTypes.GET_BLOCKED:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 27    Thread Participants List
       */

      case _constants.chatMessageVOTypes.THREAD_PARTICIPANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 28    Edit Message
       */

      case _constants.chatMessageVOTypes.EDIT_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        chatEditMessageHandler(threadId, messageContent);
        break;

      /**
       * Type 29    Delete Message
       */

      case _constants.chatMessageVOTypes.DELETE_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        var msgTime = parseInt(parseInt(messageContent.time) / 1000) * 1000000000 + parseInt(messageContent.timeNanos);
        if (_store.store.threads.get(threadId)) _store.store.threads.get(threadId).unreadCount.decrease(msgTime);

        if (messageContent.pinned) {
          unPinMessage({
            messageId: messageContent.id,
            notifyAll: true
          });
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          var time, timeMiliSeconds;

          if (messageContent.time.toString().length > 14) {
            time = messageContent.time;
            timeMiliSeconds = parseInt(messageContent.time / 1000000);
          } else {
            time = messageContent.timeNanos ? parseInt(parseInt(messageContent.time) / 1000) * 1000000000 + parseInt(messageContent.timeNanos) : parseInt(pushMessageVO.time);
            timeMiliSeconds = parseInt(messageContent.time);
          }

          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('messageEvents', {
                type: 'MESSAGE_DELETE',
                result: {
                  message: {
                    id: messageContent.id,
                    pinned: messageContent.pinned,
                    threadId: threadId,
                    time: time,
                    timeMiliSeconds: timeMiliSeconds,
                    timeNanos: messageContent.timeNanos
                  }
                }
              });

              if (messageContent.pinned) {
                _events.chatEvents.fireEvent('threadEvents', {
                  type: 'THREAD_LAST_ACTIVITY_TIME',
                  result: {
                    thread: threads[0]
                  }
                });
              }
            }
          });
        } else {
          _events.chatEvents.fireEvent('messageEvents', {
            type: 'MESSAGE_DELETE',
            result: {
              message: {
                id: messageContent.id,
                pinned: messageContent.pinned,
                threadId: threadId,
                time: time,
                timeMiliSeconds: timeMiliSeconds,
                timeNanos: messageContent.timeNanos
              }
            }
          });

          if (messageContent.pinned) {
            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_LAST_ACTIVITY_TIME',
              result: {
                thread: threadId
              }
            });
          }
        }

        break;

      /**
       * Type 30    Thread Info Updated
       */

      case _constants.chatMessageVOTypes.THREAD_INFO_UPDATED:
        // TODO: Check this line again
        // if (!messageContent.conversation && !messageContent.conversation.id) {
        //     messageContent.conversation.id = threadId;
        // }
        //
        // var thread = formatDataToMakeConversation(messageContent.conversation);
        var thread = formatDataToMakeConversation(messageContent);

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_INFO_UPDATED',
          result: {
            thread: thread
          }
        });

        break;

      /**
       * Type 31    Thread Last Seen Updated
       */

      case _constants.chatMessageVOTypes.LAST_SEEN_UPDATED:
        var threadObject = messageContent;
        threadObject.unreadCount = messageContent.unreadCount ? messageContent.unreadCount : 0;
        threadObject.lastSeenMessageTime = messageContent.lastSeenMessageNanos ? parseInt(parseInt(messageContent.lastSeenMessageTime) / 1000) * 1000000000 + parseInt(messageContent.lastSeenMessageNanos) : parseInt(messageContent.lastSeenMessageTime);

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_UNREAD_COUNT_UPDATED',
          result: {
            thread: threadObject,
            unreadCount: messageContent.unreadCount ? messageContent.unreadCount : 0
          }
        });

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_LAST_SEEN_UPDATED',
          result: {
            thread: threadObject,
            unreadCount: messageContent.unreadCount ? messageContent.unreadCount : 0
          }
        });

        if (_store.store.threads.get(threadId) && (!_store.store.threads.get(threadId).lastSeenMessageTime.get() || _store.store.threads.get(threadId).lastSeenMessageTime.get() && threadObject.lastSeenMessageTime > _store.store.threads.get(threadId).lastSeenMessageTime.get() && threadObject.unreadCount < _store.store.threads.get(threadId).unreadCount.get())) {
          var localThreadLastSeenUpdated = JSON.parse(JSON.stringify(messageContent));

          _store.store.threads.save(localThreadLastSeenUpdated);

          _store.store.threads.get(threadId).lastSeenMessageTime.set(threadObject.lastSeenMessageTime);

          _store.store.threads.get(threadId).unreadCount.set(messageContent.unreadCount);
        } // if (fullResponseObject) {
        //     getThreads({
        //         threadIds: [messageContent.id]
        //     }, function (threadsResult) {
        //         var threads = threadsResult.result.threads;
        //
        //         if (!threadsResult.cache) {
        //             chatEvents.fireEvent('threadEvents', {
        //                 type: 'THREAD_UNREAD_COUNT_UPDATED',
        //                 result: {
        //                     thread: threads[0],
        //                     unreadCount: (messageContent.unreadCount) ? messageContent.unreadCount : 0
        //                 }
        //             });
        //
        //             chatEvents.fireEvent('threadEvents', {
        //                 type: 'THREAD_LAST_ACTIVITY_TIME',
        //                 result: {
        //                     thread: threads[0]
        //                 }
        //             });
        //         }
        //     });
        // } else {
        //     chatEvents.fireEvent('threadEvents', {
        //         type: 'THREAD_UNREAD_COUNT_UPDATED',
        //         result: {
        //             thread: threadId,
        //             unreadCount: (messageContent.unreadCount) ? messageContent.unreadCount : 0
        //         }
        //     });
        //
        //     chatEvents.fireEvent('threadEvents', {
        //         type: 'THREAD_LAST_ACTIVITY_TIME',
        //         result: {
        //             thread: threadId
        //         }
        //     });
        // }


        break;

      /**
       * Type 32    Get Message Delivered List
       */

      case _constants.chatMessageVOTypes.GET_MESSAGE_DELIVERY_PARTICIPANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 33    Get Message Seen List
       */

      case _constants.chatMessageVOTypes.GET_MESSAGE_SEEN_PARTICIPANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 34    Is Public Group Name Available?
       */

      case _constants.chatMessageVOTypes.IS_NAME_AVAILABLE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 39    Join Public Group or Channel
       */

      case _constants.chatMessageVOTypes.JOIN_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 40    Bot Messages
       */

      case _constants.chatMessageVOTypes.BOT_MESSAGE:
        _events.chatEvents.fireEvent('botEvents', {
          type: 'BOT_MESSAGE',
          result: {
            bot: messageContent
          }
        });

        break;

      /**
       * Type 41    Spam P2P Thread
       */

      case _constants.chatMessageVOTypes.SPAM_PV_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        break;

      /**
       * Type 42    Set Role To User
       */

      case _constants.chatMessageVOTypes.SET_ROLE_TO_USER:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [messageContent.id]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_ADD_ADMIN',
                result: {
                  thread: threads[0],
                  admin: messageContent
                }
              });

              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_LAST_ACTIVITY_TIME',
                result: {
                  thread: threads[0],
                  admin: messageContent
                }
              });
            }
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_ADD_ADMIN',
            result: {
              thread: threadId,
              admin: messageContent
            }
          });

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LAST_ACTIVITY_TIME',
            result: {
              thread: threadId,
              admin: messageContent
            }
          });
        }

        break;

      /**
       * Type 43    Remove Role From User
       */

      case _constants.chatMessageVOTypes.REMOVE_ROLE_FROM_USER:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [messageContent.id]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_REMOVE_ADMIN',
                result: {
                  thread: threads[0],
                  admin: messageContent
                }
              });

              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_LAST_ACTIVITY_TIME',
                result: {
                  thread: threads[0],
                  admin: messageContent
                }
              });
            }
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_REMOVE_ADMIN',
            result: {
              thread: threadId,
              admin: messageContent
            }
          });

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_LAST_ACTIVITY_TIME',
            result: {
              thread: threadId,
              admin: messageContent
            }
          });
        }

        break;

      /**
       * Type 44    Clear History
       */

      case _constants.chatMessageVOTypes.CLEAR_HISTORY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        break;

      /**
       * Type 46    System Messages
       */

      case _constants.chatMessageVOTypes.SYSTEM_MESSAGE:
        _events.chatEvents.fireEvent('systemEvents', {
          type: 'IS_TYPING',
          result: {
            thread: threadId,
            user: messageContent
          }
        });

        break;

      /**
       * Type 47    Get Not Seen Duration
       */

      case _constants.chatMessageVOTypes.GET_NOT_SEEN_DURATION:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        break;

      /**
       * Type 48    Pin Thread
       */

      case _constants.chatMessageVOTypes.PIN_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var thread = threadsResult.result.threads[0];

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_PIN',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_PIN',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 49    UnPin Thread
       */

      case _constants.chatMessageVOTypes.UNPIN_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var thread = threadsResult.result.threads[0];

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_UNPIN',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_UNPIN',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 50    Pin Message
       */

      case _constants.chatMessageVOTypes.PIN_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'MESSAGE_PIN',
          result: {
            thread: threadId,
            pinMessage: formatDataToMakePinMessage(threadId, messageContent)
          }
        });

        break;

      /**
       * Type 51    UnPin Message
       */

      case _constants.chatMessageVOTypes.UNPIN_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'MESSAGE_UNPIN',
          result: {
            thread: threadId,
            pinMessage: formatDataToMakePinMessage(threadId, messageContent)
          }
        });

        break;

      /**
       * Type 52    Update Chat Profile
       */

      case _constants.chatMessageVOTypes.UPDATE_CHAT_PROFILE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('userEvents', {
          type: 'CHAT_PROFILE_UPDATED',
          result: {
            user: messageContent
          }
        });

        break;

      /**
       * Type 53    Change Thread Privacy
       */

      case _constants.chatMessageVOTypes.CHANGE_THREAD_PRIVACY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_PRIVACY_CHANGED',
          result: {
            thread: messageContent
          }
        });

        break;

      /**
       * Type 54    Get Participant Roles
       */

      case _constants.chatMessageVOTypes.GET_PARTICIPANT_ROLES:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('userEvents', {
          type: 'GET_PARTICIPANT_ROLES',
          result: {
            roles: messageContent
          }
        });

        break;

      /**
       * Type 60    Get Contact Not Seen Duration
       */

      case _constants.chatMessageVOTypes.GET_CONTACT_NOT_SEEN_DURATION:
        _events.chatEvents.fireEvent('contactEvents', {
          type: 'CONTACTS_LAST_SEEN',
          result: messageContent
        });

        break;

      /**
       * Type 61      Get All Unread Message Count
       */

      case _constants.chatMessageVOTypes.ALL_UNREAD_MESSAGE_COUNT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('systemEvents', {
          type: 'ALL_UNREAD_MESSAGES_COUNT',
          result: messageContent
        });

        break;

      /**
       * Type 62    Create Bot
       */

      case _constants.chatMessageVOTypes.CREATE_BOT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 63    Define Bot Commands
       */

      case _constants.chatMessageVOTypes.DEFINE_BOT_COMMAND:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 64    Start Bot
       */

      case _constants.chatMessageVOTypes.START_BOT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 65    Stop Bot
       */

      case _constants.chatMessageVOTypes.STOP_BOT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 66    Last Message Deleted
       */

      case _constants.chatMessageVOTypes.LAST_MESSAGE_DELETED:
        delete messageContent.unreadCount;
        var threadOfDeletedMessage = formatDataToMakeConversation(messageContent);

        _store.store.threads.save(threadOfDeletedMessage);

        new Promise(function (resolve, reject) {
          if (_sdkParams.sdkParams.fullResponseObject) {
            getThreads({
              threadIds: [messageContent.id]
            }, function (threadsResult) {
              var threads = threadsResult.result.threads;

              if (!threadsResult.cache) {
                resolve(threads[0]);

                _events.chatEvents.fireEvent('threadEvents', {
                  type: 'THREAD_INFO_UPDATED',
                  result: {
                    thread: threads[0]
                  }
                });
              }
            });
          } else {
            var thread = formatDataToMakeConversation(messageContent);
            resolve(thread);

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_INFO_UPDATED',
              result: {
                thread: thread
              }
            });
          }
        }).then(function (thread) {
          if (typeof messageContent.unreadCount !== "undefined") {
            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_UNREAD_COUNT_UPDATED',
              result: {
                thread: thread,
                unreadCount: messageContent.unreadCount ? messageContent.unreadCount : 0
              }
            });
          }
        });
        break;

      /**
       * Type 67    Last Message Edited
       */

      case _constants.chatMessageVOTypes.LAST_MESSAGE_EDITED:
        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [messageContent.id]
          }, function (threadsResult) {
            var threads = threadsResult.result.threads;

            if (!threadsResult.cache) {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'THREAD_INFO_UPDATED',
                result: {
                  thread: threads[0]
                }
              });
            }
          });
        } else {
          var thread = formatDataToMakeConversation(messageContent);

          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_INFO_UPDATED',
            result: {
              thread: thread
            }
          });
        }

        break;

      /**
       * Type 68    Get Bot Commands List
       */

      case _constants.chatMessageVOTypes.BOT_COMMANDS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 69    Get Thread All Bots
       */

      case _constants.chatMessageVOTypes.THREAD_ALL_BOTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 70    Send Call Request
       */

      case _constants.chatMessageVOTypes.CALL_REQUEST:
      case _constants.chatMessageVOTypes.ACCEPT_CALL:
      case _constants.chatMessageVOTypes.REJECT_CALL:
      case _constants.chatMessageVOTypes.RECEIVE_CALL_REQUEST:
      case _constants.chatMessageVOTypes.START_CALL:
      case _constants.chatMessageVOTypes.END_CALL_REQUEST:
      case _constants.chatMessageVOTypes.END_CALL:
      case _constants.chatMessageVOTypes.GET_CALLS:
      case _constants.chatMessageVOTypes.RECONNECT:
      case _constants.chatMessageVOTypes.CONNECT:
      case _constants.chatMessageVOTypes.GROUP_CALL_REQUEST:
      case _constants.chatMessageVOTypes.LEAVE_CALL:
      case _constants.chatMessageVOTypes.ADD_CALL_PARTICIPANT:
      case _constants.chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
      case _constants.chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
      case _constants.chatMessageVOTypes.TERMINATE_CALL:
      case _constants.chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
      case _constants.chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
      case _constants.chatMessageVOTypes.RECORD_CALL:
      case _constants.chatMessageVOTypes.RECORD_CALL_STARTED:
      case _constants.chatMessageVOTypes.END_RECORD_CALL:
      case _constants.chatMessageVOTypes.START_SCREEN_SHARE:
      case _constants.chatMessageVOTypes.END_SCREEN_SHARE:
      case _constants.chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
      case _constants.chatMessageVOTypes.TURN_ON_VIDEO_CALL:
      case _constants.chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
      case _constants.chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
      case _constants.chatMessageVOTypes.CALL_SESSION_CREATED:
      case _constants.chatMessageVOTypes.CANCEL_GROUP_CALL:
      case _constants.chatMessageVOTypes.DESTINED_RECORD_CALL:
      case _constants.chatMessageVOTypes.GET_CALLS_TO_JOIN:
      case _constants.chatMessageVOTypes.SWITCH_TO_GROUP_CALL_REQUEST:
      case _constants.chatMessageVOTypes.CALL_STICKER_SYSTEM_MESSAGE:
      case _constants.chatMessageVOTypes.CALL_RECORDING_FAILED:
        callModule.handleChatMessages(type, messageContent, contentCount, threadId, uniqueId);
        break;

      /**
       * Type 90    Contacts Synced
       */

      case _constants.chatMessageVOTypes.CONTACT_SYNCED:
        _events.chatEvents.fireEvent('contactEvents', {
          type: 'CONTACTS_SYNCED',
          result: messageContent
        });

        break;

      /**
       * Type 101    Location Ping
       */

      case _constants.chatMessageVOTypes.LOCATION_PING:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('systemEvents', {
          type: 'LOCATION_PING',
          result: messageContent
        });

        break;

      /**
       * Type 102    Close Thread
       */

      case _constants.chatMessageVOTypes.CLOSE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (_sdkParams.sdkParams.fullResponseObject) {
          getThreads({
            threadIds: [threadId]
          }, function (threadsResult) {
            var thread = threadsResult.result.threads[0];
            thread.mute = true;

            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_CLOSE',
              result: {
                thread: thread
              }
            });
          });
        } else {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_CLOSE',
            result: {
              thread: threadId
            }
          });
        }

        break;

      /**
       * Type 104    Remove Bot Commands
       */

      case _constants.chatMessageVOTypes.REMOVE_BOT_COMMANDS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        break;

      /**
       * Type 107    Register Assistant
       */

      case _constants.chatMessageVOTypes.REGISTER_ASSISTANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANT_REGISTER',
          result: messageContent
        });

        break;

      /**
       * Type 108    Deactivate Assistant
       */

      case _constants.chatMessageVOTypes.DEACTIVATE_ASSISTANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANT_DEACTIVATE',
          result: messageContent
        });

        break;

      /**
       * Type 109    Get Assistants List
       */

      case _constants.chatMessageVOTypes.GET_ASSISTANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANTS_LIST',
          result: messageContent
        });

        break;

      /**
       * Type 115    Get Assistants History
       */

      case _constants.chatMessageVOTypes.ASSISTANT_HISTORY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANTS_HSITORY',
          result: messageContent
        });

        break;

      /**
       * Type 116    Block Assistants
       */

      case _constants.chatMessageVOTypes.BLOCK_ASSISTANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANT_BLOCK',
          result: messageContent
        });

        break;

      /**
       * Type 117    UnBlock Assistant
       */

      case _constants.chatMessageVOTypes.UNBLOCK_ASSISTANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANT_UNBLOCK',
          result: messageContent
        });

        break;

      /**
       * Type 118    Blocked Assistants List
       */

      case _constants.chatMessageVOTypes.BLOCKED_ASSISTANTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _events.chatEvents.fireEvent('assistantEvents', {
          type: 'ASSISTANTS_BLOCKED_LIST',
          result: messageContent
        });

        break;

      /**
       * Type 130    Mutual Groups
       */

      case _constants.chatMessageVOTypes.MUTUAL_GROUPS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'MUTUAL_GROUPS',
          result: messageContent
        });

        break;

      /**
       * Type 140    Create Tag
       */

      case _constants.chatMessageVOTypes.CREATE_TAG:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'NEW_TAG',
          result: messageContent
        });

        break;

      /**
       * Type 141    Edit Tag
       */

      case _constants.chatMessageVOTypes.EDIT_TAG:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'EDIT_TAG',
          result: messageContent
        });

        break;

      /**
       * Type 142    Delete Tag
       */

      case _constants.chatMessageVOTypes.DELETE_TAG:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'DELETE_TAG',
          result: messageContent
        });

        break;

      /**
       * Type 143    Delete Tag
       */

      case _constants.chatMessageVOTypes.ADD_TAG_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'ADD_TAG_PARTICIPANT',
          result: messageContent
        });

        break;

      /**
       * Type 144    Delete Tag
       */

      case _constants.chatMessageVOTypes.REMOVE_TAG_PARTICIPANT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'REMOVE_TAG_PARTICIPANT',
          result: messageContent
        });

        break;

      /**
       * Type 145    Delete Tag
       */

      case _constants.chatMessageVOTypes.GET_TAG_LIST:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'TAG_LIST',
          result: messageContent
        });

        break;

      /**
       * Type 151    Delete Message Thread
       */

      case _constants.chatMessageVOTypes.DELETE_MESSAGE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent));
        }

        if (!messageContent) {
          messageContent = {};
        }

        messageContent.threadId = threadId;

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'DELETE_THREAD',
          result: messageContent
        });

        break;

      /**
       * Type 152    Gives us a json to export for user
       */

      case _constants.chatMessageVOTypes.EXPORT_CHAT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 200    Adding a user to contacts list
       */

      case _constants.chatMessageVOTypes.ADD_CONTACTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 201    Remove contacts result
       */

      case _constants.chatMessageVOTypes.REMOVE_CONTACTS:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 220    Adding a user to contacts list
       */

      case _constants.chatMessageVOTypes.CONTACT_THREAD_UPDATE:
        messageContent.threadId = threadId;

        _events.chatEvents.fireEvent('threadEvents', {
          type: 'CONTACT_THREAD_UPDATE',
          result: messageContent
        });

        break;

      /**
       /**
       * Type 223    ARCHIVE_THREAD
       */

      case _constants.chatMessageVOTypes.ARCHIVE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       /**
       * Type 224    UNARCHIVE_THREAD
       */

      case _constants.chatMessageVOTypes.UNARCHIVE_THREAD:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
        * Type 226    CUSTOMER_INFO
        */

      case _constants.chatMessageVOTypes.CUSTOMER_INFO:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 234    LAST_MESSAGE_INFO
       */

      case _constants.chatMessageVOTypes.LAST_MESSAGE_INFO:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 236    GET PIN MESSAGE
       */

      case _constants.chatMessageVOTypes.GET_PIN_MESSAGE:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 237    GET_THREAD_LIGHT
       */

      case _constants.chatMessageVOTypes.GET_THREAD_LIGHT:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 238    REPLY_PRIVATELY
       */

      case _constants.chatMessageVOTypes.REPLY_PRIVATELY:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        break;

      /**
       * Type 999   All unknown errors
       */

      case _constants.chatMessageVOTypes.ERROR:
        if (chatMessaging.messagesCallbacks[uniqueId]) {
          chatMessaging.messagesCallbacks[uniqueId](_utility["default"].createReturnData(true, messageContent.message, messageContent.code, messageContent, 0));
        }
        /**
         * If error code is 21, Token is invalid &
         * user should logged out
         */


        if (messageContent.code === 21) {// TODO: Temporarily removed due to unknown side-effects
          // chatMessaging.chatState = false;
          // asyncClient.logout();
          // clearChatServerCaches();
        }
        /* If the error code is 208, so the user
         * has been blocked cause of spam activity
         */


        if (messageContent.code === 208) {
          if (chatMessaging.sendMessageCallbacks[uniqueId]) {
            getItemFromChatWaitQueue(uniqueId, function (message) {
              _events.chatEvents.fireEvent('messageEvents', {
                type: 'MESSAGE_FAILED',
                cache: false,
                result: {
                  message: message
                }
              });
            });
          }
        }

        _events.chatEvents.fireEvent('error', {
          code: messageContent.code,
          message: messageContent.message,
          error: messageContent,
          uniqueId: uniqueId
        });

        break;
    }
  },

  /**
   * Send Message Callbacks Handler
   *
   * When you send Delivery or Seen Acknowledgements of a message
   * You should send Delivery and Seen for all the Messages before
   * that message so that you wont have un delivered/unseen messages
   * after seeing the last message of a thread
   *
   * @access private
   *
   * @param {int}     actionType      Switch between Delivery or Seen
   * @param {int}    threadId        Id of thread
   * @param {string}  uniqueId        uniqueId of message
   *
   * @return {undefined}
   */
  sendMessageCallbacksHandler = function sendMessageCallbacksHandler(actionType, threadId, uniqueId) {
    switch (actionType) {
      case _constants.chatMessageVOTypes.DELIVERY:
        if (chatMessaging.threadCallbacks[threadId]) {
          var lastThreadCallbackIndex = Object.keys(chatMessaging.threadCallbacks[threadId]).indexOf(uniqueId);

          if (typeof lastThreadCallbackIndex !== 'undefined') {
            while (lastThreadCallbackIndex > -1) {
              var tempUniqueId = Object.entries(chatMessaging.threadCallbacks[threadId])[lastThreadCallbackIndex][0];

              if (chatMessaging.sendMessageCallbacks[tempUniqueId] && chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver) {
                if (chatMessaging.threadCallbacks[threadId][tempUniqueId] && chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent) {
                  chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver({
                    uniqueId: tempUniqueId
                  });
                  delete chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver;
                  chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver = true;
                }
              }

              lastThreadCallbackIndex -= 1;
            }
          }
        }

        break;

      case _constants.chatMessageVOTypes.SEEN:
        if (chatMessaging.threadCallbacks[threadId]) {
          var lastThreadCallbackIndex = Object.keys(chatMessaging.threadCallbacks[threadId]).indexOf(uniqueId);

          if (typeof lastThreadCallbackIndex !== 'undefined') {
            while (lastThreadCallbackIndex > -1) {
              var tempUniqueId = Object.entries(chatMessaging.threadCallbacks[threadId])[lastThreadCallbackIndex][0];

              if (chatMessaging.sendMessageCallbacks[tempUniqueId] && chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen) {
                if (chatMessaging.threadCallbacks[threadId][tempUniqueId] && chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent) {
                  if (!chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver) {
                    chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver({
                      uniqueId: tempUniqueId
                    });
                    delete chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver;
                    chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver = true;
                  }

                  chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen({
                    uniqueId: tempUniqueId
                  });
                  delete chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen;
                  chatMessaging.threadCallbacks[threadId][tempUniqueId].onSeen = true;

                  if (chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent && chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver && chatMessaging.threadCallbacks[threadId][tempUniqueId].onSeen) {
                    delete chatMessaging.threadCallbacks[threadId][tempUniqueId];
                    delete chatMessaging.sendMessageCallbacks[tempUniqueId];
                  }
                }
              }

              lastThreadCallbackIndex -= 1;
            }
          }
        }

        break;

      default:
        break;
    }
  },

  /**
   * New Message Handler
   *
   * Handles Event Emitter of a newly received Chat Message
   *
   * @access private
   *
   * @param {int}    threadId         ID of image
   * @param {object}  messageContent   Json Content of the message
   *
   * @return {undefined}
   */
  newMessageHandler = function newMessageHandler(threadId, messageContent) {
    var message = formatDataToMakeMessage(threadId, messageContent);
    var threadObject = message.conversation;
    var lastMessageVoCopy = Object.assign({}, message);
    lastMessageVoCopy.conversation && delete lastMessageVoCopy.conversation;
    threadObject.lastParticipantImage = !!message.participant && message.participant.hasOwnProperty('image') ? message.participant.image : '';
    threadObject.lastMessageVO = lastMessageVoCopy;
    threadObject.lastParticipantName = !!message.participant && message.participant.hasOwnProperty('name') ? message.participant.name : '';
    threadObject.lastMessage = message.hasOwnProperty('message') ? message.message : '';
    var stringMsg = JSON.parse(JSON.stringify(message));
    stringMsg.conversation = JSON.parse(JSON.stringify(threadObject));

    _events.chatEvents.fireEvent('messageEvents', {
      type: 'MESSAGE_NEW',
      cache: false,
      result: {
        message: stringMsg
      }
    });

    _events.chatEvents.fireEvent('threadEvents', {
      type: 'THREAD_UNREAD_COUNT_UPDATED',
      result: {
        thread: threadObject,
        unreadCount: threadObject.unreadCount ? threadObject.unreadCount : 0
      }
    });

    var storeThread = _store.store.threads.get(threadObject.id);

    if (!storeThread) {
      _store.store.threads.save(threadObject);

      storeThread = _store.store.threads.get(threadObject.id);
    } // let unreadCount = message.conversation.unreadCount;
    // store.threads.get(threadObject.id).unreadCount.set();


    if (message.ownerId != chatMessaging.userInfo.id) {
      if (!storeThread.unreadCount.get()) storeThread.unreadCount.set(1);else storeThread.unreadCount.increase(); // if(unreadCount) {
      //     storeThread.unreadCount.set(unreadCount);
      // } else {
      //     if(!storeThread.unreadCount.get())
      //         storeThread.unreadCount.set(1);
      //     else
      //         storeThread.unreadCount.increase();
      // }
    } else {
      storeThread.unreadCount.set(0);
    }

    _events.chatEvents.fireEvent('threadEvents', {
      type: 'THREAD_LAST_ACTIVITY_TIME',
      result: {
        thread: threadObject
      }
    }); // if (fullResponseObject) {
    //     getThreads({
    //         threadIds: [threadId]
    //     }, function (threadsResult) {
    //         var threads = threadsResult.result.threads;
    //
    //         chatEvents.fireEvent('threadEvents', {
    //             type: 'THREAD_UNREAD_COUNT_UPDATED',
    //             result: {
    //                 thread: threads[0],
    //                 unreadCount: (threads[0].unreadCount) ? threads[0].unreadCount : 0
    //             }
    //         });
    //
    //         chatEvents.fireEvent('threadEvents', {
    //             type: 'THREAD_LAST_ACTIVITY_TIME',
    //             result: {
    //                 thread: threads[0]
    //             }
    //         });
    //
    //     });
    // } else {
    //     chatEvents.fireEvent('threadEvents', {
    //         type: 'THREAD_LAST_ACTIVITY_TIME',
    //         result: {
    //             thread: threadId
    //         }
    //     });
    //
    //     chatEvents.fireEvent('threadEvents', {
    //         type: 'THREAD_UNREAD_COUNT_UPDATED',
    //         result: {
    //             thread: messageContent.id,
    //             unreadCount: (messageContent.conversation.unreadCount) ? messageContent.conversation.unreadCount : 0
    //         }
    //     });
    // }

    /**
     * Update waitQ and remove sent messages from it
     */


    deleteFromChatWaitQueue(message, function () {});
  },

  /**
   * Chat Edit Message Handler
   *
   * Handles Event Emitter of an edited Chat Message
   *
   * @access private
   *
   * @param {int}    threadId         ID of image
   * @param {object}  messageContent   Json Content of the message
   *
   * @return {undefined}
   */
  chatEditMessageHandler = function chatEditMessageHandler(threadId, messageContent) {
    var message = formatDataToMakeMessage(threadId, messageContent);

    if (_sdkParams.sdkParams.fullResponseObject) {
      getThreads({
        threadIds: [threadId]
      }, function (threadsResult) {
        var threads = threadsResult.result.threads;

        if (!threadsResult.cache) {
          _events.chatEvents.fireEvent('messageEvents', {
            type: 'MESSAGE_EDIT',
            result: {
              message: message
            }
          });

          if (message.pinned) {
            _events.chatEvents.fireEvent('threadEvents', {
              type: 'THREAD_LAST_ACTIVITY_TIME',
              result: {
                thread: threads[0]
              }
            });
          }
        }
      });
    } else {
      _events.chatEvents.fireEvent('messageEvents', {
        type: 'MESSAGE_EDIT',
        result: {
          message: message
        }
      });

      if (message.pinned) {
        _events.chatEvents.fireEvent('threadEvents', {
          type: 'THREAD_LAST_ACTIVITY_TIME',
          result: {
            thread: threadId
          }
        });
      }
    }
  },

  /**
   * Create Thread
   *
   * Makes formatted Thread Object out of given contentCount,
   * If Thread has been newly created, a THREAD_NEW event
   * will be emitted
   *
   * @access private
   *
   * @param {object}    messageContent    Json object of thread taken from chat server
   * @param {boolean}   addFromService    if this is a newly created Thread, addFromService should be True
   *
   * @param showThread
   * @return {object} Formatted Thread Object
   */
  createThread = function createThread(messageContent, addFromService, showThread) {
    var threadData = formatDataToMakeConversation(messageContent);
    var redirectToThread = showThread === true ? showThread : false;

    if (addFromService) {
      _events.chatEvents.fireEvent('threadEvents', {
        type: 'THREAD_NEW',
        redirectToThread: redirectToThread,
        result: {
          thread: threadData
        }
      });
    }

    return threadData;
  },

  /**
   * Format Data To Make Linked User
   *
   * This functions re-formats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} linkedUser Object
   */
  formatDataToMakeLinkedUser = function formatDataToMakeLinkedUser(messageContent) {
    /**
     * + RelatedUserVO                 {object}
     *   - coreUserId                  {int}
     *   - username                    {string}
     *   - nickname                    {string}
     *   - name                        {string}
     *   - image                       {string}
     */
    var linkedUser = {
      coreUserId: typeof messageContent.coreUserId !== 'undefined' ? messageContent.coreUserId : messageContent.id,
      username: messageContent.username,
      nickname: messageContent.nickname,
      name: messageContent.name,
      image: messageContent.image
    }; // return linkedUser;

    return JSON.parse(JSON.stringify(linkedUser));
  },

  /**
   * Format Data To Make Contact
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} contact Object
   */
  formatDataToMakeContact = function formatDataToMakeContact(messageContent) {
    /**
     * + ContactVO                        {object}
     *    - id                            {int}
     *    - blocked                       {boolean}
     *    - userId                        {int}
     *    - firstName                     {string}
     *    - lastName                      {string}
     *    - image                         {string}
     *    - email                         {string}
     *    - cellphoneNumber               {string}
     *    - uniqueId                      {string}
     *    - notSeenDuration               {int}
     *    - hasUser                       {boolean}
     *    - linkedUser                    {object : RelatedUserVO}
     */
    var contact = {
      id: messageContent.id,
      blocked: typeof messageContent.blocked !== 'undefined' ? messageContent.blocked : false,
      userId: messageContent.userId,
      firstName: messageContent.firstName,
      lastName: messageContent.lastName,
      image: messageContent.profileImage,
      email: messageContent.email,
      cellphoneNumber: messageContent.cellphoneNumber,
      uniqueId: messageContent.uniqueId,
      notSeenDuration: messageContent.notSeenDuration,
      hasUser: messageContent.hasUser,
      linkedUser: undefined
    };

    if (typeof messageContent.linkedUser !== 'undefined') {
      contact.linkedUser = formatDataToMakeLinkedUser(messageContent.linkedUser);
    } // return contact;


    return JSON.parse(JSON.stringify(contact));
  },

  /**
   * Format Data To Make User
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} user Object
   */
  formatDataToMakeUser = function formatDataToMakeUser(messageContent) {
    /**
     * + User                     {object}
     *    - id                    {int}
     *    - name                  {string}
     *    - email                 {string}
     *    - cellphoneNumber       {string}
     *    - image                 {string}
     *    - lastSeen              {int}
     *    - sendEnable            {boolean}
     *    - receiveEnable         {boolean}
     *    - contactSynced         {boolean}
     *    - chatProfileVO         {object:chatProfileVO}
     */
    var user = {
      id: messageContent.id,
      coreUserId: messageContent.coreUserId,
      username: messageContent.username,
      name: messageContent.name,
      email: messageContent.email,
      cellphoneNumber: messageContent.cellphoneNumber,
      image: messageContent.image,
      lastSeen: messageContent.lastSeen,
      sendEnable: messageContent.sendEnable,
      receiveEnable: messageContent.receiveEnable,
      contactSynced: messageContent.contactSynced,
      callCenter: messageContent.callCenter
    };

    if (messageContent.contactId) {
      user.contactId = messageContent.contactId;
    }

    if (messageContent.contactName) {
      user.contactName = messageContent.contactName;
    }

    if (messageContent.contactFirstName) {
      user.contactFirstName = messageContent.contactFirstName;
    }

    if (messageContent.contactLastName) {
      user.contactLastName = messageContent.contactLastName;
    }

    if (messageContent.blocked) {
      user.blocked = messageContent.blocked;
    } // Add chatProfileVO if exist


    if (messageContent.chatProfileVO) {
      user.chatProfileVO = messageContent.chatProfileVO;
    } // return user;


    return JSON.parse(JSON.stringify(user));
  },

  /**
   * Format Data To Make Blocked User
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} blockedUser Object
   */
  formatDataToMakeBlockedUser = function formatDataToMakeBlockedUser(messageContent) {
    /**
     * + BlockedUser              {object}
     *    - id                    {int}
     *    - coreUserId            {int}
     *    - firstName             {string}
     *    - lastName              {string}
     *    - nickName              {string}
     *    - profileImage          {string}
     *    - contact               {object: contactVO}
     */
    var blockedUser = {
      blockId: messageContent.id,
      coreUserId: messageContent.coreUserId,
      firstName: messageContent.firstName,
      lastName: messageContent.lastName,
      nickName: messageContent.nickName,
      profileImage: messageContent.profileImage
    }; // Add contactVO if exist

    if (messageContent.contactVO) {
      blockedUser.contact = messageContent.contactVO;
    } // return blockedUser;


    return JSON.parse(JSON.stringify(blockedUser));
  },
      formatDataToMakeAssistanthistoryItem = function formatDataToMakeAssistanthistoryItem(messageContent) {
    var assistant = {
      actionType: Object.keys(_constants.assistantActionTypes)[Object.values(_constants.assistantActionTypes).indexOf(messageContent.actionType)],
      actionTime: messageContent.actionTime
    }; // Add chatProfileVO if exist

    if (messageContent.participantVO) {
      assistant.participantVO = messageContent.participantVO;
    } // return participant;


    return JSON.parse(JSON.stringify(assistant));
  },
      formatDataToMakeAssistantHistoryList = function formatDataToMakeAssistantHistoryList(assistantsList) {
    var returnData = [];

    for (var i = 0; i < assistantsList.length; i++) {
      returnData.push(formatDataToMakeAssistanthistoryItem(assistantsList[i]));
    }

    return returnData;
  },

  /**
   * Format Data To Make Invitee
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} inviteeData Object
   */
  formatDataToMakeInvitee = function formatDataToMakeInvitee(messageContent) {
    /**
     * + InviteeVO       {object}
     *    - id           {string}
     *    - idType       {int}
     */
    return {
      id: messageContent.id,
      idType: _constants.inviteeVOidTypes[messageContent.idType]
    };
  },

  /**
   * Format Data To Make Participant
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @param threadId
   * @return {object} participant Object
   */
  formatDataToMakeParticipant = function formatDataToMakeParticipant(messageContent, threadId) {
    /**
     * + ParticipantVO                   {object}
     *    - id                           {int}
     *    - coreUserId                   {int}
     *    - threadId                     {int}
     *    - sendEnable                   {boolean}
     *    - receiveEnable                {boolean}
     *    - firstName                    {string}
     *    - lastName                     {string}
     *    - name                         {string}
     *    - cellphoneNumber              {string}
     *    - email                        {string}
     *    - image                        {string}
     *    - chatProfileVO                {object}
     *    - myFriend                     {boolean}
     *    - online                       {boolean}
     *    - notSeenDuration              {int}
     *    - contactId                    {int}
     *    - contactName                  {string}
     *    - contactFirstName             {string}
     *    - contactLastName              {string}
     *    - blocked                      {boolean}
     *    - admin                        {boolean}
     *    - auditor                      {boolean}
     *    - keyId                        {string}
     *    - roles                        {list:string}
     *    - username                     {string}
     */
    var participant = {
      id: messageContent.id,
      coreUserId: messageContent.coreUserId,
      threadId: parseInt(threadId),
      sendEnable: messageContent.sendEnable,
      receiveEnable: messageContent.receiveEnable,
      firstName: messageContent.firstName,
      lastName: messageContent.lastName,
      name: messageContent.name,
      cellphoneNumber: messageContent.cellphoneNumber,
      email: messageContent.email,
      image: messageContent.image,
      myFriend: messageContent.myFriend,
      online: messageContent.online,
      notSeenDuration: messageContent.notSeenDuration,
      contactId: messageContent.contactId,
      contactName: messageContent.contactName,
      contactFirstName: messageContent.contactFirstName,
      contactLastName: messageContent.contactLastName,
      blocked: messageContent.blocked,
      admin: messageContent.admin,
      auditor: messageContent.auditor,
      keyId: messageContent.keyId,
      roles: messageContent.roles,
      username: messageContent.username
    }; // Add chatProfileVO if exist

    if (messageContent.chatProfileVO) {
      participant.chatProfileVO = messageContent.chatProfileVO;
    } // return participant;


    return JSON.parse(JSON.stringify(participant));
  },

  /**
   * Format Data To Make Conversation
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} Conversation Object
   */
  formatDataToMakeConversation = function formatDataToMakeConversation(messageContent) {
    /**
     * + Conversation                           {object}
     *    - id                                  {int}
     *    - joinDate                            {int}
     *    - title                               {string}
     *    - inviter                             {object : ParticipantVO}
     *    - participants                        {list : ParticipantVO}
     *    - time                                {int}
     *    - lastMessage                         {string}
     *    - lastParticipantName                 {string}
     *    - group                               {boolean}
     *    - partner                             {int}
     *    - lastParticipantImage                {string}
     *    - image                               {string}
     *    - description                         {string}
     *    - unreadCount                         {int}
     *    - lastSeenMessageId                   {int}
     *    - lastSeenMessageTime                 {int}
     *    - lastSeenMessageNanos                {integer}
     *    - lastMessageVO                       {object : ChatMessageVO}
     *    - pinMessageVO                        {object : pinMessageVO}
     *    - partnerLastSeenMessageId            {int}
     *    - partnerLastSeenMessageTime          {int}
     *    - partnerLastSeenMessageNanos         {integer}
     *    - partnerLastDeliveredMessageId       {int}
     *    - partnerLastDeliveredMessageTime     {int}
     *    - partnerLastDeliveredMessageNanos    {integer}
     *    - type                                {int}
     *    - metadata                            {string}
     *    - mute                                {boolean}
     *    - participantCount                    {int}
     *    - canEditInfo                         {boolean}
     *    - canSpam                             {boolean}
     *    - admin                               {boolean}
     *    - mentioned                           {boolean}
     *    - pin                                 {boolean}
     *    - uniqueName                          {string}
     *    - userGroupHash                       {string}
     *    - leftWithHistory                     {boolean}
     *    - closed                              {boolean}
     */
    var conversation = {
      id: messageContent.id,
      joinDate: messageContent.joinDate,
      title: messageContent.title,
      inviter: undefined,
      participants: undefined,
      time: messageContent.time,
      lastMessage: messageContent.lastMessage,
      lastParticipantName: messageContent.lastParticipantName,
      group: messageContent.group,
      partner: messageContent.partner,
      lastParticipantImage: messageContent.lastParticipantImage,
      image: messageContent.image,
      description: messageContent.description,
      unreadCount: messageContent.unreadCount,
      lastSeenMessageId: messageContent.lastSeenMessageId,
      lastSeenMessageTime: messageContent.lastSeenMessageNanos ? parseInt(parseInt(messageContent.lastSeenMessageTime) / 1000) * 1000000000 + parseInt(messageContent.lastSeenMessageNanos) : parseInt(messageContent.lastSeenMessageTime),
      lastMessageVO: undefined,
      pinMessageVO: undefined,
      partnerLastSeenMessageId: messageContent.partnerLastSeenMessageId,
      partnerLastSeenMessageTime: messageContent.partnerLastSeenMessageNanos ? parseInt(parseInt(messageContent.partnerLastSeenMessageTime) / 1000) * 1000000000 + parseInt(messageContent.partnerLastSeenMessageNanos) : parseInt(messageContent.partnerLastSeenMessageTime),
      partnerLastDeliveredMessageId: messageContent.partnerLastDeliveredMessageId,
      partnerLastDeliveredMessageTime: messageContent.partnerLastDeliveredMessageNanos ? parseInt(parseInt(messageContent.partnerLastDeliveredMessageTime) / 1000) * 1000000000 + parseInt(messageContent.partnerLastDeliveredMessageNanos) : parseInt(messageContent.partnerLastDeliveredMessageTime),
      archiveThread: messageContent.archiveThread,
      type: messageContent.type,
      metadata: messageContent.metadata,
      mute: messageContent.mute,
      participantCount: messageContent.participantCount,
      canEditInfo: messageContent.canEditInfo,
      canSpam: messageContent.canSpam,
      admin: messageContent.admin,
      mentioned: messageContent.mentioned,
      pin: messageContent.pin,
      uniqueName: messageContent.uniqueName,
      userGroupHash: messageContent.userGroupHash,
      leftWithHistory: messageContent.leftWithHistory,
      closed: messageContent.closed,
      seenByAnyAssistant: messageContent.seenByAnyAssistant
    }; // Add inviter if exist

    if (messageContent.inviter) {
      conversation.inviter = formatDataToMakeParticipant(messageContent.inviter, messageContent.id);
    } // Add participants list if exist


    if (messageContent.participants && Array.isArray(messageContent.participants)) {
      conversation.participants = [];

      for (var i = 0; i < messageContent.participants.length; i++) {
        var participantData = formatDataToMakeParticipant(messageContent.participants[i], messageContent.id);

        if (participantData) {
          conversation.participants.push(participantData);
        }
      }
    } // Add lastMessageVO if exist


    if (messageContent.lastMessageVO) {
      conversation.lastMessageVO = formatDataToMakeMessage(messageContent.id, messageContent.lastMessageVO);
    } // Add pinMessageVO if exist


    if (messageContent.pinMessageVO) {
      conversation.pinMessageVO = formatDataToMakePinMessage(messageContent.id, messageContent.pinMessageVO);
    } // return conversation;


    return JSON.parse(JSON.stringify(conversation));
  },

  /**
   * Format Data To Make Reply Info
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @param threadId
   * @return {object} replyInfo Object
   */
  formatDataToMakeReplyInfo = function formatDataToMakeReplyInfo(messageContent, threadId) {
    /**
     * + replyInfoVO                  {object : replyInfoVO}
     *   - participant                {object : ParticipantVO}
     *   - repliedToMessageId         {int}
     *   - repliedToMessageTime       {int}
     *   - repliedToMessageNanos      {int}
     *   - message                    {string}
     *   - deleted                    {boolean}
     *   - messageType                {int}
     *   - metadata                   {string}
     *   - systemMetadata             {string}
     */
    var replyInfo = {
      participant: undefined,
      repliedToMessageId: messageContent.repliedToMessageId,
      repliedToMessageTime: messageContent.repliedToMessageNanos ? parseInt(parseInt(messageContent.repliedToMessageTime) / 1000) * 1000000000 + parseInt(messageContent.repliedToMessageNanos) : parseInt(messageContent.repliedToMessageTime),
      repliedToMessageTimeMiliSeconds: parseInt(messageContent.repliedToMessageTime),
      repliedToMessageTimeNanos: parseInt(messageContent.repliedToMessageNanos),
      message: messageContent.message,
      deleted: messageContent.deleted,
      messageType: messageContent.messageType,
      metadata: messageContent.metadata,
      systemMetadata: messageContent.systemMetadata
    };

    if (messageContent.participant) {
      replyInfo.participant = formatDataToMakeParticipant(messageContent.participant, threadId);
    } // return replyInfo;


    return JSON.parse(JSON.stringify(replyInfo));
  },

  /**
   * Format Data To Make Forward Info
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @param threadId
   * @return {object} forwardInfo Object
   */
  formatDataToMakeForwardInfo = function formatDataToMakeForwardInfo(messageContent, threadId) {
    /**
     * + forwardInfo                  {object : forwardInfoVO}
     *   - participant                {object : ParticipantVO}
     *   - conversation               {object : ConversationSummary}
     */
    var forwardInfo = {
      participant: undefined,
      conversation: undefined
    };

    if (messageContent.conversation) {
      forwardInfo.conversation = formatDataToMakeConversation(messageContent.conversation);
    }

    if (messageContent.participant) {
      forwardInfo.participant = formatDataToMakeParticipant(messageContent.participant, threadId);
    } // return forwardInfo;


    return JSON.parse(JSON.stringify(forwardInfo));
  },

  /**
   * Format Data To Make Message
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   *
   * @return {object} message Object
   * @param threadId
   * @param pushMessageVO
   * @param fromCache
   */
  formatDataToMakeMessage = function formatDataToMakeMessage(threadId, pushMessageVO, fromCache) {
    /**
     * + MessageVO                       {object}
     *    - id                           {int}
     *    - threadId                     {int}
     *    - ownerId                      {int}
     *    - uniqueId                     {string}
     *    - previousId                   {int}
     *    - message                      {string}
     *    - messageType                  {int}
     *    - edited                       {boolean}
     *    - editable                     {boolean}
     *    - deletable                    {boolean}
     *    - delivered                    {boolean}
     *    - seen                         {boolean}
     *    - mentioned                    {boolean}
     *    - pinned                       {boolean}
     *    - participant                  {object : ParticipantVO}
     *    - conversation                 {object : ConversationVO}
     *    - replyInfo                    {object : replyInfoVO}
     *    - forwardInfo                  {object : forwardInfoVO}
     *    - metadata                     {string}
     *    - systemMetadata               {string}
     *    - time                         {int}
     *    - timeNanos                    {int}
     */
    if (fromCache || pushMessageVO.time.toString().length > 14) {
      var time = pushMessageVO.time,
          timeMiliSeconds = parseInt(pushMessageVO.time / 1000000);
    } else {
      var time = pushMessageVO.timeNanos ? parseInt(parseInt(pushMessageVO.time) / 1000) * 1000000000 + parseInt(pushMessageVO.timeNanos) : parseInt(pushMessageVO.time),
          timeMiliSeconds = parseInt(pushMessageVO.time);
    }

    var message = {
      id: pushMessageVO.id,
      threadId: threadId,
      ownerId: pushMessageVO.ownerId ? pushMessageVO.ownerId : undefined,
      uniqueId: pushMessageVO.uniqueId,
      previousId: pushMessageVO.previousId,
      message: pushMessageVO.message,
      messageType: pushMessageVO.messageType,
      edited: pushMessageVO.edited,
      editable: pushMessageVO.editable,
      deletable: pushMessageVO.deletable,
      delivered: pushMessageVO.delivered,
      seen: pushMessageVO.seen,
      mentioned: pushMessageVO.mentioned,
      pinned: pushMessageVO.pinned,
      participant: undefined,
      conversation: undefined,
      replyInfo: undefined,
      forwardInfo: undefined,
      metadata: pushMessageVO.metadata,
      systemMetadata: pushMessageVO.systemMetadata,
      time: time,
      timeMiliSeconds: timeMiliSeconds,
      timeNanos: parseInt(pushMessageVO.timeNanos),
      callHistory: pushMessageVO.callHistoryVO
    };

    if (pushMessageVO.participant) {
      message.ownerId = pushMessageVO.participant.id;
    } else if (pushMessageVO.participantVO) {
      message.ownerId = pushMessageVO.participantVO.id;
    }

    if (pushMessageVO.conversation) {
      message.conversation = formatDataToMakeConversation(pushMessageVO.conversation);
      message.threadId = pushMessageVO.conversation.id;
    }

    if (pushMessageVO.replyInfoVO || pushMessageVO.replyInfo) {
      message.replyInfo = pushMessageVO.replyInfoVO ? formatDataToMakeReplyInfo(pushMessageVO.replyInfoVO, threadId) : formatDataToMakeReplyInfo(pushMessageVO.replyInfo, threadId);
    }

    if (pushMessageVO.forwardInfo) {
      message.forwardInfo = formatDataToMakeForwardInfo(pushMessageVO.forwardInfo, threadId);
    }

    if (pushMessageVO.participant) {
      message.participant = formatDataToMakeParticipant(pushMessageVO.participant, threadId);
    } // return message;


    return JSON.parse(JSON.stringify(message));
  },

  /**
   * Format Data To Make Pin Message
   *
   * This functions reformats given JSON to proper Object
   *
   * @access private
   *
   * @param {object}  messageContent    Json object of thread taken from chat server
   *
   * @return {object} pin message Object
   */
  formatDataToMakePinMessage = function formatDataToMakePinMessage(threadId, pushMessageVO) {
    /**
     * + PinMessageVO                    {object}
     *    - messageId                    {int}
     *    - time                         {int}
     *    - sender                       {int}
     *    - text                         {string}
     *    - notifyAll                    {boolean}
     */
    pushMessageVO.time = pushMessageVO.timeNanos ? parseInt(parseInt(pushMessageVO.time) / 1000) * 1000000000 + parseInt(pushMessageVO.timeNanos) : parseInt(pushMessageVO.time);
    var pinMessage = {
      threadId: threadId,
      time: pushMessageVO.time,
      timeNanos: pushMessageVO.timeNanos,
      sender: pushMessageVO.sender,
      messageId: pushMessageVO.messageId,
      text: pushMessageVO.text,
      metadata: pushMessageVO.metadata,
      systemMetadata: pushMessageVO.systemMetadata
    };

    if (typeof pushMessageVO.notifyAll === 'boolean') {
      pinMessage.notifyAll = pushMessageVO.notifyAll;
    } // return pinMessage;


    return JSON.parse(JSON.stringify(pinMessage));
  },

  /**
   * Reformat Thread History
   *
   * This functions reformats given Array of thread Messages
   * into proper chat message object
   *
   * @access private
   *
   * @param {int}    threadId         Id of Thread
   * @param {object}  historyContent   Array of Thread History Messages
   *
   * @return {object} Formatted Thread History
   */
  reformatThreadHistory = function reformatThreadHistory(threadId, historyContent) {
    var returnData = [];

    for (var i = 0; i < historyContent.length; i++) {
      returnData.push(formatDataToMakeMessage(threadId, historyContent[i]));
    }

    return returnData;
  },

  /**
   * Reformat Thread Participants
   *
   * This functions reformats given Array of thread Participants
   * into proper thread participant
   *
   * @access private
   *
   * @param {object}  participantsContent   Array of Thread Participant Objects
   * @param {int}    threadId              Id of Thread
   *
   * @return {object} Formatted Thread Participant Array
   */
  reformatThreadParticipants = function reformatThreadParticipants(participantsContent, threadId) {
    var returnData = [];

    for (var i = 0; i < participantsContent.length; i++) {
      returnData.push(formatDataToMakeParticipant(participantsContent[i], threadId));
    }

    return returnData;
  },

  /**
   * Unset Not Seen Duration
   *
   * This functions unsets notSeenDuration property of cached objects
   *
   * @access private
   *
   * @param {object}  content   Object or Array to be modified
   *
   * @return {object}
   */
  unsetNotSeenDuration = function unsetNotSeenDuration(content) {
    /**
     * Make a copy from original object to modify it's
     * attributes, because we don't want to change
     * the original object
     */
    var temp = cloneObject(content);

    if (temp.hasOwnProperty('notSeenDuration')) {
      temp.notSeenDuration = undefined;
    }

    if (temp.hasOwnProperty('inviter')) {
      temp.inviter.notSeenDuration = undefined;
    }

    if (temp.hasOwnProperty('participant')) {
      temp.participant.notSeenDuration = undefined;
    }

    return temp;
  },

  /**
   * Clone Object/Array
   *
   * This functions makes a deep clone of given object or array
   *
   * @access private
   *
   * @param {object}  original   Object or Array to be cloned
   *
   * @return {object} Cloned object
   */
  cloneObject = function cloneObject(original) {
    var out, value, key;
    out = Array.isArray(original) ? [] : {};

    for (key in original) {
      value = original[key];
      out[key] = (0, _typeof2["default"])(value) === 'object' && value !== null ? cloneObject(value) : value;
    }

    return out;
  },

  /**
   * Get Treads.
   *
   * This functions gets threads list
   *
   * @access private
   *
   * @param {int}       count                 count of threads to be received
   * @param {int}       offset                offset of select query
   * @param {array}     threadIds             An array of thread ids to be received
   * @param {string}    name                  Search term to look up in thread Titles
   * @param {int}      creatorCoreUserId     SSO User Id of thread creator
   * @param {int}      partnerCoreUserId     SSO User Id of thread partner
   * @param {int}      partnerCoreContactId  Contact Id of thread partner
   * @param {function}  callback              The callback function to call after
   *
   * @return {object} Instant sendMessage result
   */
  getThreads = function getThreads(params, callback) {
    var count = 25,
        offset = 0,
        content = {},
        returnCache = false;

    if (params) {
      if (parseInt(params.count) > 0) {
        count = params.count;
      }

      if (parseInt(params.offset) > 0) {
        offset = params.offset;
      }

      if (typeof params.threadName === 'string') {
        content.name = params.threadName;
      }

      if (typeof params.username === 'string') {
        content.username = params.username;
      }

      if (typeof params.cellphoneNumber === 'string') {
        content.cellphoneNumber = params.cellphoneNumber;
      }

      if (Array.isArray(params.threadIds)) {
        content.threadIds = params.threadIds;
      }

      if (typeof params["new"] === 'boolean') {
        content["new"] = params["new"];
      }

      if (parseInt(params.creatorCoreUserId) > 0) {
        content.creatorCoreUserId = params.creatorCoreUserId;
      }

      if (parseInt(params.partnerCoreUserId) > 0) {
        content.partnerCoreUserId = params.partnerCoreUserId;
      }

      if (parseInt(params.partnerCoreContactId) > 0) {
        content.partnerCoreContactId = params.partnerCoreContactId;
      }

      if (parseInt(params.fromTime) > 0 && parseInt(params.fromTime) < 9999999999999) {
        content.fromTime = parseInt(params.fromTime);
      }

      if (parseInt(params.toTime) > 0 && parseInt(params.toTime) < 9999999999999) {
        content.toTime = parseInt(params.toTime);
      }

      var functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true;

      if (typeof params.isGroup === 'boolean') {
        content.isGroup = params.isGroup;
      }

      if (typeof params.type === 'number') {
        content.type = params.type;
      }
    }

    content.count = count;
    content.offset = offset;
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_THREADS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    /**
     * Retrive get threads response from server
     */

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          uniqueId: result.uniqueId
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            threads: [],
            contentCount: result.contentCount,
            hasNext: messageContent && !(messageLength < count),
            //(offset + count < result.contentCount && messageLength > 0),
            nextOffset: offset * 1 + messageLength * 1
          },
              threadData;

          for (var i = 0; i < messageLength; i++) {
            threadData = createThread(messageContent[i], false);

            if (threadData) {
              resultData.threads.push(threadData);
            }
          }

          _store.store.threads.saveMany(resultData.threads);

          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;

        if (!returnData.hasError && returnCache) {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREADS_LIST_CHANGE',
            result: returnData.result
          });
        }
      }
    });
  },
      getAllThreads = function getAllThreads(params, callback) {
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_THREADS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {}
    };
    sendMessageParams.content.summary = params.summary;
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },

  /**
   * Get History.
   *
   * This functions gets history of a thread
   *
   * @access private
   *
   * @param {int}       count             Count of threads to be received
   * @param {int}       offset            Offset of select query
   * @param {int}      threadId          Id of thread to get its history
   * @param {int}      id                Id of single message to get
   * @param {int}      userId            Messages of this SSO User
   * @param {int}       messageType       Type of messages to get (types should be set by client)
   * @param {int}      fromTime          Get messages which have bigger time than given fromTime
   * @param {int}       fromTimeNanos     Get messages which have bigger time than given fromTimeNanos
   * @param {int}      toTime            Get messages which have smaller time than given toTime
   * @param {int}       toTimeNanos       Get messages which have smaller time than given toTimeNanos
   * @param {int}      senderId          Messages of this sender only
   * @param {string}    uniqueIds         Array of unique ids to retrieve
   * @param {string}    order             Order of select query (default: DESC)
   * @param {string}    query             Search term to be looked up in messages content
   * @param {object}    metadataCriteria  This JSON will be used to search in message metadata with GraphQL
   * @param {function}  callback          The callback function to call after
   *
   * @return {object} Instant result of sendMessage
   */
  getHistory = function getHistory(params, callback) {
    if (parseInt(params.threadId) > 0) {
      var sendMessageParams = {
        chatMessageVOType: _constants.chatMessageVOTypes.GET_HISTORY,
        typeCode: _sdkParams.sdkParams.generalTypeCode,
        //params.typeCode,
        content: {},
        subjectId: params.threadId
      },
          offset = parseInt(params.offset) > 0 ? parseInt(params.offset) : 0,
          count = parseInt(params.count) > 0 ? parseInt(params.count) : config.getHistoryCount,
          order = typeof params.order != 'undefined' ? params.order.toLowerCase() : 'desc',
          functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true,
          cacheResult = {},
          serverResult = {},
          cacheFirstMessage,
          cacheLastMessage,
          messages,
          returnCache,
          cacheReady = false,
          dynamicHistoryCount = params.dynamicHistoryCount && typeof params.dynamicHistoryCount === 'boolean' ? params.dynamicHistoryCount : false,
          sendingQueue = params.queues && typeof params.queues.sending === 'boolean' ? params.queues.sending : true,
          failedQueue = params.queues && typeof params.queues.failed === 'boolean' ? params.queues.failed : true,
          uploadingQueue = params.queues && typeof params.queues.uploading === 'boolean' ? params.queues.uploading : true,
          sendingQueueMessages = [],
          failedQueueMessages = [],
          uploadingQueueMessages = [];

      if (sendingQueue) {
        getChatSendQueue(parseInt(params.threadId), function (sendQueueMessages) {
          for (var i = 0; i < sendQueueMessages.length; i++) {
            var time = new Date().getTime();
            sendingQueueMessages.push(formatDataToMakeMessage(sendQueueMessages[i].threadId, {
              uniqueId: sendQueueMessages[i].uniqueId,
              ownerId: chatMessaging.userInfo.id,
              message: sendQueueMessages[i].content,
              metadata: sendQueueMessages[i].metadata,
              systemMetadata: sendQueueMessages[i].systemMetadata,
              replyInfo: sendQueueMessages[i].replyInfo,
              forwardInfo: sendQueueMessages[i].forwardInfo,
              time: time,
              timeNanos: time % 1000 * 1000000
            }));
          }
        });
      }

      if (uploadingQueue) {
        getChatUploadQueue(parseInt(params.threadId), function (uploadQueueMessages) {
          for (var i = 0; i < uploadQueueMessages.length; i++) {
            uploadQueueMessages[i].message.participant = chatMessaging.userInfo;
            var time = new Date().getTime();
            uploadQueueMessages[i].message.time = time;
            uploadQueueMessages[i].message.timeNanos = time % 1000 * 1000000;
            uploadingQueueMessages.push(formatDataToMakeMessage(params.threadId, uploadQueueMessages[i].message, false));
          }
        });
      }

      getChatWaitQueue(parseInt(params.threadId), failedQueue, function (waitQueueMessages) {
        if (cacheSecret.length > 0) {
          for (var i = 0; i < waitQueueMessages.length; i++) {
            var decryptedEnqueuedMessage = {};

            if (cacheInMemory) {
              decryptedEnqueuedMessage = waitQueueMessages[i];
            } else {
              decryptedEnqueuedMessage = _utility["default"].jsonParser(chatDecrypt(waitQueueMessages[i].message, cacheSecret));
            }

            var time = new Date().getTime();
            failedQueueMessages[i] = formatDataToMakeMessage(waitQueueMessages[i].threadId, {
              uniqueId: decryptedEnqueuedMessage.uniqueId,
              ownerId: chatMessaging.userInfo.id,
              message: decryptedEnqueuedMessage.content,
              metadata: decryptedEnqueuedMessage.metadata,
              systemMetadata: decryptedEnqueuedMessage.systemMetadata,
              replyInfo: decryptedEnqueuedMessage.replyInfo,
              forwardInfo: decryptedEnqueuedMessage.forwardInfo,
              participant: chatMessaging.userInfo,
              time: time,
              timeNanos: time % 1000 * 1000000
            });
          }
        } else {
          failedQueueMessages = [];
        }

        if (dynamicHistoryCount) {
          var tempCount = count - (sendingQueueMessages.length + failedQueueMessages.length + uploadingQueueMessages.length);
          sendMessageParams.content.count = tempCount > 0 ? tempCount : 0;
        } else {
          sendMessageParams.content.count = count;
        }

        sendMessageParams.content.offset = offset;
        sendMessageParams.content.order = order;

        if (parseInt(params.messageId) > 0) {
          sendMessageParams.content.id = params.messageId;
        }

        if (Array.isArray(params.uniqueIds)) {
          sendMessageParams.content.uniqueIds = params.uniqueIds;
        }

        if (parseInt(params.fromTimeFull) > 0 && params.fromTimeFull.toString().length === 19) {
          sendMessageParams.content.fromTime = parseInt(params.fromTimeFull.toString().substring(0, 13));
          sendMessageParams.content.fromTimeNanos = parseInt(params.fromTimeFull.toString().substring(10, 19));
        } else {
          if (parseInt(params.fromTime) > 0 && parseInt(params.fromTime) < 9999999999999) {
            sendMessageParams.content.fromTime = parseInt(params.fromTime);
          }

          if (parseInt(params.fromTimeNanos) > 0 && parseInt(params.fromTimeNanos) < 999999999) {
            sendMessageParams.content.fromTimeNanos = parseInt(params.fromTimeNanos);
          }
        }

        if (parseInt(params.toTimeFull) > 0 && params.toTimeFull.toString().length === 19) {
          sendMessageParams.content.toTime = parseInt(params.toTimeFull.toString().substring(0, 13));
          sendMessageParams.content.toTimeNanos = parseInt(params.toTimeFull.toString().substring(10, 19));
        } else {
          if (parseInt(params.toTime) > 0 && parseInt(params.toTime) < 9999999999999) {
            sendMessageParams.content.toTime = parseInt(params.toTime);
          }

          if (parseInt(params.toTimeNanos) > 0 && parseInt(params.toTimeNanos) < 999999999) {
            sendMessageParams.content.toTimeNanos = parseInt(params.toTimeNanos);
          }
        }

        if (typeof params.query != 'undefined') {
          sendMessageParams.content.query = params.query;
        }

        if (params.allMentioned && typeof params.allMentioned == 'boolean') {
          sendMessageParams.content.allMentioned = params.allMentioned;
        }

        if (params.unreadMentioned && typeof params.unreadMentioned == 'boolean') {
          sendMessageParams.content.unreadMentioned = params.unreadMentioned;
        }

        if (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && _constants.chatMessageTypes[params.messageType.toUpperCase()] > 0) {
          sendMessageParams.content.messageType = _constants.chatMessageTypes[params.messageType.toUpperCase()];
        }

        if ((0, _typeof2["default"])(params.metadataCriteria) == 'object' && params.metadataCriteria.hasOwnProperty('field')) {
          sendMessageParams.content.metadataCriteria = params.metadataCriteria;
        }

        if (typeof params.onlyNewMessages === "boolean") {
          sendMessageParams.content.newMessages = params.onlyNewMessages;
        }
        /**
         * Get Thread Messages From Server
         */


        return chatMessaging.sendMessage(sendMessageParams, {
          onResult: function onResult(result) {
            var returnData = {
              hasError: result.hasError,
              cache: false,
              errorMessage: result.errorMessage,
              errorCode: result.errorCode
            },
                resultMessagesId = [];

            if (!returnData.hasError) {
              var messageContent = result.result,
                  messageLength = messageContent.length;
              var history = reformatThreadHistory(params.threadId, messageContent);

              if (messageLength > 0) {
                /**
                 * Calculating First and Last Messages of result
                 */
                var lastMessage = history[messageContent.length - 1],
                    firstMessage = history[0];
                /**
                 * Sending Delivery for Last Message of Thread
                 */

                if (chatMessaging.userInfo.id !== firstMessage.participant.id && !firstMessage.delivered) {
                  putInMessagesDeliveryQueue(params.threadId, firstMessage.id);
                }
              }

              returnData.result = {
                history: history,
                contentCount: result.contentCount,
                hasNext: result.result && !(result.result.length < sendMessageParams.content.count),
                //(sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0),
                nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
              };

              if (sendingQueue) {
                returnData.result.sending = sendingQueueMessages;
              }

              if (uploadingQueue) {
                returnData.result.uploading = uploadingQueueMessages;
              }

              if (failedQueue) {
                returnData.result.failed = failedQueueMessages;
              }

              callback && callback(returnData);
              callback = undefined;
            }
          }
        });
      });
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Thread ID is required for Getting history!'
      });
    }
  },

  /**
   * Update Thread Info
   *
   * This functions updates metadata of thread
   *
   * @access private
   *
   * @param {int}       threadId      Id of thread
   * @param {string}    image         URL og thread image to be set
   * @param {string}    description   Description for thread
   * @param {string}    title         New Title for thread
   * @param {object}    metadata      New Metadata to be set on thread
   * @param {function}  callback      The callback function to call after
   *
   * @return {object} Instant sendMessage result
   */
  updateThreadInfo = function updateThreadInfo(params, callback) {
    var updateThreadInfoData = {
      chatMessageVOType: _constants.chatMessageVOTypes.UPDATE_THREAD_INFO,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    },
        threadInfoContent = {},
        fileUploadParams = {},
        metadata = {
      file: {}
    },
        threadId,
        fileUniqueId = _utility["default"].generateUUID();

    if (params) {
      if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof params.userGroupHash !== 'string') {
        _events.chatEvents.fireEvent('error', {
          code: 6304,
          message: CHAT_ERRORS[6304]
        });

        return;
      } else {
        fileUploadParams.userGroupHash = params.userGroupHash;
      }

      if (parseInt(params.threadId) > 0) {
        threadId = parseInt(params.threadId);
        updateThreadInfoData.subjectId = threadId;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Thread ID is required for Updating thread info!'
        });
      }

      if (typeof params.description == 'string') {
        threadInfoContent.description = params.description;
      }

      if (typeof params.title == 'string') {
        threadInfoContent.name = params.title;
      }

      if ((0, _typeof2["default"])(params.metadata) == 'object') {
        threadInfoContent.metadata = JSON.parse(JSON.stringify(params.metadata));
      } else if (typeof params.metadata == 'string') {
        try {
          threadInfoContent.metadata = JSON.parse(params.metadata);
        } catch (e) {
          threadInfoContent.metadata = {};
        }
      } else {
        threadInfoContent.metadata = {};
      }

      updateThreadInfoData.content = threadInfoContent;

      if ((0, _typeof2["default"])(params.image) == 'object' && params.image.size > 0) {
        return chatUploadHandler({
          threadId: threadId,
          file: params.image,
          fileUniqueId: fileUniqueId
        }, function (uploadHandlerResult, uploadHandlerMetadata, fileType, fileExtension) {
          fileUploadParams = Object.assign(fileUploadParams, uploadHandlerResult);
          threadInfoContent.metadata = JSON.stringify(Object.assign(threadInfoContent.metadata, uploadHandlerMetadata));
          putInChatUploadQueue({
            message: {
              chatMessageVOType: _constants.chatMessageVOTypes.UPDATE_THREAD_INFO,
              typeCode: _sdkParams.sdkParams.generalTypeCode,
              //params.typeCode,
              subjectId: threadId,
              content: threadInfoContent,
              metadata: threadInfoContent.metadata,
              uniqueId: fileUniqueId,
              pushMsgType: 3,
              token: _sdkParams.sdkParams.token
            },
            callbacks: callback
          }, function () {
            if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
              uploadImageToPodspaceUserGroupNew(fileUploadParams, function (result) {
                if (!result.hasError) {
                  metadata['name'] = result.result.name;
                  metadata['fileHash'] = result.result.hash;
                  metadata['file']['name'] = result.result.name;
                  metadata['file']['fileHash'] = result.result.hash;
                  metadata['file']['hashCode'] = result.result.hash;
                  metadata['file']['parentHash'] = result.result.parentHash;
                  metadata['file']['size'] = result.result.size;
                  metadata['file']['actualHeight'] = result.result.actualHeight;
                  metadata['file']['actualWidth'] = result.result.actualWidth;
                  metadata['file']['link'] = "".concat(SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS, "/api/images/").concat(result.result.hash, "?checkUserGroupAccess=true");
                  transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                    chatSendQueueHandler();
                  });
                } else {
                  deleteFromChatUploadQueue({
                    message: {
                      uniqueId: fileUniqueId
                    }
                  });
                }
              });
            } else {
              _events.chatEvents.fireEvent('error', {
                code: 999,
                message: 'Thread picture can be a image type only!'
              });
            }
          });
        });
      } else if (typeof params.image == 'string' && params.image.length > 5) {
        threadInfoContent.metadata = JSON.stringify(Object.assign(threadInfoContent.metadata, {
          fileHash: params.image
        }));
        getImageDownloadLinkFromPodspaceNew({
          hashCode: params.image
        }, function (result) {
          if (!result.hasError) {
            threadInfoContent.image = result.downloadUrl;
          }
        });
        return chatMessaging.sendMessage({
          chatMessageVOType: _constants.chatMessageVOTypes.UPDATE_THREAD_INFO,
          typeCode: _sdkParams.sdkParams.generalTypeCode,
          //params.typeCode,
          subjectId: threadId,
          content: threadInfoContent,
          metadata: threadInfoContent.metadata,
          uniqueId: fileUniqueId,
          pushMsgType: 3,
          token: _sdkParams.sdkParams.token
        }, {
          onResult: function onResult(result) {
            callback && callback(result);
          }
        });
      } else {
        if (Object.keys(threadInfoContent.metadata).length === 0) {
          delete threadInfoContent.metadata;
        }

        return chatMessaging.sendMessage({
          chatMessageVOType: _constants.chatMessageVOTypes.UPDATE_THREAD_INFO,
          typeCode: _sdkParams.sdkParams.generalTypeCode,
          //params.typeCode,
          subjectId: threadId,
          content: threadInfoContent,
          metadata: threadInfoContent.metadata,
          uniqueId: fileUniqueId,
          pushMsgType: 3,
          token: _sdkParams.sdkParams.token
        }, {
          onResult: function onResult(result) {
            callback && callback(result);
          }
        });
      }
    }
  },

  /**
   * Update Chat Profile
   *
   * This functions updates metadata of thread
   *
   * @access private
   *
   * @param {int}       threadId      Id of thread
   * @param {string}    image         URL og thread image to be set
   * @param {string}    description   Description for thread
   * @param {string}    title         New Title for thread
   * @param {object}    metadata      New Metadata to be set on thread
   * @param {function}  callback      The callback function to call after
   *
   * @return {object} Instant sendMessage result
   */
  updateChatProfile = function updateChatProfile(params, callback) {
    var updateChatProfileData = {
      chatMessageVOType: _constants.chatMessageVOTypes.UPDATE_CHAT_PROFILE,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.bio == 'string') {
        updateChatProfileData.content.bio = params.bio;
      }

      if ((0, _typeof2["default"])(params.metadata) == 'object') {
        updateChatProfileData.content.metadata = JSON.stringify(params.metadata);
      } else if (typeof params.metadata == 'string') {
        updateChatProfileData.content.metadata = params.metadata;
      }
    }

    return chatMessaging.sendMessage(updateChatProfileData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },

  /**
   * Get Participant Roles
   *
   * This functions retrieves roles of an user if they are
   * part of the thread
   *
   * @access private
   *
   * @param {int}       threadId      Id of thread
   * @param {function}  callback      The callback function to call after
   *
   * @return {object} Instant sendMessage result
   */
  getCurrentUserRoles = function getCurrentUserRoles(params, callback) {
    var updateChatProfileData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_PARTICIPANT_ROLES,
      pushMsgType: 3,
      subjectId: params.threadId,
      token: _sdkParams.sdkParams.token
    };
    return chatMessaging.sendMessage(updateChatProfileData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },

  /**
   * Get Thread Participants
   *
   * Gets participants list of given thread
   *
   * @access pubic
   *
   * @param {int}     threadId        Id of thread which you want to get participants of
   * @param {int}     count           Count of objects to get
   * @param {int}     offset          Offset of select Query
   * @param {string}  name            Search in Participants list (LIKE in name, contactName, email)
   *
   * @return {object} Instant Response
   */
  getThreadParticipants = function getThreadParticipants(params, callback) {
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.THREAD_PARTICIPANTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      subjectId: params.threadId
    },
        returnCache = false;
    var offset = parseInt(params.offset) > 0 ? parseInt(params.offset) : 0,
        count = parseInt(params.count) > 0 ? parseInt(params.count) : config.getHistoryCount;
    sendMessageParams.content.count = count;
    sendMessageParams.content.offset = offset;

    if (typeof params.name === 'string') {
      sendMessageParams.content.name = params.name;
    }

    if (typeof params.username === 'string') {
      sendMessageParams.content.username = params.username;
    }

    if (typeof params.cellphoneNumber === 'string') {
      sendMessageParams.content.cellphoneNumber = params.cellphoneNumber;
    }

    if (typeof params.admin === 'boolean') {
      sendMessageParams.content.admin = params.admin;
    }

    var functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true;
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            participants: reformatThreadParticipants(messageContent, params.threadId),
            contentCount: result.contentCount,
            hasNext: sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0,
            nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
          };
          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;

        if (!returnData.hasError && returnCache) {
          _events.chatEvents.fireEvent('threadEvents', {
            type: 'THREAD_PARTICIPANTS_LIST_CHANGE',
            threadId: params.threadId,
            result: returnData.result
          });
        }
      }
    });
  },

  /**
   * Deliver
   *
   * This functions sends delivery messages for a message
   *
   * @access private
   *
   * @param {int}   messageId  Id of Message
   *
   * @return {object} Instant sendMessage result
   */
  deliver = function deliver(params) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.DELIVERY,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: params.messageId,
      pushMsgType: 3
    });
  },

  /**
   * Seen
   *
   * This functions sends seen acknowledge for a message
   *
   * @access private
   *
   * @param {int}   messageId  Id of Message
   *
   * @return {object} Instant sendMessage result
   */
  seen = function seen(params) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.SEEN,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: params.messageId,
      pushMsgType: 3
    });
  },

  /**
   * Get Image.
   *
   * This functions gets an uploaded image from File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {int}    imageId         ID of image
   * @param {int}     width           Required width to get
   * @param {int}     height          Required height to get
   * @param {boolean} actual          Required height to get
   * @param {boolean} downloadable    TRUE to be downloadable / FALSE to not
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {object} Image Object
   */
  getImage = function getImage(params, callback) {
    var getImageData = {};

    if (params) {
      if (parseInt(params.imageId) > 0) {
        getImageData.imageId = params.imageId;
      }

      if (typeof params.hashCode == 'string') {
        getImageData.hashCode = params.hashCode;
      }

      if (parseInt(params.width) > 0) {
        getImageData.width = params.width;
      }

      if (parseInt(params.height) > 0) {
        getImageData.height = params.height;
      }

      if (parseInt(params.actual) > 0) {
        getImageData.actual = params.actual;
      }

      if (parseInt(params.downloadable) > 0) {
        getImageData.downloadable = params.downloadable;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.GET_IMAGE,
      method: 'GET',
      data: getImageData
    }, function (result) {
      if (!result.hasError) {
        var queryString = '?';

        for (var i in params) {
          queryString += i + '=' + params[i] + '&';
        }

        queryString = queryString.slice(0, -1);
        var image = SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.GET_IMAGE + queryString;
        callback({
          hasError: result.hasError,
          result: image
        });
      } else {
        callback({
          hasError: true
        });
      }
    });
  },

  /**
   * Get File.
   *
   * This functions gets an uploaded file from File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {int}    fileId          ID of file
   * @param {boolean} downloadable    TRUE to be downloadable / False to not
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {object} File Object
   */
  getFile = function getFile(params, callback) {
    var getFileData = {};

    if (params) {
      if (typeof params.fileId !== 'undefined') {
        getFileData.fileId = params.fileId;
      }

      if (typeof params.hashCode == 'string') {
        getFileData.hashCode = params.hashCode;
      }

      if (typeof params.downloadable == 'boolean') {
        getFileData.downloadable = params.downloadable;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.GET_FILE,
      method: 'GET',
      data: getFileData
    }, function (result) {
      if (!result.hasError) {
        var queryString = '?';

        for (var i in params) {
          queryString += i + '=' + params[i] + '&';
        }

        queryString = queryString.slice(0, -1);
        var file = SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.GET_FILE + queryString;
        callback({
          hasError: result.hasError,
          result: file
        });
      } else {
        callback({
          hasError: true
        });
      }
    });
  },

  /**
   * Deprecated
   *
   * Get File From PodSpace
   *
   * This functions gets an uploaded file from Pod Space File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {object} File Object
   */
  getFileFromPodspace = function getFileFromPodspace(params, callback) {
    var downloadUniqueId = _utility["default"].generateUUID(),
        getFileData = {};

    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        getFileData.hash = params.hashCode;
      } else {
        callback({
          hasError: true,
          error: 'Enter a file hash to get'
        });
        return;
      }
    }

    if (params.responseType === 'link') {
      var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE + "?hash=".concat(params.hashCode, "&_token_=").concat(_sdkParams.sdkParams.token, "&_token_issuer_=1");
      callback({
        hasError: false,
        type: 'link',
        result: returnLink
      });
    } else {
      httpRequest({
        url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE,
        method: 'GET',
        responseType: 'blob',
        uniqueId: downloadUniqueId,
        headers: {
          '_token_': _sdkParams.sdkParams.token,
          '_token_issuer_': 1 // 'Range': 'bytes=100-200'

        },
        data: getFileData
      }, function (result) {
        if (!result.hasError) {
          callback({
            hasError: result.hasError,
            result: result.result.response,
            type: 'blob'
          });
        } else {
          callback({
            hasError: true
          });
        }
      });
      return {
        uniqueId: downloadUniqueId,
        cancel: function cancel() {
          cancelFileDownload({
            uniqueId: downloadUniqueId
          }, function () {
            _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - File download has been canceled!"));
          });
        }
      };
    }
  },

  /**
   * Get File From PodSpace New
   *
   * This functions gets an uploaded file from Pod Space File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {object} File Object
   */
  getFileFromPodspaceNew = function getFileFromPodspaceNew(params, callback) {
    var downloadUniqueId = _utility["default"].generateUUID(),
        getFileData = {};

    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        getFileData.hash = params.hashCode;
      } else {
        callback({
          hasError: true,
          error: 'Enter a file hash to get'
        });
        return;
      }

      if (params.checkUserGroupAccess) {
        getFileData.checkUserGroupAccess = true;
      }
    }

    if (params.responseType === 'link') {
      var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE_NEW.replace('{fileHash}', params.hashCode) + "?checkUserGroupAccess=true";
      callback({
        hasError: false,
        type: 'link',
        result: returnLink
      });
    } else {
      httpRequest({
        url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE_NEW.replace('{fileHash}', params.hashCode) + "?checkUserGroupAccess=true",
        method: 'GET',
        responseType: 'blob',
        uniqueId: downloadUniqueId,
        headers: {
          'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
        },
        enableDownloadProgressEvents: params.enableDownloadProgressEvents,
        hashCode: params.hashCode //data: getFileData

      }, function (result) {
        if (!result.hasError) {
          callback({
            hasError: result.hasError,
            result: result.result.response,
            type: 'blob'
          });
        } else {
          callback({
            hasError: true
          });
        }
      });
      return {
        uniqueId: downloadUniqueId,
        cancel: function cancel() {
          cancelFileDownload({
            uniqueId: downloadUniqueId
          }, function () {
            _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - File download has been canceled!"));
          });
        }
      };
    }
  },

  /**
   * Deprecated
   *
   * Get Image From PodSpace
   *
   * This functions gets an uploaded image from Pod Space File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   * @param {string}  size            (1: 100×75, 2: 200×150, 3: 400×300)
   * @param {string}  quality         Image quality betwenn 0.0 anf 1.0
   *
   * @return {object} File Object
   */
  getImageFromPodspace = function getImageFromPodspace(params, callback) {
    var downloadUniqueId = _utility["default"].generateUUID(),
        getImageData = {
      size: params.size,
      quality: params.quality,
      crop: params.crop
    };

    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        getImageData.hash = params.hashCode;
      } else {
        callback({
          hasError: true,
          error: 'Enter a file hash to get'
        });
        return;
      }

      if (params.responseType === 'link') {
        var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE + "?hash=".concat(params.hashCode, "&_token_=").concat(_sdkParams.sdkParams.token, "&_token_issuer_=1&size=").concat(params.size, "&quality=").concat(params.quality, "&crop=").concat(params.crop);
        callback({
          hasError: false,
          type: 'link',
          result: returnLink
        });
      } else if (params.responseType === 'base64') {
        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE,
          method: 'GET',
          uniqueId: downloadUniqueId,
          responseType: 'blob',
          headers: {
            '_token_': _sdkParams.sdkParams.token,
            '_token_issuer_': 1
          },
          data: getImageData
        }, function (result) {
          if (!result.hasError) {
            var fr = new FileReader();

            fr.onloadend = function () {
              callback({
                hasError: result.hasError,
                type: 'base64',
                result: fr.result
              });
            };

            fr.readAsDataURL(result.result.response);
          } else {
            callback({
              hasError: true
            });
          }
        });
        return {
          uniqueId: downloadUniqueId,
          cancel: function cancel() {
            cancelFileDownload({
              uniqueId: downloadUniqueId
            }, function () {
              _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - Image download has been canceled!"));
            });
          }
        };
      } else {
        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE,
          method: 'GET',
          responseType: 'blob',
          uniqueId: downloadUniqueId,
          headers: {
            '_token_': _sdkParams.sdkParams.token,
            '_token_issuer_': 1
          },
          data: getImageData
        }, function (result) {
          if (!result.hasError) {
            callback({
              hasError: result.hasError,
              type: 'blob',
              result: result.result.response
            });
          } else {
            callback({
              hasError: true
            });
          }
        });
        return {
          uniqueId: downloadUniqueId,
          cancel: function cancel() {
            cancelFileDownload({
              uniqueId: downloadUniqueId
            }, function () {
              _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - Image download has been canceled!"));
            });
          }
        };
      }
    }
  },

  /**
   * Get Image From PodSpace New
   *
   * This functions gets an uploaded image from Pod Space File Server.
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   * @param {string}  size            (1: 100×75, 2: 200×150, 3: 400×300)
   * @param {string}  quality         Image quality betwenn 0.0 anf 1.0
   *
   * @return {object} File Object
   */
  getImageFromPodspaceNew = function getImageFromPodspaceNew(params, callback) {
    var downloadUniqueId = _utility["default"].generateUUID(),
        getImageData = {
      size: params.size,
      quality: params.quality,
      crop: params.crop
    };

    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        getImageData.hash = params.hashCode;
      } else {
        callback({
          hasError: true,
          error: 'Enter a file hash to get'
        });
        return;
      }

      if (params.responseType === 'link') {
        var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + "?checkUserGroupAccess=true&size=".concat(params.size, "&quality=").concat(params.quality, "&crop=").concat(params.crop); //+ SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE + `?hash=${params.hashCode}&_token_=${token}&_token_issuer_=1&size=${params.size}&quality=${params.quality}&crop=${params.crop}`;

        callback({
          hasError: false,
          type: 'link',
          result: returnLink
        });
      } else if (params.responseType === 'base64') {
        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + "?checkUserGroupAccess=true&size=".concat(params.size, "&quality=").concat(params.quality, "&crop=").concat(params.crop),
          method: 'GET',
          uniqueId: downloadUniqueId,
          responseType: 'blob',
          headers: {
            'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
          },
          enableDownloadProgressEvents: params.enableDownloadProgressEvents,
          hashCode: params.hashCode //data: getImageData

        }, function (result) {
          if (!result.hasError) {
            var fr = new FileReader();

            fr.onloadend = function () {
              callback({
                hasError: result.hasError,
                type: 'base64',
                result: fr.result
              });
            };

            fr.readAsDataURL(result.result.response);
          } else {
            callback({
              hasError: true
            });
          }
        });
        return {
          uniqueId: downloadUniqueId,
          cancel: function cancel() {
            cancelFileDownload({
              uniqueId: downloadUniqueId
            }, function () {
              _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - Image download has been canceled!"));
            });
          }
        };
      } else {
        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + "?checkUserGroupAccess=true&size=".concat(params.size, "&quality=").concat(params.quality, "&crop=").concat(params.crop),
          method: 'GET',
          responseType: 'blob',
          uniqueId: downloadUniqueId,
          headers: {
            'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
          },
          enableDownloadProgressEvents: params.enableDownloadProgressEvents,
          hashCode: params.hashCode //data: getImageData

        }, function (result) {
          if (!result.hasError) {
            callback({
              hasError: result.hasError,
              type: 'blob',
              result: result.result.response
            });
          } else {
            callback({
              hasError: true
            });
          }
        });
        return {
          uniqueId: downloadUniqueId,
          cancel: function cancel() {
            cancelFileDownload({
              uniqueId: downloadUniqueId
            }, function () {
              _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(downloadUniqueId, "\" - Image download has been canceled!"));
            });
          }
        };
      }
    }
  },

  /**
   * Deprecated
   *
   * Get Image Download Link From PodSpace
   *
   * This functions gets an uploaded image download link from Pod Space File Server.
   *
   * @since 9.1.3
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {string} Image Link
   */
  getImageDownloadLinkFromPodspace = function getImageDownloadLinkFromPodspace(params, callback) {
    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        var downloadUrl = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE + '?hash=' + params.hashCode;
        callback && callback({
          hasError: false,
          downloadUrl: downloadUrl
        });
        return downloadUrl;
      } else {
        callback && callback({
          hasError: true,
          error: 'Enter a image hash to get download link!'
        });
      }
    }
  },

  /**
   * Get Image Download Link From PodSpace
   *
   * This functions gets an uploaded image download link from Pod Space File Server.
   *
   * @since 9.1.3
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {string} Image Link
   */
  getImageDownloadLinkFromPodspaceNew = function getImageDownloadLinkFromPodspaceNew(params, callback) {
    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        var downloadUrl = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode); // + '?hash=' + params.hashCode;

        callback && callback({
          hasError: false,
          downloadUrl: downloadUrl
        });
        return downloadUrl;
      } else {
        callback && callback({
          hasError: true,
          error: 'Enter a image hash to get download link!'
        });
      }
    }
  },

  /**
   * Get File Download Link From PodSpace
   *
   * This functions gets an uploaded file download link from Pod Space File Server.
   *
   * @since 9.1.3
   * @access private
   *
   * @param {string}  hashCode        HashCode of uploaded file
   *
   * @return {string} File Link
   */
  getFileDownloadLinkFromPodspace = function getFileDownloadLinkFromPodspace(params, callback) {
    if (params) {
      if (params.hashCode && typeof params.hashCode == 'string') {
        var downloadUrl = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE + '?hash=' + params.hashCode;
        callback && callback({
          hasError: false,
          downloadUrl: downloadUrl
        });
        return downloadUrl;
      } else {
        callback && callback({
          hasError: true,
          error: 'Enter a file hash to get download link!'
        });
      }
    }
  },

  /**
   * Upload File
   *
   * Upload files to File Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    file            FILE: the file
   *
   * @link http://docs.pod.land/v1.0.8.0/Developer/CustomPost/605/File
   *
   * @return {object} Uploaded File Object
   */
  uploadFile = function uploadFile(params, callback) {
    var fileName, fileType, fileSize, fileExtension, uploadUniqueId, uploadThreadId;
    fileName = params.file.name;
    fileType = params.file.type;
    fileSize = params.file.size;
    fileExtension = params.file.name.split('.').pop();
    var uploadFileData = {};

    if (params) {
      if (typeof params.file !== 'undefined') {
        uploadFileData.file = params.file;
      }

      if (params.randomFileName) {
        uploadFileData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
      } else {
        uploadFileData.fileName = fileName;
      }

      uploadFileData.fileSize = fileSize;

      if (parseInt(params.threadId) > 0) {
        uploadThreadId = params.threadId;
        uploadFileData.threadId = params.threadId;
      } else {
        uploadThreadId = 0;
        uploadFileData.threadId = 0;
      }

      if (typeof params.uniqueId == 'string') {
        uploadUniqueId = params.uniqueId;
        uploadFileData.uniqueId = params.uniqueId;
      } else {
        uploadUniqueId = _utility["default"].generateUUID();
        uploadFileData.uniqueId = uploadUniqueId;
      }

      if (typeof params.originalFileName == 'string') {
        uploadFileData.originalFileName = params.originalFileName;
      } else {
        uploadFileData.originalFileName = fileName;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.UPLOAD_FILE,
      method: 'POST',
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      },
      data: uploadFileData,
      uniqueId: uploadUniqueId
    }, function (result) {
      if (!result.hasError) {
        try {
          var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;
          callback({
            hasError: response.hasError,
            result: response.result
          });
        } catch (e) {
          callback({
            hasError: true,
            errorCode: 999,
            errorMessage: 'Problem in Parsing result'
          });
        }
      } else {
        callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
      }
    });
    return {
      uniqueId: uploadUniqueId,
      threadId: uploadThreadId,
      participant: chatMessaging.userInfo,
      content: {
        caption: params.content,
        file: {
          uniqueId: uploadUniqueId,
          fileName: fileName,
          fileSize: fileSize,
          fileObject: params.file
        }
      }
    };
  },

  /**
   * Upload File To Pod Space
   *
   * Upload files to Pod Space Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    file            FILE: the file
   * @param {string}  userGroupHash   Unique identifier of threads on podspace
   * @param {string}  token           User Token
   * @param {string}  _token_issuer_  Token Issuer
   *
   * @link
      *
      * @return {object} Uploaded File Object
   */
  uploadFileToPodspace = function uploadFileToPodspace(params, callback) {
    var fileName, fileType, fileSize, fileExtension, uploadUniqueId, uploadThreadId;
    fileName = params.file.name;
    fileType = params.file.type;
    fileSize = params.file.size;
    fileExtension = params.file.name.split('.').pop();
    var uploadFileData = {};

    if (params) {
      if (typeof params.file !== 'undefined') {
        uploadFileData.file = params.file;
      }

      if (params.randomFileName) {
        uploadFileData.filename = _utility["default"].generateUUID() + '.' + fileExtension;
      } else {
        uploadFileData.filename = fileName;
      }

      uploadFileData.fileSize = fileSize;

      if (parseInt(params.threadId) > 0) {
        uploadThreadId = params.threadId;
        uploadFileData.threadId = params.threadId;
      } else {
        uploadThreadId = 0;
        uploadFileData.threadId = 0;
      }

      if (typeof params.uniqueId == 'string') {
        uploadUniqueId = params.uniqueId;
        uploadFileData.uniqueId = params.uniqueId;
      } else {
        uploadUniqueId = _utility["default"].generateUUID();
        uploadFileData.uniqueId = uploadUniqueId;
      }

      if (typeof params.userGroupHash == 'string') {
        //userGroupHash = params.userGroupHash;
        uploadFileData.userGroupHash = params.userGroupHash;
      } else {
        callback({
          hasError: true,
          errorCode: 999,
          errorMessage: 'You need to enter a userGroupHash to be able to upload on PodSpace!'
        });
        return;
      }

      if (typeof params.originalFileName == 'string') {
        uploadFileData.originalFileName = params.originalFileName;
      } else {
        uploadFileData.originalFileName = fileName;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_FILE_TO_USERGROUP,
      method: 'POST',
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      },
      data: uploadFileData,
      uniqueId: uploadUniqueId
    }, function (result) {
      if (!result.hasError) {
        try {
          var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;
          callback({
            hasError: response.hasError,
            result: response.result
          });
        } catch (e) {
          callback({
            hasError: true,
            errorCode: 999,
            errorMessage: 'Problem in Parsing result'
          });
        }
      } else {
        callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
      }
    });
    return {
      uniqueId: uploadUniqueId,
      threadId: uploadThreadId,
      participant: chatMessaging.userInfo,
      content: {
        caption: params.content,
        file: {
          uniqueId: uploadUniqueId,
          fileName: fileName,
          fileSize: fileSize,
          fileObject: params.file
        }
      }
    };
  },
      uploadFileToPodspaceNew = function uploadFileToPodspaceNew(params, callback) {
    var fileName, fileType, fileSize, fileExtension, uploadUniqueId, uploadThreadId;
    fileName = params.file.name;
    fileType = params.file.type;
    fileSize = params.file.size;
    fileExtension = params.file.name.split('.').pop();
    var uploadFileData = {};

    if (params) {
      if (typeof params.file !== 'undefined') {
        uploadFileData.file = params.file;
      }

      if (params.randomFileName) {
        uploadFileData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
      } else {
        uploadFileData.fileName = fileName;
      }

      uploadFileData.fileSize = fileSize;

      if (parseInt(params.threadId) > 0) {
        uploadThreadId = params.threadId;
        uploadFileData.threadId = params.threadId;
      } else {
        uploadThreadId = 0;
        uploadFileData.threadId = 0;
      }

      if (typeof params.uniqueId == 'string') {
        uploadUniqueId = params.uniqueId;
        uploadFileData.uniqueId = params.uniqueId;
      } else {
        uploadUniqueId = _utility["default"].generateUUID();
        uploadFileData.uniqueId = uploadUniqueId;
      }

      if (typeof params.originalFileName == 'string') {
        uploadFileData.originalFileName = params.originalFileName;
      } else {
        uploadFileData.originalFileName = fileName;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_FILE_NEW,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
      },
      data: uploadFileData,
      uniqueId: uploadUniqueId
    }, function (result) {
      if (!result.hasError) {
        try {
          var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;
          callback({
            hasError: response.hasError,
            result: response.result
          });
        } catch (e) {
          callback({
            hasError: true,
            errorCode: 999,
            errorMessage: 'Problem in Parsing result'
          });
        }
      } else {
        callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
      }
    });
    return {
      uniqueId: uploadUniqueId,
      threadId: uploadThreadId,
      participant: chatMessaging.userInfo,
      content: {
        caption: params.content,
        file: {
          uniqueId: uploadUniqueId,
          fileName: fileName,
          fileSize: fileSize,
          fileObject: params.file
        }
      }
    };
  },

  /**
   * Upload File To Pod Space
   *
   * Upload files to Pod Space Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {file}    file            FILE: the file
   * @param {string}  userGroupHash   Unique identifier of threads on podspace
   * @param {string}  token           User Token
   *
   * @link
      *
      * @return {object} Uploaded File Object
   */
  uploadFileToPodspaceUserGroupNew = function uploadFileToPodspaceUserGroupNew(params, callback) {
    var fileName, //fileType,
    fileSize, //fileExtension,
    uploadUniqueId, uploadThreadId;
    fileName = params.file.name; //fileType = params.file.type;

    fileSize = params.file.size; //fileExtension = params.file.name.split('.').pop();

    var uploadFileData = {};

    if (params) {
      if (typeof params.file !== 'undefined') {
        uploadFileData.file = params.file;
      }

      if (parseInt(params.threadId) > 0) {
        uploadThreadId = params.threadId;
        uploadFileData.threadId = params.threadId;
      } else {
        uploadThreadId = 0;
        uploadFileData.threadId = 0;
      }

      if (typeof params.uniqueId == 'string') {
        uploadUniqueId = params.uniqueId;
        uploadFileData.uniqueId = params.uniqueId;
      } else {
        uploadUniqueId = _utility["default"].generateUUID();
        uploadFileData.uniqueId = uploadUniqueId;
      }

      if (typeof params.userGroupHash == 'string') {
        uploadFileData.userGroupHash = params.userGroupHash;
      } else {
        callback({
          hasError: true,
          errorCode: 999,
          errorMessage: 'You need to enter a userGroupHash to be able to upload on PodSpace!'
        });
        return;
      }

      if (typeof params.originalFileName == 'string') {
        uploadFileData.originalFileName = params.originalFileName;
      } else {
        uploadFileData.originalFileName = fileName;
      }
    }

    httpRequest({
      url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_FILE_TO_USERGROUP_NEW.replace('{userGroupHash}', uploadFileData.userGroupHash),
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
      },
      data: uploadFileData,
      uniqueId: uploadUniqueId
    }, function (result) {
      if (!result.hasError) {
        try {
          var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;
          callback({
            hasError: response.hasError,
            result: response.result
          });
        } catch (e) {
          callback({
            hasError: true,
            errorCode: 999,
            errorMessage: 'Problem in Parsing result'
          });
        }
      } else {
        callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
      }
    });
    return {
      uniqueId: uploadUniqueId,
      threadId: uploadThreadId,
      participant: chatMessaging.userInfo,
      content: {
        caption: params.content,
        file: {
          uniqueId: uploadUniqueId,
          fileName: fileName,
          fileSize: fileSize,
          fileObject: params.file
        }
      }
    };
  },

  /**
   * Upload File
   *
   * Upload files to File Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    file            FILE: the file
   *
   * @link http://docs.pod.land/v1.0.8.0/Developer/CustomPost/605/File
   *
   * @return {object} Uploaded File Object
   */
  uploadFileFromUrl = function uploadFileFromUrl(params, callback) {
    var uploadUniqueId, uploadThreadId;
    var uploadFileData = {},
        fileExtension;

    if (params) {
      if (typeof params.fileUrl !== 'undefined') {
        uploadFileData.url = params.fileUrl;
      }

      if (typeof params.fileExtension !== 'undefined') {
        fileExtension = params.fileExtension;
      } else {
        fileExtension = 'png';
      }

      if (typeof params.fileName == 'string') {
        uploadFileData.filename = params.fileName;
      } else {
        uploadFileData.filename = _utility["default"].generateUUID() + '.' + fileExtension;
      }

      if (typeof params.uniqueId == 'string') {
        uploadUniqueId = params.uniqueId;
      } else {
        uploadUniqueId = _utility["default"].generateUUID();
      }

      if (parseInt(params.threadId) > 0) {
        uploadThreadId = params.threadId;
      } else {
        uploadThreadId = 0;
      }

      uploadFileData.isPublic = true;
    }

    httpRequest({
      url: SERVICE_ADDRESSES.POD_DRIVE_ADDRESS + SERVICES_PATH.DRIVE_UPLOAD_FILE_FROM_URL,
      method: 'POST',
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      },
      data: uploadFileData,
      uniqueId: uploadUniqueId
    }, function (result) {
      if (!result.hasError) {
        try {
          var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;
          callback({
            hasError: response.hasError,
            result: response.result
          });
        } catch (e) {
          callback({
            hasError: true,
            errorCode: 999,
            errorMessage: 'Problem in Parsing result',
            error: e
          });
        }
      } else {
        callback({
          hasError: true,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });
      }
    });
    return {
      uniqueId: uploadUniqueId,
      threadId: uploadThreadId,
      participant: chatMessaging.userInfo,
      content: {
        file: {
          uniqueId: uploadUniqueId,
          fileUrl: params.fileUrl
        }
      }
    };
  },

  /**
   * Upload Image
   *
   * Upload images to Image Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    image           FILE: the image file  (if its an image file)
   * @param {float}   xC              Crop Start point x    (if its an image file)
   * @param {float}   yC              Crop Start point Y    (if its an image file)
   * @param {float}   hC              Crop size Height      (if its an image file)
   * @param {float}   wC              Crop size Weight      (if its an image file)
   *
   * @link http://docs.pod.land/v1.0.8.0/Developer/CustomPost/215/UploadImage
   *
   * @return {object} Uploaded Image Object
   */
  uploadImage = function uploadImage(params, callback) {
    var fileName, fileType, fileSize, fileExtension, uploadUniqueId, uploadThreadId;
    fileName = params.image.name;
    fileType = params.image.type;
    fileSize = params.image.size;
    fileExtension = params.image.name.split('.').pop();

    if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
      var uploadImageData = {};

      if (params) {
        if (typeof params.image !== 'undefined') {
          uploadImageData.image = params.image;
          uploadImageData.file = params.image;
        }

        if (params.randomFileName) {
          uploadImageData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
        } else {
          uploadImageData.fileName = fileName;
        }

        uploadImageData.fileSize = fileSize;

        if (parseInt(params.threadId) > 0) {
          uploadThreadId = params.threadId;
          uploadImageData.threadId = params.threadId;
        } else {
          uploadThreadId = 0;
          uploadImageData.threadId = 0;
        }

        if (typeof params.uniqueId == 'string') {
          uploadUniqueId = params.uniqueId;
          uploadImageData.uniqueId = params.uniqueId;
        } else {
          uploadUniqueId = _utility["default"].generateUUID();
          uploadImageData.uniqueId = uploadUniqueId;
        }

        if (typeof params.originalFileName == 'string') {
          uploadImageData.originalFileName = params.originalFileName;
        } else {
          uploadImageData.originalFileName = fileName;
        }

        if (parseInt(params.xC) > 0) {
          uploadImageData.xC = params.xC;
        }

        if (parseInt(params.yC) > 0) {
          uploadImageData.yC = params.yC;
        }

        if (parseInt(params.hC) > 0) {
          uploadImageData.hC = params.hC;
        }

        if (parseInt(params.wC) > 0) {
          uploadImageData.wC = params.wC;
        }
      }

      httpRequest({
        url: SERVICE_ADDRESSES.FILESERVER_ADDRESS + SERVICES_PATH.UPLOAD_IMAGE,
        method: 'POST',
        headers: {
          '_token_': _sdkParams.sdkParams.token,
          '_token_issuer_': 1
        },
        data: uploadImageData,
        uniqueId: uploadUniqueId
      }, function (result) {
        if (!result.hasError) {
          try {
            var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;

            if (typeof response.hasError !== 'undefined' && !response.hasError) {
              callback({
                hasError: response.hasError,
                result: response.result
              });
            } else {
              callback({
                hasError: true,
                errorCode: response.errorCode,
                errorMessage: response.message
              });
            }
          } catch (e) {
            callback({
              hasError: true,
              errorCode: 6300,
              errorMessage: CHAT_ERRORS[6300]
            });
          }
        } else {
          callback({
            hasError: true,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
          });
        }
      });
      return {
        uniqueId: uploadUniqueId,
        threadId: uploadThreadId,
        participant: chatMessaging.userInfo,
        content: {
          caption: params.content,
          file: {
            uniqueId: uploadUniqueId,
            fileName: fileName,
            fileSize: fileSize,
            fileObject: params.file
          }
        }
      };
    } else {
      callback({
        hasError: true,
        errorCode: 6301,
        errorMessage: CHAT_ERRORS[6301]
      });
    }
  },

  /**
   * Upload Image To Pod Space Publically
   *
   * Upload images to Pod Space Image Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    image           FILE: the image file  (if its an image file)
   * @param {float}   xC              Crop Start point x    (if its an image file)
   * @param {float}   yC              Crop Start point Y    (if its an image file)
   * @param {float}   hC              Crop size Height      (if its an image file)
   * @param {float}   wC              Crop size Weight      (if its an image file)
   * @param {string}  token           User Token
   * @param {string}  _token_issuer_  Token Issuer
   *
   * @link https://podspace.pod.ir/apidocs/?srv=/nzh/drive/uploadImage
   *
   * @return {object} Uploaded Image Object
   */
  uploadImageToPodspace = function uploadImageToPodspace(params, callback) {
    var fileName,
        fileType,
        fileSize,
        fileWidth = 0,
        fileHeight = 0,
        fileExtension,
        uploadUniqueId,
        uploadThreadId;
    fileName = params.image.name;
    fileType = params.image.type;
    fileSize = params.image.size;
    fileExtension = params.image.name.split('.').pop();
    var reader = new FileReader();

    reader.onload = function (e) {
      var image = new Image();

      image.onload = function () {
        fileWidth = this.width;
        fileHeight = this.height;
        continueImageUpload(params);
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(params.image);

    var continueImageUpload = function continueImageUpload(params) {
      if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
        var uploadImageData = {};

        if (params) {
          if (typeof params.image !== 'undefined') {
            uploadImageData.file = params.image;
          } else {
            callback({
              hasError: true,
              errorCode: 999,
              errorMessage: 'You need to send a image file!'
            });
            return;
          }

          if (params.randomFileName) {
            uploadImageData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
          } else {
            uploadImageData.filename = fileName;
          }

          uploadImageData.fileSize = fileSize;

          if (parseInt(params.threadId) > 0) {
            uploadThreadId = params.threadId;
            uploadImageData.threadId = params.threadId;
          } else {
            uploadThreadId = 0;
            uploadImageData.threadId = 0;
          }

          if (typeof params.uniqueId == 'string') {
            uploadUniqueId = params.uniqueId;
            uploadImageData.uniqueId = params.uniqueId;
          } else {
            uploadUniqueId = _utility["default"].generateUUID();
            uploadImageData.uniqueId = uploadUniqueId;
          }

          if (typeof params.originalFileName == 'string') {
            uploadImageData.originalFileName = params.originalFileName;
          } else {
            uploadImageData.originalFileName = fileName;
          }

          uploadImageData.xC = parseInt(params.xC) || 0;
          uploadImageData.yC = parseInt(params.yC) || 0;
          uploadImageData.hC = parseInt(params.hC) || fileHeight;
          uploadImageData.wC = parseInt(params.wC) || fileWidth;
        }

        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_IMAGE,
          method: 'POST',
          headers: {
            '_token_': _sdkParams.sdkParams.token,
            '_token_issuer_': 1
          },
          data: uploadImageData,
          uniqueId: uploadUniqueId
        }, function (result) {
          if (!result.hasError) {
            try {
              var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;

              if (typeof response.hasError !== 'undefined' && !response.hasError) {
                callback({
                  hasError: response.hasError,
                  result: response.result
                });
              } else {
                callback({
                  hasError: true,
                  errorCode: response.errorCode,
                  errorMessage: response.message
                });
              }
            } catch (e) {
              _sdkParams.sdkParams.consoleLogging && console.log(e);
              callback({
                hasError: true,
                errorCode: 6300,
                errorMessage: CHAT_ERRORS[6300]
              });
            }
          } else {
            callback({
              hasError: true,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage
            });
          }
        });
        return {
          uniqueId: uploadUniqueId,
          threadId: uploadThreadId,
          participant: chatMessaging.userInfo,
          content: {
            caption: params.content,
            file: {
              uniqueId: uploadUniqueId,
              fileName: fileName,
              fileSize: fileSize,
              fileObject: params.file
            }
          }
        };
      } else {
        callback({
          hasError: true,
          errorCode: 6301,
          errorMessage: CHAT_ERRORS[6301]
        });
      }
    };
  },
      uploadImageToPodspaceNew = function uploadImageToPodspaceNew(params, callback) {
    var fileName, fileType, fileSize, fileExtension, uploadUniqueId, uploadThreadId;
    fileName = params.image.name;
    fileType = params.image.type;
    fileSize = params.image.size;
    fileExtension = params.image.name.split('.').pop();

    if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
      var uploadImageData = {};

      if (params) {
        if (typeof params.image !== 'undefined') {
          uploadImageData.image = params.image;
          uploadImageData.file = params.image;
        }

        if (params.randomFileName) {
          uploadImageData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
        } else {
          uploadImageData.fileName = fileName;
        }

        uploadImageData.fileSize = fileSize;

        if (parseInt(params.threadId) > 0) {
          uploadThreadId = params.threadId;
          uploadImageData.threadId = params.threadId;
        } else {
          uploadThreadId = 0;
          uploadImageData.threadId = 0;
        }

        if (typeof params.uniqueId == 'string') {
          uploadUniqueId = params.uniqueId;
          uploadImageData.uniqueId = params.uniqueId;
        } else {
          uploadUniqueId = _utility["default"].generateUUID();
          uploadImageData.uniqueId = uploadUniqueId;
        }

        if (typeof params.originalFileName == 'string') {
          uploadImageData.originalFileName = params.originalFileName;
        } else {
          uploadImageData.originalFileName = fileName;
        }

        if (parseInt(params.xC) > 0) {
          uploadImageData.xC = params.xC;
        }

        if (parseInt(params.yC) > 0) {
          uploadImageData.yC = params.yC;
        }

        if (parseInt(params.hC) > 0) {
          uploadImageData.hC = params.hC;
        }

        if (parseInt(params.wC) > 0) {
          uploadImageData.wC = params.wC;
        }
      }

      httpRequest({
        url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_IMAGE_NEW,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
        },
        data: uploadImageData,
        uniqueId: uploadUniqueId
      }, function (result) {
        if (!result.hasError) {
          try {
            var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;

            if (!response.hasError) {
              callback({
                hasError: response.hasError,
                result: response.result
              });
            } else {
              callback({
                hasError: true,
                errorCode: response.errorCode,
                errorMessage: response.message
              });
            }
          } catch (e) {
            callback({
              hasError: true,
              errorCode: 6300,
              errorMessage: CHAT_ERRORS[6300]
            });
          }
        } else {
          callback({
            hasError: true,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage
          });
        }
      });
      return {
        uniqueId: uploadUniqueId,
        threadId: uploadThreadId,
        participant: chatMessaging.userInfo,
        content: {
          caption: params.content,
          file: {
            uniqueId: uploadUniqueId,
            fileName: fileName,
            fileSize: fileSize,
            fileObject: params.file
          }
        }
      };
    } else {
      callback({
        hasError: true,
        errorCode: 6301,
        errorMessage: CHAT_ERRORS[6301]
      });
    }
  },

  /**
   * Deprecated
   *
   * Upload Image To Pod Space
   *
   * Upload images to Pod Space Image Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    image           FILE: the image file  (if its an image file)
   * @param {float}   xC              Crop Start point x    (if its an image file)
   * @param {float}   yC              Crop Start point Y    (if its an image file)
   * @param {float}   hC              Crop size Height      (if its an image file)
   * @param {float}   wC              Crop size Weight      (if its an image file)
   * @param {string}  userGroupHash   Unique identifier of threads on podspace
   * @param {string}  token           User Token
   * @param {string}  _token_issuer_  Token Issuer
   *
   * @link https://podspace.pod.ir/apidocs/?srv=/userGroup/uploadImage/
   *
   * @return {object} Uploaded Image Object
   */
  uploadImageToPodspaceUserGroup = function uploadImageToPodspaceUserGroup(params, callback) {
    var fileName,
        fileType,
        fileSize,
        fileWidth = 0,
        fileHeight = 0,
        fileExtension,
        uploadUniqueId,
        uploadThreadId;

    var continueImageUpload = function continueImageUpload(params) {
      if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
        var uploadImageData = {};

        if (params) {
          if (typeof params.image !== 'undefined') {
            uploadImageData.file = params.image;
          } else {
            callback({
              hasError: true,
              errorCode: 999,
              errorMessage: 'You need to send a image file!'
            });
            return;
          }

          if (typeof params.userGroupHash == 'string') {
            // userGroupHash = params.userGroupHash;
            uploadImageData.userGroupHash = params.userGroupHash;
          } else {
            callback({
              hasError: true,
              errorCode: 999,
              errorMessage: 'You need to enter a userGroupHash to be able to upload on PodSpace!'
            });
            return;
          }

          if (params.randomFileName) {
            uploadImageData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
          } else {
            uploadImageData.filename = fileName;
          }

          uploadImageData.fileSize = fileSize;

          if (parseInt(params.threadId) > 0) {
            uploadThreadId = params.threadId;
            uploadImageData.threadId = params.threadId;
          } else {
            uploadThreadId = 0;
            uploadImageData.threadId = 0;
          }

          if (typeof params.uniqueId == 'string') {
            uploadUniqueId = params.uniqueId;
            uploadImageData.uniqueId = params.uniqueId;
          } else {
            uploadUniqueId = _utility["default"].generateUUID();
            uploadImageData.uniqueId = uploadUniqueId;
          }

          if (typeof params.originalFileName == 'string') {
            uploadImageData.originalFileName = params.originalFileName;
          } else {
            uploadImageData.originalFileName = fileName;
          }

          uploadImageData.xC = parseInt(params.xC) || 0;
          uploadImageData.yC = parseInt(params.yC) || 0;
          uploadImageData.hC = parseInt(params.hC) || fileHeight;
          uploadImageData.wC = parseInt(params.wC) || fileWidth;
        }

        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_IMAGE_TO_USERGROUP,
          method: 'POST',
          headers: {
            '_token_': _sdkParams.sdkParams.token,
            '_token_issuer_': 1
          },
          data: uploadImageData,
          uniqueId: uploadUniqueId
        }, function (result) {
          if (!result.hasError) {
            try {
              var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;

              if (typeof response.hasError !== 'undefined' && !response.hasError) {
                response.result.actualHeight = fileHeight;
                response.result.actualWidth = fileWidth;
                callback({
                  hasError: response.hasError,
                  result: response.result
                });
              } else {
                callback({
                  hasError: true,
                  errorCode: response.errorCode,
                  errorMessage: response.message
                });
              }
            } catch (e) {
              _sdkParams.sdkParams.consoleLogging && console.log(e);
              callback({
                hasError: true,
                errorCode: 6300,
                errorMessage: CHAT_ERRORS[6300]
              });
            }
          } else {
            callback({
              hasError: true,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage
            });
          }
        });
        return {
          uniqueId: uploadUniqueId,
          threadId: uploadThreadId,
          participant: chatMessaging.userInfo,
          content: {
            caption: params.content,
            file: {
              uniqueId: uploadUniqueId,
              fileName: fileName,
              fileSize: fileSize,
              fileObject: params.file
            }
          }
        };
      } else {
        callback({
          hasError: true,
          errorCode: 6301,
          errorMessage: CHAT_ERRORS[6301]
        });
      }
    };

    fileName = params.image.name;
    fileType = params.image.type;
    fileSize = params.image.size;
    fileExtension = params.image.name.split('.').pop();
    var reader = new FileReader();

    reader.onload = function (e) {
      var image = new Image();

      image.onload = function () {
        fileWidth = this.width;
        fileHeight = this.height;
        continueImageUpload(params);
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(params.image);
  },

  /**
   * Upload Image To Podspace User Group
   *
   * Upload images to Pod Space Image Server
   *
   * @since 3.9.9
   * @access private
   *
   * @param {string}  fileName        A name for the file
   * @param {file}    image           FILE: the image file  (if its an image file)
   * @param {float}   xC              Crop Start point x    (if its an image file)
   * @param {float}   yC              Crop Start point Y    (if its an image file)
   * @param {float}   hC              Crop size Height      (if its an image file)
   * @param {float}   wC              Crop size Weight      (if its an image file)
   * @param {string}  userGroupHash   Unique identifier of threads on podspace
   * @param {string}  token           User Token
   * @param {string}  _token_issuer_  Token Issuer
   *
   * @link https://podspace.pod.ir/apidocs/?srv=/userGroup/uploadImage/
   *
   * @return {object} Uploaded Image Object
   */
  uploadImageToPodspaceUserGroupNew = function uploadImageToPodspaceUserGroupNew(params, callback) {
    var fileName,
        fileType,
        fileSize,
        fileWidth = 0,
        fileHeight = 0,
        fileExtension,
        uploadUniqueId,
        uploadThreadId;

    var continueImageUpload = function continueImageUpload(params) {
      if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
        var uploadImageData = {};

        if (params) {
          if (typeof params.image !== 'undefined') {
            uploadImageData.file = params.image;
          } else {
            callback({
              hasError: true,
              errorCode: 999,
              errorMessage: 'You need to send a image file!'
            });
            return;
          }

          if (typeof params.userGroupHash == 'string') {
            uploadImageData.userGroupHash = params.userGroupHash;
          } else {
            callback({
              hasError: true,
              errorCode: 999,
              errorMessage: 'You need to enter a userGroupHash to be able to upload on PodSpace!'
            });
            return;
          }

          if (params.randomFileName) {
            uploadImageData.fileName = _utility["default"].generateUUID() + '.' + fileExtension;
          } else {
            uploadImageData.filename = fileName;
          }

          uploadImageData.fileSize = fileSize;

          if (parseInt(params.threadId) > 0) {
            uploadThreadId = params.threadId;
            uploadImageData.threadId = params.threadId;
          } else {
            uploadThreadId = 0;
            uploadImageData.threadId = 0;
          }

          if (typeof params.uniqueId == 'string') {
            uploadUniqueId = params.uniqueId;
            uploadImageData.uniqueId = params.uniqueId;
          } else {
            uploadUniqueId = _utility["default"].generateUUID();
            uploadImageData.uniqueId = uploadUniqueId;
          }

          if (typeof params.originalFileName == 'string') {
            uploadImageData.originalFileName = params.originalFileName;
          } else {
            uploadImageData.originalFileName = fileName;
          }

          uploadImageData.x = parseInt(params.xC) || 0;
          uploadImageData.y = parseInt(params.yC) || 0;
          uploadImageData.height = parseInt(params.hC) || fileHeight;
          uploadImageData.weight = parseInt(params.wC) || fileWidth;
        }

        httpRequest({
          url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_UPLOAD_IMAGE_TO_USERGROUP_NEW.replace('{userGroupHash}', uploadImageData.userGroupHash),
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + _sdkParams.sdkParams.token
          },
          data: uploadImageData,
          uniqueId: uploadUniqueId
        }, function (result) {
          if (!result.hasError) {
            try {
              var response = typeof result.result.responseText == 'string' ? JSON.parse(result.result.responseText) : result.result.responseText;

              if (response.status < 400) {
                response.result.actualHeight = fileHeight;
                response.result.actualWidth = fileWidth;
                callback({
                  hasError: response.hasError,
                  result: response.result
                });
              } else {
                callback({
                  hasError: true,
                  errorCode: response.errorCode,
                  errorMessage: response.message
                });
              }
            } catch (e) {
              _sdkParams.sdkParams.consoleLogging && console.log(e);
              callback({
                hasError: true,
                errorCode: 6300,
                errorMessage: CHAT_ERRORS[6300]
              });
            }
          } else {
            callback({
              hasError: true,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage
            });
          }
        });
        return {
          uniqueId: uploadUniqueId,
          threadId: uploadThreadId,
          participant: chatMessaging.userInfo,
          content: {
            caption: params.content,
            file: {
              uniqueId: uploadUniqueId,
              fileName: fileName,
              fileSize: fileSize,
              fileObject: params.file
            }
          }
        };
      } else {
        callback({
          hasError: true,
          errorCode: 6301,
          errorMessage: CHAT_ERRORS[6301]
        });
      }
    };

    fileName = params.image.name;
    fileType = params.image.type;
    fileSize = params.image.size;
    fileExtension = params.image.name.split('.').pop();
    var reader = new FileReader();

    reader.onload = function (e) {
      var image = new Image();

      image.onload = function () {
        fileWidth = this.width;
        fileHeight = this.height;
        continueImageUpload(params);
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(params.image);
  },
      sendFileMessage = function sendFileMessage(params, callbacks) {
    var metadata = {
      file: {}
    },
        fileUploadParams = {},
        fileUniqueId = typeof params.fileUniqueId == 'string' && params.fileUniqueId.length > 0 ? params.fileUniqueId : _utility["default"].generateUUID();

    if (params) {
      if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof params.userGroupHash !== 'string') {
        _events.chatEvents.fireEvent('error', {
          code: 6304,
          message: CHAT_ERRORS[6304]
        });

        return;
      } else {
        fileUploadParams.userGroupHash = params.userGroupHash;
      }

      return chatUploadHandler({
        threadId: params.threadId,
        file: params.file,
        fileUniqueId: fileUniqueId
      }, function (uploadHandlerResult, uploadHandlerMetadata, fileType, fileExtension) {
        fileUploadParams = Object.assign(fileUploadParams, uploadHandlerResult);
        putInChatUploadQueue({
          message: {
            chatMessageVOType: _constants.chatMessageVOTypes.MESSAGE,
            typeCode: _sdkParams.sdkParams.generalTypeCode,
            //params.typeCode,
            messageType: params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && _constants.chatMessageTypes[params.messageType.toUpperCase()] > 0 ? _constants.chatMessageTypes[params.messageType.toUpperCase()] : 1,
            subjectId: params.threadId,
            repliedTo: params.repliedTo,
            content: params.content,
            metadata: JSON.stringify(objectDeepMerger(uploadHandlerMetadata, params.metadata)),
            systemMetadata: JSON.stringify(params.systemMetadata),
            uniqueId: fileUniqueId,
            pushMsgType: 3
          },
          callbacks: callbacks
        }, function () {
          if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
            uploadImageToPodspaceUserGroupNew(fileUploadParams, function (result) {
              if (!result.hasError) {
                // Send onFileUpload callback result
                if ((0, _typeof2["default"])(callbacks) === 'object' && callbacks.hasOwnProperty('onFileUpload')) {
                  callbacks.onFileUpload && callbacks.onFileUpload({
                    name: result.result.name,
                    hashCode: result.result.hash,
                    parentHash: result.result.parentHash,
                    size: result.result.size,
                    actualHeight: result.result.actualHeight,
                    actualWidth: result.result.actualWidth,
                    link: "".concat(SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS, "/api/images/").concat(result.result.hash, "?checkUserGroupAccess=true")
                  });
                }

                metadata['name'] = result.result.name;
                metadata['fileHash'] = result.result.hash;
                metadata['file']['name'] = result.result.name;
                metadata['file']['fileHash'] = result.result.hash;
                metadata['file']['hashCode'] = result.result.hash;
                metadata['file']['parentHash'] = result.result.parentHash;
                metadata['file']['size'] = result.result.size;
                metadata['file']['actualHeight'] = result.result.actualHeight;
                metadata['file']['actualWidth'] = result.result.actualWidth;
                metadata['file']['link'] = "".concat(SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS, "/api/images/").concat(result.result.hash, "?checkUserGroupAccess=true");
                transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                  chatSendQueueHandler();
                });
              } else {
                deleteFromChatUploadQueue({
                  message: {
                    uniqueId: fileUniqueId
                  }
                });
              }
            });
          } else {
            uploadFileToPodspaceUserGroupNew(fileUploadParams, function (result) {
              if (!result.hasError) {
                metadata['fileHash'] = result.result.hash;
                metadata['name'] = result.result.name;
                metadata['file']['name'] = result.result.name;
                metadata['file']['fileHash'] = result.result.hash;
                metadata['file']['hashCode'] = result.result.hash;
                metadata['file']['parentHash'] = result.result.parentHash;
                metadata['file']['size'] = result.result.size;
                transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                  chatSendQueueHandler();
                });
              } else {
                deleteFromChatUploadQueue({
                  message: {
                    uniqueId: fileUniqueId
                  }
                });
              }
            });
          }
        });
      });
    }
  },

  /**
   * Delete Cache Database
   *
   * This function truncates all tables of cache Database
   * and drops whole tables
   *
   * @access private
   *
   * @return {undefined}
   */
  deleteCacheDatabases = function deleteCacheDatabases() {
    (0, _deprecateMethods.printIsDeprecate)(_deprecateMethods.deprecatedString.deleteCacheDatabases.methodName);
    return; // if (db) {
    //     db.close();
    // }
    //
    // if (queueDb) {
    //     queueDb.close();
    // }
    //
    // var chatCacheDB = new Dexie('podChat');
    // if (chatCacheDB) {
    //     chatCacheDB.delete()
    //         .then(function () {
    //             consoleLogging && console.log('PodChat Database successfully deleted!');
    //
    //             var queueDb = new Dexie('podQueues');
    //             if (queueDb) {
    //                 queueDb.delete()
    //                     .then(function () {
    //                         consoleLogging && console.log('PodQueues Database successfully deleted!');
    //                         startCacheDatabases();
    //                     })
    //                     .catch(function (err) {
    //                         consoleLogging && console.log(err);
    //                     });
    //             }
    //         })
    //         .catch(function (err) {
    //             consoleLogging && console.log(err);
    //         });
    // }
  },

  /**
   * Clear Cache Database of Some User
   *
   * This function removes everything in cache
   * for one specific user
   *
   * @access private
   *
   * @return {undefined}
   */
  clearCacheDatabasesOfUser = function clearCacheDatabasesOfUser(callback) {
    (0, _deprecateMethods.printIsDeprecate)(_deprecateMethods.deprecatedString.clearCacheDatabasesOfUser.methodName);
    return; // if (db && !cacheDeletingInProgress) {
    //     cacheDeletingInProgress = true;
    //     db.threads
    //         .where('owner')
    //         .equals(parseInt(chatMessaging.userInfo.id))
    //         .delete()
    //         .then(function () {
    //             consoleLogging && console.log('Threads table deleted');
    //
    //             db.contacts
    //                 .where('owner')
    //                 .equals(parseInt(chatMessaging.userInfo.id))
    //                 .delete()
    //                 .then(function () {
    //                     consoleLogging && console.log('Contacts table deleted');
    //
    //                     db.messages
    //                         .where('owner')
    //                         .equals(parseInt(chatMessaging.userInfo.id))
    //                         .delete()
    //                         .then(function () {
    //                             consoleLogging && console.log('Messages table deleted');
    //
    //                             db.participants
    //                                 .where('owner')
    //                                 .equals(parseInt(chatMessaging.userInfo.id))
    //                                 .delete()
    //                                 .then(function () {
    //                                     consoleLogging && console.log('Participants table deleted');
    //
    //                                     db.messageGaps
    //                                         .where('owner')
    //                                         .equals(parseInt(chatMessaging.userInfo.id))
    //                                         .delete()
    //                                         .then(function () {
    //                                             consoleLogging && console.log('MessageGaps table deleted');
    //                                             cacheDeletingInProgress = false;
    //                                             callback && callback();
    //                                         });
    //                                 });
    //                         });
    //                 });
    //         })
    //         .catch(function (error) {
    //             chatEvents.fireEvent('error', {
    //                 code: error.code,
    //                 message: error.message,
    //                 error: error
    //             });
    //         });
    // }
  },

  /**
   * Initialize Cache Database
   *
   * if client's environment is capable of supporting indexedDB
   * and the hasCache attribute set to be true, we created
   * a indexedDB instance based on DexieDb and Initialize
   * client sde caching
   *
   * @return {undefined}
   */
  startCacheDatabases = function startCacheDatabases(callback) {
    (0, _deprecateMethods.printIsDeprecate)(_deprecateMethods.deprecatedString.startCacheDatabases.methodName);
    return; // if (hasCache) {
    //     queueDb = new Dexie('podQueues');
    //
    //     queueDb.version(1)
    //         .stores({
    //             waitQ: '[owner+threadId+uniqueId], owner, threadId, uniqueId, message'
    //         });
    //
    //     if (enableCache) {
    //         db = new Dexie('podChat');
    //
    //         db.version(1)
    //             .stores({
    //                 users: '&id, name, cellphoneNumber, keyId',
    //                 contacts: '[owner+id], id, owner, uniqueId, userId, cellphoneNumber, email, firstName, lastName, expireTime',
    //                 threads: '[owner+id] ,id, owner, title, time, pin, [owner+time]',
    //                 participants: '[owner+id], id, owner, threadId, notSeenDuration, admin, auditor, name, contactName, email, expireTime',
    //                 messages: '[owner+id], id, owner, threadId, time, [threadId+id], [threadId+owner+time]',
    //                 messageGaps: '[owner+id], [owner+waitsFor], id, waitsFor, owner, threadId, time, [threadId+owner+time]',
    //                 contentCount: 'threadId, contentCount'
    //             });
    //
    //         db.open()
    //             .catch(function (e) {
    //                 consoleLogging && console.log('Open failed: ' + e.stack);
    //             });
    //
    //         db.on('ready', function () {
    //             isCacheReady = true;
    //             callback && callback();
    //         }, true);
    //
    //         db.on('versionchange', function (event) {
    //             window.location.reload();
    //         });
    //     } else {
    //         callback && callback();
    //     }
    // } else {
    //     consoleLogging && console.log(CHAT_ERRORS[6600]);
    //     callback && callback();
    // }
  },

  /**
   * Get Chat Send Queue
   *
   * This function returns chat send queue
   *
   * @access private
   *
   * @return {array}  An array of messages on sendQueue
   */
  getChatSendQueue = function getChatSendQueue(threadId, callback) {
    if (threadId) {
      var tempSendQueue = [];

      for (var i = 0; i < chatSendQueue.length; i++) {
        if (chatSendQueue[i].threadId === threadId) {
          tempSendQueue.push(chatSendQueue[i]);
        }
      }

      callback && callback(tempSendQueue);
    } else {
      callback && callback(chatSendQueue);
    }
  },

  /**
   * Get Chat Wait Queue
   *
   * This function checks if cache is enbled on client's
   * machine, and if it is, retrieves WaitQueue from
   * cache. Otherwise returns WaitQueue from RAM
   * After getting failed messages from cache or RAM
   * we should check them with server to be sure if
   * they have been sent already or not?
   *
   * @access private
   *
   * @return {array}  An array of messages on Wait Queue
   */
  getChatWaitQueue = function getChatWaitQueue(threadId, active, callback) {
    if (active && threadId > 0) {
      var uniqueIds = [],
          queueToBeSent = [];

      for (var i = 0; i < chatWaitQueue.length; i++) {
        if (chatWaitQueue[i].subjectId == threadId) {
          queueToBeSent.push(chatWaitQueue[i]);
          uniqueIds.push(chatWaitQueue[i].uniqueId);
        }
      }

      if (uniqueIds.length) {
        chatMessaging.sendMessage({
          chatMessageVOType: _constants.chatMessageVOTypes.GET_HISTORY,
          content: {
            uniqueIds: uniqueIds
          },
          subjectId: threadId
        }, {
          onResult: function onResult(result) {
            if (!result.hasError) {
              var messageContent = result.result;

              for (var i = 0; i < messageContent.length; i++) {
                for (var j = 0; j < uniqueIds.length; j++) {
                  if (uniqueIds[j] === messageContent[i].uniqueId) {
                    uniqueIds.splice(j, 1);
                    queueToBeSent.splice(j, 1);
                  }
                }
              }

              callback && callback(queueToBeSent);
            }
          }
        });
      } else {
        callback && callback([]);
      }
    } else {
      callback && callback([]);
    }
  },

  /**
   * Get Chat Upload Queue
   *
   * This function checks if cache is enabled on client's
   * machine, and if it is, retrieves uploadQueue from
   * cache. Otherwise returns uploadQueue from RAM
   *
   * @access private
   *
   * @return {array}  An array of messages on uploadQueue
   */
  getChatUploadQueue = function getChatUploadQueue(threadId, callback) {
    var uploadQ = [];

    for (var i = 0; i < chatUploadQueue.length; i++) {
      if (parseInt(chatUploadQueue[i].message.subjectId) === threadId) {
        uploadQ.push(chatUploadQueue[i]);
      }
    }

    callback && callback(uploadQ);
  },

  /**
   * Delete an Item from Chat Send Queue
   *
   * This function gets an item and deletes it
   * from Chat Send Queue
   *
   * @access private
   *
   * @return {undefined}
   */
  deleteFromChatSentQueue = function deleteFromChatSentQueue(item, callback) {
    for (var i = 0; i < chatSendQueue.length; i++) {
      if (chatSendQueue[i].message.uniqueId === item.message.uniqueId) {
        chatSendQueue.splice(i, 1);
      }
    }

    callback && callback();
  },

  /**
   * Delete an Item from Chat Wait Queue
   *
   * This function gets an item and deletes it
   * from Chat Wait Queue, from either cached
   * queue or the queue on RAM memory
   *
   * @access private
   *
   * @return {undefined}
   */
  deleteFromChatWaitQueue = function deleteFromChatWaitQueue(item, callback) {
    for (var i = 0; i < chatWaitQueue.length; i++) {
      if (chatWaitQueue[i].uniqueId === item.uniqueId) {
        chatWaitQueue.splice(i, 1);
      }
    }

    callback && callback();
  },

  /**
   * Delete an Item from Chat Upload Queue
   *
   * This function gets an item and deletes it
   * from Chat Upload Queue
   *
   * @access private
   *
   * @return {undefined}
   */
  deleteFromChatUploadQueue = function deleteFromChatUploadQueue(item, callback) {
    for (var i = 0; i < chatUploadQueue.length; i++) {
      if (chatUploadQueue[i].message.uniqueId === item.message.uniqueId) {
        chatUploadQueue.splice(i, 1);
      }
    }

    callback && callback();
  },
      deleteThreadFailedMessagesFromWaitQueue = function deleteThreadFailedMessagesFromWaitQueue(threadId, callback) {
    for (var i = 0; i < chatWaitQueue.length; i++) {
      if (chatWaitQueue[i].uniqueId === item.uniqueId) {
        chatWaitQueue.splice(i, 1);
      }
    }

    callback && callback();
  },

  /**
   * Push Message Into Send Queue
   *
   * This functions takes a message and puts it
   * into chat's send queue
   *
   * @access private
   *
   * @param {object}    params    The Message and its callbacks to be enqueued
   *
   * @return {undefined}
   */
  putInChatSendQueue = function putInChatSendQueue(params, callback, skip) {
    chatSendQueue.push(params);

    if (!skip) {
      var time = new Date().getTime();
      params.message.time = time;
      params.message.timeNanos = time % 1000 * 1000000;
      putInChatWaitQueue(params.message, function () {
        callback && callback();
      });
    } else {
      callback && callback();
    }
  },

  /**
   * Put an Item inside Chat Wait Queue
   *
   * This function takes an item and puts it
   * inside Chat Wait Queue, either on cached
   * wait queue or the wait queue on RAM memory
   *
   * @access private
   *
   * @return {undefined}
   */
  putInChatWaitQueue = function putInChatWaitQueue(item, callback) {
    if (item.uniqueId !== '') {
      var waitQueueUniqueId = typeof item.uniqueId == 'string' ? item.uniqueId : Array.isArray(item.uniqueId) ? item.uniqueId[0] : null;

      if (waitQueueUniqueId != null) {
        _sdkParams.sdkParams.consoleLogging && console.log('Forced to use in memory cache');
        item.uniqueId = waitQueueUniqueId;
        chatWaitQueue.push(item);
        callback && callback();
      }
    }
  },
      getItemFromChatWaitQueue = function getItemFromChatWaitQueue(uniqueId, callback) {
    for (var i = 0; i < chatWaitQueue.length; i++) {
      if (chatWaitQueue[i].uniqueId === uniqueId) {
        var decryptedEnqueuedMessage = chatWaitQueue[i];
        var time = new Date().getTime();
        var message = formatDataToMakeMessage(decryptedEnqueuedMessage.threadId, {
          uniqueId: decryptedEnqueuedMessage.uniqueId,
          ownerId: chatMessaging.userInfo.id,
          message: decryptedEnqueuedMessage.content,
          metadata: decryptedEnqueuedMessage.metadata,
          systemMetadata: decryptedEnqueuedMessage.systemMetadata,
          replyInfo: decryptedEnqueuedMessage.replyInfo,
          forwardInfo: decryptedEnqueuedMessage.forwardInfo,
          participant: chatMessaging.userInfo,
          time: time,
          timeNanos: time % 1000 * 1000000
        });
        callback && callback(message);
        break;
      }
    }
  },

  /**
   * Put an Item inside Chat Upload Queue
   *
   * This function takes an item and puts it
   * inside Chat upload Queue
   *
   * @access private
   *
   * @return {undefined}
   */
  putInChatUploadQueue = function putInChatUploadQueue(params, callback) {
    chatUploadQueue.push(params);
    callback && callback();
  },

  /**
   * Transfer an Item from uploadQueue to sendQueue
   *
   * This function takes an uniqueId, finds that item
   * inside uploadQ. takes it's uploaded metadata and
   * attaches them to the message. Finally removes item
   * from uploadQueue and pushes it inside sendQueue
   *
   * @access private
   *
   * @return {undefined}
   */
  transferFromUploadQToSendQ = function transferFromUploadQToSendQ(threadId, uniqueId, metadata, callback) {
    getChatUploadQueue(threadId, function (uploadQueue) {
      for (var i = 0; i < uploadQueue.length; i++) {
        if (uploadQueue[i].message.uniqueId === uniqueId) {
          try {
            var message = uploadQueue[i].message,
                callbacks = uploadQueue[i].callbacks;
            var oldMetadata = JSON.parse(message.metadata),
                newMetadata = JSON.parse(metadata);
            var finalMetaData = objectDeepMerger(newMetadata, oldMetadata);

            if (typeof message !== 'undefined' && message && typeof message.content !== 'undefined' && message.content && message.content.hasOwnProperty('message')) {
              message.content.message['metadata'] = JSON.stringify(finalMetaData);
            }

            if (typeof message !== 'undefined' && message && typeof message.content !== 'undefined' && message.content && message.content.hasOwnProperty('metadata')) {
              message.content['metadata'] = JSON.stringify(finalMetaData);
            }

            if (message.chatMessageVOType === 21) {
              getImageDownloadLinkFromPodspace({
                hashCode: finalMetaData.fileHash
              }, function (result) {
                if (!result.hasError) {
                  message.content.image = result.downloadUrl;
                }
              });
            }

            message.metadata = JSON.stringify(finalMetaData);
          } catch (e) {
            _sdkParams.sdkParams.consoleLogging && console.log(e);
          }

          deleteFromChatUploadQueue(uploadQueue[i], function () {
            putInChatSendQueue({
              message: message,
              callbacks: callbacks
            }, function () {
              callback && callback();
            }, true);
          });
          break;
        }
      }
    });
  },

  /**
   * Decrypt Encrypted strings using secret key and salt
   *
   * @param string    String to get decrypted
   * @param secret    Cache Secret
   * @param salt      Salt used while string was getting encrypted
   *
   * @return  string  Decrypted string
   */
  chatDecrypt = function chatDecrypt(string, secret, salt) {
    var decryptedString = _utility["default"].decrypt(string, secret, salt);

    if (!decryptedString.hasError) {
      return decryptedString.result;
    } else {
      /**
       * If there is a problem with decrypting cache
       * Some body is trying to decrypt cache with wrong key
       * or cacheSecret has been expired, so we should truncate
       * cache databases to avoid attacks.
       *
       * But before deleting cache database we should make
       * sure that cacheSecret has been retrieved from server
       * and is ready. If so, and cache is still not decryptable,
       * there is definitely something wrong with the key; so we are
       * good to go and delete cache databases.
       */
      if (typeof secret !== 'undefined' && secret !== '') {
        if (db) {
          db.threads.where('owner').equals(parseInt(chatMessaging.userInfo.id)).count().then(function (threadsCount) {
            if (threadsCount > 0) {
              clearCacheDatabasesOfUser(function () {
                _sdkParams.sdkParams.consoleLogging && console.log('All cache databases have been cleared.');
              });
            }
          })["catch"](function (e) {
            _sdkParams.sdkParams.consoleLogging && console.log(e);
          });
        }
      }

      return '{}';
    }
  },
      objectDeepMerger = function objectDeepMerger() {
    var target = {};

    var merger = function merger(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
            target[prop] = objectDeepMerger(target[prop], obj[prop]);
          } else {
            target[prop] = obj[prop];
          }
        }
      }
    };

    for (var i = 0; i < arguments.length; i++) {
      merger(i < 0 || arguments.length <= i ? undefined : arguments[i]);
    }

    return target;
  },
      setRoleToUser = function setRoleToUser(params, callback) {
    var setRoleData = {
      chatMessageVOType: _constants.chatMessageVOTypes.SET_ROLE_TO_USER,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [],
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        setRoleData.subjectId = params.threadId;
      }

      if (params.admins && Array.isArray(params.admins)) {
        for (var i = 0; i < params.admins.length; i++) {
          var temp = {};

          if (parseInt(params.admins[i].userId) > 0) {
            temp.userId = params.admins[i].userId;
          }

          if (Array.isArray(params.admins[i].roles)) {
            temp.roles = params.admins[i].roles;
          }

          setRoleData.content.push(temp);
        }

        setRoleData.content = JSON.stringify(setRoleData.content);
      }
    }

    return chatMessaging.sendMessage(setRoleData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      removeRoleFromUser = function removeRoleFromUser(params, callback) {
    var setAdminData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_ROLE_FROM_USER,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [],
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        setAdminData.subjectId = params.threadId;
      }

      if (params.admins && Array.isArray(params.admins)) {
        for (var i = 0; i < params.admins.length; i++) {
          var temp = {};

          if (parseInt(params.admins[i].userId) > 0) {
            temp.userId = params.admins[i].userId;
          }

          if (Array.isArray(params.admins[i].roles)) {
            temp.roles = params.admins[i].roles;
          }

          setAdminData.content.push(temp);
        }

        setAdminData.content = JSON.stringify(setAdminData.content);
      }
    }

    return chatMessaging.sendMessage(setAdminData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      unPinMessage = function unPinMessage(params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.UNPIN_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.messageId,
      content: JSON.stringify({
        'notifyAll': typeof params.notifyAll === 'boolean' ? params.notifyAll : false
      }),
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  },
      chatUploadHandler = function chatUploadHandler(params, callbacks) {
    if (typeof params.file !== 'undefined') {
      var fileName,
          fileType,
          fileSize,
          fileExtension,
          chatUploadHandlerResult = {},
          metadata = {
        file: {}
      },
          fileUniqueId = params.fileUniqueId;
      fileName = params.file.name;
      fileType = params.file.type;
      fileSize = params.file.size;
      fileExtension = params.file.name.split('.').pop();

      _events.chatEvents.fireEvent('fileUploadEvents', {
        threadId: params.threadId,
        uniqueId: fileUniqueId,
        state: 'NOT_STARTED',
        progress: 0,
        fileInfo: {
          fileName: fileName,
          fileSize: fileSize
        },
        fileObject: params.file
      });
      /**
       * File is a valid Image
       * Should upload to image server
       */


      if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
        chatUploadHandlerResult.image = params.file;

        if (params.xC >= 0) {
          fileUploadParams.xC = params.xC;
        }

        if (params.yC >= 0) {
          fileUploadParams.yC = params.yC;
        }

        if (params.hC > 0) {
          fileUploadParams.hC = params.hC;
        }

        if (params.wC > 0) {
          fileUploadParams.wC = params.wC;
        }
      } else {
        chatUploadHandlerResult.file = params.file;
      }

      metadata['file']['originalName'] = fileName;
      metadata['file']['mimeType'] = fileType;
      metadata['file']['size'] = fileSize;
      chatUploadHandlerResult.threadId = params.threadId;
      chatUploadHandlerResult.uniqueId = fileUniqueId;
      chatUploadHandlerResult.fileObject = params.file;
      chatUploadHandlerResult.originalFileName = fileName;
      callbacks && callbacks(chatUploadHandlerResult, metadata, fileType, fileExtension);
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 6302,
        message: CHAT_ERRORS[6302]
      });
    }

    return {
      uniqueId: fileUniqueId,
      threadId: params.threadId,
      participant: chatMessaging.userInfo,
      content: {
        caption: params.content,
        file: {
          uniqueId: fileUniqueId,
          fileName: fileName,
          fileSize: fileSize,
          fileObject: params.file
        }
      }
    };
  },
      cancelFileDownload = function cancelFileDownload(params, callback) {
    if (params) {
      if (typeof params.uniqueId == 'string') {
        var uniqueId = params.uniqueId;
        httpRequestObject[eval('uniqueId')] && httpRequestObject[eval('uniqueId')].abort();
        httpRequestObject[eval('uniqueId')] && delete httpRequestObject[eval('uniqueId')];
        callback && callback(uniqueId);
      }
    }
  },
      cancelFileUpload = function cancelFileUpload(params, callback) {
    if (params) {
      if (typeof params.uniqueId == 'string') {
        var uniqueId = params.uniqueId;
        httpRequestObject[eval('uniqueId')] && httpRequestObject[eval('uniqueId')].abort();
        httpRequestObject[eval('uniqueId')] && delete httpRequestObject[eval('uniqueId')];
        deleteFromChatUploadQueue({
          message: {
            uniqueId: uniqueId
          }
        }, callback);
      }
    }
  },
      cancelMessage = function cancelMessage(uniqueId, callback) {
    deleteFromChatSentQueue({
      message: {
        uniqueId: uniqueId
      }
    }, function () {
      deleteFromChatWaitQueue({
        uniqueId: uniqueId
      }, callback);
    });
  },
      mapReverse = function mapReverse(params, callback) {
    var data = {};

    if (params) {
      if (parseFloat(params.lat) > 0) {
        data.lat = params.lat;
      }

      if (parseFloat(params.lng) > 0) {
        data.lng = params.lng;
      }

      data.uniqueId = _utility["default"].generateUUID();
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.REVERSE,
      method: 'GET',
      data: data,
      headers: {
        'Api-Key': _sdkParams.sdkParams.mapApiKey
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: result.hasError,
          cache: result.cache,
          errorMessage: result.message,
          errorCode: result.errorCode,
          result: responseData
        };
        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  },
      mapSearch = function mapSearch(params, callback) {
    var data = {};

    if (params) {
      if (typeof params.term === 'string') {
        data.term = params.term;
      }

      if (parseFloat(params.lat) > 0) {
        data.lat = params.lat;
      }

      if (parseFloat(params.lng) > 0) {
        data.lng = params.lng;
      }

      data.uniqueId = _utility["default"].generateUUID();
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.SEARCH,
      method: 'GET',
      data: data,
      headers: {
        'Api-Key': _sdkParams.sdkParams.mapApiKey
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: result.hasError,
          cache: result.cache,
          errorMessage: result.message,
          errorCode: result.errorCode,
          result: responseData
        };
        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  },
      mapRouting = function mapRouting(params, callback) {
    var data = {};

    if (params) {
      if (typeof params.alternative === 'boolean') {
        data.alternative = params.alternative;
      } else {
        data.alternative = true;
      }

      if ((0, _typeof2["default"])(params.origin) === 'object') {
        if (parseFloat(params.origin.lat) > 0 && parseFloat(params.origin.lng)) {
          data.origin = params.origin.lat + ',' + parseFloat(params.origin.lng);
        } else {
          _sdkParams.sdkParams.consoleLogging && console.log('No origin has been selected!');
        }
      }

      if ((0, _typeof2["default"])(params.destination) === 'object') {
        if (parseFloat(params.destination.lat) > 0 && parseFloat(params.destination.lng)) {
          data.destination = params.destination.lat + ',' + parseFloat(params.destination.lng);
        } else {
          _sdkParams.sdkParams.consoleLogging && console.log('No destination has been selected!');
        }
      }

      data.uniqueId = _utility["default"].generateUUID();
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.ROUTING,
      method: 'GET',
      data: data,
      headers: {
        'Api-Key': _sdkParams.sdkParams.mapApiKey
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: result.hasError,
          cache: result.cache,
          errorMessage: result.message,
          errorCode: result.errorCode,
          result: responseData
        };
        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  },
      mapStaticImage = function mapStaticImage(params, callback) {
    var data = {},
        url = SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.STATIC_IMAGE,
        hasError = false;

    if (params) {
      if (typeof params.type === 'string') {
        data.type = params.type;
      } else {
        data.type = 'standard-night';
      }

      if (parseInt(params.zoom) > 0) {
        data.zoom = params.zoom;
      } else {
        data.zoom = 15;
      }

      if (parseInt(params.width) > 0) {
        data.width = params.width;
      } else {
        data.width = 800;
      }

      if (parseInt(params.height) > 0) {
        data.height = params.height;
      } else {
        data.height = 600;
      }

      if ((0, _typeof2["default"])(params.center) === 'object') {
        if (parseFloat(params.center.lat) > 0 && parseFloat(params.center.lng)) {
          data.center = params.center.lat + ',' + parseFloat(params.center.lng);
        } else {
          hasError = true;

          _events.chatEvents.fireEvent('error', {
            code: 6700,
            message: CHAT_ERRORS[6700],
            error: undefined
          });
        }
      } else {
        hasError = true;

        _events.chatEvents.fireEvent('error', {
          code: 6700,
          message: CHAT_ERRORS[6700],
          error: undefined
        });
      }

      data.key = _sdkParams.sdkParams.mapApiKey;
    }

    var keys = Object.keys(data);

    if (keys.length > 0) {
      url += '?';

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        url += key + '=' + data[key];

        if (i < keys.length - 1) {
          url += '&';
        }
      }
    }

    var returnData = {
      hasError: hasError,
      cache: false,
      errorMessage: hasError ? CHAT_ERRORS[6700] : '',
      errorCode: hasError ? 6700 : undefined,
      result: {
        link: !hasError ? url : ''
      }
    };
    callback && callback(returnData);
  },
      //TODO Change Node Version
  getImageFormUrl = function getImageFormUrl(url, uniqueId, callback) {
    _sdkParams.sdkParams.getImageFromLinkObjects[uniqueId] = new Image();

    _sdkParams.sdkParams.getImageFromLinkObjects[uniqueId].setAttribute('crossOrigin', 'anonymous');

    _sdkParams.sdkParams.getImageFromLinkObjects[uniqueId].onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);
      var dataURI = canvas.toDataURL("image/jpg");
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1]);else byteString = unescape(dataURI.split(',')[1]);
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      var ia = new Uint8Array(byteString.length);

      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      delete _sdkParams.sdkParams.getImageFromLinkObjects[uniqueId];
      return callback(new Blob([ia], {
        type: mimeString
      }));
    };

    _sdkParams.sdkParams.getImageFromLinkObjects[uniqueId].src = url;
  };
  /******************************************************
   *             P U B L I C   M E T H O D S            *
   ******************************************************/


  var publicized = {};
  publicized.on = _events.chatEvents.on;
  publicized.off = _events.chatEvents.off;

  publicized.getPeerId = function () {
    return peerId;
  };

  publicized.getCurrentUser = function () {
    return chatMessaging.userInfo;
  };

  publicized.getUserInfo = function (callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.USER_INFO,
      typeCode: _sdkParams.sdkParams.generalTypeCode
    }, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          var currentUser = formatDataToMakeUser(messageContent);
          returnData.result = {
            user: currentUser
          };
          callback && callback(returnData);
        }
      }
    });
  };

  publicized.getThreads = getThreads;
  publicized.getAllThreads = getAllThreads;
  publicized.getHistory = getHistory;

  publicized.getAllMentionedMessages = function (params, callback) {
    return getHistory({
      threadId: params.threadId,
      allMentioned: true,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      count: params.count || 25,
      offset: params.offset || 0,
      cache: false,
      queues: {
        uploading: false,
        sending: false
      }
    }, callback);
  };

  publicized.getUnreadMentionedMessages = function (params, callback) {
    return getHistory({
      threadId: params.threadId,
      unreadMentioned: true,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      count: params.count || 25,
      offset: params.offset || 0,
      cache: false,
      queues: {
        uploading: false,
        sending: false
      }
    }, callback);
  };

  publicized.getAllUnreadMessagesCount = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.ALL_UNREAD_MESSAGE_COUNT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: JSON.stringify({
        'mute': typeof params.countMuteThreads === 'boolean' ? params.countMuteThreads : false
      }),
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };
  /**
   * Get Contacts
   *
   * Gets contacts list from chat server
   *
   * @access pubic
   *
   * @param {int}     count           Count of objects to get
   * @param {int}     offset          Offset of select Query
   * @param {string}  query           Search in contacts list to get (search LIKE firstName, lastName, email)
   *
   * @return {object} Instant Response
   */


  publicized.getContacts = function (params, callback) {
    var count = 25,
        offset = 0,
        content = {},
        returnCache = false;

    if (params) {
      if (parseInt(params.count) > 0) {
        count = parseInt(params.count);
      }

      if (parseInt(params.offset) > 0) {
        offset = parseInt(params.offset);
      }

      if (typeof params.query === 'string') {
        content.query = params.query;
      }

      if (typeof params.email === 'string') {
        content.email = params.email;
      }

      if (typeof params.cellphoneNumber === 'string') {
        content.cellphoneNumber = params.cellphoneNumber;
      }

      if (parseInt(params.contactId) > 0) {
        content.id = params.contactId;
      }

      if (typeof params.uniqueId === 'string') {
        content.uniqueId = params.uniqueId;
      }

      if (typeof params.username === 'string') {
        content.username = params.username;
      }

      if (typeof params.coreUserId !== "undefined") {
        content.coreUserId = params.coreUserId;
      }

      var functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true;
    }

    content.size = count;
    content.offset = offset;
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_CONTACTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    /**
     * Retrieve Contacts from server
     */

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            contacts: [],
            contentCount: result.contentCount,
            hasNext: offset + count < result.contentCount && messageLength > 0,
            nextOffset: offset * 1 + messageLength * 1
          },
              contactData;

          for (var i = 0; i < messageLength; i++) {
            contactData = formatDataToMakeContact(messageContent[i]);

            if (contactData) {
              resultData.contacts.push(contactData);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;

        if (!returnData.hasError && returnCache) {
          _events.chatEvents.fireEvent('contactEvents', {
            type: 'CONTACTS_LIST_CHANGE',
            result: returnData.result
          });
        }
      }
    });
  };

  publicized.getThreadParticipants = getThreadParticipants;
  /**
   * Get Thread Admins
   *
   * Gets admins list of given thread
   *
   * @access pubic
   *
   * @param {int}     threadId        Id of thread which you want to get admins of
   *
   * @return {object} Instant Response
   */

  publicized.getThreadAdmins = function (params, callback) {
    getThreadParticipants({
      threadId: params.threadId,
      admin: true,
      cache: false
    }, callback);
  };

  publicized.addParticipants = function (params, callback) {
    /**
     * + AddParticipantsRequest   {object}
     *    - subjectId             {int}
     *    + content               {list} List of CONTACT IDs or inviteeVO Objects
     *    - uniqueId              {string}
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_PARTICIPANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        sendMessageParams.subjectId = params.threadId;
      }

      if (Array.isArray(params.contactIds)) {
        sendMessageParams.content = params.contactIds;
      }

      if (Array.isArray(params.usernames)) {
        sendMessageParams.content = [];

        for (var i = 0; i < params.usernames.length; i++) {
          sendMessageParams.content.push({
            id: params.usernames[i],
            idType: _constants.inviteeVOidTypes.TO_BE_USER_USERNAME
          });
        }
      }

      if (Array.isArray(params.coreUserids)) {
        sendMessageParams.content = [];

        for (var i = 0; i < params.coreUserids.length; i++) {
          sendMessageParams.content.push({
            id: params.coreUserids[i],
            idType: _constants.inviteeVOidTypes.TO_BE_CORE_USER_ID
          });
        }
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.removeParticipants = function (params, callback) {
    /**
     * + RemoveParticipantsRequest    {object}
     *    - subjectId                 {int}
     *    + content                   {list} List of PARTICIPANT IDs from Thread's Participants object
     *       -id                      {int}
     *    - uniqueId                  {string}
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_PARTICIPANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode //params.typeCode

    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        sendMessageParams.subjectId = params.threadId;
      }

      if (Array.isArray(params.usernames)) {
        sendMessageParams.content = [];

        for (var i = 0; i < params.usernames.length; i++) {
          sendMessageParams.content.push({
            id: params.usernames[i],
            idType: _constants.inviteeVOidTypes.TO_BE_USER_USERNAME
          });
        }
      }

      if (Array.isArray(params.participantIds)) {
        sendMessageParams.content = params.participantIds;
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.getCurrentUserRoles = getCurrentUserRoles;

  publicized.leaveThread = function (params, callback) {
    /**
     * + LeaveThreadRequest    {object}
     *    - subjectId          {int}
     *    - uniqueId           {string}
     */
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.LEAVE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode //params.typeCode

    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        sendMessageParams.subjectId = params.threadId;
      }

      if (typeof params.clearHistory === 'boolean') {
        sendMessageParams.content = {
          clearHistory: params.clearHistory
        };
      } else {
        sendMessageParams.content = {
          clearHistory: true
        };
      }
    }

    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.createThread = function (params, callback) {
    /**
     * + CreateThreadRequest      {object}
     *    + invitees              {object}
     *       -id                  {string}
     *       -idType              {int} ** inviteeVOidTypes
     *    - title                 {string}
     *    - type                  {int} ** createThreadTypes
     *    - image                 {string}
     *    - description           {string}
     *    - metadata              {string}
     *    - uniqueName            {string}
     *    + message               {object}
     *       -text                {string}
     *       -type                {int}
     *       -repliedTo           {int}
     *       -uniqueId            {string}
     *       -metadata            {string}
     *       -systemMetadata      {string}
     *       -forwardedMessageIds {string}
     *       -forwardedUniqueIds  {string}
     */
    var content = {};

    if (params) {
      if (typeof params.title === 'string') {
        content.title = params.title;
      }

      if (typeof params.type === 'string') {
        var threadType = params.type;
        content.type = _constants.createThreadTypes[threadType];
      }

      if (typeof params.uniqueName === 'string') {
        content.uniqueName = params.uniqueName;
      }

      if (Array.isArray(params.invitees)) {
        content.invitees = [];

        for (var i = 0; i < params.invitees.length; i++) {
          var tempInvitee = formatDataToMakeInvitee(params.invitees[i]);

          if (tempInvitee) {
            content.invitees.push(tempInvitee);
          }
        }
      }

      if (typeof params.image === 'string') {
        content.image = params.image;
      }

      if (typeof params.description === 'string') {
        content.description = params.description;
      }

      if (typeof params.metadata === 'string') {
        content.metadata = params.metadata;
      } else if ((0, _typeof2["default"])(params.metadata) === 'object') {
        try {
          content.metadata = JSON.stringify(params.metadata);
        } catch (e) {
          _sdkParams.sdkParams.consoleLogging && console.log(e);
        }
      }

      if ((0, _typeof2["default"])(params.message) == 'object') {
        content.message = {};

        if (typeof params.message.text === 'string') {
          content.message.text = params.message.text;
        }

        if (typeof params.message.uniqueId === 'string') {
          content.message.uniqueId = params.message.uniqueId;
        }

        if (params.message.type > 0) {
          content.message.messageType = params.message.type;
        }

        if (params.message.repliedTo > 0) {
          content.message.repliedTo = params.message.repliedTo;
        }

        if (typeof params.message.metadata === 'string') {
          content.message.metadata = params.message.metadata;
        } else if ((0, _typeof2["default"])(params.message.metadata) === 'object') {
          content.message.metadata = JSON.stringify(params.message.metadata);
        }

        if (typeof params.message.systemMetadata === 'string') {
          content.message.systemMetadata = params.message.systemMetadata;
        } else if ((0, _typeof2["default"])(params.message.systemMetadata) === 'object') {
          content.message.systemMetadata = JSON.stringify(params.message.systemMetadata);
        }

        if (Array.isArray(params.message.forwardedMessageIds)) {
          content.message.forwardedMessageIds = params.message.forwardedMessageIds;
          content.message.forwardedUniqueIds = [];

          for (var i = 0; i < params.message.forwardedMessageIds.length; i++) {
            content.message.forwardedUniqueIds.push(_utility["default"].generateUUID());
          }
        }
      }
    }

    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CREATE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.createSelfThread = function (params, callback) {
    var content = {
      type: _constants.createThreadTypes['SELF']
    };

    if (params) {
      if (typeof params.description === 'string') {
        content.description = params.description;
      }

      if (typeof params.metadata === 'string') {
        content.metadata = params.metadata;
      } else if ((0, _typeof2["default"])(params.metadata) === 'object') {
        try {
          content.metadata = JSON.stringify(params.metadata);
        } catch (e) {
          _sdkParams.sdkParams.consoleLogging && console.log(e);
        }
      }

      if ((0, _typeof2["default"])(params.message) == 'object') {
        content.message = {};

        if (typeof params.message.text === 'string') {
          content.message.text = params.message.text;
        }

        if (typeof params.message.uniqueId === 'string') {
          content.message.uniqueId = params.message.uniqueId;
        }

        if (params.message.type > 0) {
          content.message.messageType = params.message.type;
        }

        if (params.message.repliedTo > 0) {
          content.message.repliedTo = params.message.repliedTo;
        }

        if (typeof params.message.metadata === 'string') {
          content.message.metadata = params.message.metadata;
        } else if ((0, _typeof2["default"])(params.message.metadata) === 'object') {
          content.message.metadata = JSON.stringify(params.message.metadata);
        }

        if (typeof params.message.systemMetadata === 'string') {
          content.message.systemMetadata = params.message.systemMetadata;
        } else if ((0, _typeof2["default"])(params.message.systemMetadata) === 'object') {
          content.message.systemMetadata = JSON.stringify(params.message.systemMetadata);
        }

        if (Array.isArray(params.message.forwardedMessageIds)) {
          content.message.forwardedMessageIds = params.message.forwardedMessageIds;
          content.message.forwardedUniqueIds = [];

          for (var i = 0; i < params.message.forwardedMessageIds.length; i++) {
            content.message.forwardedUniqueIds.push(_utility["default"].generateUUID());
          }
        }
      }
    }

    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CREATE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.replyPrivately = function (params, callbacks) {
    var metadata = {},
        uniqueId;

    if (typeof params.uniqueId !== 'undefined') {
      uniqueId = params.uniqueId;
    } else {
      uniqueId = _utility["default"].generateUUID();
    }

    var sendContentParams = {
      "text": params.textMessage,
      "invitees": params.invitees
    };
    putInChatSendQueue({
      message: {
        chatMessageVOType: _constants.chatMessageVOTypes.REPLY_PRIVATELY,
        typeCode: _sdkParams.sdkParams.generalTypeCode,
        messageType: 1,
        subjectId: params.threadId,
        repliedTo: params.repliedTo,
        content: sendContentParams,
        uniqueId: uniqueId,
        systemMetadata: JSON.stringify(params.systemMetadata),
        metadata: JSON.stringify(params.metadata)
      },
      callbacks: callbacks
    }, function () {
      chatSendQueueHandler();
    }, true);
    return {
      uniqueId: uniqueId,
      threadId: params.threadId,
      participant: chatMessaging.userInfo,
      content: params.content
    };
  };

  publicized.sendTextMessage = function (params, callbacks) {
    var metadata = {},
        uniqueId;

    if (typeof params.uniqueId !== 'undefined') {
      uniqueId = params.uniqueId;
    } else {
      uniqueId = _utility["default"].generateUUID();
    }

    putInChatSendQueue({
      message: {
        chatMessageVOType: _constants.chatMessageVOTypes.MESSAGE,
        typeCode: _sdkParams.sdkParams.generalTypeCode,
        //params.typeCode,
        messageType: params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && _constants.chatMessageTypes[params.messageType.toUpperCase()] > 0 ? _constants.chatMessageTypes[params.messageType.toUpperCase()] : _constants.chatMessageTypes.TEXT,
        subjectId: params.threadId,
        repliedTo: params.repliedTo,
        content: params.textMessage,
        uniqueId: uniqueId,
        systemMetadata: JSON.stringify(params.systemMetadata),
        metadata: JSON.stringify(metadata),
        pushMsgType: 3
      },
      callbacks: callbacks
    }, function () {
      chatSendQueueHandler();
    });
    return {
      uniqueId: uniqueId,
      threadId: params.threadId,
      participant: chatMessaging.userInfo,
      content: params.content
    };
  };

  publicized.sendBotMessage = function (params, callbacks) {
    var metadata = {};
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.BOT_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.messageId,
      content: params.content,
      uniqueId: params.uniqueId,
      metadata: metadata,
      pushMsgType: 3
    }, callbacks);
  };

  publicized.sendFileMessage = sendFileMessage;

  publicized.createThreadWithFileMessage = function (params, createThreadCallback, sendFileMessageCallback) {
    /**
     * + CreateThreadRequest      {object}
     *    + invitees              {object}
     *       -id                  {string}
     *       -idType              {int} ** inviteeVOidTypes
     *    - title                 {string}
     *    - type                  {int} ** createThreadTypes
     *    - image                 {string}
     *    - description           {string}
     *    - metadata              {string}
     *    - uniqueName            {string}
     *    + message               {object}
     *       -text                {string}
     *       -type                {int}
     *       -repliedTo           {int}
     *       -uniqueId            {string}
     *       -metadata            {string}
     *       -systemMetadata      {string}
     *       -forwardedMessageIds {string}
     *       -forwardedUniqueIds  {string}
     */
    var content = {};

    if (params) {
      if (typeof params.title === 'string') {
        content.title = params.title;
      }

      if (typeof params.type === 'string') {
        var threadType = params.type;
        content.type = _constants.createThreadTypes[threadType];
      }

      if (Array.isArray(params.invitees)) {
        content.invitees = [];

        for (var i = 0; i < params.invitees.length; i++) {
          var tempInvitee = formatDataToMakeInvitee(params.invitees[i]);

          if (tempInvitee) {
            content.invitees.push(tempInvitee);
          }
        }
      }

      if (typeof params.description === 'string') {
        content.description = params.description;
      }

      if (typeof params.content === 'string') {
        content.content = params.content;
      }

      if (typeof params.metadata === 'string') {
        content.metadata = params.metadata;
      } else if ((0, _typeof2["default"])(params.metadata) === 'object') {
        try {
          content.metadata = JSON.stringify(params.metadata);
        } catch (e) {
          _sdkParams.sdkParams.consoleLogging && console.log(e);
        }
      }
    }

    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CREATE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = {
            thread: createThread(messageContent)
          };
        }

        createThreadCallback && createThreadCallback(returnData);
        sendFileMessage({
          threadId: returnData.result.thread.id,
          file: params.file,
          content: params.caption,
          messageType: params.messageType,
          userGroupHash: returnData.result.thread.userGroupHash
        }, sendFileMessageCallback);
      }
    });
  };

  publicized.sendLocationMessage = function (params, callbacks) {
    var data = {},
        url = SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.STATIC_IMAGE,
        hasError = false,
        fileUniqueId = _utility["default"].generateUUID();

    if (params) {
      if (typeof params.mapType === 'string') {
        data.type = params.mapType;
      } else {
        data.type = 'standard-night';
      }

      if (parseInt(params.mapZoom) > 0) {
        data.zoom = params.mapZoom;
      } else {
        data.zoom = 15;
      }

      if (parseInt(params.mapWidth) > 0) {
        data.width = params.mapWidth;
      } else {
        data.width = 800;
      }

      if (parseInt(params.mapHeight) > 0) {
        data.height = params.mapHeight;
      } else {
        data.height = 600;
      }

      if ((0, _typeof2["default"])(params.mapCenter) === 'object') {
        if (parseFloat(params.mapCenter.lat) > 0 && parseFloat(params.mapCenter.lng)) {
          data.center = params.mapCenter.lat + ',' + parseFloat(params.mapCenter.lng);
        } else {
          hasError = true;

          _events.chatEvents.fireEvent('error', {
            code: 6700,
            message: CHAT_ERRORS[6700],
            error: undefined
          });
        }
      } else {
        hasError = true;

        _events.chatEvents.fireEvent('error', {
          code: 6700,
          message: CHAT_ERRORS[6700],
          error: undefined
        });
      }

      data.key = _sdkParams.sdkParams.mapApiKey;
      data.marker = 'red';
    }

    var keys = Object.keys(data);

    if (keys.length > 0) {
      url += '?';

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        url += key + '=' + data[key];

        if (i < keys.length - 1) {
          url += '&';
        }
      }
    }

    if (!hasError) {
      mapReverse({
        lng: parseFloat(params.mapCenter.lng),
        lat: parseFloat(params.mapCenter.lat)
      }, function (address) {
        getImageFormUrl(url, fileUniqueId, function (blobImage) {
          sendFileMessage({
            threadId: params.threadId,
            fileUniqueId: fileUniqueId,
            file: new File([blobImage], "location.png", {
              type: "image/png",
              lastModified: new Date()
            }),
            content: address.result.formatted_address,
            messageType: 'POD_SPACE_PICTURE',
            userGroupHash: params.userGroupHash,
            metadata: {
              mapLink: "https://maps.neshan.org/@".concat(data.center, ",").concat(data.zoom, "z"),
              address: address
            }
          }, callbacks);
        });
      });
    }

    return {
      uniqueId: fileUniqueId,
      threadId: params.threadId,
      participant: chatMessaging.userInfo,
      cancel: function cancel() {
        if (typeof _sdkParams.sdkParams.getImageFromLinkObjects !== 'undefined' && _sdkParams.sdkParams.getImageFromLinkObjects.hasOwnProperty(fileUniqueId)) {
          _sdkParams.sdkParams.getImageFromLinkObjects[fileUniqueId].onload = function () {};

          delete _sdkParams.sdkParams.getImageFromLinkObjects[fileUniqueId];
          _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(fileUniqueId, "\" - Downloading Location Map has been canceled!"));
        }

        cancelFileUpload({
          uniqueId: fileUniqueId
        }, function () {
          _sdkParams.sdkParams.consoleLogging && console.log("\"".concat(fileUniqueId, "\" - Sending Location Message has been canceled!"));
        });
      }
    };
  };

  publicized.resendMessage = function (uniqueId, callbacks) {
    for (var i = 0; i < chatWaitQueue.length; i++) {
      if (chatWaitQueue[i].uniqueId === uniqueId) {
        putInChatSendQueue({
          message: chatWaitQueue[i],
          callbacks: callbacks
        }, function () {
          chatSendQueueHandler();
        }, true); // break;
      }
    }
  };

  publicized.cancelMessage = cancelMessage;

  publicized.clearHistory = function (params, callback) {
    /**
     * + Clear History Request Object    {object}
     *    - subjectId                    {int}
     */
    var clearHistoryParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.CLEAR_HISTORY,
      typeCode: _sdkParams.sdkParams.generalTypeCode //params.typeCode

    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        clearHistoryParams.subjectId = params.threadId;
      }
    }

    return chatMessaging.sendMessage(clearHistoryParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          returnData.result = {
            thread: result.result
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.getImage = getImage;
  publicized.getFile = getFile;
  publicized.getFileFromPodspace = getFileFromPodspaceNew; //getFileFromPodspace;

  publicized.getImageFromPodspace = getImageFromPodspaceNew; //getImageFromPodspace;

  publicized.uploadFile = uploadFile;
  publicized.uploadImage = uploadImage;
  publicized.uploadFileToPodspace = uploadFileToPodspaceNew;
  publicized.uploadImageToPodspace = uploadImageToPodspaceNew;
  publicized.cancelFileUpload = cancelFileUpload;
  publicized.cancelFileDownload = cancelFileDownload;

  publicized.editMessage = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.EDIT_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      messageType: params.messageType,
      subjectId: params.messageId,
      repliedTo: params.repliedTo,
      content: params.content,
      uniqueId: params.uniqueId,
      metadata: params.metadata,
      systemMetadata: params.systemMetadata,
      pushMsgType: 3
    }, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              resultData = {
            editedMessage: formatDataToMakeMessage(undefined, messageContent)
          };
          returnData.result = resultData;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.deleteMessage = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.messageId,
      uniqueId: params.uniqueId,
      content: JSON.stringify({
        'deleteForAll': typeof params.deleteForAll === 'boolean' ? params.deleteForAll : false
      }),
      pushMsgType: 3
    }, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          returnData.result = {
            deletedMessage: {
              id: result.result.id,
              pinned: result.result.pinned,
              mentioned: result.result.mentioned,
              messageType: result.result.messageType,
              edited: result.result.edited,
              editable: result.result.editable,
              deletable: result.result.deletable
            }
          };
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.deleteMultipleMessages = function (params, callback) {
    var messageIdsList = params.messageIds,
        uniqueIdsList = [];

    for (var i in messageIdsList) {
      var uniqueId = _utility["default"].generateUUID();

      uniqueIdsList.push(uniqueId);

      chatMessaging.messagesCallbacks[uniqueId] = function (result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          returnData.result = {
            deletedMessage: {
              id: result.result.id,
              pinned: result.result.pinned,
              mentioned: result.result.mentioned,
              messageType: result.result.messageType,
              edited: result.result.edited,
              editable: result.result.editable,
              deletable: result.result.deletable
            }
          };
        }

        callback && callback(returnData);
      };
    }

    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        uniqueIds: uniqueIdsList,
        ids: messageIdsList,
        deleteForAll: typeof params.deleteForAll === 'boolean' ? params.deleteForAll : false
      },
      pushMsgType: 3
    });
  };

  publicized.replyTextMessage = function (params, callbacks) {
    var uniqueId;

    if (typeof params.uniqueId !== 'undefined') {
      uniqueId = params.uniqueId;
    } else {
      uniqueId = _utility["default"].generateUUID();
    }

    putInChatSendQueue({
      message: {
        chatMessageVOType: _constants.chatMessageVOTypes.MESSAGE,
        typeCode: _sdkParams.sdkParams.generalTypeCode,
        //params.typeCode,
        messageType: 1,
        subjectId: params.threadId,
        repliedTo: params.repliedTo,
        content: params.textMessage,
        uniqueId: uniqueId,
        systemMetadata: JSON.stringify(params.systemMetadata),
        metadata: JSON.stringify(params.metadata),
        pushMsgType: 3
      },
      callbacks: callbacks
    }, function () {
      chatSendQueueHandler();
    });
    return {
      uniqueId: uniqueId,
      threadId: params.threadId,
      participant: chatMessaging.userInfo,
      content: params.content
    };
  };

  publicized.replyFileMessage = function (params, callbacks) {
    var metadata = {
      file: {}
    },
        fileUploadParams = {},
        fileUniqueId = _utility["default"].generateUUID();

    if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof params.userGroupHash !== 'string') {
      _events.chatEvents.fireEvent('error', {
        code: 6304,
        message: CHAT_ERRORS[6304]
      });

      return;
    } else {
      fileUploadParams.userGroupHash = params.userGroupHash;
    }

    return chatUploadHandler({
      threadId: params.threadId,
      file: params.file,
      fileUniqueId: fileUniqueId
    }, function (uploadHandlerResult, uploadHandlerMetadata, fileType, fileExtension) {
      fileUploadParams = Object.assign(fileUploadParams, uploadHandlerResult);
      putInChatUploadQueue({
        message: {
          chatMessageVOType: _constants.chatMessageVOTypes.MESSAGE,
          typeCode: _sdkParams.sdkParams.generalTypeCode,
          //params.typeCode,
          messageType: params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && _constants.chatMessageTypes[params.messageType.toUpperCase()] > 0 ? _constants.chatMessageTypes[params.messageType.toUpperCase()] : 1,
          subjectId: params.threadId,
          repliedTo: params.repliedTo,
          content: params.content,
          metadata: JSON.stringify(uploadHandlerMetadata),
          systemMetadata: JSON.stringify(params.systemMetadata),
          uniqueId: fileUniqueId,
          pushMsgType: 3
        },
        callbacks: callbacks
      }, function () {
        if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
          uploadImageToPodspaceUserGroupNew(fileUploadParams, function (result) {
            if (!result.hasError) {
              metadata['name'] = result.result.name;
              metadata['fileHash'] = result.result.hash;
              metadata['file']['name'] = result.result.name;
              metadata['file']['fileHash'] = result.result.hash;
              metadata['file']['hashCode'] = result.result.hash;
              metadata['file']['actualHeight'] = result.result.actualHeight;
              metadata['file']['actualWidth'] = result.result.actualWidth;
              metadata['file']['parentHash'] = result.result.parentHash;
              metadata['file']['size'] = result.result.size;
              metadata['file']['link'] = "".concat(SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS, "/api/images/").concat(result.result.hash, "?checkUserGroupAccess=true");
              transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                chatSendQueueHandler();
              });
            } else {
              deleteFromChatUploadQueue({
                message: {
                  uniqueId: fileUniqueId
                }
              });
            }
          });
        } else {
          uploadFileToPodspaceUserGroupNew(fileUploadParams, function (result) {
            if (!result.hasError) {
              metadata['fileHash'] = result.result.hash;
              metadata['name'] = result.result.name;
              metadata['file']['name'] = result.result.name;
              metadata['file']['fileHash'] = result.result.hash;
              metadata['file']['hashCode'] = result.result.hash;
              metadata['file']['parentHash'] = result.result.parentHash;
              metadata['file']['size'] = result.result.size;
              transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                chatSendQueueHandler();
              });
            } else {
              deleteFromChatUploadQueue({
                message: {
                  uniqueId: fileUniqueId
                }
              });
            }
          });
        }
      });
    });
  };

  publicized.replyFileMessagePrivately = function (params, callbacks) {
    var metadata = {
      file: {}
    },
        fileUploadParams = {},
        fileUniqueId = _utility["default"].generateUUID();

    if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof params.userGroupHash !== 'string') {
      _events.chatEvents.fireEvent('error', {
        code: 6304,
        message: CHAT_ERRORS[6304]
      });

      return;
    } else {
      fileUploadParams.userGroupHash = params.userGroupHash;
    }

    return chatUploadHandler({
      threadId: params.threadId,
      file: params.file,
      fileUniqueId: fileUniqueId
    }, function (uploadHandlerResult, uploadHandlerMetadata, fileType, fileExtension) {
      fileUploadParams = Object.assign(fileUploadParams, uploadHandlerResult);
      var sendContentParams = {
        "text": params.textMessage,
        "invitees": params.invitees
      };
      putInChatUploadQueue({
        message: {
          chatMessageVOType: _constants.chatMessageVOTypes.REPLY_PRIVATELY,
          typeCode: _sdkParams.sdkParams.generalTypeCode,
          //params.typeCode,
          messageType: params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && _constants.chatMessageTypes[params.messageType.toUpperCase()] > 0 ? _constants.chatMessageTypes[params.messageType.toUpperCase()] : 1,
          subjectId: params.threadId,
          repliedTo: params.repliedTo,
          content: sendContentParams,
          metadata: JSON.stringify(uploadHandlerMetadata),
          systemMetadata: JSON.stringify(params.systemMetadata),
          uniqueId: fileUniqueId,
          pushMsgType: 3
        },
        callbacks: callbacks
      }, function () {
        if (_constants.imageMimeTypes.indexOf(fileType) >= 0 || _constants.imageExtentions.indexOf(fileExtension) >= 0) {
          uploadImageToPodspaceUserGroupNew(fileUploadParams, function (result) {
            if (!result.hasError) {
              metadata['name'] = result.result.name;
              metadata['fileHash'] = result.result.hash;
              metadata['file']['name'] = result.result.name;
              metadata['file']['fileHash'] = result.result.hash;
              metadata['file']['hashCode'] = result.result.hash;
              metadata['file']['actualHeight'] = result.result.actualHeight;
              metadata['file']['actualWidth'] = result.result.actualWidth;
              metadata['file']['parentHash'] = result.result.parentHash;
              metadata['file']['size'] = result.result.size;
              metadata['file']['link'] = "".concat(SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS, "/api/images/").concat(result.result.hash, "?checkUserGroupAccess=true");
              transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                chatSendQueueHandler();
              });
            } else {
              deleteFromChatUploadQueue({
                message: {
                  uniqueId: fileUniqueId
                }
              });
            }
          });
        } else {
          uploadFileToPodspaceUserGroupNew(fileUploadParams, function (result) {
            if (!result.hasError) {
              metadata['fileHash'] = result.result.hash;
              metadata['name'] = result.result.name;
              metadata['file']['name'] = result.result.name;
              metadata['file']['fileHash'] = result.result.hash;
              metadata['file']['hashCode'] = result.result.hash;
              metadata['file']['parentHash'] = result.result.parentHash;
              metadata['file']['size'] = result.result.size;
              transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                chatSendQueueHandler();
              });
            } else {
              deleteFromChatUploadQueue({
                message: {
                  uniqueId: fileUniqueId
                }
              });
            }
          });
        }
      });
    });
  };

  publicized.forwardMessage = function (params, callbacks) {
    var threadId = params.threadId,
        messageIdsList = params.messageIds,
        uniqueIdsList = [];

    for (var i in messageIdsList) {
      if (!chatMessaging.threadCallbacks[threadId]) {
        chatMessaging.threadCallbacks[threadId] = {};
      }

      var uniqueId = _utility["default"].generateUUID();

      uniqueIdsList.push(uniqueId);
      chatMessaging.threadCallbacks[threadId][uniqueId] = {};
      chatMessaging.sendMessageCallbacks[uniqueId] = {};

      if (callbacks.onSent) {
        chatMessaging.sendMessageCallbacks[uniqueId].onSent = callbacks.onSent;
        chatMessaging.threadCallbacks[threadId][uniqueId].onSent = false;
        chatMessaging.threadCallbacks[threadId][uniqueId].uniqueId = uniqueId;
      }

      if (callbacks.onSeen) {
        chatMessaging.sendMessageCallbacks[uniqueId].onSeen = callbacks.onSeen;
        chatMessaging.threadCallbacks[threadId][uniqueId].onSeen = false;
      }

      if (callbacks.onDeliver) {
        chatMessaging.sendMessageCallbacks[uniqueId].onDeliver = callbacks.onDeliver;
        chatMessaging.threadCallbacks[threadId][uniqueId].onDeliver = false;
      }
    }

    putInChatSendQueue({
      message: {
        chatMessageVOType: _constants.chatMessageVOTypes.FORWARD_MESSAGE,
        typeCode: _sdkParams.sdkParams.generalTypeCode,
        //params.typeCode,
        subjectId: params.threadId,
        repliedTo: params.repliedTo,
        content: messageIdsList,
        uniqueId: uniqueIdsList,
        metadata: JSON.stringify(params.metadata),
        pushMsgType: 3
      },
      callbacks: callbacks
    }, function () {
      chatSendQueueHandler();
    }, true);
  };

  publicized.deliver = function (params) {
    return putInMessagesDeliveryQueue(params.threadId, params.messageId);
  };

  publicized.seen = function (params) {
    return putInMessagesSeenQueue(params.threadId, params.messageId);
  };

  publicized.startTyping = function (params) {
    var uniqueId = _utility["default"].generateUUID();

    if (parseInt(params.threadId) > 0) {
      var threadId = params.threadId;
    }

    _sdkParams.sdkParams.isTypingInterval && clearInterval(_sdkParams.sdkParams.isTypingInterval);
    _sdkParams.sdkParams.isTypingInterval = setInterval(function () {
      sendSystemMessage({
        content: JSON.stringify({
          type: _constants.systemMessageTypes.IS_TYPING
        }),
        threadId: threadId,
        uniqueId: uniqueId
      });
    }, _sdkParams.sdkParams.systemMessageIntervalPitch);
  };

  publicized.stopTyping = function () {
    _sdkParams.sdkParams.isTypingInterval && clearInterval(_sdkParams.sdkParams.isTypingInterval);
  };

  publicized.getMessageDeliveredList = function (params, callback) {
    var deliveryListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_MESSAGE_DELIVERY_PARTICIPANTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.messageId) > 0) {
        deliveryListData.content.messageId = params.messageId;
      }
    }

    return chatMessaging.sendMessage(deliveryListData, {
      onResult: function onResult(result) {
        if ((0, _typeof2["default"])(result.result) == 'object') {
          for (var i = 0; i < result.result.length; i++) {
            result.result[i] = formatDataToMakeUser(result.result[i]);
          }
        }

        callback && callback(result);
      }
    });
  };

  publicized.getMessageSeenList = function (params, callback) {
    var seenListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_MESSAGE_SEEN_PARTICIPANTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.messageId) > 0) {
        seenListData.content.messageId = params.messageId;
      }

      if (parseInt(params.count) > 0) {
        seenListData.content.count = parseInt(params.count);
      }

      if (parseInt(params.offset) > 0) {
        seenListData.content.offset = parseInt(params.offset);
      }
    }

    return chatMessaging.sendMessage(seenListData, {
      onResult: function onResult(result) {
        if ((0, _typeof2["default"])(result.result) == 'object') {
          for (var i = 0; i < result.result.length; i++) {
            result.result[i] = formatDataToMakeUser(result.result[i]);
          }
        }

        callback && callback(result);
      }
    });
  };

  publicized.updateThreadInfo = updateThreadInfo;
  publicized.updateChatProfile = updateChatProfile;

  publicized.muteThread = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.MUTE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.threadId,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.unMuteThread = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.UNMUTE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.threadId,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.closeThread = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.CLOSE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.threadId,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.joinPublicThread = function (params, callback) {
    var joinThreadData = {
      chatMessageVOType: _constants.chatMessageVOTypes.JOIN_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: '',
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
        joinThreadData.content = params.uniqueName;
      }
    }

    return chatMessaging.sendMessage(joinThreadData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.isPublicThreadNameAvailable = function (params, callback) {
    var isNameAvailableData = {
      chatMessageVOType: _constants.chatMessageVOTypes.IS_NAME_AVAILABLE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: '',
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
        isNameAvailableData.content = params.uniqueName;
      }
    }

    return chatMessaging.sendMessage(isNameAvailableData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.changeThreadPrivacy = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.CHANGE_THREAD_PRIVACY,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      content: {},
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        sendData.subjectId = +params.threadId;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No Thread Id has been sent!"
        });

        return;
      }

      if (typeof params.threadType === 'string' && _constants.createThreadTypes.hasOwnProperty(params.threadType.toUpperCase())) {
        if (params.threadType.toUpperCase() === 'PUBLIC_GROUP' || params.threadType.toUpperCase() === 'PUBLIC_CHANNEL') {
          if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
            sendData.content.uniqueName = params.uniqueName;
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: "Public Threads need a unique name! One must enter a unique name for this thread."
            });

            return;
          }
        }

        sendData.content.type = _constants.createThreadTypes[params.threadType.toUpperCase()];
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No thread type has been declared! Possible inputs are (".concat(Object.keys(_constants.createThreadTypes).join(','), ")")
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Change thread Privacy!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.pinThread = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.PIN_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.threadId,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.unPinThread = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.UNPIN_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.threadId,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.deleteThread = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_MESSAGE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode //params.typeCode

    };

    if (params) {
      if (+params.threadId > 0) {
        sendData.subjectId = +params.threadId;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Delete Thread!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.pinMessage = function (params, callback) {
    return chatMessaging.sendMessage({
      chatMessageVOType: _constants.chatMessageVOTypes.PIN_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      subjectId: params.messageId,
      content: JSON.stringify({
        'notifyAll': typeof params.notifyAll === 'boolean' ? params.notifyAll : false
      }),
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    }, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.unPinMessage = unPinMessage;

  publicized.spamPrivateThread = function (params, callback) {
    var spamData = {
      chatMessageVOType: _constants.chatMessageVOTypes.SPAM_PV_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.threadId) > 0) {
        spamData.subjectId = params.threadId;
      }
    }

    return chatMessaging.sendMessage(spamData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.block = function (params, callback) {
    var blockData = {
      chatMessageVOType: _constants.chatMessageVOTypes.BLOCK,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.contactId) > 0) {
        blockData.content.contactId = params.contactId;
      }

      if (parseInt(params.threadId) > 0) {
        blockData.content.threadId = params.threadId;
      }

      if (parseInt(params.userId) > 0) {
        blockData.content.userId = params.userId;
      }
    }

    return chatMessaging.sendMessage(blockData, {
      onResult: function onResult(result) {
        if ((0, _typeof2["default"])(result.result) == 'object') {
          result.result = formatDataToMakeBlockedUser(result.result);
        }

        callback && callback(result);
      }
    });
  };

  publicized.unblock = function (params, callback) {
    var unblockData = {
      chatMessageVOType: _constants.chatMessageVOTypes.UNBLOCK,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      content: {},
      timeout: params.timeout
    };

    if (params) {
      if (parseInt(params.blockId) > 0) {
        unblockData.subjectId = params.blockId;
      }

      if (parseInt(params.contactId) > 0) {
        unblockData.content.contactId = params.contactId;
      }

      if (parseInt(params.threadId) > 0) {
        unblockData.content.threadId = params.threadId;
      }

      if (parseInt(params.userId) > 0) {
        unblockData.content.userId = params.userId;
      }
    }

    return chatMessaging.sendMessage(unblockData, {
      onResult: function onResult(result) {
        if ((0, _typeof2["default"])(result.result) == 'object') {
          result.result = formatDataToMakeBlockedUser(result.result);
        }

        callback && callback(result);
      }
    });
  };

  publicized.getBlockedList = function (params, callback) {
    var count = 25,
        offset = 0,
        content = {};

    if (params) {
      if (parseInt(params.count) > 0) {
        count = params.count;
      }

      if (parseInt(params.offset) > 0) {
        offset = params.offset;
      }
    }

    content.count = count;
    content.offset = offset;
    var getBlockedData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_BLOCKED,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content,
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };
    return chatMessaging.sendMessage(getBlockedData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            blockedUsers: [],
            contentCount: result.contentCount,
            hasNext: offset + count < result.contentCount && messageLength > 0,
            nextOffset: offset * 1 + messageLength * 1
          },
              blockedUser;

          for (var i = 0; i < messageLength; i++) {
            blockedUser = formatDataToMakeBlockedUser(messageContent[i]);

            if (blockedUser) {
              resultData.blockedUsers.push(blockedUser);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.getUserNotSeenDuration = function (params, callback) {
    var content = {};

    if (params) {
      if (Array.isArray(params.userIds)) {
        content.userIds = params.userIds;
      }
    }

    var getNotSeenDurationData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_NOT_SEEN_DURATION,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content,
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      timeout: params.timeout
    };
    return chatMessaging.sendMessage(getNotSeenDurationData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          returnData.result = result.result;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.addContacts = function (params, callback) {
    var data = {};

    if (params) {
      if (typeof params.firstName === 'string') {
        data.firstName = params.firstName;
      } else {
        data.firstName = '';
      }

      if (typeof params.lastName === 'string') {
        data.lastName = params.lastName;
      } else {
        data.lastName = '';
      }

      if (typeof params.typeCode === 'string') {
        data.typeCode = params.typeCode;
      } else if (_sdkParams.sdkParams.generalTypeCode) {
        data.typeCode = _sdkParams.sdkParams.generalTypeCode;
      }

      data.ownerId = _sdkParams.sdkParams.typeCodeOwnerId ? _sdkParams.sdkParams.typeCodeOwnerId : params.ownerId ? params.ownerId : undefined;

      if (typeof params.cellphoneNumber === 'string') {
        data.cellphoneNumber = params.cellphoneNumber;
      } else {
        data.cellphoneNumber = '';
      }

      if (typeof params.email === 'string') {
        data.email = params.email;
      } else {
        data.email = '';
      }

      if (typeof params.username === 'string') {
        data.username = params.username;
      }

      data.uniqueId = _utility["default"].generateUUID();
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.ADD_CONTACTS,
      method: 'POST',
      data: data,
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: responseData.hasError,
          cache: false,
          errorMessage: responseData.message,
          errorCode: responseData.errorCode
        };

        if (!responseData.hasError) {
          var messageContent = responseData.result,
              messageLength = responseData.result.length,
              resultData = {
            contacts: [],
            contentCount: messageLength
          },
              contactData;

          for (var i = 0; i < messageLength; i++) {
            contactData = formatDataToMakeContact(messageContent[i]);

            if (contactData) {
              resultData.contacts.push(contactData);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  };

  publicized.newAddContacts = function (params, callback) {
    var addContactsData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_CONTACTS,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token,
      typeCode: _sdkParams.sdkParams.generalTypeCode
    },
        AddContactVO = {},
        firstNameList = [],
        lastNameList = [],
        cellPhoneNumberList = [],
        emailList = [],
        userNameList = [],
        uniqueIdList = [];

    if (params) {
      //for(var item in params.contacts) {
      if (typeof params.firstName === 'string') {
        firstNameList.push(params.firstName);
      } else {
        firstNameList.push('');
      }

      if (typeof params.lastName === 'string') {
        lastNameList.push(params.lastName);
      } else {
        lastNameList.push('');
      }

      if (typeof params.cellphoneNumber === 'string') {
        cellPhoneNumberList.push(params.cellphoneNumber); // data.cellphoneNumber = params.cellphoneNumber;
      } else {
        cellPhoneNumberList.push(''); // data.cellphoneNumber = '';
      }

      if (typeof params.email === 'string') {
        emailList.push(params.email); // data.email = params.email;
      } else {
        emailList.push(''); // data.email = '';
      }

      if (typeof params.username === 'string') {
        userNameList.push(params.username); // data.username = params.username;
      }

      uniqueIdList.push(_utility["default"].generateUUID()); // data.uniqueId = Utility.generateUUID();
      //}

      AddContactVO = {
        uniqueIdList: uniqueIdList,
        emailList: emailList,
        userNameList: userNameList,
        firstNameList: firstNameList,
        lastNameList: lastNameList,
        cellphoneNumberList: cellPhoneNumberList
      };
    }

    addContactsData.content = AddContactVO;
    return chatMessaging.sendMessage(addContactsData, {
      onResult: function onResult(result) {
        // var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.message,
          errorCode: result.errorCode
        };

        if ((0, _typeof2["default"])(result.result) == 'object') {
          var _result$result, _result$result2, _result$result2$resul;

          var messageContent = result === null || result === void 0 ? void 0 : (_result$result = result.result) === null || _result$result === void 0 ? void 0 : _result$result.result,
              messageLength = result === null || result === void 0 ? void 0 : (_result$result2 = result.result) === null || _result$result2 === void 0 ? void 0 : (_result$result2$resul = _result$result2.result) === null || _result$result2$resul === void 0 ? void 0 : _result$result2$resul.length,
              resultData = {
            contacts: [],
            contentCount: messageLength
          },
              contactData;

          for (var i = 0; i < messageLength; i++) {
            contactData = formatDataToMakeContact(messageContent[i]);

            if (contactData) {
              resultData.contacts.push(contactData);
            }
          }

          returnData.result = resultData; // }

          callback && callback(returnData);
        } //callback && callback(result);

      }
    });
    /* var requestParams = {
        url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.ADD_CONTACTS,
        method: 'POST',
        data: data,
        headers: {
            '_token_': token,
            '_token_issuer_': 1
        }
    }; */

    /*httpRequest(requestParams, function (result) {
        if (!result.hasError) {
            var responseData = JSON.parse(result.result.responseText);
              var returnData = {
                hasError: responseData.hasError,
                cache: false,
                errorMessage: responseData.message,
                errorCode: responseData.errorCode
            };
              if (!responseData.hasError) {*/
    //} else {

    /*  chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
      });
      */
    //}
    //});
  };
  /*
      publicized.removeContacts = function ({id}, callback) {
          var data = {
                  chatMessageVOType: chatMessageVOTypes.REMOVE_CONTACTS,
                  content: [
                      parseInt(id)
                  ],
                  pushMsgType: 3,
                  token: token,
                  typeCode: generalTypeCode
              }
  
  
              if(!id) {
                  chatEvents.fireEvent('error', {
                      code: 999,
                      message: 'ID is required for Deleting Contact!',
                      error: undefined
                  });
              }
  
  
          return chatMessaging.sendMessage(data, {
              onResult: function (result) {
              if (!result.hasError) {
                  // var responseData = JSON.parse(result.result.responseText);
                  //
                  /!*var returnData = {
                      hasError: result.hasError,
                      cache: false,
                      errorMessage: result.errorMessage,
                      errorCode: result.errorCode
                  };
  
  
  
                  if (!result.hasError) {
                      returnData.result = result.result;
                  }*!/
  
                  /!**
                   * Remove the contact from cache
                   *!/
                  if (canUseCache) {
                      if (db) {
                          db.contacts.where('id')
                              .equals(parseInt(params.id))
                              .delete()
                              .catch(function (error) {
                                  chatEvents.fireEvent('error', {
                                      code: 6602,
                                      message: CHAT_ERRORS[6602],
                                      error: error
                                  });
                              });
                      } else {
                          chatEvents.fireEvent('error', {
                              code: 6601,
                              message: CHAT_ERRORS[6601],
                              error: null
                          });
                      }
                  }
  
                  result.result.uniqueId = result.uniqueId;
                  callback && callback(result.result);
              } else {
                  chatEvents.fireEvent('error', {
                      code: result.errorCode,
                      message: result.errorMessage,
                      error: result
                  });
              }
          }});
      };
  */


  publicized.updateContacts = function (params, callback) {
    var data = {};

    if (params) {
      if (parseInt(params.id) > 0) {
        data.id = parseInt(params.id);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'ID is required for Updating Contact!',
          error: undefined
        });
      }

      if (typeof params.firstName === 'string') {
        data.firstName = params.firstName;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'firstName is required for Updating Contact!'
        });
      }

      if (typeof params.lastName === 'string') {
        data.lastName = params.lastName;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'lastName is required for Updating Contact!'
        });
      }

      if (typeof params.cellphoneNumber === 'string') {
        data.cellphoneNumber = params.cellphoneNumber;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'cellphoneNumber is required for Updating Contact!'
        });
      }

      if (typeof params.email === 'string') {
        data.email = params.email;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'email is required for Updating Contact!'
        });
      }

      data.uniqueId = _utility["default"].generateUUID();
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.UPDATE_CONTACTS,
      method: 'GET',
      data: data,
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: responseData.hasError,
          cache: false,
          errorMessage: responseData.message,
          errorCode: responseData.errorCode
        };

        if (!responseData.hasError) {
          var messageContent = responseData.result,
              messageLength = responseData.result.length,
              resultData = {
            contacts: [],
            contentCount: messageLength
          },
              contactData;

          for (var i = 0; i < messageLength; i++) {
            contactData = formatDataToMakeContact(messageContent[i]);

            if (contactData) {
              resultData.contacts.push(contactData);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  };

  publicized.removeContacts = function (params, callback) {
    var data = {};

    if (params) {
      if (parseInt(params.id) > 0) {
        data.id = parseInt(params.id);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'ID is required for Deleting Contact!',
          error: undefined
        });
      }
    }

    data.ownerId = _sdkParams.sdkParams.typeCodeOwnerId ? _sdkParams.sdkParams.typeCodeOwnerId : params.ownerId ? params.ownerId : undefined;
    var requestParams = {
      url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.REMOVE_CONTACTS,
      method: 'POST',
      data: data,
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      }
    };
    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: responseData.hasError,
          cache: false,
          errorMessage: responseData.message,
          errorCode: responseData.errorCode
        };

        if (!responseData.hasError) {
          returnData.result = responseData.result;
        }

        callback && callback(returnData);
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  };

  publicized.searchContacts = function (params, callback) {
    var data = {
      size: 50,
      offset: 0
    },
        returnCache = false;

    if (params) {
      if (typeof params.firstName === 'string') {
        data.firstName = params.firstName;
      }

      if (typeof params.lastName === 'string') {
        data.lastName = params.lastName;
      }

      if (parseInt(params.cellphoneNumber) > 0) {
        data.cellphoneNumber = params.cellphoneNumber;
      }

      if (typeof params.email === 'string') {
        data.email = params.email;
      }

      if (typeof params.query === 'string') {
        data.q = params.query;
      }

      if (typeof params.uniqueId === 'string') {
        data.uniqueId = params.uniqueId;
      }

      if (parseInt(params.id) > 0) {
        data.id = params.id;
      }

      if (parseInt(params.typeCode) > 0) {
        data.typeCode = params.typeCode;
      }

      if (parseInt(params.size) > 0) {
        data.size = params.size;
      }

      if (parseInt(params.offset) > 0) {
        data.offset = params.offset;
      }

      var functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true;
    }

    var requestParams = {
      url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.SEARCH_CONTACTS,
      method: 'POST',
      data: data,
      headers: {
        '_token_': _sdkParams.sdkParams.token,
        '_token_issuer_': 1
      }
    };
    /**
     * Get Search Contacts Result From Server
     */

    httpRequest(requestParams, function (result) {
      if (!result.hasError) {
        var responseData = JSON.parse(result.result.responseText);
        var returnData = {
          hasError: responseData.hasError,
          cache: false,
          errorMessage: responseData.message,
          errorCode: responseData.errorCode
        };

        if (!responseData.hasError) {
          var messageContent = responseData.result,
              messageLength = responseData.result.length,
              resultData = {
            contacts: [],
            contentCount: messageLength
          },
              contactData;

          for (var i = 0; i < messageLength; i++) {
            contactData = formatDataToMakeContact(messageContent[i]);

            if (contactData) {
              resultData.contacts.push(contactData);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;

        if (!returnData.hasError && returnCache) {
          _events.chatEvents.fireEvent('contactEvents', {
            type: 'CONTACTS_SEARCH_RESULT_CHANGE',
            result: returnData.result
          });
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: result.errorCode,
          message: result.errorMessage,
          error: result
        });
      }
    });
  };

  publicized.createBot = function (params, callback) {
    var createBotData = {
      chatMessageVOType: _constants.chatMessageVOTypes.CREATE_BOT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: '',
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.botName === 'string' && params.botName.length > 0) {
        if (params.botName.substr(-3) === "BOT") {
          createBotData.content = params.botName;
        } else {
          _events.chatEvents.fireEvent('error', {
            code: 999,
            message: 'Bot name should end in "BOT", ex. "testBOT"'
          });

          return;
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Insert a bot name to create one!'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'Insert a bot name to create one!'
      });

      return;
    }

    return chatMessaging.sendMessage(createBotData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.defineBotCommand = function (params, callback) {
    var defineBotCommandData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DEFINE_BOT_COMMAND,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    },
        commandList = [];

    if (params) {
      if (typeof params.botName !== 'string' || params.botName.length === 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You need to insert a botName!'
        });

        return;
      }

      if (!Array.isArray(params.commandList) || !params.commandList.length) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Bot Commands List has to be an array of strings.'
        });

        return;
      } else {
        for (var i = 0; i < params.commandList.length; i++) {
          commandList.push('/' + params.commandList[i].trim());
        }
      }

      defineBotCommandData.content = {
        botName: params.botName.trim(),
        commandList: commandList
      };
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to create bot commands'
      });

      return;
    }

    return chatMessaging.sendMessage(defineBotCommandData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.removeBotCommand = function (params, callback) {
    var defineBotCommandData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_BOT_COMMANDS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    },
        commandList = [];

    if (params) {
      if (typeof params.botName !== 'string' || params.botName.length === 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You need to insert a botName!'
        });

        return;
      }

      if (!Array.isArray(params.commandList) || !params.commandList.length) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Bot Commands List has to be an array of strings.'
        });

        return;
      } else {
        for (var i = 0; i < params.commandList.length; i++) {
          commandList.push('/' + params.commandList[i].trim());
        }
      }

      defineBotCommandData.content = {
        botName: params.botName.trim(),
        commandList: commandList
      };
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to remove bot commands'
      });

      return;
    }

    return chatMessaging.sendMessage(defineBotCommandData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.startBot = function (params, callback) {
    var startBotData = {
      chatMessageVOType: _constants.chatMessageVOTypes.START_BOT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof +params.threadId !== 'number' || params.threadId < 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Enter a valid Thread Id for Bot to start in!'
        });

        return;
      }

      if (typeof params.botName !== 'string' || params.botName.length === 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You need to insert a botName!'
        });

        return;
      }

      startBotData.subjectId = +params.threadId;
      startBotData.content = JSON.stringify({
        botName: params.botName.trim()
      });
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to create bot commands'
      });

      return;
    }

    return chatMessaging.sendMessage(startBotData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.stopBot = function (params, callback) {
    var stopBotData = {
      chatMessageVOType: _constants.chatMessageVOTypes.STOP_BOT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof +params.threadId !== 'number' || params.threadId < 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Enter a valid Thread Id for Bot to stop on!'
        });

        return;
      }

      if (typeof params.botName !== 'string' || params.botName.length === 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You need to insert a botName!'
        });

        return;
      }

      stopBotData.subjectId = +params.threadId;
      stopBotData.content = JSON.stringify({
        botName: params.botName.trim()
      });
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to create bot commands'
      });

      return;
    }

    return chatMessaging.sendMessage(stopBotData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getBotCommandsList = function (params, callback) {
    var getBotCommandsListData = {
      chatMessageVOType: _constants.chatMessageVOTypes.BOT_COMMANDS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.botName !== 'string' || params.botName.length === 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You need to insert a botName!'
        });

        return;
      }

      getBotCommandsListData.content = JSON.stringify({
        botName: params.botName.trim()
      });
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to get bot commands'
      });

      return;
    }

    return chatMessaging.sendMessage(getBotCommandsListData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getThreadAllBots = function (params, callback) {
    var getThreadBotsData = {
      chatMessageVOType: _constants.chatMessageVOTypes.THREAD_ALL_BOTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof +params.threadId !== 'number' || params.threadId < 0) {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Enter a valid Thread Id to get all Bots List!'
        });

        return;
      }

      getThreadBotsData.subjectId = +params.threadId;
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to get thread\' bots list!'
      });

      return;
    }

    return chatMessaging.sendMessage(getThreadBotsData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.createTag = function (params, callback) {
    var createTagData = {
      chatMessageVOType: _constants.chatMessageVOTypes.CREATE_TAG,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.tagName === 'string' && params.tagName.length > 0) {
        createTagData.content.name = params.tagName;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No tag name has been declared!"
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Create New Tag!'
      });

      return;
    }

    return chatMessaging.sendMessage(createTagData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.editTag = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.EDIT_TAG,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (parseInt(params.tagId) > 0) {
        sendData.subjectId = +params.tagId;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No Tag Id has been sent!"
        });

        return;
      }

      if (typeof params.tagName === 'string' && params.tagName.length > 0) {
        sendData.content.name = params.tagName;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No tag name has been declared!"
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Edit Tag!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.deleteTag = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DELETE_TAG,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (parseInt(params.tagId) > 0) {
        sendData.subjectId = +params.tagId;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: "No Tag Id has been sent!"
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Delete Tag!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getTagList = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_TAG_LIST,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.addTagParticipants = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ADD_TAG_PARTICIPANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (+params.tagId > 0) {
        sendData.subjectId = +params.tagId;
      }

      if (Array.isArray(params.threadIds)) {
        sendData.content = params.threadIds;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Add Tag PArticipants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.removeTagParticipants = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REMOVE_TAG_PARTICIPANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (+params.tagId > 0) {
        sendData.subjectId = +params.tagId;
      }

      if (Array.isArray(params.threadIds)) {
        sendData.content = params.threadIds;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Remove Tag Participants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.registerAssistant = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.REGISTER_ASSISTANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (Array.isArray(params.assistants) && (0, _typeof2["default"])(params.assistants[0]) === 'object') {
        for (var i = 0; i < params.assistants.length; i++) {
          if ((0, _typeof2["default"])(params.assistants[i]) === 'object' && params.assistants[i].hasOwnProperty('contactType') && !!params.assistants[i].contactType && params.assistants[i].hasOwnProperty('roleTypes') && Array.isArray(params.assistants[i].roleTypes) && params.assistants[i].roleTypes.length && params.assistants[i].hasOwnProperty('assistant') && params.assistants[i].assistant.hasOwnProperty('id') && params.assistants[i].assistant.hasOwnProperty('idType') && params.assistants[i].assistant.id.length && _constants.inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
            sendData.content.push({
              contactType: params.assistants[i].contactType,
              roleTypes: params.assistants[i].roleTypes,
              assistant: {
                id: params.assistants[i].assistant.id,
                idType: +_constants.inviteeVOidTypes[params.assistants[i].assistant.idType]
              }
            });
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: 'You should send an array of Assistant Objects each containing of contactType, roleTypes and assistant itself!'
            });

            return;
          }
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should send an array of Assistant Objects each containing of contactType, roleTypes and assistant itself!'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Create Assistants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.deactivateAssistant = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.DEACTIVATE_ASSISTANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (Array.isArray(params.assistants) && (0, _typeof2["default"])(params.assistants[0]) === 'object') {
        for (var i = 0; i < params.assistants.length; i++) {
          if ((0, _typeof2["default"])(params.assistants[i]) === 'object' && params.assistants[i].hasOwnProperty('assistant') && params.assistants[i].assistant.hasOwnProperty('id') && params.assistants[i].assistant.hasOwnProperty('idType') && params.assistants[i].assistant.id.length && _constants.inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
            sendData.content.push({
              assistant: {
                id: params.assistants[i].assistant.id,
                idType: +_constants.inviteeVOidTypes[params.assistants[i].assistant.idType]
              }
            });
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: 'You should send an array of Assistant Objects each containing of an assistant!'
            });

            return;
          }
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should send an array of Assistant Objects each containing of an assistant!'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Deactivate Assistants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.blockAssistant = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.BLOCK_ASSISTANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (Array.isArray(params.assistants) && (0, _typeof2["default"])(params.assistants[0]) === 'object') {
        for (var i = 0; i < params.assistants.length; i++) {
          if ((0, _typeof2["default"])(params.assistants[i]) === 'object' && params.assistants[i].hasOwnProperty('assistant') && params.assistants[i].assistant.hasOwnProperty('id') && params.assistants[i].assistant.hasOwnProperty('idType') && params.assistants[i].assistant.id.length && _constants.inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
            sendData.content.push({
              assistant: {
                id: params.assistants[i].assistant.id,
                idType: +_constants.inviteeVOidTypes[params.assistants[i].assistant.idType]
              }
            });
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: 'You should send an array of Assistant Objects each containing of an assistant!'
            });

            return;
          }
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should send an array of Assistant Objects each containing of an assistant!'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Block Assistants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.unblockAssistant = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.UNBLOCK_ASSISTANT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: []
    };

    if (params) {
      if (Array.isArray(params.assistants) && (0, _typeof2["default"])(params.assistants[0]) === 'object') {
        for (var i = 0; i < params.assistants.length; i++) {
          if ((0, _typeof2["default"])(params.assistants[i]) === 'object' && params.assistants[i].hasOwnProperty('assistant') && params.assistants[i].assistant.hasOwnProperty('id') && params.assistants[i].assistant.hasOwnProperty('idType') && params.assistants[i].assistant.id.length && _constants.inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
            sendData.content.push({
              assistant: {
                id: params.assistants[i].assistant.id,
                idType: +_constants.inviteeVOidTypes[params.assistants[i].assistant.idType]
              }
            });
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: 'You should send an array of Assistant Objects each containing of an assistant!'
            });

            return;
          }
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should send an array of Assistant Objects each containing of an assistant!'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Unblock Assistants!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result;
          returnData.result = messageContent;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.getAssistantsList = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_ASSISTANTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.contactType === 'string' && params.contactType.length) {
        sendData.content.contactType = params.contactType;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Enter a ContactType to get all related Assistants!'
        });

        return;
      }

      sendData.content.count = !!params.count ? +params.count : 25;
      sendData.content.offset = !!params.offset ? +params.offset : 0;
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to get Assistants list!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getBlockedAssistantsList = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.BLOCKED_ASSISTANTS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {},
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    };

    if (params) {
      if (typeof params.contactType === 'string' && params.contactType.length) {
        sendData.content.contactType = params.contactType;
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Enter a ContactType to get all Blocked Assistants!'
        });

        return;
      }

      sendData.content.count = !!params.count ? +params.count : 25;
      sendData.content.offset = !!params.offset ? +params.offset : 0;
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to get Blocked Assistants list!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getAssistantsHistory = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ASSISTANT_HISTORY,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        offset: +params.offset > 0 ? +params.offset : 0,
        count: +params.count > 0 ? +params.count : config.getHistoryCount
      }
    };

    if (+params.fromTime > 0 && +params.fromTime < 9999999999999) {
      sendData.content.fromTime = +params.fromTime;
    }

    if (+params.toTime > 0 && +params.toTime < 9999999999999) {
      sendData.content.toTime = +params.toTime;
    }

    if (!!params.actionType && _constants.assistantActionTypes.hasOwnProperty(params.actionType.toUpperCase())) {
      sendData.content.actionType = _constants.assistantActionTypes[params.actionType.toUpperCase()];
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            participants: formatDataToMakeAssistantHistoryList(messageContent),
            contentCount: result.contentCount,
            hasNext: sendData.content.offset + sendData.content.count < result.contentCount && messageLength > 0,
            nextOffset: sendData.content.offset * 1 + messageLength * 1
          };
          returnData.result = resultData;
        }

        callback && callback(returnData);
        callback = undefined;
      }
    });
  };

  publicized.mapReverse = mapReverse;
  publicized.mapSearch = mapSearch;
  publicized.mapRouting = mapRouting;
  publicized.mapStaticImage = mapStaticImage;

  publicized.setAdmin = function (params, callback) {
    setRoleToUser(params, callback);
  };

  publicized.removeAdmin = function (params, callback) {
    removeRoleFromUser(params, callback);
  };

  publicized.setAuditor = function (params, callback) {
    setRoleToUser(params, callback);
  };

  publicized.removeAuditor = function (params, callback) {
    removeRoleFromUser(params, callback);
  };

  function requestExportChat(stackArr, wantedCount, stepCount, offset, sendData) {
    sendData.content.offset = offset;
    sendData.content.count = stepCount;
    return new Promise(function (resolve, reject) {
      return chatMessaging.sendMessage(sendData, {
        onResult: function onResult(result) {
          var returnData = {
            hasError: result.hasError,
            cache: false,
            errorMessage: result.errorMessage,
            errorCode: result.errorCode
          };

          if (!returnData.hasError) {
            /* for(var i in result.result) {
                stackArr.push(result.result[i]);
            } */
            stackArr.push.apply(stackArr, (0, _toConsumableArray2["default"])(result.result));
            _sdkParams.sdkParams.consoleLogging && console.log("[SDK][exportChat] a step passed..."); // wantedCount = wantedCount > result.contentCount ? result.contentCount : wantedCount;

            if (result.result.length < stepCount) {
              wantedCount = stackArr.length;
            }

            setTimeout(function () {
              _events.chatEvents.fireEvent('threadEvents', {
                type: 'EXPORT_CHAT',
                subType: 'IN_PROGRESS',
                threadId: sendData.subjectId,
                percent: Math.floor(stackArr.length / wantedCount * 100)
              });

              if (stackArr.length < wantedCount) {
                stepCount = wantedCount - stackArr.length < stepCount ? wantedCount - stackArr.length : stepCount; //setTimeout(function () {

                resolve(requestExportChat(stackArr, wantedCount, stepCount, stackArr.length, sendData)); //}, 1000)
              } else {
                resolve(stackArr);
              }
            });
          } else {
            if (result.errorCode !== 21) {
              _sdkParams.sdkParams.consoleLogging && console.log("[SDK][exportChat] Problem in one step... . Rerunning the request.", wantedCount, stepCount, stackArr.length, sendData, result);
              setTimeout(function () {
                resolve(requestExportChat(stackArr, wantedCount, stepCount, stackArr.length, sendData));
              }, 2000);
            } else {
              reject(result);
            }
          }
        }
      });
    });
  }

  publicized.exportChat = function (params, callback) {
    var stackArr = [],
        wantedCount = 10000,
        stepCount = 500,
        offset = 0;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.EXPORT_CHAT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        offset: +params.offset > 0 ? +params.offset : offset,
        count: +params.count > 0 ? +params.count : wantedCount //config.getHistoryCount,

      },
      subjectId: params.threadId
    };

    if (+params.fromTime > 0 && +params.fromTime < 9999999999999) {
      sendData.content.fromTime = +params.fromTime;
    }

    if (+params.toTime > 0 && +params.toTime < 9999999999999) {
      sendData.content.toTime = +params.toTime;
    }

    if (+params.wantedCount > 0) {
      wantedCount = params.wantedCount;
    }

    if (+params.stepCount > 0) {
      stepCount = params.stepCount;
    }

    if (+params.offset > 0) {
      offset = params.offset;
    } // if (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) {
    //     sendData.content.messageType = chatMessageTypes[params.messageType.toUpperCase()];
    // }


    sendData.content.messageType = 1;
    if (wantedCount < stepCount) stepCount = wantedCount;
    _sdkParams.sdkParams.consoleLogging && console.log("[SDK][exportChat] Starting...");
    requestExportChat(stackArr, wantedCount, stepCount, offset, sendData).then(function (result) {
      _sdkParams.sdkParams.consoleLogging && console.log("[SDK][exportChat] Export done..., Now converting...");
      var exportedFilename = (params.fileName || 'export-' + params.threadId) + '.csv',
          responseType = params.responseType !== null ? params.responseType : "blob",
          autoStartDownload = params.autoStartDownload !== null ? params.autoStartDownload : true;
      var str = '',
          universalBOM = "\uFEFF";
      str += "\u062A\u0627\u0631\u06CC\u062E " + ','; //tarikh

      str += " \u0633\u0627\u0639\u062A " + ','; //saat

      str += "\u0646\u0627\u0645 \u0641\u0631\u0633\u062A\u0646\u062F\u0647" + ','; //name ferestande

      str += "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0641\u0631\u0633\u062A\u0646\u062F\u0647" + ','; //name karbariye ferestande

      str += "\u0645\u062A\u0646 \u067E\u06CC\u0627\u0645" + ','; //matne payam

      str += '\r\n';
      var line = '',
          radif = 1;

      for (var i = 0; i < result.length; i++) {
        line = '';

        if (result[i].messageType !== 1) {
          continue;
        }

        var sender = '';

        if (result[i].participant.contactName) {
          sender = result[i].participant.contactName + ',';
        } else {
          if (result[i].participant.firstName) {
            sender = result[i].participant.firstName + ' ';
          }

          if (result[i].participant.lastName) {
            sender += result[i].participant.lastName;
          }

          sender += ',';
        }

        line += new Date(result[i].time).toLocaleDateString('fa-IR') + ',';
        line += new Date(result[i].time).toLocaleTimeString('fa-IR') + ',';
        line += sender;
        line += result[i].participant.username + ',';
        line += '"' + result[i].message.replaceAll(",", "،").replaceAll('"', '”') + '",'; // line += result[i].message.replaceAll(",", ".").replace(/(\r\n|\n|\r)/gm, " ") + ',';

        str += line + '\r\n';
        radif++;
      }

      var blob = new Blob([str], {
        type: 'text/csv;charset=utf-8;'
      });

      _events.chatEvents.fireEvent('threadEvents', {
        type: 'EXPORT_CHAT',
        subType: 'DONE',
        threadId: sendData.subjectId,
        result: blob
      });
      /*if (navigator.msSaveBlob) { // IE 10+
          if(params.autoStartDownload) {
              navigator.msSaveBlob(blob, exportedFilename);
          }
          callback && callback({
              hasError: false,
              type: 'blob',
              result: blob
          });
      } else {*/


      if (responseType === 'link') {
        var link = document.createElement("a"),
            url = URL.createObjectURL(blob); //if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute

        link.setAttribute("href", 'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM + str));
        link.setAttribute("download", exportedFilename);

        if (autoStartDownload) {
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } //}


        callback && callback({
          hasError: false,
          type: 'link',
          result: link
        });
      } else {
        callback && callback({
          hasError: false,
          type: 'blob',
          result: blob
        });
      } //}


      callback = undefined;
    });
    /*.catch(function (result) {
      consoleLogging && console.log(result);
    });*/
  };

  publicized.startCall = callModule.startCall;
  publicized.startGroupCall = callModule.startGroupCall;
  publicized.callReceived = callModule.callReceived;
  publicized.terminateCall = callModule.terminateCall;
  publicized.acceptCall = callModule.acceptCall;
  publicized.rejectCall = publicized.cancelCall = callModule.rejectCall;
  publicized.endCall = callModule.endCall;
  publicized.startRecordingCall = callModule.startRecordingCall;
  publicized.stopRecordingCall = callModule.stopRecordingCall;
  publicized.startScreenShare = callModule.startScreenShare;
  publicized.resizeScreenShare = callModule.resizeScreenShare;
  publicized.endScreenShare = callModule.endScreenShare;
  publicized.getCallsList = callModule.getCallsList;
  publicized.getCallsToJoin = callModule.getCallsToJoin;
  publicized.deleteFromCallList = callModule.deleteFromCallList;
  publicized.getCallParticipants = callModule.getCallParticipants;
  publicized.addCallParticipants = callModule.addCallParticipants;
  publicized.removeCallParticipants = callModule.removeCallParticipants;
  publicized.muteCallParticipants = callModule.muteCallParticipants;
  publicized.unMuteCallParticipants = callModule.unMuteCallParticipants;
  publicized.turnOnVideoCall = callModule.turnOnVideoCall;
  publicized.turnOffVideoCall = callModule.turnOffVideoCall;
  publicized.disableParticipantsVideoReceive = callModule.disableParticipantsVideoReceive;
  publicized.enableParticipantsVideoReceive = callModule.enableParticipantsVideoReceive;
  publicized.pauseCamera = callModule.pauseCamera;
  publicized.resumeCamera = callModule.resumeCamera;
  publicized.pauseMice = callModule.pauseMice;
  publicized.resumeMice = callModule.resumeMice;
  publicized.resizeCallVideo = callModule.resizeCallVideo;
  publicized.restartMedia = callModule.restartMedia;
  publicized.callStop = callModule.callStop;
  publicized.sendCallMetaData = callModule.sendCallMetaData;
  publicized.sendCallSticker = callModule.sendCallSticker;
  publicized.callStickerTypes = _constants.callStickerTypes;
  publicized.recallThreadParticipant = callModule.recallThreadParticipant;
  publicized.deviceManager = callModule.deviceManager;
  publicized.resetCallStream = callModule.resetCallStream;

  publicized.getMutualGroups = function (params, callback) {
    var count = +params.count ? +params.count : 25,
        offset = +params.offset ? +params.offset : 0;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.MUTUAL_GROUPS,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: {
        count: count,
        offset: offset
      }
    };

    if (params) {
      if ((0, _typeof2["default"])(params.user) === 'object' && params.user.hasOwnProperty('id') && params.user.hasOwnProperty('idType') && params.user.id.length && _constants.inviteeVOidTypes[params.user.idType] > 0) {
        sendData.content.toBeUserVO = {
          id: params.user.id,
          idType: +_constants.inviteeVOidTypes[params.user.idType]
        };
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'You should send an user object like {id: 92, idType: "TO_BE_USER_CONTACT_ID"}'
        });

        return;
      }
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to Get Mutual Groups!'
      });

      return;
    }

    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          uniqueId: result.uniqueId
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            threads: [],
            contentCount: result.contentCount,
            hasNext: offset + count < result.contentCount && messageLength > 0,
            nextOffset: offset * 1 + messageLength * 1
          },
              threadData;

          for (var i = 0; i < messageLength; i++) {
            threadData = createThread(messageContent[i], false);

            if (threadData) {
              resultData.threads.push(threadData);
            }
          }

          returnData.result = resultData;
        }

        callback && callback(returnData);
        /**
         * Delete callback so if server pushes response before
         * cache, cache won't send data again
         */

        callback = undefined;
      }
    });
  };

  publicized.sendLocationPing = function (params, callback) {
    /**
     * + locationPingRequest     {object}
     *    + content              {list} A map of { location: string, locationId: int }
     */
    var locationPingData = {
      chatMessageVOType: _constants.chatMessageVOTypes.LOCATION_PING,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      pushMsgType: 3,
      token: _sdkParams.sdkParams.token
    },
        content = {};

    if (params) {
      if (typeof params.location === 'string' && _sdkParams.sdkParams.locationPingTypes.hasOwnProperty(params.location.toUpperCase())) {
        content.location = _sdkParams.sdkParams.locationPingTypes[params.location.toUpperCase()];

        if (params.location.toUpperCase() === 'THREAD') {
          if (typeof params.threadId === 'number' && params.threadId > 0) {
            content.locationId = +params.threadId;
          } else {
            _events.chatEvents.fireEvent('error', {
              code: 999,
              message: 'You set the location to be a thread, you have to send a valid ThreadId'
            });

            return;
          }
        }
      } else {
        _events.chatEvents.fireEvent('error', {
          code: 999,
          message: 'Send a valid location type (CHAT / THREAD / CONTACTS)'
        });

        return;
      }

      locationPingData.content = JSON.stringify(content);
    } else {
      _events.chatEvents.fireEvent('error', {
        code: 999,
        message: 'No params have been sent to LocationPing!'
      });

      return;
    }

    return chatMessaging.sendMessage(locationPingData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.clearChatServerCaches = clearChatServerCaches;
  publicized.deleteCacheDatabases = deleteCacheDatabases;
  publicized.clearCacheDatabasesOfUser = clearCacheDatabasesOfUser;

  publicized.getChatState = function () {
    return chatFullStateObject;
  };

  publicized.reconnect = function () {
    protocolManager.reconnectAsync();
  };

  publicized.setToken = function (newToken) {
    if (typeof newToken !== 'undefined') {
      _sdkParams.sdkParams.token = newToken;

      _events.chatEvents.updateToken(_sdkParams.sdkParams.token);

      if (!chatMessaging.userInfo || !chatMessaging.userInfo.id) {
        getUserAndUpdateSDKState();
      }
    }
  };

  publicized.generateUUID = _utility["default"].generateUUID;

  publicized.logout = function () {
    // clearChatServerCaches();
    _events.chatEvents.clearEventCallbacks();

    chatMessaging.messagesCallbacks = {};
    chatMessaging.sendMessageCallbacks = {};
    chatMessaging.threadCallbacks = {};
    chatMessaging.stopChatPing();
    asyncClient.logout();
  };

  publicized.inviteeIdTypes = _constants.inviteeVOidTypes;
  /**
   * Check a turn server availability
   *
   * @param turnIp
   * @param port
   * @param useUDP
   * @param username
   * @param password
   * @param timeout
   * @return {Promise<boolean>}
   */

  publicized.checkTURNServer = function (turnIp, port) {
    var useUDP = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var username = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'mkhorrami';
    var password = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'mkh_123456';
    var timeout = arguments.length > 5 ? arguments[5] : undefined;
    var url = 'turn:' + turnIp + ':' + port + '?transport=' + (useUDP ? 'udp' : 'tcp');
    var turnConfig = {
      urls: url,
      username: username,
      credential: password
    };

    if (navigator.userAgent.indexOf('firefox') !== -1 && navigator.userAgent.indexOf('92.0.5') !== -1) {
      alert('Browser version is not suitable for video call. Upgrade or use another browser.');
    }

    console.log('turnConfig: ', turnConfig);
    return new Promise(function (resolve, reject) {
      var promiseResolved;
      setTimeout(function () {
        if (promiseResolved) return;
        resolve(false);
        promiseResolved = true;
      }, timeout || 5000);
      promiseResolved = false;

      var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection //compatibility for firefox and chrome
      ,
          pc = new myPeerConnection({
        iceServers: [turnConfig]
      }),
          noop = function noop() {};

      pc.createDataChannel(""); //create a bogus data channel

      pc.createOffer(function (sdp) {
        if (sdp.sdp.indexOf('typ relay') > -1) {
          // sometimes sdp contains the ice candidates...
          promiseResolved = true;
          resolve(true);
        }

        pc.setLocalDescription(sdp, noop, noop);
      }, noop); // create offer and set local description

      pc.onicecandidate = function (ice) {
        //listen for candidate events
        if (promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay') > -1)) return;
        promiseResolved = true;
        resolve(true);
      };
    });
  };

  publicized.getCustomerInfo = function (params, callback) {
    var userId = params.userId || chatMessaging.userInfo.id,
        sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.CUSTOMER_INFO,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: [userId],
      token: _sdkParams.sdkParams.token
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.getThreadsLight = function (params, callback) {
    var count = 25,
        offset = 0,
        content = {};

    if (params) {
      if (parseInt(params.count) > 0) {
        count = params.count;
      }

      if (parseInt(params.offset) > 0) {
        offset = params.offset;
      }

      if (typeof params.threadName === 'string') {
        content.name = params.threadName;
      }

      if (typeof params.username === 'string') {
        content.username = params.username;
      }

      if (typeof params.cellphoneNumber === 'string') {
        content.cellphoneNumber = params.cellphoneNumber;
      }

      if (Array.isArray(params.threadIds)) {
        content.threadIds = params.threadIds;
      }

      if (typeof params["new"] === 'boolean') {
        content["new"] = params["new"];
      }

      if (parseInt(params.creatorCoreUserId) > 0) {
        content.creatorCoreUserId = params.creatorCoreUserId;
      }

      if (parseInt(params.partnerCoreUserId) > 0) {
        content.partnerCoreUserId = params.partnerCoreUserId;
      }

      if (parseInt(params.partnerCoreContactId) > 0) {
        content.partnerCoreContactId = params.partnerCoreContactId;
      }

      if (parseInt(params.fromTime) > 0 && parseInt(params.fromTime) < 9999999999999) {
        content.fromTime = parseInt(params.fromTime);
      }

      if (parseInt(params.toTime) > 0 && parseInt(params.toTime) < 9999999999999) {
        content.toTime = parseInt(params.toTime);
      }

      var functionLevelCache = typeof params.cache == 'boolean' ? params.cache : true;

      if (typeof params.isGroup === 'boolean') {
        content.isGroup = params.isGroup;
      }

      if (typeof params.type === 'number') {
        content.type = params.type;
      }
    }

    content.count = count;
    content.offset = offset;
    var sendMessageParams = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_THREAD_LIGHT,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      content: content
    };
    return chatMessaging.sendMessage(sendMessageParams, {
      onResult: function onResult(result) {
        var returnData = {
          hasError: result.hasError,
          cache: false,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          uniqueId: result.uniqueId
        };

        if (!returnData.hasError) {
          var messageContent = result.result,
              messageLength = messageContent.length,
              resultData = {
            threads: [],
            contentCount: result.contentCount,
            hasNext: messageContent && !(messageLength < count),
            //(offset + count < result.contentCount && messageLength > 0),
            nextOffset: offset * 1 + messageLength * 1
          },
              threadData;

          for (var i = 0; i < messageLength; i++) {
            threadData = createThread(messageContent[i], false);

            if (threadData) {
              resultData.threads.push(threadData);
            }
          }

          _store.store.threads.saveMany(resultData.threads);

          returnData.result = resultData;
        }

        callback && callback(returnData);
      }
    });
  };

  publicized.archiveThread = function (_ref2, callback) {
    var threadId = _ref2.threadId;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.ARCHIVE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      token: _sdkParams.sdkParams.token,
      subjectId: threadId
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.unArchiveThread = function (_ref3, callback) {
    var threadId = _ref3.threadId;
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.UNARCHIVE_THREAD,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      token: _sdkParams.sdkParams.token,
      subjectId: threadId
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        callback && callback(result);
      }
    });
  };

  publicized.version = function () {
    console.log("%c[SDK] Version: podchat-browser@" + _buildConfig["default"].version, "color:green; font-size:13px");
    console.log("%c[SDK] Build date:" + _buildConfig["default"].date, "color:green;font-size:13px");
    console.log("%c[SDK] Additional info: " + _buildConfig["default"].VersionInfo, "color:green;font-size:13px");
    return _buildConfig["default"];
  };

  publicized.changeProtocol = function () {
    var proto = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "websocket";

    if (["webrtc", "websocket", "auto"].includes(proto)) {
      if (proto != protocolManager.getCurrentProtocol()) {
        protocolManager.switchProtocol(proto.toLowerCase()); // sdkParams.protocol = protocolSwitching.getCurrentProtocol();
        // asyncClient.logout();
        // initAsync();
      } else {
        console.warn("SDK is currently using the ".concat(proto, " protocol. Nothing to do."));
      }
    } else {
      console.error("Protocol ".concat(proto, " is not supported in SDK. Valid protocols: \"webrtc\", \"websocket\""));
    }
  };

  publicized.getPinMessages = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.GET_PIN_MESSAGE,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      token: _sdkParams.sdkParams.token,
      content: params.content
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        // if(!result.hasError) {
        //     let formattedData = {};
        //     if(result.result && Object.values(result.result).length) {
        //         Object.entries(result.result).forEach(item => {
        //             formattedData[item[0]] = formatDataToMakeMessage(item[0], item[1]);
        //         });
        //         result.result = formattedData;
        //     }
        // }
        callback && callback(result);
      }
    });
  };

  publicized.lastMessageInfo = function (params, callback) {
    var sendData = {
      chatMessageVOType: _constants.chatMessageVOTypes.LAST_MESSAGE_INFO,
      typeCode: _sdkParams.sdkParams.generalTypeCode,
      //params.typeCode,
      token: _sdkParams.sdkParams.token,
      content: params.content
    };
    return chatMessaging.sendMessage(sendData, {
      onResult: function onResult(result) {
        if (!result.hasError) {
          var formattedData = {};

          if (result.result && Object.values(result.result).length) {
            Object.entries(result.result).forEach(function (item) {
              formattedData[item[0]] = formatDataToMakeMessage(item[0], item[1]);
            });
            result.result = formattedData;
          }
        }

        callback && callback(result);
      }
    });
  };

  _store.store.events.on(_store.store.threads.eventsList.UNREAD_COUNT_UPDATED, function (thread) {
    _events.chatEvents.fireEvent('threadEvents', {
      type: 'UNREAD_COUNT_UPDATED',
      result: {
        threadId: thread.id,
        unreadCount: thread.unreadCount || 0,
        lastSeenMessageTime: thread.lastSeenMessageTime || undefined
      }
    });
  });

  init();
  return publicized;
}

if (typeof window !== "undefined") {
  if (!window.POD) {
    window.POD = {};
  }

  window.POD.Chat = Chat; //For backward compatibility

  window.PodChat = Chat;
}

var _default = Chat;
exports["default"] = _default;