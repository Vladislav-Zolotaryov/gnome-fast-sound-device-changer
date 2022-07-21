const GLib = imports.gi.GLib;

function executeCommand(command) {
    const [_, out, err, exit_code] = GLib.spawn_command_line_sync(command);

    if (!isEmpty(err)) {
        return { failure: 'Could not access sound device list via command "' + command + '" because of error ' + err };
    }

    if (exit_code != 0) {
        return { failure: 'Could not access sound device list via command "' + command + '" because of exit code ' + exit_code };
    }

    return { success: out };
}

function isEmpty(value) {
    return (value == null || value.length === 0);
}