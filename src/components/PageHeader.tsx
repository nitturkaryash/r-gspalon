import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, children }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
          <Box>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {children}
      </Box>
    </Box>
  );
} 