import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, useTheme, List, ListItem, Avatar,
  IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Autocomplete, Slider, Chip,
  Tooltip, LinearProgress, Divider,
} from "@mui/material";
import { DeleteOutlineIcon, AddCircleOutlineIcon } from "../utils/icons";
import { formatTime } from "../utils/formatTime";

// Convert slider value (minutes) to a human-readable label
function minuteLabel(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Preset quick-select values in minutes
const PRESETS = [15, 30, 60, 90, 120, 180, 240, 300, 360];

export default function AppLimits({ todayUsage }) {
  const theme = useTheme();
  const { text, background } = theme.palette;

  const [limits, setLimits] = useState([]);
  const [knownApps, setKnownApps] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [limitMins, setLimitMins] = useState(60);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [l, apps] = await Promise.all([
      window.api?.getAppLimits?.(),
      window.api?.getKnownApps?.(),
    ]);
    setLimits(l || []);
    setKnownApps(apps || []);
  }, []);

  useEffect(() => {
    refresh();
    const cleanup = window.api?.onUsageUpdated?.(() => refresh());
    return cleanup;
  }, [refresh]);

  const handleSave = async () => {
    if (!selectedApp) return;
    setSaving(true);
    await window.api?.setAppLimit?.(selectedApp, limitMins * 60);
    setSaving(false);
    setDialogOpen(false);
    setSelectedApp(null);
    setLimitMins(60);
    refresh();
  };

  const handleRemove = async (appName) => {
    await window.api?.removeAppLimit?.(appName);
    refresh();
  };

  // Build a usage map for progress display
  const usageMap = new Map((todayUsage || []).map((e) => [e.app_name, e.duration]));

  // App names that already have a limit set (to filter from picker)
  const limitedNames = new Set(limits.map((l) => l.app_name));

  // Distinct app names from known apps, excluding already-limited ones
  const availableApps = [...new Set(knownApps.map((a) => a.app_name))].filter(
    (n) => !limitedNames.has(n)
  );

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: text.primary,
      "& fieldset": { borderColor: `${text.secondary}66` },
      "&:hover fieldset": { borderColor: text.secondary },
    },
    "& .MuiInputLabel-root": { color: text.secondary },
    "& .MuiAutocomplete-popupIndicator": { color: text.secondary },
    "& .MuiAutocomplete-clearIndicator": { color: text.secondary },
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
        <Typography variant="subtitle1" sx={{ color: text.primary }}>
          App Time Limits
        </Typography>
          <Tooltip title="Add a limit">
            <IconButton size="small" onClick={() => setDialogOpen(true)} sx={{ color: text.secondary }}>
              <AddCircleOutlineIcon />
            </IconButton>
          </Tooltip>
      </Box>

      {limits.length === 0 ? (
        <Typography variant="body2" sx={{ color: text.secondary, fontStyle: "italic", mb: 1.5 }}>
          No limits set. Add one to get notified when you hit your daily cap.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.25 }} />
      )}

      {limits.length > 0 && (
        <List disablePadding>
          {limits.map((limit, idx) => {
            const used = usageMap.get(limit.app_name) || 0;
            const pct = Math.min((used / limit.limit_seconds) * 100, 100);
            const over = used >= limit.limit_seconds;

            return (
              <div key={idx}>
                <ListItem sx={{ px: 0 }}>
                  <Box flex={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ color: text.primary, fontWeight: 500 }}>
                          {limit.app_name}
                        </Typography>
                        {over && (
                          <Chip
                            label="Limit reached"
                            size="small"
                            sx={{
                              height: 16, fontSize: 9,
                              backgroundColor: "#ef444422",
                              color: "#ef4444",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="body2" sx={{ color: text.secondary, fontSize: 11 }}>
                          {formatTime(used)} / {formatTime(limit.limit_seconds)}
                        </Typography>
                        <Tooltip title="Remove limit">
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(limit.app_name)}
                            sx={{ color: text.secondary, p: 0.3 }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 5, borderRadius: 5, mt: 0.5,
                        backgroundColor: `${text.secondary}22`,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: over ? "#ef4444" : pct > 80 ? "#f59e0b" : text.secondary,
                        },
                      }}
                    />
                  </Box>
                </ListItem>
                {idx < limits.length - 1 && <Divider />}
              </div>
            );
          })}
        </List>
      )}

      {/* Add Limit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { backgroundColor: background.paper, color: text.primary, minWidth: 340 } }}
      >
        <DialogTitle sx={{ color: text.primary }}>Set Daily App Limit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Autocomplete
              options={availableApps}
              value={selectedApp}
              onChange={(_, v) => setSelectedApp(v)}
              freeSolo
              onInputChange={(_, v) => setSelectedApp(v || null)}
              renderInput={(params) => (
                <TextField {...params} label="App or site name" size="small" sx={inputSx} />
              )}
              PaperComponent={({ children, ...props }) => (
                <Box
                  {...props}
                  sx={{ backgroundColor: background.paper, color: text.primary, borderRadius: 1, boxShadow: 3 }}
                >
                  {children}
                </Box>
              )}
              sx={{ "& .MuiAutocomplete-option": { color: text.primary } }}
            />

            <Box>
              <Typography variant="body2" sx={{ color: text.secondary, mb: 1 }}>
                Daily limit: <strong style={{ color: text.primary }}>{minuteLabel(limitMins)}</strong>
              </Typography>
              <Slider
                value={limitMins}
                onChange={(_, v) => setLimitMins(v)}
                min={5}
                max={480}
                step={5}
                sx={{ color: text.secondary }}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {PRESETS.map((p) => (
                  <Chip
                    key={p}
                    label={minuteLabel(p)}
                    size="small"
                    onClick={() => setLimitMins(p)}
                    variant={limitMins === p ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      color: text.primary,
                      borderColor: `${text.secondary}66`,
                      backgroundColor: limitMins === p ? `${text.secondary}33` : "transparent",
                      fontSize: 11,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: text.secondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedApp || saving}
            variant="contained"
            sx={{ backgroundColor: text.secondary, color: background.paper, "&:hover": { backgroundColor: text.primary } }}
          >
            Save Limit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
