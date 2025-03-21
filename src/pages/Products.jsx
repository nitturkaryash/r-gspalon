import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../utils/supabase/supabaseClient';
import ProductCollection from '../components/products/ProductCollection';

const Products = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_collections')
        .select('*')
        .order('name');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching product collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('product_collections')
        .insert([{ name: newCollectionName.trim() }])
        .select();

      if (error) throw error;
      
      setCollections([...collections, ...data]);
      setNewCollectionName('');
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating product collection:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" color="primary">
          Product Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ backgroundColor: '#7b9a47', '&:hover': { backgroundColor: '#6a8639' } }}
        >
          New Collection
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : collections.length === 0 ? (
        <Card sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa' }}>
          <CardContent>
            No collections found.
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {collections.map((collection) => (
            <Grid item xs={12} md={6} key={collection.id}>
              <ProductCollection collection={collection} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Products; 