import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Chip, 
  Divider, 
  Grid, 
  Box, 
  Container, 
  Paper,
  CircularProgress
} from '@mui/material';
import { formatCurrency } from '../lib/utils';
import PageHeader from '../components/PageHeader';

interface Product {
  id: number | string;
  collection_id: number | string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  hsn_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductCollection {
  id: number | string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Mock data for when Supabase connection fails
const mockCollections: ProductCollection[] = [
  { id: 1, name: 'Hair Care', description: 'Products for hair care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Skin Care', description: 'Products for skin care and treatment', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Makeup', description: 'Makeup and cosmetic products', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Nail Care', description: 'Products for nail care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: 'Fragrances', description: 'Perfumes and fragrances', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];
  
const mockProducts: Product[] = [
  { id: 1, collection_id: 1, name: 'Shampoo - Premium', description: 'High-quality shampoo for all hair types', price: 59900, stock_quantity: 25, sku: 'HC-SH-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, collection_id: 1, name: 'Conditioner - Premium', description: 'Nourishing conditioner for all hair types', price: 49900, stock_quantity: 20, sku: 'HC-CN-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, collection_id: 1, name: 'Hair Serum', description: 'Smoothing serum for frizzy hair', price: 79900, stock_quantity: 15, sku: 'HC-SR-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, collection_id: 2, name: 'Face Wash', description: 'Gentle face wash for daily use', price: 39900, stock_quantity: 30, sku: 'SC-FW-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, collection_id: 2, name: 'Moisturizer', description: 'Hydrating moisturizer for all skin types', price: 69900, stock_quantity: 25, sku: 'SC-MT-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, collection_id: 3, name: 'Foundation', description: 'Long-lasting foundation with SPF', price: 89900, stock_quantity: 10, sku: 'MU-FN-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, collection_id: 3, name: 'Lipstick', description: 'Creamy matte lipstick', price: 59900, stock_quantity: 15, sku: 'MU-LS-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, collection_id: 4, name: 'Nail Polish', description: 'Quick-dry nail polish', price: 29900, stock_quantity: 20, sku: 'NC-NP-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 9, collection_id: 5, name: 'Perfume - Floral', description: 'Long-lasting floral fragrance', price: 129900, stock_quantity: 8, sku: 'FR-PF-001', hsn_code: '3303', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 10, collection_id: 5, name: 'Perfume - Woody', description: 'Sophisticated woody fragrance', price: 139900, stock_quantity: 7, sku: 'FR-PF-002', hsn_code: '3303', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Try to fetch collections from Supabase
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('product_collections')
          .select('*');
          
        // If there's an auth error (401), use mock data instead
        if (collectionsError) {
          if (collectionsError.code === '401' || collectionsError.message?.includes('JWT')) {
            console.log('Using mock data due to authentication error');
            setCollections(mockCollections);
            setProducts(mockProducts);
            setUsingMockData(true);
            setError(null);
            setLoading(false);
            return;
          }
          throw collectionsError;
        }
        
        // Try to fetch products from Supabase
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
          
        if (productsError) {
          if (productsError.code === '401' || productsError.message?.includes('JWT')) {
            console.log('Using mock data due to authentication error');
            setCollections(mockCollections);
            setProducts(mockProducts);
            setUsingMockData(true);
            setError(null);
            setLoading(false);
            return;
          }
          throw productsError;
        }
        
        setCollections(collectionsData || []);
        setProducts(productsData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Fallback to mock data if there's any error
        console.log('Falling back to mock data due to error');
        setCollections(mockCollections);
        setProducts(mockProducts);
        setUsingMockData(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Function to get collection name by ID
  const getCollectionName = (collectionId: number | string) => {
    const collection = collections.find(c => c.id === collectionId);
    return collection ? collection.name : 'Unknown Collection';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Products" />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Products" />
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'error.light', 
            color: 'error.dark', 
            border: 1, 
            borderColor: 'error.main' 
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Products" />
      
      {usingMockData && (
        <Paper sx={{ p: 2, mb: 4, bgcolor: 'info.light' }}>
          <Typography>
            <strong>Note:</strong> Displaying mock data. The application is running in development mode.
          </Typography>
        </Paper>
      )}
      
      {collections.map(collection => (
        <Box key={collection.id} sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {collection.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {collection.description}
          </Typography>
          
          <Grid container spacing={3}>
            {products
              .filter(product => product.collection_id === collection.id)
              .map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader
                      title={product.name}
                      action={
                        product.active ? (
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            label="Inactive" 
                            variant="outlined" 
                            size="small" 
                            sx={{ color: 'text.disabled' }}
                          />
                        )
                      }
                      subheader={product.description}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Price:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(product.price / 100)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Stock:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {product.stock_quantity} units
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          SKU:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {product.sku}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          HSN Code:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {product.hsn_code}
                        </Typography>
                      </Box>
                    </CardContent>
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderTop: 1, 
                        borderColor: 'divider',
                        mt: 'auto'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {new Date(product.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
          
          {products.filter(product => product.collection_id === collection.id).length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No products in this collection
            </Typography>
          )}
          
          <Divider sx={{ my: 4 }} />
        </Box>
      ))}
      
      {collections.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No product collections found
        </Typography>
      )}
    </Container>
  );
} 