// preload.js

const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload script loaded");

contextBridge.exposeInMainWorld("api", {
  // Window control functions
  minimizeApp: () => {
    try {
      ipcRenderer.send("minimize-app");
    } catch (e) {
      console.error("Failed to minimize window:", e);
    }
  },

  closeApp: () => {
    try {
      ipcRenderer.send("close-app");
    } catch (e) {
      console.error("Failed to close window:", e);
    }
  },

  // Fetch usage data for each app
  getUsageData: async () => {
    try {
      return await ipcRenderer.invoke("get-usage-data");
    } catch (error) {
      console.error("❌ Failed to get app usage data:", error);
      return [];
    }
  },

  // Fetch total PC screen time
  getPCScreenTime: async () => {
    try {
      return await ipcRenderer.invoke("get-pc-screen-time");
    } catch (error) {
      console.error("❌ Failed to get PC screen time:", error);
      return [];
    }
  },

  getAppIconByExe: async (exePath) => {
    try {
      return await ipcRenderer.invoke("get-app-icon-by-exe", exePath);
    } catch (e) {
      console.error("Failed to get app icon by exe:", e);
      return null;
    }
  },

  getWeeklyPCScreenTime: async () => {
    try {
      return await ipcRenderer.invoke("get-weekly-screen-time");
    } catch (e) {
      console.error("Failed to fetch weekly screen time:", e);
      return [];
    }
  },

  getPCScreenTimeByDate: async (date) => {
    try {
      return await ipcRenderer.invoke("get-screen-time-by-date", date);
    } catch (e) {
      console.error("Failed to fetch screen time by date:", e);
      return [];
    }
  },

  getUsageByDate: async (date) => {
    try {
      return await ipcRenderer.invoke("get-usage-by-date", date);
    } catch (e) {
      console.t("Failed to fetch usage by date:", e);
      return [];
    }
  },

  exportDataExcel: async (start, end) => {
    try {
      return await ipcRenderer.invoke("export-data-excel", {
        startDate: start,
        endDate: end,
      });
    } catch (e) {
      console.error("Failed to export data:", e);
      return { success: false, error: e.message };
    }
  },

  getEarliestDate: async () => {
    try {
      return await ipcRenderer.invoke("get-earliest-date");
    } catch (e) {
      console.error("Failed to fetch earliest date:", e);
      return null;
    }
  },
});