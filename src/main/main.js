const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const { setAutoStart } = require("./autoStart");
const fs = require("fs");
const { trackUsage, DB_FILE } = require("./tracker");
const { exportDataAsExcel } = require("../utils/dbUtils");
const XLSX = require("xlsx");

// Handle squirrel events, which are common for Windows installers
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Check for and handle uninstall command
if (process.argv.includes("--squirrel-uninstall")) {
  app.quit();
}

const isDev = !app.isPackaged;

let mainWindow;
let tray = null;
let trackerInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, "..", "..", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "..", "..", "build", "index.html")
    );

    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (
        (input.control && input.shift && input.key.toLowerCase() === "i") ||
        input.key === "F12"
      ) {
        event.preventDefault();
      }
    });
  }

  // Create tray icon
  tray = new Tray(path.join(__dirname, "..", "..", "logo.ico"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => mainWindow.show(),
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip("ZenSlice - Digital Wellbeing");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    mainWindow.show();
  });

  // Hide to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Start background tracker
  trackerInterval = trackUsage();
}

app.whenReady().then(() => {
  // Set auto-start to be true whenever the app is launched
  setAutoStart(true);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  app.isQuiting = true;
  if (trackerInterval) {
    clearInterval(trackerInterval);
  }
});

// IPC: Get total screen-on time
ipcMain.handle("get-pc-screen-time", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const db = new Database(DB_FILE, { readonly: true });
  try {
    return db
      .prepare(
        "SELECT SUM(duration) as duration FROM pc_active_time WHERE date = ?"
      )
      .all(today);
  } finally {
    db.close();
  }
});

// IPC: Get app usage breakdown
ipcMain.handle("get-usage-data", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const db = new Database(DB_FILE, { readonly: true });
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
  } finally {
    db.close();
  }
});

// IPC: Get app icon from executable
ipcMain.handle("get-app-icon-by-exe", async (event, exePath) => {
  try {
    const { getIconForExe } = require("../utils/iconUtils");
    const iconBuffer = await getIconForExe(exePath);
    return iconBuffer ? iconBuffer.toString("base64") : null;
  } catch (error) {
    console.error("Failed to get app icon:", error);
    return null;
  }
});

// IPC: Weekly screen time
ipcMain.handle("get-weekly-screen-time", async () => {
  const db = new Database(DB_FILE, { readonly: true });
  try {
    return db
      .prepare(
        `
      SELECT date, SUM(duration) as duration 
      FROM pc_active_time 
      WHERE date >= date('now', '-28 days') 
      GROUP BY date 
      ORDER BY date ASC
    `
      )
      .all();
  } finally {
    db.close();
  }
});

// IPC: Screen time by specific date
ipcMain.handle("get-screen-time-by-date", async (event, date) => {
  const db = new Database(DB_FILE, { readonly: true });
  try {
    return db
      .prepare(`SELECT duration FROM pc_active_time WHERE date = ?`)
      .all(date);
  } finally {
    db.close();
  }
});

// IPC: App usage by specific date
ipcMain.handle("get-usage-by-date", async (event, date) => {
  const db = new Database(DB_FILE, { readonly: true });
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
  } finally {
    db.close();
  }
});

// IPC: Export data as Excel
ipcMain.handle("export-data-excel", async (event, { startDate, endDate }) => {
  try {
    // Ask user where to save file
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Usage Data",
      defaultPath: `ZenSlice_Usage_${startDate}_to_${endDate}.xlsx`,
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });

    if (canceled || !filePath) return { cancelled: true };

    // Generate Excel and save
    await exportDataAsExcel(startDate, endDate, filePath);

    return { success: true, path: filePath };
  } catch (error) {
    console.error("Export Excel failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-earliest-date", async () => {
  const db = new Database(DB_FILE, { readonly: true });
  try {
    const row = db
      .prepare("SELECT MIN(date) as earliest FROM pc_active_time")
      .get();
    return row?.earliest || null;
  } finally {
    db.close();
  }
});

ipcMain.on("minimize-app", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("close-app", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});