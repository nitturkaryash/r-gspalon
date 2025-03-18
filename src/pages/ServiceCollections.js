import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Card, CardContent, CardActions, Divider, CircularProgress, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowForward as ArrowForwardIcon, } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useServiceCollections } from '../hooks/useServiceCollections';
// Initial form data for collections
const initialFormData = {
    name: '',
    description: '',
};
export default function ServiceCollections() {
    const { serviceCollections, isLoading, createServiceCollection, updateServiceCollection, deleteServiceCollection } = useServiceCollections();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const navigate = useNavigate();
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleEdit = (collection) => {
        setFormData({
            name: collection.name,
            description: collection.description,
        });
        setEditingId(collection.id);
        setOpen(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate form
        if (!formData.name.trim()) {
            return;
        }
        if (editingId) {
            updateServiceCollection({ ...formData, id: editingId });
        }
        else {
            createServiceCollection(formData);
        }
        handleClose();
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this collection? All services in this collection will also be deleted.')) {
            deleteServiceCollection(id);
        }
    };
    const handleCollectionClick = (id) => {
        navigate(`/services/${id}`);
    };
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h1", children: "Services" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleOpen, sx: { height: 'fit-content' }, children: "Add Collection" })] }), serviceCollections?.length ? (_jsx(Grid, { container: true, spacing: 3, children: serviceCollections.map((collection) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: {
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6,
                                cursor: 'pointer',
                            },
                        }, onClick: () => handleCollectionClick(collection.id), children: [_jsxs(CardContent, { sx: { flexGrow: 1 }, children: [_jsx(Typography, { variant: "h6", component: "div", gutterBottom: true, children: collection.name }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: collection.description })] }), _jsx(Divider, {}), _jsxs(CardActions, { sx: { justifyContent: 'space-between', p: 2 }, children: [_jsxs(Box, { children: [_jsx(IconButton, { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleEdit(collection);
                                                }, color: "primary", size: "small", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDelete(collection.id);
                                                }, color: "error", size: "small", children: _jsx(DeleteIcon, {}) })] }), _jsx(IconButton, { color: "primary", component: Link, to: `/services/${collection.id}`, onClick: (e) => e.stopPropagation(), children: _jsx(ArrowForwardIcon, {}) })] })] }) }, collection.id))) })) : (_jsx(Paper, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No service collections found. Click \"Add Collection\" to create your first one." }) })), _jsx(Dialog, { open: open, onClose: handleClose, fullWidth: true, maxWidth: "sm", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogTitle, { children: editingId ? 'Edit Collection' : 'Add New Collection' }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(TextField, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, fullWidth: true }), _jsx(TextField, { label: "Description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), multiline: true, rows: 3, fullWidth: true })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", children: editingId ? 'Update' : 'Create' })] })] }) })] }));
}
