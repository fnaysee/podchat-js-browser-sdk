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
}

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
}

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
}

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
}

const reactionsListRequestsParams = {};
function getReactionList(
    {
        threadId,
        messageId,
        count = 20,
        offset = 0,
        sticker = null,
        uniqueId = null
    }) {

    let sendData = {
        chatMessageVOType: chatMessageVOTypes.REACTION_LIST,
        subjectId: threadId,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: {
            sticker: sticker,
            messageId: messageId,
            count: count,
            offset: offset
        },
        token: sdkParams.token,
        uniqueId
    };

    reactionsListRequestsParams[uniqueId] = sendData.content;

    let cachedResult = store.reactionsList.getItem(messageId, sticker, count, offset);
    if(cachedResult) {
        cachedResult = JSON.parse(JSON.stringify(cachedResult));
        chatEvents.fireEvent('messageEvents', {
            type: 'REACTIONS_LIST',
            uniqueId: uniqueId,
            messageId: messageId,
            result: cachedResult
        });
    }

    if(!cachedResult || !cachedResult.isValid) {
        return messenger().sendMessage(sendData);
    }
}

function getReactionsSummaries(params) {
    let sendData = {
            chatMessageVOType: chatMessageVOTypes.REACTION_COUNT,
            typeCode: sdkParams.generalTypeCode, //params.typeCode,
            token: sdkParams.token,
            subjectId: params.threadId,
            uniqueId: Utility.generateUUID()
        },
        cachedIdsValid = store.reactionSummaries.getValids(params.messageIds),
        cachedIdsInValid = store.reactionSummaries.getInValids(params.messageIds),
        nonExistingIds = store.reactionSummaries.getNotExists(params.messageIds);

    nonExistingIds.forEach(item=>{
        store.reactionSummaries.initItem(item, {});
    });

    if(nonExistingIds.length || cachedIdsInValid.length) {
        sendData.content = [...nonExistingIds, ...cachedIdsInValid];
        let res = messenger().sendMessage(sendData);
    }

    if(cachedIdsInValid.length || cachedIdsValid.length) {
        let mergedResult = [...cachedIdsValid, ...cachedIdsInValid];
        setTimeout(()=>{
            let res = store.reactionSummaries.getMany(mergedResult);
            res = JSON.parse(JSON.stringify(res));
            chatEvents.fireEvent('messageEvents', {
                type: 'REACTION_SUMMARIES',
                uniqueId: sendData.uniqueId,
                result: res
            });
        }, 100);
    }

    return {uniqueId: sendData.uniqueId};
}

function onReactionSummaries(uniqueId, messageContent) {
    let msgContent = JSON.parse(JSON.stringify(messageContent));
    store.reactionSummaries.addMany(messageContent);
    msgContent.forEach(item => {
        item.isValid = true
    });
    chatEvents.fireEvent('messageEvents', {
        type: 'REACTION_SUMMARIES',
        uniqueId: uniqueId,
        result: msgContent
    })
}

function onReactionList(uniqueId, messageContent) {
    if(!reactionsListRequestsParams[uniqueId]) {
        return
    }

    const rq = reactionsListRequestsParams[uniqueId];
    store.reactionsList.save(reactionsListRequestsParams[uniqueId], messageContent);

    let cachedResult = store.reactionsList.getItem(rq.messageId, rq.sticker, rq.count, rq.offset);
    if(cachedResult) {
        cachedResult = JSON.parse(JSON.stringify(cachedResult));
    }
    chatEvents.fireEvent('messageEvents', {
        type: 'REACTIONS_LIST',
        uniqueId: uniqueId,
        messageId: rq.messageId,
        result: cachedResult
    });
    delete reactionsListRequestsParams[uniqueId];
}

function onRemoveReaction(uniqueId, messageContent, contentCount) {
    if (store.messagesCallbacks[uniqueId]) {
        store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
    }

    store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
    if(store.user().isMe(messageContent.reactionVO.participantVO.id))
        store.reactionSummaries.removeMyReaction(messageContent.messageId);

    store.reactionsList.invalidateCache(messageContent.messageId, messageContent.reactionVO.reaction);


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

    store.reactionsList.invalidateCache(messageContent.messageId, messageContent.oldSticker);
    store.reactionsList.invalidateCache(messageContent.messageId, messageContent.reactionVO.reaction);

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

    store.reactionsList.invalidateCache(messageContent.messageId, messageContent.reactionVO.reaction);

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
    onReactionList,
    onRemoveReaction,
    onReplaceReaction,
    onAddReaction
}