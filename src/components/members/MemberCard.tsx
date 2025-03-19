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
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { Member } from '../../types/member';
import { format } from 'date-fns';
import { styled } from '@mui/material/styles';

interface MemberCardProps {
  member: Member;
  onTopUp: (memberId: string, amount: number) => void;
  onDelete: (memberId: string) => void;
  formatCurrency: (amount: number) => string;
}

// Styled components using the application theme
const MembershipCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.primary.contrastText,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
  },
  height: '100%',
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.2)',
  position: 'relative',
  zIndex: 1,
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  border: `2px solid ${theme.palette.secondary.light}`,
  color: theme.palette.secondary.contrastText,
  marginRight: theme.spacing(2),
  width: 50,
  height: 50,
}));

const MembershipCardContent = styled(CardContent)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  padding: theme.spacing(3),
}));

const SpotlightEffect = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: `radial-gradient(circle at 50% 50%, transparent 30%, ${theme.palette.primary.dark}90 100%)`,
  opacity: 0.6,
  pointerEvents: 'none',
  mixBlendMode: 'overlay',
}));

const ThemeButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
  color: theme.palette.secondary.contrastText,
  fontWeight: 'bold',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
  },
}));

export default function MemberCard({ member, onTopUp, onDelete, formatCurrency }: MemberCardProps) {
  const theme = useTheme();
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
    <MembershipCard>
      {/* Spotlight Effect Overlay */}
      <SpotlightEffect />
      
      <CardHeader>
        <MemberAvatar>
          <PersonIcon />
        </MemberAvatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
            {member.name}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
            Member since {memberSince}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          sx={{ color: theme.palette.secondary.light }}
          onClick={() => onDelete(member.id)}
          title="Delete member"
        >
          <DeleteIcon />
        </IconButton>
      </CardHeader>

      <MembershipCardContent>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: theme.palette.primary.contrastText, opacity: 0.85, mb: 1 }}>
            MEMBERSHIP BALANCE
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              textShadow: `0 0 10px ${theme.palette.primary.dark}80`,
              letterSpacing: '1px'
            }}
          >
            {formatCurrency(member.balance)}
          </Typography>
        </Box>

        {isExpanded && (
          <Box sx={{ 
            mb: 3, 
            p: 1.5, 
            bgcolor: 'rgba(0,0,0,0.1)',
            borderRadius: 1,
            backdropFilter: 'blur(5px)'
          }}>
            {member.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="body2">{member.email}</Typography>
              </Box>
            )}
            {member.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="body2">{member.phone}</Typography>
              </Box>
            )}
          </Box>
        )}

        {!isToppingUp ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ThemeButton 
              variant="contained" 
              fullWidth
              onClick={() => setIsToppingUp(true)}
              startIcon={<AttachMoneyIcon />}
              sx={{ py: 1 }}
            >
              Top Up
            </ThemeButton>
            <Button 
              variant="outlined"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ 
                borderColor: theme.palette.secondary.main, 
                color: theme.palette.secondary.light,
                '&:hover': {
                  borderColor: theme.palette.secondary.light,
                  color: theme.palette.secondary.main,
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
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
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(5px)',
                  color: theme.palette.primary.contrastText,
                  '& fieldset': {
                    borderColor: `${theme.palette.secondary.main}80`,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: `${theme.palette.primary.contrastText}CC`,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.secondary.light,
                },
              }}
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ThemeButton 
                variant="contained"
                onClick={handleTopUp}
                disabled={!amount}
                fullWidth
              >
                Confirm
              </ThemeButton>
              <Button 
                variant="outlined"
                onClick={() => setIsToppingUp(false)}
                fullWidth
                sx={{ 
                  borderColor: theme.palette.secondary.main, 
                  color: theme.palette.secondary.light,
                  '&:hover': {
                    borderColor: theme.palette.secondary.light,
                    color: theme.palette.secondary.contrastText,
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </MembershipCardContent>
    </MembershipCard>
  );
} 