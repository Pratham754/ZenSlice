# 🌿 ZenSlice

### Digital Wellbeing for Your PC

<p align="center">
  <img src="https://github.com/Pratham754/ZenSlice/blob/main/banner.png?raw=true"/>
</p>

<p align="center">
<b>Track. Reflect. Balance.</b><br>
ZenSlice is a privacy-focused desktop application that helps you understand and improve your digital habits through detailed screen-time insights and elegant visual dashboards.
</p>

---

# Overview

ZenSlice provides real-time insights into how you spend time on your computer. By monitoring active applications and system activity, it enables users to visualize their screen habits and make more mindful decisions about their digital wellbeing.

Unlike many productivity trackers, ZenSlice operates entirely **offline** and stores all usage data locally on your device.

The platform is designed to be:

* **Lightweight**
* **Privacy-respecting**
* **Visually intuitive**
* **Highly performant**

---

# Key Features

### ⏱ Screen Time Tracking

Monitor your computer's daily active usage time and gain a clearer understanding of how long you spend on your device.

### 📊 Application Usage Insights

See how much time is spent in each application with detailed usage breakdowns.

### 📅 Weekly & Daily Dashboards

Interactive charts allow you to explore your habits over time and identify trends.

### 📂 Excel Data Export

Export your activity data to structured Excel reports for personal analysis or record keeping.

### 🔒 Privacy-First Architecture

All activity data is stored locally on your device. ZenSlice does **not upload or transmit usage data** to external servers.

### ⚡ Lightweight Background Tracking

ZenSlice runs silently in the background with minimal CPU and memory usage.

### 🔄 Automatic Updates

ZenSlice can automatically check for and install new versions to ensure users always run the latest improvements.

---

# Screenshots

### Weekly Screen Time Dashboard

See daily averages and weekly totals at a glance.

<img src="https://github.com/Pratham754/ZenSlice-Release/raw/main/images/Screenshot%202025-08-24%20222254.png" width="500"/>

---

### App Usage Distribution

Visual breakdown of which applications consume most of your time.

<img src="https://github.com/Pratham754/ZenSlice-Release/raw/main/images/Screenshot%202025-08-24%20223532.png" width="500"/>

---

### Daily App Usage Details

Track exactly how much time you spend in each application.

<img src="https://github.com/Pratham754/ZenSlice-Release/raw/main/images/Screenshot%202025-08-24%20223541.png" width="500"/>

---

### Settings Panel

Configure application behavior and export usage data.

<img src="https://github.com/Pratham754/ZenSlice-Release/raw/main/images/Screenshot%202025-08-24%20223550.png" width="500"/>

---

# Installation

## Download

1. Navigate to the **Releases** page
2. Download the latest Windows installer
<p align="center">
  <a href="https://github.com/Pratham754/ZenSlice-Release/releases/latest">
    <img src="https://img.shields.io/badge/Download_ZenSlice_v1.0.1-0078D4?style=for-the-badge&logo=windows&logoColor=white" />
  </a>
</p>

```
ZenSlice-x.x.x-x64.exe
```

## Install

Run the installer and follow the setup instructions.
Once installed, ZenSlice will automatically start and run in the system tray.

Click the tray icon to open the dashboard.

---

# Exporting Usage Data

ZenSlice allows exporting screen-time analytics as Excel reports.

Steps:

1. Open **Settings**
2. Select **Export Data**
3. Choose the desired date range
4. Save the generated `.xlsx` file

Generated reports include:

* Summary statistics
* Application usage breakdown
* Daily screen-time totals

---

# Application Architecture

ZenSlice is built using modern desktop application technologies.

### Core Stack

| Layer             | Technology       |
| ----------------- | ---------------- |
| Desktop Framework | Electron         |
| UI Framework      | React            |
| Database          | SQLite           |
| Charts            | Recharts         |
| Packaging         | electron-builder |

### Internal Modules

```
src/
 ├── components/     UI components and dashboards
 ├── main/           Electron main process logic
 ├── utils/          Shared utility modules
 └── preload.js      Secure IPC bridge
```

### Data Storage

ZenSlice stores usage data locally in a SQLite database located in the user's application data directory.

```
<UserData>/ZenSlice/usage_data.db
```

---

# Privacy & Security

ZenSlice was designed with privacy as a core principle.

• No telemetry
• No analytics tracking
• No cloud data storage
• No external API communication

All collected data remains **exclusively on the user's device**.

---

# Contributing

Contributions are welcome.

If you would like to improve ZenSlice:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Bug reports and feature suggestions can be submitted via the **Issues** section.

---

# Roadmap

Future development goals include:

* Focus mode and productivity timers
* App usage limits
* Smart notifications for excessive screen time
* Long-term productivity analytics
* Cross-platform support (macOS & Linux)

---

# License

ZenSlice is distributed under the **Apache License 2.0**.

---

# Maintainer

**Pratham Choudhary**
Creator & Maintainer of ZenSlice