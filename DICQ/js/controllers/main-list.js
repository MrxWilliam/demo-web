
!function (ns, tui, dimp) {
    'use strict';

    var $ = tui.$;

    var Point = tui.Point;
    var Size = tui.Size;
    var Rect = tui.Rect;

    var View = tui.View;
    var Label = tui.Label;
    var Input = tui.Input;
    var Button = tui.Button;
    var Image = tui.Image;

    var TableViewCell = tui.TableViewCell;
    var TableViewDataSource = tui.TableViewDataSource;
    var TableViewDelegate = tui.TableViewDelegate;
    var TableView = tui.TableView;

    var Facebook = dimp.Facebook;

    var MainListView = function () {
        View.call(this);

        var table = new TableView();
        table.setClassName('ts_table');
        table.selectedIndex = 0;
        table.dataSource = this;
        table.delegate = this;
        this.appendChild(table);
        this.table = table;
    };
    dimp.Class(MainListView, View, [TableViewDataSource, TableViewDelegate]);

    MainListView.prototype.layoutSubviews = function () {
        View.prototype.layoutSubviews.call(this);
        this.table.reloadData();
    };

    //
    //  TableViewDataSource/TableViewDelegate
    //
    MainListView.prototype.numberOfSections = function (tableView) {
        return 2;
    };

    MainListView.prototype.viewForHeaderInSection = function (section, tableView) {
        var button = new Button();
        if (section === 0) {
            button.setId('contactsBtn');
            button.setClassName('contactsBtn buttonNormal');
            button.setText('Contacts');
            button.onClick = function () {
                tableView.selectedIndex = 0;
                tableView.reloadData();
            };
        } else {
            button.setId('groupsBtn');
            button.setClassName('groupsBtn buttonNormal');
            button.setText('Groups');
            button.onClick = function () {
                tableView.selectedIndex = 1;
                tableView.reloadData();
            };
        }
        return button;
    };

    MainListView.prototype.numberOfRowsInSection = function (section, tableView) {
        if (tableView.selectedIndex !== section) {
            return 0;
        }
        if (section === 0) {
            return get_contacts().length;
        } else {
            return get_groups().length;
        }
    };

    var get_contacts = function () {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        var contacts = facebook.getContacts(user.identifier);
        if (!contacts) {
            return [];
        }
        var list = [];
        var id;
        for (var i = 0; i < contacts.length; ++i) {
            id = facebook.getInstance(contacts[i]);
            if (id && id.isUser()) {
                list.push(id);
            }
        }
        return list;
    };
    var get_groups = function () {
        var facebook = Facebook.getInstance();
        var user = facebook.getCurrentUser();
        var contacts = facebook.getContacts(user.identifier);
        if (!contacts) {
            return [];
        }
        var list = [];
        var identifier;
        for (var i = 0; i < contacts.length; ++i) {
            identifier = facebook.getInstance(contacts[i]);
            if (identifier && identifier.isGroup()) {
                list.push(identifier);
            }
        }
        return list;
    };

    MainListView.prototype.cellForRowAtIndexPath = function (indexPath, tableView) {
        var cell = new TableViewCell();
        var facebook = Facebook.getInstance();

        var identifier;
        var entity;
        if (indexPath.section === 0) {
            cell.setClassName('contactCell');
            identifier = get_contacts()[indexPath.row];
            entity = facebook.getUser(identifier);
        } else {
            cell.setClassName('groupCell');
            identifier = get_groups()[indexPath.row];
            entity = facebook.getGroup(identifier);
        }
        console.assert(identifier !== number, 'ID not found: ' + indexPath);
        console.assert(entity !== number, 'ID error: ' + identifier);
        var profile = entity.getProfile();

        //
        //  Avatar
        //
        var image;
        if (identifier.isUser()) {
            image = profile.getProperty('avatar');
        } else {
            // TODO: build group logo
            image = null;
        }
        if (!image) {
            image = 'https://dimchat.github.io/images/icon-512.png';
        }
        var img = new Image();
        img.setClassName('avatar');
        if (image) {
            img.setSrc(image);
        }
        cell.appendChild(img);

        //
        //  Name(Number)
        //
        var name = entity.getName();
        var number = facebook.getNumberString(identifier);
        var label = new Label();
        label.setClassName('name');
        label.setText(name + ' (' + number + ')');
        cell.appendChild(label);

        return cell;
    };

    ns.MainListView = MainListView;

}(dicq, tarsier.ui, DIMP);