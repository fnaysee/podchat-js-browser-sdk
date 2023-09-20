import {store} from "./index";

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
    constructor(props) {
        // super(props);
        this._list = {};
    }

    get list() {
        return this._list;
    }

    getMany(messageIds) {
        let result = [];
        messageIds.forEach(msgId => {
            let localItem = this.getItem(msgId);
            if(localItem && localItem.hasAnyReaction())
                result.push({reactionCountVO: localItem.reactionCountVO, userReaction: localItem.userReaction})
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
                hasReactionStatus: msgsReactionsStatus.REQUESTED,
                setHasReactionStatus(status) {
                    cClass._list[messageId].hasReactionStatus = status
                },
                hasAnyReaction() {
                    return cClass._list[messageId].hasReactionStatus === msgsReactionsStatus.HAS_REACTION
                },
                hasReaction(sticker) {
                    return !!cClass._list[messageId].reactionCountVO.find(item => item.sticker === sticker);
                }
            };
        }
    }

    updateItem(messageId, item){
        let localItem = this.getItem(messageId);
        if(!localItem.hasAnyReaction()) {
            this._list[messageId].reactionCountVO = item.reactionCountVO;
        } else {
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
            item.reactionCountVO.forEach(item => {
                if(item.reaction == reaction){
                    item.count++;
                    found = true;
                }
            });
            if(!found) {
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
                if(it.reaction == reaction){
                    if(it.count > 1)
                        it.count--;
                    else {
                        removed = true;
                        delete it.reactionCountVO[index]
                    }
                }
            });
            if(removed) {
                message.reactionCountVO = message.reactionCountVO.filter(item=>item !== undefined);
            }

            if(!message.reactionCountVO.length)
                delete this._list[messageId]
        }
    }
    maybeUpdateMyReaction(messageId, reactionId, reaction, userId, time) {
        let message = this.getItem(messageId)
        if(!message)
            return;
        if(userId == store.user().isMe(userId)) {
            if (!message.userReaction) {
                this._list[messageId].userReaction = {
                    id: reactionId,
                    reaction: reaction,
                    time: time
                }
            } else if (message.userReaction.id == reactionId) {
                this._list[messageId].userReaction.reaction = reaction;
                this._list[messageId].userReaction.time = time;
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
const reactionsSummariesCache = new ReactionsSummariesCache();
export {reactionsSummariesCache}