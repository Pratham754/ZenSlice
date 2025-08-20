//Dashboard.jsx

import React, { useEffect, useState } from "react";
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

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#facc15",
  "#fb7185",
  "#a78bfa",
  "#f97316",
];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatTime = (total) => {
  if (!total || isNaN(total)) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

function formatWeeklyData(rawData) {
  const map = {};
  rawData.forEach(({ date, duration }) => {
    const day = new Date(date).getDay();
    const name = weekdays[(day + 6) % 7];
    map[name] = (map[name] || 0) + duration;
  });
  return weekdays.map((day) => ({ name: day, duration: map[day] || 0 }));
}

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
  const [weeklyData, setWeeklyData] = useState([]);
  const [rawWeeklyData, setRawWeeklyData] = useState([]);
  const [dailyAppUsage, setDailyAppUsage] = useState([]);
  const [icons, setIcons] = useState({});
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const fetchWeeklyData = async () => {
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
      setRawWeeklyData(filtered);
      setWeeklyData(formatWeeklyData(filtered));
      if (!selectedDate && filtered.length > 0)
        setSelectedDate(filtered[filtered.length - 1].date);
    };
    fetchWeeklyData();
  }, [weekOffset]);

  useEffect(() => {
    const fetchDailyData = async () => {
      if (!selectedDate) return;
      const apps = await window.api?.getUsageByDate?.(selectedDate);
      const uptime = await window.api?.getPCScreenTimeByDate?.(selectedDate);
      if (Array.isArray(apps)) setDailyAppUsage(apps);
      if (uptime?.[0]) setTotalScreenTime(uptime[0].duration || 0);
    };
    fetchDailyData();
  }, [selectedDate]);

  useEffect(() => {
    dailyAppUsage.forEach(({ exe_path }) => {
      if (exe_path && !icons[exe_path]) {
        window.api.getAppIconByExe(exe_path).then((base64Icon) => {
          setIcons((prev) => ({
            ...prev,
            [exe_path]: base64Icon
              ? `data:image/png;base64,${base64Icon}`
              : null,
          }));
        });
      }
    });
  }, [dailyAppUsage]);

  const pieData = (() => {
  const totalMinutes = totalScreenTime / 60;
  if (totalMinutes === 0) return [];

  const thresholdPercent = 3; // apps < 3% of total time are grouped into "Others"
  let othersTotal = 0;
  const visibleApps = [];

  dailyAppUsage.forEach(({ app_name, duration }) => {
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
})();


  const totalWeekly = rawWeeklyData.reduce((s, d) => s + d.duration, 0);
  const dailyAvg = rawWeeklyData.length
    ? Math.floor(totalWeekly / rawWeeklyData.length)
    : 0;

  return (
    <Box p={3} fontFamily="'Pineapple Grass', cursive">
      {/* Top stats */}
      <Grid container spacing={2} mb={1}>
        {[
          { label: "Weekly Total", value: formatTime(totalWeekly) },
          { label: "Daily Average", value: formatTime(dailyAvg) },
          { label: "Active Apps", value: dailyAppUsage.length },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card style={{ padding: "1rem", textAlign: "center" }}>
              <Typography variant="subtitle2">{stat.label}</Typography>
              <Typography variant="h5">{stat.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bar + Pie Charts */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card style={{ padding: "1rem" }}>
            <Typography variant="h6">Weekly Screen Time</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${Math.floor(v / 3600)}h`} />
                <Tooltip formatter={(v) => formatTime(v)} />
                <Bar
                  dataKey="duration"
                  fill="#60a5fa"
                  radius={[6, 6, 0, 0]}
                  onClick={(e) => {
                    const match = rawWeeklyData.find(
                      (d) =>
                        weekdays[(new Date(d.date).getDay() + 6) % 7] === e.name
                    );
                    if (match?.date) setSelectedDate(match.date);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <Typography align="center" mt={1}>
              <span
                style={{ cursor: "pointer", margin: "0 1rem" }}
                onClick={() => setWeekOffset((p) => p - 1)}
              >
                ⬅
              </span>
              {formatWeekLabel(weekOffset)}
              <span
                style={{
                  cursor: weekOffset === 0 ? "not-allowed" : "pointer",
                  margin: "0 1rem",
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
          <Card style={{ padding: "1rem" }}>
            <Typography variant="h6">App Distribution</Typography>
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
            <Typography align="center">
              Today: {formatTime(totalScreenTime)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* App Usage List */}
      <Grid item xs={12} mt={3}>
        <Card style={{ padding: "2rem" }}>
          <Typography variant="h6" mb={2}>
            Your Screen Time for{" "}
            {selectedDate ? new Date(selectedDate).toDateString() : "Today"}
          </Typography>
          {dailyAppUsage.length === 0 ? (
            <Typography>No app usage data found for this day.</Typography>
          ) : (
            <List>
              {dailyAppUsage.map((entry, idx) => {
                const percent = (entry.duration / totalScreenTime) * 100;
                return (
                  <div key={idx}>
                    <ListItem>
                      <Avatar
                        src={icons[entry.exe_path] || undefined}
                        alt={entry.app_name}
                        sx={{ width: 32, height: 32, mr: 2 }}
                      >
                        {entry.app_name.charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography>{entry.app_name}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{ height: 6, borderRadius: 5, mt: 0.5 }}
                        />
                      </Box>
                      <Typography ml={2}>
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

      {/* <Grid item xs={12} mt={2}>
        <Settings />
      </Grid> */}
    </Box>
  );
}