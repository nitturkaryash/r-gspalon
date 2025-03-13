import React, { useState } from 'react';
import {
  Box,
  Button,
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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress
} from '@mui/material';
import { Sync as SyncIcon, DateRange as DateRangeIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Sale } from '../../models/inventoryTypes';
import { useInventory } from '../../hooks/useInventory';

interface SalesTabProps {
  sales: Sale[];
  isLoading: boolean;
  error: Error | null;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
}));

const SalesTab: React.FC<SalesTabProps> = ({ sales, isLoading, error }) => {
  const { 
    syncSalesFromPos, 
    isSyncingSales,
    processingStats
  } = useInventory();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenSyncDialog = () => {
    setSyncDialogOpen(true);
  };

  const handleCloseSyncDialog = () => {
    setSyncDialogOpen(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSyncData = async () => {
    try {
      await syncSalesFromPos(dateRange.startDate, dateRange.endDate);
      handleCloseSyncDialog();
    } catch (error) {
      console.error('Error syncing sales data:', error);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!processingStats) return 0;
    const { total, processed } = processingStats;
    return total > 0 ? Math.round((processed / total) * 100) : 0;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Sales Records
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSyncingSales ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleOpenSyncDialog}
          disabled={isSyncingSales}
        >
          Sync with POS
        </Button>
      </Box>
      
      {/* Processing progress indicator */}
      {isSyncingSales && processingStats && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={calculateProgress()} />
          <Typography variant="body2" color="text.secondary" align="center">
            Processing: {processingStats.processed} of {processingStats.total} items 
            {processingStats.errors > 0 && ` (${processingStats.errors} errors)`}
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading sales: {error.message}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {sales.length === 0 ? (
            <Alert severity="info">No sales records found. Sync with the POS system to fetch sales data.</Alert>
          ) : (
            <Paper>
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="sales table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Date</StyledTableCell>
                      <StyledTableCell>Invoice #</StyledTableCell>
                      <StyledTableCell>Product Name</StyledTableCell>
                      <StyledTableCell>HSN Code</StyledTableCell>
                      <StyledTableCell>Units</StyledTableCell>
                      <StyledTableCell align="right">Qty</StyledTableCell>
                      <StyledTableCell align="right">MRP (Incl. GST)</StyledTableCell>
                      <StyledTableCell align="right">Discount %</StyledTableCell>
                      <StyledTableCell align="right">Sale Rate (Excl. GST)</StyledTableCell>
                      <StyledTableCell align="right">GST %</StyledTableCell>
                      <StyledTableCell align="right">Taxable Value</StyledTableCell>
                      <StyledTableCell align="right">Total Value</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((sale) => (
                        <TableRow 
                          key={sale.sale_id} 
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{formatDate(sale.date)}</TableCell>
                          <TableCell>{sale.invoice_no}</TableCell>
                          <TableCell>{sale.product_name}</TableCell>
                          <TableCell>{sale.hsn_code}</TableCell>
                          <TableCell>{sale.units}</TableCell>
                          <TableCell align="right">{sale.sales_qty}</TableCell>
                          <TableCell align="right">₹{sale.mrp_incl_gst?.toFixed(2)}</TableCell>
                          <TableCell align="right">{sale.discount_on_sales_percentage}%</TableCell>
                          <TableCell align="right">₹{sale.discounted_sales_rate_excl_gst?.toFixed(2)}</TableCell>
                          <TableCell align="right">{sale.sales_gst_percentage}%</TableCell>
                          <TableCell align="right">₹{sale.sales_taxable_value?.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{sale.invoice_value_rs?.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={sales.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </>
      )}
      
      {/* Sync with POS Dialog */}
      <Dialog open={syncDialogOpen} onClose={handleCloseSyncDialog}>
        <DialogTitle>Sync Sales Data from POS</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a date range to sync sales data from the POS system. This process may take a few minutes depending on the amount of data.
          </DialogContentText>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSyncDialog}>Cancel</Button>
          <Button 
            onClick={handleSyncData} 
            color="primary" 
            variant="contained"
            disabled={isSyncingSales}
            startIcon={isSyncingSales ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          >
            Sync Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesTab; 