const db = require("./dbInstance");
const path = require("path");
const { app } = require("electron");
const ExcelJS = require("exceljs");

// Initialize database
function initDatabase() {
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

        // Create indexes for better performance
        db.exec("CREATE INDEX IF NOT EXISTS idx_usage_date ON usage(date)");
        db.exec("CREATE INDEX IF NOT EXISTS idx_usage_app ON usage(app_name)");

        console.log("[dbUtils] Database initialized successfully");
    } catch (error) {
        console.error("[dbUtils] Failed to initialize database:", error);
        throw error;
    }
}

// Get usage data for a specific date
function getUsageByDate(date) {
    try {
        return db
            .prepare(
                `
      SELECT app_name, exe_path, duration 
      FROM usage 
      WHERE date = ? 
      ORDER BY duration DESC
    `
            )
            .all(date);
    } catch (error) {
        console.error("[dbUtils] Error getting usage by date:", error);
        return [];
    }
}

// Get PC screen time for a specific date
function getScreenTimeByDate(date) {
    try {
        return db
            .prepare(
                `
      SELECT duration 
      FROM pc_active_time 
      WHERE date = ?
    `
            )
            .all(date);
    } catch (error) {
        console.error("[dbUtils] Error getting screen time by date:", error);
        return [];
    }
}

// Get ALL historical screen time data (instead of just 4 weeks)
function getAllHistoricalData() {
    try {
        return db
            .prepare(
                `
      SELECT date, duration 
      FROM pc_active_time 
      ORDER BY date ASC
    `
            )
            .all();
    } catch (error) {
        console.error("[dbUtils] Error getting all historical data:", error);
        return [];
    }
}

// Keep getWeeklyScreenTime for backward compatibility
function getWeeklyScreenTime() {
    return getAllHistoricalData();
}

// Get today's usage data
function getTodayUsageData() {
    const today = new Date().toISOString().slice(0, 10);
    try {
        return db
            .prepare(
                `
      SELECT app_name, exe_path, SUM(duration) as duration 
      FROM usage 
      WHERE date = ? 
      GROUP BY app_name, exe_path 
      ORDER BY duration DESC
    `
            )
            .all(today);
    } catch (error) {
        console.error("[dbUtils] Error getting today's usage data:", error);
        return [];
    }
}

// Get today's PC screen time
function getTodayScreenTime() {
    const today = new Date().toISOString().slice(0, 10);
    try {
        return db
            .prepare(
                `
      SELECT SUM(duration) as duration 
      FROM pc_active_time 
      WHERE date = ?
    `
            )
            .all(today);
    } catch (error) {
        console.error("[dbUtils] Error getting today's screen time:", error);
        return [];
    }
}

// ✅ helper to convert seconds → human readable
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h > 0 ? `${h}h` : "",
        m > 0 ? `${m}m` : "",
        s > 0 && h === 0 ? `${s}s` : "" // only show seconds if < 1h
    ].filter(Boolean).join(" ");
}

// Export data as Excel
function exportDataAsExcel(startDate, endDate, filePath) {
    try {
        const usageData = db.prepare(`
      SELECT date, app_name, exe_path, duration
      FROM usage
      WHERE date BETWEEN ? AND ?
      ORDER BY date, duration DESC
    `).all(startDate, endDate);

        const screenTimeData = db.prepare(`
      SELECT date, duration
      FROM pc_active_time
      WHERE date BETWEEN ? AND ?
      ORDER BY date
    `).all(startDate, endDate);

        // =================
        // Excel Workbook
        // =================
        const workbook = new ExcelJS.Workbook();

        // --- 1. SUMMARY SHEET ---
        const summarySheet = workbook.addWorksheet("Summary");

        // Quick calculations
        const totalScreenTime = screenTimeData.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalApps = new Set(usageData.map((u) => u.app_name)).size;

        let mostUsedApp = null;
        if (usageData.length > 0) {
            const appTotals = {};
            usageData.forEach((u) => {
                appTotals[u.app_name] = (appTotals[u.app_name] || 0) + u.duration;
            });
            const topApp = Object.entries(appTotals).sort((a, b) => b[1] - a[1])[0];
            mostUsedApp = { name: topApp[0], duration: topApp[1] };
        }

        // Add summary rows
        summarySheet.addRow(["ZenSlice Usage Report"]);
        summarySheet.addRow([`Date Range: ${startDate} → ${endDate}`]);
        summarySheet.addRow([`Total Screen Time: ${formatDuration(totalScreenTime)}`]);
        summarySheet.addRow([`Total Apps Tracked: ${totalApps}`]);
        if (mostUsedApp) {
            summarySheet.addRow([`Most Used App: ${mostUsedApp.name} (${formatDuration(mostUsedApp.duration)})`]);
        }

        // Style
        summarySheet.getRow(1).font = { size: 14, bold: true, color: { argb: "FF5A4A42" } };
        summarySheet.eachRow((row) => {
            row.alignment = { vertical: "middle", horizontal: "left" };
            row.height = 20;
        });

        // --- 2. Usage Data Sheet ---
        const usageSheet = workbook.addWorksheet("Usage Data");
        usageSheet.columns = [
            { header: "Date", key: "date" },
            { header: "App Name", key: "app_name" },
            { header: "Executable Path", key: "exe_path" },
            { header: "Duration", key: "duration" },
        ];

        usageSheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5A4A42" } };
            cell.alignment = { horizontal: "center" };
        });

        usageData.forEach((u) => {
            usageSheet.addRow({
                date: u.date,
                app_name: u.app_name,
                exe_path: u.exe_path,
                duration: formatDuration(u.duration),
            });
        });

        usageSheet.views = [{ state: "frozen", ySplit: 1 }];
        usageSheet.columns.forEach((col) => {
            col.width = Math.max(15, col.header.length + 5);
        });

        // --- 3. Screen Time Sheet ---
        const screenSheet = workbook.addWorksheet("Screen Time");
        screenSheet.columns = [
            { header: "Date", key: "date" },
            { header: "Total Duration", key: "duration" },
        ];

        screenSheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5A4A42" } };
            cell.alignment = { horizontal: "center" };
        });

        screenTimeData.forEach((s) => {
            screenSheet.addRow({
                date: s.date,
                duration: formatDuration(s.duration),
            });
        });

        screenSheet.views = [{ state: "frozen", ySplit: 1 }];
        screenSheet.columns.forEach((col) => {
            col.width = Math.max(15, col.header.length + 5);
        });

        // =================
        // SAVE
        // =================
        return workbook.xlsx.writeFile(filePath);
    } catch (error) {
        console.error("[dbUtils] Export failed:", error);
        throw error;
    }
}

// Clear all data
function clearAllData() {
    try {
        db.exec("DELETE FROM usage");
        db.exec("DELETE FROM pc_active_time");
        db.exec("VACUUM");
        console.log("[dbUtils] All data cleared successfully");
        return true;
    } catch (error) {
        console.error("[dbUtils] Error clearing data:", error);
        return false;
    }
}

// Get database statistics
function getDatabaseStats() {
    try {
        const usageCount = db.prepare("SELECT COUNT(*) as count FROM usage").get();
        const screenTimeCount = db
            .prepare("SELECT COUNT(*) as count FROM pc_active_time")
            .get();
        const fs = require("fs");
        const dbPath = path.join(app.getPath("userData"), "ZenSlice", "usage_data.db");
        const dbSize = fs.statSync(dbPath).size;

        return {
            usageRecords: usageCount.count,
            screenTimeRecords: screenTimeCount.count,
            databaseSize: dbSize,
            databaseSizeMB: (dbSize / (1024 * 1024)).toFixed(2),
        };
    } catch (error) {
        console.error("[dbUtils] Error getting database stats:", error);
        return {
            usageRecords: 0,
            screenTimeRecords: 0,
            databaseSize: 0,
            databaseSizeMB: "0.00",
        };
    }
}

module.exports = {
    initDatabase,
    getUsageByDate,
    getScreenTimeByDate,
    getAllHistoricalData,
    getWeeklyScreenTime,
    getTodayUsageData,
    getTodayScreenTime,
    exportDataAsExcel,
    clearAllData,
    getDatabaseStats,
};
