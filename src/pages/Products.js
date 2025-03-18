import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader, Typography, Chip, Divider, Grid, Box, Container, Paper, CircularProgress } from '@mui/material';
import { formatCurrency } from '../lib/utils';
import PageHeader from '../components/PageHeader';
// Mock data for when Supabase connection fails
const mockCollections = [
    { id: 1, name: 'Hair Care', description: 'Products for hair care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Skin Care', description: 'Products for skin care and treatment', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, name: 'Makeup', description: 'Makeup and cosmetic products', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, name: 'Nail Care', description: 'Products for nail care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, name: 'Fragrances', description: 'Perfumes and fragrances', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];
const mockProducts = [
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
    const [products, setProducts] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            }
            catch (err) {
                console.error('Error fetching data:', err);
                // Fallback to mock data if there's any error
                console.log('Falling back to mock data due to error');
                setCollections(mockCollections);
                setProducts(mockProducts);
                setUsingMockData(true);
                setError(null);
            }
            finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    // Function to get collection name by ID
    const getCollectionName = (collectionId) => {
        const collection = collections.find(c => c.id === collectionId);
        return collection ? collection.name : 'Unknown Collection';
    };
    if (loading) {
        return (_jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [_jsx(PageHeader, { title: "Products" }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'center', mt: 4 }, children: _jsx(CircularProgress, {}) })] }));
    }
    if (error) {
        return (_jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [_jsx(PageHeader, { title: "Products" }), _jsx(Paper, { sx: {
                        p: 2,
                        bgcolor: 'error.light',
                        color: 'error.dark',
                        border: 1,
                        borderColor: 'error.main'
                    }, children: _jsx(Typography, { children: error }) })] }));
    }
    return (_jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [_jsx(PageHeader, { title: "Products" }), usingMockData && (_jsx(Paper, { sx: { p: 2, mb: 4, bgcolor: 'info.light' }, children: _jsxs(Typography, { children: [_jsx("strong", { children: "Note:" }), " Displaying mock data. The application is running in development mode."] }) })), collections.map(collection => (_jsxs(Box, { sx: { mb: 6 }, children: [_jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, children: collection.name }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 3 }, children: collection.description }), _jsx(Grid, { container: true, spacing: 3, children: products
                            .filter(product => product.collection_id === collection.id)
                            .map(product => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsx(CardHeader, { title: product.name, action: product.active ? (_jsx(Chip, { label: "Active", color: "success", size: "small" })) : (_jsx(Chip, { label: "Inactive", variant: "outlined", size: "small", sx: { color: 'text.disabled' } })), subheader: product.description }), _jsxs(CardContent, { sx: { flexGrow: 1 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Price:" }), _jsx(Typography, { variant: "body1", fontWeight: "medium", children: formatCurrency(product.price / 100) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 2 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Stock:" }), _jsxs(Typography, { variant: "body1", fontWeight: "medium", children: [product.stock_quantity, " units"] })] }), _jsx(Divider, { sx: { my: 2 } }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "SKU:" }), _jsx(Typography, { variant: "body1", fontWeight: "medium", children: product.sku })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "HSN Code:" }), _jsx(Typography, { variant: "body1", fontWeight: "medium", children: product.hsn_code })] })] }), _jsx(Box, { sx: {
                                            p: 2,
                                            borderTop: 1,
                                            borderColor: 'divider',
                                            mt: 'auto'
                                        }, children: _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Last updated: ", new Date(product.updated_at).toLocaleDateString()] }) })] }) }, product.id))) }), products.filter(product => product.collection_id === collection.id).length === 0 && (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontStyle: 'italic' }, children: "No products in this collection" })), _jsx(Divider, { sx: { my: 4 } })] }, collection.id))), collections.length === 0 && (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontStyle: 'italic' }, children: "No product collections found" }))] }));
}
