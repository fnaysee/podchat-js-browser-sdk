
const deprecatedString = {
    turnOffVideoCall: {
        deprecationDate: "",
        methodName: "turnOffVideoCall",
        replacementString: ""
    },
    turnOnVideoCall: {
        deprecationDate: "",
        methodName: "turnOnVideoCall",
        replacementString: ""
    },
    muteCallParticipants: {
        deprecationDate: "",
        methodName: "muteCallParticipants",
        replacementString: ""
    },
    unMuteCallParticipants: {
        deprecationDate: "",
        methodName: "unMuteCallParticipants",
        replacementString: ""
    },
    uploadFile: {
        deprecationDate: "",
        methodName: "uploadFile",
        replacementString: ""
    },
    uploadImage: {
        deprecationDate: "",
        methodName: "uploadImage",
        replacementString: ""
    },
    getFile: {
        deprecationDate: "",
        methodName: "getFile",
        replacementString: ""
    },
    getImage: {
        deprecationDate: "",
        methodName: "getImage",
        replacementString: ""
    },
    deleteCacheDatabases: {
        deprecationDate: "26/6/2023",
        methodName: "deleteCacheDatabases",
        replacementString: ""
    },
    startCacheDatabases: {
        deprecationDate: "26/6/2023",
        methodName: "startCacheDatabases",
        replacementString: ""
    },
    clearCacheDatabasesOfUser: {
        deprecationDate: "26/6/2023",
        methodName: "clearCacheDatabasesOfUser",
        replacementString: ""
    },

}

function printIsDeprecate(key){
    console.warn("||| Method: " + deprecatedString[key].methodName + " is deprecated! "+ (deprecatedString[key].replacementString ? (" use " + deprecatedString[key].replacementString + "instead. ") : "") + ( deprecatedString[key].deprecationDate ? " Deprecation Date: " + deprecatedString[key].deprecationDate : "" )) ;
}
export {printIsDeprecate,deprecatedString}
