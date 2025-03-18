import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Paper, Box, Typography, Chip, Tooltip, CircularProgress, IconButton, } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, TrendingFlat as TrendingFlatIcon, Info as InfoIcon, } from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
export default function KPICard({ title, value, subtitle, changeValue, isLoading = false, icon, isCurrency = false, tooltipText, height = 180 }) {
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
        }
        else if (changeValue < 0) {
            TrendIcon = TrendingDownIcon;
            trendColor = 'error.main';
            chipColor = 'error';
        }
    }
    // Format change value as percentage with sign
    const formattedChange = changeValue
        ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)}%`
        : '0%';
    return (_jsxs(Paper, { elevation: 0, sx: {
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
        }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, children: [_jsx(Typography, { variant: "subtitle1", color: "text.secondary", sx: { fontWeight: 500 }, children: title }), tooltipText && (_jsx(Tooltip, { title: tooltipText, arrow: true, placement: "top", children: _jsx(IconButton, { size: "small", sx: { mr: -1, mt: -1 }, children: _jsx(InfoIcon, { fontSize: "small", color: "action" }) }) })), icon && (_jsx(Box, { sx: {
                            backgroundColor: 'primary.light',
                            borderRadius: '50%',
                            p: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.main',
                        }, children: icon }))] }), _jsx(Box, { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", children: isLoading ? (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", children: _jsx(CircularProgress, { size: 28 }) })) : (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "h3", component: "div", fontWeight: "bold", mb: 0.5, children: formattedValue }), subtitle && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: subtitle }))] })) }), changeValue !== undefined && !isLoading && (_jsxs(Box, { sx: { mt: 'auto', display: 'flex', alignItems: 'center' }, children: [_jsx(Chip, { label: formattedChange, size: "small", color: chipColor, icon: _jsx(TrendIcon, {}), sx: {
                            height: 24,
                            '& .MuiChip-icon': {
                                fontSize: '1rem',
                                ml: 0.5
                            },
                            fontWeight: 500
                        } }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { ml: 1 }, children: "vs previous period" })] }))] }));
}
