import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useProductCollections } from '../hooks/useProductCollections'
import type { ProductCollection } from '../models/productTypes'

// Initial form data for collections
const initialFormData = {
  name: '',
  description: '',
}

export default function ProductCollections() {
  const { productCollections, isLoading, error, createProductCollection, updateProductCollection, deleteProductCollection } = useProductCollections()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const handleEdit = (collection: ProductCollection) => {
    setFormData({
      name: collection.name,
      description: collection.description,
    })
    setEditingId(collection.id)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      return
    }
    
    try {
      if (editingId) {
        updateProductCollection({ ...formData, id: editingId })
      } else {
        createProductCollection(formData)
      }
      
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection? All products in this collection will also be deleted.')) {
      deleteProductCollection(id)
    }
  }

  const handleCollectionClick = (id: string) => {
    navigate(`/products/${id}`)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // If there's an authentication error, show a message
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ height: 'fit-content' }}
        >
          Add Collection
        </Button>
      </Box>

      {productCollections?.length ? (
        <Grid container spacing={3}>
          {productCollections.map((collection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  cursor: 'pointer',
                },
              }} onClick={() => handleCollectionClick(collection.id)}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {collection.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {collection.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(collection)
                      }}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(collection.id)
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <IconButton 
                    color="primary"
                    component={Link}
                    to={`/products/${collection.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No product collections found. Click "Add Collection" to create your first one.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Collection Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="sm"
        aria-labelledby="collection-dialog-title"
        disableEnforceFocus={false}
        keepMounted={false}
        disablePortal={false}
        disableRestoreFocus={false}
        disableAutoFocus={false}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle id="collection-dialog-title">
            {editingId ? 'Edit Collection' : 'Add New Collection'}
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