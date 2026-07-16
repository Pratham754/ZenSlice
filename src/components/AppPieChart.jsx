import { useEffect, useMemo, useState } from "react";
import { Card, Typography, Box, Chip, useTheme } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getLocalDateKey } from "../utils/dateUtils";
import { formatTime } from "../utils/formatTime";

export default function AppPieChart({ appUsage, screenTime, selectedDate, categories }) {
  const theme = useTheme();
  const { text, background } = theme.palette;
  const chartColors = theme.custom?.chartColors || [];
  const [viewMode, setViewMode] = useState("app");
  const [localCategories, setLocalCategories] = useState({});

  useEffect(() => {
    if (categories && Object.keys(categories).length > 0) return;

    let alive = true;
    window.api?.getAppCategories?.().then((rows) => {
      if (!alive) return;

      const map = {};
      (rows || []).forEach((row) => {
        map[row.app_name] = row.category;
      });
      setLocalCategories(map);
    });

    return () => {
      alive = false;
    };
  }, [categories]);

  const categoryMap = categories && Object.keys(categories).length > 0 ? categories : localCategories;

  const tooltipStyle = {
    backgroundColor: background.paper,
    border: `1px solid ${text.secondary}`,
    color: text.primary,
    borderRadius: 8,
  };

  const pieData = useMemo(() => {
    const totalMins = screenTime / 60;
    if (!totalMins) return [];

    let others = 0;
    const visible = [];
    appUsage.forEach(({ app_name, duration }) => {
      const mins = duration / 60;
      (mins / totalMins) * 100 >= 3
        ? visible.push({ name: app_name, value: Math.round(mins) })
        : (others += mins);
    });
    if (others > 0) visible.push({ name: "Others", value: Math.round(others) });
    return visible.sort((a, b) => b.value - a.value);
  }, [appUsage, screenTime]);

  const categoryPieData = useMemo(() => {
    const grouped = {};

    appUsage.forEach(({ app_name, duration }) => {
      const category = categoryMap?.[app_name] || "Uncategorized";

      grouped[category] = (grouped[category] || 0) + duration;
    });

    return Object.entries(grouped)
      .map(([name, seconds]) => ({
        name,
        value: Math.round(seconds / 60),
      }))
      .sort((a, b) => b.value - a.value);
  }, [appUsage, categoryMap]);


  const dateLabel = selectedDate === getLocalDateKey(new Date())
    ? "Today"
    : new Date(selectedDate).toDateString();

  const chartData = viewMode === "app" ? pieData : categoryPieData;
  
  return (
    <Card sx={{ padding: "1rem", backgroundColor: background.paper }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1,}}>
        <Typography variant="h6" sx={{ color: text.primary }}>Distribution</Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
        <Chip label="Apps" size="small" clickable variant={ viewMode === "app" ? "filled" : "outlined" } onClick={() => setViewMode("app")}/>
        <Chip label="Categories" size="small" clickable variant={ viewMode === "category" ? "filled" : "outlined" } onClick={() => setViewMode("category") }/>
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie dataKey="value" data={chartData} cx="50%" cy="50%" outerRadius={70} innerRadius={50} label={({ name }) => name} labelLine={false}>
            {chartData.map((_, idx) => <Cell key={idx} fill={chartColors[idx % chartColors.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => {
            const h = Math.floor(v / 60), m = v % 60;
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
          }} />
        </PieChart>
      </ResponsiveContainer>
      <Typography align="center" sx={{ color: text.primary }}>{dateLabel}: {formatTime(screenTime)}</Typography>
    </Card>
  );
}
