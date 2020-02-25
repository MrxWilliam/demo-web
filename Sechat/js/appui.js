;

//! require <dimsdk.js>

!function (ns) {
    'use strict';

    var Facebook = ns.Facebook;

    var StationDelegate = ns.network.StationDelegate;

    var Register = ns.extensions.Register;

    var NotificationCenter = ns.stargate.NotificationCenter;

    var Application = function () {
        // notifications
        var nc = NotificationCenter.getInstance();
        nc.addObserver(this, kNotificationStationConnecting);
        nc.addObserver(this, kNotificationStationConnected);
        nc.addObserver(this, kNotificationHandshakeAccepted);
        nc.addObserver(this, kNotificationMetaAccepted);
        nc.addObserver(this, kNotificationProfileUpdated);
        nc.addObserver(this, kNotificationMessageReceived);
    };
    ns.type.Class(Application, null, StationDelegate);

    Application.prototype.write = function () {
        var str = '';
        for (var i = 0; i < arguments.length; ++i) {
            str += arguments[i] + '';
        }
        console.log(str);
    };

    var auto_login = function () {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        if (!user) {
            this.write('Creating new user ...');
            // create new user
            var reg = new Register();
            user = reg.createUser('Anonymous');
            if (user) {
                facebook.setCurrentUser(user);
            }
        }
        if (user) {
            return this.doLogin(user.identifier);
        } else {
            return 'Failed to get current user';
        }
    };

    Application.prototype.onReceiveNotification = async function (notification) {
        var facebook = Facebook.getInstance();
        var name = notification.name;
        var userInfo = notification.userInfo;
        var res;
        if (name === kNotificationStationConnecting) {
            res = 'Connecting to ' + userInfo['host'] + ':' + userInfo['port'] + ' ...';
        } else if (name === kNotificationStationConnected) {
            this.write('Station connected.');
            // auto login after connected
            res = auto_login.call(this);
            vue.setServerStatus('connected');
        } else if (name === kNotificationHandshakeAccepted) {
            this.write('Handshake accepted!');
            vue.setServerStatus('logged in');
            // res = this.doCall('station');
            var thisApp = this;
            setTimeout(function () {
                thisApp.doName();
            }, 3000);
        } else if (name === kNotificationMetaAccepted) {
            var identifier = notification.userInfo['ID'];
            res = '[Meta saved] ID: ' + identifier;
        } else if (name === kNotificationProfileUpdated) {
            var profile = notification.userInfo;
            res = '[Profile updated] ID: ' + profile.getIdentifier()
                + ' -> ' + profile.getValue('data');
        } else if (name === kNotificationMessageReceived) {
            var msg = notification.userInfo;
            var sender = msg.envelope.sender;
            var nickname = facebook.getUsername(sender);
            var text = msg.content.getValue('text');
            var msgType = msg.envelope.getType().value;
            // according to different message type
            switch (msgType) {
                case 136:
                    // command
                    if(msg.envelope.getMap().content.getCommand().toUpperCase() == 'SEARCH')
                    {
                        // update vue online users when "show users"
                        vue.updateOnlineUsers(msg.content.getUsers());
                    }
                    break;
                case 1:
                    //text
                    vue.addMessage(sender, msg);
                    await vue.addContactFromIdentifier(sender);
            }

            res = '[Message received] ' + nickname + ': ' + text;
        } else {
            res = 'Unknown notification: ' + name;
        }
        this.write(res);
    };

    //
    //  StationDelegate
    //
    Application.prototype.didSendPackage = function (data, server) {
        console.assert(data !== null, 'data empty');
        console.assert(server !== null, 'server empty');
        this.write('Message sent!');
    };
    Application.prototype.didFailToSendPackage = function (error, data, server) {
        console.assert(data !== null, 'data empty');
        console.assert(server !== null, 'server empty');
        this.write('Failed to send message, please check connection. error: ' + error);
    };

    window.Application = Application;

}(DIMP);

!function (ns) {
    'use strict';

    var Facebook = ns.Facebook;

    var getCommand = function (cmd) {
        if (cmd) {
            var array = cmd.split(/\s/g);
            if (array.length > 0) {
                return array[0];
            }
        }
        return '';
    };

    Application.prototype.exec = function (cmd) {
        var command = getCommand(cmd);
        var fn = 'do';
        if (command.length > 0) {
            fn += command.replace(command[0], command[0].toUpperCase());
        }
        if (typeof this[fn] !== 'function') {
            return ns.format.JSON.encode(cmd) + ' command error';
        }
        try {
            var args = cmd.replace(command, '').trim();
            return this[fn](args);
        } catch (e) {
            return 'failed to execute command: '
                + ns.format.JSON.encode(cmd) + '<br/>\n' + e;
        }
    };

    var text = 'Usage:\n';
    text += '        telnet <host>[:<port>] - connect to a DIM station\n';
    text += '        login <ID>             - switch user\n';
    text += '        logout                 - clear session\n';
    text += '        call <ID>              - change receiver to another user (or "station")\n';
    text += '        send <text>            - send message\n';
    text += '        name <niciname>        - reset nickname\n';
    text += '        who [am I]             - show current user info\n';
    text += '        show users             - list online users\n';
    text += '        search <ID|number>     - search users by ID or number\n';
    text += '        profile <ID>           - query profile with ID\n';

    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/\n/g, '<br/>');
    text = text.replace(/ {2}/g, ' &nbsp;');

    Application.prototype.doHelp = function () {
        return text;
    };

    Application.prototype.doWhoami = function () {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        var name = facebook.getUsername(user.identifier);
        var number = facebook.getNumberString(user.identifier);
        return name + ' ' + number + ' : ' + user.identifier;
    };

    Application.prototype.doWho = function (ami) {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        if (ami) {
            return user.toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
        if (this.receiver) {
            var contact = facebook.getUser(this.receiver);
            if (contact) {
                contact = contact.getName() + ' ('
                    + facebook.getNumberString(this.receiver) + ') ' + this.receiver;
            } else {
                contact = this.receiver;
            }
            return 'You (' + user.getName() + ') are talking with ' + contact;
        } else {
            return facebook.getUsername(user.identifier);
        }
    };

}(DIMP);

!function (ns) {
    'use strict';

    var Facebook = ns.Facebook;
    var Messenger = ns.Messenger;

    var Profile = ns.Profile;
    var TextContent = ns.protocol.TextContent;

    var StarStatus = ns.stargate.StarStatus;

    var check_connection = function () {
        var status = server.getStatus();
        if (status.equals(StarStatus.Connected)) {
            // connected
            return null;
        } else if (status.equals(StarStatus.Error)) {
            return 'Connecting ...';
        } else if (status.equals(StarStatus.Error)) {
            return 'Connection error!';
        }
        return 'Connect to a DIM station first.';
    };

    Application.prototype.doTelnet = function (address) {
        var options = {};
        var pair = address.split(/[: ]+/);
        if (pair.length === 1) {
            options['host'] = pair[0];
        } else if (pair.length === 2) {
            options['host'] = pair[0];
            options['port'] = pair[1];
        }
        server.start(options);
    };

    Application.prototype.doLogin = function (name) {
        var res = check_connection();
        if (res) {
            return res;
        }
        var facebook = Facebook.getInstance();
        var identifier = facebook.getIdentifier(name);
        if (!identifier) {
            return 'User error: ' + name;
        }
        var nickname = facebook.getNickname(identifier);
        var number = facebook.getNumberString(identifier);
        this.write('Current user: ' + nickname + ' (' + number + ')');

        var user = facebook.getUser(identifier);
        facebook.setCurrentUser(user);
        server.currentUser = user;
        return 'Trying to login: ' + identifier + ' ...';
    };

    Application.prototype.doLogout = function () {
        // TODO: clear session
    };

    Application.prototype.doCall = function (name) {
        var facebook = Facebook.getInstance();
        var identifier = facebook.getIdentifier(name);
        if (!identifier) {
            return 'User error: ' + name;
        }
        var meta = facebook.getMeta(identifier);
        if (!meta) {
            return 'Meta not found: ' + identifier;
        }
        this.receiver = identifier;
        var nickname = facebook.getUsername(identifier);
        return 'You are talking with ' + nickname + ' now!';
    };

    Application.prototype.doSend = function (text) {
        var res = check_connection();
        if (res) {
            return res;
        }
        var user = server.currentUser;
        if (!user) {
            return 'Login first';
        }
        var receiver = this.receiver;
        if (!receiver) {
            return 'Please set a recipient';
        }
        var content = new TextContent(text);
        if (Messenger.getInstance().sendContent(content, receiver)) {
            // return 'Sending message ...';
            return null;
        } else {
            return 'Cannot send message now.';
        }
    };

    Application.prototype.doName = function (nickname) {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        if (!user) {
            return 'Current user not found';
        }
        var privateKey = facebook.getPrivateKeyForSignature(user.identifier);
        if (!privateKey) {
            return 'Failed to get private key for current user: ' + user;
        }
        var profile = user.getProfile();
        if (!profile) {
            profile = new Profile(user.identifier);
        }
        if (nickname != undefined) {
            profile.setName(nickname);
        }
        profile.sign(privateKey);
        facebook.saveProfile(profile);
        Messenger.getInstance().postProfile(profile);
        return 'Nickname updated, profile: ' + profile.getValue('data');
    };

    Application.prototype.doShow = function (what) {
        if (what === 'users') {
            Messenger.getInstance().queryOnlineUsers();
            return 'Querying online users ...';
        }
        return 'Command error: show ' + what;
    };
    Application.prototype.doSearch = function (number) {
        Messenger.getInstance().searchUsers(number);
        return 'Searching users: ' + number;
    };

    Application.prototype.doProfile = function (identifier) {
        identifier = Facebook.getInstance().getIdentifier(identifier);
        if (!identifier) {
            return 'User error: ' + name;
        }
        Messenger.getInstance().queryProfile(identifier);
        if (identifier.getType().isGroup()) {
            return 'Querying profile for group: ' + identifier;
        } else {
            return 'Querying profile for user: ' + identifier;
        }
    };

}(DIMP);