// WeeklyStats.jsx

import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Card,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

const WeeklyStats = () => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [rawWeeklyData, setRawWeeklyData] = useState([]);
  const [allData, setAllData] = useState([]); // keep all data for earliestDate
  const [pieData, setPieData] = useState([]);
  const [dailyAppUsage, setDailyAppUsage] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [totalWeekly, setTotalWeekly] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch all weekly data once
  useEffect(() => {
    const fetchAllData = async () => {
      const data = await window.api?.getWeeklyPCScreenTime?.();
      if (Array.isArray(data)) setAllData(data);
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!allData.length) return;

    const now = new Date();
    const start = new Date(now);
    const dow = now.getDay();
    const daysSinceMonday = (dow + 6) % 7;
    start.setDate(now.getDate() - daysSinceMonday + weekOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const filtered = allData.filter(({ date }) => {
      const d = new Date(date);
      return d >= start && d <= end;
    });

    setRawWeeklyData(filtered);
    setWeeklyData(formatWeeklyData(filtered));

    const total = filtered.reduce((s, d) => s + d.duration, 0);
    setTotalWeekly(total);
  }, [allData, weekOffset]);

  useEffect(() => {
    const fetchSelectedDateUsage = async () => {
      const apps = await window.api?.getUsageByDate?.(selectedDate);
      if (!apps) return;

      const totalMinutes = apps.reduce(
        (sum, app) => sum + app.duration / 60,
        0
      );

      let others = 0;
      const filtered = [];

      apps.forEach(({ app_name, duration }) => {
        const minutes = duration / 60;
        const percent = (minutes / totalMinutes) * 100;

        if (percent >= 3) {
          filtered.push({ name: app_name, value: Math.floor(minutes) });
        } else {
          others += minutes;
        }
      });

      if (others >= 1) {
        filtered.push({ name: "Others", value: Math.floor(others) });
      }

      setDailyAppUsage(apps);
      setPieData(filtered);
    };

    fetchSelectedDateUsage();
  }, [selectedDate]);

  const dailyAvg = rawWeeklyData.length
    ? Math.floor(totalWeekly / rawWeeklyData.length)
    : 0;

  const availableDates = rawWeeklyData
    .map((item) => item.date)
    .sort()
    .reverse();

  // earliest date across all data
  const earliestDate =
    allData.length > 0
      ? new Date(Math.min(...allData.map((d) => new Date(d.date))))
      : null;

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        {/* Left Column (Charts) */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card style={{ padding: "1rem" }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">Weekly Screen Time</Typography>
                  <Box>
                    <span
                      style={{
                        cursor:
                          earliestDate &&
                          new Date(
                            new Date().setDate(
                              new Date().getDate() + (weekOffset - 1) * 7
                            )
                          ) < earliestDate
                            ? "not-allowed"
                            : "pointer",
                        margin: "0 0.5rem",
                      }}
                      onClick={() => {
                        const prevWeekStart = new Date();
                        prevWeekStart.setDate(
                          prevWeekStart.getDate() + (weekOffset - 1) * 7
                        );
                        if (!earliestDate || prevWeekStart >= earliestDate) {
                          setWeekOffset((p) => p - 1);
                        }
                      }}
                    >
                      ⬅
                    </span>
                    <span
                      style={{
                        cursor: weekOffset === 0 ? "not-allowed" : "pointer",
                        margin: "0 0.5rem",
                      }}
                      onClick={() => {
                        if (weekOffset === 0) return;
                        setWeekOffset((p) => p + 1);
                      }}
                    >
                      ➡
                    </span>
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${Math.floor(v / 3600)}h`} />
                    <Tooltip formatter={(v) => formatTime(v)} />
                    <Bar
                      dataKey="duration"
                      fill="#60a5fa"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card style={{ padding: "1rem" }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">App Distribution</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={selectedDate}
                      label="Date"
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      {availableDates.map((date) => (
                        <MenuItem key={date} value={date}>
                          {new Date(date).toLocaleDateString()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
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
                  Total:{" "}
                  {formatTime(
                    dailyAppUsage.reduce((s, d) => s + d.duration, 0)
                  )}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column (Stats) */}
        <Grid item xs={12} md={3}>
          <Grid container spacing={2} direction="column">
            {[
              ["Weekly Total", totalWeekly],
              ["Daily Average", dailyAvg],
              ["Active Apps", dailyAppUsage.length],
            ].map(([label, value], i) => (
              <Grid item key={i}>
                <Card
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                    backgroundColor: "#EBBC7C",
                  }}
                >
                  <Typography variant="subtitle2">{label}</Typography>
                  <Typography variant="h5">{formatTime(value)}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeeklyStats;
