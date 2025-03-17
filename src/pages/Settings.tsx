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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });
  };

  return (
    <Box>
      <PageHeader title="Settings">
        <Typography variant="body2" color="text.secondary">
          Configure application settings and preferences
        </Typography>
      </PageHeader>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
                  name="darkMode"
                  color="primary"
                />
              }
              label="Dark Mode"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={handleChange}
                  name="notifications"
                  color="primary"
                />
              }
              label="Enable Notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailAlerts}
                  onChange={handleChange}
                  name="emailAlerts"
                  color="primary"
                />
              }
              label="Email Alerts"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSave}
                  onChange={handleChange}
                  name="autoSave"
                  color="primary"
                />
              }
              label="Auto Save"
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Developer Options
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.developerMode}
                  onChange={handleChange}
                  name="developerMode"
                  color="primary"
                />
              }
              label="Developer Mode"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Developer mode enables additional debugging tools and uses localStorage for data persistence.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 