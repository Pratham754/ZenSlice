import React, { createContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material";

export const themesConfig = {
  default: {
    name: "Autumn Glow (Default)",
    palette: {
      background: { default: "#FFDDC4", paper: "#FFF8F0" },
      text: { primary: "#5A4A42", secondary: "#EBBC7C" },
      primary: { main: "#60a5fa" },
    },
    chartColors: [
      "#FF9D4A","#E66782","#F5E0A7",
      "#96C0CE","#6B5854","#AB8EAD",
      "#FFC94A","#A3D9B5","#FFB2A3",
      "#8C72A0","#C4E4F1","#E078A1",
    ],
  },
  peach: {
    name: "Peach Ice & Aqua Mist",
    palette: {
      background: { default: "#ffd2c2", paper: "#ffece6" },
      text: { primary: "#2c4c4b", secondary: "#789a99" },
      primary: { main: "#789a99" },
    },
    chartColors: [
      "#f6a690", "#fbc8b8", "#ffd2c2",
      "#8fb7d9", "#6fa3d1", "#789a99",
      "#5b8fb9", "#94baba", "#e27b60",
      "#c9664c", "#b7d3ea", "#d7e6f3",
    ],
  },
  sage: {
    name: "Soft Sage & Deep Olive",
    palette: {
      background: { default: "#acc8a2", paper: "#d5e4cf" },
      text: { primary: "#1a2517", secondary: "#3a4d33" },
      primary: { main: "#1a2517" },
    },
    chartColors: [
        "#6B8F71","#A4BE7B","#8FA68E",
        "#90A955","#708238","#4F6D46",
        "#3F5F4A","#7A8B5A","#D9C9A3",
        "#C2A878","#B7B7A4","#5B7C5A"
    ],
  },
  mono: {
    name: "Pearl & Charcoal",
    palette: {
      background: {
        default: "#f5f6f7",
        paper: "#ffffff",
      },
      text: {
        primary: "#2f2f33",
        secondary: "#6b7280",
      },
      primary: {
        main: "#2f2f33",
      },
    },
    chartColors: [
      "#2f2f33","#4b5563","#6b7280",
      "#9ca3af","#d1d5db","#111827",
      "#374151","#e5e7eb","#1f2937",
      "#9aa0a6","#cbd5f5","#e2e8f0",
    ],
  },
};

export const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => {
    const savedTheme = localStorage.getItem("zenslice_theme") || "default";
    return themesConfig[savedTheme] ? savedTheme : "default";
  });

  const setAndSaveTheme = (name) => {
    const nextTheme = themesConfig[name] ? name : "default";
    setThemeName(nextTheme);
    localStorage.setItem("zenslice_theme", nextTheme);
  };

  const activeThemeName = themesConfig[themeName] ? themeName : "default";

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: `"Pineapple Grass", "Montserrat", "Poppins", sans-serif`,
        },
        palette: themesConfig[activeThemeName].palette,
        custom: {
          chartColors: themesConfig[activeThemeName].chartColors,
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
      }),
    [activeThemeName],
  );

  return (
    <ThemeContext.Provider
      value={{ themeName, setThemeName: setAndSaveTheme, themesConfig }}
    >
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
