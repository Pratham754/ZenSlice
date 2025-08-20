// preload.js

const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload script loaded");

contextBridge.exposeInMainWorld("api", {
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
      console.error("Failed to fetch usage by date:", e);
      return [];
    }
  },
  
  enableAutoStart: async () => {
    try {
      return await ipcRenderer.invoke("enable-auto-start");
    } catch (e) {
      console.error("Failed to enable auto-start:", e);
      return false;
    }
  },
  
  disableAutoStart: async () => {
    try {
      return await ipcRenderer.invoke("disable-auto-start");
    } catch (e) {
      console.error("Failed to disable auto-start:", e);
      return false;
    }
  },
  
  checkAutoStart: async () => {
    try {
      return await ipcRenderer.invoke("check-auto-start");
    } catch (e) {
      console.error("Failed to check auto-start:", e);
      return false;
    }
  },
});