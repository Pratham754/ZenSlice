import React, { createContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material";

export const themesConfig = {
    default: {
        name: "Autumn Glow (Default)",
        palette: {
            background: { default: "#FFDDC4", paper: "#FFF8F0" },
            text: { primary: "#5A4A42", secondary: "#EBBC7C" },
            primary: { main: "#60a5fa" },
        }
    },
    burgundy: {
        name: "Deep Burgundy & Sand",
        palette: {
            background: { default: "#f1e194", paper: "#fdfaf0" },
            text: { primary: "#5b0e14", secondary: "#8c1c24" },
            primary: { main: "#5b0e14" },
        }
    },
    peach: {
        name: "Peach Ice & Aqua Mist",
        palette: {
            background: { default: "#ffd2c2", paper: "#ffece6" },
            text: { primary: "#2c4c4b", secondary: "#789a99" },
            primary: { main: "#789a99" },
        }
    },
    lemon: {
        name: "Lemon Chiffon & Ultra Violet",
        palette: {
            background: { default: "#fefecd", paper: "#ffffff" },
            text: { primary: "#2e2344", secondary: "#5f4a8b" },
            primary: { main: "#5f4a8b" },
        }
    },
    sage: {
        name: "Soft Sage & Deep Olive",
        palette: {
            background: { default: "#acc8a2", paper: "#d5e4cf" },
            text: { primary: "#1a2517", secondary: "#3a4d33" },
            primary: { main: "#1a2517" },
        }
    }
};

export const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
    const [themeName, setThemeName] = useState(() => {
        return localStorage.getItem("zenslice_theme") || "default";
    });

    const setAndSaveTheme = (name) => {
        setThemeName(name);
        localStorage.setItem("zenslice_theme", name);
    };

    const theme = useMemo(() => createTheme({
        typography: {
            fontFamily: `"Pineapple Grass", "Montserrat", "Poppins", sans-serif`,
        },
        palette: themesConfig[themeName].palette,
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
    }), [themeName]);

    return (
        <ThemeContext.Provider value={{ themeName, setThemeName: setAndSaveTheme, themesConfig }}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};