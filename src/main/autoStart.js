const { app } = require("electron");

function setAutoStart(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    ...(process.platform === "win32" ? { path: app.getPath("exe") } : {}),
    args: ["--minimized"],
  });
}

function isAutoStartEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

module.exports = { setAutoStart, isAutoStartEnabled };
