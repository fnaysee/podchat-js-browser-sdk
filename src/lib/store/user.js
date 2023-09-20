let localUser = null;

function setSDKUser(serverUSer) {
    localUser = serverUSer;
    localUser.isMe = (userId) => {
        return localUser.id == userId;
    }
}

function user(){
    return localUser
}

export {setSDKUser, user};