import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
export default function PageLoader() {
    const theme = useTheme();
    return (_jsxs(Box, { sx: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: theme.palette.background.default,
        }, children: [_jsx(CircularProgress, { size: 60, thickness: 4 }), _jsx(Typography, { variant: "h6", sx: {
                    mt: 3,
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                }, children: "Loading..." })] }));
}
