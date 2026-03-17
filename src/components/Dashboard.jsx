// Dashboard.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Card,
    Typography,
    Grid,
    List,
    ListItem,
    LinearProgress,
    Avatar,
    Divider,
    Box,
    useTheme,
} from "@mui/material";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";
import Settings from "./Settings";
import { getLocalDateKey } from "../utils/dateUtils";

const DEFAULT_COLORS = [
    "#FF9D4A", "#E66782", "#F5E0A7", "#96C0CE",
    "#6B5854", "#AB8EAD", "#FFC94A", "#A3D9B5",
    "#FFB2A3", "#8C72A0", "#C4E4F1", "#E078A1",
];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatTime = (total) => {
    if (!total || isNaN(total)) return "0m";
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

function formatWeeklyData(rawData, weekOffset = 0) {
    const map = {};
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7) + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    rawData.forEach(({ date, duration }) => {
        const localKey = getLocalDateKey(new Date(date));
        const d = new Date(localKey);
        if (d >= monday && d <= sunday) {
            const day = d.getDay();
            const name = weekdays[(day + 6) % 7];
            map[name] = (map[name] || 0) + duration;
        }
    });
    return weekdays.map((day) => ({ name: day, duration: map[day] || 0 }));
}

function formatWeekLabel(offset) {
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7) + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const options = { month: "short", day: "numeric" };
    return `${monday.toLocaleDateString("en-US", options)} - ${sunday.toLocaleDateString("en-US", options)}`;
}

export default function Dashboard() {
    const theme = useTheme(); // Use consolidated theme colors
    const chartColors = theme.custom?.chartColors || DEFAULT_COLORS;
    const chartTooltipStyle = {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.text.secondary}`,
        color: theme.palette.text.primary,
        borderRadius: 8,
    };
    const [dataState, setDataState] = useState({
        weeklyData: [],
        rawWeeklyData: [],
        dailyAppUsage: [],
        icons: {},
        totalScreenTime: 0,
    });
    const [selectedDate, setSelectedDate] = useState(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [earliestDate, setEarliestDate] = useState(null);

    useEffect(() => {
        const fetchEarliestDate = async () => {
            const earliest = await window.api?.getEarliestDate?.();
            if (earliest) {
                setEarliestDate(new Date(`${earliest}T00:00:00`));
            }
        };
        fetchEarliestDate();
    }, []);

    const fetchWeeklyData = useCallback(async () => {
        const data = await window.api?.getAllHistoricalData?.();
        if (!Array.isArray(data)) return;

        setDataState((prev) => ({
            ...prev,
            rawWeeklyData: data,
            weeklyData: formatWeeklyData(data, weekOffset),
        }));

        if (!selectedDate && data.length > 0) {
            setSelectedDate(getLocalDateKey(new Date())); // default to today
        }
    }, [weekOffset, selectedDate]);

    const fetchDailyData = useCallback(async () => {
        if (!selectedDate) return;
        const apps = await window.api?.getUsageByDate?.(selectedDate);
        const uptime = await window.api?.getPCScreenTimeByDate?.(selectedDate);

        if (Array.isArray(apps)) {
            setDataState((prev) => ({ ...prev, dailyAppUsage: apps }));
        }
        if (uptime?.[0]) {
            setDataState((prev) => ({
                ...prev,
                totalScreenTime: uptime[0].duration || 0,
            }));
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchWeeklyData();
        fetchDailyData();
        // Listen for real-time IPC updates from the tracker
        const cleanup = window.api?.onUsageUpdated?.(() => fetchDailyData());
        return cleanup;
    }, [fetchWeeklyData, fetchDailyData]);

    // Fix React State Thrashing: Batch Icon Fetching with Promise.all
    useEffect(() => {
        const fetchIcons = async () => {
            const missingIcons = dataState.dailyAppUsage.filter(
                app => app.exe_path && !dataState.icons[app.exe_path]
            );
            if (missingIcons.length === 0) return;

            // Fetch all icons concurrently instead of one by one
            const results = await Promise.all(
                missingIcons.map(app => window.api?.getAppIconByExe(app.exe_path))
            );

            // Single state update with all icons at once
            setDataState(prev => {
                const newIcons = { ...prev.icons };
                missingIcons.forEach((app, idx) => {
                    newIcons[app.exe_path] = results[idx]
                        ? `data:image/png;base64,${results[idx]}`
                        : null;
                });
                return { ...prev, icons: newIcons };
            });
        };
        fetchIcons();
    }, [dataState.dailyAppUsage]);

    const pieData = useMemo(() => {
        const totalMinutes = dataState.totalScreenTime / 60;
        if (totalMinutes === 0) return [];
        const thresholdPercent = 3;
        let othersTotal = 0;
        const visibleApps = [];

        dataState.dailyAppUsage.forEach(({ app_name, duration }) => {
            const minutes = duration / 60;
            const percent = (minutes / totalMinutes) * 100;
            if (percent >= thresholdPercent) {
                visibleApps.push({ name: app_name, value: Math.round(minutes) });
            } else {
                othersTotal += minutes;
            }
        });

        if (othersTotal > 0) {
            visibleApps.push({ name: "Others", value: Math.round(othersTotal) });
        }
        return visibleApps.sort((a, b) => b.value - a.value);
    }, [dataState.dailyAppUsage, dataState.totalScreenTime]);

    const totalWeekly = dataState.weeklyData.reduce((s, d) => s + d.duration, 0);
    const activeDays = dataState.weeklyData.filter(d => d.duration > 0).length || 1;
    const dailyAvg = Math.floor(totalWeekly / activeDays);

    return (
        <Box p={3} sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
            {/* Top stats */}
            <Grid container spacing={2} mb={1}>
                {[
                    { label: "Weekly Total", value: formatTime(totalWeekly) },
                    { label: "Daily Average", value: formatTime(dailyAvg) },
                    { label: "Active Apps", value: dataState.dailyAppUsage.length },
                ].map((stat, i) => (
                    <Grid item xs={12} sm={4} key={i}>
                        <Card sx={{ padding: "1rem", textAlign: "center", backgroundColor: theme.palette.background.paper }}>
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>{stat.label}</Typography>
                            <Typography variant="h5" sx={{ color: theme.palette.text.secondary, fontWeight: "bold" }}>{stat.value}</Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Weekly & pie charts */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ padding: "1rem", backgroundColor: theme.palette.background.paper }}>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            Weekly Screen Time
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={dataState.weeklyData}>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: theme.palette.text.primary }}
                                    axisLine={{ stroke: theme.palette.text.secondary }}
                                    tickLine={{ stroke: theme.palette.text.secondary }}
                                />
                                <YAxis
                                    tickFormatter={(v) => `${Math.floor(v / 3600)}h`}
                                    tick={{ fill: theme.palette.text.primary }}
                                    axisLine={{ stroke: theme.palette.text.secondary }}
                                    tickLine={{ stroke: theme.palette.text.secondary }}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    formatter={(v) => {
                                    const hours = Math.floor(v / 3600);
                                    const mins = Math.floor((v % 3600) / 60);
                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                }} />
                                <Bar
                                    dataKey="duration"
                                    fill={theme.palette.text.secondary}
                                    radius={[6, 6, 0, 0]}
                                    onClick={(e) => {
                                        const now = new Date();
                                        const dow = now.getDay();
                                        const monday = new Date(now);
                                        monday.setDate(now.getDate() - ((dow + 6) % 7) + weekOffset * 7);
                                        const dayIndex = weekdays.indexOf(e.name);
                                        const date = new Date(monday);
                                        date.setDate(monday.getDate() + dayIndex);
                                        setSelectedDate(getLocalDateKey(date));
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Themed Navigation Arrows */}
                        <Typography align="center" mt={1} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.text.primary
                        }}>
                            <span
                                style={{
                                    cursor: "pointer",
                                    margin: "0 1rem",
                                    fontSize: "3rem", // Tripled size
                                    lineHeight: 0,
                                    verticalAlign: "middle",
                                    display: "inline-block",
                                    color: theme.palette.text.secondary,
                                    transition: "transform 0.2s ease",
                                    userSelect: "none"
                                }}
                                onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
                                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                                onClick={() => {
                                    const prevWeekStart = new Date();
                                    prevWeekStart.setDate(prevWeekStart.getDate() + (weekOffset - 1) * 7);
                                    if (!earliestDate || prevWeekStart >= earliestDate) {
                                        setWeekOffset((p) => p - 1);
                                    }
                                }}
                            >
                                ⬅
                            </span>

                            <Box component="span" sx={{ minWidth: '150px' }}>
                                {formatWeekLabel(weekOffset)}
                            </Box>

                            <span
                                style={{
                                    cursor: weekOffset === 0 ? "not-allowed" : "pointer",
                                    margin: "0 1rem",
                                    fontSize: "3rem", // Tripled size
                                    lineHeight: 0,
                                    verticalAlign: "middle",
                                    display: "inline-block",
                                    color: theme.palette.text.secondary,
                                    opacity: weekOffset === 0 ? 0.4 : 1,
                                    transition: "transform 0.2s ease",
                                    userSelect: "none"
                                }}
                                onMouseEnter={(e) => {
                                    if (weekOffset !== 0) e.target.style.transform = "scale(1.2)";
                                }}
                                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                                onClick={() => {
                                    if (weekOffset === 0) return;
                                    setWeekOffset((p) => p + 1);
                                }}
                            >
                                ➡
                            </span>
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ padding: "1rem", backgroundColor: theme.palette.background.paper }}>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>App Distribution</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    dataKey="value"
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    outerRadius={70}
                                    innerRadius={50}
                                    label={({ name }) => name}
                                    labelLine={false}
                                >
                                    {pieData.map((_, idx) => <Cell key={idx} fill={chartColors[idx % chartColors.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => {
                                    const hours = Math.floor(v / 60);
                                    const mins = v % 60;
                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <Typography align="center" sx={{ color: theme.palette.text.primary }}>
                            {selectedDate === getLocalDateKey(new Date()) ? "Today" : new Date(selectedDate).toDateString()}: {formatTime(dataState.totalScreenTime)}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Daily list */}
            <Grid item xs={12} mt={3}>
                <Card sx={{ padding: "2rem", backgroundColor: theme.palette.background.paper }}>
                    <Typography variant="h6" mb={2} sx={{ color: theme.palette.text.primary }}>
                        Your Screen Time for {selectedDate ? new Date(selectedDate).toDateString() : "Today"}
                    </Typography>
                    {dataState.dailyAppUsage.length === 0 ? (
                        <Typography sx={{ color: theme.palette.text.primary }}>No app usage data found for this day.</Typography>
                    ) : (
                        <List>
                            {dataState.dailyAppUsage.map((entry, idx) => {
                                const percent = (entry.duration / dataState.totalScreenTime) * 100;
                                return (
                                    <div key={idx}>
                                        <ListItem>
                                            <Avatar
                                                src={dataState.icons[entry.exe_path] || undefined}
                                                alt={entry.app_name}
                                                sx={{ width: 32, height: 32, mr: 2 }}
                                            >
                                                {entry.app_name.charAt(0)}
                                            </Avatar>
                                            <Box flex={1}>
                                                <Typography sx={{ color: theme.palette.text.primary }}>{entry.app_name}</Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percent}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 5,
                                                        mt: 0.5,
                                                        backgroundColor: `${theme.palette.text.secondary}33`,
                                                        "& .MuiLinearProgress-bar": { backgroundColor: theme.palette.text.secondary },
                                                    }}
                                                />
                                            </Box>
                                            <Typography ml={2} sx={{ color: theme.palette.text.primary, fontWeight: "bold" }}>
                                                {formatTime(entry.duration)}
                                            </Typography>
                                        </ListItem>
                                        <Divider />
                                    </div>
                                );
                            })}
                        </List>
                    )}
                </Card>
            </Grid>

            <Grid item xs={12} mt={2}><Settings /></Grid>
        </Box>
    );
}
