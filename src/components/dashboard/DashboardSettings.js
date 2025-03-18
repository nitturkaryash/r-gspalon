import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Drawer, Box, Typography, IconButton, FormGroup, FormControlLabel, Switch, Divider, FormControl, InputLabel, Select, MenuItem, Slider, Button, Stack } from '@mui/material';
import { FocusTrap } from '@mui/base';
import { Settings as SettingsIcon, Close as CloseIcon, Refresh as RefreshIcon, } from '@mui/icons-material';
import { useState, useRef } from 'react';
export default function DashboardSettings({ settings, onSettingsChange, onRefresh, }) {
    const [open, setOpen] = useState(false);
    // Ref for the main drawer content
    const drawerContentRef = useRef(null);
    // Ref for the close button
    const closeButtonRef = useRef(null);
    const toggleDrawer = () => {
        setOpen(!open);
    };
    const handleVisibilityChange = (metricKey) => (event) => {
        onSettingsChange({
            visibleMetrics: {
                ...settings.visibleMetrics,
                [metricKey]: event.target.checked,
            },
        });
    };
    const handleChartTypeChange = (chartKey) => (event) => {
        onSettingsChange({
            chartTypes: {
                ...settings.chartTypes,
                [chartKey]: event.target.value
            }
        });
    };
    const handleRefreshIntervalChange = (event, newValue) => {
        onSettingsChange({
            refreshInterval: newValue * 1000, // Convert to milliseconds
        });
    };
    const refreshIntervalSeconds = settings.refreshInterval / 1000;
    return (_jsxs(_Fragment, { children: [_jsx(IconButton, { onClick: toggleDrawer, color: "primary", "aria-label": "Dashboard settings", sx: {
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000,
                    backgroundColor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                        backgroundColor: 'primary.light',
                    },
                }, children: _jsx(SettingsIcon, {}) }), _jsx(Drawer, { anchor: "right", open: open, onClose: toggleDrawer, "aria-modal": "true", role: "dialog", "aria-labelledby": "dashboard-settings-title", 
                // Better focus trap implementation
                ModalProps: {
                    // This helps avoid the aria-hidden warning by ensuring proper focus management
                    keepMounted: false,
                    disableEnforceFocus: false,
                    disableAutoFocus: false,
                    disableRestoreFocus: false,
                    disableScrollLock: false
                }, sx: {
                    '& .MuiDrawer-paper': {
                        width: 320,
                        p: 3,
                        boxSizing: 'border-box',
                    },
                }, children: _jsx(FocusTrap, { open: open, disableEnforceFocus: true, children: _jsxs("div", { ref: drawerContentRef, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { id: "dashboard-settings-title", variant: "h6", children: "Dashboard Settings" }), _jsx(IconButton, { onClick: toggleDrawer, edge: "end", ref: closeButtonRef, "aria-label": "Close settings panel", 
                                        // Focus on this button when drawer opens
                                        autoFocus: true, children: _jsx(CloseIcon, {}) })] }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Visible Metrics" }), _jsxs(FormGroup, { children: [_jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.dailySales, onChange: handleVisibilityChange('dailySales') }), label: "Daily Sales" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.topServices, onChange: handleVisibilityChange('topServices') }), label: "Top Services" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.appointments, onChange: handleVisibilityChange('appointments') }), label: "Appointments" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.retentionRate, onChange: handleVisibilityChange('retentionRate') }), label: "Customer Retention" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.averageTicket, onChange: handleVisibilityChange('averageTicket') }), label: "Average Ticket Price" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.staffUtilization, onChange: handleVisibilityChange('staffUtilization') }), label: "Staff Utilization" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.visibleMetrics.stylistRevenue, onChange: handleVisibilityChange('stylistRevenue') }), label: "Revenue per Stylist" })] }), _jsx(Divider, { sx: { my: 3 } }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Chart Styles" }), _jsxs(FormControl, { fullWidth: true, variant: "outlined", size: "small", margin: "normal", children: [_jsx(InputLabel, { id: "sales-trend-chart-label", children: "Sales Trend Chart" }), _jsxs(Select, { labelId: "sales-trend-chart-label", value: settings.chartTypes.salesTrend, onChange: handleChartTypeChange('salesTrend'), label: "Sales Trend Chart", children: [_jsx(MenuItem, { value: "line", children: "Line Chart" }), _jsx(MenuItem, { value: "bar", children: "Bar Chart" })] })] }), _jsx(Divider, { sx: { my: 3 } }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Refresh Interval" }), _jsxs(Box, { px: 1, mt: 2, mb: 2, children: [_jsx(Slider, { value: refreshIntervalSeconds, onChange: handleRefreshIntervalChange, step: 5, marks: true, min: 15, max: 120, valueLabelDisplay: "auto", valueLabelFormat: (value) => `${value}s`, "aria-label": "Data refresh interval in seconds" }), _jsxs(Typography, { variant: "caption", color: "text.secondary", align: "center", display: "block", children: ["Data refreshes every ", refreshIntervalSeconds, " seconds"] })] }), _jsx(Divider, { sx: { my: 3 } }), _jsxs(Stack, { direction: "row", spacing: 2, mt: 3, children: [_jsx(Button, { variant: "outlined", fullWidth: true, onClick: toggleDrawer, children: "Close" }), _jsx(Button, { variant: "contained", fullWidth: true, startIcon: _jsx(RefreshIcon, {}), onClick: () => {
                                            onRefresh();
                                            toggleDrawer();
                                        }, children: "Refresh Now" })] })] }) }) })] }));
}
