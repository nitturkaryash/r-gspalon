import React from 'react';
import { Box, Typography, Paper, Tabs, Tab, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatabaseManagement } from '../components/DatabaseManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    alignItems: 'flex-start',
    textAlign: 'left',
    paddingLeft: theme.spacing(3),
    minWidth: 180,
  }
}));

const Settings: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={2} sx={{ mt: 3, display: 'flex', minHeight: 600 }}>
        <Box sx={{ borderRight: 1, borderColor: 'divider' }}>
          <StyledTabs
            orientation="vertical"
            value={value}
            onChange={handleChange}
            aria-label="settings tabs"
            sx={{ borderRight: 1, borderColor: 'divider' }}
          >
            <Tab label="General" {...a11yProps(0)} />
            <Tab label="Database" {...a11yProps(1)} />
            <Tab label="Account" {...a11yProps(2)} />
            <Tab label="Notifications" {...a11yProps(3)} />
          </StyledTabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Typography variant="h5" gutterBottom>General Settings</Typography>
          <Typography variant="body1" color="text.secondary">
            Configure general application settings here.
          </Typography>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <DatabaseManagement />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Typography variant="h5" gutterBottom>Account Settings</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account settings here.
          </Typography>
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <Typography variant="h5" gutterBottom>Notification Settings</Typography>
          <Typography variant="body1" color="text.secondary">
            Configure notification preferences here.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings; 