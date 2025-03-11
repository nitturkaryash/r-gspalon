import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonAction?: () => void;
  icon?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  buttonText,
  buttonAction,
  icon
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 2,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'rgba(255, 215, 0, 0.5)' }}>
          {icon}
        </Box>
      )}
      <Typography variant="h5" sx={{ mb: 1, color: '#FFD700' }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
        {description}
      </Typography>
      {buttonText && buttonAction && (
        <Button
          variant="contained"
          onClick={buttonAction}
          sx={{
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
    </Box>
  );
} 