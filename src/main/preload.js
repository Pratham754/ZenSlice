// preload.js

const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload script loaded");

// Reusable IPC wrapper
const safeInvoke = async (channel, fallback, ...args) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`❌ IPC Error on ${channel}:`, error);
    return fallback;
  }
};

contextBridge.exposeInMainWorld("api", {

  // WINDOW CONTROLS
  minimizeApp: () => ipcRenderer.send("minimize-app"),
  closeApp: () => ipcRenderer.send("close-app"),

  // APP INFO
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // DATA FUNCTIONS
  getUsageData: () => safeInvoke("get-usage-data", []),
  getPCScreenTime: () => safeInvoke("get-pc-screen-time", []),
  getAppIconByExe: (exePath) => safeInvoke("get-app-icon-by-exe", null, exePath),
  getWeeklyPCScreenTime: () => safeInvoke("get-weekly-screen-time", []),
  getAllHistoricalData: () => safeInvoke("get-all-historical-data", []),
  getPCScreenTimeByDate: (date) => safeInvoke("get-screen-time-by-date", [], date),
  getUsageByDate: (date) => safeInvoke("get-usage-by-date", [], date),

  exportDataExcel: (start, end) =>
    safeInvoke("export-data-excel", { success: false }, { startDate: start, endDate: end }),

  getEarliestDate: () => safeInvoke("get-earliest-date", null),

  // REAL-TIME EVENTS
  onUsageUpdated: (callback) => {
    const listener = (...args) => callback(...args);
    ipcRenderer.on("usage-updated", listener);
    return () => ipcRenderer.removeListener("usage-updated", listener);
  },
  
  // UPDATE SYSTEM
  onUpdateAvailable: (callback) => {
    const listener = (_, info) => callback(info);
    ipcRenderer.on("update-available", listener);
    return () => ipcRenderer.removeListener("update-available", listener);
  },

  onUpdateNotAvailable: (callback) => {
    const listener = (_, info) => callback(info);
    ipcRenderer.on("update-not-available", listener);
    return () => ipcRenderer.removeListener("update-not-available", listener);
  },

  onUpdateDownloadProgress: (callback) => {
    const listener = (_, progress) => callback(progress);
    ipcRenderer.on("update-download-progress", listener);
    return () => ipcRenderer.removeListener("update-download-progress", listener);
  },

  onUpdateDownloaded: (callback) => {
    const listener = (_, info) => callback(info);
    ipcRenderer.on("update-downloaded", listener);
    return () => ipcRenderer.removeListener("update-downloaded", listener);
  },

  onUpdateError: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("update-error", listener);
    return () => ipcRenderer.removeListener("update-error", listener);
  },
  
  checkForUpdates: () => safeInvoke("check-for-updates", null),
  downloadUpdate: () => safeInvoke("download-update", { success: false }),
  installDownloadedUpdate: () => safeInvoke("quit-and-install-update", { success: false }),
  openDownloadedInstaller: () => safeInvoke("open-downloaded-installer", { success: false }),
  
  // OPEN EXTERNAL LINK
  openExternal: (url) => ipcRenderer.send("open-external", url),

});