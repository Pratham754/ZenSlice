const { ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.autoDownload = false;

let mainWindow = null;
let installerPath = null;

const emit = (channel, payload = {}) => {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send(channel, payload);
};

function setupAutoUpdate(window) {
  mainWindow = window;
  if (process.env.NODE_ENV !== "development") autoUpdater.checkForUpdates();

  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] Available:", info.version);
    emit("update-available", info);
  });
  autoUpdater.on("update-not-available", (info) => {
    console.log("[Updater] Up to date:", info.version);
    emit("update-not-available", info);
  });
  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking...");
    emit("update-checking");
  });
  autoUpdater.on("download-progress", (p) => {
    emit("update-download-progress", { percent: p.percent, transferred: p.transferred, total: p.total, bytesPerSecond: p.bytesPerSecond });
  });
  autoUpdater.on("update-downloaded", (info) => {
    installerPath = info?.downloadedFile || installerPath;
    console.log("[Updater] Downloaded:", installerPath);
    emit("update-downloaded", { version: info?.version, downloadedFile: installerPath || null });
  });
  autoUpdater.on("error", (err) => {
    console.error("[Updater] Error:", err);
    emit("update-error", { message: err?.message || "Update failed" });
  });
}

ipcMain.handle("check-for-updates", async () => {
  try { return await autoUpdater.checkForUpdates(); }
  catch (e) { console.error("[Updater]", e); return null; }
});

ipcMain.handle("download-update", async () => {
  try { await autoUpdater.downloadUpdate(); return { success: true }; }
  catch (e) { return { success: false, error: e?.message || "Download failed" }; }
});

ipcMain.handle("quit-and-install-update", async () => {
  try { autoUpdater.quitAndInstall(false, true); return { success: true }; }
  catch (e) { return { success: false, error: e?.message || "Install failed" }; }
});

ipcMain.handle("open-downloaded-installer", async () => {
  if (!installerPath) return { success: false, error: "Installer path not found. Download update again." };
  try {
    const result = await shell.openPath(installerPath);
    return result ? { success: false, error: result } : { success: true, path: installerPath };
  } catch (e) {
    return { success: false, error: e?.message || "Could not open installer" };
  }
});

module.exports = { setupAutoUpdate };
