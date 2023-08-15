function User(user) {
    const config = {
        user
    }

    return {
        id: user.id,
        get() {
            return config.user
        }
    }
}

let localUser = null;

function setSDKUser(serverUSer) {
    localUser = serverUSer; //new User(serverUSer);
    console.log({serverUSer})
    console.log({localUser}, localUser.id);
}
function user(){
    return localUser
}
export {setSDKUser, user};