import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card, Typography, List, ListItem, LinearProgress,
  Avatar, Divider, Box, useTheme, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Slider, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { AccessTimeIcon, AddCircleOutlineIcon, DeleteOutlineIcon, EditIcon, FolderOpenIcon } from "../utils/icons";
import { formatTime } from "../utils/formatTime";
import { CATEGORY_OPTIONS } from "../utils/categories";

function ProgressBar({ value, theme }) {
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(value, 100)}
      sx={{
        height: 6, borderRadius: 5, mt: 0.5,
        backgroundColor: `${theme.palette.text.secondary}33`,
        "& .MuiLinearProgress-bar": { backgroundColor: theme.palette.text.secondary },
      }}
    />
  );
}

function LimitWarning({ appName, limits }) {
  const limit = limits.find((l) => l.app_name === appName);
  if (!limit) return null;
  return (
    <Tooltip title={`Daily limit: ${formatTime(limit.limit_seconds)}`}>
      <AccessTimeIcon sx={{ fontSize: 16, color: "#f59e0b", ml: 0.5, verticalAlign: "middle" }} />
    </Tooltip>
  );
}

function minuteLabel(mins) {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const PRESETS = [15, 30, 60, 90, 120, 180, 240, 300, 360];

export default function AppList({ appUsage, screenTime, icons, selectedDate }) {
  const theme = useTheme();
  const { text, background } = theme.palette;
  const [limits, setLimits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLimitApp, setSelectedLimitApp] = useState("");
  const [limitMins, setLimitMins] = useState(60);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState({});
  const [detailApp, setDetailApp] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryApp, setSelectedCategoryApp] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const refreshLimits = useCallback(async () => {
    const l = await window.api?.getAppLimits?.();
    setLimits(l || []);
  }, []);

  const refreshCategories = useCallback(async () => {
    const rows = await window.api?.getAppCategories?.();
    const map = {};
    (rows || []).forEach((r) => {
      map[r.app_name] = r.category;
    });
    setCategories(map);
  }, []);

  useEffect(() => {
    refreshLimits();
    refreshCategories();
    const cleanup = window.api?.onUsageUpdated?.(() => {
      refreshLimits();
      refreshCategories();
    });
    return cleanup;
  }, [refreshLimits, refreshCategories]);

  const openLimitDialog = (appName) => {
    const existing = limits.find((l) => l.app_name === appName);
    if (existing) {
      handleRemoveLimit(appName);
      return;
    }
    setSelectedLimitApp(appName);
    setLimitMins(60);
    setDialogOpen(true);
  };

  const closeLimitDialog = () => {
    setDialogOpen(false);
    setSelectedLimitApp("");
    setLimitMins(60);
    setSaving(false);
  };

  const handleSaveLimit = async () => {
    if (!selectedLimitApp) return;
    setSaving(true);
    try {
      await window.api?.setAppLimit?.(selectedLimitApp, limitMins * 60);
      await refreshLimits();
      closeLimitDialog();
    } catch {
      setSaving(false);
    }
  };

  const handleRemoveLimit = async (appName) => {
    await window.api?.removeAppLimit?.(appName);
    await refreshLimits();
  };

  const openCategoryDialog = (appName) => {
    setSelectedCategoryApp(appName);
    setSelectedCategory(categories[appName] || "");
    setCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setSelectedCategoryApp("");
    setSelectedCategory("");
    setSavingCategory(false);
  };

  const handleSaveCategory = async () => {
    if (!selectedCategoryApp) return;
    setSavingCategory(true);
    try {
      if (selectedCategory) {
        await window.api?.setAppCategory?.(selectedCategoryApp, selectedCategory);
      } else {
        await window.api?.removeAppCategory?.(selectedCategoryApp);
      }
      await refreshCategories();
      closeCategoryDialog();
    } catch {
      setSavingCategory(false);
    }
  };

  const handleOpenFolder = (exePath) => {
    if (exePath) {
      window.api?.showItemInFolder?.(exePath);
    }
  };

  const grouped = useMemo(
    () => [...(appUsage || [])].sort((a, b) => b.duration - a.duration),
    [appUsage]
  );

  const detailLimit = useMemo(
    () => (detailApp ? limits.find((limit) => limit.app_name === detailApp.app_name) : null),
    [detailApp, limits]
  );

  const detailTiles = useMemo(() => {
    if (!detailApp) return [];

    return [
      {
        label: "App",
        value: detailApp.app_name,
        action: null,
      },
      {
        label: "Category",
        value: categories[detailApp.app_name] || "Uncategorized",
        action: (
          <Tooltip title="Edit category">
            <IconButton
              size="small"
              onClick={() => openCategoryDialog(detailApp.app_name)}
              sx={{ color: text.secondary, p: 0.2 }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        label: "Usage",
        value: formatTime(detailApp.duration),
        action: null,
      },
      {
        label: "Limit",
        value: detailLimit ? formatTime(detailLimit.limit_seconds) : "No limit set",
        action: detailLimit ? (
          <Tooltip title="Remove limit">
            <IconButton
              size="small"
              onClick={() => handleRemoveLimit(detailApp.app_name)}
              sx={{ color: text.secondary, p: 0.2 }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Add daily limit">
            <IconButton
              size="small"
              onClick={() => openLimitDialog(detailApp.app_name)}
              sx={{ color: text.secondary, p: 0.2 }}
            >
              <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        ),
      },
    ];
  }, [detailApp, detailLimit, categories, text.secondary]);

  return (
    <Card sx={{ padding: "2rem", backgroundColor: background.paper }}>
      <Typography variant="h6" mb={2} sx={{ color: text.primary }}>
        Your Screen Time for {selectedDate ? new Date(selectedDate + "T00:00:00").toDateString() : "Today"}
      </Typography>

      {grouped.length === 0 ? (
        <Typography sx={{ color: text.primary }}>No app usage data found for this day.</Typography>
      ) : (
        <List disablePadding>
          {grouped.map((entry, idx) => {
            const pct = screenTime ? (entry.duration / screenTime) * 100 : 0;
            const hasLimit = limits.some((limit) => limit.app_name === entry.app_name);
            return (
              <div key={idx}>
                <ListItem
                  button
                  onClick={() => setDetailApp(entry)}
                  sx={{ alignItems: "flex-start", cursor: "pointer" }}
                >
                  <Avatar
                    src={icons[entry.exe_path] || undefined}
                    alt={entry.app_name}
                    sx={{ width: 32, height: 32, mr: 2 }}
                  >
                    {entry.app_name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pr: 14, flexWrap: "wrap" }}>
                      <Typography sx={{ color: text.primary }}>{entry.app_name}</Typography>
                      <LimitWarning appName={entry.app_name} limits={limits} />
                    </Box>
                    <ProgressBar value={pct} theme={theme} />
                    <Box sx={{ position: "absolute", top: 0, right: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ color: text.primary, fontWeight: "bold" }}>
                        {formatTime(entry.duration)}
                      </Typography>
                      <Tooltip title="Edit category">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCategoryDialog(entry.app_name);
                          }}
                          sx={{ color: text.secondary, p: 0.3 }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {hasLimit ? (
                        <Tooltip title="Remove limit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLimit(entry.app_name);
                            }}
                            sx={{ color: text.secondary, p: 0.3 }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Add daily limit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLimitDialog(entry.app_name);
                            }}
                            sx={{ color: text.secondary, p: 0.3 }}
                          >
                            <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                <Divider />
              </div>
            );
          })}
        </List>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeLimitDialog}
        PaperProps={{ sx: { backgroundColor: background.paper, color: text.primary, minWidth: 340 } }}
      >
        <DialogTitle sx={{ color: text.primary }}>Set Daily App Limit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: text.secondary, mb: 0.5 }}>
                App: <strong style={{ color: text.primary }}>{selectedLimitApp}</strong>
              </Typography>
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
                {PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={minuteLabel(preset)}
                    size="small"
                    onClick={() => setLimitMins(preset)}
                    variant={limitMins === preset ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      color: text.primary,
                      borderColor: `${text.secondary}66`,
                      backgroundColor: limitMins === preset ? `${text.secondary}33` : "transparent",
                      fontSize: 11,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLimitDialog} sx={{ color: text.secondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLimit}
            disabled={!selectedLimitApp || saving}
            variant="contained"
            sx={{ backgroundColor: text.secondary, color: background.paper, "&:hover": { backgroundColor: text.primary } }}
          >
            Save Limit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onClose={closeCategoryDialog}
        PaperProps={{ sx: { backgroundColor: background.paper, color: text.primary, minWidth: 360 } }}
      >
        <DialogTitle sx={{ color: text.primary }}>Set App Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              App: <strong style={{ color: text.primary }}>{selectedCategoryApp}</strong>
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <MenuItem key={category} value={category === "Uncategorized" ? "" : category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryDialog} sx={{ color: text.secondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCategory}
            disabled={!selectedCategoryApp || savingCategory}
            variant="contained"
            sx={{ backgroundColor: text.secondary, color: background.paper, "&:hover": { backgroundColor: text.primary } }}
          >
            Save Category
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(detailApp)}
        onClose={() => setDetailApp(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { backgroundColor: background.paper, color: text.primary } }}
      >
        <DialogTitle sx={{ color: text.primary }}>App Details</DialogTitle>
        <DialogContent>
          {detailApp && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.5,
                }}
              >
                {detailTiles.map((tile) => (
                  <Box
                    key={tile.label}
                    sx={{
                      border: `1px solid ${text.secondary}33`,
                      borderRadius: 2,
                      px: 1.5,
                      py: 1.25,
                      minHeight: 92,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: text.secondary, textTransform: "uppercase", letterSpacing: 0.6 }}>
                        {tile.label}
                      </Typography>
                      {tile.action}
                    </Box>
                    <Typography
                      variant={tile.label === "App" ? "body1" : "body2"}
                      sx={{ color: text.primary, fontWeight: tile.label === "App" ? 700 : 500, wordBreak: "break-word" }}
                    >
                      {tile.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: text.secondary }}>Executable Path</Typography>
                <Typography variant="body2" sx={{ color: text.primary, wordBreak: "break-all" }}>
                  {detailApp.exe_path || "Unknown"}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "flex-end" }}>
          <Button onClick={() => setDetailApp(null)} sx={{ color: text.secondary }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
