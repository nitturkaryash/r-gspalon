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
  Divider
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { useMembers } from '../hooks/useMembers';
import MemberCard from '../components/members/MemberCard';
import AddMemberForm from '../components/members/AddMemberForm';

export default function Members() {
  const { members, isLoading, createMember, topUpMember, deleteMember, formatCurrency } = useMembers();
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = (memberData: Parameters<typeof createMember>[0]) => {
    createMember(memberData);
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
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ fontSize: 28, mr: 1, color: 'primary.main' }} />
            <Typography variant="h1">Members</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingMember(true)}
          >
            Add Member
          </Button>
        </Box>

        {isAddingMember && (
          <AddMemberForm 
            onSubmit={handleAddMember} 
            onCancel={() => setIsAddingMember(false)} 
          />
        )}

        {members.length === 0 ? (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <GroupIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Members Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Start adding members to track their accounts and manage membership benefits.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsAddingMember(true)}
            >
              Add Your First Member
            </Button>
          </Paper>
        ) : (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Card elevation={1}>
                <CardHeader 
                  title="Membership Overview" 
                  sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Members
                      </Typography>
                      <Typography variant="h4">{members.length}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Balance
                      </Typography>
                      <Typography variant="h4">
                        {formatCurrency(members.reduce((sum, member) => sum + member.balance, 0))}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Average Balance
                      </Typography>
                      <Typography variant="h4">
                        {formatCurrency(
                          members.length > 0
                            ? members.reduce((sum, member) => sum + member.balance, 0) / members.length
                            : 0
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

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
          </Box>
        )}
      </Box>
    </Container>
  );
} 