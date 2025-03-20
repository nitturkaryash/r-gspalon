import React from 'react';
import { Checkbox, Typography, FormControlLabel, TextField, Alert, Grid } from '@mui/material';

// This is a reusable component that can be included in POS.tsx
export default function SalonPurchase({ 
  isSalonPurchase, 
  setIsSalonPurchase, 
  salonPurchaseNote, 
  setSalonPurchaseNote 
}) {
  return (
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            checked={isSalonPurchase}
            onChange={(e) => setIsSalonPurchase(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography sx={{ fontWeight: 500 }}>
            Salon Purchase (for salon use only)
          </Typography>
        }
        sx={{ mt: 2, mb: 1 }}
      />
      
      {isSalonPurchase && (
        <TextField
          fullWidth
          label="Purchase Reason/Note"
          variant="outlined"
          value={salonPurchaseNote}
          onChange={(e) => setSalonPurchaseNote(e.target.value)}
          placeholder="Enter reason for purchase (e.g. 'Stock replenishment', 'New product testing')"
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
      )}
      
      {isSalonPurchase && (
        <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
          This purchase is for salon use only. Products will be tracked in inventory management and will not be billed to any customer.
        </Alert>
      )}
    </Grid>
  );
} 