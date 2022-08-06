import {chatEvents} from "../events.module";

const errorList = {
    INVALID_CALLID: {
        code: 12000,
        message:"[SDK] Call not started or invalid callId"
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
let messagingModule;

const init = function (params) {
    messagingModule = params.chatMessaging;
}

const handleError = function (error) {
    let item = Object.values(errorList).filter(item => item.code == error);
    if(!item.length)
        return {};

    return item[0];
};

const raiseError = function (errorObject, callback, firEvent = false, {
    eventName = 'error',
    eventType = null,
    environmentDetails = null
}) {
    callback && callback({
        hasError: true,
        errorCode: errorObject.code,
        errorMessage: errorObject.message
    });

    firEvent && chatEvents.fireEvent(eventName, {
        type: eventType,
        code: errorObject.code,
        message: errorObject.message,
        environmentDetails
    });

    return { hasError: true, ...errorObject };
}

export default handleError
export { init, errorList, raiseError }
