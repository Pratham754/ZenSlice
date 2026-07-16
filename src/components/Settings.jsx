import { useContext, useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, Divider, Button,
  FormControl, InputLabel, Select, MenuItem, useTheme,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Snackbar, Alert,
} from "@mui/material";
import { ThemeContext } from "../ThemeContext";
import AppLimits from "./AppLimits";
import FocusMode from "./FocusMode";

const dividerSx = (color) => ({ my: 2, borderColor: `${color}66` });
const textSx = (color) => ({ color });

export default function Settings() {
  const theme = useTheme();
  const { text } = theme.palette;
  const { themeName, setThemeName, themesConfig } = useContext(ThemeContext);
  const [version, setVersion] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [todayUsage, setTodayUsage] = useState([]);

  useEffect(() => {
    window.api.getAppVersion().then(setVersion);
    window.api?.getUsageByDate?.(new Date().toISOString().slice(0, 10)).then((d) => setTodayUsage(d || []));
    const cleanup = window.api?.onUsageUpdated?.(() => {
      window.api?.getUsageByDate?.(new Date().toISOString().slice(0, 10)).then((d) => setTodayUsage(d || []));
    });
    return cleanup;
  }, []);

  const toast = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleExport = async () => {
    try {
      const startDate = (await window.api.getEarliestDate()) || new Date().toISOString().slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);
      const result = await window.api.exportDataExcel(startDate, endDate);
      if (result.success) toast(`Exported successfully to: ${result.path}`);
      else if (!result.cancelled) toast("Export failed: " + result.error, "error");
    } catch {
      toast("Unexpected error while exporting data", "error");
    }
  };

  const handleClearConfirmed = async () => {
    setConfirmOpen(false);
    try {
      const result = await window.api.clearAllData();
      toast(result.success ? "All usage data cleared successfully" : "Failed to clear data", result.success ? "success" : "error");
    } catch {
      toast("Unexpected error while clearing data", "error");
    }
  };

  const sectionTitle = (label) => (
    <Typography variant="subtitle1" gutterBottom sx={textSx(text.primary)}>{label}</Typography>
  );

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default }}>
      <Card sx={{ backgroundColor: theme.palette.background.paper, borderRadius: "12px", boxShadow: "none" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={textSx(text.primary)}>Settings</Typography>

          <Box sx={{ mb: 2 }}>
            {sectionTitle("Theme")}
            <FormControl fullWidth size="small">
              <InputLabel id="theme-select-label">Select Theme</InputLabel>
              <Select labelId="theme-select-label" value={themeName} label="Select Theme" onChange={(e) => setThemeName(e.target.value)}>
                {Object.entries(themesConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={dividerSx(text.secondary)} />

          <Box sx={{ mb: 2 }}>
            <AppLimits todayUsage={todayUsage} />
          </Box>

          <Divider sx={dividerSx(text.secondary)} />

          <Box sx={{ mb: 2 }}>
            <FocusMode />
          </Box>

          <Divider sx={dividerSx(text.secondary)} />

          <Box sx={{ mb: 2 }}>
            {sectionTitle("Start automatically when computer boots")}
            <Typography variant="body2" sx={{ mt: 0.5, ...textSx(text.primary) }}>
              ZenSlice is configured to start automatically on login.
            </Typography>
          </Box>

          <Divider sx={dividerSx(text.secondary)} />

          <Box sx={{ mb: 2 }}>
            {sectionTitle("Data Management")}
            <Button variant="outlined" onClick={handleExport} sx={{ mr: 2, color: text.primary, borderColor: text.primary, "&:hover": { borderColor: text.secondary, backgroundColor: `${text.secondary}1A` } }}>
              Export Data
            </Button>
            <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)} sx={{ color: theme.palette.error.main, borderColor: theme.palette.error.main, "&:hover": { borderColor: theme.palette.error.main, backgroundColor: `${theme.palette.error.main}1A` } }}>
              Clear All Data
            </Button>
            <Typography variant="body2" sx={{ mt: 1, ...textSx(text.primary) }}>
              Export your usage data as Excel or clear all stored information
            </Typography>
          </Box>

          <Divider sx={dividerSx(text.secondary)} />

          <Box>
            {sectionTitle("About ZenSlice")}
            <Typography variant="body2" sx={textSx(text.primary)}>Version: {version}</Typography>
            <Typography variant="body2" sx={textSx(text.primary)}>A digital wellbeing app to track your screen time and app usage</Typography>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: text.primary } }}>
        <DialogTitle sx={textSx(text.primary)}>Clear All Data</DialogTitle>
        <DialogContent>
          <DialogContentText sx={textSx(text.primary)}>
            Are you sure you want to clear all usage data? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={textSx(text.primary)}>Cancel</Button>
          <Button onClick={handleClearConfirmed} color="error" variant="contained">Clear</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
