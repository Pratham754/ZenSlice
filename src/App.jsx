import React, { useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
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
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    // Load custom font
    const style = document.createElement("style");
    style.innerHTML = `
      @font-face {
        font-family: 'Pineapple Grass';
        src: url('/fonts/Pineapple_Grass.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      body {
        font-family: 'Pineapple Grass', 'Montserrat', 'Poppins', sans-serif;
      }
    `;
    document.head.appendChild(style);

    // Check if Electron API is available
    if (!window.api) {
      console.warn("Electron API not available - running in development mode");
    }

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;