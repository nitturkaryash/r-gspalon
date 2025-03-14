import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

export default function PageLoader() {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 3, 
          color: theme.palette.text.secondary,
          fontWeight: 500
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
} 