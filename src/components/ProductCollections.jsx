import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Typography, Button, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Update styled component for the container
const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  boxSizing: 'border-box',
  overflow: 'visible'
}));

export default function ProductCollections() {
  const [collections, setCollections] = useState([]);

  const handleOpenAddDialog = () => {
    // Implementation of handleOpenAddDialog
  };

  return (
    <StyledContainer>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%',
        mb: 4
      }}>
        <Typography variant="h2" component="h1" color="primary" sx={{ fontSize: { xs: '2.5rem', md: '3rem' } }}>
          Products
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ borderRadius: '8px' }}
        >
          Add Collection
        </Button>
      </Box>

      {/* Product collections grid */}
      <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
        {collections.map((collection) => (
          <Grid item xs={12} sm={6} md={4} key={collection.id} sx={{ p: 2 }}>
            {/* Collection card content */}
          </Grid>
        ))}
      </Grid>

      {/* Add collection dialog */}
      {/* ... rest of the component */}
    </StyledContainer>
  );
} 