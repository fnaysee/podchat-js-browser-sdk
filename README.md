## Synopsis

**Fanap's POD** Chat service

# Recent Changelog

All notable changes to this project will be documented here.

## [Unreleased]

-   Search in threads metadata

## [4.10.0] - 2019-06-24

### Added

-   ACL functionalities
    - Getting admins list, `getThreadAdmins()`
    - Setting / Removing new admin with roles, `setAdmin()`
-   `isTyping` for users, you can call `startTyping()` and `stopTyping()` to handle typing system messages
-   `clearHistory()` function to fully clear thread's history
-   `deleteMultipleMessages()` function to delete an array of message at once
-   `getNotSeenDuration()` function to get the not seen time duration of user being off the application in miliseconds

In order to see complete list of changelog please visit [ChangeLog](https://github.com/masoudmanson/pod-chat/blob/master/changelog.md)

## Code Example

Create an Javascript file e.x `index.js` and put following code there:

```javascript
var Chat = require('podchat');

var params = {
  appId: new Date().getTime(),
  grantDeviceIdFromSSO: false,
  enableCache: true, // Enable Client side caching
  mapApiKey: "API_KEY_OF_NESHAN_MAP", //  {**REQUIRED**} API Key of Neshan Map
  socketAddress: "ws://172.16.106.26:8003/ws", // {**REQUIRED**} Socket Address
  ssoHost: "http://172.16.110.76", // {**REQUIRED**} Socket Address
  platformHost: "http://172.16.106.26:8080/hamsam", // {**REQUIRED**} Platform Core Address
  fileServer: "http://172.16.106.26:8080/hamsam", // {**REQUIRED**} File Server Address
  serverName: "chat-server", // {**REQUIRED**} Server to to register on
  token: "SSO_TOKEN", // {**REQUIRED**} SSO Token
  wsConnectionWaitTime: 500, // Time out to wait for socket to get ready after open
  connectionRetryInterval: 5000, // Time interval to retry registering device or registering server
  connectionCheckTimeout: 10000, // Socket connection live time on server
  messageTtl: 24 * 60 * 60, // Message time to live (1 day in seonds)
  reconnectOnClose: true, // auto connect to socket after socket close
  asyncLogging: {
    onFunction: true, // log main actions on console
    onMessageReceive: true, // log received messages on console
    onMessageSend: true, // log sent messaged on console
    actualTiming: true // log actual functions running time
  },
  clientName: 'SDK Default example', // used for logging (Sentry)
};

var chatAgent = new Chat(params);
```

## Event Listeners

Listen on these events to get updated data on your client

### chatReady

This is the main Event which fires when your SDK has connected to ASYNC server and gets ready to chat.
**Write your code in chatReady's callback function**

```javascript
chatAgent.on("chatReady", function() {
  /**
   * Your code goes here
   */
});
```

### error

You can get all the Errors here

```javascript
/**
* Listen to Error Messages
*/
chatAgent.on("error", function(error) {
  console.log("Error: ", error.code, error.message);
});
```

### messageEvents

You'll get all the Message Events here

```javascript
/**
 * Listen to Message Events Listener
 */
chatAgent.on("messageEvents", function(event) {
  var type = event.type,
    message = event.result.message;

    switch (type) {
      case "MESSAGE_NEW":
        /**
         * Sending Message Seen to Sender after 5 secs
         */
        setTimeout(function() {
          chatAgent.seen({messageId: message.id, ownerId: message.ownerId});
        }, 5000);

        break;

      case "MESSAGE_EDIT":
        break;

      case "MESSAGE_DELIVERY":
        break;

      case "MESSAGE_SEEN":
        break;

      default:
        break;
    }
});
```

### threadEvents

You'll get all the Events which are related to Threads in threadEvents listener

```javascript
/**
 * Listen to Thread Events
 */
chatAgent.on("threadEvents", function(event) {
  var type = event.type;

  switch (type) {
    case "THREAD_LAST_ACTIVITY_TIME":
      break;

    case "THREAD_NEW":
      break;

    case "THREAD_ADD_PARTICIPANTS":
      break;

    case "THREAD_REMOVE_PARTICIPANTS":
      break;

    case "THREAD_LEAVE_PARTICIPANT":
      break;

    case "THREAD_RENAME":
      break;

    case "THREAD_MUTE":
      break;

    case "THREAD_UNMUTE":
      break;

    case "THREAD_INFO_UPDATED":
      break;

    case "THREAD_UNREAD_COUNT_UPDATED":
      break;

    default:
      break;
  }
});
```

### fileUploadEvents

You'll get all the Events which are related to File Uploads in fileUploadEvents listener

```javascript
/**
 * Listen to File Uploads Event Listener
 */
chatAgent.on("fileUploadEvents", function(event) {
  console.log(event);
});
```

## User Functions

### getUserInfo

Returns current user's Profile Information

```javascript
chatAgent.getUserInfo(function(userInfo) {
  console.log(userInfo);
});
```

### getNotSeenDuration
Takes an Array of user Ids and Returns the time which those users were away in miliseconds

```javascript
/**
 * Get Unseen Duration of users
 * 
 * @param   {list}  usersIds    An array of userIds
 */
chatAgent.getNotSeenDuration({
    userIds: [122, 123]
}, function(result) {
    console.log(result);
});
```

## Thread Functions

### createThread

```javascript
var createThreadTypes = {
  NORMAL: 0,
  OWNER_GROUP: 1,
  PUBLIC_GROUP: 2,
  CHANNEL_GROUP: 4,
  CHANNEL: 8
}

chatAgent.createThread({
    title: "Thread Title Sample",
    type: "NORMAL",
    invitees: [],
    image: "http://yoursite.com/image.jpg",
    description: "Thread Description",
    metadata: {
      key: value
    }
  }, function(createThreadResult) {
    console.log(createThreadResult);
  }
);
```

### getThreads

```javascript
chatAgent.getThreads({
    count: 50,
    offset: 0,
    name: "A String to search in thread titles and return result",
    threadIds: [] // Array of threadIds to get
  }, function(threadsResult) {
    var threads = threadsResult.result.threads;
    console.log(threads);
  }
);
```

### getHistory

To get messages list of a thread, you can use getHistory() function. Accepted parameters are listed below:

-   threadId {number} ** Id of thread to get it's history ** `required`
-   count {number} ** number of messages to get ** `default is 50`
-   offset {number} ** offset of get query ** `default is 0`
-   order {string} ** order of get query ** `default is DESC`
-   id {string} ** ID of single message to get it's content **
-   uniqueIds {array} ** Array of uniqueIds to get those messages from server **
-   query {string} ** A string to search in messages content **
-   metadataCriteria {json} ** A json object to use as entry for GraphQL seach on message's metaData **
-   fromTime {number} ** Return messages those time is bigger than this ** `13 digits (like 1547972096473)`
-   fromTimeNanos {number} ** Nano Second precision for fromTime ** `9 digits (like 473533000)`
-   fromTimeFull {number} ** Instead of fromTme and fromTimeNanos you can send fromTimeFull ** `19 digits (like 1547972096473533000)`
-   toTime {number} ** Return messages those time is smaller than this ** `13 digits (like 1547972096473)`
-   toTimeNanos {number} ** Nano Second precision for toTime ** `9 digits (like 473533000)`
-   toTimeFull {number} ** Instead of toTime and toTimeNanos you can send toTimeFull ** `19 digits (like 1547972096473533000)`

```javascript
chatAgent.getHistory({
    count: 50,
    offset: 0,
    threadId: threadId
  }, function(historyResult) {
    var history = historyResult.result.history;
    console.log(history);
  }
);
```

### clearHistory
This functions clears history of a given thread.

```javascript
/**
 * CLEAR THREAD HISTORY
 * @param threadId
 */
chatAgent.clearHistory({
    threadId: 1431
}, function(result) {
    console.log("Clear history result", result);
});
```

### getThreadParticipants

```javascript
chatAgent.getThreadParticipants({
    count: 50,
    offset: 0,
    threadId: threadId
  }, function(participantsResult) {
    var participants = participantsResult.result.participants;
    console.log(participants);
  }
);
```

### getThreadAdmins
Returns a list of thread admins

```javascript
chatAgent.getThreadAdmins({
    count: 50,
    offset: 0,
    threadId: threadId
  }, function(adminsResult) {
    var admins = adminsResult.result.participants;
    console.log(admins);
  }
);
```

### setAdmin
You can make an user an admin for a thread who is already a participant of that thread. In order to change a participant into
an admin, all you have to do is to call `setAdmin()` and set parameters as needed.
One important point is that if you set `roleOperation` parameter as `add`, the user will grant the roles you gave, and if
you set `roleOperation` parameter as `remove`, those roles will be ungranted.

```javascript
chatAgent.setAdmin({
    threadId: 10349,
    admins: [
        {
            userId: 123,
            roleOperation: 'add',
            roles: [
                'post_channel_message',
                'edit_message_of_others',
                'delete_message_of_others',
                'add_new_user',
                'remove_user',
                'thread_admin',
                'add_rule_to_user',
                'remove_role_from_user',
                'read_thread',
                'edit_thread'
            ]
        }]
}, function(result) {
    console.log(result);
});
```

These roles are currently available to be set or unset:

- post_channel_message
- edit_message_of_others
- delete_message_of_others
- add_new_user
- remove_user
- thread_admin
- add_rule_to_user
- remove_role_from_user
- read_thread
- edit_thread

### addParticipants

```javascript
chatAgent.addParticipants({
  threadId: threadId,
  contacts: [contactId1, contactId2, ...]
}, function(result) {
  console.log(result);
});
```

### removeParticipants

```javascript
chatAgent.removeParticipants({
  threadId: threadId,
  participants: [participantId1, participantId2, ...]
}, function(result) {
  console.log(result);
});
```

### leaveThread

```javascript
chatAgent.leaveThread({
  threadId: threadId
}, function(result) {
  console.log(result);
});
```

### muteThread

```javascript
chatAgent.muteThread({
    subjectId: threadId
  }, function(result) {
    console.log("Threaded has been successfully muted!");
  }
);
```

### unMuteThread

```javascript
chatAgent.unMuteThread({
    subjectId: threadId
  }, function(result) {
    console.log("Threaded has been successfully unMuted!");
  }
);
```

### renameThread

```javascript
chatAgent.renameThread({
    title: newName,
    threadId: threadId
  }, function(result) {
    console.log("Threaded has been successfully Renamed!");
  }
);
```

### updateThreadInfo

```javascript
chatAgent.updateThreadInfo({
  threadId: threadId,
  image: imageUrl,
  description: "This is a sample description for a thread",
  title: "New title for thread",
  metadata: {
    name: "John Doe"
  }
}, function(result) {
  console.log(result);
});
```

### spamPvThread

If one who is not in your contacts list, creates a P2P thread including you. You can simply SPAM him/her by calling spamPvThread() and giving it the thread's ID. Notice that the thread must be a P2P thread and the thread owner should not be in your contacts list.

```javascript
chatAgent.spamPvThread({
  threadId: P2PThreadId
}, function(result) {
  console.log(result);
});
```

## Contact Functions

### getContacts

```javascript
chatAgent.getContacts({
    count: 50,
    offset: 0
  }, function(contactsResult) {
  var contacts = contactsResult.result.contacts;
  console.log(contacts);
});
```

### getBlocked

This function return a list of people who you have blocked already.

```javascript
chatAgent.getBlocked({
    count: 50,
    offset: 0
  }, function(contactsResult) {
    if (!result.hasError) {
      console.log(result);
    }
});
```

### block

In order to block a contact of yours, you can simply call block() function and give that contact's Id as a parameter.

```javascript
chatAgent.block({
  contactId: 2247,
  // threadId: 1018,
  // userId: 121
}, function(result) {
  if (!result.hasError)
    console.log("Contact has been successfully Blocked!");
});
```

### unblock

To unblock an already blocked contact, call unblock() function with block Id of that blocked contact.

```javascript
chatAgent.unblock({
  blockId: 425,
  // contactId: 2247,
  // threadId: 1018,
  // userId: 122
}, function(result) {
  if (!result.hasError)
    console.log("Contact has been successfully unBlocked!");
});
```

### addContacts

```javascript
chatAgent.addContacts({
  firstName: "Firstname",
  lastName: "Lastname",
  cellphoneNumber: "0999999999",
  email: "mail@gmail.com"
}, function(result) {
  console.log(result);
});
```

### updateContacts

```javascript
chatAgent.updateContacts({
    id: 66, //contact's id
    firstName: "Firstname", // new firstname
    lastName: "Lastname",// new lastname
    cellphoneNumber: "0999999999", // new cellphone number
    email: "mail@gmail.com" //new email
}, function(result) {
  console.log(result);
});
```

### removeContacts

```javascript
chatAgent.removeContacts({
  id: 234 // contact's id
}, function(result) {
  console.log(result);
});
```

### searchContacts

To search in contacts list, you can use searchContacts() function. Accepted parameters to search are listed below:

-   cellphoneNumber {string}
-   email {string}
-   firstName {string}
-   lastName {string}
-   uniqueId {string}
-   id {string}
-   typeCode {string}
-   q {string}
-   offset {number}
-   size {number}
    extra information can be found here [listContacts() Documentation](http://sandbox.pod.land:8080/apidocs/swagger-ui.html?srv=/nzh/listContacts)

```javascript
chatAgent.searchContacts({
  id: 234 // contact's id
}, function(result) {
  console.log(result);
});
```

## Message Functions

### sendTextMessage

```javascript
chatAgent.sendTextMessage({
    threadId: threadId,
    content: messageText
  }, {
  onSent: function(result) {
    console.log("\nYour message has been Sent!\n");
    console.log(result);
  },
  onDeliver: function(result) {
    console.log("\nYour message has been Delivered!\n");
    console.log(result);
  },
  onSeen: function(result) {
    console.log("\nYour message has been Seen!\n");
    console.log(result);
  }
});
```

### resendMessage

```javascript
chatAgent.resendMessage(uniqueId, {
  onSent: function(result) {
    console.log("\nYour message has been Sent!\n");
    console.log(result);
  },
  onDeliver: function(result) {
    console.log("\nYour message has been Delivered!\n");
    console.log(result);
  },
  onSeen: function(result) {
    console.log("\nYour message has been Seen!\n");
    console.log(result);
  }
}); // unique id of message to be resent
```

### cancelMessage

```javascript
chatAgent.cancelMessage(uniqueId); // unique id of message to be canceled
```

### getMessageDeliveredList

```javascript
chatAgent.getMessageDeliveredList({
  messageId: 19623
});
```

### getMessageSeenList

```javascript
chatAgent.getMessageSeenList({
  messageId: 19623
});
```

### editMessage

```javascript
chatAgent.editMessage({
    messageId: messageId,
    content: newMessage
  }, {
  onSent: function(result) {
    console.log("Edited Message has been Sent!");
    console.log(result);
  },
  onDeliver: function(result) {
    console.log("Edited Message has been Delivered!");
    console.log(result);
  },
  onSeen: function(result) {
    console.log("Edited Message has been Seen!");
    console.log(result);
  }
});
```

### deleteMessage

In order to delete a message for all, set `deleteForAll` parameter as `TRUE`.

```javascript
/**
 * DELETE MESSAGE IN THREAD
 * @param {int}      messageId
 * @param {boolean}  deleteForAll
 */
chatAgent.deleteMessage({
  messageId: messageId,
  deleteForAll: false
}, function(result) {
  console.log(result);
});
```

### deleteMultipleMessages

In order to delete an array of messages for all, set `deleteForAll` parameter as `TRUE`.

```javascript
/**
 * DELETE MESSAGE IN THREAD
 * 
 * @param {int}      messageId
 * @param {boolean}  deleteForAll
 */
chatAgent.deleteMultipleMessages({
    threadId: 10298,
    messageIds: [47710, 47709, 47708],
    deleteForAll: true
}, function(result) {
    console.log("Delete Multiple Message Result", result);
});
```



### replyMessage

```javascript
chatAgent.replyMessage({
    threadId: threadId,
    repliedTo: messageId,
    content: message
  }, {
  onSent: function(result) {
    console.log("Your reply message has been Sent!");
    console.log(result);
  },
  onDeliver: function(result) {
    console.log("Your reply message has been Delivered!");
    console.log(result);
  },
  onSeen: function(result) {
    console.log("Your reply message has been Seen!");
    console.log(result);
  }
});
```

### replyFileMessage

```javascript
chatAgent.replyFileMessage({
    threadId: threadId,
    repliedTo: messageId,
    file: file,
    content: message
  }, {
  onSent: function(result) {
    console.log("Your reply message has been Sent!");
    console.log(result);
  },
  onDeliver: function(result) {
    console.log("Your reply message has been Delivered!");
    console.log(result);
  },
  onSeen: function(result) {
    console.log("Your reply message has been Seen!");
    console.log(result);
  }
});
```

### forwardMessage

```javascript
var messagesIds = [2539, 2538, 2537];

chatAgent.forwardMessage({
    subjectId: threadId,
    content: JSON.stringify(messagesIds)
  }, {
  onSent: function(result) {
    console.log(result.uniqueId + " \t has been Sent! (FORWARD)");
  },
  onDeliver: function(result) {
    console.log(result.uniqueId + " \t has been Delivered! (FORWARD)");
  },
  onSeen: function(result) {
    console.log(result.uniqueId + " \t has been Seen! (FORWARD)");
  }
});
```

## File functions

### sendFileMessage

```html
<form>
  <fieldset>
    <legend>Send File Message</legend>
    <input type="file" name="sendFileInput" id="sendFileInput">
    <br>
    <label for="sendFileDescription">Description: </label>
    <input type="text" name="sendFileDescription" id="sendFileDescription">
    <button type="button" name="button" id="sendFileMessage">Send</button>
  </fieldset>
</form>
```

```javascript
document.getElementById("sendFileMessage").addEventListener("click", function() {
  var fileInput = document.getElementById("sendFileInput"),
    image = fileInput.files[0],
    content = document.getElementById("sendFileDescription").value;

  chatAgent.sendFileMessage({
    threadId: 293,
    file: image,
    content: content,
    metaData: {custom_name: "John Doe"}
  }, {
    onSent: function(result) {
      console.log(result.uniqueId + " \t has been Sent!");
    },
    onDeliver: function(result) {
      console.log(result.uniqueId + " \t has been Delivered!");
    },
    onSeen: function(result) {
      console.log(result.uniqueId + " \t has been Seen!");
    }
  });
});
```

### cancelFileUpload

If you want to cancel sending of the message with a file upload, You can get uploading file's uniqueId
immediately after calling `sendFileMessage()` and send it as a parameter to `cancelFileUpload()`

```javascript
  var instantResult = chatAgent.sendFileMessage({
    threadId: 293,
    file: image,
    content: content
  }, {
    onSent: function(result) {},
    onDeliver: function(result) {},
    onSeen: function(result) {}
  });

  chatAgent.cancelFileUpload({
    uniqueId: instantResult.content.file.uniqueId
  }, function() {
    console.log("File Upload has been Canceled!");
  });
```

### uploadFile

```html
<form>
  <fieldset>
    <legend>Upload File</legend>
    <input type="file" name="file" id="fileInput" value="">
    <button type="button" name="button" id="uploadFile">Upload File</button>
    <br>
    <div id="uploadedFile"></div>
  </fieldset>
</form>
```

```javascript
document.getElementById("uploadFile").addEventListener("click", function() {
  var fileInput = document.getElementById("fileInput"),
    file = fileInput.files[0];

  chatAgent.uploadFile({
    file: file,
    fileName: "Test Name"
  }, function(result) {
    if (!result.hasError) {
      var file = result.result;
      document.getElementById("uploadedFile").innerHTML = "<pre><br>Uploaded File Id: " + file.id + "<br>Uploaded File Name : " + file.name + "<br>Uploaded File HashCode : " + file.hashCode + "</pre>";
    }
  });
});
```

### uploadImage

```html
<form>
  <fieldset>
    <legend>Upload Image</legend>
    <input type="file" name="image" id="imageInput" value="">
    <button type="button" name="button" id="uploadImage">Upload Image</button>
    <br>
    <img id="uploadedImage" />
    <div id="uploadedImageData"></div>
  </fieldset>
</form>
```

```javascript
document.getElementById("uploadImage").addEventListener("click", function() {
  var imageInput = document.getElementById("imageInput"),
    image = imageInput.files[0];

  chatAgent.uploadImage({
    image: image,
    fileName: "Test Name",
    xC: 0,
    yC: 0,
    hC: 800,
    wC: 800
  }, function(result) {
    if (!result.hasError) {
      var image = result.result;
      document.getElementById("uploadedImage").src = "http://172.16.106.26:8080/hamsam/nzh/image?imageId=" + image.id + "&hashCode=" + image.hashCode;
      document.getElementById("uploadedImageData").innerHTML = "<pre><br>Uploaded Image Id: " + image.id + "<br>Uploaded Image Name : " + image.name + "<br>Uploaded Image HashCode : " + image.hashCode + "</pre>";
    }
  });
});
```

### getFile

```javascript
chatAgent.getFile({
  fileId: fileId,
  hashCode: hashCode,
  downloadable: true
}, function(result) {
  if (!result.hasError) {
    var file = result.result;
  }
});
```

### getImage

```javascript
chatAgent.getImage({
  imageId: imageId,
  hashCode: hashCode,
  downloadable: true,
  actual: true
}, function(result) {
  if (!result.hasError) {
    var image = result.result;
  }
});
```

## System Messages

### isTyping
To indicate that some one is currently typing in some specific thread, you can use `startTyping()` and `stopTyping()`

#### startTyping
This function sets an interval and sends `isTyping` system message to server every 1 second

```javascript
/**
* Sending isTyping message to server with an interval of 1 sec
* 
* @param    {int}   threadId    Id of thread that user is typing in
*/

chatAgent.startTyping({
    threadId: 1431
});
```

#### stopTyping
Because user can only type in one thread at time, so there will be only one isTypingInterval available. This function
clears it and stops sending the system messages.

```javascript
/**
* Stops Sending isTyping message to server
*/

chatAgent.stopTyping();
```


## Embedded Map Service functions

### mapReverse

This function takes a Geo Location and returns its address back

```javascript
/**
 * Get Address of a GeoLocation point
 *
 * @param  {float}   lat     Latitute of the Location
 * @param  {float}   lng     Longtitute of the Location
 */
chatAgent.mapReverse({
  lat: 35.7003508,
  lng: 51.3376460
}, function(result) {
  console.log(result);
});
```

### mapSearch

This function takes a Geo Location and a Search term and returns an array of Nearby places containing that search term

```javascript
/**
 * Get nearby places names as "term" keyword
 * around the given GeoLocation
 *
 * @param  {float}   lat     Latitute of the Location
 * @param  {float}   lng     Longtitute of the Location
 * @param  {string}  term    Search term to be searched
 */
chatAgent.mapSearch({
  lat: 35.7003508,
  lng: 51.3376460,
  term: "فروشگاه"
}, function(result) {
  console.log(result);
});
```

### mapRouting

This function takes two Geo Locations and returns the route between them

```javascript
/**
 * Get routing between two given GeoLocations
 *
 * @param  {object}   origin         Lat & Lng of Origin as a JSON
 * @param  {object}   destination    Lat & Lng of Destination as a JSON
 * @param  {boolean}  alternative    Give Alternative Routs too
 */
chatAgent.mapRouting({
  origin: {
    lat: 35.7003508,
    lng: 51.3376460
  },
  destination: {
    lat: 35.7343510,
    lng: 50.3376472
  },
  alternative: true
}, function(result) {
  console.log(result);
});
```

### mapStaticImage

This function takes a Geo Locations and returns the link of static map image related that area

```javascript
/**
 * Get Static Image of a GeoLocation
 *
 * @param  {string}   type           Map style (default standard-night)
 * @param  {int}      zoom           Map zoom (default 15)
 * @param  {object}   center         Lat & Lng of Map center as a JSON
 * @param  {int}      width          width of image in pixels (default 800px)
 * @param  {int}      height         height of image in pixels (default 600px)
 */
chatAgent.mapStaticImage({
  type: "standard-night",
  zoom: 15,
  center: {
    lat: 35.7003508,
    lng: 51.3376462
  },
  width: 800,
  height: 500
}, function(result) {
  console.log(result);
});
```

## Installation

```javascript
npm install podchat --save
```

## API Reference

[API Docs from POD](http://docs.pod.land/v1.0.0.0/Chat/javascript/783/Introduction)

## Tests

```javascript
npm test
```

## Contributors

You can send me your thoughts about making this repo great :)
[Email](masoudmanson@gmail.com)

## License

Under MIT License.

## Acknowledgments

A very special thanks to Ali Khanbabaei ([khanbabaeifanap](https://github.com/khanbabaeifanap)), who wrote the early version of chat service and helped me a lot with this repo.
