import React, { ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonAction?: () => void;
  icon?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  buttonAction,
  icon
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
        py: 8,
        px: 2,
        background: 'rgba(255, 255, 255, 0.05)',
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'rgba(255, 215, 0, 0.5)', opacity: 0.6 }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h5" sx={{ mb: 1, color: '#FFD700' }}>
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)', maxWidth: 500, mx: 'auto' }}
      >
        {description}
      </Typography>
      
      {buttonText && buttonAction && (
        <Button 
          variant="contained" 
          onClick={buttonAction}
          sx={{
            minWidth: 200,
            background: 'linear-gradient(45deg, #B8860B, #FFD700)',
            color: 'black',
            '&:hover': {
              background: 'linear-gradient(45deg, #DAA520, #FFF8DC)',
            },
          }}
        >
          {buttonText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;