let list = [];
const eventsList = {
    SINGLE_THREAD_UPDATE: "singleThreadUpdate",
    UNREAD_COUNT_UPDATED: 'unreadCountUpdated',
    LAST_SEEN_MESSAGE_TIME_UPDATED: 'lastSeenMessageTimeUpdated',
}

let msgsReactionsStatus = {
    REQUESTED: 1,
    IS_EMPTY: 2,
    HAS_REACTION: 3
}

class ReactionsSummariesCache {
    constructor(app) {
        // super(props);
        this._list = {};
        this._app = app;
    }

    get list() {
        return this._list;
    }

    getMany(messageIds) {
        let result = [];
        messageIds.forEach(msgId => {
            let localItem = this.getItem(msgId);

            if(this.hasAnyReaction(localItem)){
                if(!localItem.userReaction) {
                    result.push({messageId: msgId, reactionCountVO: localItem.reactionCountVO});
                } else {
                    result.push({messageId: msgId, reactionCountVO: localItem.reactionCountVO, userReaction: localItem.userReaction});

                }
            }
        });
        return result;
    }

    getItem(messageId) {
        return this._list[messageId];
    }

    messageExists(messageId) {
        return !!this._list[messageId];
    }

    filterExists(messageIds) {
      return messageIds.filter(item => this.messageExists(item));
    }

    addMany(data) {
        data.forEach(item => {
            if(!this.messageExists(item.messageId)) {
                this.initItem(item.messageId, item);
            } else {
                this.updateItem(item.messageId, item);
            }
        })
    }

    initItem(messageId, data) {
        let cClass = this;
        let item =  this.messageExists(messageId);
        if(!item) {
            this._list[messageId] = {
                ...data,
                hasReaction(sticker) {
                    return !!cClass._list[messageId].reactionCountVO.find(item => item.sticker === sticker);
                }
            };
        }
    }

    updateItem(messageId, item){
        let localItem = this.getItem(messageId);
        if(this.hasAnyReaction(localItem))  {
            item.reactionCountVO && item.reactionCountVO.forEach(itt => {
                if(!localItem.hasReaction(itt.sticker)) {
                    this._list[messageId].reactionCountVO.push(itt);
                } else {
                    this._list[messageId].reactionCountVO.forEach(it2 => {
                        if(it2.sticker === itt.sticker) {
                            it2.count = itt.count;
                        }
                    });
                }
            });
        } else {
            this._list[messageId].reactionCountVO = item.reactionCountVO;
        }
        this._list[messageId].setHasReactionStatus(msgsReactionsStatus.HAS_REACTION);
        if(item.userReaction)
            this._list[messageId].userReaction = item.userReaction;
    }

    increaseCount(messageId, reaction, userId) {
        let item;
        if(this.messageExists(messageId)) {
            item = this.getItem(messageId);
            let found = false;
            item.reactionCountVO?.forEach(it => {
                if(it.sticker == reaction){
                    it.count++;
                    found = true;
                }
            });
            if(!found) {
                if(!item.reactionCountVO) {
                    item.reactionCountVO = []
                }
                item.reactionCountVO.push({
                    sticker: reaction,
                    count: 1
                });
            }
        }
    }
    decreaseCount(messageId, reaction, userId) {
        if(this.messageExists(messageId)) {
            let message = this.getItem(messageId),
                removed = false;
            message.reactionCountVO.forEach((it, index) => {
                if(it.sticker == reaction){
                    if(it.count > 1)
                        it.count--;
                    else {
                        removed = true;
                        message.reactionCountVO && delete message.reactionCountVO[index]
                    }
                }
            });
            if(removed) {
                message.reactionCountVO = message.reactionCountVO.filter(item=>item !== undefined);
            }

            // if(!message.reactionCountVO.length)
            //     delete this._list[messageId]
        }
    }

    hasAnyReaction(message){
        if(!message || !message.reactionCountVO || !message.reactionCountVO.length){
            return false;
        }

        return true;
    }
    maybeUpdateMyReaction(messageId, reactionId, reaction, userId, time) {
        let message = this.getItem(messageId);
        if(!message)
            return;
        if(this._app.store.user.isMe(userId)) {
            this._list[messageId].userReaction = {
                id: reactionId,
                reaction: reaction,
                time: time
            }
        }
    }
    addMyReaction(messageId){
        let message = this.getItem(messageId)
        if(!message)
            return;

    }
    removeMyReaction(messageId) {
        let message = this.getItem(messageId)
        if(!message)
            return;
        if(message.userReaction)
            delete this._list[messageId].userReaction;

        this._list[messageId] = JSON.parse(JSON.stringify(this._list[messageId]));
    }
    removeAllMessages() {
        this._list = {};
    }
}

export {ReactionsSummariesCache}