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
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCut,
  Palette,
  Spa,
  Face,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material'
import { useStylists, Stylist, StylistBreak } from '../hooks/useStylists'
import { useServices } from '../hooks/useServices'
import { toast } from 'react-toastify'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

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
  
  // Break scheduling state
  const [breakDialogOpen, setBreakDialogOpen] = useState(false)
  const [breakDate, setBreakDate] = useState<Date | null>(new Date())
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(new Date())
  const [breakEndTime, setBreakEndTime] = useState<Date | null>(
    new Date(new Date().setHours(new Date().getHours() + 1))
  )
  const [breakReason, setBreakReason] = useState('')

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

  // Add functions to handle break scheduling
  const handleOpenBreakDialog = () => {
    setBreakDialogOpen(true)
  }

  const handleCloseBreakDialog = () => {
    setBreakDialogOpen(false)
    // Reset break form data
    setBreakDate(new Date())
    setBreakStartTime(new Date())
    setBreakEndTime(new Date(new Date().setHours(new Date().getHours() + 1)))
    setBreakReason('')
  }

  const handleAddBreak = () => {
    if (!breakDate || !breakStartTime || !breakEndTime) {
      toast.error('Please select date and time for the break');
      return;
    }

    // Create a new Date object for the break date to ensure we're not modifying the original
    const breakDateClone = new Date(
      breakDate.getFullYear(),
      breakDate.getMonth(),
      breakDate.getDate()
    );

    // Create start date by properly cloning the date first
    const startDateTime = new Date(breakDateClone);
    startDateTime.setHours(
      breakStartTime.getHours(),
      breakStartTime.getMinutes(),
      0,
      0
    );

    // Create end date by properly cloning the date first
    const endDateTime = new Date(breakDateClone);
    endDateTime.setHours(
      breakEndTime.getHours(),
      breakEndTime.getMinutes(),
      0,
      0
    );

    // Create new break
    const newBreak: StylistBreak = {
      id: uuidv4(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      reason: breakReason
    };

    // Update form data with the new break
    setFormData({
      ...formData,
      breaks: [...(formData.breaks || []), newBreak]
    });

    handleCloseBreakDialog();
    toast.success('Break scheduled');
  };

  const handleDeleteBreak = (breakId: string) => {
    setFormData({
      ...formData,
      breaks: (formData.breaks || []).filter(b => b.id !== breakId)
    })
    toast.success('Break removed')
  }

  // Format date and time for display
  const formatBreakTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
              
              {/* Scheduled Breaks Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Scheduled Breaks</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenBreakDialog}
                    size="small"
                  >
                    Add Break
                  </Button>
                </Box>
                
                {formData.breaks && formData.breaks.length > 0 ? (
                  <List>
                    {formData.breaks.map((breakItem) => (
                      <ListItem 
                        key={breakItem.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            onClick={() => handleDeleteBreak(breakItem.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {formatBreakTime(breakItem.startTime)} - {formatBreakTime(breakItem.endTime)}
                              </Typography>
                            </Box>
                          }
                          secondary={breakItem.reason || 'No reason provided'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No breaks scheduled. Add breaks when the stylist will be unavailable.
                  </Typography>
                )}
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
      
      {/* Add Break Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={breakDialogOpen} onClose={handleCloseBreakDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Break</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="Break Date"
                  value={breakDate}
                  onChange={(newDate) => setBreakDate(newDate)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="Start Time"
                  value={breakStartTime}
                  onChange={(newTime) => setBreakStartTime(newTime)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="End Time"
                  value={breakEndTime}
                  onChange={(newTime) => setBreakEndTime(newTime)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reason (Optional)"
                  value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Lunch, Meeting, etc."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBreakDialog}>Cancel</Button>
            <Button onClick={handleAddBreak} variant="contained" color="primary">
              Add Break
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  )
} 