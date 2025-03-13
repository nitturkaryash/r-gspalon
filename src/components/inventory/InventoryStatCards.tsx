import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {
  InventoryRounded,
  ShoppingCartRounded,
  LocalMallRounded,
  CurrencyRupeeRounded
} from '@mui/icons-material';
import { BalanceStock } from '../../models/inventoryTypes';

interface InventoryStatCardsProps {
  balanceStock: BalanceStock[];
}

const InventoryStatCards: React.FC<InventoryStatCardsProps> = ({ balanceStock }) => {
  // Calculate statistics
  const totalProducts = balanceStock.length;
  const totalQuantity = balanceStock.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = balanceStock.reduce((sum, item) => sum + item.invoice_value, 0);
  const totalTaxableValue = balanceStock.reduce((sum, item) => sum + item.taxable_value, 0);
  const totalGst = balanceStock.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);

  // Format numbers for display
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(2)} K`;
    } else {
      return `₹${value.toFixed(2)}`;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">
                Products
              </Typography>
              <InventoryRounded fontSize="large" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {totalProducts}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total unique products in stock
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              bgcolor: 'secondary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">
                Quantity
              </Typography>
              <ShoppingCartRounded fontSize="large" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {totalQuantity.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total units in inventory
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">
                Stock Value
              </Typography>
              <CurrencyRupeeRounded fontSize="large" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {formatCurrency(totalValue)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total inventory value (incl. GST)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              bgcolor: 'info.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">
                GST Amount
              </Typography>
              <LocalMallRounded fontSize="large" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {formatCurrency(totalGst)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total GST in inventory (CGST+SGST+IGST)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryStatCards; 