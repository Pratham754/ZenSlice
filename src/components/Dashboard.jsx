import { Box, Grid, useTheme } from "@mui/material";
import useWeeklyData from "../hooks/useWeeklyData";
import useDailyData from "../hooks/useDailyData";
import StatsCards from "./StatsCards";
import WeeklyChart from "./WeeklyChart";
import AppPieChart from "./AppPieChart";
import AppList from "./AppList";
import Settings from "./Settings";

export default function Dashboard() {
  const theme = useTheme();
  const { weeklyData, weekOffset, goBack, goForward } = useWeeklyData();
  const { selectedDate, setSelectedDate, appUsage, screenTime, icons } = useDailyData();

  return (
    <Box p={3} sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <StatsCards weeklyData={weeklyData} appCount={appUsage.length} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <WeeklyChart weeklyData={weeklyData} weekOffset={weekOffset} goBack={goBack} goForward={goForward} onDaySelect={setSelectedDate} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AppPieChart appUsage={appUsage} screenTime={screenTime} selectedDate={selectedDate} />
        </Grid>
      </Grid>
      <Grid item xs={12} mt={3}>
        <AppList appUsage={appUsage} screenTime={screenTime} icons={icons} selectedDate={selectedDate} />
      </Grid>
      <Grid item xs={12} mt={2}>
        <Settings />
      </Grid>
    </Box>
  );
}
