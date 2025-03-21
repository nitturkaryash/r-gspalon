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
  Stack,
  useTheme
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon, Close as CloseIcon } from '@mui/icons-material';
import { useMembers } from '../hooks/useMembers';
import MemberCard from '../components/members/MemberCard';
import AddMemberForm from '../components/members/AddMemberForm';
import { styled } from '@mui/material/styles';
import EmptyState from '../components/EmptyState';
import { Member } from '../types/member';

// Styled components for membership section using theme colors
const MembershipSection = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
}));

const GlowOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `radial-gradient(circle at 30% 30%, ${theme.palette.secondary.light}20, transparent 70%)`,
  pointerEvents: 'none',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.contrastText,
  textShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
}));

const StatsBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backdropFilter: 'blur(5px)',
  border: `1px solid ${theme.palette.primary.light}40`,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: '100%',
}));

const AddButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

export default function Members() {
  const theme = useTheme();
  const { members, isLoading, createMember, topUpMember, deleteMember, formatCurrency } = useMembers();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleAddMember = (memberData: Omit<Member, 'id' | 'joinDate'>) => {
    createMember(memberData);
    setIsAddingMember(false);
  };

  const handleDeleteMember = (memberId: string | number) => {
    deleteMember(memberId.toString());
  };

  // Add missing handler functions
  const handleEditMember = (member: Member) => {
    // This would typically open an edit dialog
    console.log('Editing member:', member);
    // Placeholder for edit functionality
  };

  const handleViewMemberDetails = (member: Member) => {
    // This would typically open a details view
    console.log('Viewing member details:', member);
    // Placeholder for view details functionality
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <MembershipSection>
        <GlowOverlay />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <SectionTitle variant="h4">Membership Management</SectionTitle>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your salon members and loyalty balances
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
            <ContentContainer>
              <Grid container spacing={2}>
                {members.map((member) => (
                  <Grid item xs={12} sm={6} md={4} lg={4} key={member.id}>
                    <MemberCard 
                      member={member} 
                      onEdit={handleEditMember}
                      onDelete={handleDeleteMember}
                      onViewDetails={handleViewMemberDetails}
                    />
                  </Grid>
                ))}
              </Grid>
            </ContentContainer>
          ) : (
            <EmptyState
              title="No Members Found"
              description="Add your first member to start tracking loyalty balances"
              buttonText="Add Member"
              buttonAction={() => setOpenDialog(true)}
              icon={<GroupIcon sx={{ fontSize: 60 }} />}
            />
          )}
        </Box>
      </MembershipSection>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: theme.palette.primary.main,
          fontWeight: 'bold',
        }}>
          Add New Member
          <IconButton 
            edge="end" 
            onClick={() => setOpenDialog(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AddMemberForm onAddMember={handleAddMember} />
        </DialogContent>
      </Dialog>
    </Box>
  );
} 