var assert = require('assert'),
    faker = require('faker'),
    Chat = require('../src/chat.js'),
    fs = require('fs'),
    path = require('path');

var TOKENS = {
        TOKEN_1: '7cba09ff83554fc98726430c30afcfc6', // Masoud
        TOKEN_2: 'fbd4ecedb898426394646e65c6b1d5d1' // Pooria
    },
    P2P_THREAD = 293,
    GROUP_THREAD = 10349,//312,
    timingLog = true,
    params1 = {

        /**
         * Hamed Mehrara
         */
        // socketAddress: 'ws://172.16.106.26:8003/ws', // {**REQUIRED**} Socket Address
        // ssoHost: 'http://172.16.110.76', // {**REQUIRED**} Socket Address
        // platformHost: 'http://172.16.106.26:8080/hamsam', // {**REQUIRED**} Platform Core Address
        // fileServer: 'http://172.16.106.26:8080/hamsam', // {**REQUIRED**} File Server Address
        // serverName: 'chat-server', // {**REQUIRED**} Server to to register on

        /**
         * Mehdi Sheikh Hosseini
         */
        socketAddress: 'ws://172.16.110.131:8003/ws', // {**REQUIRED**} Socket Address
        ssoHost: 'http://172.16.110.76', // {**REQUIRED**} Socket Address
        platformHost: 'http://172.16.110.131:8080', // {**REQUIRED**} Platform Core Address
        fileServer: 'http://172.16.110.131:8080', // {**REQUIRED**} File Server Address
        serverName: 'chat-server2', // {**REQUIRED**} Server to to register on

        /**
         * Sand Box
         */
        // socketAddress: "wss://chat-sandbox.pod.land/ws", // {**REQUIRED**} Socket Address
        // ssoHost: "https://accounts.pod.land", // {**REQUIRED**} Socket Address
        // platformHost: "https://sandbox.pod.land:8043/srv/basic-platform", // {**REQUIRED**} Platform Core Address
        // fileServer: "https://sandbox.pod.land:8443", // {**REQUIRED**} File Server Address
        // serverName: "chat-server", // {**REQUIRED**} Server to to register on

        enableCache: false,
        token: TOKENS.TOKEN_1,
        asyncLogging: {
            // onFunction: true,
            // onMessageReceive: true,
            // onMessageSend: true,
            actualTiming: timingLog
        }
    },
    params2 = Object.assign({}, params1);

params2.token = TOKENS.TOKEN_2;

/**
 * CONNECTING AND GETTING READY
 */
describe('Connecting and getting ready', function(done) {
    this.timeout(20000);
    var chatAgent;

    beforeEach(() => {
        chatAgent = new Chat(params1);
});

    afterEach(() => {
        chatAgent.logout();
});

    it('Should connect to server and get ready', function(done) {
        chatAgent.on('chatReady', function() {
            done();
        });
    });
});

/**
 * GETTING CURRENT USER'S INFO
 */
describe('Working with Users', function(done) {
    this.timeout(20000);
    var chatAgent;

    beforeEach(() => {
        chatAgent = new Chat(params1);
});

    afterEach(() => {
        chatAgent.logout();
});

    it('Should get User Info', function(done) {
        chatAgent.on('chatReady', function() {
            var currentUser = chatAgent.getCurrentUser();
            if (currentUser && typeof currentUser.id === 'number') {
                done();
            }
        });
    });
});

/**
 * CONTACTS FUNCTIONALITY
 */
describe('Working with contacts', function(done) {
    this.timeout(20000);

    var chatAgent,
        newContactId,
        blockedContactId;

    beforeEach(() => {
        chatAgent = new Chat(params1);
});

    afterEach(() => {
        chatAgent.logout();
});

    it('Should GET contacts list', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Contacts List \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should ADD a new contact', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.addContacts({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                cellphoneNumber: '09' + Math.floor((Math.random() * 100000000) + 1),
                email: faker.internet.email()
            }, function(result) {
                if (!result.hasError) {
                    newContactId = result.result.contacts[0].id;
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Add New Contact \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should UPDATE an existing contact', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.updateContacts({
                id: newContactId,
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                cellphoneNumber: '09' + Math.floor((Math.random() * 100000000) + 1),
                email: faker.internet.email()
            }, function(result) {
                if (!result.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Update a Contact \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should REMOVE an existing contact', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.removeContacts({
                id: newContactId
            }, function(result) {
                if (!result.hasError && result.result) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Remove a Contact \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Block a contact', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            var blockContactId = contactsResult.result.contacts[i].id;

                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Select a Valid Contact \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            var time3 = new Date().getTime();

                            chatAgent.block({
                                contactId: blockContactId
                            }, function(result) {
                                if (!result.hasError) {
                                    blockedContactId = result.result.blockId;
                                    if (timingLog) {
                                        console.log('\x1b[33m    ★ Block Contact \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time3);
                                    }
                                    done();
                                    console.log('\n');
                                }
                            });

                            break;
                        }
                    }
                }
            });
        });
    });

    it('Should unBlock an already blocked contact', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();

            chatAgent.unblock({
                blockId: blockedContactId
            }, function(result) {
                if (!result.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ UnBlock Contact \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Get Blocked contacts list', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getBlocked({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Blocked Contacts List \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Search in contacts list', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.searchContacts({
                cellphoneNumber: 09
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Search in Contacts List \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });
});

/**
 * THREADS FUNCTIONALITY
 */
describe('Working with threads', function(done) {
    this.timeout(20000);

    var chatAgent,
        p2pThreadId,
        groupThreadId,
        muteThreadId;

    beforeEach(() => {
        chatAgent = new Chat(params1);
});

    afterEach(() => {
        chatAgent.logout();
});

    it('Should GET Threads list', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getThreads({
                count: 50,
                offset: 0
            }, function(threadsResult) {
                if (!threadsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Threads List \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should GET a single thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getThreads({
                threadIds: [P2P_THREAD]
            }, function(threadsResult) {
                if (!threadsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Single Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should SEARCH in Thread names and return result', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getThreads({
                count: 50,
                name: 'thread'
            }, function(threadsResult) {
                if (!threadsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Search in Threads \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should CREATE a P2P thread with a contact (TYPE = NORMAL)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            var p2pContactId = contactsResult.result.contacts[i].id;

                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            var time3 = new Date().getTime();

                            chatAgent.createThread({
                                type: 'NORMAL',
                                invitees: [
                                    {
                                        id: p2pContactId,
                                        idType: 'TO_BE_USER_CONTACT_ID'
                                    }]
                            }, function(createThreadResult) {
                                if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                                    p2pThreadId = createThreadResult.result.thread.id;
                                    if (timingLog) {
                                        console.log('\x1b[33m    ★ Create P2P Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time3);
                                    }
                                    done();
                                    console.log('\n');
                                }
                            });
                            break;
                        }
                    }
                }
            });
        });
    });

    it('Should CREATE a Group thread with a contact (TYPE = NORMAL)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Create Group Thread (type = NORMAL) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should CREATE a Group thread with a contact (TYPE = OWNER_GROUP)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'OWNER_GROUP',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Create Group Thread (type = OWNER_GROUP) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                    time3);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should CREATE a Group thread with a contact (TYPE = PUBLIC_GROUP)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'PUBLIC_GROUP',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Create Group Thread (type = PUBLIC_GROUP) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                    time3);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should CREATE a Group thread with a contact (TYPE = CHANNEL_GROUP)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'CHANNEL_GROUP',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Create Group Thread (type = CHANNEL_GROUP) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                    time3);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should CREATE a Group thread with a contact (TYPE = CHANNEL)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'CHANNEL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Create Group Thread (type = CHANNEL) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should GET Thread participants', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getThreadParticipants({
                count: 50,
                offset: 0,
                threadId: GROUP_THREAD
            }, function(participantsResult) {
                if (!participantsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Participants \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should GET Thread Admins', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.getThreadAdmins({
                threadId: GROUP_THREAD
            }, function(participantsResult) {
                if (!participantsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Participants \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should CREATE a Group thread and set a new admin on it', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Group Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }

                            var time4 = new Date().getTime();
                            chatAgent.getThreadParticipants({
                                threadId: groupThreadId
                            }, function(participantsResult) {
                                if (!participantsResult.hasError) {
                                    if (timingLog) {
                                        console.log('\x1b[90m    ☰ Get Participants \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time4);
                                    }

                                    var time5 = new Date().getTime();

                                    var threadParticipants = participantsResult.result.participants;
                                    var adminCandidate;
                                    for (var i = 0; i < threadParticipants.length; i++) {
                                        if (!threadParticipants[i].admin) {
                                            adminCandidate = threadParticipants[i].id;
                                            break;
                                        }
                                    }

                                    if (adminCandidate > 0) {
                                        setTimeout(function() {
                                            chatAgent.setAdmin({
                                                threadId: groupThreadId,
                                                admins: [
                                                    {
                                                        userId: adminCandidate,
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
                                                if (!result.hasError) {
                                                    if (timingLog) {
                                                        console.log('\x1b[33m    ★ Set Admin \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time5 - 500);
                                                    }
                                                    done();
                                                    console.log('\n');
                                                }
                                            });
                                        }, 500);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    it('Should CREATE a Group thread, set a new admin on it and remove it afterwards', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            groupThreadId = createThreadResult.result.thread.id;
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Group Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }

                            var time4 = new Date().getTime();
                            chatAgent.getThreadParticipants({
                                threadId: groupThreadId
                            }, function(participantsResult) {
                                if (!participantsResult.hasError) {
                                    if (timingLog) {
                                        console.log('\x1b[90m    ☰ Get Participants \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time4);
                                    }

                                    var time5 = new Date().getTime();

                                    var threadParticipants = participantsResult.result.participants;
                                    var adminCandidate;
                                    for (var i = 0; i < threadParticipants.length; i++) {
                                        if (!threadParticipants[i].admin) {
                                            adminCandidate = threadParticipants[i].id;
                                            break;
                                        }
                                    }

                                    if (adminCandidate > 0) {
                                        setTimeout(function() {
                                            chatAgent.setAdmin({
                                                threadId: groupThreadId,
                                                admins: [
                                                    {
                                                        userId: adminCandidate,
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
                                                if (!result.hasError) {
                                                    if (timingLog) {
                                                        console.log('\x1b[90m    ☰ Set Admin \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time5 - 500);
                                                    }

                                                    var time6 = new Date().getTime();
                                                    setTimeout(function() {
                                                        chatAgent.setAdmin({
                                                            threadId: groupThreadId,
                                                            admins: [
                                                                {
                                                                    userId: adminCandidate,
                                                                    roleOperation: 'remove',
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
                                                            if (!result.hasError) {
                                                                if (timingLog) {
                                                                    console.log('\x1b[33m    ★ Remove Admin \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                                                        time6 - 500);
                                                                }

                                                                done();
                                                                console.log('\n');
                                                            }
                                                        });
                                                    }, 500);
                                                }
                                            });
                                        }, 500);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    it('Should ADD A PARTICIPANT to newly created group Thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];
                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    var lastInvitee = groupInvitees.pop();

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create New Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            var time4 = new Date().getTime();
                            var newGroupThreadId = createThreadResult.result.thread.id;

                            setTimeout(function() {
                                chatAgent.addParticipants({
                                    threadId: newGroupThreadId,
                                    contacts: [lastInvitee.id]
                                }, function(result) {
                                    if (!result.hasError) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Add Participant \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time4 - 500);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                });
                            }, 500);
                        }
                    });
                }
            });
        });
    });

    it('Should REMOVE A PARTICIPANT from newly created group Thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();

                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {

                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            var time4 = new Date().getTime();

                            var newGroupThreadId = createThreadResult.result.thread.id;

                            chatAgent.getThreadParticipants({
                                count: 50,
                                offset: 0,
                                threadId: newGroupThreadId
                            }, function(participantsResult) {
                                if (!participantsResult.hasError) {

                                    if (timingLog) {
                                        console.log('\x1b[90m    ☰ Get Thread Participants \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time4);
                                    }
                                    var time5 = new Date().getTime();

                                    setTimeout(function() {

                                        var userId = participantsResult.result.participants[0];
                                        chatAgent.removeParticipants({
                                            threadId: newGroupThreadId,
                                            participants: [userId.id]
                                        }, function(result) {
                                            if (!result.hasError) {
                                                if (timingLog) {
                                                    console.log('\x1b[33m    ★ Remove Participant \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time5 -
                                                        500);
                                                }
                                                done();
                                                console.log('\n');
                                            }
                                        });
                                    }, 500);
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    it('Should LEAVE a newly created group Thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();

            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();

                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {

                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            var time4 = new Date().getTime();

                            var newGroupThreadId = createThreadResult.result.thread.id;

                            chatAgent.leaveThread({
                                threadId: newGroupThreadId
                            }, function(result) {
                                if (!result.hasError) {
                                    if (timingLog) {
                                        console.log('\x1b[33m    ★ Leave Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time4);
                                    }
                                    done();
                                    console.log('\n');
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    it('Should GET HISTORY of lastest active thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getThreads({
                count: 1,
                offset: 0
            }, function(threadsResult) {
                if (!threadsResult.hasError) {

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Threads List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();

                    var threadId = threadsResult.result.threads[0].id;

                    chatAgent.getHistory({
                        threadId: threadId
                    }, function(historyResult) {
                        if (!historyResult.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Get History \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should CLEAR HISTORY of lastest active thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getThreads({
                count: 1,
                offset: 0
            }, function(threadsResult) {
                if (!threadsResult.hasError) {

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Threads List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();

                    var threadId = threadsResult.result.threads[0].id;

                    chatAgent.clearHistory({
                        threadId: threadId
                    }, function(historyResult) {
                        if (!historyResult.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Clear History \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should Search in Thread Messages', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();

            chatAgent.getHistory({
                threadId: P2P_THREAD,
                query: 'sample'
            }, function(historyResult) {
                if (!historyResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Search in History \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Search in Thread Messages METADATA', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph(),
                metaData: {
                    type: 'test'
                }
            }, {
                onSent: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send Text Message with metadata \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }

                    var time1 = new Date().getTime();
                    chatAgent.getHistory({
                        threadId: GROUP_THREAD,
                        metadataCriteria: {
                            'field': 'type',
                            'has': 'test'
                        }
                    }, function(historyResult) {
                        if (!historyResult.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Search in Messages MetaData \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                }
            });
        });
    });

    it('Should MUTE a thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            var time4 = new Date().getTime();

                            muteThreadId = createThreadResult.result.thread.id;
                            chatAgent.muteThread({
                                subjectId: muteThreadId
                            }, function(result) {
                                if (!result.hasError) {
                                    if (timingLog) {
                                        console.log('\x1b[33m    ★ Mute Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time4);
                                    }
                                    done();
                                    console.log('\n');
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    it('Should UNMUTE a muted thread', function(done) {
        chatAgent.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent.unMuteThread({
                subjectId: muteThreadId
            }, function(result) {
                if (!result.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ UnMute Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should update a newly created thread\'s Meta Info (name, image, description, metadata)', function(done) {
        chatAgent.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent.getContacts({
                count: 50,
                offset: 0
            }, function(contactsResult) {
                if (!contactsResult.hasError) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Get Contacts List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    var groupInvitees = [];

                    for (var i = 0; i < contactsResult.result.contacts.length; i++) {
                        if (contactsResult.result.contacts[i].hasUser) {
                            groupInvitees.push({
                                id: contactsResult.result.contacts[i].id,
                                idType: 'TO_BE_USER_CONTACT_ID'
                            });

                            if (groupInvitees.length > 2) {
                                break;
                            }
                        }
                    }

                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Create Invitees List \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time2);
                    }
                    var time3 = new Date().getTime();

                    chatAgent.createThread({
                        title: faker.lorem.word(),
                        type: 'NORMAL',
                        invitees: groupInvitees
                    }, function(createThreadResult) {
                        if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Create Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time3);
                            }
                            var time4 = new Date().getTime();

                            var newGroupThreadId = createThreadResult.result.thread.id;

                            setTimeout(function() {
                                chatAgent.updateThreadInfo({
                                    threadId: newGroupThreadId,
                                    image: 'https://static2.farakav.com/files/pictures/thumb/01330672.jpg',
                                    description: faker.lorem.sentence(),
                                    title: faker.lorem.sentence(),
                                    metadata: {
                                        title: 'Test',
                                        name: 'Masoud Amjadi'
                                    }
                                }, function(result) {
                                    if (!result.hasError) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Thread Info get updated \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time4 -
                                                500);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                });
                            }, 500);
                        }
                    });
                }
            });
        });
    });
});

/**
 * MESSAGING FUNCTIONS
 */
describe('Messaging Functionality', function(done) {
    this.timeout(20000);

    var chatAgent1,
        chatAgent2;

    beforeEach(() => {
        chatAgent1 = new Chat(params1);
    chatAgent2 = new Chat(params2);
});

    afterEach(() => {
        chatAgent1.logout();
    chatAgent2.logout();
});

    it('Should SEND a text message to a P2P thread', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();

            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Send Message \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                },
                onDeliver: function(result) {
                },
                onSeen: function(result) {
                }
            });
        });
    });

    it('Should SEND a FILE message to a newly created P2P thread', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph(),
                file: __dirname + '/test.jpg',
                metaData: {
                    custom_name: 'John Doe'
                }
            }, {
                onSent: function(result) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Send File Message \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                },
                onDeliver: function(result) {
                    console.log(result.uniqueId + ' \t has been Delivered!');
                },
                onSeen: function(result) {
                    console.log(result.uniqueId + ' \t has been Seen!');
                }
            });
        });
    });

    it('Should RECEIVE a DELIVERY message for a newly message sent to a P2P thread', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Receiving Delivery \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                },
                onSeen: function(result) {
                }
            });
        });
    });

    it('Should RECEIVE a SEEN message for a newly message sent to a P2P thread', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                },
                onSeen: function(result) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Receiving Seen Acknowledge \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    chatAgent2.seen({
                        messageId: message.id,
                        ownerId: message.ownerId
                    });
                }
            });
        });

    });

    it('Should sent a message to a P2P thread then EDIT the sent message afterwards', function(done) {
        var sentMessageID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent1.editMessage({
                        messageId: sentMessageID,
                        content: faker.lorem.paragraph()
                    }, function(result) {
                        if (!result.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Edit Message \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                },
                onSeen: function(result) {
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                }
            });
        });

    });

    it('Should sent a message to a P2P thread then DELETE the sent message afterwards (Delete For themeself Only)', function(done) {
        var sentMessageID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent1.deleteMessage({
                        messageId: sentMessageID,
                        content: JSON.stringify({
                            deleteForAll: false
                        })
                    }, function(result) {
                        if (!result.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Delete Message from P2P \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                },
                onSeen: function(result) {
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                }
            });
        });

    });

    it('Should sent a message to a P2P thread then DELETE the sent message afterwards (Delete For All)', function(done) {
        var sentMessageID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent1.deleteMessage({
                        messageId: sentMessageID,
                        content: JSON.stringify({
                            deleteForAll: true
                        })
                    }, function(result) {
                        if (!result.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Delete Message from P2P (Delete For All) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                    time2);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                },
                onSeen: function(result) {
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                }
            });
        });

    });

    it('Should sent a message to a GROUP thread then DELETE the sent message afterwards (Delete For themeself Only)', function(done) {
        var sentMessageID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: GROUP_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to GROUP Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent1.deleteMessage({
                        messageId: sentMessageID,
                        content: JSON.stringify({
                            deleteForAll: false
                        })
                    }, function(result) {
                        if (!result.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Delete Message from Group\x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                },
                onSeen: function(result) {
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                }
            });
        });

    });

    it('Should sent a message to a GROUP thread then DELETE the sent message afterwards (Delete For All)', function(done) {
        var sentMessageID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: GROUP_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to GROUP Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent1.deleteMessage({
                        messageId: sentMessageID,
                        content: JSON.stringify({
                            deleteForAll: true
                        })
                    }, function(result) {
                        if (!result.hasError) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Delete Message from Group (Delete For All) \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() -
                                    time2);
                            }
                            done();
                            console.log('\n');
                        }
                    });
                },
                onSeen: function(result) {
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                }
            });
        });

    });

    it('Should sent several messages to a P2P thread then DELETE the sent messages afterwards (Delete For themeself Only)', function(done) {
        var sentMessageIDs = [],
        sentMessagesCount = 0,
        deletedMessagesCount = 0;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();

            for (var i = 0; i < 5; i++) {
                chatAgent1.sendTextMessage({
                    threadId: P2P_THREAD,
                    content: faker.lorem.paragraph()
                }, {
                    onSent: function(result) {},
                    onDeliver: function(result) {
                        sentMessagesCount++;

                        if(sentMessagesCount == 4) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Send 5 Messages to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            var time2 = new Date().getTime();

                            chatAgent1.deleteMultipleMessages({
                                threadId: P2P_THREAD,
                                messageIds: sentMessageIDs,
                                deleteForAll: false
                            }, function(result) {
                                if (!result.hasError) {
                                    deletedMessagesCount++;

                                    if(deletedMessagesCount == 4) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Delete Multiple Messages from P2P \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                }
                            });
                        }
                    },
                    onSeen: function(result) {}
                });
            }
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageIDs.push(message.id);
                }
            });
        });

    });

    it('Should sent several messages to a P2P thread then DELETE the sent messages afterwards (Delete For All)', function(done) {
        var sentMessageIDs = [],
            sentMessagesCount = 0,
            deletedMessagesCount = 0;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();

            for (var i = 0; i < 5; i++) {
                chatAgent1.sendTextMessage({
                    threadId: P2P_THREAD,
                    content: faker.lorem.paragraph()
                }, {
                    onSent: function(result) {},
                    onDeliver: function(result) {
                        sentMessagesCount++;

                        if(sentMessagesCount == 4) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Send 5 Messages to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            var time2 = new Date().getTime();

                            chatAgent1.deleteMultipleMessages({
                                threadId: P2P_THREAD,
                                messageIds: sentMessageIDs,
                                deleteForAll: true
                            }, function(result) {
                                if (!result.hasError) {
                                    deletedMessagesCount++;

                                    if(deletedMessagesCount == 4) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Delete Multiple Messages from P2P \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                }
                            });
                        }
                    },
                    onSeen: function(result) {}
                });
            }
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageIDs.push(message.id);
                }
            });
        });

    });

    it('Should sent several messages to a GROUP thread then DELETE the sent messages afterwards (Delete For themeself Only)', function(done) {
        var sentMessageIDs = [],
            sentMessagesCount = 0,
            deletedMessagesCount = 0;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();

            for (var i = 0; i < 5; i++) {
                chatAgent1.sendTextMessage({
                    threadId: GROUP_THREAD,
                    content: faker.lorem.paragraph()
                }, {
                    onSent: function(result) {},
                    onDeliver: function(result) {
                        sentMessagesCount++;

                        if(sentMessagesCount == 4) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Send 5 Messages to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            var time2 = new Date().getTime();

                            chatAgent1.deleteMultipleMessages({
                                threadId: GROUP_THREAD,
                                messageIds: sentMessageIDs,
                                deleteForAll: false
                            }, function(result) {
                                if (!result.hasError) {
                                    deletedMessagesCount++;

                                    if(deletedMessagesCount == 4) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Delete Multiple Messages from Group Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                }
                            });
                        }
                    },
                    onSeen: function(result) {}
                });
            }
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageIDs.push(message.id);
                }
            });
        });

    });

    it('Should sent several messages to a GROUP thread then DELETE the sent messages afterwards (Delete For All)', function(done) {
        var sentMessageIDs = [],
            sentMessagesCount = 0,
            deletedMessagesCount = 0;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();

            for (var i = 0; i < 5; i++) {
                chatAgent1.sendTextMessage({
                    threadId: GROUP_THREAD,
                    content: faker.lorem.paragraph()
                }, {
                    onSent: function(result) {},
                    onDeliver: function(result) {
                        sentMessagesCount++;

                        if(sentMessagesCount == 4) {
                            if (timingLog) {
                                console.log('\x1b[90m    ☰ Send 5 Messages to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                            }
                            var time2 = new Date().getTime();

                            chatAgent1.deleteMultipleMessages({
                                threadId: GROUP_THREAD,
                                messageIds: sentMessageIDs,
                                deleteForAll: true
                            }, function(result) {
                                if (!result.hasError) {
                                    deletedMessagesCount++;

                                    if(deletedMessagesCount == 4) {
                                        if (timingLog) {
                                            console.log('\x1b[33m    ★ Delete Multiple Messages from Group Thread \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                                        }
                                        done();
                                        console.log('\n');
                                    }
                                }
                            });
                        }
                    },
                    onSeen: function(result) {}
                });
            }
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageIDs.push(message.id);
                }
            });
        });

    });

    it('Should receive a message from a P2P thread then REPLY to the message', function(done) {
        var sentMessageID,
            sentMessageUID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                },
                onSeen: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent2.replyMessage({
                        threadId: P2P_THREAD,
                        repliedTo: sentMessageID,
                        content: faker.lorem.paragraph()
                    }, {
                        onSent: function(result) {
                        },
                        onDeliver: function(result) {

                            if (timingLog) {
                                console.log('\x1b[33m    ★ Reply Message Delivered \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            done();
                            console.log('\n');
                        },
                        onSeen: function(result) {
                        }
                    });
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                    chatAgent2.seen({
                        messageId: message.id,
                        ownerId: message.ownerId
                    });
                }
            });
        });

    });

    it('Should send a messages to a P2P thread then FORWARD it into another thread', function(done) {
        var sentMessageID,
            sentMessageUID;

        chatAgent1.on('chatReady', function() {
            var time1 = new Date().getTime();
            chatAgent1.sendTextMessage({
                threadId: P2P_THREAD,
                content: faker.lorem.paragraph()
            }, {
                onSent: function(result) {
                },
                onDeliver: function(result) {
                },
                onSeen: function(result) {
                    if (timingLog) {
                        console.log('\x1b[90m    ☰ Send a Message to P2P Thread \x1b[0m \x1b[90m(%sms)\x1b[0m', new Date().getTime() - time1);
                    }
                    var time2 = new Date().getTime();
                    chatAgent2.forwardMessage({
                        subjectId: GROUP_THREAD,
                        content: JSON.stringify([sentMessageID])
                    }, {
                        onSent: function(result) {
                        },
                        onDeliver: function(result) {
                            if (timingLog) {
                                console.log('\x1b[33m    ★ Forward Message Delivered \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time2);
                            }
                            done();
                            console.log('\n');
                        },
                        onSeen: function(result) {
                        }
                    });
                }
            });
        });

        chatAgent2.on('chatReady', function() {
            chatAgent2.on('messageEvents', function(event) {
                var type = event.type,
                    message = event.result.message;

                if (type == 'MESSAGE_NEW') {
                    sentMessageID = message.id;
                    chatAgent2.seen({
                        messageId: message.id,
                        ownerId: message.ownerId
                    });
                }
            });
        });

    });

});

/**
 * FILE FUNCTIONS
 */
describe('Uploading & Getting File Functionality', function(done) {
    this.timeout(20000);

    var chatAgent1,
        imageId,
        imageHashCode,
        fileId,
        fileHashCode;

    beforeEach(() => {
        chatAgent1 = new Chat(params1);
});

    afterEach(() => {
        chatAgent1.logout();
});

    it('Should UPLOAD an image file to image server', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.uploadImage({
                image: __dirname + '/test.jpg',
                xC: 0,
                yC: 0,
                hC: 400,
                wC: 400
            }, function(result) {
                if (!result.hasError) {
                    imageId = result.result.id;
                    imageHashCode = result.result.hashCode;
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Image Upload \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Emit an Event that image upload has been started', function(done) {
        var time = new Date().getTime();

        chatAgent1.on('chatReady', function() {
            chatAgent1.uploadImage({
                image: __dirname + '/test.jpg',
                xC: 0,
                yC: 0,
                hC: 400,
                wC: 400
            }, function(result) {
                if (!result.hasError) {
                    imageId = result.result.id;
                    imageHashCode = result.result.hashCode;
                }
            });
        });

        chatAgent1.on('fileUploadEvents', function(event) {
            if (event.state == 'UPLOADED') {
                if (timingLog) {
                    console.log('\x1b[33m    ★ Image Upload Event Triggered \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                }
                done();
                console.log('\n');
            }
        });
    });

    it('Should UPLOAD a file to file server', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.uploadFile({
                file: __dirname + '/test.txt'
            }, function(result) {
                if (!result.hasError) {
                    fileId = result.result.id;
                    fileHashCode = result.result.hashCode;
                    if (timingLog) {
                        console.log('\x1b[33m    ★ File Upload \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should Emit an Event that file upload has been started', function(done) {
        var time = new Date().getTime();

        chatAgent1.on('chatReady', function() {
            chatAgent1.uploadFile({
                file: __dirname + '/test.txt'
            }, function(result) {
                if (!result.hasError) {
                    fileId = result.result.id;
                    fileHashCode = result.result.hashCode;
                }
            });
        });

        chatAgent1.on('fileUploadEvents', function(event) {
            if (event.state == 'UPLOADED') {
                if (timingLog) {
                    console.log('\x1b[33m    ★ File Upload Event Triggered \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                }
                done();
                console.log('\n');
            }
        });
    });

    it('Should GET an uploaded image from image server', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.getImage({
                imageId: imageId,
                hashCode: imageHashCode
            }, function(result) {
                if (!result.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get Image \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

    it('Should GET an uploaded file from file server', function(done) {
        chatAgent1.on('chatReady', function() {
            var time = new Date().getTime();
            chatAgent1.getFile({
                fileId: fileId,
                hashCode: fileHashCode
            }, function(result) {
                if (!result.hasError) {
                    if (timingLog) {
                        console.log('\x1b[33m    ★ Get File \x1b[0m \x1b[33m(%sms)\x1b[0m', new Date().getTime() - time);
                    }
                    done();
                    console.log('\n');
                }
            });
        });
    });

});
