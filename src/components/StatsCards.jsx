import { Card, Typography, Grid, useTheme } from "@mui/material";
import { formatTime } from "../utils/formatTime";

export default function StatsCards({ weeklyData, appCount }) {
  const theme = useTheme();
  const totalWeekly = weeklyData.reduce((s, d) => s + d.duration, 0);
  const activeDays = weeklyData.filter((d) => d.duration > 0).length || 1;

  const stats = [
    { label: "Weekly Total", value: formatTime(totalWeekly) },
    { label: "Daily Average", value: formatTime(Math.floor(totalWeekly / activeDays)) },
    { label: "Active Apps", value: appCount },
  ];

  return (
    <Grid container spacing={2} mb={1}>
      {stats.map(({ label, value }) => (
        <Grid item xs={12} sm={4} key={label}>
          <Card sx={{ padding: "1rem", textAlign: "center", backgroundColor: theme.palette.background.paper }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>{label}</Typography>
            <Typography variant="h5" sx={{ color: theme.palette.text.secondary, fontWeight: "bold" }}>{value}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
