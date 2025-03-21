import {
  Paper,
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  changeValue?: number;
  isLoading?: boolean;
  icon?: React.ReactNode;
  isCurrency?: boolean;
  tooltipText?: string;
  height?: number | string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  changeValue,
  isLoading = false,
  icon,
  isCurrency = false,
  tooltipText,
  height = 180
}: KPICardProps) {
  // Format value if it's a currency
  const formattedValue = isCurrency ? formatCurrency(Number(value)) : value;
  
  // Determine trend icon and color
  let TrendIcon = TrendingFlatIcon;
  let trendColor = 'text.secondary';
  let chipColor = 'default';
  
  if (changeValue && changeValue !== 0) {
    if (changeValue > 0) {
      TrendIcon = TrendingUpIcon;
      trendColor = 'success.main';
      chipColor = 'success';
    } else if (changeValue < 0) {
      TrendIcon = TrendingDownIcon;
      trendColor = 'error.main';
      chipColor = 'error';
    }
  }
  
  // Format change value as percentage with sign
  const formattedChange = changeValue 
    ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)}%` 
    : '0%';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.light',
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {title}
        </Typography>
        
        {tooltipText && (
          <Tooltip title={tooltipText} arrow placement="top">
            <IconButton size="small" sx={{ mr: -1, mt: -1 }}>
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        )}
        
        {icon && (
          <Box
            sx={{
              backgroundColor: 'primary.light',
              borderRadius: '50%',
              p: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography variant="h3" component="div" fontWeight="bold" mb={0.5}>
              {formattedValue}
            </Typography>
            
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </Box>
      
      {changeValue !== undefined && !isLoading && (
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center' }}>
          <Chip
            label={formattedChange}
            size="small"
            color={chipColor as any}
            icon={<TrendIcon />}
            sx={{ 
              height: 24, 
              '& .MuiChip-icon': { 
                fontSize: '1rem',
                ml: 0.5
              },
              fontWeight: 500
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            vs previous period
          </Typography>
        </Box>
      )}
    </Paper>
  );
} 