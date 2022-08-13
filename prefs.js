'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const SoundDeviceManager = Me.imports.soundDeviceManager;
const Constants = Me.imports.constants;

function init() { 
    this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.sound.device.changer');
}

function buildPrefsWidget() {
    const mainBox = new Gtk.Box({
        'can-focus': 0,
        'margin_start': 12,
        'margin_end': 12,
        'margin_top': 12,
        'margin_bottom': 12,
        'orientation': 1,
        'spacing': 12,
    });

    mainBox.append(listBoxFrame(createModeSelector(() => duoDevicesGroup.hide(), () => duoDevicesGroup.show())));

    const soundDevices = SoundDeviceManager.collectSoundDevices();

    const duoDevicesGroup = listBoxFrame(
        createDeviceSelector('Device A', 'device-a', soundDevices),
        createDeviceSelector('Device B', 'device-b', soundDevices)
    );
    mainBox.append(duoDevicesGroup);

    const widget = new Gtk.ScrolledWindow({
        hscrollbar_policy: Gtk.PolicyType.NEVER,
        vscrollbar_policy: Gtk.PolicyType.NEVER,
        'can-focus': 0
    });

    widget.set_child(mainBox);
    return widget;
}

function listBoxFrame(...rows) {
    const frame = new Gtk.Frame({
        'can-focus': 0
    });
    const listBox = new Gtk.ListBox({ 'can-focus': 0, 'selection_mode': 'none' });
    for (const row of rows) {
        listBox.append(row);
    }
    frame.set_child(listBox);
    return frame;
}

function createDeviceSelector(label, settingKey, soundDevices) {
    const listBoxRow = new Gtk.ListBoxRow({ 'can-focus': 0 });
    const grid = new Gtk.Grid({
        'can-focus': 0,
        'margin_start': 12,
        'margin_end': 12,
        'margin_top': 12,
        'margin_bottom': 12,
        'column_spacing': 32
    });

    grid.attach(new Gtk.Label({ label: label, 'can-focus': 0 }), 0, 0, 1, 1);

    const comboBoxText = new Gtk.ComboBoxText({ 'can-focus': 0 });
    for (const device of soundDevices) {
        comboBoxText.append(device.uniqueName, device.displayName);
    }
    comboBoxText.connect('changed', () => this.settings.set_string(settingKey, comboBoxText.get_active_id()));
    comboBoxText.set_active_id(this.settings.get_string(settingKey));
    grid.attach(comboBoxText, 1, 0, 1, 1);

    listBoxRow.set_child(grid);
    return listBoxRow;
}

function createModeSelector(onListMode, onDuoMode) {
    const box = new Gtk.Box({
        'can-focus': 0,
        'margin_start': 12,
        'margin_end': 12,
        'margin_top': 12,
        'margin_bottom': 12,
        'spacing': 32,
        'width_request': 100
    });

    box.append(new Gtk.Label({ label: 'Changer Mode', 'can-focus': 0, 'hexpand': 1, 'xalign': 0 }));

    const listModeCheckButton = new Gtk.CheckButton({ 'label': 'List', 'halign': 'center' });
    const duoModeCheckButton = new Gtk.CheckButton({ 'label': 'Duo', 'halign': 'center' });

    const mode = this.settings.get_enum('mode');
    if (mode == Constants.modes.list) {
        listModeCheckButton.set_active(1);
    } else if (mode == Constants.modes.duo) {
        duoModeCheckButton.set_active(1);
    }

    listModeCheckButton.connect('toggled', () => {
        if (listModeCheckButton.get_active() == 1) {
            this.settings.set_enum('mode', Constants.modes.list);
            duoModeCheckButton.set_active(0);
            onListMode();
        }
    });
    duoModeCheckButton.connect('toggled', () => {
        if (duoModeCheckButton.get_active() == 1) {
            this.settings.set_enum('mode', Constants.modes.duo);
            listModeCheckButton.set_active(0);
            onDuoMode();
        }
    });

    box.append(listModeCheckButton);
    box.append(duoModeCheckButton);
    return box;
}