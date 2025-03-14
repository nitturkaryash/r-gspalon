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
import { Sync as SyncIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Consumption } from '../../models/inventoryTypes';
import { useInventory } from '../../hooks/useInventory';

interface ConsumptionTabProps {
  consumption: Consumption[];
  isLoading: boolean;
  error: Error | null;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
}));

const ConsumptionTab: React.FC<ConsumptionTabProps> = ({ consumption, isLoading, error }) => {
  const { 
    syncConsumptionFromPos, 
    isSyncingConsumption,
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
      await syncConsumptionFromPos(dateRange.startDate, dateRange.endDate);
      handleCloseSyncDialog();
    } catch (error) {
      console.error('Error syncing consumption data:', error);
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
          Salon Consumption Records
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSyncingConsumption ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleOpenSyncDialog}
          disabled={isSyncingConsumption}
        >
          Sync from POS
        </Button>
      </Box>
      
      {/* Processing progress indicator */}
      {isSyncingConsumption && processingStats && (
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
          Error loading consumption data: {error.message}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {consumption.length === 0 ? (
            <Alert severity="info">No consumption records found. Sync with the POS system to fetch salon consumption data.</Alert>
          ) : (
            <Paper>
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="consumption table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Date</StyledTableCell>
                      <StyledTableCell>Requisition #</StyledTableCell>
                      <StyledTableCell>Product Name</StyledTableCell>
                      <StyledTableCell>HSN Code</StyledTableCell>
                      <StyledTableCell>Units</StyledTableCell>
                      <StyledTableCell align="right">Qty</StyledTableCell>
                      <StyledTableCell align="right">Cost/Unit (Excl. GST)</StyledTableCell>
                      <StyledTableCell align="right">GST %</StyledTableCell>
                      <StyledTableCell align="right">Taxable Value</StyledTableCell>
                      <StyledTableCell align="right">Total Value</StyledTableCell>
                      <StyledTableCell align="right">Balance Qty</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumption
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => (
                        <TableRow 
                          key={item.consumption_id} 
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.requisition_voucher_no}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.hsn_code}</TableCell>
                          <TableCell>{item.units}</TableCell>
                          <TableCell align="right">{item.consumption_qty}</TableCell>
                          <TableCell align="right">₹{item.purchase_cost_per_unit_ex_gst?.toFixed(2)}</TableCell>
                          <TableCell align="right">{item.purchase_gst_percentage}%</TableCell>
                          <TableCell align="right">₹{item.taxable_value?.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{item.invoice_value?.toFixed(2)}</TableCell>
                          <TableCell align="right">{item.balance_qty}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={consumption.length}
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
        <DialogTitle>Sync Consumption Data from POS</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a date range to sync salon consumption data from the POS system. This process may take a few minutes depending on the amount of data.
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
            disabled={isSyncingConsumption}
            startIcon={isSyncingConsumption ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          >
            Sync Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsumptionTab; 