const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Get database path
function getDbPath() {
  const dataDir = path.join(app.getPath('userData'), "ZenSlice");
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "usage_data.db");
}

const DB_PATH = getDbPath();

// Initialize database
function initDatabase() {
  const db = new Database(DB_PATH);
  
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
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_date ON usage(date)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_app ON usage(app_name)');
    
    console.log('[dbUtils] Database initialized successfully');
  } catch (error) {
    console.error('[dbUtils] Failed to initialize database:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Get usage data for a specific date
function getUsageByDate(date) {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.prepare(`
      SELECT app_name, exe_path, duration 
      FROM usage 
      WHERE date = ? 
      ORDER BY duration DESC
    `).all(date);
  } catch (error) {
    console.error('[dbUtils] Error getting usage by date:', error);
    return [];
  } finally {
    db.close();
  }
}

// Get PC screen time for a specific date
function getScreenTimeByDate(date) {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.prepare(`
      SELECT duration 
      FROM pc_active_time 
      WHERE date = ?
    `).all(date);
  } catch (error) {
    console.error('[dbUtils] Error getting screen time by date:', error);
    return [];
  } finally {
    db.close();
  }
}

// Get weekly screen time data
function getWeeklyScreenTime() {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.prepare(`
      SELECT date, duration 
      FROM pc_active_time 
      WHERE date >= date('now', '-28 days') 
      ORDER BY date ASC
    `).all();
  } catch (error) {
    console.error('[dbUtils] Error getting weekly screen time:', error);
    return [];
  } finally {
    db.close();
  }
}

// Get today's usage data
function getTodayUsageData() {
  const today = new Date().toISOString().slice(0, 10);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.prepare(`
      SELECT app_name, exe_path, SUM(duration) as duration 
      FROM usage 
      WHERE date = ? 
      GROUP BY app_name, exe_path 
      ORDER BY duration DESC
    `).all(today);
  } catch (error) {
    console.error('[dbUtils] Error getting today\'s usage data:', error);
    return [];
  } finally {
    db.close();
  }
}

// Get today's PC screen time
function getTodayScreenTime() {
  const today = new Date().toISOString().slice(0, 10);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    return db.prepare(`
      SELECT SUM(duration) as duration 
      FROM pc_active_time 
      WHERE date = ?
    `).all(today);
  } catch (error) {
    console.error('[dbUtils] Error getting today\'s screen time:', error);
    return [];
  } finally {
    db.close();
  }
}

// Export data as CSV
function exportDataAsCSV(startDate, endDate) {
  const db = new Database(DB_PATH, { readonly: true });
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
    
    return {
      usage: usageData,
      screenTime: screenTimeData
    };
  } catch (error) {
    console.error('[dbUtils] Error exporting data:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Clear all data
function clearAllData() {
  const db = new Database(DB_PATH);
  try {
    db.exec('DELETE FROM usage');
    db.exec('DELETE FROM pc_active_time');
    db.exec('VACUUM');
    console.log('[dbUtils] All data cleared successfully');
    return true;
  } catch (error) {
    console.error('[dbUtils] Error clearing data:', error);
    return false;
  } finally {
    db.close();
  }
}

// Get database statistics
function getDatabaseStats() {
  const db = new Database(DB_PATH, { readonly: true });
  try {
    const usageCount = db.prepare('SELECT COUNT(*) as count FROM usage').get();
    const screenTimeCount = db.prepare('SELECT COUNT(*) as count FROM pc_active_time').get();
    const dbSize = fs.statSync(DB_PATH).size;
    
    return {
      usageRecords: usageCount.count,
      screenTimeRecords: screenTimeCount.count,
      databaseSize: dbSize,
      databaseSizeMB: (dbSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('[dbUtils] Error getting database stats:', error);
    return { usageRecords: 0, screenTimeRecords: 0, databaseSize: 0, databaseSizeMB: '0.00' };
  } finally {
    db.close();
  }
}

module.exports = {
  DB_PATH,
  initDatabase,
  getUsageByDate,
  getScreenTimeByDate,
  getWeeklyScreenTime,
  getTodayUsageData,
  getTodayScreenTime,
  exportDataAsCSV,
  clearAllData,
  getDatabaseStats
};