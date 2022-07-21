'use strict';

const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const collectSoundDevices = Me.imports.soundDevices.collectSoundDevices;
const executeCommand = Me.imports.utils.executeCommand;



const SoundDeviceSelectorPopup = GObject.registerClass(
  class SoundDeviceSelectorPopup extends PanelMenu.Button {

    _onSoundDeviceSelected(selectedItem, soundDevice) {
      for (const item of this.items) {
        item.setOrnament(PopupMenu.Ornament.NONE);
      }

      const { _, failure } = executeCommand('pactl set-default-sink ' + soundDevice.name);
      if (failure) {
        notifyError('Failed to switch sound device', 'Failure due to: ' + failure);
      } else {
        selectedItem.setOrnament(PopupMenu.Ornament.DOT);
      }
    }

    _init() {
      const speakersIcon = new St.Icon({ icon_name: 'audio-speakers', icon_size: 16 });
      // const headsetIcon = new St.Icon({ icon_name: 'audio-headset', icon_size: 16 });

      super._init(0);
      this.add_child(speakersIcon);
      this.items = [];

      const soundDevices = collectSoundDevices();

      for (const soundDevice of soundDevices) {
        const popupItem = new PopupMenu.PopupMenuItem(soundDevice.description);
        this.items.push(popupItem);
        this.menu.addMenuItem(popupItem);

        // TODO bug on first init nothing is ornated
        popupItem.setOrnament(soundDevice.state === 'RUNNING'
          ? PopupMenu.Ornament.DOT
          : PopupMenu.Ornament.NONE);

        popupItem.connect('activate', () => {
          this._onSoundDeviceSelected(popupItem, soundDevice);
        });
      }
    }
  }
);

function notifyError(title, body) {
  Main.notifyError(title, body);
}

let soundDeviceSelectorPopup;

function init() { }

function enable() {
  soundDeviceSelectorPopup = new SoundDeviceSelectorPopup();
  Main.panel.addToStatusArea('soundDeviceSelector', soundDeviceSelectorPopup, 0);
}

function disable() {
  soundDeviceSelectorPopup.destroy();
}