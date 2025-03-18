import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, Collapse, Alert } from '@mui/material';
import { Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
export default function LocalDataDebugger({ tableName, title = 'Local Data', showRefreshButton = true }) {
    const [data, setData] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    useEffect(() => {
        loadData();
    }, [tableName, refreshCount]);
    const loadData = () => {
        const storageKey = `local_${tableName}`;
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            try {
                setData(JSON.parse(storedData));
            }
            catch (error) {
                console.error(`Error parsing ${tableName} data:`, error);
                setData([]);
            }
        }
        else {
            setData([]);
        }
    };
    const handleRefresh = () => {
        setRefreshCount(prev => prev + 1);
    };
    const toggleExpanded = () => {
        setExpanded(!expanded);
    };
    return (_jsxs(Paper, { sx: { p: 2, mb: 2, bgcolor: '#f8f9fa' }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(IconButton, { size: "small", onClick: toggleExpanded, children: expanded ? _jsx(ExpandLessIcon, {}) : _jsx(ExpandMoreIcon, {}) }), _jsxs(Typography, { variant: "subtitle1", sx: { fontWeight: 'bold' }, children: [title, " - ", tableName] })] }), showRefreshButton && (_jsx(Button, { size: "small", startIcon: _jsx(RefreshIcon, {}), onClick: handleRefresh, variant: "outlined", children: "Refresh" }))] }), _jsx(Collapse, { in: expanded, children: _jsx(Box, { sx: { mt: 1 }, children: data.length > 0 ? (_jsx("pre", { style: {
                            overflow: 'auto',
                            maxHeight: '300px',
                            backgroundColor: '#f1f1f1',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                        }, children: JSON.stringify(data, null, 2) })) : (_jsxs(Alert, { severity: "info", children: ["No data available for ", tableName] })) }) })] }));
}
