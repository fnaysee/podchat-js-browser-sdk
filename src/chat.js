'use strict';

(function () {
    /*
     * Pod Chat Browser Module
     * @module chat
     *
     * @param {Object} params
     */
    var Async,
        ChatUtility,
        Dexie,
        Sentry,
        ChatCall,
        ChatEvents,
        ChatMessaging;

    function Chat(params) {
        if (typeof (require) !== 'undefined' && typeof (module) !== 'undefined') {
            Async = require('podasync-ws-only');
            ChatUtility = require('./utility/utility.js');
            Dexie = require('dexie').default || require('dexie');
            Sentry = require('@sentry/browser');
            ChatEvents = require('./events.module.js');
            ChatMessaging = require('./messaging.module.js');
            ChatCall = require('./call.module.js');
        } else {
            Async = window.POD.Async;
            ChatUtility = window.POD.ChatUtility;
            Dexie = window.Dexie;
            Sentry = window.Sentry;
            ChatEvents = window.POD.ChatEvents;
            ChatMessaging = window.POD.ChatMessaging;
            ChatCall = window.POD.ChatCall;
        }

        /*******************************************************
         *          P R I V A T E   V A R I A B L E S          *
         *******************************************************/

        var Utility = new ChatUtility();

        if (!!Sentry) {
            Sentry.init({
                dsn: 'https://784a14966f6a416b8b58a4b144aef0f5:733b76b6354f4547a7428bb8c7489bf2@talksentry.sakku-khatam.ir/4',
                attachStacktrace: true
            });
            Sentry.setContext("Chat Params", params);
            Sentry.setTag("sdk.details", "js browser");
            Sentry.setTag("client.name", params.clientName);
        }

        var asyncClient,
            peerId,
            oldPeerId,
            token = params.token,
            generalTypeCode = params.typeCode || 'default',
            mapApiKey = params.mapApiKey || '8b77db18704aa646ee5aaea13e7370f4f88b9e8c',
            deviceId,
            productEnv = (typeof navigator != 'undefined') ? navigator.product : 'undefined',
            db,
            queueDb,
            forceWaitQueueInMemory = (params.forceWaitQueueInMemory && typeof params.forceWaitQueueInMemory === 'boolean') ? params.forceWaitQueueInMemory : false,
            hasCache = productEnv !== 'ReactNative' && typeof Dexie != 'undefined',
            cacheInMemory = forceWaitQueueInMemory ? true : !hasCache,
            enableCache = (params.enableCache && typeof params.enableCache === 'boolean') ? params.enableCache : false,
            canUseCache = hasCache && enableCache,
            isCacheReady = false,
            cacheDeletingInProgress = false,
            cacheExpireTime = params.cacheExpireTime || 2 * 24 * 60 * 60 * 1000,
            cacheSecret = 'VjaaS9YxNdVVAd3cAsRPcU5FyxRcyyV6tG6bFGjjK5RV8JJjLrXNbS5zZxnqUT6Y',
            cacheSyncWorker,
            grantDeviceIdFromSSO = (params.grantDeviceIdFromSSO && typeof params.grantDeviceIdFromSSO === 'boolean')
                ? params.grantDeviceIdFromSSO
                : false,
            messagesDelivery = {},
            messagesSeen = {},
            deliveryInterval,
            deliveryIntervalPitch = params.deliveryIntervalPitch || 2000,
            seenInterval,
            seenIntervalPitch = params.seenIntervalPitch || 2000,
            getImageFromLinkObjects = {},
            chatMessageVOTypes = {
                CREATE_THREAD: 1,
                MESSAGE: 2,
                SENT: 3,
                DELIVERY: 4,
                SEEN: 5,
                PING: 6,
                BLOCK: 7,
                UNBLOCK: 8,
                LEAVE_THREAD: 9,
                ADD_PARTICIPANT: 11,
                GET_STATUS: 12,
                GET_CONTACTS: 13,
                GET_THREADS: 14,
                GET_HISTORY: 15,
                CHANGE_TYPE: 16,
                REMOVED_FROM_THREAD: 17,
                REMOVE_PARTICIPANT: 18,
                MUTE_THREAD: 19,
                UNMUTE_THREAD: 20,
                UPDATE_THREAD_INFO: 21,
                FORWARD_MESSAGE: 22,
                USER_INFO: 23,
                USER_STATUS: 24,
                GET_BLOCKED: 25,
                RELATION_INFO: 26,
                THREAD_PARTICIPANTS: 27,
                EDIT_MESSAGE: 28,
                DELETE_MESSAGE: 29,
                THREAD_INFO_UPDATED: 30,
                LAST_SEEN_UPDATED: 31,
                GET_MESSAGE_DELEVERY_PARTICIPANTS: 32,
                GET_MESSAGE_SEEN_PARTICIPANTS: 33,
                IS_NAME_AVAILABLE: 34,
                JOIN_THREAD: 39,
                BOT_MESSAGE: 40,
                SPAM_PV_THREAD: 41,
                SET_ROLE_TO_USER: 42,
                REMOVE_ROLE_FROM_USER: 43,
                CLEAR_HISTORY: 44,
                SYSTEM_MESSAGE: 46,
                GET_NOT_SEEN_DURATION: 47,
                PIN_THREAD: 48,
                UNPIN_THREAD: 49,
                PIN_MESSAGE: 50,
                UNPIN_MESSAGE: 51,
                UPDATE_CHAT_PROFILE: 52,
                CHANGE_THREAD_PRIVACY: 53,
                GET_PARTICIPANT_ROLES: 54,
                GET_REPORT_REASONS: 56,
                REPORT_THREAD: 57,
                REPORT_USER: 58,
                REPORT_MESSAGE: 59,
                GET_CONTACT_NOT_SEEN_DURATION: 60,
                ALL_UNREAD_MESSAGE_COUNT: 61,
                CREATE_BOT: 62,
                DEFINE_BOT_COMMAND: 63,
                START_BOT: 64,
                STOP_BOT: 65,
                LAST_MESSAGE_DELETED: 66,
                LAST_MESSAGE_EDITED: 67,
                BOT_COMMANDS: 68,
                THREAD_ALL_BOTS: 69,
                CALL_REQUEST: 70,
                ACCEPT_CALL: 71,
                REJECT_CALL: 72,
                RECEIVE_CALL_REQUEST: 73,
                START_CALL: 74,
                END_CALL_REQUEST: 75,
                END_CALL: 76,
                GET_CALLS: 77,
                RECONNECT: 78,
                CONNECT: 79,
                CONTACT_SYNCED: 90,
                GROUP_CALL_REQUEST: 91,
                LEAVE_CALL: 92,
                ADD_CALL_PARTICIPANT: 93,
                CALL_PARTICIPANT_JOINED: 94,
                REMOVE_CALL_PARTICIPANT: 95,
                TERMINATE_CALL: 96,
                MUTE_CALL_PARTICIPANT: 97,
                UNMUTE_CALL_PARTICIPANT: 98,
                CANCEL_GROUP_CALL: 99,
                LOGOUT: 100,
                LOCATION_PING: 101,
                CLOSE_THREAD: 102,
                REMOVE_BOT_COMMANDS: 104,
                SEARCH: 105,
                CONTINUE_SEARCH: 106,
                REGISTER_ASSISTANT: 107,
                DEACTIVATE_ASSISTANT: 108,
                GET_ASSISTANTS: 109,
                ACTIVE_CALL_PARTICIPANTS: 110,
                CALL_SESSION_CREATED: 111,
                IS_BOT_NAME_AVAILABLE: 112,
                TURN_ON_VIDEO_CALL: 113,
                TURN_OFF_VIDEO_CALL: 114,
                ASSISTANT_HISTORY: 115,
                BLOCK_ASSISTANT: 116,
                UNBLOCK_ASSISTANT: 117,
                BLOCKED_ASSISTANTS: 118,
                RECORD_CALL: 121,
                END_RECORD_CALL: 122,
                START_SCREEN_SHARE: 123,
                END_SCREEN_SHARE: 124,
                DELETE_FROM_CALL_HISTORY: 125,
                DESTINATED_RECORD_CALL: 126,
                GET_CALLS_TO_JOIN: 129,
                MUTUAL_GROUPS: 130,
                CREATE_TAG: 140,
                EDIT_TAG: 141,
                DELETE_TAG: 142,
                ADD_TAG_PARTICIPANT: 143,
                REMOVE_TAG_PARTICIPANT: 144,
                GET_TAG_LIST: 145,
                DELETE_MESSAGE_THREAD: 151,
                EXPORT_CHAT: 152,
                ADD_CONTACTS: 200,
                ERROR: 999
            },
            inviteeVOidTypes = {
                TO_BE_USER_SSO_ID: 1,
                TO_BE_USER_CONTACT_ID: 2,
                TO_BE_USER_CELLPHONE_NUMBER: 3,
                TO_BE_USER_USERNAME: 4,
                TO_BE_USER_ID: 5,
                TO_BE_CORE_USER_ID: 6
            },
            createThreadTypes = {
                NORMAL: 0x0,
                OWNER_GROUP: 0x1,
                PUBLIC_GROUP: 0x2,
                CHANNEL_GROUP: 0x4,
                CHANNEL: 0x8,
                NOTIFICATION_CHANNEL: 0x10,
                PUBLIC_THREAD: 0x20,
                PUBLIC_CHANNEL: 0x40,
                SELF: 0x80
            },
            chatMessageTypes = {
                TEXT: '1',
                VOICE: '2',
                PICTURE: '3',
                VIDEO: '4',
                SOUND: '5',
                FILE: '6',
                POD_SPACE_PICTURE: '7',
                POD_SPACE_VIDEO: '8',
                POD_SPACE_SOUND: '9',
                POD_SPACE_VOICE: '10',
                POD_SPACE_FILE: '11',
                LINK: '12',
                END_CALL: '13',
                START_CALL: '14',
                STICKER: '15'
            },
            assistantActionTypes = {
                REGISTER: 1,
                ACTIVATE: 2,
                DEACTIVATE: 3,
                BLOCK: 4
            },
            systemMessageTypes = {
                IS_TYPING: '1',
                RECORD_VOICE: '2',
                UPLOAD_PICTURE: '3',
                UPLOAD_VIDEO: '4',
                UPLOAD_SOUND: '5',
                UPLOAD_FILE: '6'
            },
            locationPingTypes = {
                'CHAT': 1,
                'THREAD': 2,
                'CONTACTS': 3
            },
            callRequestController = {
                callRequestReceived: false,
                callEstablishedInMySide: false,
                iCanAcceptTheCall: function () {
                    if(callRequestController.callRequestReceived && callRequestController.callEstablishedInMySide) {
                        return true;
                    }
                    return false;
                }
            },
            systemMessageIntervalPitch = params.systemMessageIntervalPitch || 1000,
            isTypingInterval,
            protocol = params.protocol || 'websocket',
            queueHost = params.queueHost,
            queuePort = params.queuePort,
            queueUsername = params.queueUsername,
            queuePassword = params.queuePassword,
            queueReceive = params.queueReceive,
            queueSend = params.queueSend,
            queueConnectionTimeout = params.queueConnectionTimeout,
            socketAddress = params.socketAddress,
            serverName = params.serverName || '',
            wsConnectionWaitTime = params.wsConnectionWaitTime,
            connectionRetryInterval = params.connectionRetryInterval,
            msgPriority = params.msgPriority || 1,
            messageTtl = params.messageTtl || 10000,
            reconnectOnClose = params.reconnectOnClose,
            asyncLogging = params.asyncLogging,
            chatPingMessageInterval = 20000,
            getUserInfoTimeout,
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
                PODSPACE_UPLOAD_FILE_TO_USERGROUP: '/userGroup/uploadFile', //TODO: to be removed
                PODSPACE_UPLOAD_FILE_TO_USERGROUP_NEW: '/api/usergroups/{userGroupHash}/files',
                PODSPACE_UPLOAD_IMAGE_TO_USERGROUP: '/userGroup/uploadImage', //TODO: to be removed
                PODSPACE_UPLOAD_IMAGE_TO_USERGROUP_NEW: '/api/usergroups/{userGroupHash}/images',
                //PODSPACE_UPLOAD_FILE: '/nzh/drive/uploadFile',
                //PODSPACE_UPLOAD_FILE_FROM_URL: '/nzh/drive/uploadFileFromUrl',
                //TODO: maybe deprecated
                PODSPACE_UPLOAD_IMAGE: '/nzh/drive/uploadImage', //TODO: to be removed
                PODSPACE_UPLOAD_IMAGE_NEW: '/api/images',
                PODSPACE_UPLOAD_FILE_NEW: '/api/files',
                PODSPACE_DOWNLOAD_FILE: '/nzh/drive/downloadFile', //TODO: to be removed
                PODSPACE_DOWNLOAD_FILE_NEW: '/api/files/{fileHash}',
                PODSPACE_DOWNLOAD_IMAGE: '/nzh/drive/downloadImage', //TODO: to be removed
                PODSPACE_DOWNLOAD_IMAGE_NEW: '/api/images/{fileHash}',

                // Neshan Map
                REVERSE: '/reverse',
                SEARCH: '/search',
                ROUTING: '/routing',
                STATIC_IMAGE: '/static'
            },
            imageMimeTypes = [
                'image/bmp',
                'image/png',
                'image/tiff',
                'image/x-icon',
                'image/jpeg',
                'image/webp'
            ],
            imageExtentions = [
                'bmp',
                'png',
                'tiff',
                'tiff2',
                'ico',
                'jpg',
                'jpeg',
                'webp'
            ],
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
            connectionCheckTimeout = params.connectionCheckTimeout,
            connectionCheckTimeoutThreshold = params.connectionCheckTimeoutThreshold,
            httpRequestTimeout = (params.httpRequestTimeout >= 0) ? params.httpRequestTimeout : 0,
            asyncRequestTimeout = (typeof params.asyncRequestTimeout === 'number' && params.asyncRequestTimeout >= 0) ? params.asyncRequestTimeout : 0,
            //callRequestTimeout = (typeof params.callRequestTimeout === 'number' && params.callRequestTimeout >= 0) ? params.callRequestTimeout : 10000,
            httpUploadRequestTimeout = (params.httpUploadRequestTimeout >= 0) ? params.httpUploadRequestTimeout : 0,
            actualTimingLog = (params.asyncLogging.actualTiming && typeof params.asyncLogging.actualTiming === 'boolean')
                ? params.asyncLogging.actualTiming
                : false,
            consoleLogging = (params.asyncLogging.consoleLogging && typeof params.asyncLogging.consoleLogging === 'boolean')
                ? params.asyncLogging.consoleLogging
                : false,
            minIntegerValue = Number.MAX_SAFE_INTEGER * -1,
            maxIntegerValue = Number.MAX_SAFE_INTEGER,
            chatSendQueue = [],
            chatWaitQueue = [],
            chatUploadQueue = [],
            fullResponseObject = params.fullResponseObject || false;

        if(!consoleLogging) {
            /**
             * Disable kurento-utils logs
             */
            window.Logger = {
                error(){},
                log(){},
                debug(){},
            };
        }

        var chatEvents = new ChatEvents(Object.assign(params, {
                Sentry: Sentry,
                Utility: Utility,
                consoleLogging: consoleLogging,
            })),
            chatMessaging = new ChatMessaging(Object.assign(params, {
                asyncClient: asyncClient,
                Sentry: Sentry,
                Utility: Utility,
                consoleLogging: consoleLogging,
                generalTypeCode: generalTypeCode,
                chatMessageVOTypes: chatMessageVOTypes,
                chatPingMessageInterval: chatPingMessageInterval,
                asyncRequestTimeout: asyncRequestTimeout,
                serverName: serverName,
                messageTtl: messageTtl,
                msgPriority: msgPriority
            })),
            callModule = new ChatCall(Object.assign(params, {
                Sentry: Sentry,
                Utility: Utility,
                consoleLogging: consoleLogging,
                chatEvents: chatEvents,
                asyncClient: asyncClient,
                chatMessaging: chatMessaging
            }));
        /*******************************************************
         *            P R I V A T E   M E T H O D S            *
         *******************************************************/


        var init = function () {
                /**
                 * Initialize Cache Databases
                 */
                startCacheDatabases(function () {
                    if (grantDeviceIdFromSSO) {
                        var getDeviceIdWithTokenTime = new Date().getTime();
                        getDeviceIdWithToken(function (retrievedDeviceId) {
                            if (actualTimingLog) {
                                Utility.chatStepLogger('Get Device ID ', new Date().getTime() - getDeviceIdWithTokenTime);
                            }

                            deviceId = retrievedDeviceId;

                            initAsync();
                        });
                    } else {
                        initAsync();
                    }
                });
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
            initAsync = function () {
                var asyncGetReadyTime = new Date().getTime();

                asyncClient = new Async({
                    protocol: protocol,
                    queueHost: queueHost,
                    queuePort: queuePort,
                    queueUsername: queueUsername,
                    queuePassword: queuePassword,
                    queueReceive: queueReceive,
                    queueSend: queueSend,
                    queueConnectionTimeout: queueConnectionTimeout,
                    socketAddress: socketAddress,
                    serverName: serverName,
                    deviceId: deviceId,
                    wsConnectionWaitTime: wsConnectionWaitTime,
                    connectionRetryInterval: connectionRetryInterval,
                    connectionCheckTimeout: connectionCheckTimeout,
                    connectionCheckTimeoutThreshold: connectionCheckTimeoutThreshold,
                    messageTtl: messageTtl,
                    reconnectOnClose: reconnectOnClose,
                    asyncLogging: asyncLogging,
                    logLevel: (consoleLogging ? 3 : 1)
                });
                callModule.asyncInitialized(asyncClient);
                chatMessaging.asyncInitialized(asyncClient);

                asyncClient.on('asyncReady', function () {
                    if (actualTimingLog) {
                        Utility.chatStepLogger('Async Connection ', new Date().getTime() - asyncGetReadyTime);
                    }

                    peerId = asyncClient.getPeerId();

                    if (!chatMessaging.userInfo) {
                        var getUserInfoTime = new Date().getTime();

                        getUserInfo(function (userInfoResult) {
                            if (actualTimingLog) {
                                Utility.chatStepLogger('Get User Info ', new Date().getTime() - getUserInfoTime);
                            }
                            if (!userInfoResult.hasError) {
                                chatMessaging.userInfo = userInfoResult.result.user;

                                !!Sentry && Sentry.setUser(chatMessaging.userInfo);

                                getAllThreads({
                                    summary: true,
                                    cache: false
                                });

                                /**
                                 * Check if user has KeyId stored in their cache or not?
                                 */
                                if (canUseCache) {
                                    if (db) {
                                        db.users
                                            .where('id')
                                            .equals(parseInt(chatMessaging.userInfo.id))
                                            .toArray()
                                            .then(function (users) {
                                                if (users.length > 0 && typeof users[0].keyId != 'undefined') {
                                                    var user = users[0];

                                                    getEncryptionKey({
                                                        keyId: user.keyId
                                                    }, function (result) {
                                                        if (!result.hasError) {
                                                            cacheSecret = result.secretKey;

                                                            chatMessaging.chatState = true;
                                                            chatEvents.fireEvent('chatReady');
                                                            chatSendQueueHandler();
                                                        } else {
                                                            if (result.message !== '') {
                                                                try {
                                                                    var response = JSON.parse(result.message);
                                                                    if (response.error === 'invalid_param') {
                                                                        generateEncryptionKey({
                                                                            keyAlgorithm: 'AES',
                                                                            keySize: 256
                                                                        }, function () {
                                                                            chatMessaging.chatState = true;
                                                                            chatEvents.fireEvent('chatReady');
                                                                            chatSendQueueHandler();
                                                                        });
                                                                    }
                                                                } catch (e) {
                                                                    consoleLogging && console.log(e);
                                                                }
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    generateEncryptionKey({
                                                        keyAlgorithm: 'AES',
                                                        keySize: 256
                                                    }, function () {
                                                        chatMessaging.chatState = true;
                                                        chatEvents.fireEvent('chatReady');
                                                        chatSendQueueHandler();
                                                    });
                                                }
                                            })
                                            .catch(function (error) {
                                                chatEvents.fireEvent('error', {
                                                    code: error.errorCode,
                                                    message: error.errorMessage,
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
                                } else {
                                    chatMessaging.chatState = true;
                                    chatEvents.fireEvent('chatReady');
                                    chatSendQueueHandler();
                                }
                            }
                        });
                    } else if (chatMessaging.userInfo.id > 0) {
                        chatMessaging.chatState = true;
                        chatEvents.fireEvent('chatReady');
                        chatSendQueueHandler();
                    }

                    deliveryInterval && clearInterval(deliveryInterval);

                    deliveryInterval = setInterval(function () {
                        if (Object.keys(messagesDelivery).length) {
                            messagesDeliveryQueueHandler();
                        }
                    }, deliveryIntervalPitch);

                    seenInterval && clearInterval(seenInterval);

                    seenInterval = setInterval(function () {
                        if (Object.keys(messagesSeen).length) {
                            messagesSeenQueueHandler();
                        }
                    }, seenIntervalPitch);

                    //shouldReconnectCall();
                });

                asyncClient.on('stateChange', function (state) {
                    chatEvents.fireEvent('chatState', state);
                    chatFullStateObject = state;

                    switch (state.socketState) {
                        case 1: // CONNECTED
                            if (state.deviceRegister && state.serverRegister) {
                                chatMessaging.chatState = true;
                                chatMessaging.ping();
                            }
                            break;
                        case 0: // CONNECTING
                        case 2: // CLOSING
                        case 3: // CLOSED
                            chatMessaging.chatState = false;

                            // TODO: Check if this is OK or not?!
                            chatMessaging.sendPingTimeout && clearTimeout(chatMessaging.sendPingTimeout);
                            break;
                    }
                });

                asyncClient.on('connect', function (newPeerId) {
                    asyncGetReadyTime = new Date().getTime();
                    peerId = newPeerId;
                    chatEvents.fireEvent('connect');
                    chatMessaging.ping();
                });

                asyncClient.on('disconnect', function (event) {
                    oldPeerId = peerId;
                    peerId = undefined;
                    chatEvents.fireEvent('disconnect', event);

                    chatEvents.fireEvent('callEvents', {
                        type: 'CALL_ERROR',
                        code: 7000,
                        message: 'Call Socket is closed!',
                        error: event
                    });
                });

                asyncClient.on('reconnect', function (newPeerId) {
                    peerId = newPeerId;
                    chatEvents.fireEvent('reconnect');
                });

                asyncClient.on('message', function (params, ack) {
                    receivedAsyncMessageHandler(params);
                    ack && ack();
                });

                asyncClient.on('error', function (error) {
                    chatEvents.fireEvent('error', {
                        code: error.errorCode,
                        message: error.errorMessage,
                        error: error.errorEvent
                    });
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
            getDeviceIdWithToken = function (callback) {
                var deviceId;

                var params = {
                    url: SERVICE_ADDRESSES.SSO_ADDRESS + SERVICES_PATH.SSO_DEVICES,
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token
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
                                chatEvents.fireEvent('error', {
                                    code: 6000,
                                    message: CHAT_ERRORS[6000],
                                    error: null
                                });
                            } else {
                                callback(deviceId);
                            }
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 6001,
                                message: CHAT_ERRORS[6001],
                                error: null
                            });
                        }
                    } else {
                        chatEvents.fireEvent('error', {
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
            generateEncryptionKey = function (params, callback) {
                var data = {
                    validity: 10 * 365 * 24 * 60 * 60, // 10 Years
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
                        'Authorization': 'Bearer ' + token
                    }
                };

                httpRequest(httpRequestParams, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = JSON.parse(result.result.responseText);
                        } catch (e) {
                            consoleLogging && console.log(e);
                        }

                        /**
                         * Save new Key Id in cache and update cacheSecret
                         */
                        if (canUseCache) {
                            if (db) {
                                db.users
                                    .update(chatMessaging.userInfo.id, {keyId: response.keyId})
                                    .then(function () {
                                        getEncryptionKey({
                                            keyId: response.keyId
                                        }, function (result) {
                                            if (!result.hasError) {
                                                cacheSecret = result.secretKey;
                                                callback && callback();
                                            }
                                        });
                                    })
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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
                    } else {
                        chatEvents.fireEvent('error', {
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
            getEncryptionKey = function (params, callback) {
                var keyId;

                if (params) {
                    if (typeof params.keyId !== 'undefined') {
                        keyId = params.keyId;

                        var httpRequestParams = {
                            url: SERVICE_ADDRESSES.SSO_ADDRESS + SERVICES_PATH.SSO_GET_KEY + keyId,
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        };

                        httpRequest(httpRequestParams, function (result) {
                            if (!result.hasError) {
                                try {
                                    var response = JSON.parse(result.result.responseText);
                                } catch (e) {
                                    consoleLogging && console.log(e);
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

                                chatEvents.fireEvent('error', {
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
            httpRequest = function (params, callback) {
                var url = params.url,
                    xhrResponseType = params.responseType || 'text',
                    fileSize,
                    originalFileName,
                    threadId,
                    fileUniqueId,
                    fileObject,
                    data = params.data,
                    method = (typeof params.method == 'string')
                        ? params.method
                        : 'GET',
                    fileUploadUniqueId = (typeof params.uniqueId == 'string')
                        ? params.uniqueId
                        : 'uniqueId',
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

                if (data && typeof data === 'object' && (data.hasOwnProperty('image') || data.hasOwnProperty('file'))) {
                    httpRequestObject[eval('fileUploadUniqueId')].timeout = (settings && typeof parseInt(settings.uploadTimeout) > 0 && settings.uploadTimeout > 0)
                        ? settings.uploadTimeout
                        : httpUploadRequestTimeout;
                } else {
                    httpRequestObject[eval('fileUploadUniqueId')].timeout = (settings && typeof parseInt(settings.timeout) > 0 && settings.timeout > 0)
                        ? settings.timeout
                        : httpRequestTimeout;
                }

                httpRequestObject[eval('fileUploadUniqueId')]
                    .addEventListener('error', function (event) {
                        if (callback && method === 'POST') {
                            if (hasFile) {
                                hasError = true;
                                chatEvents.fireEvent('fileUploadEvents', {
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
                            if(callback) {
                                callback({
                                    hasError: true,
                                    errorCode: 6200,
                                    errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
                                });
                            }
                            if(params.enableDownloadProgressEvents) {
                                chatEvents.fireEvent('fileDownloadEvents', {
                                    hashCode: params.hashCode,
                                    state: 'DOWNLOAD_ERROR',
                                    errorCode: 6200,
                                    errorMessage: CHAT_ERRORS[6200] + ' (XMLHttpRequest Error Event Listener)'
                                });
                            }
                        }
                    }, false);

                if(params.enableDownloadProgressEvents) {
                    httpRequestObject[eval('fileUploadUniqueId')].onprogress = (event) => {
                        chatEvents.fireEvent('fileDownloadEvents', {
                            hashCode: params.hashCode,
                            state: 'DOWNLOADING',
                            progress: Math.round((event.loaded / event.total) * 100),
                        });
                    }
                }

                httpRequestObject[eval('fileUploadUniqueId')].addEventListener('abort',
                    function (event) {
                        if (callback) {
                            if (hasFile) {
                                hasError = true;
                                chatEvents.fireEvent('fileUploadEvents', {
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
                        if (typeof data === 'object' && data !== null) {
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

                        if (typeof params.headers === 'object') {
                            for (var key in params.headers) {
                                if (params.headers.hasOwnProperty(key))
                                    httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader(key, params.headers[key]);
                            }
                        }

                        httpRequestObject[eval('fileUploadUniqueId')].send();
                    }

                    if (method === 'POST' && data) {

                        httpRequestObject[eval('fileUploadUniqueId')].open(method, url, true);

                        if (typeof params.headers === 'object') {
                            for (var key in params.headers) {
                                if (params.headers.hasOwnProperty(key))
                                    httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader(key, params.headers[key]);
                            }
                        }

                        if (typeof data == 'object') {
                            if (data.hasOwnProperty('image') || data.hasOwnProperty('file')) {
                                hasFile = true;
                                var formData = new FormData();
                                for (var key in data) {
                                    if (data.hasOwnProperty(key))
                                        formData.append(key, data[key]);
                                }

                                fileSize = data.fileSize;
                                originalFileName = data.originalFileName;
                                threadId = data.threadId;
                                fileUniqueId = data.uniqueId;
                                fileObject = (data['image'])
                                    ? data['image']
                                    : data['file'];

                                httpRequestObject[eval('fileUploadUniqueId')].upload.onprogress = function (event) {
                                    if (event.lengthComputable && !hasError) {
                                        chatEvents.fireEvent('fileUploadEvents', {
                                            threadId: threadId,
                                            uniqueId: fileUniqueId,
                                            state: 'UPLOADING',
                                            progress: Math.round((event.loaded / event.total) * 100),
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
                                httpRequestObject[eval('fileUploadUniqueId')].setRequestHeader(
                                    'Content-Type',
                                    'application/x-www-form-urlencoded');

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
                                    consoleLogging && console.log(e)
                                }

                                chatEvents.fireEvent('fileUploadEvents', {
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
                                    responseText: (xhrResponseType === 'text') ? httpRequestObject[eval('fileUploadUniqueId')].responseText : '',
                                    responseHeaders: httpRequestObject[eval('fileUploadUniqueId')].getAllResponseHeaders(),
                                    responseContentType: httpRequestObject[eval('fileUploadUniqueId')].getResponseHeader('content-type')
                                }
                            });
                        } else {
                            if (hasFile) {
                                hasError = true;
                                chatEvents.fireEvent('fileUploadEvents', {
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
                                errorMessage: (xhrResponseType === 'text') ? httpRequestObject[eval('fileUploadUniqueId')].responseText : 'ُAn error accoured!',
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
                    getUserInfoTimeout && clearTimeout(getUserInfoTimeout);

                    getUserInfoRetryCount = 0;

                    chatEvents.fireEvent('error', {
                        code: 6101,
                        message: CHAT_ERRORS[6101],
                        error: null
                    });
                } else {
                    getUserInfoTimeout && clearTimeout(getUserInfoTimeout);

                    getUserInfoTimeout = setTimeout(function () {
                        getUserInfoRecursive(callback);
                    }, getUserInfoRetryCount * 10000);

                    return chatMessaging.sendMessage({
                        chatMessageVOType: chatMessageVOTypes.USER_INFO,
                        typeCode: generalTypeCode//params.typeCode
                    }, {
                        onResult: function (result) {
                            var returnData = {
                                hasError: result.hasError,
                                cache: false,
                                errorMessage: result.errorMessage,
                                errorCode: result.errorCode
                            };

                            if (!returnData.hasError) {
                                getUserInfoTimeout && clearTimeout(getUserInfoTimeout);

                                var messageContent = result.result;
                                var currentUser = formatDataToMakeUser(messageContent);

                                /**
                                 * Add current user into cache database #cache
                                 */
                                if (canUseCache) {
                                    if (db) {
                                        db.users
                                            .where('id')
                                            .equals(parseInt(currentUser.id))
                                            .toArray()
                                            .then(function (users) {
                                                if (users.length > 0 && users[0].id > 0) {
                                                    db.users
                                                        .update(currentUser.id, {
                                                            cellphoneNumber: currentUser.cellphoneNumber,
                                                            email: currentUser.email,
                                                            image: currentUser.image,
                                                            name: currentUser.name
                                                        })
                                                        .catch(function (error) {
                                                            chatEvents.fireEvent('error', {
                                                                code: error.code,
                                                                message: error.message,
                                                                error: error
                                                            });
                                                        });
                                                } else {
                                                    db.users.put(currentUser)
                                                        .catch(function (error) {
                                                            chatEvents.fireEvent('error', {
                                                                code: error.code,
                                                                message: error.message,
                                                                error: error
                                                            });
                                                        });
                                                }
                                            });
                                    } else {
                                        chatEvents.fireEvent('error', {
                                            code: 6601,
                                            message: CHAT_ERRORS[6601],
                                            error: null
                                        });
                                    }
                                }

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

            sendSystemMessage = function (params) {
                return chatMessaging.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.SYSTEM_MESSAGE,
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
            chatSendQueueHandler = function () {
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
                            deleteFromChatSentQueue(messageToBeSend,
                                function () {
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

            putInMessagesDeliveryQueue = function (threadId, messageId) {
                if (messagesDelivery.hasOwnProperty(threadId)
                    && typeof messagesDelivery[threadId] === 'number'
                    && !!messagesDelivery[threadId]) {
                    if (messagesDelivery[threadId] < messageId) {
                        messagesDelivery[threadId] = messageId;
                    }
                } else {
                    messagesDelivery[threadId] = messageId;
                }
            },

            putInMessagesSeenQueue = function (threadId, messageId) {
                if (messagesSeen.hasOwnProperty(threadId)
                    && typeof messagesSeen[threadId] === 'number'
                    && !!messagesSeen[threadId]) {
                    if (messagesSeen[threadId] < messageId) {
                        messagesSeen[threadId] = messageId;
                    }
                } else {
                    messagesSeen[threadId] = messageId;
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
            messagesDeliveryQueueHandler = function () {
                if (Object.keys(messagesDelivery).length) {
                    if (chatMessaging.chatState) {
                        for (var key in messagesDelivery) {
                            deliver({
                                messageId: messagesDelivery[key]
                            });

                            delete messagesDelivery[key];
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
            messagesSeenQueueHandler = function () {
                if (Object.keys(messagesSeen).length) {
                    if (chatMessaging.chatState) {
                        for (var key in messagesSeen) {
                            seen({
                                messageId: messagesSeen[key]
                            });

                            delete messagesSeen[key];
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
            clearChatServerCaches = function () {
                chatMessaging.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.LOGOUT,
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
            receivedAsyncMessageHandler = function (asyncMessage) {
                /**
                 * + Message Received From Async      {object}
                 *    - id                            {int}
                 *    - senderMessageId               {int}
                 *    - senderName                    {string}
                 *    - senderId                      {int}
                 *    - type                          {int}
                 *    - content                       {string}
                 */

                if (asyncMessage.senderName === serverName) {
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
            chatMessageHandler = function (chatMessage) {
                if(chatMessage.typeCode && chatMessage.typeCode !== generalTypeCode) {
                    return;
                }

                var threadId = chatMessage.subjectId,
                    type = chatMessage.type,
                    messageContent = (typeof chatMessage.content === 'string' && Utility.isValidJson(chatMessage.content))
                        ? JSON.parse(chatMessage.content)
                        : chatMessage.content,
                    contentCount = chatMessage.contentCount,
                    uniqueId = chatMessage.uniqueId,
                    time = chatMessage.time;

                chatMessaging.asyncRequestTimeouts[uniqueId] && clearTimeout(chatMessaging.asyncRequestTimeouts[uniqueId]);

                switch (type) {
                    /**
                     * Type 1    Get Threads
                     */
                    case chatMessageVOTypes.CREATE_THREAD:
                        messageContent.uniqueId = uniqueId;

                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            createThread(messageContent, true, true);
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        } else {
                            createThread(messageContent, true, false);
                        }

                        break;

                    /**
                     * Type 2    Message
                     */
                    case chatMessageVOTypes.MESSAGE:
                        newMessageHandler(threadId, messageContent);
                        break;

                    /**
                     * Type 3    Message Sent
                     */
                    case chatMessageVOTypes.SENT:
                        if (chatMessaging.sendMessageCallbacks[uniqueId] && chatMessaging.sendMessageCallbacks[uniqueId].onSent) {
                            chatMessaging.sendMessageCallbacks[uniqueId].onSent({
                                uniqueId: uniqueId,
                                messageId: messageContent
                            });
                            delete (chatMessaging.sendMessageCallbacks[uniqueId].onSent);
                            chatMessaging.threadCallbacks[threadId][uniqueId].onSent = true;
                        }
                        break;

                    /**
                     * Type 4    Message Delivery
                     */
                    case chatMessageVOTypes.DELIVERY:
                        var threadObject = {
                            id: messageContent.conversationId,
                            lastSeenMessageId: messageContent.messageId,
                            lastSeenMessageTime: messageContent.messageTime,
                            lastParticipantId: messageContent.participantId
                        };

                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_LAST_ACTIVITY_TIME',
                            result: {
                                thread: threadObject
                            }
                        });

                        // if (fullResponseObject) {
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

                        sendMessageCallbacksHandler(chatMessageVOTypes.DELIVERY, threadId, uniqueId);
                        break;

                    /**
                     * Type 5    Message Seen
                     */
                    case chatMessageVOTypes.SEEN:
                        var threadObject = {
                            id: messageContent.conversationId,
                            lastSeenMessageId: messageContent.messageId,
                            lastSeenMessageTime: messageContent.messageTime,
                            lastParticipantId: messageContent.participantId
                        };

                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_LAST_ACTIVITY_TIME',
                            result: {
                                thread: threadObject
                            }
                        });

                        chatEvents.fireEvent('messageEvents', {
                            type: 'MESSAGE_SEEN',
                            result: {
                                message: messageContent.messageId,
                                threadId: threadId,
                                senderId: messageContent.participantId
                            }
                        });

                        sendMessageCallbacksHandler(chatMessageVOTypes.SEEN, threadId, uniqueId);
                        break;

                    /**
                     * Type 6    Chat Ping
                     */
                    case chatMessageVOTypes.PING:
                        break;

                    /**
                     * Type 7    Block Contact
                     */
                    case chatMessageVOTypes.BLOCK:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        break;

                    /**
                     * Type 8    Unblock Blocked User
                     */
                    case chatMessageVOTypes.UNBLOCK:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        break;

                    /**
                     * Type 9   Leave Thread
                     */
                    case chatMessageVOTypes.LEAVE_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        /**
                         * Remove the participant from cache
                         */
                        if (canUseCache) {
                            if (db) {
                                /**
                                 * Remove the participant from participants
                                 * table
                                 */
                                db.participants.where('threadId')
                                    .equals(parseInt(threadId))
                                    .and(function (participant) {
                                        return (participant.id === messageContent.id || participant.owner === chatMessaging.userInfo.id);
                                    })
                                    .delete()
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    });

                                /**
                                 * If this is the user who is leaving the thread
                                 * we should delete the thread and messages of
                                 * thread from this users cache database
                                 */

                                if (messageContent.id === chatMessaging.userInfo.id) {

                                    /**
                                     * Remove Thread from this users cache
                                     */
                                    db.threads.where('[owner+id]')
                                        .equals([chatMessaging.userInfo.id, threadId])
                                        .delete()
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        });

                                    /**
                                     * Remove all messages of the thread which
                                     * this user left
                                     */
                                    db.messages.where('threadId')
                                        .equals(parseInt(threadId))
                                        .and(function (message) {
                                            return message.owner === chatMessaging.userInfo.id;
                                        })
                                        .delete()
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        });
                                }
                            } else {
                                chatEvents.fireEvent('error', {
                                    code: 6601,
                                    message: CHAT_ERRORS[6601],
                                    error: null
                                });
                            }
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                if (!threadsResult.cache) {
                                    var threads = threadsResult.result.threads;
                                    if (threads.length > 0) {
                                        chatEvents.fireEvent('threadEvents', {
                                            type: 'THREAD_LEAVE_PARTICIPANT',
                                            result: {
                                                thread: threads[0],
                                                participant: formatDataToMakeParticipant(messageContent, threadId)
                                            }
                                        });

                                        chatEvents.fireEvent('threadEvents', {
                                            type: 'THREAD_LAST_ACTIVITY_TIME',
                                            result: {
                                                thread: threads[0]
                                            }
                                        });
                                    } else {
                                        chatEvents.fireEvent('threadEvents', {
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
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_LEAVE_PARTICIPANT',
                                result: {
                                    thread: threadId,
                                    participant: formatDataToMakeParticipant(messageContent, threadId)
                                }
                            });

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.ADD_PARTICIPANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        /**
                         * Add participants into cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < messageContent.participants.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();

                                        tempData.id = messageContent.participants[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.threadId = messageContent.id;
                                        tempData.notSeenDuration = messageContent.participants[i].notSeenDuration;
                                        tempData.admin = messageContent.participants[i].admin;
                                        tempData.auditor = messageContent.participants[i].auditor;
                                        tempData.name = Utility.crypt(messageContent.participants[i].name, cacheSecret, salt);
                                        tempData.contactName = Utility.crypt(messageContent.participants[i].contactName, cacheSecret, salt);
                                        tempData.email = Utility.crypt(messageContent.participants[i].email, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(messageContent.participants[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.participants.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_ADD_PARTICIPANTS',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });

                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_LAST_ACTIVITY_TIME',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });
                                }
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_ADD_PARTICIPANTS',
                                result: {
                                    thread: messageContent
                                }
                            });

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.GET_CONTACTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 14    Get Threads List
                     */
                    case chatMessageVOTypes.GET_THREADS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                        }
                        break;

                    /**
                     * Type 15    Get Message History of an Thread
                     */
                    case chatMessageVOTypes.GET_HISTORY:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 17    Remove sb from thread
                     */
                    case chatMessageVOTypes.REMOVED_FROM_THREAD:

                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_REMOVED_FROM',
                            result: {
                                thread: threadId
                            }
                        });

                        /**
                         * This user has been removed from a thread
                         * So we should delete thread, its participants
                         * and it's messages from this users cache
                         */
                        if (canUseCache) {
                            if (db) {
                                /**
                                 * Remove Thread from this users cache
                                 */
                                db.threads.where('[owner+id]')
                                    .equals([chatMessaging.userInfo.id, threadId])
                                    .delete()
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    });

                                /**
                                 * Remove all messages of the thread which this
                                 * user left
                                 */
                                db.messages.where('threadId')
                                    .equals(parseInt(threadId))
                                    .and(function (message) {
                                        return message.owner === chatMessaging.userInfo.id;
                                    })
                                    .delete()
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    });

                                /**
                                 * Remove all participants of the thread which
                                 * this user left
                                 */
                                db.participants.where('threadId')
                                    .equals(parseInt(threadId))
                                    .and(function (participant) {
                                        return participant.owner === chatMessaging.userInfo.id;
                                    })
                                    .delete()
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                        break;

                    /**
                     * Type 18    Remove a participant from Thread
                     */
                    case chatMessageVOTypes.REMOVE_PARTICIPANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        /**
                         * Remove the participant from cache
                         */
                        if (canUseCache) {
                            if (db) {
                                for (var i = 0; i < messageContent.length; i++) {
                                    db.participants.where('id')
                                        .equals(parseInt(messageContent[i].id))
                                        .and(function (participants) {
                                            return participants.threadId === threadId;
                                        })
                                        .delete()
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        });
                                }
                            } else {
                                chatEvents.fireEvent('error', {
                                    code: 6601,
                                    message: CHAT_ERRORS[6601],
                                    error: null
                                });
                            }
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_REMOVE_PARTICIPANTS',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });

                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_LAST_ACTIVITY_TIME',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });
                                }
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_REMOVE_PARTICIPANTS',
                                result: {
                                    thread: threadId
                                }
                            });

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.MUTE_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var thread = threadsResult.result.threads[0];
                                thread.mute = true;

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_MUTE',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.UNMUTE_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var thread = threadsResult.result.threads[0];
                                thread.mute = false;

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_UNMUTE',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.UPDATE_THREAD_INFO:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id],
                                cache: false
                            }, function (threadsResult) {
                                var thread = formatDataToMakeConversation(threadsResult.result.threads[0]);

                                /**
                                 * Add Updated Thread into cache database #cache
                                 */
                                if (canUseCache && cacheSecret.length > 0) {
                                    if (db) {
                                        var tempData = {};

                                        try {
                                            var salt = Utility.generateUUID();

                                            tempData.id = thread.id;
                                            tempData.owner = chatMessaging.userInfo.id;
                                            tempData.title = Utility.crypt(thread.title, cacheSecret, salt);
                                            tempData.time = thread.time;
                                            tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(thread)), cacheSecret, salt);
                                            tempData.salt = salt;
                                        } catch (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        }

                                        db.threads.put(tempData)
                                            .catch(function (error) {
                                                chatEvents.fireEvent('error', {
                                                    code: error.code,
                                                    message: error.message,
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

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_INFO_UPDATED',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.FORWARD_MESSAGE:
                        newMessageHandler(threadId, messageContent);
                        break;

                    /**
                     * Type 23    User Info
                     */
                    case chatMessageVOTypes.USER_INFO:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('systemEvents', {
                            type: 'SERVER_TIME',
                            result: {
                                time: time
                            }
                        });

                        break;

                    /**
                     * Type 25    Get Blocked List
                     */
                    case chatMessageVOTypes.GET_BLOCKED:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 27    Thread Participants List
                     */
                    case chatMessageVOTypes.THREAD_PARTICIPANTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 28    Edit Message
                     */
                    case chatMessageVOTypes.EDIT_MESSAGE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        chatEditMessageHandler(threadId, messageContent);
                        break;

                    /**
                     * Type 29    Delete Message
                     */
                    case chatMessageVOTypes.DELETE_MESSAGE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        if (messageContent.pinned) {
                            unPinMessage({
                                messageId: messageContent.id,
                                notifyAll: true
                            });
                        }
                        /**
                         * Remove Message from cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                db.messages.where('id')
                                    .equals(messageContent)
                                    .and(function (message) {
                                        return message.owner === chatMessaging.userInfo.id;
                                    })
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

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;
                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('messageEvents', {
                                        type: 'MESSAGE_DELETE',
                                        result: {
                                            message: {
                                                id: messageContent.id,
                                                pinned: messageContent.pinned,
                                                threadId: threadId
                                            }
                                        }
                                    });
                                    if (messageContent.pinned) {
                                        chatEvents.fireEvent('threadEvents', {
                                            type: 'THREAD_LAST_ACTIVITY_TIME',
                                            result: {
                                                thread: threads[0]
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            chatEvents.fireEvent('messageEvents', {
                                type: 'MESSAGE_DELETE',
                                result: {
                                    message: {
                                        id: messageContent.id,
                                        pinned: messageContent.pinned,
                                        threadId: threadId
                                    }
                                }
                            });
                            if (messageContent.pinned) {
                                chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.THREAD_INFO_UPDATED:
                        // TODO: Check this line again
                        // if (!messageContent.conversation && !messageContent.conversation.id) {
                        //     messageContent.conversation.id = threadId;
                        // }
                        //
                        // var thread = formatDataToMakeConversation(messageContent.conversation);
                        var thread = formatDataToMakeConversation(messageContent);

                        /**
                         * Add Updated Thread into cache database #cache
                         */
                        // if (canUseCache && cacheSecret.length > 0) {
                        //     if (db) {
                        //         var tempData = {};
                        //
                        //         try {
                        //             var salt = Utility.generateUUID();
                        //
                        //             tempData.id = thread.id;
                        //             tempData.owner = chatMessaging.userInfo.id;
                        //             tempData.title = Utility.crypt(thread.title, cacheSecret, salt);
                        //             tempData.time = thread.time;
                        //             tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(thread)), cacheSecret, salt);
                        //             tempData.salt = salt;
                        //         }
                        //         catch (error) {
                        //             chatEvents.fireEvent('error', {
                        //                 code: error.code,
                        //                 message: error.message,
                        //                 error: error
                        //             });
                        //         }
                        //
                        //         db.threads.put(tempData)
                        //             .catch(function (error) {
                        //                 chatEvents.fireEvent('error', {
                        //                     code: error.code,
                        //                     message: error.message,
                        //                     error: error
                        //                 });
                        //             });
                        //     }
                        //     else {
                        //         chatEvents.fireEvent('error', {
                        //             code: 6601,
                        //             message: CHAT_ERRORS[6601],
                        //             error: null
                        //         });
                        //     }
                        // }
                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_INFO_UPDATED',
                            result: {
                                thread: thread
                            }
                        });
                        break;

                    /**
                     * Type 31    Thread Last Seen Updated
                     */
                    case chatMessageVOTypes.LAST_SEEN_UPDATED:
                        var threadObject = messageContent;
                        threadObject.unreadCount = (messageContent.unreadCount) ? messageContent.unreadCount : 0;

                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_UNREAD_COUNT_UPDATED',
                            result: {
                                thread: threadObject,
                                unreadCount: (messageContent.unreadCount) ? messageContent.unreadCount : 0
                            }
                        });

                        // if (fullResponseObject) {
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
                    case chatMessageVOTypes.GET_MESSAGE_DELEVERY_PARTICIPANTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 33    Get Message Seen List
                     */
                    case chatMessageVOTypes.GET_MESSAGE_SEEN_PARTICIPANTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 34    Is Public Group Name Available?
                     */
                    case chatMessageVOTypes.IS_NAME_AVAILABLE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 39    Join Public Group or Channel
                     */
                    case chatMessageVOTypes.JOIN_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 40    Bot Messages
                     */
                    case chatMessageVOTypes.BOT_MESSAGE:
                        chatEvents.fireEvent('botEvents', {
                            type: 'BOT_MESSAGE',
                            result: {
                                bot: messageContent
                            }
                        });
                        break;

                    /**
                     * Type 41    Spam P2P Thread
                     */
                    case chatMessageVOTypes.SPAM_PV_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        break;

                    /**
                     * Type 42    Set Role To User
                     */
                    case chatMessageVOTypes.SET_ROLE_TO_USER:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_ADD_ADMIN',
                                        result: {
                                            thread: threads[0],
                                            admin: messageContent
                                        }
                                    });

                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_LAST_ACTIVITY_TIME',
                                        result: {
                                            thread: threads[0],
                                            admin: messageContent
                                        }
                                    });
                                }
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_ADD_ADMIN',
                                result: {
                                    thread: threadId,
                                    admin: messageContent
                                }
                            });

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.REMOVE_ROLE_FROM_USER:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_REMOVE_ADMIN',
                                        result: {
                                            thread: threads[0],
                                            admin: messageContent
                                        }
                                    });

                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_LAST_ACTIVITY_TIME',
                                        result: {
                                            thread: threads[0],
                                            admin: messageContent
                                        }
                                    });
                                }
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_REMOVE_ADMIN',
                                result: {
                                    thread: threadId,
                                    admin: messageContent
                                }
                            });

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.CLEAR_HISTORY:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        break;

                    /**
                     * Type 46    System Messages
                     */
                    case chatMessageVOTypes.SYSTEM_MESSAGE:
                        chatEvents.fireEvent('systemEvents', {
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
                    case chatMessageVOTypes.GET_NOT_SEEN_DURATION:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        break;

                    /**
                     * Type 48    Pin Thread
                     */
                    case chatMessageVOTypes.PIN_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var thread = threadsResult.result.threads[0];

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_PIN',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.UNPIN_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var thread = threadsResult.result.threads[0];

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_UNPIN',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.PIN_MESSAGE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.UNPIN_MESSAGE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.UPDATE_CHAT_PROFILE:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        chatEvents.fireEvent('userEvents', {
                            type: 'CHAT_PROFILE_UPDATED',
                            result: {
                                user: messageContent
                            }
                        });
                        break;

                    /**
                     * Type 53    Change Thread Privacy
                     */
                    case chatMessageVOTypes.CHANGE_THREAD_PRIVACY:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'THREAD_PRIVACY_CHANGED',
                            result: {
                                thread: messageContent
                            }
                        });

                        break;

                    /**
                     * Type 54    Get Participant Roles
                     */
                    case chatMessageVOTypes.GET_PARTICIPANT_ROLES:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }
                        chatEvents.fireEvent('userEvents', {
                            type: 'GET_PARTICIPANT_ROLES',
                            result: {
                                roles: messageContent
                            }
                        });
                        break;

                    /**
                     * Type 60    Get Contact Not Seen Duration
                     */
                    case chatMessageVOTypes.GET_CONTACT_NOT_SEEN_DURATION:
                        chatEvents.fireEvent('contactEvents', {
                            type: 'CONTACTS_LAST_SEEN',
                            result: messageContent
                        });
                        break;

                    /**
                     * Type 61      Get All Unread Message Count
                     */
                    case chatMessageVOTypes.ALL_UNREAD_MESSAGE_COUNT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('systemEvents', {
                            type: 'ALL_UNREAD_MESSAGES_COUNT',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 62    Create Bot
                     */
                    case chatMessageVOTypes.CREATE_BOT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 63    Define Bot Commands
                     */
                    case chatMessageVOTypes.DEFINE_BOT_COMMAND:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 64    Start Bot
                     */
                    case chatMessageVOTypes.START_BOT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 65    Stop Bot
                     */
                    case chatMessageVOTypes.STOP_BOT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 66    Last Message Deleted
                     */
                    case chatMessageVOTypes.LAST_MESSAGE_DELETED:
                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_INFO_UPDATED',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });
                                }
                            });
                        } else {
                            var thread = formatDataToMakeConversation(messageContent);

                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREAD_INFO_UPDATED',
                                result: {
                                    thread: thread
                                }
                            });
                        }
                        break;

                    /**
                     * Type 67    Last Message Edited
                     */
                    case chatMessageVOTypes.LAST_MESSAGE_EDITED:
                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [messageContent.id]
                            }, function (threadsResult) {
                                var threads = threadsResult.result.threads;

                                if (!threadsResult.cache) {
                                    chatEvents.fireEvent('threadEvents', {
                                        type: 'THREAD_INFO_UPDATED',
                                        result: {
                                            thread: threads[0]
                                        }
                                    });
                                }
                            });
                        } else {
                            var thread = formatDataToMakeConversation(messageContent);

                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.BOT_COMMANDS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 69    Get Thread All Bots
                     */
                    case chatMessageVOTypes.THREAD_ALL_BOTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 70    Send Call Request
                     */
                    case chatMessageVOTypes.CALL_REQUEST:
                    case chatMessageVOTypes.ACCEPT_CALL:
                    case chatMessageVOTypes.REJECT_CALL:
                    case chatMessageVOTypes.RECEIVE_CALL_REQUEST:
                    case chatMessageVOTypes.START_CALL:
                    case chatMessageVOTypes.END_CALL_REQUEST:
                    case chatMessageVOTypes.END_CALL:
                    case chatMessageVOTypes.GET_CALLS:
                    case chatMessageVOTypes.RECONNECT:
                    case chatMessageVOTypes.CONNECT:
                    case chatMessageVOTypes.GROUP_CALL_REQUEST:
                    case chatMessageVOTypes.LEAVE_CALL:
                    case chatMessageVOTypes.ADD_CALL_PARTICIPANT:
                    case chatMessageVOTypes.CALL_PARTICIPANT_JOINED:
                    case chatMessageVOTypes.REMOVE_CALL_PARTICIPANT:
                    case chatMessageVOTypes.TERMINATE_CALL:
                    case chatMessageVOTypes.MUTE_CALL_PARTICIPANT:
                    case chatMessageVOTypes.UNMUTE_CALL_PARTICIPANT:
                    case chatMessageVOTypes.RECORD_CALL:
                    case chatMessageVOTypes.END_RECORD_CALL:
                    case chatMessageVOTypes.START_SCREEN_SHARE:
                    case chatMessageVOTypes.END_SCREEN_SHARE:
                    case chatMessageVOTypes.DELETE_FROM_CALL_HISTORY:
                    case chatMessageVOTypes.TURN_ON_VIDEO_CALL:
                    case chatMessageVOTypes.TURN_OFF_VIDEO_CALL:
                    case chatMessageVOTypes.ACTIVE_CALL_PARTICIPANTS:
                    case chatMessageVOTypes.CALL_SESSION_CREATED:
                    case chatMessageVOTypes.CANCEL_GROUP_CALL:
                    case chatMessageVOTypes.DESTINATED_RECORD_CALL:
                    case chatMessageVOTypes.GET_CALLS_TO_JOIN:
                        callModule.handleChatMessages(type, chatMessageVOTypes, messageContent, contentCount, threadId, uniqueId);
                        break;

                    /**
                     * Type 90    Contacts Synced
                     */
                    case chatMessageVOTypes.CONTACT_SYNCED:
                        chatEvents.fireEvent('contactEvents', {
                            type: 'CONTACTS_SYNCED',
                            result: messageContent
                        });
                        break;

                    /**
                     * Type 101    Location Ping
                     */
                    case chatMessageVOTypes.LOCATION_PING:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('systemEvents', {
                            type: 'LOCATION_PING',
                            result: messageContent
                        });
                        break;

                    /**
                     * Type 102    Close Thread
                     */
                    case chatMessageVOTypes.CLOSE_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        if (fullResponseObject) {
                            getThreads({
                                threadIds: [threadId]
                            }, function (threadsResult) {
                                var thread = threadsResult.result.threads[0];
                                thread.mute = true;

                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_CLOSE',
                                    result: {
                                        thread: thread
                                    }
                                });
                            });
                        } else {
                            chatEvents.fireEvent('threadEvents', {
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
                    case chatMessageVOTypes.REMOVE_BOT_COMMANDS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }
                        break;

                    /**
                     * Type 107    Register Assistant
                     */
                    case chatMessageVOTypes.REGISTER_ASSISTANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANT_REGISTER',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 108    Deactivate Assistant
                     */
                    case chatMessageVOTypes.DEACTIVATE_ASSISTANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANT_DEACTIVATE',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 109    Get Assistants List
                     */
                    case chatMessageVOTypes.GET_ASSISTANTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANTS_LIST',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 115    Get Assistants History
                     */
                    case chatMessageVOTypes.ASSISTANT_HISTORY:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANTS_HSITORY',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 116    Block Assistants
                     */
                    case chatMessageVOTypes.BLOCK_ASSISTANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANT_BLOCK',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 117    UnBlock Assistant
                     */
                    case chatMessageVOTypes.UNBLOCK_ASSISTANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANT_UNBLOCK',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 118    Blocked Assistants List
                     */
                    case chatMessageVOTypes.BLOCKED_ASSISTANTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        chatEvents.fireEvent('assistantEvents', {
                            type: 'ASSISTANTS_BLOCKED_LIST',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 130    Mutual Groups
                     */
                    case chatMessageVOTypes.MUTUAL_GROUPS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'MUTUAL_GROUPS',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 140    Create Tag
                     */
                    case chatMessageVOTypes.CREATE_TAG:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'NEW_TAG',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 141    Edit Tag
                     */
                    case chatMessageVOTypes.EDIT_TAG:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'EDIT_TAG',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 142    Delete Tag
                     */
                    case chatMessageVOTypes.DELETE_TAG:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'DELETE_TAG',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 143    Delete Tag
                     */
                    case chatMessageVOTypes.ADD_TAG_PARTICIPANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'ADD_TAG_PARTICIPANT',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 144    Delete Tag
                     */
                    case chatMessageVOTypes.REMOVE_TAG_PARTICIPANT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'REMOVE_TAG_PARTICIPANT',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 145    Delete Tag
                     */
                    case chatMessageVOTypes.GET_TAG_LIST:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'TAG_LIST',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 151    Delete Message Thread
                     */
                    case chatMessageVOTypes.DELETE_MESSAGE_THREAD:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent));
                        }

                        chatEvents.fireEvent('threadEvents', {
                            type: 'DELETE_THREAD',
                            result: messageContent
                        });

                        break;

                    /**
                     * Type 152    Gives us a json to export for user
                     */
                    case chatMessageVOTypes.EXPORT_CHAT:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                        }

                        break;

                    /**
                     * Type 200    Adding a user to contacts list
                     */
                    case chatMessageVOTypes.ADD_CONTACTS:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
                        }
                        break;

                    /**
                     * Type 999   All unknown errors
                     */
                    case chatMessageVOTypes.ERROR:
                        if (chatMessaging.messagesCallbacks[uniqueId]) {
                            chatMessaging.messagesCallbacks[uniqueId](Utility.createReturnData(true, messageContent.message, messageContent.code, messageContent, 0));
                        }

                        /**
                         * If error code is 21, Token is invalid &
                         * user should logged out
                         */
                        if (messageContent.code === 21) {
                            // TODO: Temporarily removed due to unknown side-effects
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
                                    chatEvents.fireEvent('messageEvents', {
                                        type: 'MESSAGE_FAILED',
                                        cache: false,
                                        result: {
                                            message: message
                                        }
                                    });
                                });
                            }
                        }

                        chatEvents.fireEvent('error', {
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
            sendMessageCallbacksHandler = function (actionType, threadId, uniqueId) {
                switch (actionType) {

                    case chatMessageVOTypes.DELIVERY:
                        if (chatMessaging.threadCallbacks[threadId]) {
                            var lastThreadCallbackIndex = Object.keys(chatMessaging.threadCallbacks[threadId])
                                .indexOf(uniqueId);
                            if (typeof lastThreadCallbackIndex !== 'undefined') {
                                while (lastThreadCallbackIndex > -1) {
                                    var tempUniqueId = Object.entries(chatMessaging.threadCallbacks[threadId])[lastThreadCallbackIndex][0];
                                    if (chatMessaging.sendMessageCallbacks[tempUniqueId] && chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver) {
                                        if (chatMessaging.threadCallbacks[threadId][tempUniqueId] && chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent) {
                                            chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver(
                                                {
                                                    uniqueId: tempUniqueId
                                                });
                                            delete (chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver);
                                            chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver = true;
                                        }
                                    }

                                    lastThreadCallbackIndex -= 1;
                                }
                            }
                        }
                        break;

                    case chatMessageVOTypes.SEEN:
                        if (chatMessaging.threadCallbacks[threadId]) {
                            var lastThreadCallbackIndex = Object.keys(chatMessaging.threadCallbacks[threadId])
                                .indexOf(uniqueId);
                            if (typeof lastThreadCallbackIndex !== 'undefined') {
                                while (lastThreadCallbackIndex > -1) {
                                    var tempUniqueId = Object.entries(chatMessaging.threadCallbacks[threadId])[lastThreadCallbackIndex][0];

                                    if (chatMessaging.sendMessageCallbacks[tempUniqueId] && chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen) {
                                        if (chatMessaging.threadCallbacks[threadId][tempUniqueId] && chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent) {
                                            if (!chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver) {
                                                chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver(
                                                    {
                                                        uniqueId: tempUniqueId
                                                    });
                                                delete (chatMessaging.sendMessageCallbacks[tempUniqueId].onDeliver);
                                                chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver = true;
                                            }

                                            chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen(
                                                {
                                                    uniqueId: tempUniqueId
                                                });

                                            delete (chatMessaging.sendMessageCallbacks[tempUniqueId].onSeen);
                                            chatMessaging.threadCallbacks[threadId][tempUniqueId].onSeen = true;

                                            if (chatMessaging.threadCallbacks[threadId][tempUniqueId].onSent &&
                                                chatMessaging.threadCallbacks[threadId][tempUniqueId].onDeliver &&
                                                chatMessaging.threadCallbacks[threadId][tempUniqueId].onSeen) {
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
            newMessageHandler = function (threadId, messageContent) {

                var message = formatDataToMakeMessage(threadId, messageContent);
                /*
                 * Send Message delivery for the last message
                 * has been received while being online
                 */
                // putInMessagesDeliveryQueue(threadId, message.id);

                /**
                 * Add New Messages into cache database
                 */
                if (canUseCache && cacheSecret.length > 0) {
                    if (db) {
                        /**
                         * Insert new messages into cache database
                         * after deleting old messages from cache
                         */
                        var tempData = {};

                        try {
                            var salt = Utility.generateUUID();
                            tempData.id = parseInt(message.id);
                            tempData.owner = parseInt(chatMessaging.userInfo.id);
                            tempData.threadId = parseInt(message.threadId);
                            tempData.time = message.time;
                            tempData.message = Utility.crypt(message.message, cacheSecret, salt);
                            tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(message)), cacheSecret, salt);
                            tempData.salt = salt;
                            tempData.sendStatus = 'sent';

                        } catch (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        }

                        db.messages.put(tempData)
                            .catch(function (error) {
                                chatEvents.fireEvent('error', {
                                    code: error.code,
                                    message: error.message,
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

                chatEvents.fireEvent('messageEvents', {
                    type: 'MESSAGE_NEW',
                    cache: false,
                    result: {
                        message: message
                    }
                });

                var threadObject = message.conversation;
                var lastMessageVoCopy = Object.assign({}, message);
                lastMessageVoCopy.conversation && delete lastMessageVoCopy.conversation;

                threadObject.lastParticipantImage = (!!message.participant && message.participant.hasOwnProperty('image')) ? message.participant.image : '';
                threadObject.lastMessageVO = lastMessageVoCopy;
                threadObject.lastParticipantName = (!!message.participant && message.participant.hasOwnProperty('name')) ? message.participant.name : '';
                threadObject.lastMessage = (message.hasOwnProperty('message')) ? message.message : '';

                chatEvents.fireEvent('threadEvents', {
                    type: 'THREAD_UNREAD_COUNT_UPDATED',
                    result: {
                        thread: threadObject,
                        unreadCount: (threadObject.unreadCount) ? threadObject.unreadCount : 0
                    }
                });

                chatEvents.fireEvent('threadEvents', {
                    type: 'THREAD_LAST_ACTIVITY_TIME',
                    result: {
                        thread: threadObject
                    }
                });

                // if (fullResponseObject) {
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

                deleteFromChatWaitQueue(message, function () {
                });
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
            chatEditMessageHandler = function (threadId, messageContent) {
                var message = formatDataToMakeMessage(threadId, messageContent);

                /**
                 * Update Message on cache
                 */
                if (canUseCache && cacheSecret.length > 0) {
                    if (db) {
                        try {
                            var tempData = {},
                                salt = Utility.generateUUID();
                            tempData.id = parseInt(message.id);
                            tempData.owner = parseInt(chatMessaging.userInfo.id);
                            tempData.threadId = parseInt(message.threadId);
                            tempData.time = message.time;
                            tempData.message = Utility.crypt(message.message, cacheSecret, salt);
                            tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(message)), cacheSecret, salt);
                            tempData.salt = salt;

                            /**
                             * Insert Message into cache database
                             */
                            db.messages.put(tempData)
                                .catch(function (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
                                        error: error
                                    });
                                });
                        } catch (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        }
                    } else {
                        chatEvents.fireEvent('error', {
                            code: 6601,
                            message: CHAT_ERRORS[6601],
                            error: null
                        });
                    }
                }

                if (fullResponseObject) {
                    getThreads({
                        threadIds: [threadId]
                    }, function (threadsResult) {
                        var threads = threadsResult.result.threads;
                        if (!threadsResult.cache) {
                            chatEvents.fireEvent('messageEvents', {
                                type: 'MESSAGE_EDIT',
                                result: {
                                    message: message
                                }
                            });
                            if (message.pinned) {
                                chatEvents.fireEvent('threadEvents', {
                                    type: 'THREAD_LAST_ACTIVITY_TIME',
                                    result: {
                                        thread: threads[0]
                                    }
                                });
                            }
                        }
                    });
                } else {
                    chatEvents.fireEvent('messageEvents', {
                        type: 'MESSAGE_EDIT',
                        result: {
                            message: message
                        }
                    });
                    if (message.pinned) {
                        chatEvents.fireEvent('threadEvents', {
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
            createThread = function (messageContent, addFromService, showThread) {
                var threadData = formatDataToMakeConversation(messageContent);
                var redirectToThread = (showThread === true) ? showThread : false;

                if (addFromService) {
                    chatEvents.fireEvent('threadEvents', {
                        type: 'THREAD_NEW',
                        redirectToThread: redirectToThread,
                        result: {
                            thread: threadData
                        }
                    });

                    /**
                     * Add New Thread into cache database #cache
                     */
                    if (canUseCache && cacheSecret.length > 0) {
                        if (db) {
                            var tempData = {};

                            try {
                                var salt = Utility.generateUUID();

                                tempData.id = threadData.id;
                                tempData.owner = chatMessaging.userInfo.id;
                                tempData.title = Utility.crypt(threadData.title, cacheSecret, salt);
                                tempData.time = threadData.time;
                                tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(threadData)), cacheSecret, salt);
                                tempData.salt = salt;
                            } catch (error) {
                                chatEvents.fireEvent('error', {
                                    code: error.code,
                                    message: error.message,
                                    error: error
                                });
                            }

                            db.threads.put(tempData)
                                .catch(function (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
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
            formatDataToMakeLinkedUser = function (messageContent) {
                /**
                 * + RelatedUserVO                 {object}
                 *   - coreUserId                  {int}
                 *   - username                    {string}
                 *   - nickname                    {string}
                 *   - name                        {string}
                 *   - image                       {string}
                 */

                var linkedUser = {
                    coreUserId: (typeof messageContent.coreUserId !== 'undefined')
                        ? messageContent.coreUserId
                        : messageContent.id,
                    username: messageContent.username,
                    nickname: messageContent.nickname,
                    name: messageContent.name,
                    image: messageContent.image
                };

                // return linkedUser;
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
            formatDataToMakeContact = function (messageContent) {
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
                    blocked: (typeof messageContent.blocked !== 'undefined')
                        ? messageContent.blocked
                        : false,
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
                }

                // return contact;
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
            formatDataToMakeUser = function (messageContent) {
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
                    contactSynced: messageContent.contactSynced
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
                }

                // Add chatProfileVO if exist
                if (messageContent.chatProfileVO) {
                    user.chatProfileVO = messageContent.chatProfileVO;
                }

                // return user;
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
            formatDataToMakeBlockedUser = function (messageContent) {
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
                };

                // Add contactVO if exist
                if (messageContent.contactVO) {
                    blockedUser.contact = messageContent.contactVO;
                }
                // return blockedUser;
                return JSON.parse(JSON.stringify(blockedUser));
            },

            formatDataToMakeAssistanthistoryItem = function (messageContent) {

                var assistant = {
                    actionType: Object.keys(assistantActionTypes)[Object.values(assistantActionTypes).indexOf(messageContent.actionType)],
                    actionTime: messageContent.actionTime
                };

                // Add chatProfileVO if exist
                if (messageContent.participantVO) {
                    assistant.participantVO = messageContent.participantVO;
                }

                // return participant;
                return JSON.parse(JSON.stringify(assistant));
            },

            formatDataToMakeAssistantHistoryList = function (assistantsList) {
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
            formatDataToMakeInvitee = function (messageContent) {
                /**
                 * + InviteeVO       {object}
                 *    - id           {string}
                 *    - idType       {int}
                 */

                return {
                    id: messageContent.id,
                    idType: inviteeVOidTypes[messageContent.idType]
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
            formatDataToMakeParticipant = function (messageContent, threadId) {
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
                };

                // Add chatProfileVO if exist
                if (messageContent.chatProfileVO) {
                    participant.chatProfileVO = messageContent.chatProfileVO;
                }

                // return participant;
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
            formatDataToMakeConversation = function (messageContent) {

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
                    lastSeenMessageTime: (messageContent.lastSeenMessageNanos)
                        ? (parseInt(parseInt(messageContent.lastSeenMessageTime) / 1000) * 1000000000) + parseInt(messageContent.lastSeenMessageNanos)
                        : (parseInt(messageContent.lastSeenMessageTime)),
                    lastMessageVO: undefined,
                    pinMessageVO: undefined,
                    partnerLastSeenMessageId: messageContent.partnerLastSeenMessageId,
                    partnerLastSeenMessageTime: (messageContent.partnerLastSeenMessageNanos)
                        ? (parseInt(parseInt(messageContent.partnerLastSeenMessageTime) / 1000) * 1000000000) +
                        parseInt(messageContent.partnerLastSeenMessageNanos)
                        : (parseInt(messageContent.partnerLastSeenMessageTime)),
                    partnerLastDeliveredMessageId: messageContent.partnerLastDeliveredMessageId,
                    partnerLastDeliveredMessageTime: (messageContent.partnerLastDeliveredMessageNanos)
                        ? (parseInt(parseInt(messageContent.partnerLastDeliveredMessageTime) / 1000) * 1000000000) +
                        parseInt(messageContent.partnerLastDeliveredMessageNanos)
                        : (parseInt(messageContent.partnerLastDeliveredMessageTime)),
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
                    closed: messageContent.closed
                };

                // Add inviter if exist
                if (messageContent.inviter) {
                    conversation.inviter = formatDataToMakeParticipant(messageContent.inviter, messageContent.id);
                }

                // Add participants list if exist
                if (messageContent.participants && Array.isArray(messageContent.participants)) {
                    conversation.participants = [];

                    for (var i = 0; i < messageContent.participants.length; i++) {
                        var participantData = formatDataToMakeParticipant(messageContent.participants[i], messageContent.id);
                        if (participantData) {
                            conversation.participants.push(participantData);
                        }
                    }
                }

                // Add lastMessageVO if exist
                if (messageContent.lastMessageVO) {
                    conversation.lastMessageVO = formatDataToMakeMessage(messageContent.id, messageContent.lastMessageVO);
                }

                // Add pinMessageVO if exist
                if (messageContent.pinMessageVO) {
                    conversation.pinMessageVO = formatDataToMakePinMessage(messageContent.id, messageContent.pinMessageVO);
                }

                // return conversation;
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
            formatDataToMakeReplyInfo = function (messageContent, threadId) {
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
                    repliedToMessageTime: (messageContent.repliedToMessageNanos)
                        ? (parseInt(parseInt(messageContent.repliedToMessageTime) / 1000) * 1000000000) + parseInt(messageContent.repliedToMessageNanos)
                        : (parseInt(messageContent.repliedToMessageTime)),
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
                }

                // return replyInfo;
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
            formatDataToMakeForwardInfo = function (messageContent, threadId) {
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
                }

                // return forwardInfo;
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
            formatDataToMakeMessage = function (threadId, pushMessageVO, fromCache) {
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
                    var time = (pushMessageVO.timeNanos)
                        ? (parseInt(parseInt(pushMessageVO.time) / 1000) * 1000000000) + parseInt(pushMessageVO.timeNanos)
                        : (parseInt(pushMessageVO.time)),
                        timeMiliSeconds = parseInt(pushMessageVO.time);
                }

                var message = {
                    id: pushMessageVO.id,
                    threadId: threadId,
                    ownerId: (pushMessageVO.ownerId)
                        ? pushMessageVO.ownerId
                        : undefined,
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
                }

                if (pushMessageVO.conversation) {
                    message.conversation = formatDataToMakeConversation(pushMessageVO.conversation);
                    message.threadId = pushMessageVO.conversation.id;
                }

                if (pushMessageVO.replyInfoVO || pushMessageVO.replyInfo) {
                    message.replyInfo = (pushMessageVO.replyInfoVO)
                        ? formatDataToMakeReplyInfo(pushMessageVO.replyInfoVO, threadId)
                        : formatDataToMakeReplyInfo(pushMessageVO.replyInfo, threadId);
                }

                if (pushMessageVO.forwardInfo) {
                    message.forwardInfo = formatDataToMakeForwardInfo(pushMessageVO.forwardInfo, threadId);
                }

                if (pushMessageVO.participant) {
                    message.participant = formatDataToMakeParticipant(pushMessageVO.participant, threadId);
                }

                // return message;
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
            formatDataToMakePinMessage = function (threadId, pushMessageVO) {
                /**
                 * + PinMessageVO                    {object}
                 *    - messageId                    {int}
                 *    - time                         {int}
                 *    - sender                       {int}
                 *    - text                         {string}
                 *    - notifyAll                    {boolean}
                 */
                var pinMessage = {
                    threadId: threadId,
                    time: pushMessageVO.time,
                    sender: pushMessageVO.sender,
                    messageId: pushMessageVO.messageId,
                    text: pushMessageVO.text
                };

                if (typeof pushMessageVO.notifyAll === 'boolean') {
                    pinMessage.notifyAll = pushMessageVO.notifyAll
                }

                // return pinMessage;
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
            reformatThreadHistory = function (threadId, historyContent) {
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
            reformatThreadParticipants = function (participantsContent, threadId) {
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
            unsetNotSeenDuration = function (content) {
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
            cloneObject = function (original) {
                var out, value, key;
                out = Array.isArray(original) ? [] : {};

                for (key in original) {
                    value = original[key];
                    out[key] = (typeof value === 'object' && value !== null)
                        ? cloneObject(value)
                        : value;
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
            getThreads = function (params, callback) {
                var count = 50,
                    offset = 0,
                    content = {},
                    whereClause = {},
                    returnCache = false;

                if (params) {
                    if (parseInt(params.count) > 0) {
                        count = params.count;
                    }

                    if (parseInt(params.offset) > 0) {
                        offset = params.offset;
                    }

                    if (typeof params.threadName === 'string') {
                        content.name = whereClause.name = params.threadName;
                    }

                    if (Array.isArray(params.threadIds)) {
                        content.threadIds = whereClause.threadIds = params.threadIds;
                    }

                    if (typeof params.new === 'boolean') {
                        content.new = params.new;
                    }

                    if (parseInt(params.creatorCoreUserId) > 0) {
                        content.creatorCoreUserId = whereClause.creatorCoreUserId = params.creatorCoreUserId;
                    }

                    if (parseInt(params.partnerCoreUserId) > 0) {
                        content.partnerCoreUserId = whereClause.partnerCoreUserId = params.partnerCoreUserId;
                    }

                    if (parseInt(params.partnerCoreContactId) > 0) {
                        content.partnerCoreContactId = whereClause.partnerCoreContactId = params.partnerCoreContactId;
                    }

                    var functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true;
                }

                content.count = count;
                content.offset = offset;

                var sendMessageParams = {
                    chatMessageVOType: chatMessageVOTypes.GET_THREADS,
                    typeCode: generalTypeCode, //params.typeCode,
                    content: content
                };

                /**
                 * Retrieve threads from cache
                 */
                if (functionLevelCache && canUseCache && cacheSecret.length > 0) {
                    if (db) {
                        var thenAble;

                        if (Object.keys(whereClause).length === 0) {
                            thenAble = db.threads.where('[owner+time]')
                                .between([chatMessaging.userInfo.id, minIntegerValue], [chatMessaging.userInfo.id, maxIntegerValue * 1000])
                                .reverse();
                        } else {
                            if (whereClause.hasOwnProperty('threadIds')) {
                                thenAble = db.threads.where('id')
                                    .anyOf(whereClause.threadIds)
                                    .and(function (thread) {
                                        return thread.owner === chatMessaging.userInfo.id;
                                    });
                            }

                            if (whereClause.hasOwnProperty('name')) {
                                thenAble = db.threads.where('owner')
                                    .equals(parseInt(chatMessaging.userInfo.id))
                                    .filter(function (thread) {
                                        var reg = new RegExp(whereClause.name);
                                        return reg.test(chatDecrypt(thread.title, cacheSecret, thread.salt));
                                    });
                            }

                            if (whereClause.hasOwnProperty('creatorCoreUserId')) {
                                thenAble = db.threads.where('owner')
                                    .equals(parseInt(chatMessaging.userInfo.id))
                                    .filter(function (thread) {
                                        var threadObject = JSON.parse(chatDecrypt(thread.data, cacheSecret, thread.salt), false);
                                        return parseInt(threadObject.inviter.coreUserId) === parseInt(whereClause.creatorCoreUserId);
                                    });
                            }
                        }

                        thenAble.offset(offset)
                            .limit(count)
                            .toArray()
                            .then(function (threads) {
                                db.threads.where('owner')
                                    .equals(parseInt(chatMessaging.userInfo.id))
                                    .count()
                                    .then(function (threadsCount) {
                                        var cacheData = [];

                                        for (var i = 0; i < threads.length; i++) {
                                            try {
                                                cacheData.push(createThread(JSON.parse(chatDecrypt(threads[i].data, cacheSecret, threads[i].salt)), false));
                                            } catch (error) {
                                                chatEvents.fireEvent('error', {
                                                    code: error.code,
                                                    message: error.message,
                                                    error: error
                                                });
                                            }
                                        }

                                        var returnData = {
                                            hasError: false,
                                            cache: true,
                                            errorCode: 0,
                                            errorMessage: '',
                                            result: {
                                                threads: cacheData,
                                                contentCount: threadsCount,
                                                hasNext: !(threads.length < count),
                                                nextOffset: offset * 1 + threads.length
                                            }
                                        };

                                        if (cacheData.length > 0) {
                                            callback && callback(returnData);
                                            callback = undefined;
                                            returnCache = true;
                                        }
                                    });
                            })
                            .catch(function (error) {
                                chatEvents.fireEvent('error', {
                                    code: error.code,
                                    message: error.message,
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

                /**
                 * Retrive get threads response from server
                 */
                return chatMessaging.sendMessage(sendMessageParams, {
                    onResult: function (result) {
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
                                    hasNext: (offset + count < result.contentCount && messageLength > 0),
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

                            /**
                             * Updating cache on separated worker to find and
                             * delete all messages that have been deleted from
                             * thread's last section
                             */

                            if (typeof Worker !== 'undefined' && productEnv !== 'ReactNative' && canUseCache && cacheSecret.length > 0) {
                                if (typeof cacheSyncWorker === 'undefined') {
                                    var plainWorker = function () {
                                        self.importScripts('https://npmcdn.com/dexie@2.0.4/dist/dexie.min.js');
                                        db = new Dexie('podChat');

                                        db.version(1)
                                            .stores({
                                                users: '&id, name, cellphoneNumber, keyId',
                                                contacts: '[owner+id], id, owner, uniqueId, userId, cellphoneNumber, email, firstName, lastName, expireTime',
                                                threads: '[owner+id] ,id, owner, title, time, pin, [owner+time]',
                                                participants: '[owner+id], id, owner, threadId, notSeenDuration, admin, name, contactName, email, expireTime',
                                                messages: '[owner+id], id, owner, threadId, time, [threadId+id], [threadId+owner+time]',
                                                messageGaps: '[owner+id], [owner+waitsFor], id, waitsFor, owner, threadId, time, [threadId+owner+time]',
                                                contentCount: 'threadId, contentCount'
                                            });

                                        addEventListener('message', function (event) {
                                            var data = JSON.parse(event.data);

                                            switch (data.type) {
                                                case 'getThreads':
                                                    var content = JSON.parse(data.data),
                                                        userId = parseInt(data.userId);
                                                    for (var i = 0; i < content.length; i++) {
                                                        var lastMessageTime = (content[i].lastMessageVO) ? content[i].lastMessageVO.time : 0,
                                                            threadId = parseInt(content[i].id);
                                                        if (lastMessageTime > 0) {
                                                            db.messages
                                                                .where('[threadId+owner+time]')
                                                                .between([threadId, userId, lastMessageTime], [
                                                                    threadId,
                                                                    userId,
                                                                    Number.MAX_SAFE_INTEGER * 1000], false, true)
                                                                .delete();
                                                        }
                                                    }
                                                    break;
                                            }
                                        }, false);
                                    };
                                    var code = plainWorker.toString();
                                    code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
                                    var blob = new Blob([code], {type: 'application/javascript'});
                                    cacheSyncWorker = new Worker(URL.createObjectURL(blob));
                                }

                                var workerCommand = {
                                    type: 'getThreads',
                                    userId: chatMessaging.userInfo.id,
                                    data: JSON.stringify(resultData.threads)
                                };

                                cacheSyncWorker.postMessage(JSON.stringify(workerCommand));

                                cacheSyncWorker.onmessage = function (event) {
                                    if (event.data === 'terminate') {
                                        cacheSyncWorker.terminate();
                                        cacheSyncWorker = undefined;
                                    }
                                };

                                cacheSyncWorker.onerror = function (event) {
                                    consoleLogging && console.log(event);
                                };
                            }

                            /**
                             * Add Threads into cache database #cache
                             */
                            if (canUseCache && cacheSecret.length > 0) {
                                if (db) {
                                    var cacheData = [];

                                    /*
                                     * There will be only 5 pinned threads
                                     * So we multiply thread time by pin
                                     * order to have them ordered on cache
                                     * by the same order of server
                                     */
                                    var pinnedThreadsOrderTime = 5;

                                    for (var i = 0; i < resultData.threads.length; i++) {
                                        try {
                                            var tempData = {},
                                                salt = Utility.generateUUID();

                                            tempData.id = resultData.threads[i].id;
                                            tempData.owner = chatMessaging.userInfo.id;
                                            tempData.title = Utility.crypt(resultData.threads[i].title, cacheSecret, salt);
                                            tempData.pin = resultData.threads[i].pin;
                                            tempData.time = (resultData.threads[i].pin) ? resultData.threads[i].time * pinnedThreadsOrderTime : resultData.threads[i].time;
                                            tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.threads[i])), cacheSecret, salt);
                                            tempData.salt = salt;

                                            cacheData.push(tempData);
                                            pinnedThreadsOrderTime--;
                                        } catch (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        }
                                    }

                                    db.threads.bulkPut(cacheData)
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
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
                        }

                        callback && callback(returnData);
                        /**
                         * Delete callback so if server pushes response before
                         * cache, cache won't send data again
                         */
                        callback = undefined;

                        if (!returnData.hasError && returnCache) {
                            chatEvents.fireEvent('threadEvents', {
                                type: 'THREADS_LIST_CHANGE',
                                result: returnData.result
                            });
                        }
                    }
                });
            },

            getAllThreads = function (params, callback) {
                var sendMessageParams = {
                    chatMessageVOType: chatMessageVOTypes.GET_THREADS,
                    typeCode: generalTypeCode, //params.typeCode,
                    content: {}
                };

                sendMessageParams.content.summary = params.summary;

                return chatMessaging.sendMessage(sendMessageParams, {
                    onResult: function (result) {

                        if (!result.hasError) {
                            if (canUseCache) {
                                if (db) {
                                    var allThreads = [];
                                    for (var m = 0; m < result.result.length; m++) {
                                        allThreads.push(result.result[m].id);
                                    }
                                    db.threads
                                        .where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .and(function (thread) {
                                            return allThreads.indexOf(thread.id) < 0;
                                        })
                                        .delete()
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
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
                        }

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
            getHistory = function (params, callback) {
                if (parseInt(params.threadId) > 0) {
                    var sendMessageParams = {
                            chatMessageVOType: chatMessageVOTypes.GET_HISTORY,
                            typeCode: generalTypeCode, //params.typeCode,
                            content: {},
                            subjectId: params.threadId
                        },
                        whereClause = {},
                        offset = (parseInt(params.offset) > 0) ? parseInt(params.offset) : 0,
                        count = (parseInt(params.count) > 0) ? parseInt(params.count) : config.getHistoryCount,
                        order = (typeof params.order != 'undefined') ? (params.order).toLowerCase() : 'desc',
                        functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true,
                        cacheResult = {},
                        serverResult = {},
                        cacheFirstMessage,
                        cacheLastMessage,
                        messages,
                        returnCache,
                        cacheReady = false,
                        dynamicHistoryCount = (params.dynamicHistoryCount && typeof params.dynamicHistoryCount === 'boolean')
                            ? params.dynamicHistoryCount
                            : false,
                        sendingQueue = (params.queues && typeof params.queues.sending === 'boolean')
                            ? params.queues.sending
                            : true,
                        failedQueue = (params.queues && typeof params.queues.failed === 'boolean')
                            ? params.queues.failed
                            : true,
                        uploadingQueue = (params.queues && typeof params.queues.uploading === 'boolean')
                            ? params.queues.uploading
                            : true,
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
                                    timeNanos: (time % 1000) * 1000000
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
                                uploadQueueMessages[i].message.timeNanos = (time % 1000) * 1000000;
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
                                    decryptedEnqueuedMessage = Utility.jsonParser(chatDecrypt(waitQueueMessages[i].message, cacheSecret));
                                }

                                var time = new Date().getTime();
                                failedQueueMessages[i] = formatDataToMakeMessage(waitQueueMessages[i].threadId,
                                    {
                                        uniqueId: decryptedEnqueuedMessage.uniqueId,
                                        ownerId: chatMessaging.userInfo.id,
                                        message: decryptedEnqueuedMessage.content,
                                        metadata: decryptedEnqueuedMessage.metadata,
                                        systemMetadata: decryptedEnqueuedMessage.systemMetadata,
                                        replyInfo: decryptedEnqueuedMessage.replyInfo,
                                        forwardInfo: decryptedEnqueuedMessage.forwardInfo,
                                        participant: chatMessaging.userInfo,
                                        time: time,
                                        timeNanos: (time % 1000) * 1000000
                                    }
                                );
                            }
                        } else {
                            failedQueueMessages = [];
                        }

                        if (dynamicHistoryCount) {
                            var tempCount = count - (sendingQueueMessages.length + failedQueueMessages.length + uploadingQueueMessages.length);
                            sendMessageParams.content.count = (tempCount > 0) ? tempCount : 0;
                        } else {
                            sendMessageParams.content.count = count;
                        }

                        sendMessageParams.content.offset = offset;
                        sendMessageParams.content.order = order;

                        if (parseInt(params.messageId) > 0) {
                            sendMessageParams.content.id = whereClause.id = params.messageId;
                        }

                        if (Array.isArray(params.uniqueIds)) {
                            sendMessageParams.content.uniqueIds = params.uniqueIds;
                        }

                        if (parseInt(params.fromTimeFull) > 0 && params.fromTimeFull.toString().length === 19) {
                            sendMessageParams.content.fromTime = whereClause.fromTime = parseInt(params.fromTimeFull.toString()
                                .substring(0, 13));
                            sendMessageParams.content.fromTimeNanos = whereClause.fromTimeNanos = parseInt(params.fromTimeFull.toString()
                                .substring(10, 19));
                        } else {
                            if (parseInt(params.fromTime) > 0 && parseInt(params.fromTime) < 9999999999999) {
                                sendMessageParams.content.fromTime = whereClause.fromTime = parseInt(params.fromTime);
                            }

                            if (parseInt(params.fromTimeNanos) > 0 && parseInt(params.fromTimeNanos) < 999999999) {
                                sendMessageParams.content.fromTimeNanos = whereClause.fromTimeNanos = parseInt(params.fromTimeNanos);
                            }
                        }

                        if (parseInt(params.toTimeFull) > 0 && params.toTimeFull.toString().length === 19) {
                            sendMessageParams.content.toTime = whereClause.toTime = parseInt(params.toTimeFull.toString()
                                .substring(0, 13));
                            sendMessageParams.content.toTimeNanos = whereClause.toTimeNanos = parseInt(params.toTimeFull.toString()
                                .substring(10, 19));
                        } else {
                            if (parseInt(params.toTime) > 0 && parseInt(params.toTime) < 9999999999999) {
                                sendMessageParams.content.toTime = whereClause.toTime = parseInt(params.toTime);
                            }

                            if (parseInt(params.toTimeNanos) > 0 && parseInt(params.toTimeNanos) < 999999999) {
                                sendMessageParams.content.toTimeNanos = whereClause.toTimeNanos = parseInt(params.toTimeNanos);
                            }
                        }

                        if (typeof params.query != 'undefined') {
                            sendMessageParams.content.query = whereClause.query = params.query;
                        }

                        if (params.allMentioned && typeof params.allMentioned == 'boolean') {
                            sendMessageParams.content.allMentioned = whereClause.allMentioned = params.allMentioned;
                        }

                        if (params.unreadMentioned && typeof params.unreadMentioned == 'boolean') {
                            sendMessageParams.content.unreadMentioned = whereClause.unreadMentioned = params.unreadMentioned;
                        }

                        if (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) {
                            sendMessageParams.content.messageType = whereClause.messageType = chatMessageTypes[params.messageType.toUpperCase()];
                        }

                        if (typeof params.metadataCriteria == 'object' && params.metadataCriteria.hasOwnProperty('field')) {
                            sendMessageParams.content.metadataCriteria = whereClause.metadataCriteria = params.metadataCriteria;
                        }

                        /**
                         * Get Thread Messages from cache
                         *
                         * Because we are not applying metadataCriteria search
                         * on cached data, if this attribute has been set, we
                         * should not return any results from cache
                         */

                        // TODO ASC order?!
                        if (functionLevelCache
                            && canUseCache
                            && cacheSecret.length > 0
                            && !whereClause.hasOwnProperty('metadataCriteria')
                            && order.toLowerCase() !== "asc") {
                            if (db) {
                                var table = db.messages,
                                    collection;
                                returnCache = true;

                                if (whereClause.hasOwnProperty('id') && whereClause.id > 0) {
                                    collection = table.where('id')
                                        .equals(parseInt(params.id))
                                        .and(function (message) {
                                            return message.owner === chatMessaging.userInfo.id;
                                        })
                                        .reverse();
                                } else {
                                    collection = table.where('[threadId+owner+time]')
                                        .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), minIntegerValue],
                                            [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000])
                                        .reverse();
                                }

                                collection.toArray()
                                    .then(function (resultMessages) {
                                        messages = resultMessages.sort(Utility.dynamicSort('time', !(order === 'asc')));

                                        if (whereClause.hasOwnProperty('fromTime')) {
                                            var fromTime = (whereClause.hasOwnProperty('fromTimeNanos'))
                                                ? (Math.floor(whereClause.fromTime / 1000) * 1000000000) + whereClause.fromTimeNanos
                                                : whereClause.fromTime * 1000000;
                                            messages = messages.filter(function (message) {
                                                return message.time >= fromTime;
                                            });
                                        }

                                        if (whereClause.hasOwnProperty('toTime')) {
                                            var toTime = (whereClause.hasOwnProperty('toTimeNanos'))
                                                ? ((Math.floor(whereClause.toTime / 1000)) * 1000000000) + whereClause.toTimeNanos
                                                : (whereClause.toTime) * 1000000;
                                            messages = messages.filter(function (message) {
                                                return message.time <= toTime;
                                            });
                                        }

                                        if (whereClause.hasOwnProperty('query') && typeof whereClause.query == 'string') {
                                            messages = messages.filter(function (message) {
                                                var reg = new RegExp(whereClause.query);
                                                return reg.test(chatDecrypt(message.message, cacheSecret, message.salt));
                                            });
                                        }

                                        /**
                                         * We should check to see if message[offset-1] has
                                         * GAP on cache or not? if yes, we should not return
                                         * any value from cache, because there is a gap between
                                         */
                                        if (offset > 0) {
                                            if (typeof messages[offset - 1] == 'object' && messages[offset - 1].hasGap) {
                                                returnCache = false;
                                            }
                                        }

                                        if (returnCache) {
                                            messages = messages.slice(offset, offset + count);

                                            if (messages.length === 0) {
                                                returnCache = false;
                                            }

                                            cacheFirstMessage = messages[0];
                                            cacheLastMessage = messages[messages.length - 1];

                                            /**
                                             * There should not be any GAPs before
                                             * firstMessage of requested messages in cache
                                             * if there is a gap or more, the cache is not
                                             * valid, therefore we wont return any values
                                             * from cache and wait for server's response
                                             *
                                             * To find out if there is a gap or not, all we
                                             * have to do is to check messageGaps table and
                                             * query it for gaps with time bigger than
                                             * firstMessage's time
                                             */
                                            if (cacheFirstMessage && cacheFirstMessage.time > 0) {
                                                db.messageGaps
                                                    .where('[threadId+owner+time]')
                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), cacheFirstMessage.time],
                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000], true, true)
                                                    .toArray()
                                                    .then(function (gaps) {
                                                        // TODO fill these gaps in a worker
                                                        if (gaps.length > 0) {
                                                            returnCache = false;
                                                        }
                                                    })
                                                    .catch(function (error) {
                                                        chatEvents.fireEvent('error', {
                                                            code: error.code,
                                                            message: error.message,
                                                            error: error
                                                        });
                                                    });
                                            }

                                            if (returnCache) {
                                                collection.count()
                                                    .then(function (collectionContentCount) {
                                                        var contentCount = 0;
                                                        var cacheData = [];

                                                        for (var i = 0; i < messages.length; i++) {
                                                            /**
                                                             * If any of messages between first and last message of cache response
                                                             * has a GAP before them, we shouldn't return cache's result and
                                                             * wait for server's response to hit in
                                                             */
                                                            if (i !== 0 && i !== messages.length - 1 && messages[i].hasGap) {
                                                                returnCache = false;
                                                                break;
                                                            }

                                                            try {
                                                                var tempMessage = formatDataToMakeMessage(messages[i].threadId, JSON.parse(chatDecrypt(messages[i].data, cacheSecret, messages[i].salt)), true);
                                                                cacheData.push(tempMessage);

                                                                cacheResult[tempMessage.id] = {
                                                                    index: i,
                                                                    messageId: tempMessage.id,
                                                                    threadId: tempMessage.threadId,
                                                                    data: Utility.MD5(JSON.stringify([
                                                                        tempMessage.id,
                                                                        tempMessage.message,
                                                                        tempMessage.metadata,
                                                                        tempMessage.systemMetadata]))
                                                                };
                                                            } catch (error) {
                                                                chatEvents.fireEvent('error', {
                                                                    code: error.code,
                                                                    message: error.message,
                                                                    error: error
                                                                });
                                                            }
                                                        }

                                                        /**
                                                         * If there is a GAP between messages of cache result
                                                         * WE should not return data from cache, cause it is not valid!
                                                         * Therefore we wait for server's response and edit cache afterwards
                                                         */
                                                        if (returnCache) {

                                                            /**
                                                             * Get contentCount of this thread from cache
                                                             */
                                                            db.contentCount
                                                                .where('threadId')
                                                                .equals(parseInt(params.threadId))
                                                                .toArray()
                                                                .then(function (res) {
                                                                    var hasNext = true;
                                                                    if (res.length > 0 && res[0].threadId === parseInt(params.threadId)) {
                                                                        contentCount = res[0].contentCount;
                                                                        hasNext = offset + count < res[0].contentCount && messages.length > 0
                                                                    } else {
                                                                        contentCount = collectionContentCount;
                                                                    }

                                                                    var returnData = {
                                                                        hasError: false,
                                                                        cache: true,
                                                                        errorCode: 0,
                                                                        errorMessage: '',
                                                                        result: {
                                                                            history: cacheData,
                                                                            contentCount: contentCount,
                                                                            hasNext: hasNext,
                                                                            nextOffset: offset * 1 + messages.length
                                                                        }
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

                                                                    cacheReady = true;

                                                                    callback && callback(returnData);
                                                                    callback = undefined;
                                                                })
                                                                .catch(function (error) {
                                                                    chatEvents.fireEvent('error', {
                                                                        code: error.code,
                                                                        message: error.message,
                                                                        error: error
                                                                    });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (error) {
                                                        chatEvents.fireEvent('error', {
                                                            code: error.code,
                                                            message: error.message,
                                                            error: error
                                                        });
                                                    });
                                            }
                                        }
                                    })
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                        /**
                         * Get Thread Messages From Server
                         */
                        return chatMessaging.sendMessage(sendMessageParams, {
                            onResult: function (result) {

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

                                    /**
                                     * Add Thread Messages into cache database
                                     * and remove deleted messages from cache database
                                     */
                                    if (canUseCache && cacheSecret.length > 0) {
                                        if (db) {

                                            /**
                                             * Cache Synchronization
                                             *
                                             * If there are some results in cache
                                             * Database, we have to check if they need
                                             * to be deleted or not?
                                             *
                                             * To do so, first of all we should make
                                             * sure that metadataCriteria has not been
                                             * set, cuz we are not applying it on the
                                             * cache results, besides the results from
                                             * cache should not be empty, otherwise
                                             * there is no need to sync cache
                                             */
                                            if (Object.keys(cacheResult).length > 0 && !whereClause.hasOwnProperty('metadataCriteria')) {

                                                /**
                                                 * Check if a condition has been
                                                 * applied on query or not, if there is
                                                 * none, the only limitations on
                                                 * results are count and offset
                                                 *
                                                 * whereClause == []
                                                 */
                                                if (!whereClause || Object.keys(whereClause).length === 0) {

                                                    /**
                                                     * There is no condition applied on
                                                     * query and result is [], so there
                                                     * are no messages in this thread
                                                     * after this offset, and we should
                                                     * delete those messages from cache
                                                     * too
                                                     *
                                                     * result   []
                                                     */
                                                    if (messageLength === 0) {

                                                        /**
                                                         * Order is ASC, so if the server result is empty we
                                                         * should delete everything from cache which has bigger
                                                         * time than first item of cache results for this query
                                                         */
                                                        if (order === 'asc') {
                                                            var finalMessageTime = cacheFirstMessage.time;

                                                            db.messages.where('[threadId+owner+time]')
                                                                .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), finalMessageTime],
                                                                    [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000], true, false)
                                                                .delete()
                                                                .catch(function (error) {
                                                                    chatEvents.fireEvent('error', {
                                                                        code: error.code,
                                                                        message: error.message,
                                                                        error: error
                                                                    });
                                                                });
                                                        }

                                                        /**
                                                         * Order is DESC, so if the
                                                         * server result is empty we
                                                         * should delete everything
                                                         * from cache which has smaller
                                                         * time than first item of
                                                         * cache results for this query
                                                         */
                                                        else {
                                                            var finalMessageTime = cacheFirstMessage.time;

                                                            db.messages.where('[threadId+owner+time]')
                                                                .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), 0],
                                                                    [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), finalMessageTime], true, true)
                                                                .delete()
                                                                .catch(function (error) {
                                                                    chatEvents.fireEvent('error', {
                                                                        code: error.code,
                                                                        message: error.message,
                                                                        error: error
                                                                    });
                                                                });
                                                        }
                                                    }

                                                    /**
                                                     * Result is not Empty or doesn't
                                                     * have just one single record, so
                                                     * we should remove everything
                                                     * which are between firstMessage
                                                     * and lastMessage of this result
                                                     * from cache database and insert
                                                     * the new result into cache, so
                                                     * the deleted ones would be
                                                     * deleted
                                                     *
                                                     * result   [..., n-1, n, n+1, ...]
                                                     */
                                                    else {

                                                        /**
                                                         * We should check for last message's previouseId if it
                                                         * is undefined, so it is the first message of thread and
                                                         * we should delete everything before it from cache
                                                         */
                                                        if (typeof firstMessage.previousId === 'undefined' || typeof lastMessage.previousId === 'undefined') {
                                                            var finalMessageTime = (typeof lastMessage.previousId === 'undefined')
                                                                ? lastMessage.time
                                                                : firstMessage.time;

                                                            db.messages.where('[threadId+owner+time]')
                                                                .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), 0],
                                                                    [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), finalMessageTime], true, false)
                                                                .delete()
                                                                .catch(function (error) {
                                                                    chatEvents.fireEvent('error', {
                                                                        code: error.code,
                                                                        message: error.message,
                                                                        error: error
                                                                    });
                                                                });
                                                        }

                                                        /**
                                                         * Offset has been set as 0 so this result is either the
                                                         * very beginning part of thread or the very last
                                                         * Depending on the sort order
                                                         *
                                                         * offset == 0
                                                         */
                                                        if (offset === 0) {

                                                            /**
                                                             * Results are sorted ASC, and the offset is 0 so
                                                             * the first Message of this result is first
                                                             * Message of thread, everything in cache
                                                             * database which has smaller time than this
                                                             * one should be removed
                                                             *
                                                             * order    ASC
                                                             * result   [0, 1, 2, ...]
                                                             */
                                                            if (order === 'asc') {
                                                                var finalMessageTime = firstMessage.time;

                                                                db.messages.where('[threadId+owner+time]')
                                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), 0],
                                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), finalMessageTime], true, false)
                                                                    .delete()
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });
                                                            }

                                                            /**
                                                             * Results are sorted DESC and the offset is 0 so
                                                             * the last Message of this result is the last
                                                             * Message of the thread, everything in cache
                                                             * database which has bigger time than this
                                                             * one should be removed from cache
                                                             *
                                                             * order    DESC
                                                             * result   [..., n-2, n-1, n]
                                                             */
                                                            else {
                                                                var finalMessageTime = firstMessage.time;

                                                                db.messages.where('[threadId+owner+time]')
                                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), finalMessageTime],
                                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000], false, true)
                                                                    .delete()
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });
                                                            }
                                                        }

                                                        /**
                                                         * Server result is not Empty, so we should remove
                                                         * everything which are between firstMessage and lastMessage
                                                         * of this result from cache database and insert the new
                                                         * result into cache, so the deleted ones would be deleted
                                                         *
                                                         * result   [..., n-1, n, n+1, ...]
                                                         */
                                                        var boundryStartMessageTime = (firstMessage.time < lastMessage.time)
                                                            ? firstMessage.time
                                                            : lastMessage.time,
                                                            boundryEndMessageTime = (firstMessage.time > lastMessage.time)
                                                                ? firstMessage.time
                                                                : lastMessage.time;

                                                        db.messages.where('[threadId+owner+time]')
                                                            .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), boundryStartMessageTime],
                                                                [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), boundryEndMessageTime], true, true)
                                                            .delete()
                                                            .catch(function (error) {
                                                                chatEvents.fireEvent('error', {
                                                                    code: error.code,
                                                                    message: error.message,
                                                                    error: error
                                                                });
                                                            });
                                                    }
                                                }

                                                /**
                                                 * whereClasue is not empty and we
                                                 * should check for every single one of
                                                 * the conditions to update the cache
                                                 * properly
                                                 *
                                                 * whereClause != []
                                                 */
                                                else {

                                                    /**
                                                     * When user ordered a message with
                                                     * exact ID and server returns []
                                                     * but there is something in cache
                                                     * database, we should delete that
                                                     * row from cache, because it has
                                                     * been deleted
                                                     */
                                                    if (whereClause.hasOwnProperty('id') && whereClause.id > 0) {
                                                        db.messages.where('id')
                                                            .equals(parseInt(whereClause.id))
                                                            .and(function (message) {
                                                                return message.owner === chatMessaging.userInfo.id;
                                                            })
                                                            .delete()
                                                            .catch(function (error) {
                                                                chatEvents.fireEvent('error', {
                                                                    code: error.code,
                                                                    message: error.message,
                                                                    error: error
                                                                });
                                                            });
                                                    }

                                                    /**
                                                     * When user sets a query to search
                                                     * on messages we should delete all
                                                     * the results came from cache and
                                                     * insert new results instead,
                                                     * because those messages would be
                                                     * either removed or updated
                                                     */
                                                    if (whereClause.hasOwnProperty('query') && typeof whereClause.query == 'string') {
                                                        db.messages.where('[threadId+owner+time]')
                                                            .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), minIntegerValue],
                                                                [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000])
                                                            .and(function (message) {
                                                                var reg = new RegExp(whereClause.query);
                                                                return reg.test(chatDecrypt(message.message, cacheSecret, message.salt));
                                                            })
                                                            .delete()
                                                            .catch(function (error) {
                                                                chatEvents.fireEvent('error', {
                                                                    code: error.code,
                                                                    message: error.message,
                                                                    error: error
                                                                });
                                                            });
                                                    }

                                                    /**
                                                     * Users sets fromTime or toTime or
                                                     * both of them
                                                     */
                                                    if (whereClause.hasOwnProperty('fromTime') || whereClause.hasOwnProperty('toTime')) {

                                                        /**
                                                         * Server response is Empty []
                                                         */
                                                        if (messageLength === 0) {

                                                            /**
                                                             * User set both fromTime and toTime, so we have a
                                                             * boundary restriction in this case. if server
                                                             * result is empty, we should delete all messages from cache
                                                             * which are between fromTime and toTime. if
                                                             * there are any messages on server in this
                                                             * boundary, we should delete all messages
                                                             * which are between time of first and last
                                                             * message of the server result, from cache and
                                                             * insert new result into cache.
                                                             */
                                                            if (whereClause.hasOwnProperty('fromTime') && whereClause.hasOwnProperty('toTime')) {

                                                                /**
                                                                 * Server response is Empty []
                                                                 */
                                                                var fromTime = (whereClause.hasOwnProperty('fromTimeNanos'))
                                                                    ? ((whereClause.fromTime / 1000) * 1000000000) + whereClause.fromTimeNanos
                                                                    : whereClause.fromTime * 1000000,
                                                                    toTime = (whereClause.hasOwnProperty('toTimeNanos'))
                                                                        ? (((whereClause.toTime / 1000) + 1) * 1000000000) + whereClause.toTimeNanos
                                                                        : (whereClause.toTime + 1) * 1000000;

                                                                db.messages.where('[threadId+owner+time]')
                                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), fromTime],
                                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), toTime], true, true)
                                                                    .delete()
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });
                                                            }

                                                            /**
                                                             * User only set fromTime
                                                             */
                                                            else if (whereClause.hasOwnProperty('fromTime')) {

                                                                /**
                                                                 * Server response is Empty []
                                                                 */
                                                                var fromTime = (whereClause.hasOwnProperty('fromTimeNanos'))
                                                                    ? ((whereClause.fromTime / 1000) * 1000000000) + whereClause.fromTimeNanos
                                                                    : whereClause.fromTime * 1000000;

                                                                db.messages.where('[threadId+owner+time]')
                                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), fromTime],
                                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), maxIntegerValue * 1000], true, false)
                                                                    .delete()
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });
                                                            }

                                                            /**
                                                             * User only set toTime
                                                             */
                                                            else {
                                                                /**
                                                                 * Server response is Empty []
                                                                 */
                                                                var toTime = (whereClause.hasOwnProperty('toTimeNanos'))
                                                                    ? (((whereClause.toTime / 1000) + 1) * 1000000000) + whereClause.toTimeNanos
                                                                    : (whereClause.toTime + 1) * 1000000;

                                                                db.messages.where('[threadId+owner+time]')
                                                                    .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), minIntegerValue],
                                                                        [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), toTime], true, true)
                                                                    .delete()
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });
                                                            }
                                                        }

                                                        /**
                                                         * Server response is not Empty
                                                         * [..., n-1, n, n+1, ...]
                                                         */
                                                        else {

                                                            /**
                                                             * Server response is not Empty
                                                             * [..., n-1, n, n+1, ...]
                                                             */
                                                            var boundryStartMessageTime = (firstMessage.time < lastMessage.time)
                                                                ? firstMessage.time
                                                                : lastMessage.time,
                                                                boundryEndMessageTime = (firstMessage.time > lastMessage.time)
                                                                    ? firstMessage.time
                                                                    : lastMessage.time;

                                                            db.messages.where('[threadId+owner+time]')
                                                                .between([parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), boundryStartMessageTime],
                                                                    [parseInt(params.threadId), parseInt(chatMessaging.userInfo.id), boundryEndMessageTime], true, true)
                                                                .delete()
                                                                .catch(function (error) {
                                                                    chatEvents.fireEvent('error', {
                                                                        code: error.code,
                                                                        message: error.message,
                                                                        error: error
                                                                    });
                                                                });
                                                        }
                                                    }
                                                }
                                            }

                                            /**
                                             * Insert new messages into cache database
                                             * after deleting old messages from cache
                                             */
                                            var cacheData = [];

                                            for (var i = 0; i < history.length; i++) {
                                                serverResult[history[i].id] = {
                                                    index: i,
                                                    data: Utility.MD5(JSON.stringify([
                                                        history[i].id,
                                                        history[i].message,
                                                        history[i].metadata,
                                                        history[i].systemMetadata]))
                                                };
                                                try {
                                                    var tempData = {},
                                                        salt = Utility.generateUUID();
                                                    tempData.id = parseInt(history[i].id);
                                                    tempData.owner = parseInt(chatMessaging.userInfo.id);
                                                    tempData.threadId = parseInt(history[i].threadId);
                                                    tempData.time = history[i].time;
                                                    tempData.message = Utility.crypt(history[i].message, cacheSecret, salt);
                                                    tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(history[i])), cacheSecret, salt);
                                                    tempData.salt = salt;
                                                    tempData.sendStatus = 'sent';
                                                    tempData.hasGap = false;

                                                    cacheData.push(tempData);
                                                    resultMessagesId.push(history[i].id);
                                                } catch (error) {
                                                    chatEvents.fireEvent('error', {
                                                        code: error.code,
                                                        message: error.message,
                                                        error: error
                                                    });
                                                }
                                            }

                                            db.messages.bulkPut(cacheData)
                                                .then(function () {
                                                    if (typeof lastMessage == 'object' &&
                                                        lastMessage != null &&
                                                        lastMessage.id > 0 &&
                                                        lastMessage.previousId > 0) {
                                                        /**
                                                         * Check to see if there is a Gap in cache before
                                                         * lastMessage or not?
                                                         * To do this, we should check existence of message
                                                         * with the ID of lastMessage's previousId field
                                                         */
                                                        db.messages
                                                            .where('[owner+id]')
                                                            .between([chatMessaging.userInfo.id, lastMessage.previousId], [chatMessaging.userInfo.id, lastMessage.previousId], true, true)
                                                            .toArray()
                                                            .then(function (messages) {
                                                                if (messages.length === 0) {
                                                                    /**
                                                                     * Previous Message of last message is not in cache database
                                                                     * so there is a GAP in cache database for this thread before
                                                                     * the last message.
                                                                     * We should insert this GAP in messageGaps database
                                                                     */
                                                                    db.messageGaps
                                                                        .put({
                                                                            id: parseInt(lastMessage.id),
                                                                            owner: parseInt(chatMessaging.userInfo.id),
                                                                            waitsFor: parseInt(lastMessage.previousId),
                                                                            threadId: parseInt(lastMessage.threadId),
                                                                            time: lastMessage.time
                                                                        })
                                                                        .then(function () {
                                                                            db.messages
                                                                                .update([chatMessaging.userInfo.id, lastMessage.id], {hasGap: true})
                                                                                .catch(function (error) {
                                                                                    chatEvents.fireEvent('error', {
                                                                                        code: error.code,
                                                                                        message: error.message,
                                                                                        error: error
                                                                                    });
                                                                                });
                                                                        })
                                                                        .catch(function (error) {
                                                                            chatEvents.fireEvent('error', {
                                                                                code: error.code,
                                                                                message: error.message,
                                                                                error: error
                                                                            });
                                                                        });
                                                                }
                                                            })
                                                            .catch(function (error) {
                                                                chatEvents.fireEvent('error', {
                                                                    code: error.code,
                                                                    message: error.message,
                                                                    error: error
                                                                });
                                                            });
                                                    }

                                                    /**
                                                     * Some new messages have been added into cache,
                                                     * We should check to see if any GAPs have been
                                                     * filled with these messages or not?
                                                     */

                                                    db.messageGaps
                                                        .where('waitsFor')
                                                        .anyOf(resultMessagesId)
                                                        .and(function (messages) {
                                                            return messages.owner === chatMessaging.userInfo.id;
                                                        })
                                                        .toArray()
                                                        .then(function (needsToBeDeleted) {
                                                            /**
                                                             * These messages have to be deleted from messageGaps table
                                                             */
                                                            var messagesToBeDeleted = needsToBeDeleted.map(function (msg) {
                                                                /**
                                                                 * We have to update messages table and
                                                                 * set hasGap for those messages as false
                                                                 */
                                                                db.messages
                                                                    .update([chatMessaging.userInfo.id, msg.id], {hasGap: false})
                                                                    .catch(function (error) {
                                                                        chatEvents.fireEvent('error', {
                                                                            code: error.code,
                                                                            message: error.message,
                                                                            error: error
                                                                        });
                                                                    });

                                                                return [chatMessaging.userInfo.id, msg.id];
                                                            });

                                                            db.messageGaps.bulkDelete(messagesToBeDeleted);
                                                        })
                                                        .catch(function (error) {
                                                            chatEvents.fireEvent('error', {
                                                                code: error.code,
                                                                message: error.message,
                                                                error: error
                                                            });
                                                        });
                                                })
                                                .catch(function (error) {
                                                    chatEvents.fireEvent('error', {
                                                        code: error.code,
                                                        message: error.message,
                                                        error: error
                                                    });
                                                });

                                            /**
                                             * Update contentCount of this thread in cache
                                             * contentCount of thread would be count of all
                                             * thread messages if and only if there are no
                                             * other conditions applied on getHistory that
                                             * count and offset
                                             */
                                            if ((Object.keys(whereClause).length === 0)) {
                                                db.contentCount
                                                    .put({
                                                        threadId: parseInt(params.threadId),
                                                        contentCount: result.contentCount
                                                    })
                                                    .catch(function (error) {
                                                        chatEvents.fireEvent('error', {
                                                            code: error.code,
                                                            message: error.message,
                                                            error: error
                                                        });
                                                    });
                                            }
                                        } else {
                                            chatEvents.fireEvent('error', {
                                                code: 6601,
                                                message: CHAT_ERRORS[6601],
                                                error: null
                                            });
                                        }
                                    }

                                    returnData.result = {
                                        history: history,
                                        contentCount: result.contentCount,
                                        hasNext: (sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount &&
                                            messageLength > 0),
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


                                    /**
                                     * Check Differences between Cache and Server response
                                     */
                                    if (returnCache && cacheReady) {
                                        /**
                                         * If there are some messages in cache but they
                                         * are not in server's response, we can assume
                                         * that they have been removed from server, so
                                         * we should call MESSAGE_DELETE event for them
                                         */

                                        var batchDeleteMessage = [],
                                            batchEditMessage = [],
                                            batchNewMessage = [];

                                        for (var key in cacheResult) {
                                            if (!serverResult.hasOwnProperty(key)) {
                                                batchDeleteMessage.push({
                                                    id: cacheResult[key].messageId,
                                                    pinned: cacheResult[key].pinned,
                                                    threadId: cacheResult[key].threadId
                                                });

                                                // chatEvents.fireEvent('messageEvents', {
                                                //     type: 'MESSAGE_DELETE',
                                                //     result: {
                                                //         message: {
                                                //             id: cacheResult[key].messageId,
                                                //             pinned: cacheResult[key].pinned,
                                                //             threadId: cacheResult[key].threadId
                                                //         }
                                                //     }
                                                // });
                                            }
                                        }

                                        if (batchDeleteMessage.length) {
                                            chatEvents.fireEvent('messageEvents', {
                                                type: 'MESSAGE_DELETE_BATCH',
                                                cache: true,
                                                result: batchDeleteMessage
                                            });
                                        }

                                        for (var key in serverResult) {
                                            if (cacheResult.hasOwnProperty(key)) {
                                                /**
                                                 * Check digest of cache and server response, if
                                                 * they are not the same, we should emit
                                                 */
                                                if (cacheResult[key].data !== serverResult[key].data) {
                                                    /**
                                                     * This message is already on cache, but it's
                                                     * content has been changed, so we emit a
                                                     * message edit event to inform client
                                                     */

                                                    batchEditMessage.push(history[serverResult[key].index]);

                                                    // chatEvents.fireEvent('messageEvents', {
                                                    //     type: 'MESSAGE_EDIT',
                                                    //     result: {
                                                    //         message: history[serverResult[key].index]
                                                    //     }
                                                    // });
                                                }
                                            } else {
                                                /**
                                                 * This Message has not found on cache but it has
                                                 * came from server, so we emit it as a new message
                                                 */

                                                batchNewMessage.push(history[serverResult[key].index]);

                                                // chatEvents.fireEvent('messageEvents', {
                                                //     type: 'MESSAGE_NEW',
                                                //     cache: true,
                                                //     result: {
                                                //         message: history[serverResult[key].index]
                                                //     }
                                                // });
                                            }
                                        }

                                        if (batchEditMessage.length) {
                                            chatEvents.fireEvent('messageEvents', {
                                                type: 'MESSAGE_EDIT_BATCH',
                                                cache: true,
                                                result: batchEditMessage
                                            });
                                        }

                                        if (batchNewMessage.length) {
                                            chatEvents.fireEvent('messageEvents', {
                                                type: 'MESSAGE_NEW_BATCH',
                                                cache: true,
                                                result: batchNewMessage
                                            });
                                        }
                                    } else {
                                        callback && callback(returnData);
                                        callback = undefined;
                                    }
                                }
                            }
                        });
                    });
                } else {
                    chatEvents.fireEvent('error', {
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
            updateThreadInfo = function (params, callback) {
                var updateThreadInfoData = {
                        chatMessageVOType: chatMessageVOTypes.UPDATE_THREAD_INFO,
                        typeCode: generalTypeCode, //params.typeCode,
                        content: {},
                        pushMsgType: 3,
                        token: token
                    },
                    threadInfoContent = {},
                    fileUploadParams = {},
                    metadata = {file: {}},
                    threadId,
                    fileUniqueId = Utility.generateUUID();

                if (params) {
                    if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof (params.userGroupHash) !== 'string') {
                        chatEvents.fireEvent('error', {
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
                        chatEvents.fireEvent('error', {
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

                    if (typeof params.metadata == 'object') {
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

                    if (typeof params.image == 'object' && params.image.size > 0) {
                        return chatUploadHandler({
                            threadId: threadId,
                            file: params.image,
                            fileUniqueId: fileUniqueId
                        }, function (uploadHandlerResult, uploadHandlerMetadata, fileType, fileExtension) {
                            fileUploadParams = Object.assign(fileUploadParams, uploadHandlerResult);

                            threadInfoContent.metadata = JSON.stringify(Object.assign(threadInfoContent.metadata, uploadHandlerMetadata));
                            putInChatUploadQueue({
                                message: {
                                    chatMessageVOType: chatMessageVOTypes.UPDATE_THREAD_INFO,
                                    typeCode: generalTypeCode, //params.typeCode,
                                    subjectId: threadId,
                                    content: threadInfoContent,
                                    metadata: threadInfoContent.metadata,
                                    uniqueId: fileUniqueId,
                                    pushMsgType: 3,
                                    token: token
                                },
                                callbacks: callback
                            }, function () {
                                if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                                            metadata['file']['link'] = `${SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS}/api/images/${result.result.hash}?checkUserGroupAccess=true`;
                                            transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                                                chatSendQueueHandler();
                                            });
                                        } else {
                                            deleteFromChatUploadQueue({message: {uniqueId: fileUniqueId}});
                                        }
                                    });
                                } else {
                                    chatEvents.fireEvent('error', {
                                        code: 999,
                                        message: 'Thread picture can be a image type only!'
                                    });
                                }
                            });
                        });
                    } else if (typeof params.image == 'string' && params.image.length > 5) {
                        threadInfoContent.metadata = JSON.stringify(Object.assign(threadInfoContent.metadata, {fileHash: params.image}));

                        getImageDownloadLinkFromPodspaceNew({
                            hashCode: params.image
                        }, function (result) {
                            if (!result.hasError) {
                                threadInfoContent.image = result.downloadUrl;
                            }
                        });

                        return chatMessaging.sendMessage({
                            chatMessageVOType: chatMessageVOTypes.UPDATE_THREAD_INFO,
                            typeCode: generalTypeCode, //params.typeCode,
                            subjectId: threadId,
                            content: threadInfoContent,
                            metadata: threadInfoContent.metadata,
                            uniqueId: fileUniqueId,
                            pushMsgType: 3,
                            token: token
                        }, {
                            onResult: function (result) {
                                callback && callback(result);
                            }
                        });
                    } else {
                        if (Object.keys(threadInfoContent.metadata).length === 0) {
                            delete threadInfoContent.metadata;
                        }

                        return chatMessaging.sendMessage({
                            chatMessageVOType: chatMessageVOTypes.UPDATE_THREAD_INFO,
                            typeCode: generalTypeCode,//params.typeCode,
                            subjectId: threadId,
                            content: threadInfoContent,
                            metadata: threadInfoContent.metadata,
                            uniqueId: fileUniqueId,
                            pushMsgType: 3,
                            token: token
                        }, {
                            onResult: function (result) {
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
            updateChatProfile = function (params, callback) {
                var updateChatProfileData = {
                    chatMessageVOType: chatMessageVOTypes.UPDATE_CHAT_PROFILE,
                    content: {},
                    pushMsgType: 3,
                    token: token
                };
                if (params) {
                    if (typeof params.bio == 'string') {
                        updateChatProfileData.content.bio = params.bio;
                    }
                    if (typeof params.metadata == 'object') {
                        updateChatProfileData.content.metadata = JSON.stringify(params.metadata);
                    } else if (typeof params.metadata == 'string') {
                        updateChatProfileData.content.metadata = params.metadata;
                    }
                }
                return chatMessaging.sendMessage(updateChatProfileData, {
                    onResult: function (result) {
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
            getCurrentUserRoles = function (params, callback) {
                var updateChatProfileData = {
                    chatMessageVOType: chatMessageVOTypes.GET_PARTICIPANT_ROLES,
                    pushMsgType: 3,
                    subjectId: params.threadId,
                    token: token
                };
                return chatMessaging.sendMessage(updateChatProfileData, {
                    onResult: function (result) {
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
            getThreadParticipants = function (params, callback) {
                var sendMessageParams = {
                        chatMessageVOType: chatMessageVOTypes.THREAD_PARTICIPANTS,
                        typeCode: generalTypeCode,//params.typeCode,
                        content: {},
                        subjectId: params.threadId
                    },
                    whereClause = {},
                    returnCache = false;

                var offset = (parseInt(params.offset) > 0)
                    ? parseInt(params.offset)
                    : 0,
                    count = (parseInt(params.count) > 0)
                        ? parseInt(params.count)
                        : config.getHistoryCount;

                sendMessageParams.content.count = count;
                sendMessageParams.content.offset = offset;

                if (typeof params.name === 'string') {
                    sendMessageParams.content.name = whereClause.name = params.name;
                }

                if (typeof params.admin === 'boolean') {
                    sendMessageParams.content.admin = params.admin;
                }

                var functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true;

                /**
                 * Retrieve thread participants from cache
                 */
                if (functionLevelCache && canUseCache && cacheSecret.length > 0) {
                    if (db) {

                        db.participants.where('expireTime')
                            .below(new Date().getTime())
                            .delete()
                            .then(function () {

                                var thenAble;

                                if (Object.keys(whereClause).length === 0) {
                                    thenAble = db.participants.where('threadId')
                                        .equals(parseInt(params.threadId))
                                        .and(function (participant) {
                                            return participant.owner === chatMessaging.userInfo.id;
                                        });
                                } else {
                                    if (whereClause.hasOwnProperty('name')) {
                                        thenAble = db.participants.where('threadId')
                                            .equals(parseInt(params.threadId))
                                            .and(function (participant) {
                                                return participant.owner === chatMessaging.userInfo.id;
                                            })
                                            .filter(function (contact) {
                                                var reg = new RegExp(whereClause.name);
                                                return reg.test(chatDecrypt(contact.contactName, cacheSecret, contact.salt) + ' '
                                                    + chatDecrypt(contact.name, cacheSecret, contact.salt) + ' '
                                                    + chatDecrypt(contact.email, cacheSecret, contact.salt));
                                            });
                                    }
                                }

                                thenAble.offset(offset)
                                    .limit(count)
                                    .reverse()
                                    .toArray()
                                    .then(function (participants) {
                                        db.participants.where('threadId')
                                            .equals(parseInt(params.threadId))
                                            .and(function (participant) {
                                                return participant.owner === chatMessaging.userInfo.id;
                                            })
                                            .count()
                                            .then(function (participantsCount) {

                                                var cacheData = [];

                                                for (var i = 0; i < participants.length; i++) {
                                                    try {
                                                        cacheData.push(formatDataToMakeParticipant(
                                                            JSON.parse(chatDecrypt(participants[i].data, cacheSecret, participants[i].salt)), participants[i].threadId));
                                                    } catch (error) {
                                                        chatEvents.fireEvent('error', {
                                                            code: error.code,
                                                            message: error.message,
                                                            error: error
                                                        });
                                                    }
                                                }

                                                var returnData = {
                                                    hasError: false,
                                                    cache: true,
                                                    errorCode: 0,
                                                    errorMessage: '',
                                                    result: {
                                                        participants: cacheData,
                                                        contentCount: participantsCount,
                                                        hasNext: !(participants.length < count),
                                                        nextOffset: offset * 1 + participants.length
                                                    }
                                                };

                                                if (cacheData.length > 0) {
                                                    callback && callback(returnData);
                                                    callback = undefined;
                                                    returnCache = true;
                                                }
                                            });
                                    })
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    });
                            })
                            .catch(function (error) {
                                chatEvents.fireEvent('error', {
                                    code: error.code,
                                    message: error.message,
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

                return chatMessaging.sendMessage(sendMessageParams, {
                    onResult: function (result) {
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
                                    hasNext: (sendMessageParams.content.offset + sendMessageParams.content.count < result.contentCount && messageLength > 0),
                                    nextOffset: sendMessageParams.content.offset * 1 + messageLength * 1
                                };

                            returnData.result = resultData;

                            /**
                             * Add thread participants into cache database #cache
                             */
                            if (canUseCache && cacheSecret.length > 0) {
                                if (db) {

                                    var cacheData = [];

                                    for (var i = 0; i < resultData.participants.length; i++) {
                                        try {
                                            var tempData = {},
                                                salt = Utility.generateUUID();

                                            tempData.id = parseInt(resultData.participants[i].id);
                                            tempData.owner = parseInt(chatMessaging.userInfo.id);
                                            tempData.threadId = parseInt(resultData.participants[i].threadId);
                                            tempData.notSeenDuration = resultData.participants[i].notSeenDuration;
                                            tempData.admin = resultData.participants[i].admin;
                                            tempData.auditor = resultData.participants[i].auditor;
                                            tempData.name = Utility.crypt(resultData.participants[i].name, cacheSecret, salt);
                                            tempData.contactName = Utility.crypt(resultData.participants[i].contactName, cacheSecret, salt);
                                            tempData.email = Utility.crypt(resultData.participants[i].email, cacheSecret, salt);
                                            tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                            tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.participants[i])), cacheSecret, salt);
                                            tempData.salt = salt;

                                            cacheData.push(tempData);
                                        } catch (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        }
                                    }

                                    db.participants.bulkPut(cacheData)
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
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
                        }

                        callback && callback(returnData);
                        /**
                         * Delete callback so if server pushes response before
                         * cache, cache won't send data again
                         */
                        callback = undefined;

                        if (!returnData.hasError && returnCache) {
                            chatEvents.fireEvent('threadEvents', {
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
            deliver = function (params) {
                return chatMessaging.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.DELIVERY,
                    typeCode: generalTypeCode, //params.typeCode,
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
            seen = function (params) {
                return chatMessaging.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.SEEN,
                    typeCode: generalTypeCode, //params.typeCode,
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
            getImage = function (params, callback) {
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
            getFile = function (params, callback) {
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
                    url: SERVICE_ADDRESSES.FILESERVER_ADDRESS +
                        SERVICES_PATH.GET_FILE,
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
            getFileFromPodspace = function (params, callback) {
                var downloadUniqueId = Utility.generateUUID(),
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
                    var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE + `?hash=${params.hashCode}&_token_=${token}&_token_issuer_=1`;

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
                            '_token_': token,
                            '_token_issuer_': 1,
                            // 'Range': 'bytes=100-200'
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
                        cancel: function () {
                            cancelFileDownload({
                                uniqueId: downloadUniqueId
                            }, function () {
                                consoleLogging && console.log(`"${downloadUniqueId}" - File download has been canceled!`);
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
            getFileFromPodspaceNew = function (params, callback) {
                var downloadUniqueId = Utility.generateUUID(),
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

                    if(params.checkUserGroupAccess) {
                        getFileData.checkUserGroupAccess = true;
                    }
                }

                if (params.responseType === 'link') {
                    var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE_NEW.replace('{fileHash}', params.hashCode) + `?checkUserGroupAccess=true`;
                    callback({
                        hasError: false,
                        type: 'link',
                        result: returnLink
                    });
                } else {
                    httpRequest({
                        url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_FILE_NEW.replace('{fileHash}', params.hashCode) + `?checkUserGroupAccess=true`,
                        method: 'GET',
                        responseType: 'blob',
                        uniqueId: downloadUniqueId,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        },
                        enableDownloadProgressEvents: params.enableDownloadProgressEvents,
                        hashCode: params.hashCode
                        //data: getFileData
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
                        cancel: function () {
                            cancelFileDownload({
                                uniqueId: downloadUniqueId
                            }, function () {
                                consoleLogging && console.log(`"${downloadUniqueId}" - File download has been canceled!`);
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
            getImageFromPodspace = function (params, callback) {
                var downloadUniqueId = Utility.generateUUID(),
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
                        var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE + `?hash=${params.hashCode}&_token_=${token}&_token_issuer_=1&size=${params.size}&quality=${params.quality}&crop=${params.crop}`;

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
                                '_token_': token,
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
                                }

                                fr.readAsDataURL(result.result.response);
                            } else {
                                callback({
                                    hasError: true
                                });
                            }
                        });

                        return {
                            uniqueId: downloadUniqueId,
                            cancel: function () {
                                cancelFileDownload({
                                    uniqueId: downloadUniqueId
                                }, function () {
                                    consoleLogging && console.log(`"${downloadUniqueId}" - Image download has been canceled!`);
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
                                '_token_': token,
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
                            cancel: function () {
                                cancelFileDownload({
                                    uniqueId: downloadUniqueId
                                }, function () {
                                    consoleLogging && console.log(`"${downloadUniqueId}" - Image download has been canceled!`);
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
            getImageFromPodspaceNew = function (params, callback) {
                var downloadUniqueId = Utility.generateUUID(),
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
                        var returnLink = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS
                            + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + `?checkUserGroupAccess=true&size=${params.size}&quality=${params.quality}&crop=${params.crop}`;
                            //+ SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE + `?hash=${params.hashCode}&_token_=${token}&_token_issuer_=1&size=${params.size}&quality=${params.quality}&crop=${params.crop}`;

                        callback({
                            hasError: false,
                            type: 'link',
                            result: returnLink
                        });
                    } else if (params.responseType === 'base64') {
                        httpRequest({
                            url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS
                                + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + `?checkUserGroupAccess=true&size=${params.size}&quality=${params.quality}&crop=${params.crop}`,
                            method: 'GET',
                            uniqueId: downloadUniqueId,
                            responseType: 'blob',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            enableDownloadProgressEvents: params.enableDownloadProgressEvents,
                            hashCode: params.hashCode
                            //data: getImageData
                        }, function (result) {
                            if (!result.hasError) {
                                var fr = new FileReader();

                                fr.onloadend = function () {
                                    callback({
                                        hasError: result.hasError,
                                        type: 'base64',
                                        result: fr.result
                                    });
                                }

                                fr.readAsDataURL(result.result.response);
                            } else {
                                callback({
                                    hasError: true
                                });
                            }
                        });

                        return {
                            uniqueId: downloadUniqueId,
                            cancel: function () {
                                cancelFileDownload({
                                    uniqueId: downloadUniqueId
                                }, function () {
                                    consoleLogging && console.log(`"${downloadUniqueId}" - Image download has been canceled!`);
                                });
                            }
                        };
                    } else {
                        httpRequest({
                            url: SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS
                                + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode) + `?checkUserGroupAccess=true&size=${params.size}&quality=${params.quality}&crop=${params.crop}`,
                            method: 'GET',
                            responseType: 'blob',
                            uniqueId: downloadUniqueId,
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            enableDownloadProgressEvents: params.enableDownloadProgressEvents,
                            hashCode: params.hashCode
                            //data: getImageData
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
                            cancel: function () {
                                cancelFileDownload({
                                    uniqueId: downloadUniqueId
                                }, function () {
                                    consoleLogging && console.log(`"${downloadUniqueId}" - Image download has been canceled!`);
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
            getImageDownloadLinkFromPodspace = function (params, callback) {
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
            getImageDownloadLinkFromPodspaceNew = function (params, callback) {
                if (params) {
                    if (params.hashCode && typeof params.hashCode == 'string') {
                        var downloadUrl = SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS
                            + SERVICES_PATH.PODSPACE_DOWNLOAD_IMAGE_NEW.replace('{fileHash}', params.hashCode)// + '?hash=' + params.hashCode;
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
            getFileDownloadLinkFromPodspace = function (params, callback) {
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
            uploadFile = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

                fileName = params.file.name;
                fileType = params.file.type;
                fileSize = params.file.size;
                fileExtension = params.file.name.split('.')
                    .pop();


                var uploadFileData = {};

                if (params) {
                    if (typeof params.file !== 'undefined') {
                        uploadFileData.file = params.file;
                    }

                    if (params.randomFileName) {
                        uploadFileData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                        uploadUniqueId = Utility.generateUUID();
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
                        '_token_': token,
                        '_token_issuer_': 1
                    },
                    data: uploadFileData,
                    uniqueId: uploadUniqueId
                }, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = (typeof result.result.responseText == 'string')
                                ? JSON.parse(result.result.responseText)
                                : result.result.responseText;
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
            uploadFileToPodspace = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

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
                        uploadFileData.filename = Utility.generateUUID() + '.' + fileExtension;
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
                        uploadUniqueId = Utility.generateUUID();
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
                        '_token_': token,
                        '_token_issuer_': 1
                    },
                    data: uploadFileData,
                    uniqueId: uploadUniqueId
                }, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = (typeof result.result.responseText == 'string')
                                ? JSON.parse(result.result.responseText)
                                : result.result.responseText;
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

            uploadFileToPodspaceNew = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

                fileName = params.file.name;
                fileType = params.file.type;
                fileSize = params.file.size;
                fileExtension = params.file.name.split('.')
                    .pop();


                var uploadFileData = {};

                if (params) {
                    if (typeof params.file !== 'undefined') {
                        uploadFileData.file = params.file;
                    }

                    if (params.randomFileName) {
                        uploadFileData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                        uploadUniqueId = Utility.generateUUID();
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
                        'Authorization': 'Bearer ' + token
                    },
                    data: uploadFileData,
                    uniqueId: uploadUniqueId
                }, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = (typeof result.result.responseText == 'string')
                                ? JSON.parse(result.result.responseText)
                                : result.result.responseText;
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
                    participant: userInfo,
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
            uploadFileToPodspaceUserGroupNew = function (params, callback) {
                var fileName,
                    //fileType,
                    fileSize,
                    //fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

                fileName = params.file.name;
                //fileType = params.file.type;
                fileSize = params.file.size;
                //fileExtension = params.file.name.split('.').pop();

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
                        uploadUniqueId = Utility.generateUUID();
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
                        'Authorization': 'Bearer ' + token,
                    },
                    data: uploadFileData,
                    uniqueId: uploadUniqueId
                }, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = (typeof result.result.responseText == 'string')
                                ? JSON.parse(result.result.responseText)
                                : result.result.responseText;
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
                    participant: userInfo,
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
            uploadFileFromUrl = function (params, callback) {
                var uploadUniqueId,
                    uploadThreadId;

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
                        uploadFileData.filename = Utility.generateUUID() + '.' + fileExtension;
                    }

                    if (typeof params.uniqueId == 'string') {
                        uploadUniqueId = params.uniqueId;
                    } else {
                        uploadUniqueId = Utility.generateUUID();
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
                        '_token_': token,
                        '_token_issuer_': 1
                    },
                    data: uploadFileData,
                    uniqueId: uploadUniqueId
                }, function (result) {
                    if (!result.hasError) {
                        try {
                            var response = (typeof result.result.responseText == 'string')
                                ? JSON.parse(result.result.responseText)
                                : result.result.responseText;
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
            uploadImage = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

                fileName = params.image.name;
                fileType = params.image.type;
                fileSize = params.image.size;
                fileExtension = params.image.name.split('.')
                    .pop();


                if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
                    var uploadImageData = {};

                    if (params) {
                        if (typeof params.image !== 'undefined') {
                            uploadImageData.image = params.image;
                            uploadImageData.file = params.image;
                        }

                        if (params.randomFileName) {
                            uploadImageData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                            uploadUniqueId = Utility.generateUUID();
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
                            '_token_': token,
                            '_token_issuer_': 1
                        },
                        data: uploadImageData,
                        uniqueId: uploadUniqueId
                    }, function (result) {
                        if (!result.hasError) {
                            try {
                                var response = (typeof result.result.responseText == 'string')
                                    ? JSON.parse(result.result.responseText)
                                    : result.result.responseText;
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
            uploadImageToPodspace = function (params, callback) {
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
                fileExtension = params.image.name.split('.')
                    .pop();
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

                var continueImageUpload = function (params) {
                    if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                                uploadImageData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                                uploadUniqueId = Utility.generateUUID();
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
                                '_token_': token,
                                '_token_issuer_': 1
                            },
                            data: uploadImageData,
                            uniqueId: uploadUniqueId
                        }, function (result) {
                            if (!result.hasError) {
                                try {
                                    var response = (typeof result.result.responseText == 'string')
                                        ? JSON.parse(result.result.responseText)
                                        : result.result.responseText;
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
                                    consoleLogging && console.log(e)
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
                }
            },

            uploadImageToPodspaceNew = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;

                fileName = params.image.name;
                fileType = params.image.type;
                fileSize = params.image.size;
                fileExtension = params.image.name.split('.')
                    .pop();

                if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
                    var uploadImageData = {};

                    if (params) {
                        if (typeof params.image !== 'undefined') {
                            uploadImageData.image = params.image;
                            uploadImageData.file = params.image;
                        }

                        if (params.randomFileName) {
                            uploadImageData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                            uploadUniqueId = Utility.generateUUID();
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
                            'Authorization': 'Bearer ' + token,
                        },
                        data: uploadImageData,
                        uniqueId: uploadUniqueId
                    }, function (result) {
                        if (!result.hasError) {
                            try {
                                var response = (typeof result.result.responseText == 'string')
                                    ? JSON.parse(result.result.responseText)
                                    : result.result.responseText;
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
                        participant: userInfo,
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
            uploadImageToPodspaceUserGroup = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileWidth = 0,
                    fileHeight = 0,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;
                var continueImageUpload = function (params) {
                    if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                                uploadImageData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                                uploadUniqueId = Utility.generateUUID();
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
                                '_token_': token,
                                '_token_issuer_': 1
                            },
                            data: uploadImageData,
                            uniqueId: uploadUniqueId
                        }, function (result) {
                            if (!result.hasError) {
                                try {
                                    var response = (typeof result.result.responseText == 'string')
                                        ? JSON.parse(result.result.responseText)
                                        : result.result.responseText;
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
                                    consoleLogging && console.log(e)
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
                }

                fileName = params.image.name;
                fileType = params.image.type;
                fileSize = params.image.size;
                fileExtension = params.image.name.split('.')
                    .pop();
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
            uploadImageToPodspaceUserGroupNew = function (params, callback) {
                var fileName,
                    fileType,
                    fileSize,
                    fileWidth = 0,
                    fileHeight = 0,
                    fileExtension,
                    uploadUniqueId,
                    uploadThreadId;
                var continueImageUpload = function (params) {
                    if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                                uploadImageData.fileName = Utility.generateUUID() + '.' + fileExtension;
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
                                uploadUniqueId = Utility.generateUUID();
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
                                'Authorization': 'Bearer ' + token,
                            },
                            data: uploadImageData,
                            uniqueId: uploadUniqueId
                        }, function (result) {
                            if (!result.hasError) {
                                try {
                                    var response = (typeof result.result.responseText == 'string')
                                        ? JSON.parse(result.result.responseText)
                                        : result.result.responseText;
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
                                    consoleLogging && console.log(e)
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
                            participant: userInfo,
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
                }

                fileName = params.image.name;
                fileType = params.image.type;
                fileSize = params.image.size;
                fileExtension = params.image.name.split('.')
                    .pop();
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

            sendFileMessage = function (params, callbacks) {
                var metadata = {file: {}},
                    fileUploadParams = {},
                    fileUniqueId = (typeof params.fileUniqueId == 'string' && params.fileUniqueId.length > 0) ? params.fileUniqueId : Utility.generateUUID();
                if (params) {
                    if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof (params.userGroupHash) !== 'string') {
                        chatEvents.fireEvent('error', {
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
                                chatMessageVOType: chatMessageVOTypes.MESSAGE,
                                typeCode: generalTypeCode, //params.typeCode,
                                messageType: (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) ? chatMessageTypes[params.messageType.toUpperCase()] : 1,
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
                            if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
                                uploadImageToPodspaceUserGroupNew(fileUploadParams, function (result) {
                                    if (!result.hasError) {
                                        // Send onFileUpload callback result
                                        if (typeof callbacks === 'object' && callbacks.hasOwnProperty('onFileUpload')) {
                                            callbacks.onFileUpload && callbacks.onFileUpload({
                                                name: result.result.name,
                                                hashCode: result.result.hash,
                                                parentHash: result.result.parentHash,
                                                size: result.result.size,
                                                actualHeight: result.result.actualHeight,
                                                actualWidth: result.result.actualWidth,
                                                link: `${SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS}/api/images/${result.result.hash}?checkUserGroupAccess=true`
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
                                        metadata['file']['link'] = `${SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS}/api/images/${result.result.hash}?checkUserGroupAccess=true`;
                                        transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                                            chatSendQueueHandler();
                                        });
                                    } else {
                                        deleteFromChatUploadQueue({message: {uniqueId: fileUniqueId}});
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
                                        deleteFromChatUploadQueue({message: {uniqueId: fileUniqueId}});
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
            deleteCacheDatabases = function () {
                if (db) {
                    db.close();
                }

                if (queueDb) {
                    queueDb.close();
                }

                var chatCacheDB = new Dexie('podChat');
                if (chatCacheDB) {
                    chatCacheDB.delete()
                        .then(function () {
                            consoleLogging && console.log('PodChat Database successfully deleted!');

                            var queueDb = new Dexie('podQueues');
                            if (queueDb) {
                                queueDb.delete()
                                    .then(function () {
                                        consoleLogging && console.log('PodQueues Database successfully deleted!');
                                        startCacheDatabases();
                                    })
                                    .catch(function (err) {
                                        consoleLogging && console.log(err);
                                    });
                            }
                        })
                        .catch(function (err) {
                            consoleLogging && console.log(err);
                        });
                }
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
            clearCacheDatabasesOfUser = function (callback) {
                if (db && !cacheDeletingInProgress) {
                    cacheDeletingInProgress = true;
                    db.threads
                        .where('owner')
                        .equals(parseInt(chatMessaging.userInfo.id))
                        .delete()
                        .then(function () {
                            consoleLogging && console.log('Threads table deleted');

                            db.contacts
                                .where('owner')
                                .equals(parseInt(chatMessaging.userInfo.id))
                                .delete()
                                .then(function () {
                                    consoleLogging && console.log('Contacts table deleted');

                                    db.messages
                                        .where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .delete()
                                        .then(function () {
                                            consoleLogging && console.log('Messages table deleted');

                                            db.participants
                                                .where('owner')
                                                .equals(parseInt(chatMessaging.userInfo.id))
                                                .delete()
                                                .then(function () {
                                                    consoleLogging && console.log('Participants table deleted');

                                                    db.messageGaps
                                                        .where('owner')
                                                        .equals(parseInt(chatMessaging.userInfo.id))
                                                        .delete()
                                                        .then(function () {
                                                            consoleLogging && console.log('MessageGaps table deleted');
                                                            cacheDeletingInProgress = false;
                                                            callback && callback();
                                                        });
                                                });
                                        });
                                });
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        });
                }
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
            startCacheDatabases = function (callback) {
                if (hasCache) {
                    queueDb = new Dexie('podQueues');

                    queueDb.version(1)
                        .stores({
                            waitQ: '[owner+threadId+uniqueId], owner, threadId, uniqueId, message'
                        });

                    if (enableCache) {
                        db = new Dexie('podChat');

                        db.version(1)
                            .stores({
                                users: '&id, name, cellphoneNumber, keyId',
                                contacts: '[owner+id], id, owner, uniqueId, userId, cellphoneNumber, email, firstName, lastName, expireTime',
                                threads: '[owner+id] ,id, owner, title, time, pin, [owner+time]',
                                participants: '[owner+id], id, owner, threadId, notSeenDuration, admin, auditor, name, contactName, email, expireTime',
                                messages: '[owner+id], id, owner, threadId, time, [threadId+id], [threadId+owner+time]',
                                messageGaps: '[owner+id], [owner+waitsFor], id, waitsFor, owner, threadId, time, [threadId+owner+time]',
                                contentCount: 'threadId, contentCount'
                            });

                        db.open()
                            .catch(function (e) {
                                consoleLogging && console.log('Open failed: ' + e.stack);
                            });

                        db.on('ready', function () {
                            isCacheReady = true;
                            callback && callback();
                        }, true);

                        db.on('versionchange', function (event) {
                            window.location.reload();
                        });
                    } else {
                        callback && callback();
                    }
                } else {
                    consoleLogging && console.log(CHAT_ERRORS[6600]);
                    callback && callback();
                }
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
            getChatSendQueue = function (threadId, callback) {
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
            getChatWaitQueue = function (threadId, active, callback) {
                if (active && threadId > 0) {
                    if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                        queueDb.waitQ.where('threadId')
                            .equals(threadId)
                            .and(function (item) {
                                return item.owner === parseInt(chatMessaging.userInfo.id);
                            })
                            .toArray()
                            .then(function (waitQueueOnCache) {
                                var uniqueIds = [];

                                for (var i = 0; i < waitQueueOnCache.length; i++) {
                                    uniqueIds.push(waitQueueOnCache[i].uniqueId);
                                }

                                if (uniqueIds.length && chatMessaging.chatState) {
                                    chatMessaging.sendMessage({
                                        chatMessageVOType: chatMessageVOTypes.GET_HISTORY,
                                        content: {
                                            uniqueIds: uniqueIds
                                        },
                                        subjectId: threadId
                                    }, {
                                        onResult: function (result) {
                                            if (!result.hasError) {
                                                var messageContent = result.result;

                                                /**
                                                 * Delete those messages from wait
                                                 * queue which are already on the
                                                 * server databases
                                                 */
                                                for (var i = 0; i < messageContent.length; i++) {
                                                    for (var j = 0; j < uniqueIds.length; j++) {
                                                        if (uniqueIds[j] === messageContent[i].uniqueId) {
                                                            deleteFromChatWaitQueue(messageContent[i], function () {
                                                            });
                                                            uniqueIds.splice(j, 1);
                                                            waitQueueOnCache.splice(j, 1);
                                                        }
                                                    }
                                                }

                                                /**
                                                 * Delete those messages from wait
                                                 * queue which are in the send
                                                 * queue and are going to be sent
                                                 */
                                                for (var i = 0; i < chatSendQueue.length; i++) {
                                                    for (var j = 0; j < uniqueIds.length; j++) {
                                                        if (uniqueIds[j] === chatSendQueue[i].message.uniqueId) {
                                                            deleteFromChatWaitQueue(chatSendQueue[i].message, function () {
                                                            });
                                                            uniqueIds.splice(j, 1);
                                                            waitQueueOnCache.splice(j, 1);
                                                        }
                                                    }
                                                }

                                                callback && callback(waitQueueOnCache);
                                            }
                                        }
                                    });
                                } else {
                                    callback && callback(waitQueueOnCache);
                                }
                            })
                            .catch(function (error) {
                                chatEvents.fireEvent('error', {
                                    code: error.code,
                                    message: error.message,
                                    error: error
                                });
                            });
                    } else {
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
                                chatMessageVOType: chatMessageVOTypes.GET_HISTORY,
                                content: {
                                    uniqueIds: uniqueIds
                                },
                                subjectId: threadId
                            }, {
                                onResult: function (result) {
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
            getChatUploadQueue = function (threadId, callback) {
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
            deleteFromChatSentQueue = function (item, callback) {
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
            deleteFromChatWaitQueue = function (item, callback) {
                if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                    queueDb.waitQ.where('uniqueId')
                        .equals(item.uniqueId)
                        .and(function (item) {
                            return item.owner === parseInt(chatMessaging.userInfo.id);
                        })
                        .delete()
                        .then(function () {
                            callback && callback();
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        });
                } else {
                    for (var i = 0; i < chatWaitQueue.length; i++) {
                        if (chatWaitQueue[i].uniqueId === item.uniqueId) {
                            chatWaitQueue.splice(i, 1);
                        }
                    }
                    callback && callback();
                }
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
            deleteFromChatUploadQueue = function (item, callback) {
                for (var i = 0; i < chatUploadQueue.length; i++) {
                    if (chatUploadQueue[i].message.uniqueId === item.message.uniqueId) {
                        chatUploadQueue.splice(i, 1);
                    }
                }
                callback && callback();
            },

            deleteThreadFailedMessagesFromWaitQueue = function (threadId, callback) {
                if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                    queueDb.waitQ.where('threadId')
                        .equals(threadId)
                        .and(function (item) {
                            return item.owner === parseInt(chatMessaging.userInfo.id);
                        })
                        .delete()
                        .then(function () {
                            callback && callback();
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        });
                } else {
                    for (var i = 0; i < chatWaitQueue.length; i++) {
                        if (chatWaitQueue[i].uniqueId === item.uniqueId) {
                            chatWaitQueue.splice(i, 1);
                        }
                    }
                    callback && callback();
                }
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
            putInChatSendQueue = function (params, callback, skip) {
                chatSendQueue.push(params);

                if (!skip) {
                    var time = new Date().getTime();
                    params.message.time = time;
                    params.message.timeNanos = (time % 1000) * 1000000;

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
            putInChatWaitQueue = function (item, callback) {
                if (item.uniqueId !== '') {
                    var waitQueueUniqueId = (typeof item.uniqueId == 'string') ? item.uniqueId : (Array.isArray(item.uniqueId)) ? item.uniqueId[0] : null;

                    if (waitQueueUniqueId != null) {
                        if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                            queueDb.waitQ
                                .put({
                                    threadId: parseInt(item.subjectId),
                                    uniqueId: waitQueueUniqueId,
                                    owner: parseInt(chatMessaging.userInfo.id),
                                    message: Utility.crypt(item, cacheSecret)
                                })
                                .then(function () {
                                    callback && callback();
                                })
                                .catch(function (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
                                        error: error
                                    });
                                });
                        } else {
                            consoleLogging && console.log('Forced to use in memory cache');
                            item.uniqueId = waitQueueUniqueId;
                            chatWaitQueue.push(item);
                            callback && callback();
                        }
                    }
                }
            },

            getItemFromChatWaitQueue = function (uniqueId, callback) {
                if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                    queueDb.waitQ.where('uniqueId')
                        .equals(uniqueId)
                        .and(function (item) {
                            return item.owner === parseInt(chatMessaging.userInfo.id);
                        })
                        .toArray()
                        .then(function (messages) {
                            var decryptedEnqueuedMessage = Utility.jsonParser(chatDecrypt(messages[0].message, cacheSecret));
                            if (decryptedEnqueuedMessage.uniqueId === uniqueId) {
                                var message = formatDataToMakeMessage(messages[0].threadId, {
                                    uniqueId: decryptedEnqueuedMessage.uniqueId,
                                    ownerId: chatMessaging.userInfo.id,
                                    message: decryptedEnqueuedMessage.content,
                                    metadata: decryptedEnqueuedMessage.metadata,
                                    systemMetadata: decryptedEnqueuedMessage.systemMetadata,
                                    replyInfo: decryptedEnqueuedMessage.replyInfo,
                                    forwardInfo: decryptedEnqueuedMessage.forwardInfo,
                                    participant: chatMessaging.userInfo,
                                    time: decryptedEnqueuedMessage.time,
                                    timeNanos: decryptedEnqueuedMessage.timeNanos
                                });
                                callback && callback(message);
                            }
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
                                error: error
                            });
                        });
                } else {
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
                                timeNanos: (time % 1000) * 1000000
                            });

                            callback && callback(message);
                            break;
                        }
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
            putInChatUploadQueue = function (params, callback) {
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
            transferFromUploadQToSendQ = function (threadId, uniqueId, metadata, callback) {
                getChatUploadQueue(threadId, function (uploadQueue) {
                    for (var i = 0; i < uploadQueue.length; i++) {
                        if (uploadQueue[i].message.uniqueId === uniqueId) {
                            try {
                                var message = uploadQueue[i].message,
                                    callbacks = uploadQueue[i].callbacks;
                                let oldMetadata = JSON.parse(message.metadata),
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
                                consoleLogging && console.log(e);
                            }
                            deleteFromChatUploadQueue(uploadQueue[i],
                                function () {
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
            chatDecrypt = function (string, secret, salt) {
                var decryptedString = Utility.decrypt(string, secret, salt);
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
                            db.threads
                                .where('owner')
                                .equals(parseInt(chatMessaging.userInfo.id))
                                .count()
                                .then(function (threadsCount) {
                                    if (threadsCount > 0) {
                                        clearCacheDatabasesOfUser(function () {
                                            consoleLogging && console.log('All cache databases have been cleared.');
                                        });
                                    }
                                })
                                .catch(function (e) {
                                    consoleLogging && console.log(e);
                                });
                        }
                    }

                    return '{}';
                }
            },

            objectDeepMerger = function (...args) {
                var target = {};
                var merger = function (obj) {
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
                for (var i = 0; i < args.length; i++) {
                    merger(args[i]);
                }
                return target;
            },

            setRoleToUser = function (params, callback) {
                var setRoleData = {
                    chatMessageVOType: chatMessageVOTypes.SET_ROLE_TO_USER,
                    typeCode: generalTypeCode, //params.typeCode,
                    content: [],
                    pushMsgType: 3,
                    token: token
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
                    onResult: function (result) {
                        callback && callback(result);
                    }
                });
            },

            removeRoleFromUser = function (params, callback) {
                var setAdminData = {
                    chatMessageVOType: chatMessageVOTypes.REMOVE_ROLE_FROM_USER,
                    typeCode: generalTypeCode, //params.typeCode,
                    content: [],
                    pushMsgType: 3,
                    token: token
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
                    onResult: function (result) {
                        callback && callback(result);
                    }
                });
            },

            unPinMessage = function (params, callback) {
                return chatMessaging.sendMessage({
                    chatMessageVOType: chatMessageVOTypes.UNPIN_MESSAGE,
                    typeCode: generalTypeCode, //params.typeCode,
                    subjectId: params.messageId,
                    content: JSON.stringify({
                        'notifyAll': (typeof params.notifyAll === 'boolean') ? params.notifyAll : false
                    }),
                    pushMsgType: 3,
                    token: token
                }, {
                    onResult: function (result) {
                        callback && callback(result);
                    }
                });
            },

            chatUploadHandler = function (params, callbacks) {
                if (typeof params.file !== 'undefined') {
                    var fileName,
                        fileType,
                        fileSize,
                        fileExtension,
                        chatUploadHandlerResult = {},
                        metadata = {file: {}},
                        fileUniqueId = params.fileUniqueId;

                    fileName = params.file.name;
                    fileType = params.file.type;
                    fileSize = params.file.size;
                    fileExtension = params.file.name.split('.')
                        .pop();

                    chatEvents.fireEvent('fileUploadEvents', {
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
                    if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                    chatEvents.fireEvent('error', {
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

            cancelFileDownload = function (params, callback) {
                if (params) {
                    if (typeof params.uniqueId == 'string') {
                        var uniqueId = params.uniqueId;
                        httpRequestObject[eval('uniqueId')] && httpRequestObject[eval('uniqueId')].abort();
                        httpRequestObject[eval('uniqueId')] && delete (httpRequestObject[eval('uniqueId')]);
                        callback && callback(uniqueId);
                    }
                }
            },

            cancelFileUpload = function (params, callback) {
                if (params) {
                    if (typeof params.uniqueId == 'string') {
                        var uniqueId = params.uniqueId;
                        httpRequestObject[eval('uniqueId')] && httpRequestObject[eval('uniqueId')].abort();
                        httpRequestObject[eval('uniqueId')] && delete (httpRequestObject[eval('uniqueId')]);

                        deleteFromChatUploadQueue({
                            message: {
                                uniqueId: uniqueId
                            }
                        }, callback);
                    }
                }
            },

            cancelMessage = function (uniqueId, callback) {
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

            mapReverse = function (params, callback) {
                var data = {};

                if (params) {
                    if (parseFloat(params.lat) > 0) {
                        data.lat = params.lat;
                    }

                    if (parseFloat(params.lng) > 0) {
                        data.lng = params.lng;
                    }

                    data.uniqueId = Utility.generateUUID();
                }

                var requestParams = {
                    url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.REVERSE,
                    method: 'GET',
                    data: data,
                    headers: {
                        'Api-Key': mapApiKey
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
                        chatEvents.fireEvent('error', {
                            code: result.errorCode,
                            message: result.errorMessage,
                            error: result
                        });
                    }
                });
            },

            mapSearch = function (params, callback) {
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

                    data.uniqueId = Utility.generateUUID();
                }

                var requestParams = {
                    url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.SEARCH,
                    method: 'GET',
                    data: data,
                    headers: {
                        'Api-Key': mapApiKey
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
                        chatEvents.fireEvent('error', {
                            code: result.errorCode,
                            message: result.errorMessage,
                            error: result
                        });
                    }
                });
            },

            mapRouting = function (params, callback) {
                var data = {};

                if (params) {
                    if (typeof params.alternative === 'boolean') {
                        data.alternative = params.alternative;
                    } else {
                        data.alternative = true;
                    }

                    if (typeof params.origin === 'object') {
                        if (parseFloat(params.origin.lat) > 0 && parseFloat(params.origin.lng)) {
                            data.origin = params.origin.lat + ',' + parseFloat(params.origin.lng);
                        } else {
                            consoleLogging && console.log('No origin has been selected!');
                        }
                    }

                    if (typeof params.destination === 'object') {
                        if (parseFloat(params.destination.lat) > 0 && parseFloat(params.destination.lng)) {
                            data.destination = params.destination.lat + ',' + parseFloat(params.destination.lng);
                        } else {
                            consoleLogging && console.log('No destination has been selected!');
                        }
                    }

                    data.uniqueId = Utility.generateUUID();
                }

                var requestParams = {
                    url: SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.ROUTING,
                    method: 'GET',
                    data: data,
                    headers: {
                        'Api-Key': mapApiKey
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
                        chatEvents.fireEvent('error', {
                            code: result.errorCode,
                            message: result.errorMessage,
                            error: result
                        });
                    }
                });
            },

            mapStaticImage = function (params, callback) {
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

                    if (typeof params.center === 'object') {
                        if (parseFloat(params.center.lat) > 0 && parseFloat(params.center.lng)) {
                            data.center = params.center.lat + ',' + parseFloat(params.center.lng);
                        } else {
                            hasError = true;
                            chatEvents.fireEvent('error', {
                                code: 6700,
                                message: CHAT_ERRORS[6700],
                                error: undefined
                            });
                        }
                    } else {
                        hasError = true;
                        chatEvents.fireEvent('error', {
                            code: 6700,
                            message: CHAT_ERRORS[6700],
                            error: undefined
                        });
                    }

                    data.key = mapApiKey;
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
                    errorMessage: (hasError) ? CHAT_ERRORS[6700] : '',
                    errorCode: (hasError) ? 6700 : undefined,
                    result: {
                        link: (!hasError) ? url : ''
                    }
                };

                callback && callback(returnData);
            },

            //TODO Change Node Version
            getImageFormUrl = function (url, uniqueId, callback) {
                getImageFromLinkObjects[uniqueId] = new Image();
                getImageFromLinkObjects[uniqueId].setAttribute('crossOrigin', 'anonymous');

                getImageFromLinkObjects[uniqueId].onload = function () {
                    var canvas = document.createElement("canvas");
                    canvas.width = this.width;
                    canvas.height = this.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0);
                    var dataURI = canvas.toDataURL("image/jpg");

                    var byteString;
                    if (dataURI.split(',')[0].indexOf('base64') >= 0)
                        byteString = atob(dataURI.split(',')[1]);
                    else
                        byteString = unescape(dataURI.split(',')[1]);

                    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                    var ia = new Uint8Array(byteString.length);
                    for (var i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }

                    delete getImageFromLinkObjects[uniqueId];
                    return callback(new Blob([ia], {type: mimeString}));
                }

                getImageFromLinkObjects[uniqueId].src = url;
            };

        /******************************************************
         *             P U B L I C   M E T H O D S            *
         ******************************************************/

        this.on = chatEvents.on;
        this.off = chatEvents.off;

        this.getPeerId = function () {
            return peerId;
        };

        this.getCurrentUser = function () {
            return chatMessaging.userInfo;
        };

        this.getUserInfo = function (callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.USER_INFO,
                typeCode: generalTypeCode
            }, {
                onResult: function (result) {
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

        this.getThreads = getThreads;

        this.getAllThreads = getAllThreads;

        this.getHistory = getHistory;

        this.getAllMentionedMessages = function (params, callback) {
            return getHistory({
                threadId: params.threadId,
                allMentioned: true,
                typeCode: generalTypeCode,//params.typeCode,
                count: params.count || 50,
                offset: params.offset || 0,
                cache: false,
                queues: {
                    uploading: false,
                    sending: false
                }
            }, callback);
        };

        this.getUnreadMentionedMessages = function (params, callback) {
            return getHistory({
                threadId: params.threadId,
                unreadMentioned: true,
                typeCode: generalTypeCode,//params.typeCode,
                count: params.count || 50,
                offset: params.offset || 0,
                cache: false,
                queues: {
                    uploading: false,
                    sending: false
                }
            }, callback);
        };

        this.getAllUnreadMessagesCount = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.ALL_UNREAD_MESSAGE_COUNT,
                typeCode: generalTypeCode,//params.typeCode,
                content: JSON.stringify({
                    'mute': (typeof params.countMuteThreads === 'boolean') ? params.countMuteThreads : false
                }),
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
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
        this.getContacts = function (params, callback) {
            var count = 50,
                offset = 0,
                content = {},
                whereClause = {},
                returnCache = false;

            if (params) {
                if (parseInt(params.count) > 0) {
                    count = parseInt(params.count);
                }
                if (parseInt(params.offset) > 0) {
                    offset = parseInt(params.offset);
                }
                if (typeof params.query === 'string') {
                    content.query = whereClause.query = params.query;
                }
                if (typeof params.email === 'string') {
                    content.email = whereClause.email = params.email;
                }
                if (typeof params.cellphoneNumber === 'string') {
                    content.cellphoneNumber = whereClause.cellphoneNumber = params.cellphoneNumber;
                }
                if (parseInt(params.contactId) > 0) {
                    content.id = whereClause.id = params.contactId;
                }
                if (typeof params.uniqueId === 'string') {
                    content.uniqueId = whereClause.uniqueId = params.uniqueId;
                }
                if (typeof params.username === 'string') {
                    content.username = params.username;
                }

                var functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true;
            }

            content.size = count;
            content.offset = offset;

            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.GET_CONTACTS,
                typeCode: generalTypeCode, //params.typeCode,
                content: content
            };

            /**
             * Retrieve contacts from cache #cache
             */
            if (functionLevelCache && canUseCache && cacheSecret.length > 0) {
                if (db) {

                    /**
                     * First of all we delete all contacts those
                     * expireTime has been expired. after that
                     * we query our cache database to retrieve
                     * what we wanted
                     */
                    db.contacts.where('expireTime')
                        .below(new Date().getTime())
                        .delete()
                        .then(function () {

                            /**
                             * Query cache database to get contacts
                             */
                            var thenAble;

                            if (Object.keys(whereClause).length === 0) {
                                thenAble = db.contacts.where('owner')
                                    .equals(parseInt(chatMessaging.userInfo.id));
                            } else {
                                if (whereClause.hasOwnProperty('query')) {
                                    thenAble = db.contacts.where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .filter(function (contact) {
                                            var reg = new RegExp(whereClause.query);
                                            return reg.test(chatDecrypt(contact.firstName, cacheSecret, contact.salt) + ' '
                                                + chatDecrypt(contact.lastName, cacheSecret, contact.salt) + ' '
                                                + chatDecrypt(contact.email, cacheSecret, contact.salt));
                                        });
                                }
                            }

                            thenAble.reverse()
                                .offset(offset)
                                .limit(count)
                                .toArray()
                                .then(function (contacts) {
                                    db.contacts.where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .count()
                                        .then(function (contactsCount) {
                                            var cacheData = [];

                                            for (var i = 0; i < contacts.length; i++) {
                                                try {
                                                    cacheData.push(formatDataToMakeContact(JSON.parse(chatDecrypt(contacts[i].data, cacheSecret, contacts[i].salt))));
                                                } catch (error) {
                                                    chatEvents.fireEvent('error', {
                                                        code: error.code,
                                                        message: error.message,
                                                        error: error
                                                    });
                                                }
                                            }

                                            var returnData = {
                                                hasError: false,
                                                cache: true,
                                                errorCode: 0,
                                                errorMessage: '',
                                                result: {
                                                    contacts: cacheData,
                                                    contentCount: contactsCount,
                                                    hasNext: !(contacts.length < count),
                                                    nextOffset: offset * 1 + contacts.length
                                                }
                                            };

                                            if (cacheData.length > 0) {
                                                callback && callback(returnData);
                                                callback = undefined;
                                                returnCache = true;
                                            }
                                        });
                                })
                                .catch(function (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
                                        error: error
                                    });
                                });
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
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

            /**
             * Retrieve Contacts from server
             */
            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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
                                hasNext: (offset + count < result.contentCount && messageLength > 0),
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

                        /**
                         * Add Contacts into cache database #cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < resultData.contacts.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();
                                        tempData.id = resultData.contacts[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.uniqueId = resultData.contacts[i].uniqueId;
                                        tempData.userId = Utility.crypt(resultData.contacts[i].userId, cacheSecret, salt);
                                        tempData.cellphoneNumber = Utility.crypt(resultData.contacts[i].cellphoneNumber, cacheSecret, salt);
                                        tempData.email = Utility.crypt(resultData.contacts[i].email, cacheSecret, salt);
                                        tempData.firstName = Utility.crypt(resultData.contacts[i].firstName, cacheSecret, salt);
                                        tempData.lastName = Utility.crypt(resultData.contacts[i].lastName, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.contacts[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.contacts.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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
                    }

                    callback && callback(returnData);
                    /**
                     * Delete callback so if server pushes response before
                     * cache, cache won't send data again
                     */
                    callback = undefined;

                    if (!returnData.hasError && returnCache) {
                        chatEvents.fireEvent('contactEvents', {
                            type: 'CONTACTS_LIST_CHANGE',
                            result: returnData.result
                        });
                    }
                }
            });
        };

        this.getThreadParticipants = getThreadParticipants;

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
        this.getThreadAdmins = function (params, callback) {
            getThreadParticipants({
                threadId: params.threadId,
                admin: true,
                cache: false
            }, callback);
        };

        this.addParticipants = function (params, callback) {
            /**
             * + AddParticipantsRequest   {object}
             *    - subjectId             {int}
             *    + content               {list} List of CONTACT IDs or inviteeVO Objects
             *    - uniqueId              {string}
             */
            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.ADD_PARTICIPANT,
                typeCode: generalTypeCode, //params.typeCode,
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
                            idType: inviteeVOidTypes.TO_BE_USER_USERNAME
                        });
                    }
                }

                if (Array.isArray(params.coreUserids)) {
                    sendMessageParams.content = [];
                    for (var i = 0; i < params.coreUserids.length; i++) {
                        sendMessageParams.content.push({
                            id: params.coreUserids[i],
                            idType: inviteeVOidTypes.TO_BE_CORE_USER_ID
                        });
                    }
                }
            }

            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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

        this.removeParticipants = function (params, callback) {

            /**
             * + RemoveParticipantsRequest    {object}
             *    - subjectId                 {int}
             *    + content                   {list} List of PARTICIPANT IDs from Thread's Participants object
             *       -id                      {int}
             *    - uniqueId                  {string}
             */

            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.REMOVE_PARTICIPANT,
                typeCode: generalTypeCode //params.typeCode
            };

            if (params) {
                if (parseInt(params.threadId) > 0) {
                    sendMessageParams.subjectId = params.threadId;
                }

                if (Array.isArray(params.participantIds)) {
                    sendMessageParams.content = params.participantIds;
                }
            }

            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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

        this.getCurrentUserRoles = getCurrentUserRoles;

        this.leaveThread = function (params, callback) {

            /**
             * + LeaveThreadRequest    {object}
             *    - subjectId          {int}
             *    - uniqueId           {string}
             */

            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.LEAVE_THREAD,
                typeCode: generalTypeCode//params.typeCode
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
                onResult: function (result) {
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

        this.createThread = function (params, callback) {

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
                    content.type = createThreadTypes[threadType];
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
                } else if (typeof params.metadata === 'object') {
                    try {
                        content.metadata = JSON.stringify(params.metadata);
                    } catch (e) {
                        consoleLogging && console.log(e);
                    }
                }

                if (typeof params.message == 'object') {
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
                    } else if (typeof params.message.metadata === 'object') {
                        content.message.metadata = JSON.stringify(params.message.metadata);
                    }

                    if (typeof params.message.systemMetadata === 'string') {
                        content.message.systemMetadata = params.message.systemMetadata;
                    } else if (typeof params.message.systemMetadata === 'object') {
                        content.message.systemMetadata = JSON.stringify(params.message.systemMetadata);
                    }

                    if (Array.isArray(params.message.forwardedMessageIds)) {
                        content.message.forwardedMessageIds = params.message.forwardedMessageIds;
                        content.message.forwardedUniqueIds = [];
                        for (var i = 0; i < params.message.forwardedMessageIds.length; i++) {
                            content.message.forwardedUniqueIds.push(Utility.generateUUID());
                        }
                    }

                }
            }

            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.CREATE_THREAD,
                typeCode: generalTypeCode,//params.typeCode,
                content: content
            };

            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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

        this.createSelfThread = function (params, callback) {
            var content = {
                type: createThreadTypes['SELF']
            };

            if (params) {
                if (typeof params.description === 'string') {
                    content.description = params.description;
                }

                if (typeof params.metadata === 'string') {
                    content.metadata = params.metadata;
                } else if (typeof params.metadata === 'object') {
                    try {
                        content.metadata = JSON.stringify(params.metadata);
                    } catch (e) {
                        consoleLogging && console.log(e);
                    }
                }

                if (typeof params.message == 'object') {
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
                    } else if (typeof params.message.metadata === 'object') {
                        content.message.metadata = JSON.stringify(params.message.metadata);
                    }

                    if (typeof params.message.systemMetadata === 'string') {
                        content.message.systemMetadata = params.message.systemMetadata;
                    } else if (typeof params.message.systemMetadata === 'object') {
                        content.message.systemMetadata = JSON.stringify(params.message.systemMetadata);
                    }

                    if (Array.isArray(params.message.forwardedMessageIds)) {
                        content.message.forwardedMessageIds = params.message.forwardedMessageIds;
                        content.message.forwardedUniqueIds = [];
                        for (var i = 0; i < params.message.forwardedMessageIds.length; i++) {
                            content.message.forwardedUniqueIds.push(Utility.generateUUID());
                        }
                    }

                }
            }

            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.CREATE_THREAD,
                typeCode: generalTypeCode,//params.typeCode,
                content: content
            };

            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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

        this.sendTextMessage = function (params, callbacks) {
            var metadata = {},
                uniqueId;

            if (typeof params.uniqueId !== 'undefined') {
                uniqueId = params.uniqueId;
            } else {
                uniqueId = Utility.generateUUID();
            }

            putInChatSendQueue({
                message: {
                    chatMessageVOType: chatMessageVOTypes.MESSAGE,
                    typeCode: generalTypeCode, //params.typeCode,
                    messageType: (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) ? chatMessageTypes[params.messageType.toUpperCase()] : chatMessageTypes.TEXT,
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

        this.sendBotMessage = function (params, callbacks) {
            var metadata = {};

            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.BOT_MESSAGE,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.messageId,
                content: params.content,
                uniqueId: params.uniqueId,
                metadata: metadata,
                pushMsgType: 3
            }, callbacks);
        };

        this.sendFileMessage = sendFileMessage;

        this.createThreadWithFileMessage = function (params, createThreadCallback, sendFileMessageCallback) {
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
                    content.type = createThreadTypes[threadType];
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
                } else if (typeof params.metadata === 'object') {
                    try {
                        content.metadata = JSON.stringify(params.metadata);
                    } catch (e) {
                        consoleLogging && console.log(e);
                    }
                }
            }
            var sendMessageParams = {
                chatMessageVOType: chatMessageVOTypes.CREATE_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                content: content
            };
            return chatMessaging.sendMessage(sendMessageParams, {
                onResult: function (result) {
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

        this.sendLocationMessage = function (params, callbacks) {
            var data = {},
                url = SERVICE_ADDRESSES.MAP_ADDRESS + SERVICES_PATH.STATIC_IMAGE,
                hasError = false,
                fileUniqueId = Utility.generateUUID();
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
                if (typeof params.mapCenter === 'object') {
                    if (parseFloat(params.mapCenter.lat) > 0 && parseFloat(params.mapCenter.lng)) {
                        data.center = params.mapCenter.lat + ',' + parseFloat(params.mapCenter.lng);
                    } else {
                        hasError = true;
                        chatEvents.fireEvent('error', {
                            code: 6700,
                            message: CHAT_ERRORS[6700],
                            error: undefined
                        });
                    }
                } else {
                    hasError = true;
                    chatEvents.fireEvent('error', {
                        code: 6700,
                        message: CHAT_ERRORS[6700],
                        error: undefined
                    });
                }
                data.key = mapApiKey;
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
                            file: new File([blobImage], "location.png", {type: "image/png", lastModified: new Date()}),
                            content: address.result.formatted_address,
                            messageType: 'POD_SPACE_PICTURE',
                            userGroupHash: params.userGroupHash,
                            metadata: {
                                mapLink: `https://maps.neshan.org/@${data.center},${data.zoom}z`,
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
                cancel: function () {
                    if (typeof getImageFromLinkObjects !== 'undefined' && getImageFromLinkObjects.hasOwnProperty(fileUniqueId)) {
                        getImageFromLinkObjects[fileUniqueId].onload = function () {
                        };
                        delete getImageFromLinkObjects[fileUniqueId];
                        consoleLogging && console.log(`"${fileUniqueId}" - Downloading Location Map has been canceled!`);
                    }

                    cancelFileUpload({
                        uniqueId: fileUniqueId
                    }, function () {
                        consoleLogging && console.log(`"${fileUniqueId}" - Sending Location Message has been canceled!`);
                    });
                }
            };
        };

        this.resendMessage = function (uniqueId, callbacks) {
            if (hasCache && typeof queueDb == 'object' && !forceWaitQueueInMemory) {
                queueDb.waitQ.where('uniqueId')
                    .equals(uniqueId)
                    .and(function (item) {
                        return item.owner === parseInt(chatMessaging.userInfo.id);
                    })
                    .toArray()
                    .then(function (messages) {
                        if (messages.length) {
                            putInChatSendQueue({
                                message: Utility.jsonParser(chatDecrypt(messages[0].message, cacheSecret)),
                                callbacks: callbacks
                            }, function () {
                                chatSendQueueHandler();
                            });
                        }
                    })
                    .catch(function (error) {
                        chatEvents.fireEvent('error', {
                            code: error.code,
                            message: error.message,
                            error: error
                        });
                    });
            } else {
                for (var i = 0; i < chatWaitQueue.length; i++) {
                    if (chatWaitQueue[i].uniqueId === uniqueId) {
                        putInChatSendQueue({
                            message: chatWaitQueue[i],
                            callbacks: callbacks
                        }, function () {
                            chatSendQueueHandler();
                        }, true);
                        // break;
                    }
                }
            }
        };

        this.cancelMessage = cancelMessage;

        this.clearHistory = function (params, callback) {

            /**
             * + Clear History Request Object    {object}
             *    - subjectId                    {int}
             */

            var clearHistoryParams = {
                chatMessageVOType: chatMessageVOTypes.CLEAR_HISTORY,
                typeCode: generalTypeCode, //params.typeCode
            };

            if (params) {
                if (parseInt(params.threadId) > 0) {
                    clearHistoryParams.subjectId = params.threadId;
                }
            }

            return chatMessaging.sendMessage(clearHistoryParams, {
                onResult: function (result) {
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

                        /**
                         * Delete all messages of this thread from cache
                         */
                        if (canUseCache) {
                            if (db) {
                                db.messages.where('threadId')
                                    .equals(parseInt(result.result))
                                    .and(function (message) {
                                        return message.owner === chatMessaging.userInfo.id;
                                    })
                                    .delete()
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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
                    }

                    callback && callback(returnData);
                }
            });
        };

        this.getImage = getImage;

        this.getFile = getFile;

        this.getFileFromPodspace = getFileFromPodspaceNew;//getFileFromPodspace;

        this.getImageFromPodspace = getImageFromPodspaceNew;//getImageFromPodspace;

        this.uploadFile = uploadFile;

        this.uploadImage = uploadImage;

        this.uploadFileToPodspace = uploadFileToPodspaceNew;

        this.uploadImageToPodspace = uploadImageToPodspaceNew;

        this.cancelFileUpload = cancelFileUpload;

        this.cancelFileDownload = cancelFileDownload;

        this.editMessage = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.EDIT_MESSAGE,
                typeCode: generalTypeCode, //params.typeCode,
                messageType: params.messageType,
                subjectId: params.messageId,
                repliedTo: params.repliedTo,
                content: params.content,
                uniqueId: params.uniqueId,
                metadata: params.metadata,
                systemMetadata: params.systemMetadata,
                pushMsgType: 3
            }, {
                onResult: function (result) {
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

                        /**
                         * Update Message on cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                try {
                                    var tempData = {},
                                        salt = Utility.generateUUID();
                                    tempData.id = parseInt(resultData.editedMessage.id);
                                    tempData.owner = parseInt(chatMessaging.userInfo.id);
                                    tempData.threadId = parseInt(resultData.editedMessage.threadId);
                                    tempData.time = resultData.editedMessage.time;
                                    tempData.message = Utility.crypt(resultData.editedMessage.message, cacheSecret, salt);
                                    tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.editedMessage)), cacheSecret, salt);
                                    tempData.salt = salt;

                                    /**
                                     * Insert Message into cache database
                                     */
                                    db.messages.put(tempData)
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        });
                                } catch (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
                                        error: error
                                    });
                                }
                            } else {
                                chatEvents.fireEvent('error', {
                                    code: 6601,
                                    message: CHAT_ERRORS[6601],
                                    error: null
                                });
                            }
                        }
                    }

                    callback && callback(returnData);
                }
            });
        };

        this.deleteMessage = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.DELETE_MESSAGE,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.messageId,
                uniqueId: params.uniqueId,
                content: JSON.stringify({
                    'deleteForAll': (typeof params.deleteForAll === 'boolean') ? params.deleteForAll : false
                }),
                pushMsgType: 3
            }, {
                onResult: function (result) {
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

                        /**
                         * Remove Message from cache
                         */
                        if (canUseCache) {
                            if (db) {
                                db.messages.where('id')
                                    .equals(parseInt(result.result))
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

                    }

                    callback && callback(returnData);
                }
            });
        };

        this.deleteMultipleMessages = function (params, callback) {
            var messageIdsList = params.messageIds,
                uniqueIdsList = [];

            for (var i in messageIdsList) {
                var uniqueId = Utility.generateUUID();
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

                        /**
                         * Remove Message from cache
                         */
                        if (canUseCache) {
                            if (db) {
                                db.messages.where('id')
                                    .equals(parseInt(result.result))
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

                    }

                    callback && callback(returnData);
                };
            }

            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.DELETE_MESSAGE,
                typeCode: generalTypeCode, //params.typeCode,
                content: {
                    uniqueIds: uniqueIdsList,
                    ids: messageIdsList,
                    deleteForAll: (typeof params.deleteForAll === 'boolean') ? params.deleteForAll : false
                },
                pushMsgType: 3
            });
        };

        this.replyTextMessage = function (params, callbacks) {
            var uniqueId;

            if (typeof params.uniqueId !== 'undefined') {
                uniqueId = params.uniqueId;
            } else {
                uniqueId = Utility.generateUUID();
            }

            putInChatSendQueue({
                message: {
                    chatMessageVOType: chatMessageVOTypes.MESSAGE,
                    typeCode: generalTypeCode, //params.typeCode,
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

        this.replyFileMessage = function (params, callbacks) {
            var metadata = {file: {}},
                fileUploadParams = {},
                fileUniqueId = Utility.generateUUID();
            if (!params.userGroupHash || params.userGroupHash.length === 0 || typeof (params.userGroupHash) !== 'string') {
                chatEvents.fireEvent('error', {
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
                        chatMessageVOType: chatMessageVOTypes.MESSAGE,
                        typeCode: generalTypeCode, //params.typeCode,
                        messageType: (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) ? chatMessageTypes[params.messageType.toUpperCase()] : 1,
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
                    if (imageMimeTypes.indexOf(fileType) >= 0 || imageExtentions.indexOf(fileExtension) >= 0) {
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
                                metadata['file']['link'] = `${SERVICE_ADDRESSES.PODSPACE_FILESERVER_ADDRESS}/api/images/${result.result.hash}?checkUserGroupAccess=true`;
                                transferFromUploadQToSendQ(parseInt(params.threadId), fileUniqueId, JSON.stringify(metadata), function () {
                                    chatSendQueueHandler();
                                });
                            } else {
                                deleteFromChatUploadQueue({message: {uniqueId: fileUniqueId}});
                            }
                        });
                    } else {
                        uploadFileToPodspaceNew(fileUploadParams, function (result) {
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
                                deleteFromChatUploadQueue({message: {uniqueId: fileUniqueId}});
                            }
                        });
                    }
                });
            });
        };

        this.forwardMessage = function (params, callbacks) {
            var threadId = params.threadId,
                messageIdsList = params.messageIds,
                uniqueIdsList = [];

            for (var i in messageIdsList) {
                if (!chatMessaging.threadCallbacks[threadId]) {
                    chatMessaging.threadCallbacks[threadId] = {};
                }

                var uniqueId = Utility.generateUUID();
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
                    chatMessageVOType: chatMessageVOTypes.FORWARD_MESSAGE,
                    typeCode: generalTypeCode,//params.typeCode,
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

        this.deliver = function (params) {
            return putInMessagesDeliveryQueue(params.threadId, params.messageId);
        };

        this.seen = function (params) {
            return putInMessagesSeenQueue(params.threadId, params.messageId);
        };

        this.startTyping = function (params) {
            var uniqueId = Utility.generateUUID();

            if (parseInt(params.threadId) > 0) {
                var threadId = params.threadId;
            }
            isTypingInterval && clearInterval(isTypingInterval);

            isTypingInterval = setInterval(function () {
                sendSystemMessage({
                    content: JSON.stringify({
                        type: systemMessageTypes.IS_TYPING
                    }),
                    threadId: threadId,
                    uniqueId: uniqueId
                });
            }, systemMessageIntervalPitch);
        };

        this.stopTyping = function () {
            isTypingInterval && clearInterval(isTypingInterval);
        };

        this.getMessageDeliveredList = function (params, callback) {

            var deliveryListData = {
                chatMessageVOType: chatMessageVOTypes.GET_MESSAGE_DELEVERY_PARTICIPANTS,
                typeCode: generalTypeCode,//params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token,
                timeout: params.timeout
            };

            if (params) {
                if (parseInt(params.messageId) > 0) {
                    deliveryListData.content.messageId = params.messageId;
                }
            }

            return chatMessaging.sendMessage(deliveryListData, {
                onResult: function (result) {
                    if (typeof result.result == 'object') {
                        for (var i = 0; i < result.result.length; i++) {
                            result.result[i] = formatDataToMakeUser(result.result[i]);
                        }
                    }
                    callback && callback(result);
                }
            });
        };

        this.getMessageSeenList = function (params, callback) {
            var seenListData = {
                chatMessageVOType: chatMessageVOTypes.GET_MESSAGE_SEEN_PARTICIPANTS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token,
                timeout: params.timeout
            };

            if (params) {
                if (parseInt(params.messageId) > 0) {
                    seenListData.content.messageId = params.messageId;
                }
            }

            return chatMessaging.sendMessage(seenListData, {
                onResult: function (result) {
                    if (typeof result.result == 'object') {
                        for (var i = 0; i < result.result.length; i++) {
                            result.result[i] = formatDataToMakeUser(result.result[i]);
                        }
                    }
                    callback && callback(result);
                }
            });
        };

        this.updateThreadInfo = updateThreadInfo;

        this.updateChatProfile = updateChatProfile;

        this.muteThread = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.MUTE_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.threadId,
                content: {},
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.unMuteThread = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.UNMUTE_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.threadId,
                content: {},
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.closeThread = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.CLOSE_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.threadId,
                content: {},
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.joinPublicThread = function (params, callback) {
            var joinThreadData = {
                chatMessageVOType: chatMessageVOTypes.JOIN_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                content: '',
                pushMsgType: 3,
                token: token
            };
            if (params) {
                if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
                    joinThreadData.content = params.uniqueName;
                }
            }
            return chatMessaging.sendMessage(joinThreadData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.isPublicThreadNameAvailable = function (params, callback) {
            var isNameAvailableData = {
                chatMessageVOType: chatMessageVOTypes.IS_NAME_AVAILABLE,
                typeCode: generalTypeCode, //params.typeCode,
                content: '',
                pushMsgType: 3,
                token: token
            };
            if (params) {
                if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
                    isNameAvailableData.content = params.uniqueName;
                }
            }
            return chatMessaging.sendMessage(isNameAvailableData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.changeThreadPrivacy = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.CHANGE_THREAD_PRIVACY,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                content: {},
                token: token,
                timeout: params.timeout
            };

            if (params) {
                if (parseInt(params.threadId) > 0) {
                    sendData.subjectId = +params.threadId;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No Thread Id has been sent!`
                    });
                    return;
                }

                if (typeof params.threadType === 'string' && createThreadTypes.hasOwnProperty(params.threadType.toUpperCase())) {
                    if (params.threadType.toUpperCase() === 'PUBLIC_GROUP' || params.threadType.toUpperCase() === 'PUBLIC_CHANNEL') {
                        if (typeof params.uniqueName === 'string' && params.uniqueName.length > 0) {
                            sendData.content.uniqueName = params.uniqueName;
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: `Public Threads need a unique name! One must enter a unique name for this thread.`
                            });
                            return;
                        }
                    }

                    sendData.content.type = createThreadTypes[params.threadType.toUpperCase()];
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No thread type has been declared! Possible inputs are (${Object.keys(createThreadTypes).join(',')})`
                    });
                    return;
                }

            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Change thread Privacy!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.pinThread = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.PIN_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.threadId,
                content: {},
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.unPinThread = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.UNPIN_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                subjectId: params.threadId,
                content: {},
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.deleteThread = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.DELETE_MESSAGE_THREAD,
                typeCode: generalTypeCode//params.typeCode
            };

            if (params) {
                if (+params.threadId > 0) {
                    sendData.subjectId = +params.threadId;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Delete Thread!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.pinMessage = function (params, callback) {
            return chatMessaging.sendMessage({
                chatMessageVOType: chatMessageVOTypes.PIN_MESSAGE,
                typeCode: generalTypeCode,//params.typeCode,
                subjectId: params.messageId,
                content: JSON.stringify({
                    'notifyAll': (typeof params.notifyAll === 'boolean') ? params.notifyAll : false
                }),
                pushMsgType: 3,
                token: token
            }, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.unPinMessage = unPinMessage;

        this.spamPrivateThread = function (params, callback) {
            var spamData = {
                chatMessageVOType: chatMessageVOTypes.SPAM_PV_THREAD,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: token,
                timeout: params.timeout
            };

            if (params) {
                if (parseInt(params.threadId) > 0) {
                    spamData.subjectId = params.threadId;
                }
            }

            return chatMessaging.sendMessage(spamData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.block = function (params, callback) {

            var blockData = {
                chatMessageVOType: chatMessageVOTypes.BLOCK,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token,
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
                onResult: function (result) {
                    if (typeof result.result == 'object') {
                        result.result = formatDataToMakeBlockedUser(result.result);
                    }
                    callback && callback(result);
                }
            });
        };

        this.unblock = function (params, callback) {
            var unblockData = {
                chatMessageVOType: chatMessageVOTypes.UNBLOCK,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: token,
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
                onResult: function (result) {
                    if (typeof result.result == 'object') {
                        result.result = formatDataToMakeBlockedUser(result.result);
                    }

                    callback && callback(result);
                }
            });
        };

        this.getBlockedList = function (params, callback) {
            var count = 50,
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
                chatMessageVOType: chatMessageVOTypes.GET_BLOCKED,
                typeCode: generalTypeCode, //params.typeCode,
                content: content,
                pushMsgType: 3,
                token: token,
                timeout: params.timeout
            };

            return chatMessaging.sendMessage(getBlockedData, {
                onResult: function (result) {
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
                                hasNext: (offset + count < result.contentCount && messageLength > 0),
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

        this.getUserNotSeenDuration = function (params, callback) {
            var content = {};

            if (params) {
                if (Array.isArray(params.userIds)) {
                    content.userIds = params.userIds;
                }
            }

            var getNotSeenDurationData = {
                chatMessageVOType: chatMessageVOTypes.GET_NOT_SEEN_DURATION,
                typeCode: generalTypeCode, //params.typeCode,
                content: content,
                pushMsgType: 3,
                token: token,
                timeout: params.timeout
            };

            return chatMessaging.sendMessage(getNotSeenDurationData, {
                onResult: function (result) {
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

        this.addContacts = function (params, callback) {
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
                } else if (generalTypeCode) {
                    data.typeCode = generalTypeCode;
                }

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

                data.uniqueId = Utility.generateUUID();
            }

            var requestParams = {
                url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.ADD_CONTACTS,
                method: 'POST',
                data: data,
                headers: {
                    '_token_': token,
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

                        /**
                         * Add Contacts into cache database #cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < resultData.contacts.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();
                                        tempData.id = resultData.contacts[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.uniqueId = resultData.contacts[i].uniqueId;
                                        tempData.userId = Utility.crypt(resultData.contacts[i].userId, cacheSecret, salt);
                                        tempData.cellphoneNumber = Utility.crypt(resultData.contacts[i].cellphoneNumber, cacheSecret, salt);
                                        tempData.email = Utility.crypt(resultData.contacts[i].email, cacheSecret, salt);
                                        tempData.firstName = Utility.crypt(resultData.contacts[i].firstName, cacheSecret, salt);
                                        tempData.lastName = Utility.crypt(resultData.contacts[i].lastName, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.contacts[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.contacts.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                    }

                    callback && callback(returnData);

                } else {
                    chatEvents.fireEvent('error', {
                        code: result.errorCode,
                        message: result.errorMessage,
                        error: result
                    });
                }
            });
        };

        this.newAddContacts  = function (params, callback) {
            var addContactsData = {
                chatMessageVOType: chatMessageVOTypes.ADD_CONTACTS,
                content: {},
                pushMsgType: 3,
                token: token,
                typeCode: generalTypeCode
            },
                AddContactVO = {},
                firstNameList = [],
                lastNameList = [],
                cellPhoneNumberList = [],
                emailList = [],
                usernameList = [],
                uniqueIdList = [];

            if (params) {
                for(var item in params.contacts) {
                    if (typeof params.contacts[item].firstName === 'string') {
                        firstNameList.push(params.contacts[item].firstName);
                    } else {
                        firstNameList.push('');
                    }

                    if (typeof params.contacts[item].lastName === 'string') {
                        lastNameList.push(params.contacts[item].lastName)
                    } else {
                        lastNameList.push('');
                    }

                    if (typeof params.contacts[item].cellphoneNumber === 'string') {
                        cellPhoneNumberList.push(params.contacts[item].cellphoneNumber)
                        // data.cellphoneNumber = params.cellphoneNumber;
                    } else {
                        cellPhoneNumberList.push('');
                        // data.cellphoneNumber = '';
                    }

                    if (typeof params.contacts[item].email === 'string') {
                        emailList.push(params.contacts[item].email);
                        // data.email = params.email;
                    } else {
                        emailList.push('');
                        // data.email = '';
                    }

                    if (typeof params.contacts[item].username === 'string') {
                        usernameList.push(params.contacts[item].username);
                        // data.username = params.username;
                    }

                    uniqueIdList.push(Utility.generateUUID());
                    // data.uniqueId = Utility.generateUUID();
                }

                AddContactVO = {
                    uniqueIdList: uniqueIdList,
                    emailList: emailList,
                    usernameList: usernameList,
                    firstNameList: firstNameList,
                    lastNameList: lastNameList,
                    cellphoneNumberList: cellPhoneNumberList
                };
            }

            addContactsData.content = AddContactVO;

            return chatMessaging.sendMessage(addContactsData, {
                onResult: function (result) {
                    console.log(result);
                    var responseData = JSON.parse(result.result.responseText);

                    var returnData = {
                        hasError: responseData.hasError,
                        cache: false,
                        errorMessage: responseData.message,
                        errorCode: responseData.errorCode
                    };

                    if (typeof result.result == 'object') {
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

                        /**
                         * Add Contacts into cache database #cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < resultData.contacts.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();
                                        tempData.id = resultData.contacts[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.uniqueId = resultData.contacts[i].uniqueId;
                                        tempData.userId = Utility.crypt(resultData.contacts[i].userId, cacheSecret, salt);
                                        tempData.cellphoneNumber = Utility.crypt(resultData.contacts[i].cellphoneNumber, cacheSecret, salt);
                                        tempData.email = Utility.crypt(resultData.contacts[i].email, cacheSecret, salt);
                                        tempData.firstName = Utility.crypt(resultData.contacts[i].firstName, cacheSecret, salt);
                                        tempData.lastName = Utility.crypt(resultData.contacts[i].lastName, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.contacts[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.contacts.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                        // }
                        callback && callback(returnData);
                    }
                    //callback && callback(result);
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

        this.updateContacts = function (params, callback) {
            var data = {};

            if (params) {
                if (parseInt(params.id) > 0) {
                    data.id = parseInt(params.id);
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'ID is required for Updating Contact!',
                        error: undefined
                    });
                }

                if (typeof params.firstName === 'string') {
                    data.firstName = params.firstName;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'firstName is required for Updating Contact!'
                    });
                }

                if (typeof params.lastName === 'string') {
                    data.lastName = params.lastName;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'lastName is required for Updating Contact!'
                    });
                }

                if (typeof params.cellphoneNumber === 'string') {
                    data.cellphoneNumber = params.cellphoneNumber;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'cellphoneNumber is required for Updating Contact!'
                    });
                }

                if (typeof params.email === 'string') {
                    data.email = params.email;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'email is required for Updating Contact!'
                    });
                }

                data.uniqueId = Utility.generateUUID();
            }

            var requestParams = {
                url: SERVICE_ADDRESSES.PLATFORM_ADDRESS +
                    SERVICES_PATH.UPDATE_CONTACTS,
                method: 'GET',
                data: data,
                headers: {
                    '_token_': token,
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

                        /**
                         * Add Contacts into cache database #cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < resultData.contacts.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();
                                        tempData.id = resultData.contacts[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.uniqueId = resultData.contacts[i].uniqueId;
                                        tempData.userId = Utility.crypt(resultData.contacts[i].userId, cacheSecret, salt);
                                        tempData.cellphoneNumber = Utility.crypt(resultData.contacts[i].cellphoneNumber, cacheSecret, salt);
                                        tempData.email = Utility.crypt(resultData.contacts[i].email, cacheSecret, salt);
                                        tempData.firstName = Utility.crypt(resultData.contacts[i].firstName, cacheSecret, salt);
                                        tempData.lastName = Utility.crypt(resultData.contacts[i].lastName, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = Utility.crypt(JSON.stringify(unsetNotSeenDuration(resultData.contacts[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.contacts.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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

                    }

                    callback && callback(returnData);

                } else {
                    chatEvents.fireEvent('error', {
                        code: result.errorCode,
                        message: result.errorMessage,
                        error: result
                    });
                }
            });
        };

        this.removeContacts = function (params, callback) {
            var data = {};

            if (params) {
                if (parseInt(params.id) > 0) {
                    data.id = parseInt(params.id);
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'ID is required for Deleting Contact!',
                        error: undefined
                    });
                }
            }

            var requestParams = {
                url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.REMOVE_CONTACTS,
                method: 'POST',
                data: data,
                headers: {
                    '_token_': token,
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

                    /**
                     * Remove the contact from cache
                     */
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

                    callback && callback(returnData);

                } else {
                    chatEvents.fireEvent('error', {
                        code: result.errorCode,
                        message: result.errorMessage,
                        error: result
                    });
                }
            });
        };

        this.searchContacts = function (params, callback) {
            var data = {
                    size: 50,
                    offset: 0
                },
                whereClause = {},
                returnCache = false;

            if (params) {
                if (typeof params.firstName === 'string') {
                    data.firstName = whereClause.firstName = params.firstName;
                }

                if (typeof params.lastName === 'string') {
                    data.lastName = whereClause.lastName = params.lastName;
                }

                if (parseInt(params.cellphoneNumber) > 0) {
                    data.cellphoneNumber = whereClause.cellphoneNumber = params.cellphoneNumber;
                }

                if (typeof params.email === 'string') {
                    data.email = whereClause.email = params.email;
                }

                if (typeof params.query === 'string') {
                    data.q = whereClause.q = params.query;
                }

                if (typeof params.uniqueId === 'string') {
                    data.uniqueId = whereClause.uniqueId = params.uniqueId;
                }

                if (parseInt(params.id) > 0) {
                    data.id = whereClause.id = params.id;
                }

                if (parseInt(params.typeCode) > 0) {
                    data.typeCode = whereClause.typeCode = params.typeCode;
                }
                // data.typeCode = whereClause.typeCode = generalTypeCode;//params.typeCode;

                if (parseInt(params.size) > 0) {
                    data.size = params.size;
                }

                if (parseInt(params.offset) > 0) {
                    data.offset = params.offset;
                }

                var functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true;
            }

            var requestParams = {
                url: SERVICE_ADDRESSES.PLATFORM_ADDRESS + SERVICES_PATH.SEARCH_CONTACTS,
                method: 'POST',
                data: data,
                headers: {
                    '_token_': token,
                    '_token_issuer_': 1
                }
            };

            /**
             * Search contacts in cache #cache
             */
            if (functionLevelCache && canUseCache && cacheSecret.length > 0) {
                if (db) {

                    /**
                     * First of all we delete all contacts those
                     * expireTime has been expired. after that
                     * we query our cache database to retrieve
                     * what we wanted
                     */
                    db.contacts.where('expireTime')
                        .below(new Date().getTime())
                        .delete()
                        .then(function () {

                            /**
                             * Query cache database to get contacts
                             */

                            var thenAble;

                            if (Object.keys(whereClause).length === 0) {
                                thenAble = db.contacts.where('owner')
                                    .equals(parseInt(chatMessaging.userInfo.id));
                            } else {
                                if (whereClause.hasOwnProperty('id')) {
                                    thenAble = db.contacts.where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .and(function (contact) {
                                            return contact.id === whereClause.id;
                                        });
                                } else if (whereClause.hasOwnProperty('uniqueId')) {
                                    thenAble = db.contacts.where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .and(function (contact) {
                                            return contact.uniqueId === whereClause.uniqueId;
                                        });
                                } else {
                                    if (whereClause.hasOwnProperty('firstName')) {
                                        thenAble = db.contacts.where('owner')
                                            .equals(parseInt(chatMessaging.userInfo.id))
                                            .filter(function (contact) {
                                                var reg = new RegExp(whereClause.firstName);
                                                return reg.test(chatDecrypt(contact.firstName, cacheSecret, contact.salt));
                                            });
                                    }

                                    if (whereClause.hasOwnProperty('lastName')) {
                                        thenAble = db.contacts.where('owner')
                                            .equals(parseInt(chatMessaging.userInfo.id))
                                            .filter(function (contact) {
                                                var reg = new RegExp(whereClause.lastName);
                                                return reg.test(chatDecrypt(contact.lastName, cacheSecret, contact.salt));
                                            });
                                    }

                                    if (whereClause.hasOwnProperty('email')) {
                                        thenAble = db.contacts.where('owner')
                                            .equals(parseInt(chatMessaging.userInfo.id))
                                            .filter(function (contact) {
                                                var reg = new RegExp(whereClause.email);
                                                return reg.test(chatDecrypt(contact.email, cacheSecret, contact.salt));
                                            });
                                    }

                                    if (whereClause.hasOwnProperty('q')) {
                                        thenAble = db.contacts.where('owner')
                                            .equals(parseInt(chatMessaging.userInfo.id))
                                            .filter(function (contact) {
                                                var reg = new RegExp(whereClause.q);
                                                return reg.test(chatDecrypt(contact.firstName, cacheSecret, contact.salt) + ' ' +
                                                    chatDecrypt(contact.lastName, cacheSecret, contact.salt) + ' ' +
                                                    chatDecrypt(contact.email, cacheSecret, contact.salt));
                                            });
                                    }
                                }
                            }

                            thenAble.offset(data.offset)
                                .limit(data.size)
                                .toArray()
                                .then(function (contacts) {
                                    db.contacts.where('owner')
                                        .equals(parseInt(chatMessaging.userInfo.id))
                                        .count()
                                        .then(function (contactsCount) {
                                            var cacheData = [];

                                            for (var i = 0; i < contacts.length; i++) {
                                                try {
                                                    cacheData.push(formatDataToMakeContact(JSON.parse(chatDecrypt(contacts[i].data, cacheSecret, ontacts[i].salt))));
                                                } catch (error) {
                                                    chatEvents.fireEvent('error', {
                                                        code: error.code,
                                                        message: error.message,
                                                        error: error
                                                    });
                                                }
                                            }

                                            var returnData = {
                                                hasError: false,
                                                cache: true,
                                                errorCode: 0,
                                                errorMessage: '',
                                                result: {
                                                    contacts: cacheData,
                                                    contentCount: contactsCount,
                                                    hasNext: !(contacts.length < data.size),
                                                    nextOffset: data.offset * 1 + contacts.length
                                                }
                                            };

                                            if (cacheData.length > 0) {
                                                callback && callback(returnData);
                                                callback = undefined;
                                                returnCache = true;
                                            }
                                        })
                                        .catch(function (error) {
                                            chatEvents.fireEvent('error', {
                                                code: error.code,
                                                message: error.message,
                                                error: error
                                            });
                                        });
                                })
                                .catch(function (error) {
                                    chatEvents.fireEvent('error', {
                                        code: error.code,
                                        message: error.message,
                                        error: error
                                    });
                                });
                        })
                        .catch(function (error) {
                            chatEvents.fireEvent('error', {
                                code: error.code,
                                message: error.message,
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

                        /**
                         * Add Contacts into cache database #cache
                         */
                        if (canUseCache && cacheSecret.length > 0) {
                            if (db) {
                                var cacheData = [];

                                for (var i = 0; i < resultData.contacts.length; i++) {
                                    try {
                                        var tempData = {},
                                            salt = Utility.generateUUID();

                                        tempData.id = resultData.contacts[i].id;
                                        tempData.owner = chatMessaging.userInfo.id;
                                        tempData.uniqueId = resultData.contacts[i].uniqueId;
                                        tempData.userId = Utility.crypt(resultData.contacts[i].userId, cacheSecret, salt);
                                        tempData.cellphoneNumber = Utility.crypt(resultData.contacts[i].cellphoneNumber, cacheSecret, salt);
                                        tempData.email = Utility.crypt(resultData.contacts[i].email, cacheSecret, salt);
                                        tempData.firstName = Utility.crypt(resultData.contacts[i].firstName, cacheSecret, salt);
                                        tempData.lastName = Utility.crypt(resultData.contacts[i].lastName, cacheSecret, salt);
                                        tempData.expireTime = new Date().getTime() + cacheExpireTime;
                                        tempData.data = crypt(JSON.stringify(unsetNotSeenDuration(resultData.contacts[i])), cacheSecret, salt);
                                        tempData.salt = salt;

                                        cacheData.push(tempData);
                                    } catch (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
                                            error: error
                                        });
                                    }
                                }

                                db.contacts.bulkPut(cacheData)
                                    .catch(function (error) {
                                        chatEvents.fireEvent('error', {
                                            code: error.code,
                                            message: error.message,
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
                    }

                    callback && callback(returnData);
                    /**
                     * Delete callback so if server pushes response before
                     * cache, cache won't send data again
                     */
                    callback = undefined;

                    if (!returnData.hasError && returnCache) {
                        chatEvents.fireEvent('contactEvents', {
                            type: 'CONTACTS_SEARCH_RESULT_CHANGE',
                            result: returnData.result
                        });
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: result.errorCode,
                        message: result.errorMessage,
                        error: result
                    });
                }
            });
        };

        this.createBot = function (params, callback) {
            var createBotData = {
                chatMessageVOType: chatMessageVOTypes.CREATE_BOT,
                typeCode: generalTypeCode,//params.typeCode,
                content: '',
                pushMsgType: 3,
                token: token
            };
            if (params) {
                if (typeof params.botName === 'string' && params.botName.length > 0) {
                    if (params.botName.substr(-3) === "BOT") {
                        createBotData.content = params.botName;
                    } else {
                        chatEvents.fireEvent('error', {
                            code: 999,
                            message: 'Bot name should end in "BOT", ex. "testBOT"'
                        });
                        return;
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Insert a bot name to create one!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'Insert a bot name to create one!'
                });
                return;
            }
            return chatMessaging.sendMessage(createBotData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.defineBotCommand = function (params, callback) {
            var defineBotCommandData = {
                chatMessageVOType: chatMessageVOTypes.DEFINE_BOT_COMMAND,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            }, commandList = [];
            if (params) {
                if (typeof params.botName !== 'string' || params.botName.length === 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You need to insert a botName!'
                    });
                    return;
                }
                if (!Array.isArray(params.commandList) || !params.commandList.length) {
                    chatEvents.fireEvent('error', {
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to create bot commands'
                });
                return;
            }
            return chatMessaging.sendMessage(defineBotCommandData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.removeBotCommand = function (params, callback) {
            var defineBotCommandData = {
                chatMessageVOType: chatMessageVOTypes.REMOVE_BOT_COMMANDS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            }, commandList = [];

            if (params) {
                if (typeof params.botName !== 'string' || params.botName.length === 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You need to insert a botName!'
                    });
                    return;
                }

                if (!Array.isArray(params.commandList) || !params.commandList.length) {
                    chatEvents.fireEvent('error', {
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to remove bot commands'
                });
                return;
            }

            return chatMessaging.sendMessage(defineBotCommandData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.startBot = function (params, callback) {
            var startBotData = {
                chatMessageVOType: chatMessageVOTypes.START_BOT,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };
            if (params) {
                if (typeof +params.threadId !== 'number' || params.threadId < 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Enter a valid Thread Id for Bot to start in!'
                    });
                    return;
                }
                if (typeof params.botName !== 'string' || params.botName.length === 0) {
                    chatEvents.fireEvent('error', {
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to create bot commands'
                });
                return;
            }
            return chatMessaging.sendMessage(startBotData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.stopBot = function (params, callback) {
            var stopBotData = {
                chatMessageVOType: chatMessageVOTypes.STOP_BOT,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };
            if (params) {
                if (typeof +params.threadId !== 'number' || params.threadId < 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Enter a valid Thread Id for Bot to stop on!'
                    });
                    return;
                }
                if (typeof params.botName !== 'string' || params.botName.length === 0) {
                    chatEvents.fireEvent('error', {
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to create bot commands'
                });
                return;
            }
            return chatMessaging.sendMessage(stopBotData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.getBotCommandsList = function (params, callback) {
            var getBotCommandsListData = {
                chatMessageVOType: chatMessageVOTypes.BOT_COMMANDS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof params.botName !== 'string' || params.botName.length === 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You need to insert a botName!'
                    });
                    return;
                }

                getBotCommandsListData.content = JSON.stringify({
                    botName: params.botName.trim()
                });

            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to get bot commands'
                });
                return;
            }

            return chatMessaging.sendMessage(getBotCommandsListData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.getThreadAllBots = function (params, callback) {
            var getThreadBotsData = {
                chatMessageVOType: chatMessageVOTypes.THREAD_ALL_BOTS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof +params.threadId !== 'number' || params.threadId < 0) {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Enter a valid Thread Id to get all Bots List!'
                    });
                    return;
                }

                getThreadBotsData.subjectId = +params.threadId;

            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to get thread\' bots list!'
                });
                return;
            }

            return chatMessaging.sendMessage(getThreadBotsData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.createTag = function (params, callback) {
            var createTagData = {
                chatMessageVOType: chatMessageVOTypes.CREATE_TAG,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof params.tagName === 'string' && params.tagName.length > 0) {
                    createTagData.content.name = params.tagName;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No tag name has been declared!`
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Create New Tag!'
                });
                return;
            }

            return chatMessaging.sendMessage(createTagData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.editTag = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.EDIT_TAG,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (parseInt(params.tagId) > 0) {
                    sendData.subjectId = +params.tagId;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No Tag Id has been sent!`
                    });
                    return;
                }

                if (typeof params.tagName === 'string' && params.tagName.length > 0) {
                    sendData.content.name = params.tagName;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No tag name has been declared!`
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Edit Tag!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.deleteTag = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.DELETE_TAG,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (parseInt(params.tagId) > 0) {
                    sendData.subjectId = +params.tagId;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: `No Tag Id has been sent!`
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Delete Tag!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.getTagList = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.GET_TAG_LIST,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.addTagParticipants = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.ADD_TAG_PARTICIPANT,
                typeCode: generalTypeCode, //params.typeCode,
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Add Tag PArticipants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.removeTagParticipants = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.REMOVE_TAG_PARTICIPANT,
                typeCode: generalTypeCode, //params.typeCode,
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
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Remove Tag Participants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.registerAssistant = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.REGISTER_ASSISTANT,
                typeCode: generalTypeCode, //params.typeCode,
                content: []
            };

            if (params) {
                if (Array.isArray(params.assistants) && typeof params.assistants[0] === 'object') {
                    for (var i = 0; i < params.assistants.length; i++) {
                        if (typeof params.assistants[i] === 'object'
                            && params.assistants[i].hasOwnProperty('contactType')
                            && !!params.assistants[i].contactType
                            && params.assistants[i].hasOwnProperty('roleTypes')
                            && Array.isArray(params.assistants[i].roleTypes)
                            && params.assistants[i].roleTypes.length
                            && params.assistants[i].hasOwnProperty('assistant')
                            && params.assistants[i].assistant.hasOwnProperty('id')
                            && params.assistants[i].assistant.hasOwnProperty('idType')
                            && params.assistants[i].assistant.id.length
                            && inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
                            sendData.content.push({
                                contactType: params.assistants[i].contactType,
                                roleTypes: params.assistants[i].roleTypes,
                                assistant: {
                                    id: params.assistants[i].assistant.id,
                                    idType: +inviteeVOidTypes[params.assistants[i].assistant.idType]
                                }
                            });
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: 'You should send an array of Assistant Objects each containing of contactType, roleTypes and assistant itself!'
                            });
                            return;
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You should send an array of Assistant Objects each containing of contactType, roleTypes and assistant itself!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Create Assistants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.deactivateAssistant = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.DEACTIVATE_ASSISTANT,
                typeCode: generalTypeCode, //params.typeCode,
                content: []
            };

            if (params) {
                if (Array.isArray(params.assistants) && typeof params.assistants[0] === 'object') {
                    for (var i = 0; i < params.assistants.length; i++) {
                        if (typeof params.assistants[i] === 'object'
                            && params.assistants[i].hasOwnProperty('assistant')
                            && params.assistants[i].assistant.hasOwnProperty('id')
                            && params.assistants[i].assistant.hasOwnProperty('idType')
                            && params.assistants[i].assistant.id.length
                            && inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
                            sendData.content.push({
                                assistant: {
                                    id: params.assistants[i].assistant.id,
                                    idType: +inviteeVOidTypes[params.assistants[i].assistant.idType]
                                }
                            });
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: 'You should send an array of Assistant Objects each containing of an assistant!'
                            });
                            return;
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You should send an array of Assistant Objects each containing of an assistant!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Deactivate Assistants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.blockAssistant = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.BLOCK_ASSISTANT,
                typeCode: generalTypeCode, //params.typeCode,
                content: []
            };

            if (params) {
                if (Array.isArray(params.assistants) && typeof params.assistants[0] === 'object') {
                    for (var i = 0; i < params.assistants.length; i++) {
                        if (typeof params.assistants[i] === 'object'
                            && params.assistants[i].hasOwnProperty('assistant')
                            && params.assistants[i].assistant.hasOwnProperty('id')
                            && params.assistants[i].assistant.hasOwnProperty('idType')
                            && params.assistants[i].assistant.id.length
                            && inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
                            sendData.content.push({
                                assistant: {
                                    id: params.assistants[i].assistant.id,
                                    idType: +inviteeVOidTypes[params.assistants[i].assistant.idType]
                                }
                            });
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: 'You should send an array of Assistant Objects each containing of an assistant!'
                            });
                            return;
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You should send an array of Assistant Objects each containing of an assistant!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Block Assistants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.unblockAssistant = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.UNBLOCK_ASSISTANT,
                typeCode: generalTypeCode, //params.typeCode,
                content: []
            };

            if (params) {
                if (Array.isArray(params.assistants) && typeof params.assistants[0] === 'object') {
                    for (var i = 0; i < params.assistants.length; i++) {
                        if (typeof params.assistants[i] === 'object'
                            && params.assistants[i].hasOwnProperty('assistant')
                            && params.assistants[i].assistant.hasOwnProperty('id')
                            && params.assistants[i].assistant.hasOwnProperty('idType')
                            && params.assistants[i].assistant.id.length
                            && inviteeVOidTypes[params.assistants[i].assistant.idType] > 0) {
                            sendData.content.push({
                                assistant: {
                                    id: params.assistants[i].assistant.id,
                                    idType: +inviteeVOidTypes[params.assistants[i].assistant.idType]
                                }
                            });
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: 'You should send an array of Assistant Objects each containing of an assistant!'
                            });
                            return;
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You should send an array of Assistant Objects each containing of an assistant!'
                    });
                    return;
                }
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Unblock Assistants!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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

        this.getAssistantsList = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.GET_ASSISTANTS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof params.contactType === 'string' && params.contactType.length) {
                    sendData.content.contactType = params.contactType;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Enter a ContactType to get all related Assistants!'
                    });
                    return;
                }

                sendData.content.count = !!params.count ? +params.count : 50;
                sendData.content.offset = !!params.offset ? +params.offset : 0;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to get Assistants list!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.getBlockedAssistantsList = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.BLOCKED_ASSISTANTS,
                typeCode: generalTypeCode, //params.typeCode,
                content: {},
                pushMsgType: 3,
                token: token
            };

            if (params) {
                if (typeof params.contactType === 'string' && params.contactType.length) {
                    sendData.content.contactType = params.contactType;
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Enter a ContactType to get all Blocked Assistants!'
                    });
                    return;
                }

                sendData.content.count = !!params.count ? +params.count : 50;
                sendData.content.offset = !!params.offset ? +params.offset : 0;
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to get Blocked Assistants list!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.getAssistantsHistory = function (params, callback) {
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.ASSISTANT_HISTORY,
                typeCode: generalTypeCode, //params.typeCode,
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

            if (!!params.actionType && assistantActionTypes.hasOwnProperty(params.actionType.toUpperCase())) {
                sendData.content.actionType = assistantActionTypes[params.actionType.toUpperCase()];
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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
                                hasNext: (sendData.content.offset + sendData.content.count < result.contentCount && messageLength > 0),
                                nextOffset: sendData.content.offset * 1 + messageLength * 1
                            };

                        returnData.result = resultData;
                    }

                    callback && callback(returnData);
                    callback = undefined;
                }
            });
        };

        this.mapReverse = mapReverse;

        this.mapSearch = mapSearch;

        this.mapRouting = mapRouting;

        this.mapStaticImage = mapStaticImage;

        this.setAdmin = function (params, callback) {
            setRoleToUser(params, callback);
        };

        this.removeAdmin = function (params, callback) {
            removeRoleFromUser(params, callback);
        };

        this.setAuditor = function (params, callback) {
            setRoleToUser(params, callback);
        };

        this.removeAuditor = function (params, callback) {
            removeRoleFromUser(params, callback);
        };

        function requestExportChat(stackArr, wantedCount, stepCount, offset, sendData) {
            sendData.content.offset = offset;
            sendData.content.count = stepCount;
            return new Promise(function(resolve, reject){
                return chatMessaging.sendMessage(sendData, {
                    onResult: function (result) {
                        var returnData = {
                            hasError: result.hasError,
                            cache: false,
                            errorMessage: result.errorMessage,
                            errorCode: result.errorCode
                        };

                        if (!returnData.hasError) {
                            for(var i in result.result) {
                                stackArr.push(result.result[i]);
                            }

                            consoleLogging && console.log("[SDK][exportChat] a step passed...");
                            wantedCount = wantedCount > result.contentCount ? result.contentCount : wantedCount;
                            setTimeout(function () {
                                chatEvents.fireEvent('threadEvents', {
                                    type: 'EXPORT_CHAT',
                                    subType: 'IN_PROGRESS',
                                    threadId: sendData.subjectId,
                                    percent: Math.floor((stackArr.length / wantedCount) * 100)
                                });

                                if(stackArr.length < wantedCount) {
                                    stepCount = wantedCount - stackArr.length < stepCount ? wantedCount - stackArr.length : stepCount;
                                    //setTimeout(function () {
                                    resolve(requestExportChat(stackArr, wantedCount, stepCount, stackArr.length, sendData));
                                    //}, 1000)
                                } else {
                                    resolve(stackArr);
                                }
                            });
                        } else {
                            if(result.errorCode !== 21) {
                                consoleLogging && console.log("[SDK][exportChat] Problem in one step... . Rerunning the request.", wantedCount, stepCount, stackArr.length, sendData, result);
                                setTimeout(function () {
                                    resolve(requestExportChat(stackArr, wantedCount, stepCount, stackArr.length, sendData))
                                }, 2000)
                            } else {
                                reject(result)
                            }
                        }
                    }
                });
            })
        }

        this.exportChat = function (params, callback) {
            var stackArr = [], wantedCount = 10000, stepCount = 500, offset = 0;
            var sendData = {
                chatMessageVOType: chatMessageVOTypes.EXPORT_CHAT,
                typeCode: generalTypeCode,//params.typeCode,
                content: {
                    offset: +params.offset > 0 ? +params.offset : offset,
                    count: +params.count > 0 ? +params.count : wantedCount,//config.getHistoryCount,
                },
                subjectId: params.threadId
            };

            if (+params.fromTime > 0 && +params.fromTime < 9999999999999) {
                sendData.content.fromTime = +params.fromTime;
            }

            if (+params.toTime > 0 && +params.toTime < 9999999999999) {
                sendData.content.toTime = +params.toTime;
            }

            if(+params.wantedCount > 0) {
                wantedCount = params.wantedCount;
            }

            if(+params.stepCount > 0) {
                stepCount = params.stepCount;
            }

            if(+params.offset > 0) {
                offset = params.offset;
            }

            // if (params.messageType && typeof params.messageType.toUpperCase() !== 'undefined' && chatMessageTypes[params.messageType.toUpperCase()] > 0) {
            //     sendData.content.messageType = chatMessageTypes[params.messageType.toUpperCase()];
            // }
            sendData.content.messageType = 1;

            if(wantedCount < stepCount)
                stepCount = wantedCount;

            consoleLogging && console.log("[SDK][exportChat] Starting...");
            requestExportChat(stackArr, wantedCount, stepCount, offset, sendData).then(function (result) {
                consoleLogging && console.log("[SDK][exportChat] Export done..., Now converting...");

                var exportedFilename = (params.fileName || 'export-' + params.threadId) + '.csv',
                    responseType = params.responseType !== null ? params.responseType : "blob",
                    autoStartDownload = params.autoStartDownload !== null ? params.autoStartDownload : true

                var str = ''
                    , universalBOM = "\uFEFF";

                str += "\u{62A}\u{627}\u{631}\u{6CC}\u{62E} " + ','; //tarikh
                str += " \u{633}\u{627}\u{639}\u{62A} " + ','; //saat
                str += "\u{646}\u{627}\u{645} \u{641}\u{631}\u{633}\u{62A}\u{646}\u{62F}\u{647}" + ',';//name ferestande
                str += "\u{646}\u{627}\u{645} \u{6A9}\u{627}\u{631}\u{628}\u{631}\u{6CC} \u{641}\u{631}\u{633}\u{62A}\u{646}\u{62F}\u{647}" + ','; //name karbariye ferestande
                str += "\u{645}\u{62A}\u{646} \u{67E}\u{6CC}\u{627}\u{645}" + ',';//matne payam
                str += '\r\n';
                var line = '', radif = 1;
                for (var i = 0; i < result.length; i++) {
                    line = '';

                    if(result[i].messageType !== 1) {
                        continue;
                    }

                    var sender = '';
                    if(result[i].participant.contactName) {
                        sender = result[i].participant.contactName + ',';
                    } else {
                        if(result[i].participant.firstName) {
                            sender = result[i].participant.firstName + ' ';
                        }
                        if(result[i].participant.lastName) {
                            sender += result[i].participant.lastName;
                        }
                        sender += ','
                    }

                    line += new Date(result[i].time).toLocaleDateString('fa-IR') + ',';
                    line += new Date(result[i].time).toLocaleTimeString('fa-IR') + ',';
                    line += sender;
                    line += result[i].participant.username + ',';
                    line += result[i].message.replaceAll(",", ".").replace(/(\r\n|\n|\r)/gm, " ") + ',';

                    str += line + '\r\n';
                    radif++;
                }
                var blob = new Blob([str], { type: 'text/csv;charset=utf-8;' });
                chatEvents.fireEvent('threadEvents', {
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
                if(responseType === 'link') {
                    var link = document.createElement("a"),
                        url = URL.createObjectURL(blob);
                    //if (link.download !== undefined) { // feature detection
                        // Browsers that support HTML5 download attribute
                    link.setAttribute("href", 'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM + str));
                    link.setAttribute("download", exportedFilename);
                    if(autoStartDownload) {
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                    //}
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
                }
                //}
                callback = undefined;
            })/*.catch(function (result) {
                consoleLogging && console.log(result);
            });*/
        }

        this.startCall = callModule.startCall;

        this.startGroupCall = callModule.startGroupCall;

        this.callReceived = callModule.callReceived;

        this.terminateCall = callModule.terminateCall;

        this.acceptCall = callModule.acceptCall;

        this.rejectCall = this.cancelCall = callModule.rejectCall

        this.endCall = callModule.endCall;

        this.startRecordingCall = callModule.startRecordingCall;

        this.stopRecordingCall = callModule.stopRecordingCall;

        this.startScreenShare = callModule.startScreenShare;

        this.resizeScreenShare = callModule.resizeScreenShare

        this.endScreenShare = callModule.endScreenShare;

        this.getCallsList = callModule.getCallsList;

        this.getCallsToJoin = callModule.getCallsToJoin;

        this.deleteFromCallList = callModule.deleteFromCallList;

        this.getCallParticipants = callModule.getCallParticipants;

        this.addCallParticipants = callModule.addCallParticipants;

        this.removeCallParticipants = callModule.removeCallParticipants;

        this.muteCallParticipants = callModule.muteCallParticipants;

        this.unMuteCallParticipants = callModule.unMuteCallParticipants;

        this.turnOnVideoCall = callModule.turnOnVideoCall;

        this.turnOffVideoCall = callModule.turnOffVideoCall;

        this.disableParticipantsVideoReceive = callModule.disableParticipantsVideoReceive;

        this.enableParticipantsVideoReceive = callModule.enableParticipantsVideoReceive;

        this.pauseCamera = callModule.pauseCamera;

        this.resumeCamera = callModule.resumeCamera;

        this.pauseMice = callModule.pauseMice;

        this.resumeMice = callModule.resumeMice;

        this.resizeCallVideo = callModule.resizeCallVideo;

        this.restartMedia = callModule.restartMedia;

        this.callStop = callModule.callStop;

        this.sendCallMetaData = callModule.sendCallMetaData;

        this.getMutualGroups = function (params, callback) {
            var count = +params.count ? +params.count : 50,
                offset = +params.offset ? +params.offset : 0;

            var sendData = {
                chatMessageVOType: chatMessageVOTypes.MUTUAL_GROUPS,
                typeCode: generalTypeCode,//params.typeCode,
                content: {
                    count: count,
                    offset: offset
                }
            };

            if (params) {
                if (typeof params.user === 'object'
                    && params.user.hasOwnProperty('id')
                    && params.user.hasOwnProperty('idType')
                    && params.user.id.length
                    && inviteeVOidTypes[params.user.idType] > 0) {
                    sendData.content.toBeUserVO = {
                        id: params.user.id,
                        idType: +inviteeVOidTypes[params.user.idType]
                    };
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'You should send an user object like {id: 92, idType: "TO_BE_USER_CONTACT_ID"}'
                    });
                    return;
                }

            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to Get Mutual Groups!'
                });
                return;
            }

            return chatMessaging.sendMessage(sendData, {
                onResult: function (result) {
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
                                hasNext: (offset + count < result.contentCount && messageLength > 0),
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

        this.sendLocationPing = function (params, callback) {
            /**
             * + locationPingRequest     {object}
             *    + content              {list} A map of { location: string, locationId: int }
             */

            var locationPingData = {
                chatMessageVOType: chatMessageVOTypes.LOCATION_PING,
                typeCode: generalTypeCode, //params.typeCode,
                pushMsgType: 3,
                token: token
            }, content = {};

            if (params) {
                if (typeof params.location === 'string' && locationPingTypes.hasOwnProperty(params.location.toUpperCase())) {
                    content.location = locationPingTypes[params.location.toUpperCase()];

                    if (params.location.toUpperCase() === 'THREAD') {
                        if (typeof params.threadId === 'number' && params.threadId > 0) {
                            content.locationId = +params.threadId;
                        } else {
                            chatEvents.fireEvent('error', {
                                code: 999,
                                message: 'You set the location to be a thread, you have to send a valid ThreadId'
                            });
                            return;
                        }
                    }
                } else {
                    chatEvents.fireEvent('error', {
                        code: 999,
                        message: 'Send a valid location type (CHAT / THREAD / CONTACTS)'
                    });
                    return;
                }

                locationPingData.content = JSON.stringify(content);
            } else {
                chatEvents.fireEvent('error', {
                    code: 999,
                    message: 'No params have been sent to LocationPing!'
                });
                return;
            }

            return chatMessaging.sendMessage(locationPingData, {
                onResult: function (result) {
                    callback && callback(result);
                }
            });
        };

        this.clearChatServerCaches = clearChatServerCaches;

        this.deleteCacheDatabases = deleteCacheDatabases;

        this.clearCacheDatabasesOfUser = clearCacheDatabasesOfUser;

        this.getChatState = function () {
            return chatFullStateObject;
        };

        this.reconnect = function () {
            asyncClient.reconnectSocket();
        };

        this.setToken = function (newToken) {
            if (typeof newToken !== 'undefined') {
                token = newToken;
                callModule.updateToken(token);
                chatMessaging.updateToken(token);
                chatEvents.updateToken(token);
            }
        };

        this.generateUUID = Utility.generateUUID;

        this.logout = function () {
            clearChatServerCaches();

            chatEvents.clearEventCallbacks();

            chatMessaging.messagesCallbacks = {};
            chatMessaging.sendMessageCallbacks = {};
            chatMessaging.threadCallbacks = {};

            asyncClient.logout();
        };

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
        this.checkTURNServer =  function (turnIp, port, useUDP = false, username = 'mkhorrami', password = 'mkh_123456', timeout) {
            let url = 'turn:' + turnIp + ':' + port + '?transport=' + (useUDP ? 'udp' : 'tcp');
            const turnConfig = {
                urls: url,
                username: username,
                credential: password
            }

            if(navigator.userAgent.indexOf('firefox') !== -1 && navigator.userAgent.indexOf('92.0.5') !== -1) {
                alert('Browser version is not suitable for video call. Upgrade or use another browser.');
            }

            console.log('turnConfig: ', turnConfig);
            return new Promise(function (resolve, reject) {

                let promiseResolved;
                setTimeout(function () {
                    if (promiseResolved) return;
                    resolve(false);
                    promiseResolved = true;
                }, timeout || 5000);

                promiseResolved = false;
                let myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection //compatibility for firefox and chrome
                    , pc = new myPeerConnection({iceServers: [turnConfig]}),
                    noop = function () {
                    };
                pc.createDataChannel(""); //create a bogus data channel
                pc.createOffer(function (sdp) {
                    if (sdp.sdp.indexOf('typ relay') > -1) { // sometimes sdp contains the ice candidates...
                        promiseResolved = true;
                        resolve(true);
                    }
                    pc.setLocalDescription(sdp, noop, noop);
                }, noop); // create offer and set local description
                pc.onicecandidate = function (ice) { //listen for candidate events
                    if (promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay') > -1)) return;
                    promiseResolved = true;
                    resolve(true);
                };
            });
        }

        init();
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = Chat;
    }
    if(window) {
        if (!window.POD) {
            window.POD = {};
        }
        window.POD.Chat = Chat;
    }
})();
