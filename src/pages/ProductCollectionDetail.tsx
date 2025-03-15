import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useProductCollections } from '../hooks/useProductCollections'
import { useCollectionProducts } from '../hooks/useCollectionProducts'
import { formatCurrency } from '../utils/format'
import type { ProductItem } from '../models/productTypes'

// Initial form data for products
const initialFormData = {
  name: '',
  description: '',
  price: 0,
  stock_quantity: 0,
  sku: '',
  hsn_code: '',
  active: true,
}

export default function ProductCollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const collectionId = id || ''
  const navigate = useNavigate()
  
  const { getProductCollection, isLoading: loadingCollection, error: collectionError } = useProductCollections()
  const { products, isLoading: loadingProducts, error: productsError, createProduct, updateProduct, deleteProduct } = useCollectionProducts(collectionId)
  
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const collection = getProductCollection(collectionId)
  
  useEffect(() => {
    // Redirect if collection doesn't exist
    if (!loadingCollection && !collection) {
      navigate('/products')
    }
  }, [collection, loadingCollection, navigate])
  
  const handleOpen = () => setOpen(true)
  
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }
  
  const handleEdit = (product: ProductItem) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      hsn_code: product.hsn_code || '',
      active: product.active,
    })
    setEditingId(product.id)
    setOpen(true)
  }
  
  // Handler for price changes with validation
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If empty string, set price to 0
    if (value === '') {
      setFormData({ ...formData, price: 0 });
      return;
    }
    
    // Try to parse as float and convert to integer (store price in paisa)
    const parsedValue = parseFloat(value);
    
    // If valid number, update state (convert to paisa - multiply by 100)
    if (!isNaN(parsedValue)) {
      setFormData({ ...formData, price: Math.round(parsedValue * 100) });
    }
    // If invalid, don't update (keep previous value)
  };
  
  // Handler for stock quantity changes with validation
  const handleStockQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If empty string, set stock_quantity to 0
    if (value === '') {
      setFormData({ ...formData, stock_quantity: 0 });
      return;
    }
    
    // Try to parse as integer
    const parsedValue = parseInt(value, 10);
    
    // If valid number, update state
    if (!isNaN(parsedValue)) {
      setFormData({ ...formData, stock_quantity: parsedValue });
    }
    // If invalid, don't update (keep previous value)
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim() || formData.price < 0 || !formData.sku.trim()) {
      return
    }
    
    try {
      if (editingId) {
        updateProduct({ 
          ...formData, 
          id: editingId,
          collection_id: collectionId
        })
      } else {
        createProduct({ 
          ...formData, 
          collection_id: collectionId 
        })
      }
      
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id)
    }
  }
  
  if (loadingCollection || loadingProducts) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }
  
  // Check for authentication errors
  const error = collectionError || productsError;
  if (error instanceof Error && 
      (error.message.includes('authentication') || 
       error.message.includes('session') || 
       error.message.includes('log in'))) {
    return (
      <Box>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Authentication Error
          </Typography>
          <Typography variant="body1" paragraph>
            {error.message}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }
  
  if (!collection) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Collection not found.
        </Typography>
        <Button
          component={Link}
          to="/products"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Collections
        </Button>
      </Paper>
    )
  }
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/products" style={{ textDecoration: 'none', color: 'inherit' }}>
            Products
          </Link>
          <Typography color="text.primary">{collection.name}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">{collection.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {collection.description}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ height: 'fit-content' }}
        >
          Add Product
        </Button>
      </Box>
      
      {products?.length ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id}
                  sx={{
                    opacity: product.active ? 1 : 0.6,
                  }}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <InventoryIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />
                      {product.stock_quantity}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.active ? 'Active' : 'Inactive'}
                      color={product.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(product)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product.id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No products found in this collection. Click "Add Product" to create your first one.
          </Typography>
        </Paper>
      )}
      
      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="sm"
        aria-labelledby="product-dialog-title"
        disableEnforceFocus={false}
        keepMounted={false}
        disablePortal={false}
        disableRestoreFocus={false}
        disableAutoFocus={false}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle id="product-dialog-title">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="HSN Code (optional)"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                fullWidth
              />
              <TextField
                label="Price (₹)"
                type="number"
                value={formData.price / 100} // Display in rupees
                onChange={handlePriceChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Stock Quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={handleStockQuantityChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
} 