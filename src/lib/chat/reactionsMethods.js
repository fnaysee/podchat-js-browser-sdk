import {chatMessageVOTypes} from "../constants";
import {sdkParams} from "../sdkParams";
import {messenger} from "../../messaging.module";
import {store} from "../store";
import Utility from "../../utility/utility";
import {chatEvents} from "../../events.module";

function addReaction(params, callback) {
    let sendData = {
        chatMessageVOType: chatMessageVOTypes.ADD_REACTION,
        subjectId: params.threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            messageId: params.messageId,
            reaction: params.reaction
        },
        token: sdkParams.token
    };

    return messenger().sendMessage(sendData);
};

function getMyReaction(params, callback) {
    let sendData = {
        chatMessageVOType: chatMessageVOTypes.GET_MY_REACTION,
        subjectId: params.threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            messageId: params.messageId
        },
        token: sdkParams.token
    };

    return messenger().sendMessage(sendData, {
        onResult: function (result) {
            callback && callback(result);
        }
    });
};

function replaceReaction(params, callback) {
    let sendData = {
        chatMessageVOType: chatMessageVOTypes.REPLACE_REACTION,
        subjectId: params.threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            reactionId: params.reactionId,
            reaction: params.reaction
        },
        token: sdkParams.token
    };

    return messenger().sendMessage(sendData, {
        onResult: function (result) {
            callback && callback(result);
        }
    });
};

function removeReaction(params, callback) {
    let sendData = {
        chatMessageVOType: chatMessageVOTypes.REMOVE_REACTION,
        subjectId: params.threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            reactionId: params.reactionId
        },
        token: sdkParams.token
    };

    return messenger().sendMessage(sendData, {
        onResult: function (result) {
            callback && callback(result);
        }
    });
};

function getReactionList(params, callback) {
    let count = 20,
        offset = 0

    if (params) {
        if (parseInt(params.count) > 0) {
            count = params.count;
        }

        if (parseInt(params.offset) > 0) {
            offset = params.offset;
        }
    }
    let sendData = {
        chatMessageVOType: chatMessageVOTypes.REACTION_LIST,
        subjectId: params.threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            sticker: params.sticker,
            messageId: params.messageId,
            count: count,
            offset: offset
        },
        token: sdkParams.token
    };

    return messenger().sendMessage(sendData, {
        onResult: function (result) {
            callback && callback(result);
        }
    });
};

function getReactionsSummaries(params) {
    let sendData = {
            chatMessageVOType: chatMessageVOTypes.REACTION_COUNT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            token: sdkParams.token,
            subjectId: params.threadId,
            uniqueId: Utility.generateUUID()
        },
        cachedIds = store.reactionSummaries.filterExists(params.messageIds);

    params.messageIds.forEach(item=>{
        store.reactionSummaries.initItem(item, {});
    });

    const difference = params.messageIds.reduce((result, element) => {
        if (cachedIds.indexOf(element) === -1) {
            result.push(element);
        }
        return result;
    }, []);

    if(difference.length) {
        sendData.content = difference;
        let res = messenger().sendMessage(sendData);
        // reactionSummariesRequest = {
        //     uniqueId: sendData.uniqueId,
        //     difference
        // };
    }

    if(cachedIds && cachedIds.length) {
        setTimeout(()=>{
            let messageContent = store.reactionSummaries.getMany(cachedIds);
            messageContent = JSON.parse(JSON.stringify(messageContent));
            chatEvents.fireEvent('messageEvents', {
                type: 'REACTION_SUMMARIES',
                uniqueId: sendData.uniqueId,
                result: messageContent
            });
        }, 100);
    }

    return {uniqueId: sendData.uniqueId};
}

function onReactionSummaries(uniqueId, messageContent) {
    let msgContent = JSON.parse(JSON.stringify(messageContent));
    store.reactionSummaries.addMany(messageContent);

    // reactionSummariesRequest.difference.forEach(item => {
    //     if(!store.reactionsSummaries.messageExists(item)) {
    //         store.reactionsSummaries.addItem(item, {})
    //     }
    // })

    chatEvents.fireEvent('messageEvents', {
        type: 'REACTION_SUMMARIES',
        uniqueId: uniqueId,
        result: msgContent
    })
}

function onRemoveReaction(uniqueId, messageContent, contentCount) {
    if (store.messagesCallbacks[uniqueId]) {
        store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    if(store.user().isMe(messageContent.reactionVO.participantVO.id))
        store.reactionSummaries.removeMyReaction(messageContent.messageId);

    chatEvents.fireEvent('messageEvents', {
        type: 'REMOVE_REACTION',
        result: messageContent
    });
}

function onReplaceReaction(uniqueId, messageContent, contentCount) {
    if (store.messagesCallbacks[uniqueId]) {
        store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.oldSticker);
    store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    store.reactionSummaries.maybeUpdateMyReaction(
        messageContent.messageId,
        messageContent.reactionVO.id,
        messageContent.reactionVO.reaction,
        messageContent.reactionVO.participantVO.id,
        messageContent.reactionVO.time
    );

    chatEvents.fireEvent('messageEvents', {
        type: 'REPLACE_REACTION',
        result: messageContent
    });
}

function onAddReaction(uniqueId, messageContent, contentCount) {
    if (store.messagesCallbacks[uniqueId]) {
        store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }
    let msgContent = JSON.parse(JSON.stringify(messageContent));
    store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    store.reactionSummaries.maybeUpdateMyReaction(
        messageContent.messageId,
        messageContent.reactionVO.id,
        messageContent.reactionVO.reaction,
        messageContent.reactionVO.participantVO.id,
        messageContent.reactionVO.time
    );
    // if(store.user().isMe(messageContent.reactionVO.participantVO.id))
    //     store.reactionSummaries.addMyReaction(messageContent.messageId);

    // chatEvents.fireEvent('messageEvents', {
    //     type: 'REACTION_SUMMARIES',
    //     uniqueId: uniqueId,
    //     result: [store.reactionSummaries.getItem(messageContent.messageId)]
    // })
    chatEvents.fireEvent('messageEvents', {
        type: 'ADD_REACTION',
        result: msgContent
    });
}

export {
    getReactionsSummaries,
    getReactionList,
    removeReaction,
    replaceReaction,
    getMyReaction,
    addReaction,
    onReactionSummaries,
    onRemoveReaction,
    onReplaceReaction,
    onAddReaction
}