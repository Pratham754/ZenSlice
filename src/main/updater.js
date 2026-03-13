// src/main/updater.js
// Auto-update handler using electron-updater

const { app, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let mainWindow = null;

function setupAutoUpdate(window) {
  mainWindow = window;

  // Check for updates on app start
  autoUpdater.checkForUpdatesAndNotify();

  // Listen for update events
  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] New version available:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[Updater] Update downloaded:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("[Updater] Error:", error);
  });

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates...");
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("[Updater] No updates available. Latest version: ", info.version);
  });
}

// IPC handler to install updates and restart
ipcMain.on("quitAndInstall", () => {
  autoUpdater.quitAndInstall();
});

// IPC handler to check for updates manually
ipcMain.handle("check-for-updates", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error("[Updater] Error checking for updates:", error);
    return null;
  }
});

module.exports = { setupAutoUpdate };
