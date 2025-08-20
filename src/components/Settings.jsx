import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Divider,
  Button,
} from "@mui/material";

function Settings() {
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    const checkAutoStartStatus = async () => {
      try {
        const isEnabled = await window.api.checkAutoStart();
        setAutoStartEnabled(isEnabled);
      } catch (error) {
        console.error("Failed to check auto-start status:", error);
      }
    };

    checkAutoStartStatus();
  }, []);

  const handleAutoStartToggle = async (event) => {
    const enabled = event.target.checked;
    setAutoStartEnabled(enabled);

    try {
      if (enabled) {
        await window.api.enableAutoStart();
      } else {
        await window.api.disableAutoStart();
      }
    } catch (error) {
      console.error("Failed to update auto-start setting:", error);
      setAutoStartEnabled(!enabled); // Revert on error
    }
  };

  const handleExportData = async () => {
    try {
      // This would need to be implemented in main process
      console.log("Export data functionality to be implemented");
      // await window.api.exportData();
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all usage data? This action cannot be undone.")) {
      try {
        // This would need to be implemented in main process
        console.log("Clear data functionality to be implemented");
        // await window.api.clearData();
      } catch (error) {
        console.error("Failed to clear data:", error);
      }
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Settings
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoStartEnabled}
                onChange={handleAutoStartToggle}
                color="primary"
              />
            }
            label="Start automatically when computer boots"
          />
          <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mt: 0.5 }}>
            {autoStartEnabled 
              ? "ZenSlice will start automatically when you log in"
              : "ZenSlice will only start when you open it manually"}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Data Management
          </Typography>
          <Button
            variant="outlined"
            onClick={handleExportData}
            sx={{ mr: 2 }}
          >
            Export Data
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearData}
          >
            Clear All Data
          </Button>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Export your usage data as CSV or clear all stored information
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            About ZenSlice
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Version: 1.0.0
          </Typography>
          <Typography variant="body2" color="textSecondary">
            A digital wellbeing app to track your screen time and app usage
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default Settings;