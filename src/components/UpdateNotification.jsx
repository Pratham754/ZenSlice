import { useEffect, useState } from "react";
import { Box, Button, Typography, Card, useTheme } from "@mui/material";

export default function UpdateNotification() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const c1 = window.api?.onUpdateAvailable?.((info) => {
      setUpdateInfo(info);
      setVisible(true);
      setIsDownloaded(false);
      setIsDownloading(false);
      setProgress(0);
      setError("");
      setStatus("New update is ready to download.");
    });
    const c2 = window.api?.onUpdateDownloadProgress?.((p) => {
      setIsDownloading(true);
      setStatus("Downloading update...");
      setProgress(Math.max(0, Math.min(100, p?.percent || 0)));
    });
    const c3 = window.api?.onUpdateDownloaded?.((info) => {
      setIsDownloading(false);
      setIsDownloaded(true);
      setProgress(100);
      setUpdateInfo((prev) => ({ ...prev, ...info }));
      setStatus("Update downloaded. Install now to finish.");
    });
    const c4 = window.api?.onUpdateError?.((payload) => {
      setIsDownloading(false);
      setError(payload?.message || "Update failed");
    });
    return () => { c1?.(); c2?.(); c3?.(); c4?.(); };
  }, []);

  const handleDownload = async () => {
    setError(""); setStatus("Starting download..."); setIsDownloading(true);
    const result = await window.api?.downloadUpdate?.();
    if (!result?.success) {
      setIsDownloading(false); setStatus("");
      setError(result?.error || "Failed to download update");
    }
  };

  const handleInstall = async () => {
    setError(""); setStatus("Preparing installer...");
    const result = await window.api?.installDownloadedUpdate?.();
    if (!result?.success) { setStatus(""); setError(result?.error || "Install could not start"); }
  };

  const handleManualInstall = async () => {
    const result = await window.api?.openDownloadedInstaller?.();
    if (!result?.success) { setError(result?.error || "Could not open downloaded installer"); return; }
    setStatus("Installer opened. Please complete installation in Windows.");
  };

  if (!visible) return null;

  const outlineBtn = { borderColor: "#fff", color: "#fff" };

  return (
    <Card sx={{ position: "fixed", bottom: 20, right: 20, padding: "1rem", backgroundColor: theme.palette.primary.main, color: "#fff", zIndex: 2000, minWidth: "320px", boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>New Version Available</Typography>

      {updateInfo && <Typography variant="body2" sx={{ mb: 1 }}>Version {updateInfo.version} is available.</Typography>}

      <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
        {isDownloaded ? "The update package is ready." : "Download and install update directly inside the app."}
      </Typography>

      {isDownloading && <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>Download progress: {Math.round(progress)}%</Typography>}
      {status && <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>{status}</Typography>}
      {error && <Typography variant="caption" sx={{ mb: 1.5, display: "block", color: "#ffd7d7" }}>{error}</Typography>}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button size="small" variant="contained" sx={{ backgroundColor: "#fff", color: theme.palette.primary.main }} disabled={isDownloading} onClick={isDownloaded ? handleInstall : handleDownload}>
          {isDownloaded ? "Install Now" : isDownloading ? "Downloading..." : "Download Update"}
        </Button>
        {isDownloaded && <Button size="small" variant="outlined" sx={outlineBtn} onClick={handleManualInstall}>Run Installer</Button>}
        <Button size="small" variant="outlined" sx={outlineBtn} onClick={() => setVisible(false)}>Later</Button>
      </Box>

      {isDownloaded && (
        <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.9 }}>
          Unsigned builds may require manual confirmation in Windows SmartScreen.
        </Typography>
      )}
    </Card>
  );
}
