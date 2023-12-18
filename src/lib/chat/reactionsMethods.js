import {chatMessageVOTypes} from "../constants";
import Utility from "../../utility/utility";

function ReactionsMethods(app) {
    const reactionsListRequestsParams = {};
    const reactionSummariesRequests = {};

    function addReaction(params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.ADD_REACTION,
            subjectId: params.threadId,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            content: {
                messageId: params.messageId,
                reaction: params.reaction
            },
            token: app.sdkParams.token
        };

        return app.messenger.sendMessage(sendData);
    }

    function getMyReaction(params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.GET_MY_REACTION,
            subjectId: params.threadId,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            content: {
                messageId: params.messageId
            },
            token: app.sdkParams.token
        };

        return app.messenger.sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

    function replaceReaction(params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.REPLACE_REACTION,
            subjectId: params.threadId,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            content: {
                reactionId: params.reactionId,
                reaction: params.reaction
            },
            token: app.sdkParams.token
        };

        return app.messenger.sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

    function removeReaction(params, callback) {
        let sendData = {
            chatMessageVOType: chatMessageVOTypes.REMOVE_REACTION,
            subjectId: params.threadId,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            content: {
                reactionId: params.reactionId
            },
            token: app.sdkParams.token
        };

        return app.messenger.sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

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
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            content: {
                messageId: messageId,
                count: count,
                offset: offset
            },
            token: app.sdkParams.token,
            uniqueId
        };

        if(sticker && sticker != 'null') {
            sendData.content.sticker = sticker;
        }

        if(!sendData.uniqueId)
            sendData.uniqueId = Utility.generateUUID();

        reactionsListRequestsParams[sendData.uniqueId] = sendData.content;

        let cachedResult = app.store.reactionsList.getItem(messageId, sticker, count, offset);
        if(cachedResult) {
            cachedResult = JSON.parse(JSON.stringify(cachedResult));
            app.chatEvents.fireEvent('messageEvents', {
                type: 'REACTIONS_LIST',
                uniqueId: sendData.uniqueId,
                messageId: messageId,
                result: cachedResult
            });
        }

        if(!cachedResult) {
            return app.messenger.sendMessage(sendData);
        }
    }

    function getReactionsSummaries(params) {
        let sendData = {
                chatMessageVOType: chatMessageVOTypes.REACTION_COUNT,
                typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
                token: app.sdkParams.token,
                subjectId: params.threadId,
                uniqueId: (params.uniqueId ? params.uniqueId : Utility.generateUUID())
            },
            cachedIds = app.store.reactionSummaries.filterExists(params.messageIds);

        reactionSummariesRequests[sendData.uniqueId] = params.messageIds;

        const difference = params.messageIds.reduce((result, element) => {
            if (cachedIds.indexOf(element) === -1) {
                result.push(element);
            }
            return result;
        }, []);

        if(difference.length) {
            sendData.content = difference;
            let res = app.messenger.sendMessage(sendData);
        }

        if(cachedIds && cachedIds.length) {
            setTimeout(()=>{
                let messageContent = app.store.reactionSummaries.getMany(cachedIds);
                messageContent = JSON.parse(JSON.stringify(messageContent));
                app.chatEvents.fireEvent('messageEvents', {
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
        app.store.reactionSummaries.addMany(messageContent);

        if(reactionSummariesRequests[uniqueId] && reactionSummariesRequests[uniqueId].length) {
            reactionSummariesRequests[uniqueId].forEach(item => {
                app.store.reactionSummaries.initItem(item, {});
            });
        }
        // params.messageIds.forEach(item=>{
        //     store.reactionSummaries.initItem(item, {});
        // });

        app.chatEvents.fireEvent('messageEvents', {
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
        app.store.reactionsList.save(reactionsListRequestsParams[uniqueId], messageContent);


        let cachedResult = app.store.reactionsList.getItem(rq.messageId, rq.sticker, rq.count, rq.offset);
        if(cachedResult) {
            cachedResult = JSON.parse(JSON.stringify(cachedResult));
        }
        app.chatEvents.fireEvent('messageEvents', {
            type: 'REACTIONS_LIST',
            uniqueId: uniqueId,
            messageId: rq.messageId,
            result: cachedResult
        });
        delete reactionsListRequestsParams[uniqueId];
    }

    function onRemoveReaction(uniqueId, messageContent, contentCount) {
        if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        app.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
        if(app.store.user.isMe(messageContent.reactionVO.participantVO.id))
            app.store.reactionSummaries.removeMyReaction(messageContent.messageId);

        app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction);
        // app.store.reactionsList.removeReactionCache(messageContent.messageId, messageContent.reactionVO.reaction);


        app.chatEvents.fireEvent('messageEvents', {
            type: 'REMOVE_REACTION',
            result: messageContent
        });
    }

    function onReplaceReaction(uniqueId, messageContent, contentCount) {
        if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }

        app.store.reactionSummaries.decreaseCount(messageContent.messageId, messageContent.oldSticker);
        app.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
        app.store.reactionSummaries.maybeUpdateMyReaction(
            messageContent.messageId,
            messageContent.reactionVO.id,
            messageContent.reactionVO.reaction,
            messageContent.reactionVO.participantVO.id,
            messageContent.reactionVO.time
        );

        app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.oldSticker);
        app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction);

        app.chatEvents.fireEvent('messageEvents', {
            type: 'REPLACE_REACTION',
            result: messageContent
        });
    }

    function onAddReaction(uniqueId, messageContent, contentCount) {
        if (app.store.messagesCallbacks[uniqueId]) {
            app.store.messagesCallbacks[uniqueId](Utility.createReturnData(false, '', 0, messageContent, contentCount, uniqueId));
        }
        let msgContent = JSON.parse(JSON.stringify(messageContent));
        app.store.reactionSummaries.increaseCount(messageContent.messageId, messageContent.reactionVO.reaction);
        app.store.reactionSummaries.maybeUpdateMyReaction(
            messageContent.messageId,
            messageContent.reactionVO.id,
            messageContent.reactionVO.reaction,
            messageContent.reactionVO.participantVO.id,
            messageContent.reactionVO.time
        );

        app.store.reactionsList.removeCachedData(messageContent.messageId, messageContent.reactionVO.reaction);

        app.chatEvents.fireEvent('messageEvents', {
            type: 'ADD_REACTION',
            result: msgContent
        });
    }

    return {
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
}

export default ReactionsMethods;