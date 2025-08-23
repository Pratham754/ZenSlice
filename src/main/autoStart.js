// autoStart.js

const { app } = require('electron');

/**
 * Toggles the app's auto-start status.
 * @param {boolean} enable If true, sets the app to start on login. If false, it disables it.
 */
function setAutoStart(enable) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
      args: ['--minimized'],
    });
  } else {
    // macOS and Linux
    app.setLoginItemSettings({
      openAtLogin: enable,
      args: ['--minimized'],
    });
  }
}

/**
 * Checks if the app is currently configured to auto-start.
 * @returns {boolean} True if the app is set to auto-start, false otherwise.
 */
function isAutoStartEnabled() {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
}

module.exports = {
  setAutoStart,
  isAutoStartEnabled,
};
