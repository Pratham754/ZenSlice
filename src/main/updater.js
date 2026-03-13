// src/main/updater.js
// Auto-update checker (GitHub redirect version)

const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let mainWindow = null;

function setupAutoUpdate(window) {
  mainWindow = window;

  // Disable automatic downloading
  autoUpdater.autoDownload = false;

  // Check for updates when app starts
  autoUpdater.checkForUpdates();

  // ----------------------------
  // Update available
  // ----------------------------
  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] New version available:", info.version);

    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  // ----------------------------
  // No update available
  // ----------------------------
  autoUpdater.on("update-not-available", (info) => {
    console.log("[Updater] No updates available. Latest:", info.version);
  });

  // ----------------------------
  // Checking
  // ----------------------------
  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates...");
  });

  // ----------------------------
  // Errors
  // ----------------------------
  autoUpdater.on("error", (error) => {
    console.error("[Updater] Error:", error);
  });
}

// -----------------------------------
// IPC: Manual check for updates
// -----------------------------------
ipcMain.handle("check-for-updates", async () => {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error("[Updater] Error checking for updates:", error);
    return null;
  }
});

module.exports = { setupAutoUpdate };