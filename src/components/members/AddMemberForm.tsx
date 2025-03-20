import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Member } from '../../types/member';

interface AddMemberFormProps {
  onAddMember: (newMember: Omit<Member, 'id' | 'joinDate'>) => void;
}

// Styled components for themed form
const ThemedTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    color: theme.palette.text.primary,
    transition: 'all 0.3s',
    '& fieldset': {
      borderColor: `${theme.palette.primary.main}50`,
    },
    '&:hover fieldset': {
      borderColor: `${theme.palette.primary.main}80`,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  padding: theme.spacing(1.2, 2),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2), 0 0 10px ${theme.palette.primary.main}40`,
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderColor: `${theme.palette.primary.main}50`,
  color: theme.palette.primary.main,
  padding: theme.spacing(1.2, 2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}10`,
  },
}));

export default function AddMemberForm({ onAddMember }: AddMemberFormProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    balance: 0,
    membershipType: 'regular' as 'regular' | 'premium',
    status: 'active' as const,
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    phone: false,
  });

  const validateForm = () => {
    const newErrors = {
      name: formData.name.trim() === '',
      email: formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      phone: formData.phone.trim() !== '' && !/^[0-9]{10}$/.test(formData.phone.trim()),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const memberData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      balance: parseFloat(formData.balance.toString()) || 0,
      membershipType: formData.membershipType as "regular" | "premium",
      status: 'active' as const,
    };
    
    onAddMember(memberData);
    
    // Reset form
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      balance: 0,
      membershipType: 'regular',
      status: 'active'
    });
    setErrors({ name: false, email: false, phone: false });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography 
        variant="body2" 
        sx={{ mb: 2, color: theme.palette.text.secondary, fontStyle: 'italic' }}
      >
        All new members start with a ₹0 balance. They can top up their accounts after registration.
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ThemedTextField
            required
            fullWidth
            id="name"
            name="name"
            label="Member Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            helperText={errors.name ? 'Name is required' : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <ThemedTextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            helperText={errors.email ? 'Please enter a valid email address' : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <ThemedTextField
            fullWidth
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            helperText={errors.phone ? 'Please enter a 10-digit phone number' : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <CancelButton
          variant="outlined"
          onClick={() => {
            setFormData({ 
              name: '', 
              email: '', 
              phone: '', 
              balance: 0,
              membershipType: 'regular',
              status: 'active'
            });
            setErrors({ name: false, email: false, phone: false });
          }}
        >
          Clear
        </CancelButton>
        <SubmitButton
          type="submit"
          variant="contained"
        >
          Add Member
        </SubmitButton>
      </Box>
    </Box>
  );
} 