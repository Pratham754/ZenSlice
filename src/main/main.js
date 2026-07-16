const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require("electron");
const path = require("path");
const { setAutoStart } = require("./autoStart");
const { setupAutoUpdate } = require("./updater");
const { trackUsage } = require("./tracker");
const {
  getTodayUsageData, getTodayScreenTime, getWeeklyScreenTime,
  getAllHistoricalData, getScreenTimeByDate, getUsageByDate,
  exportDataAsExcel, clearAllData,
  getAppLimits, setAppLimit, removeAppLimit, getKnownApps,
  getAppCategories, setAppCategory, removeAppCategory,
} = require("../utils/dbUtils");
const db = require("../utils/dbInstance");

if (require("electron-squirrel-startup")) app.quit();
if (process.argv.includes("--squirrel-uninstall")) app.quit();

const isDev = !app.isPackaged;
let mainWindow, tray, trackerCleanup;

// In-memory focus state (resets on app restart — intentional)
let focusState = { active: false, endsAt: null, blockedApps: [] };

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700, height: 600,
    frame: false, resizable: false, maximizable: false, fullscreenable: false,
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
    mainWindow.loadFile(path.join(__dirname, "..", "..", "build", "index.html"));
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if ((input.control && input.shift && input.key.toLowerCase() === "i") || input.key === "F12")
        event.preventDefault();
    });
  }

  tray = new Tray(path.join(__dirname, "..", "..", "logo.ico"));
  tray.setToolTip("ZenSlice - Digital Wellbeing");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Show App", click: () => mainWindow.show() },
    { label: "Quit", click: () => app.quit() },
  ]));
  tray.on("click", () => mainWindow.show());

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });

  trackerCleanup = trackUsage();
}

app.whenReady().then(() => {
  setAutoStart(true);
  createWindow();
  setupAutoUpdate(mainWindow);
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on("before-quit", () => { app.isQuitting = true; trackerCleanup?.(); });

// IPC handlers
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-pc-screen-time", () => getTodayScreenTime());
ipcMain.handle("get-usage-data", () => getTodayUsageData());
ipcMain.handle("get-weekly-screen-time", () => getWeeklyScreenTime());
ipcMain.handle("get-all-historical-data", () => getAllHistoricalData());
ipcMain.handle("get-screen-time-by-date", (_, date) => getScreenTimeByDate(date));
ipcMain.handle("get-usage-by-date", (_, date) => getUsageByDate(date));

ipcMain.handle("get-app-icon-by-exe", async (_, exePath) => {
  try {
    const { getIconForExe } = require("../utils/iconUtils");
    const buf = await getIconForExe(exePath);
    return buf ? buf.toString("base64") : null;
  } catch { return null; }
});

ipcMain.handle("export-data-excel", async (_, { startDate, endDate }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Usage Data",
      defaultPath: `ZenSlice_Usage_${startDate}_to_${endDate}.xlsx`,
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });
    if (canceled || !filePath) return { cancelled: true };
    await exportDataAsExcel(startDate, endDate, filePath);
    return { success: true, path: filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("get-earliest-date", () => {
  try {
    return db.prepare("SELECT MIN(date) as earliest FROM pc_active_time").get()?.earliest || null;
  } catch { return null; }
});

ipcMain.handle("clear-all-data", () => {
  try {
    return { success: clearAllData() };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.on("minimize-app", () => mainWindow?.minimize());
ipcMain.on("close-app", () => mainWindow?.close());
ipcMain.on("open-external", (_, url) => shell.openExternal(url));

// ── App Limits ────────────────────────────────────────────────────────────────
ipcMain.handle("get-app-limits", () => getAppLimits());
ipcMain.handle("set-app-limit", (_, { appName, limitSeconds }) => ({ success: setAppLimit(appName, limitSeconds) }));
ipcMain.handle("remove-app-limit", (_, appName) => ({ success: removeAppLimit(appName) }));
ipcMain.handle("get-known-apps", () => getKnownApps());

// ── App Categories ────────────────────────────────────────────────────────────
ipcMain.handle("get-app-categories", () => getAppCategories());

ipcMain.handle("set-app-category", (_, { appName, category }) => ({
  success: setAppCategory(appName, category),
}));

ipcMain.handle("remove-app-category", (_, appName) => ({
  success: removeAppCategory(appName),
}));

// Open executable location in Explorer
ipcMain.on("show-item-in-folder", (_, exePath) => {
  if (exePath) shell.showItemInFolder(exePath);
});

// ── Focus Mode ────────────────────────────────────────────────────────────────
// Focus mode is managed entirely in the renderer via localStorage for the timer,
// but we expose these IPC hooks for the main process to check focus state
// and for the renderer to query/update it.
ipcMain.handle("get-focus-state", () => {
  // Read from a simple in-memory store — gets reset on app restart which is fine
  return focusState;
});

ipcMain.handle("set-focus-state", (_, state) => {
  focusState = state; // { active, endsAt, blockedApps }
  // Broadcast to all windows so multiple renders stay in sync
  BrowserWindow.getAllWindows().forEach((win) => {
    try { win.webContents.send("focus-state-changed", focusState); } catch (_) {}
  });
  return { success: true };
});
