const { BrowserWindow, Notification } = require("electron");
const db = require("../utils/dbInstance");
const os = require("os");
const { getLocalDateKey } = require("../utils/dateUtils");
const { initDatabase, getAppLimits, getTodayUsageTotals } = require("../utils/dbUtils");

const EXCLUDED_PROCESSES = new Set([
  "system idle process", "system", "explorer.exe", "runtimebroker.exe",
  "searchui.exe", "startmenuexperiencehost.exe", "taskhostw.exe",
  "shellexperiencehost.exe", "backgroundtaskhost.exe", "applicationframehost.exe",
  "lockapp.exe", "searchhost.exe", "credential manager ui host",
  "application frame host", "windows start experience host",
]);

const TEMP_DIR = os.tmpdir().toLowerCase();

// Track which apps have already had their limit notification sent today
// so we don't spam the user every 10 seconds
const notifiedToday = new Set();
let notifiedDay = getLocalDateKey();

async function getActiveWindowInfo() {
  try {
    const activeWin = await import("active-win");
    const result = await activeWin.default();
    if (!result?.owner?.path) return { appName: null, exePath: null };

    const procName = result.owner.name.toLowerCase();
    const exePath = result.owner.path;

    if (exePath.toLowerCase().startsWith(TEMP_DIR) || EXCLUDED_PROCESSES.has(procName))
      return { appName: null, exePath: null };

    const appName = procName.charAt(0).toUpperCase() + procName.slice(1);
    return { appName, exePath };
  } catch {
    return { appName: null, exePath: null };
  }
}

function addUsage(usageMap, appName, exePath, duration) {
  if (!appName || !exePath || duration <= 0) {
    return;
  }

  const key = `${appName}|${exePath}`;
  usageMap.set(key, (usageMap.get(key) || 0) + duration);
}

function finalizeSession(usageMap, session, endTime) {
  if (!session?.appName || !session?.exePath) {
    return 0;
  }

  const duration = Math.floor((endTime - session.startedAt) / 1000);
  if (duration <= 0) {
    return 0;
  }

  addUsage(usageMap, session.appName, session.exePath, duration);
  return duration;
}

// Check app limits and fire notifications for any breached ones
function checkLimitsAndNotify(today) {
  try {
    // Reset notifications on day rollover
    if (today !== notifiedDay) {
      notifiedToday.clear();
      notifiedDay = today;
    }

    const limits = getAppLimits();
    if (!limits.length) return;

    const totals = getTodayUsageTotals(today);
    const totalMap = new Map(totals.map((r) => [r.app_name, r.duration]));

    for (const limit of limits) {
      const used = totalMap.get(limit.app_name) || 0;
      const limitSecs = limit.limit_seconds;
      const notifyKey = `${limit.app_name}_${today}`;

      // Fire at 100% (limit hit)
      if (used >= limitSecs && !notifiedToday.has(notifyKey)) {
        notifiedToday.add(notifyKey);
        const n = new Notification({
          title: "⏰ App Limit Reached — ZenSlice",
          body: `You've hit your daily limit for ${limit.app_name}.`,
          silent: false,
        });
        n.show();
        // Broadcast to renderer so UI can show the blocked state
        BrowserWindow.getAllWindows().forEach((win) => {
          try { win.webContents.send("limit-reached", { appName: limit.app_name, limitSeconds: limitSecs, usedSeconds: used }); }
          catch (_) {}
        });
      }

      // Fire a 5-minute warning (limit - 300s)
      const warnKey = `${limit.app_name}_warn_${today}`;
      if (used >= limitSecs - 300 && used < limitSecs && !notifiedToday.has(warnKey)) {
        notifiedToday.add(warnKey);
        const remaining = Math.ceil((limitSecs - used) / 60);
        const n = new Notification({
          title: "⚠️ Approaching Limit — ZenSlice",
          body: `${limit.app_name}: ${remaining} minute${remaining !== 1 ? "s" : ""} left today.`,
          silent: true,
        });
        n.show();
      }
    }
  } catch (e) {
    console.error("[Tracker] Limit check error:", e);
  }
}

const upsertUsage = db.prepare(`
  INSERT INTO usage (app_name, exe_path, date, duration) VALUES (?, ?, ?, ?)
  ON CONFLICT(app_name, date) DO UPDATE SET duration = duration + excluded.duration
`);

const upsertScreenTime = db.prepare(`
  INSERT INTO pc_active_time (date, duration) VALUES (?, ?)
  ON CONFLICT(date) DO UPDATE SET duration = duration + excluded.duration
`);

function trackUsage() {
  initDatabase();
  console.log("[Tracker] Running...");

  const usageMap = new Map();
  let pcCounter = 0;
  let lastCommit = Date.now();
  let currentSession = null;
  let lastDay = getLocalDateKey();
  let timerId = null;

  const loop = async () => {
    try {
      const now = Date.now();
      const today = getLocalDateKey();
      const activity = await getActiveWindowInfo();

      const nextKey = activity.appName && activity.exePath ? `${activity.appName}|${activity.exePath}` : null;
      const currentKey = currentSession?.appName && currentSession?.exePath ? `${currentSession.appName}|${currentSession.exePath}` : null;

      if (today !== lastDay) {
        console.log(`[Tracker] Midnight rollover: ${lastDay} → ${today}`);
        pcCounter += finalizeSession(usageMap, currentSession, now);
        currentSession = nextKey ? { ...activity, startedAt: now } : null;
        for (const [key, dur] of usageMap) {
          const [appName, exePath] = key.split("|");
          upsertUsage.run(appName, exePath, lastDay, dur);
        }
        upsertScreenTime.run(lastDay, pcCounter);
        usageMap.clear(); pcCounter = 0;
        lastDay = today; lastCommit = now;
      } else if (nextKey !== currentKey) {
        pcCounter += finalizeSession(usageMap, currentSession, now);
        currentSession = nextKey ? { ...activity, startedAt: now } : null;
      }

      if (now - lastCommit >= 10000) {
        for (const [key, dur] of usageMap) {
          const [appName, exePath] = key.split("|");
          upsertUsage.run(appName, exePath, today, dur);
        }
        upsertScreenTime.run(today, pcCounter);
        db.pragma("optimize");
        usageMap.clear(); pcCounter = 0; lastCommit = now;

        // Check app limits and fire notifications if needed
        checkLimitsAndNotify(today);

        BrowserWindow.getAllWindows().forEach((win) => {
          try { win.webContents.send("usage-updated"); }
          catch (e) { console.error("[Tracker] Failed to notify frontend:", e); }
        });
      }
    } catch (e) {
      console.error("[Tracker] Error:", e);
    }
    timerId = setTimeout(loop, 1000);
  };

  loop();
  return () => clearTimeout(timerId);
}

module.exports = { trackUsage };
