import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Divider } from '@mui/material';
import PageHeader from '../components/PageHeader';
export default function Settings() {
    const [settings, setSettings] = React.useState({
        darkMode: false,
        notifications: true,
        emailAlerts: true,
        autoSave: true,
        developerMode: true
    });
    const handleChange = (event) => {
        setSettings({
            ...settings,
            [event.target.name]: event.target.checked
        });
    };
    return (_jsxs(Box, { children: [_jsx(PageHeader, { title: "Settings", children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Configure application settings and preferences" }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Application Settings" }), _jsx(Divider, { sx: { my: 2 } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.darkMode, onChange: handleChange, name: "darkMode", color: "primary" }), label: "Dark Mode" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.notifications, onChange: handleChange, name: "notifications", color: "primary" }), label: "Enable Notifications" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.emailAlerts, onChange: handleChange, name: "emailAlerts", color: "primary" }), label: "Email Alerts" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.autoSave, onChange: handleChange, name: "autoSave", color: "primary" }), label: "Auto Save" })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Developer Options" }), _jsx(Divider, { sx: { my: 2 } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: settings.developerMode, onChange: handleChange, name: "developerMode", color: "primary" }), label: "Developer Mode" }), _jsx(Box, { sx: { mt: 2 }, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Developer mode enables additional debugging tools and uses localStorage for data persistence." }) })] }) })] })] }));
}
