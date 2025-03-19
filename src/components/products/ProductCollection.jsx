import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { supabase } from '../../utils/supabase/supabaseClient';
import ProductItem from './ProductItem';

const ProductCollection = ({ collection, onUpdate }) => {
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [collectionName, setCollectionName] = useState(collection.name);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: collection.name
  });

  useEffect(() => {
    fetchProducts();
  }, [collection.id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', collection.name)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!collectionName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('product_collections')
        .update({ name: collectionName.trim() })
        .eq('id', collection.id);

      if (error) throw error;
      
      setOpenEditDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      // First, delete all products in this collection
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('category', collection.name);

      if (productsError) throw productsError;

      // Then delete the collection
      const { error } = await supabase
        .from('product_collections')
        .delete()
        .eq('id', collection.id);

      if (error) throw error;
      
      setOpenDeleteDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price) || 0,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;
      
      setProducts([...products, ...data]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: collection.name
      });
      setOpenAddDialog(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {collection.name}
            </Typography>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        }
        action={
          <Box>
            <IconButton onClick={() => setOpenEditDialog(true)} size="small">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => setOpenDeleteDialog(true)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ ml: 1, backgroundColor: '#7b9a47', '&:hover': { backgroundColor: '#6a8639' } }}
            >
              Add Product
            </Button>
          </Box>
        }
      />
      
      {expanded && (
        <CardContent>
          {loading ? (
            <Typography variant="body2">Loading products...</Typography>
          ) : products.length === 0 ? (
            <Typography variant="body2">No products in this collection. Add your first product.</Typography>
          ) : (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <ProductItem 
                    product={product} 
                    onUpdate={fetchProducts} 
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      )}

      {/* Edit Collection Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            type="text"
            fullWidth
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateCollection} 
            variant="contained"
            sx={{ backgroundColor: '#7b9a47', '&:hover': { backgroundColor: '#6a8639' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Stock Quantity"
            type="number"
            fullWidth
            value={newProduct.stock_quantity}
            onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProduct} 
            variant="contained"
            sx={{ backgroundColor: '#7b9a47', '&:hover': { backgroundColor: '#6a8639' } }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Collection Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Collection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the collection "{collection.name}"? 
            This will delete all products in this collection. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteCollection} 
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProductCollection; 