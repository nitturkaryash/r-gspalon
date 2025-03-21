import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Member } from '../../types/member';

// Update StyledCard for better scaling and fit
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%', 
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

// Keep BalanceArea styling
const BalanceArea = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1.5),
  textAlign: 'left',
  borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
}));

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: string | number) => void;
  onViewDetails: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit, onDelete, onViewDetails }) => {
  const joinDate = new Date(member.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <StyledCard>
      <CardContent sx={{ pb: 1, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }} noWrap>
              {member.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Joined: {joinDate}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Mobile: {member.phone || 'N/A'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Email: {member.email || 'N/A'}
        </Typography>
      </CardContent>
      
      <Box sx={{ mt: 'auto', backgroundColor: 'background.paper' }}>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            color="primary"
            onClick={() => onViewDetails(member)}
          >
            Details
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="secondary"
            onClick={() => onEdit(member)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => onDelete(member.id)}
          >
            Delete
          </Button>
        </CardActions>
        
        <BalanceArea>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Balance: ₹{member.balance.toFixed(2)}
          </Typography>
        </BalanceArea>
      </Box>
    </StyledCard>
  );
};

export default MemberCard; 