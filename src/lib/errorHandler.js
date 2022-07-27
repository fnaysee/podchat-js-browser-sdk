import {chatEvents} from "../events.module";

const errorList = [
    {
        code: 12000,
        message: "[SDK] Call not started or invalid callId"
    },
    /**
     * 12400-12499 Media devices
     */
    {
        code: 12400,
        message: "Could not grant video input permission"
    },
    {
        code: 12401,
        message: "Could not grant audio input permission"
    },
    {
        code: 12402,
        message: "Could not grant audio out permission"
    },
    {
        code: 12403,
        message: "Current environment does not supports user media devices"
    },
    /**
     * 12700-12720 Call stickers
     */
    {
        code: 12700,
        message: "[SDK] Invalid sticker name. Use SDK.callStickerTypes"
    },
];
let messagingModule;

const init = function (params) {
    messagingModule = params.chatMessaging;
}

const handleError = function (error) {
    let item = errorList.filter(item => item.code == error);
    if(!item.length)
        return {};

    return item[0];
};

const raiseError = function (errorObject, callback, firEvent = false, {
    eventName = 'error',
    eventType = null
}) {
    callback && callback({
        hasError: true,
        errorCode: errorObject.code,
        errorMessage: errorObject.message
    });

    firEvent && chatEvents.fireEvent(eventName, {
        type: eventType,
        code: errorObject.code,
        message: errorObject.message
    });

    return { hasError: true, ...errorObject };
}

export default handleError
export { init, errorList, raiseError }
