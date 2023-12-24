import {chatMessageVOTypes} from "../constants";
import Utility from "../../utility/utility";

function ThreadMethods(app) {
    let pinMessageRequests = {};

    function getPinMessages(params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.GET_PIN_MESSAGE,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            token: app.sdkParams.token,
            // content: params.content
        };

        if (!params.uniqueId) {
            sendData.uniqueId = Utility.generateUUID();
        }

        if (!params.content || !params.content.length) {
            return;
        }

        let mustRequestIds = [],
            existingItems = [];
        params.content.forEach(item => {
            let thread = app.store.threads.findOrCreate({id: item});
            if (!thread.isPinMessageRequested() && !thread.pinMessageVO) {
                mustRequestIds.push(item);
            } else if (thread.pinMessageVO) {
                existingItems.push(JSON.parse(JSON.stringify({id: thread.id, pinMessageVO: thread.pinMessageVO})));
            }
        });

        if (existingItems.length) {
            app.chatEvents.fireEvent('threadEvents', {
                type: 'GET_PIN_MESSAGES',
                result: existingItems,
                uniqueId: sendData.uniqueId
            });
        }

        if (mustRequestIds.length) {

            pinMessageRequests[sendData.uniqueId] = mustRequestIds;
            return app.messenger.sendMessage(sendData);
        }
        //     onResult: function (result) {
        //
        //         callback && callback(result);
        //     }
        // });
    }

    function onGetPinMessages(uniqueId, messageContent, contentCount) {
        if(pinMessageRequests[uniqueId]) {
            let result = [];

            pinMessageRequests[uniqueId].forEach(it => {
                let th = app.store.threads.findOrCreate({
                    id: it.id
                });
                let serverResult = messageContent.length && messageContent.find(item => item.id == th.id);
                if(serverResult) {
                    th.pinMessage.setPinMessage(serverResult.pinMessageVO);
                    result.push(JSON.parse(JSON.stringify({id: th.id, pinMessageVO: serverResult.pinMessageVO})));
                }
                th.pinMessage.setPinMessageRequested(true);
            });

            app.chatEvents.fireEvent('threadEvents', {
                type: 'GET_PIN_MESSAGES',
                result,
                uniqueId
            });
        }
        // if (app.store.messagesCallbacks[uniqueId]) {
        //     app.store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        // }
    }

    return {
        getPinMessages,
        onGetPinMessages
    }
}

export default ThreadMethods