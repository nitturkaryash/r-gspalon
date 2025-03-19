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
import { useServiceCollections } from '../hooks/useServiceCollections'
import type { ServiceCollection } from '../models/serviceTypes'

// Initial form data for collections
const initialFormData = {
  name: '',
  description: '',
}

export default function ServiceCollections() {
  const { serviceCollections, isLoading, createServiceCollection, updateServiceCollection, deleteServiceCollection } = useServiceCollections()
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

  const handleEdit = (collection: ServiceCollection) => {
    setFormData({
      name: collection.name,
      description: collection.description,
    })
    setEditingId(collection.id)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      return
    }
    
    if (editingId) {
      updateServiceCollection({ ...formData, id: editingId })
    } else {
      createServiceCollection(formData)
    }
    
    handleClose()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection? All services in this collection will also be deleted.')) {
      deleteServiceCollection(id)
    }
  }

  const handleCollectionClick = (id: string) => {
    navigate(`/services/${id}`)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ height: 'fit-content' }}
        >
          Add Collection
        </Button>
      </Box>

      {serviceCollections?.length ? (
        <Grid container spacing={3}>
          {serviceCollections.map((collection) => (
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
                    to={`/services/${collection.id}`}
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
            No service collections found. Click "Add Collection" to create your first one.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Collection Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle>
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