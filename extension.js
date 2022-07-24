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
      } else if (this.selectedDevice.deviceName == this.deviceA.deviceName) {
        nextDevice = this.deviceB;
      } else if (this.selectedDevice.deviceName == this.deviceB.deviceName) {
        nextDevice = this.deviceA;
      } else {
        nextDevice = this.deviceA;
      }

      const { _, failure } = executeCommand('pactl set-default-sink ' + nextDevice.deviceName);
      if (failure) {
        notifyError('Failed to switch sound device', 'Failure due to: ' + failure);
      } else {
        this.selectedDevice = nextDevice;
        this.remove_child(this.currentIcon);
        this.add_child(nextDevice.icon);
        this.currentIcon = nextDevice.icon;
      }
    }

    _init() {      
      super._init(1);
      this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.sound.device.changer');

      const speakersIcon = new St.Icon({ icon_name: 'audio-speakers', icon_size: 16 });
      const headsetIcon = new St.Icon({ icon_name: 'audio-headphones', icon_size: 16 });

      this.currentIcon = headsetIcon;
      this.add_child(headsetIcon);
      this.selectedDevice = null;
      
      this.deviceA = {
        icon: speakersIcon,
        deviceName: this.settings.get_string('device-a')
      }

      this.deviceB = {
        icon: headsetIcon,
        deviceName: this.settings.get_string('device-b')
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

      const { _, failure } = executeCommand('pactl set-default-sink ' + soundDevice.name);
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

      const soundDevices = SoundDeviceManager.collectSoundDevices();

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