import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  useTheme
} from '@mui/material'
import {
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import InventoryBalanceReport from '../components/inventory/InventoryBalanceReport'

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

export default function Inventory() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Inventory Management"
      />

      <Paper sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="inventory tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab 
            icon={<InventoryIcon fontSize="small" />} 
            label="Inventory Balance" 
            iconPosition="start"
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<FileDownloadIcon fontSize="small" />} 
            label="Export Data" 
            iconPosition="start"
            {...a11yProps(1)} 
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Inventory Balance Tab */}
          <TabPanel value={tabValue} index={0}>
            <InventoryBalanceReport />
          </TabPanel>
          
          {/* Export Data Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Export Inventory Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Export your inventory data to Excel for analysis or record-keeping.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Export Transactions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export your inventory transactions data to Excel for analysis or record-keeping.
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      component={RouterLink}
                      to="/inventory/export"
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                    >
                      Export Transactions
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  )
} 