import { Box, Typography, useTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Dashboard from "./components/Dashboard";
import UpdateNotification from "./components/UpdateNotification";
import "./index.css";

const BTN = { width: "24px", height: "24px", cursor: "pointer" };

export default function App() {
  const theme = useTheme();
  return (
    <>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
        <Box sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", height: "40px", backgroundColor: `${theme.palette.text.secondary}CC`,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fff",
          p: "0 16px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", WebkitAppRegion: "drag",
          position: "sticky", top: 0, zIndex: 1100, borderBottom: "1px solid rgba(90, 74, 66, 0.3)",
        }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: "600", letterSpacing: "0.5px" }}>
            ZenSlice
          </Typography>
          <Box sx={{ display: "flex", gap: "8px", WebkitAppRegion: "no-drag" }}>
            <img src={`${process.env.PUBLIC_URL}/buttons/reload.png`} alt="Reload" style={BTN} onClick={() => window.location.reload()} />
            <img src={`${process.env.PUBLIC_URL}/buttons/minimize.png`} alt="Minimize" style={BTN} onClick={() => window.api?.minimizeApp()} />
            <img src={`${process.env.PUBLIC_URL}/buttons/cross.png`} alt="Close" style={BTN} onClick={() => window.api?.closeApp()} />
          </Box>
        </Box>
        <Dashboard />
        <UpdateNotification />
      </Box>
    </>
  );
}
