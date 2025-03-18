import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Chip, CircularProgress, Breadcrumbs, Stack } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useCollections } from '../hooks/useCollections';
import { useProducts } from '../hooks/useProducts';
import { calculateProfit, calculateProfitMargin } from '../models/inventoryTypes';
import { formatCurrency, formatPercentage } from '../utils/format';
// Initial form data for products
const initialFormData = {
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    status: 'active',
};
export default function CollectionDetail() {
    const { id } = useParams();
    const collectionId = id || '';
    const navigate = useNavigate();
    const { getCollection, isLoading: loadingCollection } = useCollections();
    const { products, isLoading: loadingProducts, createProduct, updateProduct, deleteProduct } = useProducts(collectionId);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const [profit, setProfit] = useState(0);
    const [profitMargin, setProfitMargin] = useState(0);
    const collection = getCollection(collectionId);
    useEffect(() => {
        // Redirect if collection doesn't exist
        if (!loadingCollection && !collection) {
            navigate('/inventory');
        }
    }, [collection, loadingCollection, navigate]);
    useEffect(() => {
        // Calculate profit and margin when price or cost changes
        const calculatedProfit = calculateProfit(formData.price, formData.cost);
        setProfit(calculatedProfit);
        const calculatedMargin = calculateProfitMargin(formData.price, formData.cost);
        setProfitMargin(calculatedMargin);
    }, [formData.price, formData.cost]);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            status: product.status,
        });
        setEditingId(product.id);
        setOpen(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate form
        if (!formData.name.trim() || formData.price <= 0 || formData.cost < 0) {
            return;
        }
        if (editingId) {
            updateProduct({
                ...formData,
                id: editingId
            });
        }
        else {
            createProduct({
                ...formData,
                collection_id: collectionId
            });
        }
        handleClose();
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };
    if (loadingCollection || loadingProducts) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    if (!collection) {
        return (_jsxs(Paper, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "body1", color: "text.secondary", children: "Collection not found." }), _jsx(Button, { component: Link, to: "/inventory", startIcon: _jsx(ArrowBackIcon, {}), sx: { mt: 2 }, children: "Back to Collections" })] }));
    }
    return (_jsxs(Box, { children: [_jsx(Box, { sx: { mb: 3 }, children: _jsxs(Breadcrumbs, { "aria-label": "breadcrumb", children: [_jsx(Link, { to: "/inventory", style: { textDecoration: 'none', color: 'inherit' }, children: "Inventory" }), _jsx(Typography, { color: "text.primary", children: collection.name })] }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h1", children: collection.name }), _jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: collection.description })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleOpen, sx: { height: 'fit-content' }, children: "Add Product" })] }), products?.length ? (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Name" }), _jsx(TableCell, { align: "right", children: "Price (\u20B9)" }), _jsx(TableCell, { align: "right", children: "Cost (\u20B9)" }), _jsx(TableCell, { align: "right", children: "Profit (\u20B9)" }), _jsx(TableCell, { align: "right", children: "Margin (%)" }), _jsx(TableCell, { align: "right", children: "Stock" }), _jsx(TableCell, { children: "Status" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: products.map((product) => {
                                const productProfit = calculateProfit(product.price, product.cost);
                                const productMargin = calculateProfitMargin(product.price, product.cost);
                                return (_jsxs(TableRow, { sx: {
                                        opacity: product.status === 'inactive' ? 0.6 : 1,
                                    }, children: [_jsx(TableCell, { children: product.name }), _jsx(TableCell, { align: "right", children: formatCurrency(product.price) }), _jsx(TableCell, { align: "right", children: formatCurrency(product.cost) }), _jsx(TableCell, { align: "right", children: formatCurrency(productProfit) }), _jsx(TableCell, { align: "right", children: formatPercentage(productMargin) }), _jsxs(TableCell, { align: "right", children: [product.stock, " units"] }), _jsx(TableCell, { children: _jsx(Chip, { label: product.status.charAt(0).toUpperCase() + product.status.slice(1), color: product.status === 'active' ? 'success' : 'default', size: "small" }) }), _jsxs(TableCell, { align: "right", children: [_jsx(IconButton, { onClick: () => handleEdit(product), color: "primary", size: "small", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDelete(product.id), color: "error", size: "small", children: _jsx(DeleteIcon, {}) })] })] }, product.id));
                            }) })] }) })) : (_jsx(Paper, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No products found in this collection. Click \"Add Product\" to create your first one." }) })), _jsx(Dialog, { open: open, onClose: handleClose, fullWidth: true, maxWidth: "sm", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogTitle, { children: editingId ? 'Edit Product' : 'Add New Product' }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(TextField, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, fullWidth: true }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsx(TextField, { label: "Price (\u20B9)", type: "number", value: formData.price, onChange: (e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 }), required: true, fullWidth: true, inputProps: { min: 0, step: 0.01 }, error: formData.price <= 0, helperText: formData.price <= 0 ? "Price must be greater than 0" : "" }), _jsx(TextField, { label: "Cost (\u20B9)", type: "number", value: formData.cost, onChange: (e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 }), required: true, fullWidth: true, inputProps: { min: 0, step: 0.01 }, error: formData.cost < 0, helperText: formData.cost < 0 ? "Cost cannot be negative" : "" }), _jsx(TextField, { label: "Stock (Units)", type: "number", value: formData.stock, onChange: (e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 }), required: true, fullWidth: true, inputProps: { min: 0, step: 1 }, error: formData.stock < 0, helperText: formData.stock < 0 ? "Stock cannot be negative" : "" })] }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsx(TextField, { label: "Profit (\u20B9)", value: formatCurrency(profit), InputProps: { readOnly: true }, fullWidth: true, sx: {
                                                    '& .MuiInputBase-input': {
                                                        color: profit >= 0 ? 'success.main' : 'error.main',
                                                        fontWeight: 'bold',
                                                    },
                                                } }), _jsx(TextField, { label: "Margin (%)", value: formatPercentage(profitMargin), InputProps: { readOnly: true }, fullWidth: true, sx: {
                                                    '& .MuiInputBase-input': {
                                                        color: profitMargin >= 20 ? 'success.main' : profitMargin >= 0 ? 'warning.main' : 'error.main',
                                                        fontWeight: 'bold',
                                                    },
                                                } })] }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), label: "Status", children: [_jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] }), _jsx(FormHelperText, { children: "Inactive products won't appear in POS and ordering systems" })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: !formData.name.trim() || formData.price <= 0 || formData.cost < 0, children: editingId ? 'Update' : 'Create' })] })] }) })] }));
}
