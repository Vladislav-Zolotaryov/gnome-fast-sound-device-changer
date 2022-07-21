const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

let soundDeviceSelectorPopup;

const SoundDeviceSelectorPopup = GObject.registerClass(
  class SoundDeviceSelectorPopup extends PanelMenu.Button {

    _init() {
      super._init(0);

      const buttonIcon = new St.Icon({ icon_name: 'audio-speakers', icon_size: 16 });
      this.add_child(buttonIcon);

      const command = 'pactl -f "json" list sinks';
      const { success, failure } = executeCommand(command);

      if (failure) {
        sendMessage('Failed to retrieve sound device list', 'Failure due to: ' + failure)
        return;
      }

      const obj = JSON.parse(success);
      var soundDevices = [];
      for (const [_, value] of Object.entries(obj)) {
        soundDevices.push(value);
      }

      for (const soundDevice of soundDevices) {
        const pmItem = new PopupMenu.PopupMenuItem(soundDevice.description);
        this.menu.addMenuItem(pmItem);

        pmItem.connect('activate', () => {
          const { _, failure } = executeCommand('pactl set-default-sink ' + soundDevice.name);
          if (failure) {
            sendMessage('Failed to switch sound device', 'Failure due to: ' + failure);
          }
        });
      }
    }
  }
);

function sendMessage(title, body) {
  Main.notify(title, body);
}

function executeCommand(command) {
  const [_, out, err, exit_code] = GLib.spawn_command_line_sync(command);

  if (!isEmpty(err)) {
    return { failure: 'Could not access sound device list via command "' + command + '" because of error ' + err };
  }

  if (exit_code != 0) {
    return { failure: 'Could not access sound device list via command "' + command + '" because exit code ' + exit_code };
  }

  return { success: out };
}

function isEmpty(value) {
  return (value == null || value.length === 0);
}

function init() { }

function enable() {
  soundDeviceSelectorPopup = new SoundDeviceSelectorPopup();
  Main.panel.addToStatusArea('soundDeviceSelectorPopup', soundDeviceSelectorPopup, 1);
}

function disable() {
  myPopup.destroy();
}