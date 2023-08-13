"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.systemMessageTypes = exports.inviteeVOidTypes = exports.imageMimeTypes = exports.imageExtentions = exports.emojiTypes = exports.createThreadTypes = exports.chatMessageVOTypes = exports.chatMessageTypes = exports.callStickerTypes = exports.assistantActionTypes = void 0;
var chatMessageVOTypes = {
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
  GET_MESSAGE_DELIVERY_PARTICIPANTS: 32,
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
  DESTINED_RECORD_CALL: 126,
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
  REMOVE_CONTACTS: 201,
  CONTACT_THREAD_UPDATE: 220,
  SWITCH_TO_GROUP_CALL_REQUEST: 221,
  RECORD_CALL_STARTED: 222,
  ARCHIVE_THREAD: 223,
  UNARCHIVE_THREAD: 224,
  CALL_STICKER_SYSTEM_MESSAGE: 225,
  CUSTOMER_INFO: 226,
  RECALL_THREAD_PARTICIPANT: 227,
  CALL_RECORDING_FAILED: 230,
  LAST_MESSAGE_INFO: 234,
  GET_PIN_MESSAGE: 236,
  GET_THREAD_LIGHT: 237,
  REPLY_PRIVATELY: 238,
  ADD_REACTION: 239,
  REPLACE_REACTION: 240,
  REMOVE_REACTION: 241,
  REACTION_LIST: 242,
  ERROR: 999
};
exports.chatMessageVOTypes = chatMessageVOTypes;
var inviteeVOidTypes = {
  TO_BE_USER_SSO_ID: 1,
  TO_BE_USER_CONTACT_ID: 2,
  TO_BE_USER_CELLPHONE_NUMBER: 3,
  TO_BE_USER_USERNAME: 4,
  TO_BE_USER_ID: 5,
  TO_BE_CORE_USER_ID: 6
};
exports.inviteeVOidTypes = inviteeVOidTypes;
var createThreadTypes = {
  NORMAL: 0x0,
  OWNER_GROUP: 0x1,
  PUBLIC_GROUP: 0x2,
  CHANNEL_GROUP: 0x4,
  CHANNEL: 0x8,
  NOTIFICATION_CHANNEL: 0x10,
  PUBLIC_THREAD: 0x20,
  PUBLIC_CHANNEL: 0x40,
  SELF: 0x80
};
exports.createThreadTypes = createThreadTypes;
var chatMessageTypes = {
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
};
exports.chatMessageTypes = chatMessageTypes;
var assistantActionTypes = {
  REGISTER: 1,
  ACTIVATE: 2,
  DEACTIVATE: 3,
  BLOCK: 4
};
exports.assistantActionTypes = assistantActionTypes;
var systemMessageTypes = {
  IS_TYPING: '1',
  RECORD_VOICE: '2',
  UPLOAD_PICTURE: '3',
  UPLOAD_VIDEO: '4',
  UPLOAD_SOUND: '5',
  UPLOAD_FILE: '6'
};
exports.systemMessageTypes = systemMessageTypes;
var imageMimeTypes = ['image/bmp', 'image/png', 'image/tiff', 'image/x-icon', 'image/jpeg', 'image/webp'];
exports.imageMimeTypes = imageMimeTypes;
var imageExtentions = ['bmp', 'png', 'tiff', 'tiff2', 'ico', 'jpg', 'jpeg', 'webp'];
exports.imageExtentions = imageExtentions;
var callStickerTypes = {
  RAISE_HAND: 'raise_hand',
  LIKE: 'like',
  DISLIKE: 'dislike',
  CLAP: 'clap',
  HEART: 'heart',
  HAPPY: 'happy',
  ANGRY: 'angry',
  CRY: 'cry',
  POWER: 'power',
  BORED: 'bored'
};
exports.callStickerTypes = callStickerTypes;
var emojiTypes = {
  HI_FIVE: 1,
  LIKE: 2,
  HAPPY: 3,
  CRY: 4
};
exports.emojiTypes = emojiTypes;