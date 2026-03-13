// src/components/UpdateNotification.jsx
import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Card } from "@mui/material";
import { useTheme } from "@mui/material";

export default function UpdateNotification() {
  const theme = useTheme();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // Listen for update-available event
    const cleanupAvailable = window.api?.onUpdateAvailable?.((info) => {
      console.log("[Update] New version available:", info);
      setUpdateInfo(info);
      setUpdateAvailable(true);
    });

    // Listen for update-downloaded event
    const cleanupDownloaded = window.api?.onUpdateDownloaded?.((info) => {
      console.log("[Update] Update downloaded, ready to install:", info);
      setUpdateDownloaded(true);
      setUpdateAvailable(false);
    });

    return () => {
      cleanupAvailable?.();
      cleanupDownloaded?.();
    };
  }, []);

  if (!updateAvailable && !updateDownloaded) {
    return null;
  }

  return (
    <Card
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "1rem",
        backgroundColor: updateDownloaded ? theme.palette.primary.main : theme.palette.secondary.main,
        color: "#fff",
        zIndex: 2000,
        minWidth: "300px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
        {updateDownloaded ? "🎉 Update Ready to Install" : "📦 New Version Available"}
      </Typography>
      {updateInfo && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Version {updateInfo.version} is {updateDownloaded ? "ready" : "available"}.
        </Typography>
      )}
      {updateDownloaded && (
        <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
          Click "Install Now" to update and restart the app.
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1 }}>
        {updateDownloaded ? (
          <>
            <Button
              size="small"
              variant="contained"
              sx={{ backgroundColor: "#fff", color: theme.palette.primary.main }}
              onClick={() => window.api?.quitAndInstall?.()}
            >
              Install Now
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={{ borderColor: "#fff", color: "#fff" }}
              onClick={() => setUpdateDownloaded(false)}
            >
              Later
            </Button>
          </>
        ) : (
          <Button
            size="small"
            variant="contained"
            sx={{ backgroundColor: "#fff", color: theme.palette.secondary.main }}
            onClick={() => setUpdateAvailable(false)}
          >
            Dismiss
          </Button>
        )}
      </Box>
    </Card>
  );
}
