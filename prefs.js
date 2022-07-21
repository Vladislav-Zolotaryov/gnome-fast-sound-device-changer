'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const collectSoundDevices = Me.imports.soundDevices.collectSoundDevices;

function init() {
}

const LIST_MODE = 0;
const DUO_MODE = 1;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.sound.device.changer');
    
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    let menuPositions = new Gtk.StringList();
    menuPositions.append('List');
    menuPositions.append('Duo');


    let menuPositionRow = new Adw.ComboRow({
        title: 'Changer Mode',
        model: menuPositions,
        selected: settings.get_enum('mode')
    });

    menuPositionRow.connect("notify::selected", (widget) => {
        if (widget.selected == DUO_MODE) {
            duoSoundDeviceFirstSelectorRow.show();
            duoSoundDeviceSecondSelectorRow.show();
        } else {
            duoSoundDeviceFirstSelectorRow.hide();
            duoSoundDeviceSecondSelectorRow.hide();
        }
        settings.set_enum('mode', widget.selected);
    });
    group.add(menuPositionRow);


    const soundDevices = collectSoundDevices();

    let duoSoundDeviceFirstSelectorValues = new Gtk.StringList();
    for (const device of soundDevices) {
        duoSoundDeviceFirstSelectorValues.append(device.description);
    }

    let duoSoundDeviceFirstSelectorRow = new Adw.ComboRow({
        title: ("First Sound Device"),
        model: duoSoundDeviceFirstSelectorValues,
        selected: settings.get_enum('mode')
    });
    group.add(duoSoundDeviceFirstSelectorRow);
    duoSoundDeviceFirstSelectorRow.hide();

    let duoSoundDeviceSecondSelectorValues = new Gtk.StringList();
    for (const device of soundDevices) {
        duoSoundDeviceSecondSelectorValues.append(device.description);
    }

    let duoSoundDeviceSecondSelectorRow = new Adw.ComboRow({
        title: ("Second Sound Device"),
        model: duoSoundDeviceSecondSelectorValues,
        selected: settings.get_enum('mode')
    });
    group.add(duoSoundDeviceSecondSelectorRow);
    duoSoundDeviceSecondSelectorRow.hide();


    window.add(page);
}