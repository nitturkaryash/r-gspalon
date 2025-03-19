import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { useInventory } from '../hooks/useInventory';
import PurchaseTab from '../components/inventory/PurchaseTab.jsx';
import SalesTab from '../components/inventory/SalesTab';
import ConsumptionTab from '../components/inventory/ConsumptionTab';
import { downloadCsv } from '../utils/csvExporter';
import { Link } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  boxShadow: theme.shadows[2],
}));

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
};

interface Product {
  id: string;
  name: string;
  hsn_code?: string;  // Make optional if not always required
  units?: string;     // Make optional if not always required
  // ... other existing properties
}

const Inventory: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { 
    purchasesQuery, 
    salesQuery, 
    consumptionQuery, 
    balanceStockQuery,
    exportInventoryData,
    isExporting
  } = useInventory();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportData = async () => {
    try {
      const data = await exportInventoryData();
      downloadCsv(data);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const isLoading = purchasesQuery.isLoading || salesQuery.isLoading || consumptionQuery.isLoading || balanceStockQuery.isLoading;
  const error = purchasesQuery.error || salesQuery.error || consumptionQuery.error || balanceStockQuery.error;
  
  // Show a loading state while data is being fetched
  if (isLoading && !error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <CircularProgress size={40} sx={{ mb: 3 }} />
          <Typography variant="h6">Loading inventory data...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Inventory Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportData}
            disabled={isExporting || isLoading || !!error}
          >
            Export CSV
          </Button>
        </Box>

        {error && error.message.includes('does not exist') && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" component={Link} to="/inventory-setup">
                Setup Tables
              </Button>
            }
          >
            Database tables not found. Please run the setup utility to create the required tables.
          </Alert>
        )}

        <StyledPaper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory tabs">
              <Tab label="Purchases" {...a11yProps(0)} />
              <Tab label="Sales to Customers" {...a11yProps(1)} />
              <Tab label="Salon Consumption" {...a11yProps(2)} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <PurchaseTab 
              purchases={purchasesQuery.data || []} 
              isLoading={purchasesQuery.isLoading} 
              error={purchasesQuery.error}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <SalesTab 
              sales={salesQuery.data || []} 
              isLoading={salesQuery.isLoading} 
              error={salesQuery.error}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ConsumptionTab 
              consumption={consumptionQuery.data || []} 
              isLoading={consumptionQuery.isLoading} 
              error={consumptionQuery.error}
            />
          </TabPanel>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default Inventory;
