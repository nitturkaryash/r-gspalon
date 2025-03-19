import React from 'react';
import { 
  Box, 
  Switch, 
  styled, 
  SwitchProps,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

// Styled switch with custom design
const ThemeSwitch = styled((props: SwitchProps) => (
  <Switch
    focusVisibleClassName=".Mui-focusVisible"
    disableRipple
    {...props}
  />
))(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 0,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(28px)',
      color: theme.palette.salon.olive,
      '& + .MuiSwitch-track': {
        backgroundColor: alpha(theme.palette.salon.olive, 0.2),
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.salon.olive,
      border: `6px solid ${theme.palette.background.paper}`,
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 30,
    height: 30,
    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
    color: theme.palette.background.paper,
  },
  '& .MuiSwitch-track': {
    borderRadius: 34 / 2,
    backgroundColor: alpha(theme.palette.salon.olive, 0.1),
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100px',
        backgroundColor: alpha(theme.palette.background.paper, 0.4),
        borderRadius: '34px',
        padding: '4px',
      }}
    >
      <LightMode
        sx={{
          position: 'absolute',
          left: '2px',
          color: theme.palette.mode === 'light' ? 'warning.main' : alpha(theme.palette.common.white, 0.6),
          transition: 'color 0.3s ease',
          fontSize: '1.2rem',
          zIndex: 1,
        }}
      />
      <ThemeSwitch 
        checked={isDarkMode} 
        onChange={toggleTheme}
        id="theme-switch"
        inputProps={{ 'aria-label': 'Toggle dark mode' }}
      />
      <DarkMode
        sx={{
          position: 'absolute',
          right: '2px',
          color: theme.palette.mode === 'dark' ? '#a8c454' : alpha(theme.palette.common.black, 0.3),
          transition: 'color 0.3s ease',
          fontSize: '1.2rem',
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default ThemeToggle; 