import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, CircularProgress } from '@mui/material';
import { Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { useInventory } from '../hooks/useInventory';
import PurchaseTab from '../components/inventory/PurchaseTab';
import SalesTab from '../components/inventory/SalesTab';
import ConsumptionTab from '../components/inventory/ConsumptionTab';
import { downloadCsv } from '../utils/csvExporter';

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
    const data = await exportInventoryData();
    downloadCsv(data);
  };

  const isLoading = purchasesQuery.isLoading || salesQuery.isLoading || consumptionQuery.isLoading || balanceStockQuery.isLoading;

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
            disabled={isExporting || isLoading}
          >
            Export CSV
          </Button>
        </Box>

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
