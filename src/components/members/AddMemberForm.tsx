import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Divider,
  FormHelperText
} from '@mui/material';
import { useClients } from '../../hooks/useClients';
import { Member } from '../../hooks/useMembers';

interface AddMemberFormProps {
  onSubmit: (newMember: Omit<Member, 'id' | 'joinDate'>) => void;
  onCancel: () => void;
}

type FormMode = 'existing' | 'new';

export default function AddMemberForm({ onSubmit, onCancel }: AddMemberFormProps) {
  const { clients, isLoading } = useClients();
  const [mode, setMode] = useState<FormMode>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const [formErrors, setFormErrors] = useState({
    name: '',
    initialBalance: ''
  });

  // Reset form when mode changes
  useEffect(() => {
    setSelectedClientId('');
    setNewMemberData({
      name: '',
      email: '',
      phone: '',
    });
    setInitialBalance('0');
    setFormErrors({
      name: '',
      initialBalance: ''
    });
  }, [mode]);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: '',
      initialBalance: ''
    };

    // Validate based on mode
    if (mode === 'existing' && !selectedClientId) {
      errors.name = 'Please select a client';
      isValid = false;
    } else if (mode === 'new' && !newMemberData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    // Validate initial balance
    if (initialBalance) {
      const balance = Number(initialBalance);
      if (isNaN(balance) || balance < 0) {
        errors.initialBalance = 'Please enter a valid amount';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let memberData: Omit<Member, 'id' | 'joinDate'>;

    if (mode === 'existing') {
      const selectedClient = clients?.find(client => client.id === selectedClientId);
      if (!selectedClient) return;

      memberData = {
        name: selectedClient.full_name,
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        balance: parseInt(initialBalance) || 0
      };
    } else {
      memberData = {
        ...newMemberData,
        balance: parseInt(initialBalance) || 0
      };
    }

    onSubmit(memberData);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        bgcolor: 'background.paper' 
      }}
    >
      <Typography variant="h6" gutterBottom>
        Add New Member
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="member-mode-label">Membership Type</InputLabel>
            <Select
              labelId="member-mode-label"
              value={mode}
              onChange={(e) => setMode(e.target.value as FormMode)}
              label="Membership Type"
            >
              <MenuItem value="existing">From Existing Client</MenuItem>
              <MenuItem value="new">New Member</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {mode === 'existing' ? (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth error={!!formErrors.name}>
              <InputLabel id="client-select-label">Select Client</InputLabel>
              <Select
                labelId="client-select-label"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value as string)}
                label="Select Client"
                disabled={isLoading || !clients?.length}
              >
                {clients?.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.full_name} {client.phone ? `(${client.phone})` : ''}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.name && <FormHelperText>{formErrors.name}</FormHelperText>}
            </FormControl>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newMemberData.name}
              onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newMemberData.email}
              onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone"
              value={newMemberData.phone}
              onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
            />
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Initial Balance"
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
            }}
            error={!!formErrors.initialBalance}
            helperText={formErrors.initialBalance || 'Optional: Set an initial balance amount'}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Add Member
          </Button>
        </Box>
      </form>
    </Paper>
  );
} 