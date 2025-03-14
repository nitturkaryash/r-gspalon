import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  TablePagination,
  Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Purchase, PurchaseFormState } from '../../models/inventoryTypes';
import { useInventory } from '../../hooks/useInventory';

interface PurchaseTabProps {
  purchases: Purchase[];
  isLoading: boolean;
  error: Error | null;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
}));

const PurchaseTab: React.FC<PurchaseTabProps> = ({ purchases, isLoading, error }) => {
  const { createPurchase, isCreatingPurchase } = useInventory();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formState, setFormState] = useState<PurchaseFormState>({
    date: new Date().toISOString().split('T')[0],
    product_name: '',
    hsn_code: '',
    units: '',
    purchase_invoice_number: '',
    purchase_qty: 0,
    mrp_incl_gst: 0,
    discount_on_purchase_percentage: 0,
    gst_percentage: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PurchaseFormState, string>>>({});

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, convert to numbers
    const numericFields = ['purchase_qty', 'mrp_incl_gst', 'discount_on_purchase_percentage', 'gst_percentage'];
    const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
    
    setFormState(prevState => ({
      ...prevState,
      [name]: newValue
    }));
    
    // Clear error when field is updated
    if (formErrors[name as keyof PurchaseFormState]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PurchaseFormState, string>> = {};
    
    if (!formState.product_name) errors.product_name = 'Product name is required';
    if (!formState.hsn_code) errors.hsn_code = 'HSN code is required';
    if (!formState.units) errors.units = 'Units is required';
    if (!formState.purchase_invoice_number) errors.purchase_invoice_number = 'Invoice number is required';
    if (!formState.purchase_qty || formState.purchase_qty <= 0) errors.purchase_qty = 'Quantity must be greater than 0';
    if (!formState.mrp_incl_gst || formState.mrp_incl_gst <= 0) errors.mrp_incl_gst = 'MRP must be greater than 0';
    if (formState.gst_percentage < 0) errors.gst_percentage = 'GST percentage cannot be negative';
    if (formState.discount_on_purchase_percentage < 0 || formState.discount_on_purchase_percentage > 100) {
      errors.discount_on_purchase_percentage = 'Discount must be between 0 and 100%';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await createPurchase(formState);
      // Reset form on success
      setFormState({
        date: new Date().toISOString().split('T')[0],
        product_name: '',
        hsn_code: '',
        units: '',
        purchase_invoice_number: '',
        purchase_qty: 0,
        mrp_incl_gst: 0,
        discount_on_purchase_percentage: 0,
        gst_percentage: 0,
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add New Purchase
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Date"
                type="date"
                name="date"
                value={formState.date}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Product Name"
                name="product_name"
                value={formState.product_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.product_name}
                helperText={formErrors.product_name}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="HSN Code"
                name="hsn_code"
                value={formState.hsn_code}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.hsn_code}
                helperText={formErrors.hsn_code}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Units"
                name="units"
                value={formState.units}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.units}
                helperText={formErrors.units}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Purchase Invoice Number"
                name="purchase_invoice_number"
                value={formState.purchase_invoice_number}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.purchase_invoice_number}
                helperText={formErrors.purchase_invoice_number}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Purchase Quantity"
                name="purchase_qty"
                type="number"
                value={formState.purchase_qty}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.purchase_qty}
                helperText={formErrors.purchase_qty}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="MRP (Incl. GST)"
                name="mrp_incl_gst"
                type="number"
                value={formState.mrp_incl_gst}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.mrp_incl_gst}
                helperText={formErrors.mrp_incl_gst}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Discount on Purchase (%)"
                name="discount_on_purchase_percentage"
                type="number"
                value={formState.discount_on_purchase_percentage}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.discount_on_purchase_percentage}
                helperText={formErrors.discount_on_purchase_percentage}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="GST Percentage"
                name="gst_percentage"
                type="number"
                value={formState.gst_percentage}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.gst_percentage}
                helperText={formErrors.gst_percentage}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={isCreatingPurchase ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                disabled={isCreatingPurchase}
                sx={{ mt: 2 }}
              >
                Add Purchase
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>
        Purchase Records
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading purchases: {error.message}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {purchases.length === 0 ? (
            <Alert severity="info">No purchase records found.</Alert>
          ) : (
            <Paper>
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="purchases table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Date</StyledTableCell>
                      <StyledTableCell>Product Name</StyledTableCell>
                      <StyledTableCell>HSN Code</StyledTableCell>
                      <StyledTableCell>Units</StyledTableCell>
                      <StyledTableCell>Invoice #</StyledTableCell>
                      <StyledTableCell align="right">Qty</StyledTableCell>
                      <StyledTableCell align="right">MRP (Incl. GST)</StyledTableCell>
                      <StyledTableCell align="right">Discount %</StyledTableCell>
                      <StyledTableCell align="right">GST %</StyledTableCell>
                      <StyledTableCell align="right">Taxable Value</StyledTableCell>
                      <StyledTableCell align="right">Total Value</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((purchase) => (
                        <TableRow 
                          key={purchase.purchase_id} 
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{formatDate(purchase.date)}</TableCell>
                          <TableCell>{purchase.product_name}</TableCell>
                          <TableCell>{purchase.hsn_code}</TableCell>
                          <TableCell>{purchase.units}</TableCell>
                          <TableCell>{purchase.purchase_invoice_number}</TableCell>
                          <TableCell align="right">{purchase.purchase_qty}</TableCell>
                          <TableCell align="right">₹{purchase.mrp_incl_gst?.toFixed(2)}</TableCell>
                          <TableCell align="right">{purchase.discount_on_purchase_percentage}%</TableCell>
                          <TableCell align="right">{purchase.gst_percentage}%</TableCell>
                          <TableCell align="right">₹{purchase.purchase_taxable_value?.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{purchase.purchase_invoice_value_rs?.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={purchases.length}
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

export default PurchaseTab; 