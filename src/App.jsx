import React from "react";
import { ThemeProvider, createTheme, Box, Typography } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Dashboard from "./components/Dashboard";
import UpdateNotification from "./components/UpdateNotification";
import "./index.css"; // Global styles now in separate CSS file

const theme = createTheme({
  typography: {
    fontFamily: `"Pineapple Grass", "Montserrat", "Poppins", sans-serif`,
  },
  palette: {
    primary: {
      main: "#60a5fa",
    },
    secondary: {
      main: "#34d399",
    },
    background: {
      default: "#FFDDC4",     // Custom warm beige
      paper: "#FFF8F0",       // Light cream
    },
    text: {
      primary: "#5A4A42",     // Dark brown
      secondary: "#EBBC7C",   // Golden accent
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
});

function App() {
  const handleReload = () => window.location.reload();
  const handleMinimize = () => window.api?.minimizeApp();
  const handleClose = () => window.api?.closeApp();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="App"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            height: "40px",
            backgroundColor: `${theme.palette.text.secondary}CC`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            p: "0 16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            WebkitAppRegion: "drag",
            position: "sticky",
            top: 0,
            zIndex: 1100,
            borderBottom: "1px solid rgba(90, 74, 66, 0.3)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: theme.palette.text.primary, fontWeight: "600", letterSpacing: "0.5px" }}
          >
            ZenSlice
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: "8px",
              WebkitAppRegion: "no-drag",
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/buttons/reload.png`}
              alt="Reload"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleReload}
            />
            <img
              src={`${process.env.PUBLIC_URL}/buttons/minimize.png`}
              alt="Minimize"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleMinimize}
            />
            <img
              src={`${process.env.PUBLIC_URL}/buttons/cross.png`}
              alt="Close"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleClose}
            />
          </Box>
        </Box>

        {/* Main Dashboard */}
        <Dashboard />

        {/* Update Notification */}
        <UpdateNotification />
      </Box>
    </ThemeProvider>
  );
}

export default App;
