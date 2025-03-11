import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Paper,
  Container,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon, Close as CloseIcon } from '@mui/icons-material';
import { useMembers } from '../hooks/useMembers';
import MemberCard from '../components/members/MemberCard';
import AddMemberForm from '../components/members/AddMemberForm';
import { styled } from '@mui/material/styles';
import EmptyState from '../components/EmptyState';

// Styled components for premium membership section
const PremiumSection = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(to bottom, #111111, #000000)',
  color: theme.palette.common.white,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  overflow: 'hidden',
}));

const GlowOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.15), transparent 70%)',
  pointerEvents: 'none',
}));

const PremiumTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
  color: '#FFD700',
  textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
}));

const StatsBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
}));

const BlackContainer = styled(Box)(({ theme }) => ({
  background: '#121212',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const AddButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #B8860B, #FFD700)',
  color: theme.palette.common.black,
  fontWeight: 'bold',
  '&:hover': {
    background: 'linear-gradient(45deg, #DAA520, #FFF8DC)',
  },
}));

export default function Members() {
  const { members, isLoading, createMember, topUpMember, deleteMember, formatCurrency } = useMembers();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleAddMember = (memberData: Omit<Member, 'id' | 'joinDate' | 'balance'>) => {
    createMember({ ...memberData, balance: 0 });
    setIsAddingMember(false);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      deleteMember(memberId);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PremiumSection>
        <GlowOverlay />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <PremiumTitle variant="h4">Membership Management</PremiumTitle>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                Manage your premium salon members and loyalty balances
              </Typography>
            </Box>
            <AddButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              size="large"
            >
              Add Member
            </AddButton>
          </Box>

          {members.length > 0 ? (
            <BlackContainer>
              <Grid container spacing={3}>
                {members.map((member) => (
                  <Grid item xs={12} sm={6} md={4} key={member.id}>
                    <MemberCard 
                      member={member} 
                      onTopUp={topUpMember}
                      onDelete={handleDeleteMember}
                      formatCurrency={formatCurrency}
                    />
                  </Grid>
                ))}
              </Grid>
            </BlackContainer>
          ) : (
            <EmptyState
              title="No Members Found"
              description="Add your first premium member to start tracking loyalty balances"
              buttonText="Add Member"
              buttonAction={() => setOpenDialog(true)}
              icon={<AddIcon sx={{ fontSize: 60 }} />}
            />
          )}
        </Box>
      </PremiumSection>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #1a1a1a, #000000)',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#FFD700',
          fontWeight: 'bold',
        }}>
          Add New Member
          <IconButton 
            edge="end" 
            onClick={() => setOpenDialog(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AddMemberForm onAddMember={handleAddMember} />
        </DialogContent>
      </Dialog>
    </Container>
  );
} 