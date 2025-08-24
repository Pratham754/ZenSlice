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

// Custom color palette for the pixel-art theme
const COLORS = [
  "#FF9D4A", // A punchy, bright orange
  "#E66782", // A lively, saturated pink
  "#F5E0A7", // A creamy, warm yellow
  "#96C0CE", // A cool, refreshing teal
  "#6B5854", // A slightly darker, richer brown for contrast
  "#AB8EAD", // A dusky, medium-tone lavender
  "#FFC94A", // A sunny, golden yellow
  "#A3D9B5", // A soft, vibrant green
  "#FFB2A3", // A gentle, peachy salmon
  "#8C72A0", // A deep, muted purple
  "#C4E4F1", // A very pale, icy blue
  "#E078A1", // A rich, dusty rose
];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper function to format time in hours and minutes
const formatTime = (total) => {
  if (!total || isNaN(total)) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// Helper function to format weekly data for the bar chart
function formatWeeklyData(rawData) {
  const map = {};
  rawData.forEach(({ date, duration }) => {
    const day = new Date(date).getDay();
    const name = weekdays[(day + 6) % 7];
    map[name] = (map[name] || 0) + duration;
  });
  return weekdays.map((day) => ({ name: day, duration: map[day] || 0 }));
}

// Helper function to format the week label
function formatWeekLabel(offset) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const options = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(
    "en-US",
    options
  )} - ${end.toLocaleDateString("en-US", options)}`;
}

export default function Dashboard() {
  const [dataState, setDataState] = useState({
    weeklyData: [],
    rawWeeklyData: [],
    dailyAppUsage: [],
    icons: {},
    totalScreenTime: 0,
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Use useCallback to memoize the fetch functions
  const fetchWeeklyData = useCallback(async () => {
    const data = await window.api?.getWeeklyPCScreenTime?.();
    if (!Array.isArray(data)) return;
    const now = new Date();
    const start = new Date(now);
    const dow = now.getDay();
    const daysSinceMonday = (dow + 6) % 7;
    start.setDate(now.getDate() - daysSinceMonday + weekOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const filtered = data.filter(({ date }) => {
      const d = new Date(date);
      return d >= start && d <= end;
    });
    setDataState((prevState) => ({
      ...prevState,
      rawWeeklyData: filtered,
      weeklyData: formatWeeklyData(filtered),
    }));
    if (!selectedDate && filtered.length > 0) {
      setSelectedDate(filtered[filtered.length - 1].date);
    }
  }, [weekOffset, selectedDate]);

  const fetchDailyData = useCallback(async () => {
    if (!selectedDate) return;
    const apps = await window.api?.getUsageByDate?.(selectedDate);
    const uptime = await window.api?.getPCScreenTimeByDate?.(selectedDate);
    if (Array.isArray(apps)) {
      setDataState((prevState) => ({ ...prevState, dailyAppUsage: apps }));
    }
    if (uptime?.[0]) {
      setDataState((prevState) => ({
        ...prevState,
        totalScreenTime: uptime[0].duration || 0,
      }));
    }
  }, [selectedDate]);

  // Use a single useEffect hook for data fetching
  useEffect(() => {
    fetchWeeklyData();
    fetchDailyData();
  }, [fetchWeeklyData, fetchDailyData]);

  // Use a separate useEffect for icon fetching
  useEffect(() => {
    dataState.dailyAppUsage.forEach(({ exe_path }) => {
      if (exe_path && !dataState.icons[exe_path]) {
        window.api?.getAppIconByExe(exe_path).then((base64Icon) => {
          setDataState((prevState) => ({
            ...prevState,
            icons: {
              ...prevState.icons,
              [exe_path]: base64Icon
                ? `data:image/png;base64,${base64Icon}`
                : null,
            },
          }));
        });
      }
    });
  }, [dataState.dailyAppUsage, dataState.icons]);

  // Use useMemo to compute derived state for performance
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

  const totalWeekly = dataState.rawWeeklyData.reduce(
    (s, d) => s + d.duration,
    0
  );
  const dailyAvg = dataState.rawWeeklyData.length
    ? Math.floor(totalWeekly / dataState.rawWeeklyData.length)
    : 0;

  return (
    <Box
      p={3}
      sx={{
        backgroundColor: "#FFDDC4",
        minHeight: "100vh",
        position: "relative", // This is crucial for positioning the buttons
      }}
    >
      <Grid container spacing={2} mb={1}>
        {[
          { label: "Weekly Total", value: formatTime(totalWeekly) },
          { label: "Daily Average", value: formatTime(dailyAvg) },
          { label: "Active Apps", value: dataState.dailyAppUsage.length },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card
              sx={{
                padding: "1rem",
                textAlign: "center",
                backgroundColor: "#FFF8F0",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#5A4A42" }}>
                {stat.label}
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: "#EBBC7C", fontWeight: "bold" }}
              >
                {stat.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ padding: "1rem", backgroundColor: "#FFF8F0" }}>
            <Typography variant="h6" sx={{ color: "#5A4A42", mb: 2 }}>
              Weekly Screen Time
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataState.weeklyData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${Math.floor(v / 3600)}h`} />
                <Tooltip formatter={(v) => formatTime(v)} />
                <Bar
                  dataKey="duration"
                  fill="#EBBC7C"
                  radius={[6, 6, 0, 0]}
                  onClick={(e) => {
                    const match = dataState.rawWeeklyData.find(
                      (d) =>
                        weekdays[(new Date(d.date).getDay() + 6) % 7] === e.name
                    );
                    if (match?.date) setSelectedDate(match.date);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <Typography align="center" mt={1} sx={{ color: "#5A4A42" }}>
              <span
                style={{
                  cursor: "pointer",
                  margin: "0 1rem",
                  color: "#EBBC7C",
                }}
                onClick={() => setWeekOffset((p) => p - 1)}
              >
                ⬅
              </span>
              {formatWeekLabel(weekOffset)}
              <span
                style={{
                  cursor: weekOffset === 0 ? "not-allowed" : "pointer",
                  margin: "0 1rem",
                  color: weekOffset === 0 ? "#999" : "#EBBC7C",
                }}
                onClick={() =>
                  weekOffset === 0 ? null : setWeekOffset((p) => p + 1)
                }
              >
                ➡
              </span>
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ padding: "1rem", backgroundColor: "#FFF8F0" }}>
            <Typography variant="h6" sx={{ color: "#5A4A42" }}>
              App Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={50}
                  label={({ name }) => name}
                  labelLine={false}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} mins`} />
              </PieChart>
            </ResponsiveContainer>
            <Typography align="center" sx={{ color: "#5A4A42" }}>
              Today: {formatTime(dataState.totalScreenTime)}
            </Typography>
          </Card>
        </Grid>
      </Grid>
      <Grid item xs={12} mt={3}>
        <Card sx={{ padding: "2rem", backgroundColor: "#FFF8F0" }}>
          <Typography variant="h6" mb={2} sx={{ color: "#5A4A42" }}>
            Your Screen Time for{" "}
            {selectedDate ? new Date(selectedDate).toDateString() : "Today"}
          </Typography>
          {dataState.dailyAppUsage.length === 0 ? (
            <Typography sx={{ color: "#5A4A42" }}>
              No app usage data found for this day.
            </Typography>
          ) : (
            <List>
              {dataState.dailyAppUsage.map((entry, idx) => {
                const percent =
                  (entry.duration / dataState.totalScreenTime) * 100;
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
                        <Typography sx={{ color: "#5A4A42" }}>
                          {entry.app_name}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 6,
                            borderRadius: 5,
                            mt: 0.5,
                            backgroundColor: "rgba(235, 188, 124, 0.3)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: "#EBBC7C",
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        ml={2}
                        sx={{ color: "#5A4A42", fontWeight: "bold" }}
                      >
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

      <Grid item xs={12} mt={2}>
        <Settings />
      </Grid>
    </Box>
  );
}
