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
    ipcRenderer.on("usage-updated", callback);
    return () => ipcRenderer.removeAllListeners("usage-updated");
  },
  
  // UPDATE SYSTEM
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (_, info) => callback(info));
    return () => ipcRenderer.removeAllListeners("update-available");
  },
  
  checkForUpdates: () => safeInvoke("check-for-updates", null),
  
  // OPEN EXTERNAL LINK
  openExternal: (url) => ipcRenderer.send("open-external", url),

});