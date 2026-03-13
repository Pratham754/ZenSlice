// src/components/UpdateNotification.jsx

import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Card } from "@mui/material";
import { useTheme } from "@mui/material";

export default function UpdateNotification() {
  const theme = useTheme();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const cleanupAvailable = window.api?.onUpdateAvailable?.((info) => {
      console.log("[Update] New version available:", info);
      setUpdateInfo(info);
      setUpdateAvailable(true);
    });

    return () => {
      cleanupAvailable?.();
    };
  }, []);

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
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
        📦 New Version Available
      </Typography>

      {updateInfo && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Version {updateInfo.version} is available.
        </Typography>
      )}

      <Typography variant="caption" sx={{ mb: 1.5, display: "block" }}>
        Download the latest version from GitHub.
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          sx={{ backgroundColor: "#fff", color: theme.palette.primary.main }}
          onClick={() =>
            window.api?.openExternal?.(
              "https://github.com/Pratham754/ZenSlice-Release/releases/latest"
            )
          }
        >
          Download Update
        </Button>

        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#fff", color: "#fff" }}
          onClick={() => setUpdateAvailable(false)}
        >
          Later
        </Button>
      </Box>
    </Card>
  );
}