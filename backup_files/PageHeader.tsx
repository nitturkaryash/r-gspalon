import React, { ReactNode } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <Box sx={{ mr: 2, display: 'flex' }}>
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h5" component="h1" fontWeight="bold">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" sx={{ mt: 0.5, opacity: 0.9 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      
      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Paper>
  );
} 