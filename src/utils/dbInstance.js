// src/utils/dbInstance.js
// Singleton SQLite database connection with Write-Ahead Logging (WAL) mode
// This prevents EBUSY errors and allows concurrent reads/writes

const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");
const { mkdirSync } = require("fs");

function getDbPath() {
  const dataDir = path.join(app.getPath("userData"), "ZenSlice");
  mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "usage_data.db");
}

// Initialize as a singleton
const db = new Database(getDbPath());

// Enable Write-Ahead Logging to allow concurrent reads/writes
// This prevents SQLite lock contention issues
db.pragma('journal_mode = WAL');

module.exports = db;
