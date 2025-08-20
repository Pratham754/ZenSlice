// UsageList.jsx

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  LinearProgress,
  Avatar,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const formatTime = (total) => {
  if (!total || isNaN(total)) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const UsageList = () => {
  const [dailyAppUsage, setDailyAppUsage] = useState([]);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [icons, setIcons] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const weeklyData = await window.api?.getWeeklyPCScreenTime?.();
        if (Array.isArray(weeklyData)) {
          const dates = weeklyData.map(item => item.date).sort().reverse();
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error("Failed to fetch available dates:", error);
      }
    };
    
    fetchAvailableDates();
  }, []);

  useEffect(() => {
    const fetchDailyData = async () => {
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

  return (
    <Card style={{ padding: "2rem" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          App Usage for {new Date(selectedDate).toDateString()}
        </Typography>
        
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

      {dailyAppUsage.length === 0 ? (
        <Typography>No app usage data found.</Typography>
      ) : (
        <List>
          {dailyAppUsage.map((entry, idx) => {
            const percent = totalScreenTime > 0 ? (entry.duration / totalScreenTime) * 100 : 0;
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
  );
};

export default UsageList;