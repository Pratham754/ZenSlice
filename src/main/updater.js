// src/main/updater.js
// Auto-update checker (in-app download/install flow)

const { ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let mainWindow = null;
let downloadedInstallerPath = null;

function emitUpdateEvent(channel, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channel, payload);
}

function setupAutoUpdate(window) {
  mainWindow = window;

  // Disable automatic downloading
  autoUpdater.autoDownload = false;

  // Check for updates when app starts (only when packaged)
  if (process.env.NODE_ENV !== "development") {
    autoUpdater.checkForUpdates();
  }

  // ----------------------------
  // Update available
  // ----------------------------
  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] New version available:", info.version);
    emitUpdateEvent("update-available", info);
  });

  // ----------------------------
  // No update available
  // ----------------------------
  autoUpdater.on("update-not-available", (info) => {
    console.log("[Updater] No updates available. Latest:", info.version);
    emitUpdateEvent("update-not-available", info);
  });

  // ----------------------------
  // Checking
  // ----------------------------
  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates...");
    emitUpdateEvent("update-checking");
  });

  autoUpdater.on("download-progress", (progressObj) => {
    emitUpdateEvent("update-download-progress", {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    downloadedInstallerPath = info?.downloadedFile || downloadedInstallerPath;
    console.log("[Updater] Update downloaded", downloadedInstallerPath || "");
    emitUpdateEvent("update-downloaded", {
      version: info?.version,
      downloadedFile: downloadedInstallerPath || null,
    });
  });

  // ----------------------------
  // Errors
  // ----------------------------
  autoUpdater.on("error", (error) => {
    console.error("[Updater] Error:", error);
    emitUpdateEvent("update-error", {
      message: error?.message || "Update failed",
    });
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

// IPC: Download available update
ipcMain.handle("download-update", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error("[Updater] Error downloading update:", error);
    return { success: false, error: error?.message || "Download failed" };
  }
});

// IPC: Install downloaded update and restart app
ipcMain.handle("quit-and-install-update", async () => {
  try {
    // keep forceRunAfter=true so app relaunches after installer completes.
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    console.error("[Updater] Error during quitAndInstall:", error);
    return {
      success: false,
      error: error?.message || "Install failed",
    };
  }
});

// IPC: Unsigned fallback - open downloaded installer manually
ipcMain.handle("open-downloaded-installer", async () => {
  try {
    if (!downloadedInstallerPath) {
      return {
        success: false,
        error: "Installer path not found. Download update again.",
      };
    }

    const result = await shell.openPath(downloadedInstallerPath);
    if (result) {
      return { success: false, error: result };
    }

    return { success: true, path: downloadedInstallerPath };
  } catch (error) {
    console.error("[Updater] Failed to open downloaded installer:", error);
    return {
      success: false,
      error: error?.message || "Could not open installer",
    };
  }
});

module.exports = { setupAutoUpdate };