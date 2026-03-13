import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Button
} from "@mui/material";
import { ThemeContext } from "../ThemeContext";

function Settings() {
  const [version, setVersion] = useState("");
  useEffect(() => {
    window.api.getAppVersion().then(setVersion);
  }, []);

  const handleExportData = async () => {
    try {
      let startDate = await window.api.getEarliestDate();
      if (!startDate) {
        // fallback → app install date
        startDate = new Date().toISOString().slice(0, 10);
      }
      const endDate = new Date().toISOString().slice(0, 10);

      const result = await window.api.exportDataExcel(startDate, endDate);

      if (result.success) {
        alert(`✅ Exported successfully to:\n${result.path}`);
      } else if (result.cancelled) {
        console.log("User cancelled export");
      } else {
        alert("❌ Export failed: " + result.error);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("❌ Unexpected error while exporting data");
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all usage data? This action cannot be undone.",
      )
    ) {
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
    <Box
      sx={{
        backgroundColor: "#FFDDC4",
      }}
    >
      <Card
        sx={{
          backgroundColor: "#FFF8F0",
          borderRadius: "12px",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5A4A42" }}>
            Settings
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: "#5A4A42" }}
            >
              Start automatically when computer boots
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 0.5, color: "#5A4A42" }}
            >
              ZenSlice is configured to start automatically on login.
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#6B5854" }} />

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: "#5A4A42" }}
            >
              Data Management
            </Typography>
            <Button
              variant="outlined"
              onClick={handleExportData}
              sx={{
                mr: 2,
                color: "#5A4A42",
                borderColor: "#5A4A42",
                "&:hover": {
                  borderColor: "#EBBC7C",
                  backgroundColor: "rgba(235, 188, 124, 0.1)",
                },
              }}
            >
              Export Data
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearData}
              sx={{
                color: "#E66782",
                borderColor: "#E66782",
                "&:hover": {
                  borderColor: "#E66782",
                  backgroundColor: "rgba(230, 103, 130, 0.1)",
                },
              }}
            >
              Clear All Data
            </Button>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 1, color: "#5A4A42" }}
            >
              Export your usage data as Excel or clear all stored information
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#6B5854" }} />

          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: "#5A4A42" }}
            >
              About ZenSlice
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ color: "#5A4A42" }}
            >
              Version: {version}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ color: "#5A4A42" }}
            >
              A digital wellbeing app to track your screen time and app usage
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Settings;
