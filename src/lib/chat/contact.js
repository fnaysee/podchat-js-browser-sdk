import {chatMessageVOTypes} from "../constants";
import {sdkParams} from "../sdkParams";
import {chatEvents} from "../../events.module";

function get() {
    var count = 25,
        offset = 0,
        content = {},
        returnCache = false;

    if (params) {
        if (parseInt(params.count) > 0) {
            count = parseInt(params.count);
        }
        if (parseInt(params.offset) > 0) {
            offset = parseInt(params.offset);
        }
        if (typeof params.query === 'string') {
            content.query = params.query;
        }
        if (typeof params.email === 'string') {
            content.email = params.email;
        }
        if (typeof params.cellphoneNumber === 'string') {
            content.cellphoneNumber = params.cellphoneNumber;
        }
        if (parseInt(params.contactId) > 0) {
            content.id = params.contactId;
        }
        if (typeof params.uniqueId === 'string') {
            content.uniqueId = params.uniqueId;
        }
        if (typeof params.username === 'string') {
            content.username = params.username;
        }
        if (typeof params.coreUserId !== "undefined") {
            content.coreUserId = params.coreUserId;
        }

        var functionLevelCache = (typeof params.cache == 'boolean') ? params.cache : true;
    }

    content.size = count;
    content.offset = offset;

    var sendMessageParams = {
        chatMessageVOType: chatMessageVOTypes.GET_CONTACTS,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: content
    };

    /**
     * Retrieve Contacts from server
     */
    return chatMessaging.sendMessage(sendMessageParams);
}
function getResultHandler() {

}


const contact = {
    get,
    getResultHandler
}