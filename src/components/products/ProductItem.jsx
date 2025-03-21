import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../../utils/supabase/supabaseClient';

const ProductItem = ({ product, onUpdate }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price || '',
    stock_quantity: product.stock_quantity || ''
  });

  const handleUpdateProduct = async () => {
    try {
      const updatedData = {
        ...editedProduct,
        price: parseFloat(editedProduct.price) || 0,
        stock_quantity: parseInt(editedProduct.stock_quantity) || 0
      };

      const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', product.id);

      if (error) throw error;
      
      setOpenEditDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      
      setOpenDeleteDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover .actions': { opacity: 1 }
      }}>
        <Box 
          className="actions" 
          sx={{ 
            position: 'absolute', 
            top: 5, 
            right: 5, 
            opacity: 0, 
            transition: 'opacity 0.3s',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 1,
            padding: '2px'
          }}
        >
          <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setOpenDeleteDialog(true)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {product.description || 'No description'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              ₹{product.price}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            value={editedProduct.name}
            onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={editedProduct.description}
            onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={editedProduct.price}
            onChange={(e) => setEditedProduct({...editedProduct, price: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Stock Quantity"
            type="number"
            fullWidth
            value={editedProduct.stock_quantity}
            onChange={(e) => setEditedProduct({...editedProduct, stock_quantity: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateProduct} 
            variant="contained"
            sx={{ backgroundColor: '#7b9a47', '&:hover': { backgroundColor: '#6a8639' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "{product.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteProduct} 
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductItem; 