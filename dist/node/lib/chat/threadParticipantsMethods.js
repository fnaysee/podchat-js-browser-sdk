"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatDataToMakeParticipant = formatDataToMakeParticipant;
exports.getThreadParticipants = getThreadParticipants;
exports.reformatThreadParticipants = reformatThreadParticipants;

var _constants = require("../constants");

var _sdkParams = require("../sdkParams");

var _events = require("../../events.module");

var _messaging = require("../../messaging.module");

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
function getThreadParticipants(params, callback) {
  var sendMessageParams = {
    chatMessageVOType: _constants.chatMessageVOTypes.THREAD_PARTICIPANTS,
    typeCode: _sdkParams.sdkParams.generalTypeCode,
    //params.typeCode,
    content: {},
    subjectId: params.threadId
  },
      returnCache = false;
  var offset = parseInt(params.offset) > 0 ? parseInt(params.offset) : 0,
      count = parseInt(params.count) > 0 ? parseInt(params.count) : 20;
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

  return (0, _messaging.messenger)().sendMessage(sendMessageParams, {
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
}
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


function reformatThreadParticipants(participantsContent, threadId) {
  var returnData = [];

  for (var i = 0; i < participantsContent.length; i++) {
    returnData.push(formatDataToMakeParticipant(participantsContent[i], threadId));
  }

  return returnData;
}
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


function formatDataToMakeParticipant(messageContent, threadId) {
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
}