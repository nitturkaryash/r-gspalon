import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useStockManagement, Sale } from '../../hooks/useStockManagement';

// Define an interface for the extended Sale type with optional properties
interface ExtendedSale extends Sale {
  product_name?: string;
  hsn_code?: string;
  unit?: string;
  units?: string;
}

export default function TransactionConverter() {
  const theme = useTheme();
  const { 
    loading, 
    error, 
    cashSales, 
    cashSalesLoading, 
    fetchCashSales, 
    convertTransactions 
  } = useStockManagement();
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [convertSuccess, setConvertSuccess] = useState(false);
  const [convertedCount, setConvertedCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);

  useEffect(() => {
    fetchCashSales();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedTransactions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((transactionId) => transactionId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedTransactions(cashSales.map((sale) => sale.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleOpenDialog = () => {
    if (selectedTransactions.length === 0) {
      return;
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConvert = async () => {
    handleCloseDialog();
    const count = await convertTransactions(selectedTransactions);
    if (count > 0) {
      setConvertSuccess(true);
      setConvertedCount(count);
      setSelectedTransactions([]);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Cash Sales to Consumption Converter
        </Typography>
        <Tooltip title="About this feature">
          <IconButton 
            color="primary" 
            onClick={() => setOpenInfoDialog(true)}
            size="small"
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select cash sales transactions below and convert them to salon consumption to reclassify them for inventory purposes.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {convertSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success</AlertTitle>
          {convertedCount} transaction{convertedCount !== 1 ? 's' : ''} successfully converted to salon consumption.
        </Alert>
      )}

      <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: theme.shape.borderRadius }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Cash Sales Transactions
          </Typography>
          <Button
            startIcon={<SyncIcon />}
            variant="outlined"
            size="small"
            onClick={fetchCashSales}
            disabled={loading || cashSalesLoading}
            sx={{ 
              borderColor: 'primary.contrastText', 
              color: 'primary.contrastText',
              '&:hover': {
                borderColor: 'primary.contrastText',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="cash sales table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedTransactions.length > 0 &&
                      selectedTransactions.length < cashSales.length
                    }
                    checked={
                      cashSales.length > 0 &&
                      selectedTransactions.length === cashSales.length
                    }
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all transactions' }}
                  />
                </TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">GST</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(loading || cashSalesLoading) && !cashSales.length ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading cash sales...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : cashSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No cash sales found to convert.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      All cash sales have already been processed or none exist.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cashSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    hover
                    selected={selectedTransactions.includes(sale.id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        backgroundColor: `${theme.palette.primary.light}10`,
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: `${theme.palette.primary.light}20`,
                      }
                    }}
                    onClick={() => handleToggleSelect(sale.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTransactions.includes(sale.id)}
                        inputProps={{ 'aria-labelledby': `transaction-${sale.id}` }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggleSelect(sale.id)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell>{sale.invoice_no}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{(sale as ExtendedSale).product_name || 'Unknown Product'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          HSN: {(sale as ExtendedSale).hsn_code || 'N/A'} | {(sale as ExtendedSale).unit || (sale as ExtendedSale).units || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{sale.qty}</TableCell>
                    <TableCell>{sale.customer || '—'}</TableCell>
                    <TableCell align="right">{formatCurrency(sale.invoice_value)}</TableCell>
                    <TableCell align="right">
                      {sale.igst > 0 ? (
                        <Chip 
                          size="small" 
                          label={`IGST: ${formatCurrency(sale.igst)}`} 
                          color="primary" 
                          variant="outlined"
                        />
                      ) : (
                        <Box>
                          <Chip 
                            size="small" 
                            label={`CGST: ${formatCurrency(sale.cgst)}`} 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mb: 0.5 }}
                          />
                          <Chip 
                            size="small" 
                            label={`SGST: ${formatCurrency(sale.sgst)}`} 
                            color="primary" 
                            variant="outlined" 
                          />
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {cashSales.length > 0 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedTransactions.length} of {cashSales.length} selected
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
              onClick={handleOpenDialog}
              disabled={loading || selectedTransactions.length === 0}
            >
              Convert to Consumption
            </Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'warning.light', color: 'warning.dark' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Important Tax Consideration
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          This feature assumes compliance with local tax laws. Converting sales to consumption to avoid tax 
          should only be done if legally permitted in your jurisdiction. Consult with a tax professional before using this feature.
        </Typography>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="convert-dialog-title"
        aria-describedby="convert-dialog-description"
      >
        <DialogTitle id="convert-dialog-title">
          Convert Transactions to Consumption?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="convert-dialog-description">
            You are about to convert {selectedTransactions.length} cash sale transaction{selectedTransactions.length !== 1 ? 's' : ''} to salon consumption.
            This will reclassify these transactions and remove them from sales tax liability.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConvert} color="primary" variant="contained" autoFocus>
            Convert Transactions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog
        open={openInfoDialog}
        onClose={() => setOpenInfoDialog(false)}
        aria-labelledby="info-dialog-title"
      >
        <DialogTitle id="info-dialog-title">
          About Cash to Consumption Conversion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This feature allows you to reclassify cash sales transactions as salon consumption
            for inventory management purposes. When you convert a transaction:
          </DialogContentText>
          <Box component="ul" sx={{ pl: 2 }}>
            <Box component="li" sx={{ my: 1 }}>
              The transaction is moved from sales to salon consumption
            </Box>
            <Box component="li" sx={{ my: 1 }}>
              Tax fields (IGST, CGST, SGST) are cleared from these transactions
            </Box>
            <Box component="li" sx={{ my: 1 }}>
              The item remains deducted from inventory, but is now categorized as internal use
            </Box>
            <Box component="li" sx={{ my: 1 }}>
              Tax calculations will exclude these transactions from sales tax liability
            </Box>
          </Box>
          <DialogContentText sx={{ mt: 2, color: 'warning.dark' }}>
            <strong>Important:</strong> Ensure this practice complies with your local tax regulations.
            Misuse of this feature may lead to tax implications.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInfoDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 