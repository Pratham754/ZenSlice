const db = require("./dbInstance");
const path = require("path");
const { app } = require("electron");
const ExcelJS = require("exceljs");
const { getLocalDateKey } = require("./dateUtils");

function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        app_name TEXT, exe_path TEXT, date TEXT, duration INTEGER,
        PRIMARY KEY (app_name, date)
      );
      CREATE TABLE IF NOT EXISTS pc_active_time (
        date TEXT PRIMARY KEY, duration INTEGER
      );
      CREATE TABLE IF NOT EXISTS app_limits (
        app_name    TEXT PRIMARY KEY,
        limit_seconds INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_categories (
        app_name TEXT PRIMARY KEY,
        category TEXT NOT NULL
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_usage_date ON usage(date)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_usage_app ON usage(app_name)");
    console.log("[dbUtils] Initialized");
  } catch (e) {
    console.error("[dbUtils] Init failed:", e);
    throw e;
  }
}

const query = (sql, ...params) => {
  try { return db.prepare(sql).all(...params); }
  catch (e) { console.error("[dbUtils]", e); return []; }
};

function getUsageByDate(date) {
  return query("SELECT app_name, exe_path, duration FROM usage WHERE date = ? ORDER BY duration DESC", date);
}

function getScreenTimeByDate(date) {
  return query("SELECT duration FROM pc_active_time WHERE date = ?", date);
}

function getAllHistoricalData() {
  return query("SELECT date, duration FROM pc_active_time ORDER BY date ASC");
}

const getWeeklyScreenTime = getAllHistoricalData;

function getTodayUsageData() {
  return query(
    "SELECT app_name, exe_path, SUM(duration) as duration FROM usage WHERE date = ? GROUP BY app_name, exe_path ORDER BY duration DESC",
    getLocalDateKey()
  );
}

function getTodayScreenTime() {
  return query("SELECT SUM(duration) as duration FROM pc_active_time WHERE date = ?", getLocalDateKey());
}

function formatDuration(s) {
  if (!s || s <= 0) return "0s";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h > 0 && `${h}h`, m > 0 && `${m}m`, sec > 0 && h === 0 && `${sec}s`].filter(Boolean).join(" ");
}

const headerStyle = (cell) => {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5A4A42" } };
  cell.alignment = { horizontal: "center" };
};

function makeSheet(wb, name, columns, rows) {
  const sheet = wb.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).eachCell(headerStyle);
  rows.forEach((r) => sheet.addRow(r));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.columns.forEach((c) => (c.width = Math.max(15, c.header.length + 5)));
  return sheet;
}

function exportDataAsExcel(startDate, endDate, filePath) {
  try {
    const usageData = db.prepare("SELECT date, app_name, exe_path, duration FROM usage WHERE date BETWEEN ? AND ? ORDER BY date, duration DESC").all(startDate, endDate);
    const screenData = db.prepare("SELECT date, duration FROM pc_active_time WHERE date BETWEEN ? AND ? ORDER BY date").all(startDate, endDate);

    const wb = new ExcelJS.Workbook();

    // Summary sheet
    const totalTime = screenData.reduce((s, r) => s + (r.duration || 0), 0);
    const totalApps = new Set(usageData.map((u) => u.app_name)).size;
    const appTotals = {};
    usageData.forEach((u) => { appTotals[u.app_name] = (appTotals[u.app_name] || 0) + u.duration; });
    const topApp = Object.entries(appTotals).sort((a, b) => b[1] - a[1])[0];

    const summary = wb.addWorksheet("Summary");
    summary.addRow(["ZenSlice Usage Report"]);
    summary.addRow([`Date Range: ${startDate} → ${endDate}`]);
    summary.addRow([`Total Screen Time: ${formatDuration(totalTime)}`]);
    summary.addRow([`Total Apps Tracked: ${totalApps}`]);
    if (topApp) summary.addRow([`Most Used App: ${topApp[0]} (${formatDuration(topApp[1])})`]);
    summary.getRow(1).font = { size: 14, bold: true, color: { argb: "FF5A4A42" } };
    summary.eachRow((row) => { row.alignment = { vertical: "middle", horizontal: "left" }; row.height = 20; });

    makeSheet(wb, "Usage Data",
      [{ header: "Date", key: "date" }, { header: "App Name", key: "app_name" }, { header: "Executable Path", key: "exe_path" }, { header: "Duration", key: "duration" }],
      usageData.map((u) => ({ ...u, duration: formatDuration(u.duration) }))
    );
    makeSheet(wb, "Screen Time",
      [{ header: "Date", key: "date" }, { header: "Total Duration", key: "duration" }],
      screenData.map((s) => ({ date: s.date, duration: formatDuration(s.duration) }))
    );

    return wb.xlsx.writeFile(filePath);
  } catch (e) {
    console.error("[dbUtils] Export failed:", e);
    throw e;
  }
}

function clearAllData() {
  try {
    db.exec("DELETE FROM usage; DELETE FROM pc_active_time; VACUUM");
    console.log("[dbUtils] Data cleared");
    return true;
  } catch (e) {
    console.error("[dbUtils] Clear failed:", e);
    return false;
  }
}

function getDatabaseStats() {
  try {
    const dbPath = path.join(app.getPath("userData"), "ZenSlice", "usage_data.db");
    const dbSize = require("fs").statSync(dbPath).size;
    return {
      usageRecords: db.prepare("SELECT COUNT(*) as count FROM usage").get().count,
      screenTimeRecords: db.prepare("SELECT COUNT(*) as count FROM pc_active_time").get().count,
      databaseSize: dbSize,
      databaseSizeMB: (dbSize / (1024 * 1024)).toFixed(2),
    };
  } catch (e) {
    console.error("[dbUtils] Stats failed:", e);
    return { usageRecords: 0, screenTimeRecords: 0, databaseSize: 0, databaseSizeMB: "0.00" };
  }
}

// ── App Limits ────────────────────────────────────────────────────────────────

function getAppLimits() {
  try {
    return db.prepare("SELECT app_name, limit_seconds FROM app_limits ORDER BY app_name").all();
  } catch (e) {
    console.error("[dbUtils] getAppLimits failed:", e);
    return [];
  }
}

function setAppLimit(appName, limitSeconds) {
  try {
    db.prepare(`
      INSERT INTO app_limits (app_name, limit_seconds) VALUES (?, ?)
      ON CONFLICT(app_name) DO UPDATE SET limit_seconds = excluded.limit_seconds
    `).run(appName, limitSeconds);
    return true;
  } catch (e) {
    console.error("[dbUtils] setAppLimit failed:", e);
    return false;
  }
}

function removeAppLimit(appName) {
  try {
    db.prepare("DELETE FROM app_limits WHERE app_name = ?").run(appName);
    return true;
  } catch (e) {
    console.error("[dbUtils] removeAppLimit failed:", e);
    return false;
  }
}

// Returns today's per-app usage totals — used for limit checking in tracker
function getTodayUsageTotals(date) {
  try {
    return db.prepare(
      "SELECT app_name, SUM(duration) as duration FROM usage WHERE date = ? GROUP BY app_name"
    ).all(date);
  } catch (e) {
    console.error("[dbUtils] getTodayUsageTotals failed:", e);
    return [];
  }
}

// Returns known app names (distinct, sorted) for the limit picker UI
function getKnownApps() {
  try {
    return db.prepare(
      "SELECT DISTINCT app_name, exe_path FROM usage ORDER BY app_name ASC"
    ).all();
  } catch (e) {
    console.error("[dbUtils] getKnownApps failed:", e);
    return [];
  }
}

// ── App Categories ─────────────────────────────────────────────────────────────

function getAppCategories() {
  try {
    return db.prepare("SELECT app_name, category FROM app_categories ORDER BY app_name").all();
  } catch (e) {
    console.error("[dbUtils] getAppCategories failed:", e);
    return [];
  }
}

function setAppCategory(appName, category) {
  try {
    db.prepare(`
      INSERT INTO app_categories (app_name, category) VALUES (?, ?)
      ON CONFLICT(app_name) DO UPDATE SET category = excluded.category
    `).run(appName, category);
    return true;
  } catch (e) {
    console.error("[dbUtils] setAppCategory failed:", e);
    return false;
  }
}

function removeAppCategory(appName) {
  try {
    db.prepare("DELETE FROM app_categories WHERE app_name = ?").run(appName);
    return true;
  } catch (e) {
    console.error("[dbUtils] removeAppCategory failed:", e);
    return false;
  }
}

module.exports = {
  initDatabase, getUsageByDate, getScreenTimeByDate,
  getAllHistoricalData, getWeeklyScreenTime,
  getTodayUsageData, getTodayScreenTime,
  exportDataAsExcel, clearAllData, getDatabaseStats,
  getAppLimits, setAppLimit, removeAppLimit,
  getTodayUsageTotals, getKnownApps,
  getAppCategories, setAppCategory, removeAppCategory,
};
