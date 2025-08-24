import React, { useEffect } from "react";
import { ThemeProvider, createTheme, Box, Typography } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Dashboard from "./components/Dashboard";

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
      default: "#f8fafc",
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
  useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: 'Pineapple Grass';
      src: url('${process.env.PUBLIC_URL}/fonts/Pineapple_Grass.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }

    * {
      font-family: 'Pineapple Grass', 'Montserrat', 'Poppins', sans-serif !important;
      cursor: url('${process.env.PUBLIC_URL}/cursors/cursor.png'), auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }

    button, a, [role="button"], input, textarea, select {
      cursor: url('${process.env.PUBLIC_URL}/cursors/cursor.png'), auto !important;
    }

    /* Optional: Prevent text inputs from falling back to text cursor */
    input, textarea {
      cursor: url('${process.env.PUBLIC_URL}/cursors/cursor.png'), auto !important;
    }
  `;
  document.head.appendChild(style);

  if (!window.api) {
    console.warn("Electron API not available - running in development mode");
  }

  return () => {
    document.head.removeChild(style);
  };
}, []);


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
          backgroundColor: "#FFDDC4",
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
            backgroundColor: "#EBBC7C",
            color: "#fff",
            p: "0 16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            WebkitAppRegion: "drag", // This makes the header draggable
          }}
        >
          <Typography variant="h6" sx={{ color: "#5A4A42" }}>
            ZenSlice
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: "8px",
              WebkitAppRegion: "no-drag", // Buttons stay clickable
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/buttons/reload.png`}
              alt="Reload"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleReload}
            />
            <img
              src={`${process.env.PUBLIC_URL}/buttons/minimize.jpeg`}
              alt="Minimize"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleMinimize}
            />
            <img
              src={`${process.env.PUBLIC_URL}/buttons/cross.jpeg`}
              alt="Close"
              style={{ width: "24px", height: "24px", cursor: "pointer" }}
              onClick={handleClose}
            />
          </Box>
        </Box>

        {/* Main Dashboard */}
        <Dashboard />
      </Box>
    </ThemeProvider>
  );
}

export default App;
