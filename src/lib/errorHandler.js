const errorList = {
    INVALID_CALLID: {
        code: 12000,
        message:"[SDK] Call not started or invalid callId"
    },
    SOCKET_NOT_CONNECTED: {
        code: 12002,
        message:"[SDK] Async is not connected"
    },
    REQUEST_BLOCKED: {
        code: 12003,
        message:`[SDK] Requests to {methodName} has been blocked for next {seconds} seconds.`,
        variables: ['{methodName}', '{seconds}']
    },
    CALL_SERVER_ERROR: {
        code: 12004,
        message:`[SDK] ERROR from call server: {errorMessage}`,
        variables: ['{errorMessage}']
    },
    INVALID_APP_ID: {
        code: 12005,
        message:"[SDK] AppId is not valid. it should be a string with maximum of 30 characters"
    },
    /**
     * 12350-12399
     */
    INVITEES_LIST_REQUIRED: {
        code: 12350,
        message: "Invitees list is required"
    },
    /**
     * 12400-12499 Media devices
     */
    VIDEO_PERMISSION_ERROR: {
        code: 12400,
        message: "Could not grant video input permission"
    },
    AUDIO_PERMISSION_ERROR: {
        code: 12401,
        message: "Could not grant audio input permission"
    },
    AUDIO_OUT_PERMISSION_ERROR: {
        code: 12402,
        message: "Could not grant audio out permission"
    },
    MEDIA_DEVICES_NOT_SUPPORTED: {
        code: 12403,
        message: "Current environment does not supports user media devices"
    },
    SCREENSHARE_PERMISSION_ERROR: {
        code: 12404,
        message: "Could not grant screen share permission"
    },
    NO_AUDIO_TRACKS_AVAILABLE: {
        code: 12405,
        message: "Audio stream has no tracks"
    },
    AUDIO_TRACK_MUTED: {
        code: 12406,
        message: "Audio track is muted and is not useful anymore, request the permission again"
    },
    AUDIO_TRACK_ENDED: {
        code: 12407,
        message: "Audio track is ended and is not useful anymore, request the permission again"
    },
    AUDIO_TRACK_DISABLED: {
        code: 12408,
        message: "Audio track is disabled, enable it to be able to send voice"
    },


    /**
     * 12550-12570 ScreenShare
     */
    SCREENSHARE_NOT_STARTED: {
        code: 12550,
        message: "ScreenShare not started "
    },
    NOT_SCREENSHARE_OWNER: {
        code: 12551,
        message: "You are not ScreenShare owner"
    },
    SCREENSHARE_ALREADY_STARTED: {
        code: 12552,
        message: "ScreenShare already started "
    },

    /**
     * 12700-12720 Call stickers
     */
    INVALID_STICKER_NAME: {
        code: 12700,
        message: "[SDK] Invalid sticker name. Use SDK.callStickerTypes"
    },
};

function ErrorHandler(app) {
    function handleError(error) {
        let item = Object.values(errorList).filter(item => item.code == error);
        if(!item.length)
            return {};

        return item[0];
    }

    function getFilledErrorObject(errorObject) {
        for(let i in errorObject.variables) {
            errorObject.message = errorObject.message.replace(errorObject.variables[i], errorObject.replacements[i])
        }
        return errorObject;
    }

    function raiseError(errorObject, callback, fireEvent = false, {
        eventName = 'error',
        eventType = null,
        environmentDetails = null
    }) {
        callback && callback({
            hasError: true,
            errorCode: errorObject.code,
            errorMessage: errorObject.message
        });

        fireEvent && app.chatEvents.fireEvent(eventName, {
            type: eventType,
            code: errorObject.code,
            message: errorObject.message,
            environmentDetails
        });

        return { hasError: true, ...errorObject };
    }

    return {
        handleError,
        raiseError,
        getFilledErrorObject
    }
}


export default ErrorHandler
export {errorList}
