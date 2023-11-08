import {errorList} from "../errorHandler";
import {chatMessageVOTypes} from "../constants";

function SharedData(app) {

    const callStopQueue = {
            callStarted: false,
        },
        callClientType = {
            WEB: 1,
            ANDROID: 2,
            DESKTOP: 3
        },
        callTypes = {
            'VOICE': 0x0,
            'VIDEO': 0x1
        },
        joinCallParams = {
            cameraPaused: false,
        };

    const sharedVariables = {
        globalCallRequestTimeout: null,
        callTurnIp: null,
        useInternalTurnAddress: null,
        callDivId: null,
        callAudioTagClassName: null,
        callVideoTagClassName: null,
        callVideoMinWidth: null,
        callVideoMinHeight: null,
        requestedCallId: null,
        acceptedCallId: null,
        currentCallId: null,
        callNoAnswerTimeout: null,
        callStreamCloseTimeout: null,
        asyncClient: null,
        callOptions: null,
        startScreenSharetParams: {
            quality: 3
        },
        deviceManager: null,
        audioCtx: null
    };

    function audioCtx() {
        if (!sharedVariables.audioCtx)
            sharedVariables.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return sharedVariables.audioCtx;
    }

    function endCall(params, callback) {
        app.sdkParams.consoleLogging && console.log('[SDK][endCall] called...');

        let endCallData = {
            chatMessageVOType: chatMessageVOTypes.END_CALL_REQUEST,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: app.sdkParams.token
        };

        if (params) {
            if (typeof +params.callId === 'number' && params.callId > 0) {
                endCallData.subjectId = +params.callId;
            } else {
                app.errorHandler.raiseError(errorList.INVALID_CALLID, callback, true, {});
                return;
            }
        } else {
            app.chatEvents.fireEvent('error', {
                code: 999,
                message: 'No params have been sent to End the call!'
            });
            return;
        }

        return app.messenger.sendMessage(endCallData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

    function endScreenShare(params, callback) {
        let cCall = app.callsManager.get(app.callsManager.currentCallId)
        if (!cCall) {
            app.errorHandler.raiseError(errorList.INVALID_CALLID, callback, true, {});
            return;
        }

        let sendData = {
            chatMessageVOType: chatMessageVOTypes.END_SCREEN_SHARE,
            typeCode: app.sdkParams.generalTypeCode, //params.typeCode,
            pushMsgType: 3,
            token: app.sdkParams.token,
            subjectId: app.callsManager.currentCallId,
        };

        if (!sendData.subjectId) {
            cCall.raiseCallError(errorList.INVALID_CALLID, callback, true, {});
            return;
        }
        if (!cCall.screenShareInfo.isStarted()) {
            cCall.raiseCallError(errorList.SCREENSHARE_NOT_STARTED, callback, true);
            return
        } else {
            cCall.users().removeItem("screenShare")
        }
        if (!cCall.screenShareInfo.iAmOwner()) {
            cCall.raiseCallError(errorList.NOT_SCREENSHARE_OWNER, callback, true);
            return;
        }

        return app.messenger.sendMessage(sendData, {
            onResult: function (result) {
                callback && callback(result);
            }
        });
    }

    function calculateScreenSize({quality = 3}) {
        let screenSize = window.screen
            , qualities = [
            {
                width: Math.round(screenSize.width / 3),
                height: Math.round(window.screen.height / 3)
            },
            {
                width: Math.round(screenSize.width / 2),
                height: Math.round(screenSize.height / 2)
            },
            {
                width: screenSize.width,
                height: screenSize.height
            },
            {
                width: Math.round(screenSize.width * 1.6),
                height: Math.round(screenSize.height * 1.6)
            },
        ]
            , selectedQuality = quality ? +quality - 1 : 3
            , qualityObj = qualities[selectedQuality];

        return qualityObj;
    }

    function currentCall() {
        return app.callsManager.get(app.callsManager.currentCallId);
    }

    function currentCallMyUser() {
        return currentCall().users().get(app.store.user.get().id);
    }

    return {
        calculateScreenSize,
        currentCallMyUser,
        callStopQueue,
        sharedVariables,
        callClientType,
        callTypes,
        joinCallParams,
        endScreenShare,
        currentCall,
        endCall,
        audioCtx
    }
}

export default SharedData