
!function (ns, tui, dimp) {
    'use strict';

    var $ = tui.$;

    var Point = tui.Point;
    var Size = tui.Size;
    var Rect = tui.Rect;

    var View = tui.View;
    var Label = tui.Label;
    var TextArea = tui.TextArea;
    var Button = tui.Button;
    var Image = tui.Image;
    var Window = tui.Window;

    var TextContent = dimp.protocol.TextContent;
    var Facebook = dimp.Facebook;
    var Messenger = dimp.Messenger;
    var StarStatus = dimp.stargate.StarStatus;

    var random_point = function () {
        var x = 50 + Math.random() * 100;
        var y = 50 + Math.random() * 100;
        return new Point(Math.round(x), Math.round(y));
    };

    var ChatWindow = function () {
        var frame = new Rect(random_point(), new Size(640, 480));
        Window.call(this, frame);
        this.setClassName('chatWindow');
        this.setTitle('Chat');

        this.__identifier = null;

        // image
        var image = new Image();
        image.setClassName('logoImageView');
        image.setSrc('https://dimchat.github.io/images/icon-57.png');
        this.appendChild(image);
        // identifier
        var identifier = new Label();
        identifier.setClassName('identifierLabel');
        this.appendChild(identifier);
        this.identifierLabel = identifier;
        // group name
        var name = new Label();
        name.setClassName('nameLabel');
        this.appendChild(name);
        this.nameLabel = name;
        // search number
        var number = new Label();
        number.setClassName('numberLabel');
        this.appendChild(number);
        this.numberLabel = number;

        //
        //  Message
        //
        var history = new View();
        history.setClassName('historyView');
        this.appendChild(history);
        this.historyView = history;

        // message
        var message = new TextArea();
        message.setClassName('messageView');
        this.appendChild(message);
        this.messageView = message;
        // button
        var button = new Button();
        button.setClassName('sendButton');
        button.setText('Send');
        var win = this;
        button.onClick = function () {
            win.sendText(message.getValue());
        };
        this.appendChild(button);
    };
    ChatWindow.prototype = Object.create(Window.prototype);
    ChatWindow.prototype.constructor = ChatWindow;

    ChatWindow.prototype.setIdentifier = function (identifier) {
        var facebook = Facebook.getInstance();
        var name = facebook.getNickname(identifier);
        var number = facebook.getNumberString(identifier);
        this.identifierLabel.setText(identifier);
        this.nameLabel.setText(name);
        this.numberLabel.setText('(' + number + ')');
        this.__identifier = identifier;
    };

    ChatWindow.prototype.sendText = function (text) {
        var content = new TextContent(text);
        this.sendContent(content);
    };

    ChatWindow.prototype.sendContent = function (content) {
        var messenger = Messenger.getInstance();
        var server = messenger.server;
        var status = server.getStatus();
        if (!status.equals(StarStatus.Connected)) {
            alert('Station not connect');
            return false;
        }
        var user = server.currentUser;
        if (!user) {
            alert('User not login');
            return false;
        }
        var receiver = this.__identifier;
        if (receiver.isGroup()) {
            var facebook = Facebook.getInstance();
            var members = facebook.getMembers(receiver);
            if (!members || members.length === 0) {
                var ass = facebook.getAssistants(receiver);
                if (ass && ass.length > 0) {
                    messenger.queryGroupInfo(receiver, ass);
                    alert('Querying group members.');
                } else {
                    alert('Group members not found.');
                }
                return false;
            }
            content.setGroup(receiver);
        }
        if (messenger.sendContent(content, receiver, null, false)) {
            console.log('sending message: ' + content.getMap(false));
            this.messageView.setValue('');
            return true;
        } else {
            alert('Cannot send message now.');
            return false;
        }
    };

    ChatWindow.show = function (identifier, clazz) {
        var box = null;
        var elements = document.getElementsByClassName('chatWindow');
        if (elements) {
            var item;
            for (var i = 0; i < elements.length; ++i) {
                item = $(elements[i]);
                if (item.__identifier && item.__identifier.equals(identifier)) {
                    box = item;
                }
            }
        }
        if (box === null) {
            box = new clazz();
            $(document.body).appendChild(box);
            box.setIdentifier(identifier);
        }
        box.floatToTop();
        return box;
    };

    ns.ChatWindow = ChatWindow;

}(window, tarsier.ui, DIMP);
