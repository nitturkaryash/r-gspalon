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
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  InputAdornment,
  Alert
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  CreditCard as CreditCardIcon,
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material'
import { useClients, Client } from '../hooks/useClients'
import { formatCurrency } from '../utils/format'

export default function Clients() {
  const { clients, isLoading, createClient, updateClient, processPendingPayment } = useClients()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    notes: ''
  })
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  // Filter clients based on search query
  const filteredClients = clients?.filter(client => 
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
  
  // Handle add client
  const handleAddClient = async () => {
    await createClient(formData)
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      notes: ''
    })
    setOpenAddDialog(false)
  }
  
  // Handle edit client
  const handleEditClient = async () => {
    if (!selectedClient) return
    
    await updateClient({
      id: selectedClient.id,
      ...formData
    })
    
    setSelectedClient(null)
    setOpenEditDialog(false)
  }
  
  // Open edit dialog with client data
  const handleOpenEditDialog = (client: Client) => {
    setSelectedClient(client)
    setFormData({
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      notes: client.notes
    })
    setOpenEditDialog(true)
  }
  
  // Open payment dialog for BNPL
  const handleOpenPaymentDialog = (client: Client) => {
    setSelectedClient(client)
    setPaymentAmount(client.pending_payment)
    setOpenPaymentDialog(true)
  }
  
  // Process pending payment
  const handleProcessPayment = async () => {
    if (!selectedClient) return
    
    await processPendingPayment({
      clientId: selectedClient.id,
      amount: paymentAmount
    })
    
    setSelectedClient(null)
    setPaymentAmount(0)
    setOpenPaymentDialog(false)
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
        <Typography variant="h1">Clients</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenAddDialog(true)}
          sx={{ height: 'fit-content' }}
        >
          Add Client
        </Button>
      </Box>
      
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search clients by name, phone, or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />
      
      {/* Clients Table */}
      <Paper sx={{ p: 3 }}>
        {clients && clients.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Pending Payment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.full_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{client.phone}</Typography>
                      <Typography variant="body2" color="text.secondary">{client.email}</Typography>
                    </TableCell>
                    <TableCell>
                      {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Typography color="success.main" fontWeight="bold">
                        {formatCurrency(client.total_spent)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {client.pending_payment > 0 ? (
                        <Chip 
                          label={formatCurrency(client.pending_payment)} 
                          color="warning"
                          onClick={() => handleOpenPaymentDialog(client)}
                        />
                      ) : (
                        <Typography color="text.secondary">No pending amount</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Tooltip title="Edit Client">
                          <IconButton onClick={() => handleOpenEditDialog(client)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {client.pending_payment > 0 && (
                          <Tooltip title="Process Payment">
                            <IconButton 
                              color="primary"
                              onClick={() => handleOpenPaymentDialog(client)}
                            >
                              <CreditCardIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No clients in the database. Add a client to get started.
          </Typography>
        )}
      </Paper>
      
      {/* Add Client Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Full Name"
                value={formData.full_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddClient} 
            variant="contained"
            disabled={!formData.full_name}
          >
            Add Client
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Client Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Full Name"
                value={formData.full_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            {selectedClient && (
              <>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Total Spent</Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(selectedClient.total_spent)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Pending Payment</Typography>
                  <Typography variant="h6" color={selectedClient.pending_payment > 0 ? "warning.main" : "text.secondary"}>
                    {selectedClient.pending_payment > 0 
                      ? formatCurrency(selectedClient.pending_payment)
                      : "No pending amount"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Last Visit</Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                    {selectedClient.last_visit 
                      ? new Date(selectedClient.last_visit).toLocaleDateString()
                      : "Never visited"}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditClient} 
            variant="contained"
            disabled={!formData.full_name}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Process Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Pending Payment</DialogTitle>
        <DialogContent>
          {selectedClient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Processing payment for {selectedClient.full_name}
                </Alert>
                
                <Typography variant="subtitle1" gutterBottom>
                  Total Pending Amount: {formatCurrency(selectedClient.pending_payment)}
                </Typography>
                
                <TextField
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: selectedClient.pending_payment },
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  error={paymentAmount > selectedClient.pending_payment}
                  helperText={paymentAmount > selectedClient.pending_payment ? "Amount exceeds pending payment" : ""}
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleProcessPayment} 
            variant="contained"
            disabled={!selectedClient || paymentAmount <= 0 || paymentAmount > (selectedClient?.pending_payment || 0)}
            startIcon={<CreditCardIcon />}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 