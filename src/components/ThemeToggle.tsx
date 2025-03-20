import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Simple ThemeToggle component without requiring ThemeContext
const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  // This is a placeholder since we don't have theme toggling in our simplified theme
  // In a real implementation, you would connect this to a theme toggle function
  
  return (
    <IconButton color="inherit" aria-label="toggle theme" onClick={() => console.log('Theme toggle clicked')}>
      {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
};

export default ThemeToggle; 