# ZenSlice – Release Notes & Change Log

## Version 1.0.1

**Release Type:** Minor Feature & Architecture Update
**Previous Version:** 1.0.0 – Initial Production Release

---

# Overview

Version **1.0.1** introduces significant architectural improvements, performance optimizations, and infrastructure upgrades to enhance the stability, scalability, and maintainability of ZenSlice.

This release focuses primarily on strengthening the internal platform while introducing a seamless automatic update system, improved data management, and a more refined user experience.

---

# Key Highlights

• Integrated **automatic application updates** via GitHub Releases
• Introduced **SQLite Write-Ahead Logging (WAL)** for improved database performance
• Implemented **icon extraction caching** to reduce UI rendering overhead
• Expanded **historical screen-time analytics** capabilities
• Enhanced **IPC communication** between Electron processes for real-time updates
• Introduced **robust error handling mechanisms** in the frontend application layer

---

# New Features

## Automatic Update System

ZenSlice now supports automatic updates powered by **electron-updater**. The application periodically checks for new releases and securely downloads updates in the background.

Capabilities include:

* Background update checks at application startup
* Notification system informing users of available updates
* Automatic download of release artifacts
* One-click installation with application restart

This ensures users always remain on the most stable and secure version of ZenSlice.

---

## Update Notification Interface

A dedicated update notification component has been introduced to communicate update availability to the user.

Features include:

* Non-intrusive update alerts
* Visual indication of update download completion
* Immediate installation option

Component introduced:

```
src/components/UpdateNotification.jsx
```

---

## Historical Screen-Time Analytics

The analytics subsystem has been enhanced to support retrieval of **complete historical screen-time data** rather than limiting visualizations to recent activity.

Enhancements include:

* Long-term usage data visualization
* Improved weekly chart calculations
* Support for extended historical datasets

This change improves the usefulness of ZenSlice for long-term digital wellbeing monitoring.

---

# Performance Improvements

## Database Engine Optimization

ZenSlice now utilizes **SQLite Write-Ahead Logging (WAL)** mode.

Benefits include:

* Improved concurrent read/write operations
* Reduced database lock contention
* Enhanced data reliability during high-frequency writes

A centralized database connection has been implemented using a singleton pattern.

New module:

```
src/utils/dbInstance.js
```

---

## Batched Database Commit Strategy

To minimize disk I/O overhead, usage metrics are now accumulated in memory and written to disk periodically.

Key improvements:

* Batched commits every 10 seconds
* Reduced write amplification
* Improved application responsiveness

---

## Icon Extraction Caching

Application icon extraction from executable files has been optimized.

Enhancements include:

* Persistent icon caching in the user data directory
* Reduced redundant extraction operations
* Faster dashboard rendering

Icons are now cached under:

```
<UserData>/icon_cache/
```

---

# User Interface Enhancements

## Updated Application Theme

The application theme has been refined to provide a more polished and modern visual experience.

Enhancements include:

* Updated color palette for improved readability
* Improved card elevation and spacing
* Glass-style header with blur effects
* Consistent typography across the application

---

## Improved Application Startup Experience

A lightweight loading screen has been added to improve the perceived startup experience while the React application initializes.

---

## Enhanced Dashboard Components

Dashboard improvements include:

* Improved weekly screen-time visualization
* Optimized pie chart representation of application usage
* Better formatting of duration metrics
* More responsive UI rendering

---

# Data Management Enhancements

## Advanced Excel Export

Export functionality has been expanded to generate structured usage reports using **ExcelJS**.

Generated reports now include:

**Summary Sheet**

* Total screen time
* Total tracked applications
* Most used application
* Report date range

**Usage Data Sheet**

* Application name
* Executable path
* Usage duration
* Activity date

**Screen Time Sheet**

* Daily screen-time totals

---

# Platform Stability Improvements

## Improved Error Handling

The React application now includes a global **Error Boundary** to gracefully handle runtime exceptions.

Benefits include:

* Preventing application crashes
* Providing user-friendly recovery instructions
* Improved debugging visibility during development

---

## Improved Inter-Process Communication (IPC)

The preload layer now includes safer IPC invocation patterns to prevent renderer crashes caused by unexpected failures.

Key improvements:

* Centralized IPC wrapper functions
* Graceful fallback handling
* Reduced renderer instability

---

# Codebase Architecture Improvements

The internal architecture has been reorganized to promote maintainability and separation of concerns.

Updated module structure:

```
src/
 ├── components/
 │    ├── Dashboard.jsx
 │    ├── Settings.jsx
 │    ├── UsageList.jsx
 │    ├── WeeklyStats.jsx
 │    └── UpdateNotification.jsx
 │
 ├── main/
 │    ├── main.js
 │    ├── tracker.js
 │    ├── autoStart.js
 │    └── updater.js
 │
 └── utils/
      ├── dbUtils.js
      ├── dbInstance.js
      ├── dateUtils.js
      └── iconUtils.js
```

This modular structure allows easier future extension and clearer separation between:

* UI logic
* system services
* database operations
* utility modules

---

# Bug Fixes

• Resolved intermittent icon extraction failures for certain executables
• Addressed SQLite lock contention during frequent write operations
• Improved handling of temporary or system processes during activity tracking
• Fixed UI refresh inconsistencies after background tracker updates

---

# Build & Distribution Improvements

The release pipeline now supports **differential updates**, enabling smaller update downloads.

Release artifacts include:

```
ZenSlice-x.x.x-x64.exe
ZenSlice-x.x.x-x64.exe.blockmap
latest.yml
```

These files allow electron-updater to download only modified portions of the application.

---

# Upgrade Instructions

Users on version **1.0.0** will automatically receive update notifications within the application. Once downloaded, the update can be installed directly through the ZenSlice interface.

---

# Roadmap

Future development efforts will focus on expanding ZenSlice into a more comprehensive digital wellbeing platform.

Planned initiatives include:

* Focus Mode and productivity timers
* Application usage limits
* Smart notifications for excessive screen time
* Weekly productivity reports
* Cross-platform support (macOS and Linux)
* Cloud synchronization capabilities

---

# Maintainer

**Pratham Choudhary**
Creator & Maintainer — ZenSlice