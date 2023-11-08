import SharedData from "./sharedData";

function Call(app){
    const call = {};
    const sharedData = new SharedData(app);
    call.currentCall = sharedData.currentCall;
    call.callStopQueue = sharedData.callStopQueue;
    call.calculateScreenSize = sharedData.calculateScreenSize;
    call.sharedVariables = sharedData.sharedVariables;
    call.callClientType = sharedData.callClientType;
    call.callTypes = sharedData.callTypes;
    call.joinCallParams = sharedData.joinCallParams;
    call.endScreenShare = sharedData.endScreenShare;
    call.currentCall = sharedData.currentCall;
    call.endCall = sharedData.endCall;
    call.audioCtx = sharedData.audioCtx;

    return call;
}

export default Call;