const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const executeCommand = Me.imports.utils.executeCommand;

function collectSoundDevices() {
    const command = 'pactl -f "json" list sinks';
    const { success, failure } = executeCommand(command);
  
    if (failure) {
      notifyError('Failed to retrieve sound device list', 'Failure due to: ' + failure)
      return [];
    }
  
    const obj = JSON.parse(success);
    const soundDevices = [];
    for (const [_, value] of Object.entries(obj)) {
      soundDevices.push(value);
    }
    return soundDevices;
  }
  