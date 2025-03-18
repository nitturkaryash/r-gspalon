import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { usePOS } from '../hooks/usePOS';
import { useNavigate, useLocation } from 'react-router-dom';

function ClientForm({ onSubmit, initialData = null, isUpdate = false }) {
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    email: '',
    ...initialData
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mobile_number: initialData.mobile_number || '',
        email: initialData.email || '',
        ...initialData
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="name"
            label="Client Name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="mobile_number"
            label="Mobile Number"
            value={formData.mobile_number || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="email"
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth variant="contained" color="primary" type="submit">
            {isUpdate ? 'Update Client' : 'Add Client'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default function POS() {
  const location = useLocation();
  const passedClient = location.state?.selectedClient;
  
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(passedClient || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const navigate = useNavigate();
  
  const { 
    clients, 
    isLoading, 
    error, 
    searchClients, 
    addClient, 
    updateClient 
  } = usePOS();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddClientClick = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleEditClientClick = () => {
    if (selectedClient) {
      setDialogOpen(true);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedClient) {
        await updateClient({
          ...selectedClient,
          name: formData.name,
          mobile_number: formData.mobile_number,
          email: formData.email
        });
        setSnackbarMessage("Client updated successfully");
      } else {
        await addClient(formData);
        setSnackbarMessage("Client added successfully");
      }
      setDialogOpen(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving client:", error);
      setSnackbarMessage("Error saving client: " + error.message);
      setSnackbarOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleBookAppointment = () => {
    if (selectedClient) {
      // Navigate to appointments page with client info in state
      navigate('/appointments', { state: { selectedClient } });
    }
  };

  const filteredClients = searchQuery 
    ? searchClients(searchQuery)
    : clients;

  if (isLoading && (!clients || clients.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Point of Sale
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Walk-In" />
          <Tab label="Appointments" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Customer & Stylist
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Client Selection
                </Typography>
                
                <Box sx={{ mb: 2, display: 'flex' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleAddClientClick}
                  >
                    New
                  </Button>
                </Box>
                
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : error ? (
                  <Alert severity="error">Error loading clients: {error.message}</Alert>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List>
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <ListItem 
                            key={client.id}
                            button
                            selected={selectedClient && selectedClient.id === client.id}
                            onClick={() => setSelectedClient(client)}
                            divider
                          >
                            <ListItemText 
                              primary={client.name}
                              secondary={client.mobile_number || 'No phone number'}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="No clients found" />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                )}
                
                {selectedClient && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleEditClientClick}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleBookAppointment}
                    >
                      Book Appointment
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Stylist Selection
                </Typography>
                
                {/* Stylist selection will be added here */}
                <Alert severity="info">
                  Stylist selection functionality will be implemented in the next phase.
                </Alert>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Appointments
          </Typography>
          
          {/* Appointments will be shown here */}
          <Alert severity="info">
            Appointment management in POS will be available in the next phase.
          </Alert>
        </Box>
      )}

      {/* Add/Edit Client Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <ClientForm 
            onSubmit={handleFormSubmit} 
            initialData={selectedClient}
            isUpdate={!!selectedClient}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
} 