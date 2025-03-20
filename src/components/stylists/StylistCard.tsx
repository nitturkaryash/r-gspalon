import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Divider, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Stylist } from '../../types/Stylist';
import { Edit, Delete, Phone, Email } from '@mui/icons-material';

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

const StatusChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
}));

interface StylistCardProps {
  stylist: Stylist;
  onEdit: (stylist: Stylist) => void;
  onDelete: (id: number) => void;
  onViewDetails: (stylist: Stylist) => void;
}

const StylistCard: React.FC<StylistCardProps> = ({ stylist, onEdit, onDelete, onViewDetails }) => {
  const joinDate = stylist.joinDate ? new Date(stylist.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'N/A';

  return (
    <StyledCard>
      <CardContent sx={{ pb: 1, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }} noWrap>
              {stylist.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Joined: {joinDate}
            </Typography>
          </Box>
          <StatusChip 
            label={stylist.status === 'active' ? 'Active' : 'Inactive'} 
            color={stylist.status === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Mobile: {stylist.phone || 'N/A'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Email: {stylist.email || 'N/A'}
        </Typography>
      </CardContent>
      
      <Box sx={{ mt: 'auto', backgroundColor: 'background.paper' }}>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            color="primary"
            onClick={() => onViewDetails(stylist)}
          >
            Details
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="secondary"
            onClick={() => onEdit(stylist)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => onDelete(stylist.id)}
          >
            Delete
          </Button>
        </CardActions>
      </Box>
    </StyledCard>
  );
};

export default StylistCard; 