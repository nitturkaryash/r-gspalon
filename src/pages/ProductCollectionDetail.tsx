import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControlLabel,
  Switch,
  Divider,
  InputAdornment,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import { useProductCollections } from '../hooks/useProductCollections'
import { useCollectionProducts } from '../hooks/useCollectionProducts'
import type { Product } from '../models/productTypes'

// Initial form data for products
const initialFormData = {
  name: '',
  description: '',
  price: '',
  stock_quantity: '',
  active: true,
}

export default function ProductCollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const collectionId = id || ''
  const navigate = useNavigate()
  const { getProductCollection } = useProductCollections()
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useCollectionProducts(collectionId)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)

  const collection = getProductCollection(collectionId)

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      active: product.active,
    })
    setEditingId(product.id)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim() || !formData.price) {
      return
    }
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity || '0'),
      active: formData.active,
    }
    
    if (editingId) {
      updateProduct({ ...productData, id: editingId })
    } else {
      createProduct(productData)
    }
    
    handleClose()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id)
    }
  }

  const handleBack = () => {
    navigate('/products')
  }

  if (!collection) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Collection not found</Typography>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink 
          component="button" 
          underline="hover" 
          color="inherit"
          onClick={handleBack}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          All Collections
        </MuiLink>
        <Typography color="text.primary">{collection.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">{collection.name}</Typography>
          {collection.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {collection.description}
            </Typography>
          )}
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
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: product.active ? 1 : 0.7,
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {product.name}
                    {!product.active && (
                      <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>
                        (Inactive)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description || 'No description'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(product.price)}
                    </Typography>
                    <Typography variant="body2">
                      Stock: {product.stock_quantity}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <IconButton 
                    onClick={() => handleEdit(product)}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(product.id)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No products found in this collection. Click "Add Product" to create your first one.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle>
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
                rows={3}
                fullWidth
              />
              <TextField
                label="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                type="number"
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
              <TextField
                label="Stock Quantity"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                type="number"
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
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