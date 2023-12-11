import {chatMessageVOTypes} from "../../constants";

function InquiryCallParticipants(app) {
    function inquiryCallParticipants({}, callback) {
        let sendMessageParams = {
            chatMessageVOType: chatMessageVOTypes.INQUIRY_CALL,
            typeCode: app.sdkParams.generalTypeCode,//params.typeCode,
            subjectId: app.callsManager.currentCallId,
            content: {}
        };

        return app.messenger.sendMessage(sendMessageParams, {
            onResult: function (result) {
                let returnData = {
                    hasError: result.hasError,
                    cache: false,
                    errorMessage: result.errorMessage,
                    errorCode: result.errorCode
                };

                if (!returnData.hasError) {
                    let messageContent = result.result,
                        messageLength = messageContent.length,
                        resultData = {
                            participants: reformatCallParticipants(messageContent),
                            contentCount: result.contentCount,
                        };

                    returnData.result = resultData;
                }

                callback && callback(returnData);
                /**
                 * Delete callback so if server pushes response before
                 * cache, cache won't send data again
                 */
                callback = undefined;

                // returnData.result.callId = app.callsManager.currentCallId;

                if (!returnData.hasError) {
                    app.chatEvents.fireEvent('callEvents', {
                        type: 'ACTIVE_CALL_PARTICIPANTS',
                        result: returnData.result
                    });
                }
            }
        });
    }

    /**
     * Reformat Call Participants
     *
     * This functions reformats given Array of call Participants
     * into proper call participant
     *
     * @access private
     *
     * @param {object}  participantsContent   Array of Call Participant Objects
     * @param {int}    threadId              Id of call
     *
     * @return {object} Formatted Call Participant Array
     */
    function reformatCallParticipants (participantsContent) {
        let returnData = [];

        for (let i = 0; i < participantsContent.length; i++) {
            returnData.push(formatDataToMakeCallParticipant(participantsContent[i]));
        }

        return returnData;
    }

    /**
     * Format Data To Make Call Participant
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
    function formatDataToMakeCallParticipant (messageContent) {
        /**
         * + CallParticipantVO                   {object}
         *    - id                           {int}
         *    - joinTime                     {int}
         *    - leaveTime                    {int}
         *    - threadParticipant            {object}
         *    - sendTopic                    {string}
         *    - receiveTopic                 {string}
         *    - brokerAddress                {string}
         *    - active                       {boolean}
         *    - callSession                  {object}
         *    - callStatus                   {int}
         *    - createTime                   {int}
         *    - sendKey                      {string}
         *    - mute                         {boolean}
         */

        let participant = {
            id: messageContent.id,
            joinTime: messageContent.joinTime,
            leaveTime: messageContent.leaveTime,
            sendTopic: messageContent.sendTopic,
            receiveTopic: messageContent.receiveTopic,
            brokerAddress: messageContent.brokerAddress,
            active: messageContent.active,
            callSession: messageContent.callSession,
            callStatus: messageContent.callStatus,
            createTime: messageContent.createTime,
            sendKey: messageContent.sendKey,
            mute: messageContent.mute
        };

        // Add Chat Participant if exist
        if (messageContent.participantVO) {
            participant.participantVO = messageContent.participantVO;
        }

        // Add Call Session if exist
        if (messageContent.callSession) {
            participant.callSession = messageContent.callSession;
        }

        // return participant;
        return JSON.parse(JSON.stringify(participant));
    }

    return {
        inquiryCallParticipants,

    }
}

export default InquiryCallParticipants;