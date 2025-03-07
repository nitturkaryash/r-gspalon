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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useCollections } from '../hooks/useCollections'
import { useProducts } from '../hooks/useProducts'
import { calculateProfit, calculateProfitMargin } from '../models/inventoryTypes'
import { formatCurrency, formatPercentage } from '../utils/format'
import type { Product } from '../models/inventoryTypes'

// Initial form data for products
const initialFormData = {
  name: '',
  price: 0,
  cost: 0,
  stock: 0,
  status: 'active' as 'active' | 'inactive',
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const collectionId = id || ''
  const navigate = useNavigate()
  
  const { getCollection, isLoading: loadingCollection } = useCollections()
  const { products, isLoading: loadingProducts, createProduct, updateProduct, deleteProduct } = useProducts(collectionId)
  
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [profit, setProfit] = useState(0)
  const [profitMargin, setProfitMargin] = useState(0)
  
  const collection = getCollection(collectionId)
  
  useEffect(() => {
    // Redirect if collection doesn't exist
    if (!loadingCollection && !collection) {
      navigate('/inventory')
    }
  }, [collection, loadingCollection, navigate])
  
  useEffect(() => {
    // Calculate profit and margin when price or cost changes
    const calculatedProfit = calculateProfit(formData.price, formData.cost)
    setProfit(calculatedProfit)
    
    const calculatedMargin = calculateProfitMargin(formData.price, formData.cost)
    setProfitMargin(calculatedMargin)
  }, [formData.price, formData.cost])
  
  const handleOpen = () => setOpen(true)
  
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }
  
  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      status: product.status,
    })
    setEditingId(product.id)
    setOpen(true)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim() || formData.price <= 0 || formData.cost < 0) {
      return
    }
    
    if (editingId) {
      updateProduct({ 
        ...formData, 
        id: editingId 
      })
    } else {
      createProduct({ 
        ...formData, 
        collection_id: collectionId 
      })
    }
    
    handleClose()
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
  
  if (!collection) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Collection not found.
        </Typography>
        <Button
          component={Link}
          to="/inventory"
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
          <Link to="/inventory" style={{ textDecoration: 'none', color: 'inherit' }}>
            Inventory
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
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Cost (₹)</TableCell>
                <TableCell align="right">Profit (₹)</TableCell>
                <TableCell align="right">Margin (%)</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const productProfit = calculateProfit(product.price, product.cost)
                const productMargin = calculateProfitMargin(product.price, product.cost)
                
                return (
                  <TableRow 
                    key={product.id}
                    sx={{
                      opacity: product.status === 'inactive' ? 0.6 : 1,
                    }}
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                    <TableCell align="right">{formatCurrency(product.cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(productProfit)}</TableCell>
                    <TableCell align="right">{formatPercentage(productMargin)}</TableCell>
                    <TableCell align="right">{product.stock} units</TableCell>
                    <TableCell>
                      <Chip 
                        label={product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        color={product.status === 'active' ? 'success' : 'default'}
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
                )
              })}
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
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Price (₹)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  error={formData.price <= 0}
                  helperText={formData.price <= 0 ? "Price must be greater than 0" : ""}
                />
                
                <TextField
                  label="Cost (₹)"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  error={formData.cost < 0}
                  helperText={formData.cost < 0 ? "Cost cannot be negative" : ""}
                />

                <TextField
                  label="Stock (Units)"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                  error={formData.stock < 0}
                  helperText={formData.stock < 0 ? "Stock cannot be negative" : ""}
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Profit (₹)"
                  value={formatCurrency(profit)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-input': {
                      color: profit >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                    },
                  }}
                />
                
                <TextField
                  label="Margin (%)"
                  value={formatPercentage(profitMargin)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-input': {
                      color: profitMargin >= 20 ? 'success.main' : profitMargin >= 0 ? 'warning.main' : 'error.main',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </Stack>
              
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
                <FormHelperText>
                  Inactive products won't appear in POS and ordering systems
                </FormHelperText>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.name.trim() || formData.price <= 0 || formData.cost < 0}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
} 