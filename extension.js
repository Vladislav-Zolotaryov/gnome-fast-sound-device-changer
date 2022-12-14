'use strict';

const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const SoundDeviceManager = Me.imports.soundDeviceManager;
const executeCommand = Me.imports.utils.executeCommand;
const Constants = Me.imports.constants;


const SoundDeviceToggle = GObject.registerClass(
  class SoundDeviceToggle extends PanelMenu.Button {

    onSoundDeviceToggle() {
      let nextDevice;
      if (this.selectedDevice == null) {
        nextDevice = this.deviceA;
      } else if (this.selectedDevice.uniqueName == this.deviceA.uniqueName) {
        nextDevice = this.deviceB;
      } else if (this.selectedDevice.uniqueName == this.deviceB.uniqueName) {
        nextDevice = this.deviceA;
      } else {
        nextDevice = this.deviceA;
      }

      const { result, _ } = SoundDeviceManager.setDefaultOutputByName(nextDevice.uniqueName);
      if (result) {
        this.selectedDevice = nextDevice;
        this.remove_child(this.currentIcon);
        this.add_child(nextDevice.icon);
        this.currentIcon = nextDevice.icon;
      }
    }

    _init() {
      super._init(1);
      this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.sound.device.changer');

      this.deviceA = {
        icon: new St.Icon({ icon_name: 'audio-speakers', icon_size: 16 }),
        uniqueName: this.settings.get_string('device-a')
      }

      this.deviceB = {
        icon: new St.Icon({ icon_name: 'audio-headphones', icon_size: 16 }),
        uniqueName: this.settings.get_string('device-b')
      }

      const { soundDevices, failure } = SoundDeviceManager.collectSoundDevices();
      if (failure) {
        notifyError(failure);
      }
      
      const defaultOutputDevice = SoundDeviceManager.getDefaultOutputName();

      const runningDevice = soundDevices.find(soundDevice => soundDevice.uniqueName == defaultOutputDevice);

      this.defaultDevice = {
        icon: new St.Icon({ icon_name: runningDevice ? runningDevice.icon : 'audio-card', icon_size: 16 }),
        uniqueName: this.settings.get_string('device-b'),
      }

      if (runningDevice != null && runningDevice.uniqueName == this.settings.get_string('device-a')) {
        this.currentIcon = this.deviceA.icon;
        this.add_child(this.deviceA.icon);
        this.selectedDevice = this.deviceA;
      } else if (runningDevice != null && runningDevice.uniqueName == this.settings.get_string('device-b')) {
        this.currentIcon = this.deviceB.icon;
        this.add_child(this.deviceB.icon);
        this.selectedDevice = this.deviceB;
      } else if (runningDevice) {
        this.currentIcon = this.defaultDevice.icon;
        this.add_child(this.defaultDevice.icon);
        this.selectedDevice = null;
      } else {
        const emptyDeviceIcon = new St.Icon({ icon_name: 'audio-card', icon_size: 16 });
        this.currentIcon = emptyDeviceIcon;
        this.add_child(emptyDeviceIcon);
        this.selectedDevice = null;
      }

      this.buttonEventHandle = this.connect('button-release-event', () => { this.onSoundDeviceToggle(); });
    }
  }
);

const SoundDeviceSelectorPopup = GObject.registerClass(
  class SoundDeviceSelectorPopup extends PanelMenu.Button {

    _onSoundDeviceSelected(selectedItem, soundDevice) {
      for (const item of this.items) {
        item.setOrnament(PopupMenu.Ornament.NONE);
      }

      const { _, failure } = executeCommand('pactl set-default-sink ' + soundDevice.uniqueName);
      if (failure) {
        notifyError('Failed to switch sound device', 'Failure due to: ' + failure);
      } else {
        selectedItem.setOrnament(PopupMenu.Ornament.DOT);
      }
    }

    _init() {
      const speakersIcon = new St.Icon({ icon_name: 'audio-speakers', icon_size: 16 });

      super._init(0);
      this.add_child(speakersIcon);
      this.items = [];

      const { soundDevices, failure } = SoundDeviceManager.collectSoundDevices();
      if (failure) {
        notifyError(failure);
      }

      for (const soundDevice of soundDevices) {
        const popupItem = new PopupMenu.PopupMenuItem(soundDevice.displayName);
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

function init() {
  this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.sound.device.changer');
}

function enable() {
  const settingsMode = settings.get_enum('mode');
  if (settingsMode == Constants.modes.list) {
    this.soundDeviceSelectorPopup = new SoundDeviceSelectorPopup();
    Main.panel.addToStatusArea('soundDeviceSelector', this.soundDeviceSelectorPopup, 0);
  } else if (settingsMode == Constants.modes.duo) {
    this.soundDeviceSelectorPopup = new SoundDeviceToggle();
    Main.panel.addToStatusArea('soundDeviceSelector', this.soundDeviceSelectorPopup, 0);
  }
}

function disable() {
  if (this.soundDeviceSelectorPopup) {
    this.soundDeviceSelectorPopup.destroy();
  }
}