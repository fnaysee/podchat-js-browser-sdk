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
}

export {SDKUser};