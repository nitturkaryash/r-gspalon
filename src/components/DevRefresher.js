import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Button, Snackbar, Stack } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
/**
 * Development helper component for manual refreshing
 * Only renders in development mode
 */
export function DevRefresher() {
    const queryClient = useQueryClient();
    const [lastRefresh, setLastRefresh] = useState('');
    const [open, setOpen] = useState(false);
    // Only show in development
    if (import.meta.env.PROD) {
        return null;
    }
    const handleRefresh = () => {
        // Invalidate all queries
        queryClient.invalidateQueries();
        // Clear all storage (optional, can be destructive)
        // localStorage.clear()
        // sessionStorage.clear()
        // Force browser reload
        // window.location.reload()
        // Update last refresh time
        const now = new Date().toLocaleTimeString();
        setLastRefresh(now);
        setOpen(true);
    };
    return (_jsxs(Box, { sx: {
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
        }, children: [_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [lastRefresh && (_jsxs(Box, { sx: { fontSize: '0.75rem', color: 'text.secondary' }, children: ["Last refresh: ", lastRefresh] })), _jsx(Button, { variant: "contained", color: "warning", size: "small", startIcon: _jsx(RefreshIcon, {}), onClick: handleRefresh, children: "Force Refresh" })] }), _jsx(Snackbar, { open: open, autoHideDuration: 3000, onClose: () => setOpen(false), message: "Application state refreshed" })] }));
}
