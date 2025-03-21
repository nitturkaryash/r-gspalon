import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  CircularProgress,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useProducts, Product } from '../hooks/useProducts';

// Initial form data
const initialFormData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  product_name: '',
  hsn_code: '',
  unit_type: '',
  mrp_incl_gst: 0,
  gst_percentage: 18, // Default GST percentage
  discount_on_purchase_percentage: 0,
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
}));

export default function Products() {
  const { products, isLoading, error, fetchProducts, addProduct, updateProduct, deleteProduct } = useProducts();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleOpen = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      product_name: product.product_name,
      hsn_code: product.hsn_code,
      unit_type: product.unit_type,
      mrp_incl_gst: product.mrp_incl_gst,
      gst_percentage: product.gst_percentage,
      discount_on_purchase_percentage: product.discount_on_purchase_percentage,
    });
    setEditingId(product.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    if (editingId) {
      // Update existing product
      updateProduct(editingId, formData);
    } else {
      // Create new product
      addProduct(formData);
    }
    
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const validateForm = () => {
    if (!formData.product_name.trim()) {
      alert('Product name is required');
      return false;
    }
    if (!formData.hsn_code.trim()) {
      alert('HSN code is required');
      return false;
    }
    if (!formData.unit_type.trim()) {
      alert('Unit type is required');
      return false;
    }
    if (formData.mrp_incl_gst <= 0) {
      alert('MRP must be greater than 0');
      return false;
    }
    return true;
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleInputChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" color="primary">
          Products
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader aria-label="products table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Product Name</StyledTableCell>
                <StyledTableCell>HSN Code</StyledTableCell>
                <StyledTableCell>Unit Type</StyledTableCell>
                <StyledTableCell align="right">MRP (Incl. GST)</StyledTableCell>
                <StyledTableCell align="right">GST %</StyledTableCell>
                <StyledTableCell align="right">Discount %</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.hsn_code}</TableCell>
                      <TableCell>{product.unit_type}</TableCell>
                      <TableCell align="right">₹{product.mrp_incl_gst.toFixed(2)}</TableCell>
                      <TableCell align="right">{product.gst_percentage}%</TableCell>
                      <TableCell align="right">{product.discount_on_purchase_percentage}%</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(product)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No products found. Click "Add Product" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={products.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Product Name"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="HSN Code"
                value={formData.hsn_code}
                onChange={(e) => handleInputChange('hsn_code', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unit Type"
                value={formData.unit_type}
                onChange={(e) => handleInputChange('unit_type', e.target.value)}
                fullWidth
                required
                placeholder="e.g., pcs, bottles, kg"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="MRP (Incl. GST)"
                type="number"
                value={formData.mrp_incl_gst}
                onChange={(e) => handleInputChange('mrp_incl_gst', parseFloat(e.target.value) || 0)}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="GST Percentage"
                type="number"
                value={formData.gst_percentage}
                onChange={(e) => handleInputChange('gst_percentage', parseFloat(e.target.value) || 0)}
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 28, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Discount on Purchase"
                type="number"
                value={formData.discount_on_purchase_percentage}
                onChange={(e) => handleInputChange('discount_on_purchase_percentage', parseFloat(e.target.value) || 0)}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 0.01 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 