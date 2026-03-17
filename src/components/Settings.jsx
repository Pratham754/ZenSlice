import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import { ThemeContext } from "../ThemeContext";

function Settings() {
  const theme = useTheme();
  const { themeName, setThemeName, themesConfig } = useContext(ThemeContext);
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
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Card
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: "12px",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary }}
          >
            Settings
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: theme.palette.text.primary }}
            >
              Theme
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="theme-select-label">Select Theme</InputLabel>
              <Select
                labelId="theme-select-label"
                value={themeName}
                label="Select Theme"
                onChange={(event) => setThemeName(event.target.value)}
              >
                {Object.entries(themesConfig).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2, borderColor: `${theme.palette.text.secondary}66` }} />

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: theme.palette.text.primary }}
            >
              Start automatically when computer boots
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 0.5, color: theme.palette.text.primary }}
            >
              ZenSlice is configured to start automatically on login.
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: `${theme.palette.text.secondary}66` }} />

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: theme.palette.text.primary }}
            >
              Data Management
            </Typography>
            <Button
              variant="outlined"
              onClick={handleExportData}
              sx={{
                mr: 2,
                color: theme.palette.text.primary,
                borderColor: theme.palette.text.primary,
                "&:hover": {
                  borderColor: theme.palette.text.secondary,
                  backgroundColor: `${theme.palette.text.secondary}1A`,
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
                color: theme.palette.error.main,
                borderColor: theme.palette.error.main,
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  backgroundColor: `${theme.palette.error.main}1A`,
                },
              }}
            >
              Clear All Data
            </Button>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 1, color: theme.palette.text.primary }}
            >
              Export your usage data as Excel or clear all stored information
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: `${theme.palette.text.secondary}66` }} />

          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: theme.palette.text.primary }}
            >
              About ZenSlice
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ color: theme.palette.text.primary }}
            >
              Version: {version}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ color: theme.palette.text.primary }}
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
