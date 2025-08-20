// Dashboard.jsx
import React, { useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Paper,
} from "@mui/material";
import WeeklyStats from "./WeeklyStats";
import UsageList from "./UsageList";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", padding: 2 }}>
      {/* Navigation Tabs */}
      <Paper elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              fontWeight: "bold",
              textTransform: "none",
            },
            "& .Mui-selected": {
              color: "#f97316",
            },
          }}
        >
          <Tab label="Dashboard" />
          <Tab label="Usage List" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <WeeklyStats />}
        {activeTab === 1 && <UsageList />}
      </Box>
    </Box>
  );
};

export default Dashboard;