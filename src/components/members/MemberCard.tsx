import { useState } from 'react';
import { 
  Card, 
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Box,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { Member } from '../../hooks/useMembers';
import { format } from 'date-fns';

interface MemberCardProps {
  member: Member;
  onTopUp: (memberId: string, amount: number) => void;
  onDelete: (memberId: string) => void;
  formatCurrency: (amount: number) => string;
}

export default function MemberCard({ member, onTopUp, onDelete, formatCurrency }: MemberCardProps) {
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [amount, setAmount] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTopUp = () => {
    const topUpAmount = parseInt(amount, 10);
    if (isNaN(topUpAmount) || topUpAmount < 1000) {
      alert('Please enter a valid amount (minimum ₹1,000)');
      return;
    }

    onTopUp(member.id, topUpAmount);
    setIsToppingUp(false);
    setAmount('');
  };

  const joinDate = new Date(member.joinDate);
  const memberSince = format(joinDate, 'MMMM d, yyyy');

  return (
    <Card
      elevation={3}
      sx={{
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            {member.name}
          </Typography>
          <Typography variant="caption">
            Member since {memberSince}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          sx={{ color: 'primary.contrastText' }}
          onClick={() => onDelete(member.id)}
          title="Delete member"
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Balance
          </Typography>
          <Typography 
            variant="h5" 
            color="primary.main" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 'bold' 
            }}
          >
            <AccountBalanceIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            {formatCurrency(member.balance)}
          </Typography>
        </Box>

        {isExpanded && (
          <Box sx={{ mb: 2 }}>
            {member.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{member.email}</Typography>
              </Box>
            )}
            {member.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{member.phone}</Typography>
              </Box>
            )}
          </Box>
        )}

        {!isToppingUp ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => setIsToppingUp(true)}
            >
              Top Up
            </Button>
            <Button 
              variant="outlined"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              inputProps={{ min: 1000 }}
              sx={{ mb: 2 }}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained"
                color="primary"
                onClick={handleTopUp}
                disabled={!amount}
                fullWidth
              >
                Confirm
              </Button>
              <Button 
                variant="outlined"
                onClick={() => setIsToppingUp(false)}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 