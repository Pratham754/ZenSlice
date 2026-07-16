# ZenSlice v1.1.0 — Release Notes

**Release Date:** July 5, 2026
**Previous Version:** v1.0.1
**Type:** Minor release — new features, architecture refactor, bug fixes

---

## What's New

### App Time Limits
Set a daily usage cap on any app you want to keep in check.

- Pick any app from your usage history and assign a limit from 5 minutes up to 8 hours using a slider or quick presets (15m, 30m, 1h, 2h, etc.)
- A Windows notification fires at the **5-minute warning** threshold, and again the moment you **hit the limit**
- Progress bars in the daily app list turn **amber at 80%** and **red when over**
- A "Limit reached" chip appears inline next to the app name
- Add and remove limits from both the app list (quick toggle per row) and the dedicated App Time Limits panel in Settings
- Limits persist across restarts in the local SQLite database

### Focus Mode
Block off time for deep work without leaving the app.

- Set a session duration from 5 minutes to 4 hours (slider + presets: 25m, 30m, 45m, 1h, 90m, 2h)
- Live countdown timer with a progress bar visible in Settings
- Optionally add apps to a "distraction" list — these get a reminder notification if you open them during the session
- Sessions survive renderer reloads. Intentionally reset on app restart
- End a session early with the "End session" button at any time
- A completion notification fires when the timer runs out

### App Categorization
Manually assign a category to any app tracked by ZenSlice — entirely offline, no database needed.

- 11 built-in categories: 💼 Work, 📚 Learning, 🎮 Gaming, 🎬 Entertainment, 💬 Social, 🌐 Browsing, 🎵 Music, 🛠 Utilities, 📝 Productivity, 📂 System, ❓ Other
- Click any app row in the daily list to open the **App Details** dialog showing app name, today's usage time, current category, and daily limit — all in one place
- Assign or change the category via a dropdown — the choice is saved immediately to SQLite and remembered forever for that app
- Remove a category at any time from the same dialog
- A quick **Edit Category** icon button is also accessible directly from each row in the list without opening the full details dialog
- The **App Distribution** donut chart now has a **toggle** — switch between "Apps" view (existing per-app breakdown) and "Categories" view (time grouped by category). Uncategorized apps are grouped together until assigned

---

## Improvements

### Code Architecture — Full Modularization
The monolithic `Dashboard.jsx` (~400 lines, mixed data + UI) has been decomposed into focused, single-responsibility pieces:

| What | Before | After |
|---|---|---|
| Dashboard | ~400 line monolith | ~35 line orchestrator |
| Weekly chart + navigation | Inline in Dashboard | `WeeklyChart.jsx` |
| Donut pie chart | Inline in Dashboard | `AppPieChart.jsx` |
| App usage list | Inline in Dashboard | `AppList.jsx` |
| Summary stat cards | Inline in Dashboard | `StatsCards.jsx` |
| Data fetching | Inline `useCallback` chains | `useWeeklyData.js`, `useDailyData.js` |

Two new custom hooks handle all data concerns:
- **`useWeeklyData`** — fetches all historical data, formats it per-week, handles navigation with a boundary guard so you can't scroll past your first day of use
- **`useDailyData`** — fetches app usage + screen time for the selected date, subscribes to live IPC updates, batch-fetches missing icons

### Icon Batch Fetching (Performance Fix)
In v1.0.1 the dashboard fetched app icons one by one, triggering a React state update per icon and causing visible re-render thrashing. Icons are now fetched with a single `Promise.all` and applied in one state update.

### Week Navigation Bug Fix
Navigating back to the first partial week (e.g. you started on a Wednesday) now works correctly. The boundary check in `useWeeklyData.goBack` computes the actual Sunday of the candidate week and compares it against the earliest recorded date, so partial weeks with data are accessible instead of being skipped.

### App List — Clickable Rows with Detail View
Each app row in the daily list is now clickable. Clicking opens a tiled **App Details** dialog showing:
- App name
- Today's usage time
- Assigned category (with inline edit)
- Daily limit (with inline add/remove)
- Full executable path

Quick-action icon buttons on each row still allow editing category and toggling limits without opening the full dialog.

### App Distribution Chart — Dual View Toggle
The donut chart card now has two modes switchable via chips in the header:
- **Apps** — the original per-app breakdown (apps under 3% are grouped as "Others")
- **Categories** — time grouped by assigned category. Apps with no category are shown as "Uncategorized"

The chart re-fetches category data automatically when the daily app list changes.

### Settings — Fully Wired Up
The Settings panel was partially implemented in v1.0.1 (clear data button just logged a console message). All sections are now complete:
- Theme selector — unchanged, works as before
- App Time Limits — new section
- Focus Mode — new section
- Export Data — fully working, opens native save dialog
- Clear All Data — wired to the database, confirmed via MUI Dialog (no more `window.confirm`)
- About — shows live version number from Electron

### `formatTime` Extracted to Shared Utility
The time-formatting function was duplicated across multiple components. It now lives in `src/utils/formatTime.js` and is imported wherever needed.

### Inline Icon Components (`src/utils/icons.jsx`)
Custom inline SVG components for all icons used in the app (Material Design icon set, Apache 2.0). This avoids bundling the full `@mui/icons-material` package for the handful of icons actually used. Two new icons added in this update: `EditIcon` and `FolderOpenIcon`.

### Native Windows Notifications
The tracker now uses Electron's `Notification` API to fire system-level alerts for app limit warnings and completions. These appear in the Windows notification center and respect the user's system notification settings.

---

## Files Added

| File | Purpose |
|---|---|
| `src/hooks/useWeeklyData.js` | Weekly data fetching, formatting, navigation |
| `src/hooks/useDailyData.js` | Daily data, icons, live IPC subscription |
| `src/utils/formatTime.js` | Shared seconds → "Xh Ym" formatter |
| `src/utils/icons.jsx` | Inline SVG icon components (10 icons + EditIcon, FolderOpenIcon) |
| `src/utils/categories.js` | Shared CATEGORIES array and CATEGORY_OPTIONS used across components |
| `src/components/StatsCards.jsx` | Weekly total / daily avg / active apps cards |
| `src/components/WeeklyChart.jsx` | Bar chart + week navigation |
| `src/components/AppPieChart.jsx` | Donut chart — Apps/Categories toggle |
| `src/components/AppList.jsx` | Per-day app list — clickable rows, limit + category controls |
| `src/components/AppLimits.jsx` | App time limits panel (full CRUD) |
| `src/components/FocusMode.jsx` | Focus session timer and blocklist |

## Files Removed

| File | Reason |
|---|---|
| `src/components/UsageList.jsx` | Replaced by `AppList.jsx` |
| `src/components/WeeklyStats.jsx` | Replaced by `WeeklyChart.jsx` + `AppPieChart.jsx` |

## Files Changed

`Dashboard.jsx`, `Settings.jsx`, `AppList.jsx`, `AppPieChart.jsx`, `main.js`, `tracker.js`, `preload.js`, `dbUtils.js`, `App.jsx`, `index.js`, `icons.jsx`

---

## Database Changes

Two new tables added to the local SQLite database:

```sql
CREATE TABLE IF NOT EXISTS app_limits (
  app_name      TEXT PRIMARY KEY,
  limit_seconds INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_categories (
  app_name TEXT PRIMARY KEY,
  category TEXT NOT NULL
);
```

Both tables are created automatically on first launch via `initDatabase()`. No migration needed — existing usage data is unaffected.

---

## IPC Changes

All methods are additive — nothing removed, fully backward-compatible.

### From previous release
| Method | Type | Description |
|---|---|---|
| `getAppLimits()` | invoke | Fetch all rows from `app_limits` |
| `setAppLimit(name, secs)` | invoke | Upsert a limit |
| `removeAppLimit(name)` | invoke | Delete a limit |
| `getKnownApps()` | invoke | Distinct app names from usage history |
| `getFocusState()` | invoke | Current in-memory focus session state |
| `setFocusState(state)` | invoke | Update focus state + broadcast to all windows |
| `onLimitReached(cb)` | event | Fires when an app hits its daily cap |
| `onFocusStateChanged(cb)` | event | Fires when focus state changes |

### Added in this update
| Method | Type | Description |
|---|---|---|
| `getAppCategories()` | invoke | Fetch all rows from `app_categories` |
| `setAppCategory(name, cat)` | invoke | Upsert a category for an app |
| `removeAppCategory(name)` | invoke | Delete a category assignment |
| `showItemInFolder(exePath)` | send | Opens the app's folder in Windows Explorer via `shell.showItemInFolder` |

---

## Dependency Changes

No new packages added. All existing dependencies remain at the same versions as v1.0.1.

---

## Known Limitations

- Focus Mode "distraction" blocklisting is informational — ZenSlice cannot forcibly close or block apps on Windows without elevated permissions. Reminders are notification-based.
- Focus session state resets on app restart by design. There is no persistence to disk for active sessions.
- App limit notifications require the app to be running in the background (system tray). If the app is quit, no notifications fire.
- App categorization is manual. There is no automatic detection — this is intentional to keep the app fully offline and privacy-first.
- The category donut view shows "Uncategorized" for any app that hasn't been assigned yet. Assigning categories to all tracked apps gives the most useful breakdown.

---

## Analytics — What Improved

All figures are based on measurable source-level comparisons between v1.0.1 (`final.txt`) and v1.1.0 (`PROJECT.md`).

| Metric | v1.0.1 | v1.1.0 | Change |
|---|---|---|---|
| `Dashboard.jsx` lines | 412 | 34 | **−92% smaller** |
| `tracker.js` lines | 210 | 191 | −9% |
| `main.js` lines | 226 | 156 | −31% (cleaner IPC layout) |
| `preload.js` lines | 86 | 63 | −27% (invoke/onEvent helpers) |
| `dbUtils.js` lines | 322 | 214 | −34% (query helper + makeSheet) |
| Total component files | 5 | 9 | +4 new focused components |
| Custom hooks | 0 | 2 | +2 |
| Shared utilities | 4 | 7 | +3 (formatTime, icons, categories) |
| IPC methods exposed | 14 | 26 | +12 new capabilities |
| SQLite tables | 2 | 4 | +2 (app_limits, app_categories) |
| Icon state updates per render | N per app | 1 (batched) | **up to N× fewer re-renders** |
| Week navigation (partial week bug) | Broken | Fixed | ✅ |
| Settings "Clear Data" | Stub (console.log) | Fully wired | ✅ |
| Native system notifications | ❌ | ✅ | New |
| App categorization | ❌ | ✅ (11 categories) | New |
| Chart view modes | 1 (apps only) | 2 (apps + categories toggle) | +1 |
| App detail view | ❌ | ✅ (clickable rows + dialog) | New |
