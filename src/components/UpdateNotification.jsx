// src/components/UpdateNotification.jsx

import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Card } from "@mui/material";
import { useTheme } from "@mui/material";

export default function UpdateNotification() {
  const theme = useTheme();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    const cleanupAvailable = window.api?.onUpdateAvailable?.((info) => {
      console.log("[Update] New version available:", info);
      setUpdateInfo(info);
      setUpdateAvailable(true);
      setIsDownloaded(false);
      setIsDownloading(false);
      setDownloadProgress(0);
      setUpdateError("");
      setStatusMessage("New update is ready to download.");
    });

    const cleanupProgress = window.api?.onUpdateDownloadProgress?.((progress) => {
      setIsDownloading(true);
      setStatusMessage("Downloading update...");
      setDownloadProgress(Math.max(0, Math.min(100, progress?.percent || 0)));
    });

    const cleanupDownloaded = window.api?.onUpdateDownloaded?.((info) => {
      setIsDownloading(false);
      setIsDownloaded(true);
      setDownloadProgress(100);
      setUpdateInfo((prev) => ({ ...prev, ...info }));
      setStatusMessage("Update downloaded. Install now to finish.");
    });

    const cleanupError = window.api?.onUpdateError?.((payload) => {
      setIsDownloading(false);
      setUpdateError(payload?.message || "Update failed");
    });

    return () => {
      cleanupAvailable?.();
      cleanupProgress?.();
      cleanupDownloaded?.();
      cleanupError?.();
    };
  }, []);

  const handleDownload = async () => {
    setUpdateError("");
    setStatusMessage("Starting download...");
    setIsDownloading(true);

    const result = await window.api?.downloadUpdate?.();
    if (!result?.success) {
      setIsDownloading(false);
      setStatusMessage("");
      setUpdateError(result?.error || "Failed to download update");
    }
  };

  const handleInstall = async () => {
    setUpdateError("");
    setStatusMessage("Preparing installer...");

    const result = await window.api?.installDownloadedUpdate?.();
    if (!result?.success) {
      setStatusMessage("");
      setUpdateError(result?.error || "Install could not start");
    }
  };

  const handleManualInstaller = async () => {
    const result = await window.api?.openDownloadedInstaller?.();
    if (!result?.success) {
      setUpdateError(result?.error || "Could not open downloaded installer");
      return;
    }
    setStatusMessage("Installer opened. Please complete installation in Windows.");
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "1rem",
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
        zIndex: 2000,
        minWidth: "320px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>New Version Available</Typography>

      {updateInfo && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Version {updateInfo.version} is available.
        </Typography>
      )}

      <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
        {isDownloaded
          ? "The update package is ready."
          : "Download and install update directly inside the app."}
      </Typography>

      {isDownloading && (
        <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
          Download progress: {Math.round(downloadProgress)}%
        </Typography>
      )}

      {statusMessage && (
        <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
          {statusMessage}
        </Typography>
      )}

      {updateError && (
        <Typography variant="caption" sx={{ mb: 1.5, display: "block", color: "#ffd7d7" }}>
          {updateError}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          sx={{ backgroundColor: "#fff", color: theme.palette.primary.main }}
          disabled={isDownloading}
          onClick={isDownloaded ? handleInstall : handleDownload}
        >
          {isDownloaded ? "Install Now" : isDownloading ? "Downloading..." : "Download Update"}
        </Button>

        {isDownloaded && (
          <Button
            size="small"
            variant="outlined"
            sx={{ borderColor: "#fff", color: "#fff" }}
            onClick={handleManualInstaller}
          >
            Run Installer
          </Button>
        )}

        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#fff", color: "#fff" }}
          onClick={() => setUpdateAvailable(false)}
        >
          Later
        </Button>
      </Box>

      {isDownloaded && (
        <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.9 }}>
          Unsigned builds may require manual confirmation in Windows SmartScreen.
        </Typography>
      )}
    </Card>
  );
}