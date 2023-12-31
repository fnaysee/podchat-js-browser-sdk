
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

class ReactionsListCache {
    constructor(props) {
        // super(props);
        this._list = {};
    }

    get list() {
        return this._list;
    }

    getItem(messageId, sticker = null, count, offset) {
        if(!sticker)
            sticker = 'all';

        if(
            !this.messageExists(messageId)
            || !this._list[messageId][sticker]
            || !this._list[messageId][sticker][this.genKey(count, offset)]
        )
            return null;

        return {
            messageId,
            sticker,
            count,
            offset,
            reactionVOList: this._list[messageId][sticker][this.genKey(count, offset)]
            // isValid: this._list[messageId][sticker].isValid
        }
    }

    removeCachedData(messageId, sticker) {
        if(!messageId)
            return this.removeAllMessages();
            // return this.invalidateAllMessages();

        if(!sticker) {
            return delete this._list[messageId]
            // return this.invalidateMessage(messageId);
        }

        if(this._list[messageId] && this._list[messageId][sticker])
            delete this._list[messageId][sticker];
            // this._list[messageId][sticker].isValid = false;
        if(this._list[messageId] && this._list[messageId]['all'])
            delete this._list[messageId]['all'];
            // this._list[messageId]['all'].isValid = false;
    }

    // invalidateAllMessages() {
    //     Object.keys(this._list).forEach(item=>{
    //         this.invalidateMessage(item)
    //     })
    //
    // }

    // invalidateMessage(messageId) {
    //     let item = this._list[messageId];
    //     if(item && typeof item === 'object') {
    //         Object.keys(item).forEach(objKey=> {
    //             if(objKey && item[objKey] && typeof item[objKey] === "object") {
    //                 item[objKey].isValid = false;
    //             }
    //         })
    //     }
    // }
    messageExists(messageId) {
        return !!this._list[messageId];
    }

    stickerExists(messageId, sticker = null) {
        if(!sticker)
            return !!this._list[messageId] && !!this._list[messageId]['all'];
        else
            return !!this._list[messageId] && !!this._list[messageId][sticker];
    }

    save(request, result) {
        let cClass = this,
        sticker = request.sticker ? request.sticker : 'all';
        if(!this.messageExists(request.messageId)) {
            this._list[request.messageId] = {};
        }
        if(!this.stickerExists(request.messageId, sticker)) {
            this._list[request.messageId][sticker] = {};
        }

        this._list[request.messageId][sticker][this.genKey(request.count, request.offset)] = result;
    }

    genKey(count, offset) {
        return `count:${count},offset:${offset}`
    }

    removeAllMessages() {
        this._list = {};
    }
}
export {ReactionsListCache}