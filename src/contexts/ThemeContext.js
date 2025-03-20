import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Base theme settings shared between light and dark modes
const baseThemeSettings = {
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
    },
  },
};

// Light theme
const lightTheme = createTheme({
  ...baseThemeSettings,
  palette: {
    mode: 'light',
    primary: {
      main: '#6B8E23', // Olive green
      light: '#8FB03E',
      dark: '#566E1C',
    },
    secondary: {
      main: '#D2B48C', // Tan/beige
      light: '#E6D5B8',
      dark: '#A89072',
    },
    background: {
      default: '#F5F5F0', // Off-white
      paper: '#FFFFFF',
    },
  },
});

// Dark theme
const darkTheme = createTheme({
  ...baseThemeSettings,
  palette: {
    mode: 'dark',
    primary: {
      main: '#8FB03E', // Lighter olive for dark mode
      light: '#A9C667',
      dark: '#6B8E23',
    },
    secondary: {
      main: '#E6D5B8', // Lighter tan for dark mode
      light: '#FFF8E7',
      dark: '#D2B48C',
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1E1E1E',
    },
  },
});

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  // Check if user has previously set a preference
  const savedTheme = localStorage.getItem('themeMode');
  
  // Initialize with saved theme or system preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [mode, setMode] = useState(
    savedTheme || (prefersDarkMode ? 'dark' : 'light')
  );

  // Apply the current theme
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // Update theme if system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    mode,
    toggleTheme,
    isDarkMode: mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}; 