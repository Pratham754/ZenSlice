const { app, BrowserWindow } = require("electron");
const db = require("../utils/dbInstance"); // Shared WAL connection
const path = require("path");
const os = require("os");
const { getIconForPid } = require("../utils/iconUtils");
const { getLocalDateKey } = require("../utils/dateUtils");

// Processes to ignore (case-insensitive)
const EXCLUDED_PROCESSES = new Set([
  "system idle process",
  "system",
  "explorer.exe",
  "runtimebroker.exe",
  "searchui.exe",
  "startmenuexperiencehost.exe",
  "taskhostw.exe",
  "shellexperiencehost.exe",
  "backgroundtaskhost.exe",
  "applicationframehost.exe",
  "lockapp.exe",
  "searchhost.exe",
  "credential manager ui host",
  "application frame host",
  "windows start experience host",
]);

// Get the system's temporary directory for exclusion check
const TEMP_DIR = os.tmpdir().toLowerCase();

function initDb() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        app_name TEXT,
        exe_path TEXT,
        date TEXT,
        duration INTEGER,
        PRIMARY KEY (app_name, date)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS pc_active_time (
        date TEXT PRIMARY KEY,
        duration INTEGER
      )
    `);
    console.log("[Tracker] Database initialized successfully");
  } catch (error) {
    console.error("[Tracker] Failed to initialize database:", error);
    throw error;
  }
}

// Local YYYY-MM-DD date (timezone aware)
// Now using shared function from dateUtils
// getLocalDateKey is imported from dateUtils

async function getActiveWindowInfo() {
  try {
    const activeWin = await import("active-win");
    const result = await activeWin.default();

    if (!result || !result.owner || !result.owner.path) {
      return { appName: null, exePath: null, pid: null };
    }

    const procName = result.owner.name.toLowerCase();
    const exePath = result.owner.path;

    if (exePath.toLowerCase().startsWith(TEMP_DIR)) {
      console.warn(`[Tracker] Ignoring temporary process: ${exePath}`);
      return { appName: null, exePath: null, pid: null };
    }

    if (EXCLUDED_PROCESSES.has(procName)) {
      return { appName: null, exePath: null, pid: null };
    }

    const appDisplayName =
      procName.replace(".exe", "").charAt(0).toUpperCase() +
      procName.replace(".exe", "").slice(1);

    return { appName: appDisplayName, exePath, pid: result.owner.processId };
  } catch (error) {
    console.error("[WARN] Cannot get active window:", error);
    return { appName: null, exePath: null, pid: null };
  }
}

function updateAppUsage(appName, exePath, dateStr, duration) {
  const stmt = db.prepare(`
    INSERT INTO usage (app_name, exe_path, date, duration)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(app_name, date)
    DO UPDATE SET duration = duration + excluded.duration
  `);
  stmt.run(appName, exePath, dateStr, duration);
}

function updatePcScreenTime(dateStr, seconds = 1) {
  const stmt = db.prepare(`
    INSERT INTO pc_active_time (date, duration)
    VALUES (?, ?)
    ON CONFLICT(date)
    DO UPDATE SET duration = duration + excluded.duration
  `);
  stmt.run(dateStr, seconds);
}

function trackUsage() {
  initDb();
  console.log("[Tracker] Running...");

  const usageTimeMap = new Map();
  let pcTimeCounter = 0;
  let lastCommitTime = Date.now();

  let lastAppKey = null;
  let lastSwitchTime = Date.now();
  let lastDay = getLocalDateKey();
  let timerId = null;

  const trackLoop = async () => {
    try {
      const now = Date.now();
      const currentDay = getLocalDateKey();

      // Handle midnight transition
      if (currentDay !== lastDay) {
        console.log(`[Tracker] Midnight rollover: ${lastDay} → ${currentDay}`);
        for (const [key, duration] of usageTimeMap.entries()) {
          const [appName, exePath] = key.split("|");
          updateAppUsage(appName, exePath, lastDay, duration);
        }
        updatePcScreenTime(lastDay, pcTimeCounter);

        usageTimeMap.clear();
        pcTimeCounter = 0;
        lastDay = currentDay;
        lastSwitchTime = now;
        lastCommitTime = now;
      }

      const {
        appName: newApp,
        exePath: newPath,
        pid: newPid,
      } = await getActiveWindowInfo();

      const newKey = newApp && newPath ? `${newApp}|${newPath}` : null;

      if (newKey !== lastAppKey) {
        if (lastAppKey) {
          const duration = Math.floor((now - lastSwitchTime) / 1000);
          const currentCount = usageTimeMap.get(lastAppKey) || 0;
          usageTimeMap.set(lastAppKey, currentCount + duration);
          pcTimeCounter += duration;
        }
        lastSwitchTime = now;
        lastAppKey = newKey;
      }

      // Commit every 10 seconds
      if (now - lastCommitTime >= 10000) {
        for (const [key, duration] of usageTimeMap.entries()) {
          const [appName, exePath] = key.split("|");
          updateAppUsage(appName, exePath, currentDay, duration);
        }

        updatePcScreenTime(currentDay, pcTimeCounter);
        db.pragma("optimize");
        usageTimeMap.clear();
        pcTimeCounter = 0;
        lastCommitTime = now;

        // Notify frontend for live updates
        BrowserWindow.getAllWindows().forEach(win => {
          try {
            win.webContents.send("usage-updated");
          } catch (e) {
            console.error("[Tracker] Failed to send usage-updated event:", e);
          }
        });
      }
    } catch (error) {
      console.error("[Tracker] Error in tracking loop:", error);
    }

    // Recursive setTimeout prevents overlapping executions
    timerId = setTimeout(trackLoop, 1000);
  };

  trackLoop();

  // Return a cleanup function
  return () => clearTimeout(timerId);
}

function getIconBase64ForPid(pid) {
  const iconBytes = getIconForPid(pid);
  if (iconBytes) {
    return Buffer.from(iconBytes).toString("base64");
  }
  return null;
}

module.exports = {
  trackUsage,
  getIconBase64ForPid,
};
