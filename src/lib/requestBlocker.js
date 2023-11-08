
function RequestBlocker() {


    const requestsList = [];

    let limitedTypes = {
        START_STOP_CALL: "START_STOP_CALL",
        START_STOP_VIDEO_VOICE: 'START_STOP_VIDEO_VOICE',
    };

    function find(key) {
        return requestsList.find(item => item && item.key == key)
    }

    function add({
                     uniqueId,
                     time = null,
                     key,
                     blockTimeSeconds = 1
                 }) {
        // if(!uniqueId)
        //     uniqueId = Utility.generateUUID();
        if (!time)
            time = new Date().getTime();

        // app.chatEvents.fireEvent("requestBlocker", {
        //     type: "REQUESTS_BLOCKED",
        //     key: key
        // });
        blockTimeSeconds *= 1000;
        requestsList.push({
            uniqueId, time, key, blockTimeSeconds,
            timeout: setTimeout(() => {
                remove(uniqueId)
            }, blockTimeSeconds)
        });
    }

    function isKeyBlocked(key) {
        let filteredRequest = find(key);

        if (!filteredRequest) {
            return false;
        }

        let cTime = new Date().getTime();

        if (filteredRequest.time + filteredRequest.blockTimeSeconds > cTime) {
            // alert(`Request Blocked
            // \nSDK Prevents fast calls to specific apis. Please prevent this in your UI.
            // \nCurrent api can be requested after at least ${filteredRequests[i].blockTimeSeconds} seconds.`);
            return true;
        } else {
            remove(filteredRequest.uniqueId);
        }

        return false;
    }

    function remove(uniqueId) {
        let index = requestsList.findIndex(item => item && item.uniqueId == uniqueId);
        if (index > -1) {
            // if(requestsList[index].time + 8000 < new Date().getTime()) {
            clearTimeout(requestsList[index].timeout);
            delete requestsList[index];
            // }
        }
    }

    function getRemainingTime(key) {
        let filteredRequest = find(key);


        if (!filteredRequest) {
            return 0;
        }

        let cTime = new Date().getTime();
        console.log({filteredRequest}, (filteredRequest.time + filteredRequest.blockTimeSeconds) - cTime)
        return new Date((filteredRequest.time + filteredRequest.blockTimeSeconds) - cTime).getSeconds()
    }

    return {
        add,
        remove,
        isKeyBlocked,
        limitedTypes,
        getRemainingTime
    }
}

export default RequestBlocker