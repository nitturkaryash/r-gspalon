import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  InventoryRounded, 
  AddShoppingCartRounded, 
  ShoppingCartRounded, 
  LocalMallRounded,
  StorageRounded,
  SyncRounded,
  FileDownloadRounded,
  CategoryRounded
} from '@mui/icons-material';
import { useInventoryManagement } from '../../hooks/useInventoryManagement';
import { useQuery } from '@tanstack/react-query';
import InventoryStockTable from './InventoryStockTable';
import InventoryForm from './InventoryForm';
import InventoryStatCards from './InventoryStatCards';
import ProductManagement from './ProductManagement';

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
        <Box sx={{ p: 3 }}>
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

const InventoryDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formType, setFormType] = useState<'purchase' | 'sale' | 'consumption'>('purchase');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const { 
    fetchProducts, 
    fetchBalanceStock, 
    exportInventoryData,
    syncPosData 
  } = useInventoryManagement();

  const { data: products, isLoading: productsLoading } = useQuery(['products'], fetchProducts);
  const { data: balanceStock, isLoading: balanceLoading } = useQuery(['balance_stock'], fetchBalanceStock);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFormTypeChange = (type: 'purchase' | 'sale' | 'consumption') => {
    setFormType(type);
    setTabValue(2); // Switch to form tab
  };

  const handleSyncPosData = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    
    try {
      const syncedCount = await syncPosData();
      setSyncMessage({
        type: 'success',
        text: `Successfully synced ${syncedCount} POS sales to inventory.`
      });
    } catch (error: any) {
      setSyncMessage({
        type: 'error',
        text: error.message || 'Failed to sync POS data.'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleExportInventory = async () => {
    setExportLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await exportInventoryData(`Inventory_STOCK_DETAILS_${today}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryRounded sx={{ mr: 1 }} />
          Inventory Management
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<SyncRounded />}
            onClick={handleSyncPosData}
            disabled={syncLoading}
            sx={{ mr: 1 }}
          >
            {syncLoading ? <CircularProgress size={24} /> : 'Sync POS Data'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadRounded />}
            onClick={handleExportInventory}
            disabled={exportLoading}
          >
            {exportLoading ? <CircularProgress size={24} /> : 'Export STOCK DETAILS'}
          </Button>
        </Box>
      </Box>

      {syncMessage && (
        <Alert 
          severity={syncMessage.type} 
          sx={{ mb: 2 }}
          onClose={() => setSyncMessage(null)}
        >
          {syncMessage.text}
        </Alert>
      )}

      <InventoryStatCards balanceStock={balanceStock || []} />

      <Box sx={{ mb: 2 }}>
        <Paper elevation={2}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="inventory tabs"
            variant="fullWidth"
          >
            <Tab icon={<StorageRounded />} label="Stock" {...a11yProps(0)} />
            <Tab icon={<CategoryRounded />} label="Products" {...a11yProps(1)} />
            <Tab 
              icon={formType === 'purchase' ? <AddShoppingCartRounded /> : 
                    formType === 'sale' ? <ShoppingCartRounded /> : 
                    <LocalMallRounded />} 
              label={formType === 'purchase' ? 'Purchase' : 
                     formType === 'sale' ? 'Sale' : 
                     'Consumption'} 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Paper>
      </Box>

      <Box sx={{ mb: 2 }}>
        {tabValue === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 0 }}>
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddShoppingCartRounded />}
                      onClick={() => handleFormTypeChange('purchase')}
                    >
                      New Purchase
                    </Button>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      startIcon={<ShoppingCartRounded />}
                      onClick={() => handleFormTypeChange('sale')}
                    >
                      New Sale
                    </Button>
                    <Button 
                      variant="contained" 
                      color="info" 
                      startIcon={<LocalMallRounded />}
                      onClick={() => handleFormTypeChange('consumption')}
                    >
                      New Consumption
                    </Button>
                  </Box>
                  
                  {(productsLoading || balanceLoading) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <InventoryStockTable
                      balanceStock={balanceStock || []}
                      onEditStock={(productId, type) => {
                        setFormType(type as 'purchase' | 'sale' | 'consumption');
                        setTabValue(2);
                      }}
                    />
                  )}
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {tabValue === 1 && (
          <Paper elevation={3}>
            <TabPanel value={tabValue} index={1}>
              <ProductManagement />
            </TabPanel>
          </Paper>
        )}
        
        {tabValue === 2 && (
          <Paper elevation={3}>
            <TabPanel value={tabValue} index={2}>
              <InventoryForm 
                type={formType} 
                products={products || []}
                onTypeChange={setFormType}
              />
            </TabPanel>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default InventoryDashboard; 