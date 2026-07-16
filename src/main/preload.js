const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, fallback, ...args) =>
  ipcRenderer.invoke(channel, ...args).catch((e) => {
    console.error(`❌ IPC Error on ${channel}:`, e);
    return fallback;
  });

const onEvent = (channel, callback) => {
  const listener = (_, ...args) => callback(...args);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld("api", {
  // Window
  minimizeApp: () => ipcRenderer.send("minimize-app"),
  closeApp: () => ipcRenderer.send("close-app"),
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // Data
  getUsageData: () => invoke("get-usage-data", []),
  getPCScreenTime: () => invoke("get-pc-screen-time", []),
  getAppIconByExe: (exePath) => invoke("get-app-icon-by-exe", null, exePath),
  getWeeklyPCScreenTime: () => invoke("get-weekly-screen-time", []),
  getAllHistoricalData: () => invoke("get-all-historical-data", []),
  getPCScreenTimeByDate: (date) => invoke("get-screen-time-by-date", [], date),
  getUsageByDate: (date) => invoke("get-usage-by-date", [], date),
  exportDataExcel: (start, end) => invoke("export-data-excel", { success: false }, { startDate: start, endDate: end }),
  getEarliestDate: () => invoke("get-earliest-date", null),
  clearAllData: () => invoke("clear-all-data", { success: false }),

  // Live updates
  onUsageUpdated: (cb) => onEvent("usage-updated", cb),
  onLimitReached: (cb) => onEvent("limit-reached", cb),
  onFocusStateChanged: (cb) => onEvent("focus-state-changed", cb),

  // App Limits
  getAppLimits: () => invoke("get-app-limits", []),
  setAppLimit: (appName, limitSeconds) => invoke("set-app-limit", { success: false }, { appName, limitSeconds }),
  removeAppLimit: (appName) => invoke("remove-app-limit", { success: false }, appName),
  getKnownApps: () => invoke("get-known-apps", []),

  // App Categories
  getAppCategories: () => invoke("get-app-categories", []),
  setAppCategory: (appName, category) => invoke("set-app-category", { success: false }, { appName, category }),
  removeAppCategory: (appName) => invoke("remove-app-category", { success: false }, appName),
  showItemInFolder: (exePath) => ipcRenderer.send("show-item-in-folder", exePath),

  // Focus Mode
  getFocusState: () => invoke("get-focus-state", { active: false, endsAt: null, blockedApps: [] }),
  setFocusState: (state) => invoke("set-focus-state", { success: false }, state),

  // Updater events
  onUpdateAvailable: (cb) => onEvent("update-available", cb),
  onUpdateNotAvailable: (cb) => onEvent("update-not-available", cb),
  onUpdateDownloadProgress: (cb) => onEvent("update-download-progress", cb),
  onUpdateDownloaded: (cb) => onEvent("update-downloaded", cb),
  onUpdateError: (cb) => onEvent("update-error", cb),

  // Updater actions
  checkForUpdates: () => invoke("check-for-updates", null),
  downloadUpdate: () => invoke("download-update", { success: false }),
  installDownloadedUpdate: () => invoke("quit-and-install-update", { success: false }),
  openDownloadedInstaller: () => invoke("open-downloaded-installer", { success: false }),
});
