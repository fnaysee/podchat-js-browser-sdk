(function () {
    /**
     * Global Variables
     */

    function ChatEvents(params) {
        //if (typeof (require) !== 'undefined' && typeof (exports) !== 'undefined') {} else {}

        var Sentry = params.Sentry,
            currentModuleInstance = this,
            Utility = params.Utility,
            consoleLogging = params.consoleLogging,
            token = params.token,
            eventCallbacks = {
                connect: {},
                disconnect: {},
                reconnect: {},
                messageEvents: {},
                threadEvents: {},
                contactEvents: {},
                botEvents: {},
                userEvents: {},
                callEvents: {},
                callStreamEvents: {},
                fileUploadEvents: {},
                fileDownloadEvents: {},
                systemEvents: {},
                chatReady: {},
                error: {},
                chatState: {}
            };

        var PodChatErrorException = function (error) {
            this.code = error.error ? error.error.code : error.code;
            this.message = error.error ? error.error.message : error.message;
            this.uniqueId = error.uniqueId ? error.uniqueId : '';
            this.token = token;
            this.error =  JSON.stringify((error.error ? error.error : error));
        };

        this.updateToken = function (newToken) {
            token = newToken;
        }

        /**
         * Fire Event
         *
         * Fires given Event with given parameters
         *
         * @access private
         *
         * @param {string}  eventName       name of event to be fired
         * @param {object}  param           params to be sent to the event function
         *
         * @return {undefined}
         */
        this.fireEvent = function (eventName, param) {
            if (eventName === "chatReady") {
                if (typeof navigator === "undefined") {
                    consoleLogging && console.log("\x1b[90m    ☰ \x1b[0m\x1b[90m%s\x1b[0m", "Chat is Ready 😉");
                } else {
                    consoleLogging && console.log("%c   Chat is Ready 😉", 'border-left: solid #666 10px; color: #666;');
                }
            }

            if (eventName === "error" || (eventName === "callEvents" && param.type === "CALL_ERROR")) {
                try {
                    throw new PodChatErrorException(param);
                } catch (err) {
                    if (!!Sentry) {
                        Sentry.setExtra('errorMessage', err.message);
                        Sentry.setExtra('errorCode', err.code);
                        Sentry.setExtra('uniqueId', err.uniqueId);
                        Sentry.setExtra('token', err.token);
                        Sentry.setTag('Error code:', (err.code ? err.code : ''))
                        Sentry.captureException(err.error, {
                            logger: eventName
                        });
                    }
                }
            }

            for (var id in eventCallbacks[eventName]) {
                if(eventCallbacks[eventName] && eventCallbacks[eventName][id])
                    eventCallbacks[eventName][id](param);
            }
        };

        this.on = function (eventName, callback) {
            if (eventCallbacks[eventName]) {
                var id = Utility.generateUUID();
                eventCallbacks[eventName][id] = callback;
                return id;
            }
        };

        this.off = function (eventName, eventId) {
            if (eventCallbacks[eventName]) {
                if (eventCallbacks[eventName].hasOwnProperty(eventId)) {
                    delete eventCallbacks[eventName][eventId];
                    return eventId;
                }
            }
        }

        this.clearEventCallbacks = function () {
            // Delete all event callbacks
            for (var i in eventCallbacks) {
                delete eventCallbacks[i];
            }
        }
    }

    if (typeof module !== 'undefined' && typeof module.exports != 'undefined') {
        module.exports = ChatEvents;
    } else {
        if (!window.POD) {
            window.POD = {};
        }
        window.POD.ChatEvents = ChatEvents;
    }
})();
