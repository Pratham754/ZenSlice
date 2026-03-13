// preload.js

const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload script loaded");

// Reusable IPC wrapper to reduce code duplication
const safeInvoke = async (channel, fallback, ...args) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`❌ IPC Error on ${channel}:`, error);
    return fallback;
  }
};

contextBridge.exposeInMainWorld("api", {
  // Window control functions
  minimizeApp: () => ipcRenderer.send("minimize-app"),
  closeApp: () => ipcRenderer.send("close-app"),

  // Data fetching functions
  getUsageData: () => safeInvoke("get-usage-data", []),
  getPCScreenTime: () => safeInvoke("get-pc-screen-time", []),
  getAppIconByExe: (exePath) => safeInvoke("get-app-icon-by-exe", null, exePath),
  getWeeklyPCScreenTime: () => safeInvoke("get-weekly-screen-time", []),
  getAllHistoricalData: () => safeInvoke("get-all-historical-data", []),
  getPCScreenTimeByDate: (date) => safeInvoke("get-screen-time-by-date", [], date),
  getUsageByDate: (date) => safeInvoke("get-usage-by-date", [], date),
  exportDataExcel: (start, end) => safeInvoke("export-data-excel", { success: false }, { startDate: start, endDate: end }),
  getEarliestDate: () => safeInvoke("get-earliest-date", null),

  // Real-time listener for live updates
  onUsageUpdated: (callback) => {
    ipcRenderer.on("usage-updated", callback);
    return () => ipcRenderer.removeAllListeners("usage-updated");
  },

  // Update notifications
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", callback);
    return () => ipcRenderer.removeAllListeners("update-available");
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update-downloaded", callback);
    return () => ipcRenderer.removeAllListeners("update-downloaded");
  },

  checkForUpdates: () => safeInvoke("check-for-updates", null),

  quitAndInstall: () => ipcRenderer.send("quitAndInstall"),
});