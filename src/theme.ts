import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    salon: {
      olive: string;
      oliveLight: string;
      oliveDark: string;
      offWhite: string;
      cream: string;
      accent: string;
    };
  }
  interface PaletteOptions {
    salon?: {
      olive: string;
      oliveLight: string;
      oliveDark: string;
      offWhite: string;
      cream: string;
      accent: string;
    };
  }
}

// Base theme with shared settings
const baseTheme = {
  shape: {
    borderRadius: 16, // Increase default border radius
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
  },
};

// Light theme (original)
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#6B8E23', // Olive green
      light: '#8FB03E',
      dark: '#566E1C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D2B48C', // Tan/beige accent
      light: '#E6D5B8',
      dark: '#A89072',
      contrastText: '#333333',
    },
    background: {
      default: '#F5F5F0', // Off-white
      paper: '#FFFFFF',    // White for paper elements
    },
    text: {
      primary: '#333333',  // Dark gray for primary text
      secondary: '#666666', // Medium gray for secondary text
    },
    salon: {
      olive: '#6B8E23',     // Main olive
      oliveLight: '#8FB03E', // Lighter olive
      oliveDark: '#566E1C',  // Darker olive
      offWhite: '#F5F5F0',   // Background off-white
      cream: '#FFF8E7',      // Cream color for accents
      accent: '#D2B48C',     // Tan accent
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F5F0',
          color: '#333333',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)',
          borderRadius: 20, // More rounded paper components
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Pill-shaped buttons
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          backgroundColor: '#6B8E23',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#566E1C',
            boxShadow: '0px 6px 16px rgba(107, 142, 35, 0.25)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#6B8E23',
          color: '#6B8E23',
          '&:hover': {
            borderColor: '#566E1C',
            backgroundColor: 'rgba(107, 142, 35, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 24, // Very rounded cards
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
        head: {
          color: '#566E1C',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(107, 142, 35, 0.04)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#333333',
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded text fields
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(107, 142, 35, 0.3)',
            borderWidth: 1.5,
            transition: 'border-color 0.2s ease-in-out',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B8E23',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B8E23',
            borderWidth: 2,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#6B8E23',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: '8px',
          boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#333333',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: 0,
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#8FB03E', // Lighter olive for dark mode
      light: '#9FBF5F',
      dark: '#6B8E23',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E6D5B8', // Lighter tan for dark mode
      light: '#F1E7D6',
      dark: '#D2B48C',
      contrastText: '#333333',
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1A1A1A',    // Even darker for paper elements (was #1E1E1E)
    },
    text: {
      primary: '#E0E0E0',  // Light gray for primary text
      secondary: '#AAAAAA', // Medium light gray for secondary text
    },
    salon: {
      olive: '#8FB03E',     // Lighter olive for dark mode
      oliveLight: '#A6C261', // Even lighter olive
      oliveDark: '#6B8E23',  // Original olive (appears darker in dark mode)
      offWhite: '#1A1A1A',   // Dark mode paper background
      cream: '#332F28',      // Dark cream equivalent
      accent: '#E6D5B8',     // Lighter tan for dark mode
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          color: '#E0E0E0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          backgroundImage: 'none',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.5)',
          borderRadius: 20,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          backgroundColor: '#8FB03E',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#6B8E23',
            boxShadow: '0px 6px 16px rgba(143, 176, 62, 0.25)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#8FB03E',
          color: '#8FB03E',
          '&:hover': {
            borderColor: '#6B8E23',
            backgroundColor: 'rgba(143, 176, 62, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          borderRadius: 24,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
        head: {
          color: '#8FB03E',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(143, 176, 62, 0.1)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#E0E0E0',
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(143, 176, 62, 0.3)',
            borderWidth: 1.5,
            transition: 'border-color 0.2s ease-in-out',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8FB03E',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8FB03E',
            borderWidth: 2,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#8FB03E',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: '8px',
          boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          color: '#E0E0E0',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.5)',
          borderRadius: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121212',
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Legacy export for backward compatibility
export const theme = lightTheme; 