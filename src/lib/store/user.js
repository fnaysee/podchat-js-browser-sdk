let localUser = null;

function setSDKUser(serverUSer) {
    localUser = serverUSer;
}

function user(){
    return localUser
}

export {setSDKUser, user};