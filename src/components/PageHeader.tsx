import React from 'react';
import { Box, Typography, Paper, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

const IconWrapper = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}));

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  action
}) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
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
};

export default PageHeader; 