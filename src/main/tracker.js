const { app } = require("electron");
const sqlite3 = require("better-sqlite3");
const path = require("path");
const os = require("os");
const { getIconForPid } = require("../utils/iconUtils");

// Get a writable DB location
function getDbPath() {
  const dataDir = path.join(app.getPath("userData"), "ZenSlice");
  require("fs").mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "usage_data.db");
}

const DB_FILE = getDbPath();

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
  "applicationframehost.exe",
  "credential manager ui host",
  "application frame host",
  "windows start experience host",
]);

// Get the system's temporary directory for exclusion check
const TEMP_DIR = os.tmpdir().toLowerCase();

function initDb() {
  const conn = sqlite3(DB_FILE);
  conn.exec(`
    CREATE TABLE IF NOT EXISTS usage (
      app_name TEXT,
      exe_path TEXT,
      date TEXT,
      duration INTEGER,
      PRIMARY KEY (app_name, date)
    )
  `);
  conn.exec(`
    CREATE TABLE IF NOT EXISTS pc_active_time (
      date TEXT PRIMARY KEY,
      duration INTEGER
    )
  `);
  conn.close();
}

// Local YYYY-MM-DD date (timezone aware)
function getLocalDateKey() {
  return new Date().toLocaleDateString("en-CA");
}

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

function updateAppUsage(conn, appName, exePath, dateStr, duration) {
  const stmt = conn.prepare(`
    INSERT INTO usage (app_name, exe_path, date, duration)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(app_name, date)
    DO UPDATE SET duration = duration + excluded.duration
  `);
  stmt.run(appName, exePath, dateStr, duration);
}

function updatePcScreenTime(conn, dateStr, seconds = 1) {
  const stmt = conn.prepare(`
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

  const conn = sqlite3(DB_FILE);

  const usageTimeMap = new Map();
  let pcTimeCounter = 0;
  let lastCommitTime = Date.now();

  let lastAppKey = null;
  let lastSwitchTime = Date.now();
  let lastDay = getLocalDateKey();

  const intervalId = setInterval(async () => {
    try {
      const now = Date.now();
      const currentDay = getLocalDateKey();

      // Handle midnight transition
      if (currentDay !== lastDay) {
        console.log(`[Tracker] Midnight rollover: ${lastDay} → ${currentDay}`);
        for (const [key, duration] of usageTimeMap.entries()) {
          const [appName, exePath] = key.split("|");
          updateAppUsage(conn, appName, exePath, lastDay, duration);
        }
        updatePcScreenTime(conn, lastDay, pcTimeCounter);

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
          updateAppUsage(conn, appName, exePath, currentDay, duration);
        }

        updatePcScreenTime(conn, currentDay, pcTimeCounter);

        conn.pragma("optimize");
        usageTimeMap.clear();
        pcTimeCounter = 0;
        lastCommitTime = now;
      }
    } catch (error) {
      console.error("[Tracker] Error in tracking loop:", error);
    }
  }, 1000);

  return intervalId;
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
  DB_FILE,
};
