import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, Chip, CircularProgress, Breadcrumbs, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, AccessTime as AccessTimeIcon, } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useServiceCollections } from '../hooks/useServiceCollections';
import { useCollectionServices } from '../hooks/useCollectionServices';
import { formatCurrency } from '../utils/format';
// Initial form data for services
const initialFormData = {
    name: '',
    description: '',
    price: 0,
    duration: 30,
    active: true,
};
export default function ServiceCollectionDetail() {
    const { id } = useParams();
    const collectionId = id || '';
    const navigate = useNavigate();
    const { getServiceCollection, isLoading: loadingCollection } = useServiceCollections();
    const { services, isLoading: loadingServices, createService, updateService, deleteService } = useCollectionServices(collectionId);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const collection = getServiceCollection(collectionId);
    useEffect(() => {
        // Redirect if collection doesn't exist
        if (!loadingCollection && !collection) {
            navigate('/services');
        }
    }, [collection, loadingCollection, navigate]);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleEdit = (service) => {
        setFormData({
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            active: service.active,
        });
        setEditingId(service.id);
        setOpen(true);
    };
    // Handler for duration changes with validation
    const handleDurationChange = (e) => {
        const value = e.target.value;
        // If empty string, set duration to 0
        if (value === '') {
            setFormData({ ...formData, duration: 0 });
            return;
        }
        // Try to parse as integer
        const parsedValue = parseInt(value, 10);
        // If valid number, update state
        if (!isNaN(parsedValue)) {
            setFormData({ ...formData, duration: parsedValue });
        }
        // If invalid, don't update (keep previous value)
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
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate form
        if (!formData.name.trim() || formData.price < 0 || formData.duration <= 0) {
            return;
        }
        if (editingId) {
            updateService({
                ...formData,
                id: editingId
            });
        }
        else {
            createService({
                ...formData,
                collection_id: collectionId
            });
        }
        handleClose();
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            deleteService(id);
        }
    };
    if (loadingCollection || loadingServices) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    if (!collection) {
        return (_jsxs(Paper, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "body1", color: "text.secondary", children: "Collection not found." }), _jsx(Button, { component: Link, to: "/services", startIcon: _jsx(ArrowBackIcon, {}), sx: { mt: 2 }, children: "Back to Collections" })] }));
    }
    return (_jsxs(Box, { children: [_jsx(Box, { sx: { mb: 3 }, children: _jsxs(Breadcrumbs, { "aria-label": "breadcrumb", children: [_jsx(Link, { to: "/services", style: { textDecoration: 'none', color: 'inherit' }, children: "Services" }), _jsx(Typography, { color: "text.primary", children: collection.name })] }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h1", children: collection.name }), _jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: collection.description })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleOpen, sx: { height: 'fit-content' }, children: "Add Service" })] }), services?.length ? (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Name" }), _jsx(TableCell, { children: "Description" }), _jsx(TableCell, { align: "right", children: "Duration" }), _jsx(TableCell, { align: "right", children: "Price" }), _jsx(TableCell, { children: "Status" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: services.map((service) => (_jsxs(TableRow, { sx: {
                                    opacity: service.active ? 1 : 0.6,
                                }, children: [_jsx(TableCell, { children: service.name }), _jsx(TableCell, { children: service.description }), _jsx(TableCell, { align: "right", children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, children: [_jsx(AccessTimeIcon, { fontSize: "small", sx: { mr: 0.5, opacity: 0.6 } }), service.duration, " min"] }) }), _jsx(TableCell, { align: "right", children: formatCurrency(service.price) }), _jsx(TableCell, { children: _jsx(Chip, { label: service.active ? 'Active' : 'Inactive', color: service.active ? 'success' : 'default', size: "small" }) }), _jsxs(TableCell, { align: "right", children: [_jsx(IconButton, { onClick: () => handleEdit(service), color: "primary", size: "small", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDelete(service.id), color: "error", size: "small", children: _jsx(DeleteIcon, {}) })] })] }, service.id))) })] }) })) : (_jsx(Paper, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No services found in this collection. Click \"Add Service\" to create your first one." }) })), _jsx(Dialog, { open: open, onClose: handleClose, maxWidth: "sm", fullWidth: true, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogTitle, { children: editingId ? 'Edit Service' : 'Add New Service' }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }, children: [_jsx(TextField, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, fullWidth: true }), _jsx(TextField, { label: "Description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), multiline: true, rows: 3, fullWidth: true }), _jsx(TextField, { label: "Duration (minutes)", type: "number", value: formData.duration, onChange: handleDurationChange, required: true, fullWidth: true, InputProps: {
                                            inputProps: { min: 5 }
                                        } }), _jsx(TextField, { label: "Price (\u20B9)", type: "number", 
                                        // Display price in whole rupees for editing (divide by 100)
                                        value: formData.price / 100, onChange: handlePriceChange, required: true, fullWidth: true, InputProps: {
                                            inputProps: { min: 0, step: 0.01 }
                                        } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: formData.active, onChange: (e) => setFormData({ ...formData, active: e.target.checked }), color: "primary" }), label: "Active" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", children: editingId ? 'Update' : 'Create' })] })] }) })] }));
}
