import {
  Drawer,
  Box,
  Typography,
  IconButton,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  Stack,
  ClickAwayListener,
  SelectChangeEvent
} from '@mui/material';
import { FocusTrap } from '@mui/base';
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useState, useRef } from 'react';
import { DashboardSettings as DashboardSettingsType } from '../../hooks/useDashboardAnalytics';

interface DashboardSettingsProps {
  settings: DashboardSettingsType;
  onSettingsChange: (newSettings: Partial<DashboardSettingsType>) => void;
  onRefresh: () => void;
}

export default function DashboardSettings({
  settings,
  onSettingsChange,
  onRefresh,
}: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);
  // Ref for the main drawer content
  const drawerContentRef = useRef<HTMLDivElement>(null);
  // Ref for the close button
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleVisibilityChange = (metricKey: keyof DashboardSettingsType['visibleMetrics']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onSettingsChange({
      visibleMetrics: {
        ...settings.visibleMetrics,
        [metricKey]: event.target.checked,
      },
    });
  };

  const handleChartTypeChange = (chartKey: keyof DashboardSettingsType['chartTypes']) => (
    event: SelectChangeEvent
  ) => {
    onSettingsChange({
      chartTypes: {
        ...settings.chartTypes,
        [chartKey]: event.target.value as 'line' | 'bar'
      }
    });
  };

  const handleRefreshIntervalChange = (event: Event, newValue: number | number[]) => {
    onSettingsChange({
      refreshInterval: (newValue as number) * 1000, // Convert to milliseconds
    });
  };

  const refreshIntervalSeconds = settings.refreshInterval / 1000;

  return (
    <>
      <IconButton
        onClick={toggleDrawer}
        color="primary"
        aria-label="Dashboard settings"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer}
        // Improved accessibility properties
        aria-modal="true"
        role="dialog"
        aria-labelledby="dashboard-settings-title"
        // Better focus trap implementation
        ModalProps={{
          // This helps avoid the aria-hidden warning by ensuring proper focus management
          keepMounted: false,
          disableEnforceFocus: false,
          disableAutoFocus: false,
          disableRestoreFocus: false,
          disableScrollLock: false
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            p: 3,
            boxSizing: 'border-box',
          },
        }}
      >
        <FocusTrap open={open} disableEnforceFocus>
          <div ref={drawerContentRef}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography id="dashboard-settings-title" variant="h6">
                Dashboard Settings
              </Typography>
              <IconButton 
                onClick={toggleDrawer} 
                edge="end"
                ref={closeButtonRef}
                aria-label="Close settings panel"
                // Focus on this button when drawer opens
                autoFocus
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Visible Metrics
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.dailySales}
                    onChange={handleVisibilityChange('dailySales')}
                  />
                }
                label="Daily Sales"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.topServices}
                    onChange={handleVisibilityChange('topServices')}
                  />
                }
                label="Top Services"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.appointments}
                    onChange={handleVisibilityChange('appointments')}
                  />
                }
                label="Appointments"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.retentionRate}
                    onChange={handleVisibilityChange('retentionRate')}
                  />
                }
                label="Customer Retention"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.averageTicket}
                    onChange={handleVisibilityChange('averageTicket')}
                  />
                }
                label="Average Ticket Price"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.staffUtilization}
                    onChange={handleVisibilityChange('staffUtilization')}
                  />
                }
                label="Staff Utilization"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.visibleMetrics.stylistRevenue}
                    onChange={handleVisibilityChange('stylistRevenue')}
                  />
                }
                label="Revenue per Stylist"
              />
            </FormGroup>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Chart Styles
            </Typography>
            <FormControl fullWidth variant="outlined" size="small" margin="normal">
              <InputLabel id="sales-trend-chart-label">Sales Trend Chart</InputLabel>
              <Select
                labelId="sales-trend-chart-label"
                value={settings.chartTypes.salesTrend}
                onChange={handleChartTypeChange('salesTrend')}
                label="Sales Trend Chart"
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Refresh Interval
            </Typography>
            <Box px={1} mt={2} mb={2}>
              <Slider
                value={refreshIntervalSeconds}
                onChange={handleRefreshIntervalChange}
                step={5}
                marks
                min={15}
                max={120}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}s`}
                aria-label="Data refresh interval in seconds"
              />
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                Data refreshes every {refreshIntervalSeconds} seconds
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" spacing={2} mt={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={toggleDrawer}
              >
                Close
              </Button>
              <Button
                variant="contained"
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={() => {
                  onRefresh();
                  toggleDrawer();
                }}
              >
                Refresh Now
              </Button>
            </Stack>
          </div>
        </FocusTrap>
      </Drawer>
    </>
  );
} 