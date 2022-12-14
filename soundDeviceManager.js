const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const executeCommand = Me.imports.utils.executeCommand;
const ByteArray = imports.byteArray;

class SoundDevice {
  constructor(uniqueName, displayName, state, icon) {
    this.uniqueName = uniqueName;
    this.displayName = displayName;
    this.state = state;
    this.icon = icon;
  }
}


function collectSoundDevices() {
  const command = 'pactl -f "json" list sinks';
  const { success, failure } = executeCommand(command);

  if (failure) {
    return { soundDevices: [], failure: failure };
  }

  const obj = JSON.parse(ByteArray.toString(success));
  const soundDevices = [];
  for (const [_, value] of Object.entries(obj)) {
    soundDevices.push(new SoundDevice(
      value.name.trim(),
      value.description.trim(),
      value.state,
      value.properties['device.icon_name']
    ));
  }
  return { soundDevices: soundDevices, failure: null };
}

function setDefaultOutputByName(uniqueName) {
  const { _, failure } = executeCommand('pactl set-default-sink ' + uniqueName);
  if (failure) {
    notifyError('Failed to switch sound device', 'Failure due to: ' + failure);
    return { result: false, error: failure };
  } else {
    return { result: true, error: null };
  }
}

function getDefaultOutputName() {
  const command = 'pactl get-default-sink';
  const { success, failure } = executeCommand(command);

  if (failure) {
    notifyError('Failed to retrieve default sound device name', 'Failure due to: ' + failure)
    return [];
  }

  return ByteArray.toString(success).trim();
}
