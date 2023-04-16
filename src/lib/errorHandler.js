import {chatEvents} from "../events.module";

const errorList = {
    INVALID_CALLID: {
        code: 12000,
        message:"[SDK] Call not started or invalid callId"
    },
    SOCKET_NOT_CONNECTED: {
        code: 12002,
        message:"[SDK] Async is not connected"
    },
    SOCKET_CONNECTION_FAILED: {
        code: 12003,
        message:"[SDK] Async socket connection failed"
    },
    /**
     * 12350-12399
     */
    INVITEES_LIST_REQUIRED: {
        code: 12350,
        message: "Invitees list is required"
    },
    INVITEES_LIST_OR_THREAD_ID_REQUIRED: {
        code: 12351,
        message: "Invitees list or threadId is required"
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

const raiseError = function (errorObject, callback, fireEvent = false, {
    eventName = 'error',
    eventType = null,
    environmentDetails = null
}) {
    callback && callback({
        hasError: true,
        errorCode: errorObject.code,
        errorMessage: errorObject.message
    });

    fireEvent && chatEvents.fireEvent(eventName, {
        type: eventType,
        code: errorObject.code,
        message: errorObject.message,
        environmentDetails
    });

    return { hasError: true, ...errorObject };
}

export default handleError
export { init, errorList, raiseError }
