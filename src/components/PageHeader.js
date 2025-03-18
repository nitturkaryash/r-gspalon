import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from '@mui/material';
export default function PageHeader({ title, children }) {
    return (_jsx(Box, { sx: { mb: 4 }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "h4", component: "h1", children: title }), children] }) }));
}
