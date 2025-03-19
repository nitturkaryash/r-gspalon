import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardActions,
  Avatar,
  FormControlLabel,
  Switch,
  IconButton,
  CircularProgress,
  Autocomplete,
  Divider,
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCut,
  Palette,
  Spa,
  Face,
} from '@mui/icons-material'
import { useStylists, Stylist } from '../hooks/useStylists'
import { useServices } from '../hooks/useServices'
import { toast } from 'react-toastify'

// Default avatar image
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Stylist&background=6B8E23&color=fff&size=150'

// Available specialties
const SPECIALTIES = [
  'Haircut',
  'Styling',
  'Color',
  'Highlights',
  'Balayage',
  'Perm',
  'Extensions',
  'Blowout',
  'Bridal',
  'Kids',
  'Beard Trim',
  'Shave',
]

type StylistFormData = Omit<Stylist, 'id'> & { id?: string }

const initialFormData: StylistFormData = {
  name: '',
  specialties: [],
  bio: '',
  gender: 'other',
  available: true,
  imageUrl: '',
  email: '',
  phone: '',
  breaks: []
}

export default function Stylists() {
  const { stylists, isLoading, createStylist, updateStylist, deleteStylist } = useStylists()
  const { services } = useServices()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<StylistFormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleOpen = () => setOpen(true)
  
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const handleEdit = (stylist: Stylist) => {
    setFormData({
      name: stylist.name,
      specialties: stylist.specialties,
      bio: stylist.bio || '',
      gender: stylist.gender || 'other',
      available: stylist.available,
      imageUrl: stylist.imageUrl || '',
      email: stylist.email || '',
      phone: stylist.phone || '',
      breaks: stylist.breaks || []
    })
    setEditingId(stylist.id)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Stylist name is required')
      return
    }

    if (editingId) {
      updateStylist({ ...formData, id: editingId })
    } else {
      createStylist(formData)
    }
    
    handleClose()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stylist?')) {
      deleteStylist(id)
    }
  }

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'haircut':
        return <ContentCut fontSize="small" />
      case 'color':
        return <Palette fontSize="small" />
      default:
        return <Spa fontSize="small" />
    }
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
        <Typography variant="h1">Stylists</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpen}
          sx={{ height: 'fit-content' }}
        >
          Add Stylist
        </Button>
      </Box>

      {stylists?.length ? (
        <Grid container spacing={3}>
          {stylists.map((stylist) => (
            <Grid item xs={12} sm={6} md={4} key={stylist.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={stylist.imageUrl || DEFAULT_AVATAR} 
                    sx={{ width: 80, height: 80, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6" component="div">
                      {stylist.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Face fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                      <Typography variant="body2" color="text.secondary">
                        {stylist.gender === 'male' ? 'Male' : stylist.gender === 'female' ? 'Female' : 'Other'}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color={stylist.available ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'medium' }}
                    >
                      {stylist.available ? 'Available' : 'Not Available'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  {stylist.bio && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {stylist.bio}
                    </Typography>
                  )}
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Specialties:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {stylist.specialties.map((specialty) => (
                      <Chip
                        key={specialty}
                        label={specialty}
                        size="small"
                        icon={getSpecialtyIcon(specialty)}
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  {(stylist.email || stylist.phone) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        Contact:
                      </Typography>
                      {stylist.email && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Email: {stylist.email}
                        </Typography>
                      )}
                      {stylist.phone && (
                        <Typography variant="body2">
                          Phone: {stylist.phone}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <IconButton onClick={() => handleEdit(stylist)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(stylist.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No stylists available. Add stylists to get started.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Stylist Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Edit Stylist' : 'Add New Stylist'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender || 'other'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                    label="Gender"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={SPECIALTIES}
                  value={formData.specialties}
                  onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Specialties"
                      placeholder="Select specialties"
                      helperText="Select the services this stylist can perform"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        icon={getSpecialtyIcon(option)}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                  helperText="A short description of the stylist's experience and expertise"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Profile Image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  fullWidth
                  helperText="Enter a URL for the stylist's profile image"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Available for appointments"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
} 