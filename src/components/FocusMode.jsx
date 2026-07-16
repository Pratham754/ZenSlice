import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, useTheme, Button, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, TextField, Autocomplete, IconButton, Tooltip, Divider,
} from "@mui/material";
import { PlayArrowIcon, StopIcon, AddCircleOutlineIcon, ClearIcon } from "../utils/icons";

const PRESET_DURATIONS = [
  { label: "25m", mins: 25 },
  { label: "30m", mins: 30 },
  { label: "45m", mins: 45 },
  { label: "1h",  mins: 60 },
  { label: "90m", mins: 90 },
  { label: "2h",  mins: 120 },
];

function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const totalSecs = Math.ceil(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusMode() {
  const theme = useTheme();
  const { text, background } = theme.palette;

  const [active, setActive] = useState(false);
  const [endsAt, setEndsAt] = useState(null);       // timestamp ms
  const [totalMs, setTotalMs] = useState(0);         // original session length ms
  const [remaining, setRemaining] = useState(0);     // ms remaining
  const [blockedApps, setBlockedApps] = useState([]); // app names blocked during session
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dialog state
  const [durationMins, setDurationMins] = useState(25);
  const [knownApps, setKnownApps] = useState([]);
  const [blockInput, setBlockInput] = useState(null);
  const [tempBlocked, setTempBlocked] = useState([]);

  const tickRef = useRef(null);

  // Sync with main process on mount (in case app was reopened mid-session)
  useEffect(() => {
    window.api?.getFocusState?.().then((state) => {
      if (state?.active && state?.endsAt > Date.now()) {
        restoreSession(state);
      }
    });
    const cleanup = window.api?.onFocusStateChanged?.((state) => {
      if (state?.active && state?.endsAt > Date.now()) {
        restoreSession(state);
      } else if (!state?.active) {
        clearSession();
      }
    });
    return cleanup;
  }, []);

  function restoreSession(state) {
    setActive(true);
    setEndsAt(state.endsAt);
    setTotalMs(state.totalMs || (state.endsAt - Date.now()));
    setBlockedApps(state.blockedApps || []);
  }

  function clearSession() {
    setActive(false);
    setEndsAt(null);
    setTotalMs(0);
    setRemaining(0);
    setBlockedApps([]);
  }

  // Countdown tick
  useEffect(() => {
    if (!active || !endsAt) return;

    const tick = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        setRemaining(0);
        handleSessionEnd();
        return;
      }
      setRemaining(left);
      tickRef.current = setTimeout(tick, 500);
    };

    tickRef.current = setTimeout(tick, 0);
    return () => clearTimeout(tickRef.current);
  }, [active, endsAt]);

  function handleSessionEnd() {
    window.api?.setFocusState?.({ active: false, endsAt: null, blockedApps: [], totalMs: 0 });
    clearSession();
    // Fire a congratulatory notification via IPC isn't needed — 
    // main process gets the focus-state-changed event and could handle it,
    // but a simpler approach is a browser Notification from here
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Focus session complete — ZenSlice", {
        body: "Great work! Your focus session has ended.",
        silent: false,
      });
    }
  }

  const handleStart = async () => {
    const ms = durationMins * 60 * 1000;
    const end = Date.now() + ms;
    const state = { active: true, endsAt: end, totalMs: ms, blockedApps: tempBlocked };
    await window.api?.setFocusState?.(state);
    setActive(true);
    setEndsAt(end);
    setTotalMs(ms);
    setRemaining(ms);
    setBlockedApps(tempBlocked);
    setDialogOpen(false);
    setTempBlocked([]);
  };

  const handleStop = async () => {
    clearTimeout(tickRef.current);
    await window.api?.setFocusState?.({ active: false, endsAt: null, blockedApps: [], totalMs: 0 });
    clearSession();
  };

  useEffect(() => {
    window.api?.getKnownApps?.().then((apps) => {
      setKnownApps([...new Set((apps || []).map((a) => a.app_name))]);
    });
  }, []);

  const pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - remaining) / totalMs) * 100)) : 0;

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
          Focus Mode
        </Typography>
        {!active && (
          <Tooltip title="Start a focus session">
            <IconButton size="small" onClick={() => setDialogOpen(true)} sx={{ color: text.secondary }}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {active ? (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Box>
              <Typography variant="h5" sx={{ color: text.primary, fontWeight: 700, letterSpacing: 2 }}>
                {formatCountdown(remaining)}
              </Typography>
              <Typography variant="body2" sx={{ color: text.secondary }}>
                Focus session in progress
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StopIcon />}
              onClick={handleStop}
              sx={{ color: text.secondary, borderColor: `${text.secondary}66`, "&:hover": { borderColor: text.primary } }}
            >
              End session
            </Button>
          </Box>

          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 6, borderRadius: 5, mt: 1,
              backgroundColor: `${text.secondary}22`,
              "& .MuiLinearProgress-bar": { backgroundColor: text.secondary },
            }}
          />

          {blockedApps.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: text.secondary }}>
                Reminders active for:
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                {blockedApps.map((app, i) => (
                  <Chip
                    key={i}
                    label={app}
                    size="small"
                    sx={{ fontSize: 10, height: 18, backgroundColor: `${text.secondary}22`, color: text.primary }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: text.secondary, fontStyle: "italic" }}>
          No active session. Start one to stay focused.
        </Typography>
      )}

      {/* Start session dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { backgroundColor: background.paper, color: text.primary, minWidth: 340 } }}
      >
        <DialogTitle sx={{ color: text.primary }}>Start Focus Session</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: text.secondary, mb: 1 }}>
                Duration: <strong style={{ color: text.primary }}>
                  {durationMins < 60 ? `${durationMins}m` : `${Math.floor(durationMins / 60)}h${durationMins % 60 ? ` ${durationMins % 60}m` : ""}`}
                </strong>
              </Typography>
              <Slider
                value={durationMins}
                onChange={(_, v) => setDurationMins(v)}
                min={5}
                max={240}
                step={5}
                sx={{ color: text.secondary }}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                {PRESET_DURATIONS.map((p) => (
                  <Chip
                    key={p.mins}
                    label={p.label}
                    size="small"
                    onClick={() => setDurationMins(p.mins)}
                    variant={durationMins === p.mins ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      color: text.primary,
                      borderColor: `${text.secondary}66`,
                      backgroundColor: durationMins === p.mins ? `${text.secondary}33` : "transparent",
                      fontSize: 11,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ borderColor: `${text.secondary}33` }} />

            <Box>
              <Typography variant="body2" sx={{ color: text.secondary, mb: 1 }}>
                Optional: apps to remind you about (distractions)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Autocomplete
                  options={knownApps.filter((a) => !tempBlocked.includes(a))}
                  value={blockInput}
                  onChange={(_, v) => setBlockInput(v)}
                  freeSolo
                  onInputChange={(_, v) => setBlockInput(v || null)}
                  size="small"
                  sx={{ flex: 1 }}
                  renderInput={(params) => (
                    <TextField {...params} label="App or site" size="small" sx={inputSx} />
                  )}
                  PaperComponent={({ children, ...props }) => (
                    <Box {...props} sx={{ backgroundColor: background.paper, color: text.primary, borderRadius: 1, boxShadow: 3 }}>
                      {children}
                    </Box>
                  )}
                />
                <IconButton
                  size="small"
                  disabled={!blockInput}
                  onClick={() => {
                    if (blockInput && !tempBlocked.includes(blockInput)) {
                      setTempBlocked((p) => [...p, blockInput]);
                    }
                    setBlockInput(null);
                  }}
                  sx={{ color: text.secondary }}
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
                {tempBlocked.map((app, i) => (
                  <Chip
                    key={i}
                    label={app}
                    size="small"
                    onDelete={() => setTempBlocked((p) => p.filter((_, j) => j !== i))}
                    deleteIcon={<ClearIcon sx={{ fontSize: "12px !important" }} />}
                    sx={{
                      fontSize: 11, height: 20,
                      backgroundColor: `${text.secondary}22`,
                      color: text.primary,
                      "& .MuiChip-deleteIcon": { color: text.secondary },
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
            onClick={handleStart}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={{ backgroundColor: text.secondary, color: background.paper, "&:hover": { backgroundColor: text.primary } }}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
