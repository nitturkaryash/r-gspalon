import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, Chip, CircularProgress, Breadcrumbs, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Inventory as InventoryIcon, } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useProductCollections } from '../hooks/useProductCollections';
import { useCollectionProducts } from '../hooks/useCollectionProducts';
import { formatCurrency } from '../utils/format';
// Initial form data for products
const initialFormData = {
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    sku: '',
    hsn_code: '',
    active: true,
};
export default function ProductCollectionDetail() {
    const { id } = useParams();
    const collectionId = id || '';
    const navigate = useNavigate();
    const { getProductCollection, isLoading: loadingCollection, error: collectionError } = useProductCollections();
    const { products, isLoading: loadingProducts, error: productsError, createProduct, updateProduct, deleteProduct } = useCollectionProducts(collectionId);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const collection = getProductCollection(collectionId);
    useEffect(() => {
        // Redirect if collection doesn't exist
        if (!loadingCollection && !collection) {
            navigate('/products');
        }
    }, [collection, loadingCollection, navigate]);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock_quantity: product.stock_quantity,
            sku: product.sku,
            hsn_code: product.hsn_code || '',
            active: product.active,
        });
        setEditingId(product.id);
        setOpen(true);
    };
    // Handler for price changes with validation
    const handlePriceChange = (e) => {
        const value = e.target.value;
        // If empty string, set price to 0
        if (value === '') {
            setFormData({ ...formData, price: 0 });
            return;
        }
        // Try to parse as float and convert to integer (store price in paisa)
        const parsedValue = parseFloat(value);
        // If valid number, update state (convert to paisa - multiply by 100)
        if (!isNaN(parsedValue)) {
            setFormData({ ...formData, price: Math.round(parsedValue * 100) });
        }
        // If invalid, don't update (keep previous value)
    };
    // Handler for stock quantity changes with validation
    const handleStockQuantityChange = (e) => {
        const value = e.target.value;
        // If empty string, set stock_quantity to 0
        if (value === '') {
            setFormData({ ...formData, stock_quantity: 0 });
            return;
        }
        // Try to parse as integer
        const parsedValue = parseInt(value, 10);
        // If valid number, update state
        if (!isNaN(parsedValue)) {
            setFormData({ ...formData, stock_quantity: parsedValue });
        }
        // If invalid, don't update (keep previous value)
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate form
        if (!formData.name.trim() || formData.price < 0 || !formData.sku.trim()) {
            return;
        }
        try {
            if (editingId) {
                updateProduct({
                    ...formData,
                    id: editingId,
                    collection_id: collectionId
                });
            }
            else {
                createProduct({
                    ...formData,
                    collection_id: collectionId
                });
            }
            handleClose();
        }
        catch (error) {
            console.error('Error submitting form:', error);
        }
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };
    if (loadingCollection || loadingProducts) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    // Check for authentication errors
    const error = collectionError || productsError;
    if (error instanceof Error &&
        (error.message.includes('authentication') ||
            error.message.includes('session') ||
            error.message.includes('log in'))) {
        return (_jsx(Box, { children: _jsxs(Paper, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h6", color: "error", gutterBottom: true, children: "Authentication Error" }), _jsx(Typography, { variant: "body1", paragraph: true, children: error.message }), _jsx(Button, { variant: "contained", color: "primary", onClick: () => navigate('/login'), children: "Go to Login" })] }) }));
    }
    if (!collection) {
        return (_jsxs(Paper, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "body1", color: "text.secondary", children: "Collection not found." }), _jsx(Button, { component: Link, to: "/products", startIcon: _jsx(ArrowBackIcon, {}), sx: { mt: 2 }, children: "Back to Collections" })] }));
    }
    return (_jsxs(Box, { children: [_jsx(Box, { sx: { mb: 3 }, children: _jsxs(Breadcrumbs, { "aria-label": "breadcrumb", children: [_jsx(Link, { to: "/products", style: { textDecoration: 'none', color: 'inherit' }, children: "Products" }), _jsx(Typography, { color: "text.primary", children: collection.name })] }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h1", children: collection.name }), _jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: collection.description })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleOpen, sx: { height: 'fit-content' }, children: "Add Product" })] }), products?.length ? (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Name" }), _jsx(TableCell, { children: "Description" }), _jsx(TableCell, { children: "SKU" }), _jsx(TableCell, { align: "right", children: "Stock" }), _jsx(TableCell, { align: "right", children: "Price" }), _jsx(TableCell, { children: "Status" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: products.map((product) => (_jsxs(TableRow, { sx: {
                                    opacity: product.active ? 1 : 0.6,
                                }, children: [_jsx(TableCell, { children: product.name }), _jsx(TableCell, { children: product.description }), _jsx(TableCell, { children: product.sku }), _jsx(TableCell, { align: "right", children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, children: [_jsx(InventoryIcon, { fontSize: "small", sx: { mr: 0.5, opacity: 0.6 } }), product.stock_quantity] }) }), _jsx(TableCell, { align: "right", children: formatCurrency(product.price) }), _jsx(TableCell, { children: _jsx(Chip, { label: product.active ? 'Active' : 'Inactive', color: product.active ? 'success' : 'default', size: "small" }) }), _jsxs(TableCell, { align: "right", children: [_jsx(IconButton, { onClick: () => handleEdit(product), color: "primary", size: "small", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDelete(product.id), color: "error", size: "small", children: _jsx(DeleteIcon, {}) })] })] }, product.id))) })] }) })) : (_jsx(Paper, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No products found in this collection. Click \"Add Product\" to create your first one." }) })), _jsx(Dialog, { open: open, onClose: handleClose, fullWidth: true, maxWidth: "sm", "aria-labelledby": "product-dialog-title", disableEnforceFocus: false, keepMounted: false, disablePortal: false, disableRestoreFocus: false, disableAutoFocus: false, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogTitle, { id: "product-dialog-title", children: editingId ? 'Edit Product' : 'Add New Product' }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(TextField, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, fullWidth: true }), _jsx(TextField, { label: "Description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), multiline: true, rows: 2, fullWidth: true }), _jsx(TextField, { label: "SKU", value: formData.sku, onChange: (e) => setFormData({ ...formData, sku: e.target.value }), required: true, fullWidth: true }), _jsx(TextField, { label: "HSN Code (optional)", value: formData.hsn_code, onChange: (e) => setFormData({ ...formData, hsn_code: e.target.value }), fullWidth: true }), _jsx(TextField, { label: "Price (\u20B9)", type: "number", value: formData.price / 100, onChange: handlePriceChange, required: true, fullWidth: true, inputProps: { min: 0, step: 0.01 } }), _jsx(TextField, { label: "Stock Quantity", type: "number", value: formData.stock_quantity, onChange: handleStockQuantityChange, required: true, fullWidth: true, inputProps: { min: 0, step: 1 } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: formData.active, onChange: (e) => setFormData({ ...formData, active: e.target.checked }), color: "primary" }), label: "Active" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", children: editingId ? 'Update' : 'Create' })] })] }) })] }));
}
