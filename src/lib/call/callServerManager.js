import {sdkParams} from "../sdkParams";

function CallServerManager() {
    let config = {
        servers: [],
        currentServerIndex: 0,
    };

    return {
        setServers: function (serversList) {
            config.servers = serversList;
            config.currentServerIndex = 0;
        },
        getCurrentServer: function () {
            return config.servers[0]
        },
        isJanus: function () {
            return config.servers[config.currentServerIndex].toLowerCase().substr(0, 1) === 'j';
        },
        canChangeServer: function () {
            return config.currentServerIndex < config.servers.length - 1;
        },
        changeServer: function () {
            if(this.canChangeServer()) {
                sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
                config.currentServerIndex++;
            }
        }
    }
}

const callServerController = new CallServerManager();

export {callServerController, CallServerManager}