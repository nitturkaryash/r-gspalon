import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  TablePagination,
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useInventory } from '../../hooks/useInventory';
import { BalanceStock } from '../../models/inventoryTypes';
import { BalanceStockDisplay } from '../../models/balanceStockTypes';

// Helper function to convert BalanceStock to BalanceStockDisplay
const convertToDisplay = (item: BalanceStock): BalanceStockDisplay => {
  return {
    id: item.id,
    product_name: item.product_name || 'Unknown Product',
    balance_qty: item.balance_qty || 0,
    taxable_value: item.taxable_value || 0,
    igst: item.igst || 0,
    cgst: item.cgst || 0,
    sgst: item.sgst || 0,
    invoice_value: item.invoice_value || 0
  };
};

interface BalanceStockTabProps {
  balanceStock: BalanceStock[];
  isLoading: boolean;
  error: Error | null;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.primary.dark 
    : theme.palette.primary.light,
  color: theme.palette.common.white,
}));

const StyledTableHeaderRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: '#FFFF88', // Yellow background for table header
  '& .MuiTableCell-root': {
    color: '#000000',
    fontWeight: 'bold',
    border: '1px solid #cccccc',
    textAlign: 'center',
    padding: '8px',
  }
}));

const StyledDataCell = styled(TableCell)(({ theme }) => ({
  border: '1px solid #dddddd',
  padding: '8px',
  textAlign: 'right', // Right align for numerical values
}));

const BalanceStockTab: React.FC<BalanceStockTabProps> = ({ balanceStock, isLoading, error }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { recalculateBalanceStock } = useInventory();

  // Convert the balance stock data for display
  const displayData = balanceStock.map(convertToDisplay);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await recalculateBalanceStock();
    } catch (error) {
      console.error('Error recalculating balance stock:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Format currency values for display
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Balance Stock Records
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={isRecalculating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={handleRecalculate}
          disabled={isRecalculating || isLoading}
        >
          Recalculate Stock
        </Button>
      </Box>
      
      {/* Alert to explain the balance stock calculation */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body2">
          Balance Stock shows current inventory levels calculated from purchases, sales, and salon consumption records. Click "Recalculate Stock" to update the values.
        </Typography>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading balance stock data: {error.message}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {balanceStock.length === 0 ? (
            <Alert severity="info">
              No balance stock records found.
            </Alert>
          ) : (
            <Paper>
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="balance stock table">
                  <TableHead>
                    <StyledTableHeaderRow>
                      <TableCell>Balance Qty.</TableCell>
                      <TableCell>Taxable Value (Rs.)</TableCell>
                      <TableCell>IGST (Rs.)</TableCell>
                      <TableCell>CGST (Rs.)</TableCell>
                      <TableCell>SGST (Rs.)</TableCell>
                      <TableCell>Invoice Value (Rs.)</TableCell>
                    </StyledTableHeaderRow>
                  </TableHead>
                  <TableBody>
                    {displayData
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => (
                        <TableRow 
                          key={item.id} 
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <StyledDataCell>{item.balance_qty}</StyledDataCell>
                          <StyledDataCell>{formatCurrency(item.taxable_value)}</StyledDataCell>
                          <StyledDataCell>{formatCurrency(item.igst)}</StyledDataCell>
                          <StyledDataCell>{formatCurrency(item.cgst)}</StyledDataCell>
                          <StyledDataCell>{formatCurrency(item.sgst)}</StyledDataCell>
                          <StyledDataCell>{formatCurrency(item.invoice_value)}</StyledDataCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={displayData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default BalanceStockTab; 