import { Card, Typography, Box, useTheme } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatWeekLabel, getMondayOfWeek } from "../hooks/useWeeklyData";
import { getLocalDateKey } from "../utils/dateUtils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const scaleUp = (e) => (e.target.style.transform = "scale(1.2)");
const scaleDown = (e) => (e.target.style.transform = "scale(1)");

export default function WeeklyChart({ weeklyData, weekOffset, goBack, goForward, onDaySelect }) {
  const theme = useTheme();
  const { text, background } = theme.palette;

  const tooltipStyle = {
    backgroundColor: background.paper,
    border: `1px solid ${text.secondary}`,
    color: text.primary,
    borderRadius: 8,
  };

  const axisProps = {
    tick: { fill: text.primary },
    axisLine: { stroke: text.secondary },
    tickLine: { stroke: text.secondary },
  };

  const handleBarClick = (e) => {
    if (!e?.name) return;
    const monday = getMondayOfWeek(weekOffset);
    const date = new Date(monday);
    date.setDate(monday.getDate() + weekdays.indexOf(e.name));
    onDaySelect(getLocalDateKey(date));
  };

  const arrowStyle = (disabled) => ({
    cursor: disabled ? "not-allowed" : "pointer",
    margin: "0 1rem",
    fontSize: "3rem",
    lineHeight: 0,
    verticalAlign: "middle",
    display: "inline-block",
    color: text.secondary,
    opacity: disabled ? 0.4 : 1,
    transition: "transform 0.2s ease",
    userSelect: "none",
  });

  return (
    <Card sx={{ padding: "1rem", backgroundColor: background.paper }}>
      <Typography variant="h6" sx={{ color: text.primary, mb: 2 }}>Weekly Screen Time</Typography>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyData}>
          <XAxis dataKey="name" {...axisProps} />
          <YAxis tickFormatter={(v) => `${Math.floor(v / 3600)}h`} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => {
            const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60);
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
          }} />
          <Bar dataKey="duration" fill={text.secondary} radius={[6, 6, 0, 0]} onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>

      <Typography align="center" mt={1} sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: text.primary }}>
        <span style={arrowStyle(false)} onClick={goBack} onMouseEnter={scaleUp} onMouseLeave={scaleDown}>⬅</span>
        <Box component="span" sx={{ minWidth: "150px", textAlign: "center" }}>{formatWeekLabel(weekOffset)}</Box>
        <span style={arrowStyle(weekOffset === 0)} onClick={goForward} onMouseEnter={(e) => { if (weekOffset !== 0) scaleUp(e); }} onMouseLeave={scaleDown}>➡</span>
      </Typography>
    </Card>
  );
}
