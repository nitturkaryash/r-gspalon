import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  buttonText?: string;
  buttonAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  buttonText,
  buttonAction,
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', opacity: 0.6 }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        {description}
      </Typography>
      
      {buttonText && buttonAction && (
        <Button 
          variant="contained" 
          onClick={buttonAction}
          sx={{ minWidth: 200 }}
        >
          {buttonText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState; 