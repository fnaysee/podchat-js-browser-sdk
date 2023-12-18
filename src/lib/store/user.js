class SDKUser {
    constructor() {
        this._user = null;
    }

    get(){
        return this._user;
    }

    setUser(data){
        this._user = data;
    }

    isMe(userId){
        return this._user.id == userId
    }
}

export {SDKUser};