import {chatMessageVOTypes} from "../constants";
import {sdkParams} from "../sdkParams";
import {chatEvents} from "../../events.module";
import {api2} from "./index";
import Utility from "../../utility/utility";

function get(
    {
        count = 25,
        offset = 0,
        query = null,
        email = null,
        cellphoneNumber = null,
        contactId = null,
        username = null,
        coreUserId = null
    }
) {
    let content = {};

    content.uniqueId =  Utility.generateUUID();
    content.size = count;
    content.offset = offset;
    content.query = query;

    if (typeof query === 'string') {
        content.query = query;
    }
    if (typeof email === 'string') {
        content.email = email;
    }
    if (typeof cellphoneNumber === 'string') {
        content.cellphoneNumber = cellphoneNumber;
    }
    if (parseInt(contactId) > 0) {
        content.id = contactId;
    }
    if (typeof username === 'string') {
        content.username = username;
    }
    if (typeof coreUserId !== "undefined") {
        content.coreUserId = coreUserId;
    }

    let sendMessageParams = {
        chatMessageVOType: chatMessageVOTypes.GET_CONTACTS,
        typeCode: sdkParams.generalTypeCode, //params.typeCode,
        content: content
    };

    /**
     * Retrieve Contacts from server
     */
    return api2.messenger.sendMessage(sendMessageParams);
}

const contact = {
    get,
    onGetResult: null
}

export {contact}