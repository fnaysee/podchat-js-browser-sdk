
function CallServerManager(app) {
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
                app.sdkParams.consoleLogging && console.debug('[SDK][changeServer] Changing kurento server...');
                config.currentServerIndex++;
            }
        }
    }
}


export default CallServerManager