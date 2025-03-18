import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Card, CardContent, CardActions, Avatar, FormControlLabel, Switch, IconButton, CircularProgress, Autocomplete, Divider, } from '@mui/material';
import { PersonAdd as PersonAddIcon, Edit as EditIcon, Delete as DeleteIcon, ContentCut, Palette, Spa, Face, } from '@mui/icons-material';
import { useStylists } from '../hooks/useStylists';
import { useServices } from '../hooks/useServices';
import { toast } from 'react-toastify';
// Default avatar image
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Stylist&background=6B8E23&color=fff&size=150';
// Available specialties
const SPECIALTIES = [
    'Haircut',
    'Styling',
    'Color',
    'Highlights',
    'Balayage',
    'Perm',
    'Extensions',
    'Blowout',
    'Bridal',
    'Kids',
    'Beard Trim',
    'Shave',
];
const initialFormData = {
    name: '',
    specialties: [],
    bio: '',
    gender: 'other',
    available: true,
    imageUrl: '',
    email: '',
    phone: '',
    breaks: []
};
export default function Stylists() {
    const { stylists, isLoading, createStylist, updateStylist, deleteStylist } = useStylists();
    const { services } = useServices();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleEdit = (stylist) => {
        setFormData({
            name: stylist.name,
            specialties: stylist.specialties,
            bio: stylist.bio || '',
            gender: stylist.gender || 'other',
            available: stylist.available,
            imageUrl: stylist.imageUrl || '',
            email: stylist.email || '',
            phone: stylist.phone || '',
            breaks: stylist.breaks || []
        });
        setEditingId(stylist.id);
        setOpen(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Stylist name is required');
            return;
        }
        if (editingId) {
            updateStylist({ ...formData, id: editingId });
        }
        else {
            createStylist(formData);
        }
        handleClose();
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this stylist?')) {
            deleteStylist(id);
        }
    };
    const getSpecialtyIcon = (specialty) => {
        switch (specialty.toLowerCase()) {
            case 'haircut':
                return _jsx(ContentCut, { fontSize: "small" });
            case 'color':
                return _jsx(Palette, { fontSize: "small" });
            default:
                return _jsx(Spa, { fontSize: "small" });
        }
    };
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h1", children: "Stylists" }), _jsx(Button, { variant: "contained", startIcon: _jsx(PersonAddIcon, {}), onClick: handleOpen, sx: { height: 'fit-content' }, children: "Add Stylist" })] }), stylists?.length ? (_jsx(Grid, { container: true, spacing: 3, children: stylists.map((stylist) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: {
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                            },
                        }, children: [_jsxs(Box, { sx: { p: 2, display: 'flex', alignItems: 'center' }, children: [_jsx(Avatar, { src: stylist.imageUrl || DEFAULT_AVATAR, sx: { width: 80, height: 80, mr: 2 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", component: "div", children: stylist.name }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 0.5 }, children: [_jsx(Face, { fontSize: "small", sx: { mr: 0.5, opacity: 0.7 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: stylist.gender === 'male' ? 'Male' : stylist.gender === 'female' ? 'Female' : 'Other' })] }), _jsx(Typography, { variant: "body2", color: stylist.available ? 'success.main' : 'error.main', sx: { fontWeight: 'medium' }, children: stylist.available ? 'Available' : 'Not Available' })] })] }), _jsx(Divider, {}), _jsxs(CardContent, { sx: { flexGrow: 1 }, children: [stylist.bio && (_jsx(Typography, { variant: "body2", color: "text.secondary", paragraph: true, children: stylist.bio })), _jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Specialties:" }), _jsx(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 0.5 }, children: stylist.specialties.map((specialty) => (_jsx(Chip, { label: specialty, size: "small", icon: getSpecialtyIcon(specialty), sx: { mb: 0.5 } }, specialty))) }), (stylist.email || stylist.phone) && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 0.5 }, children: "Contact:" }), stylist.email && (_jsxs(Typography, { variant: "body2", sx: { mb: 0.5 }, children: ["Email: ", stylist.email] })), stylist.phone && (_jsxs(Typography, { variant: "body2", children: ["Phone: ", stylist.phone] }))] }))] }), _jsxs(CardActions, { sx: { justifyContent: 'flex-end', p: 2, pt: 0 }, children: [_jsx(IconButton, { onClick: () => handleEdit(stylist), color: "primary", children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDelete(stylist.id), color: "error", children: _jsx(DeleteIcon, {}) })] })] }) }, stylist.id))) })) : (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No stylists available. Add stylists to get started." }) })), _jsx(Dialog, { open: open, onClose: handleClose, maxWidth: "md", fullWidth: true, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogTitle, { children: editingId ? 'Edit Stylist' : 'Add New Stylist' }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 0.5 }, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Gender" }), _jsxs(Select, { value: formData.gender || 'other', onChange: (e) => setFormData({ ...formData, gender: e.target.value }), label: "Gender", children: [_jsx(MenuItem, { value: "male", children: "Male" }), _jsx(MenuItem, { value: "female", children: "Female" }), _jsx(MenuItem, { value: "other", children: "Other" })] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Autocomplete, { multiple: true, options: SPECIALTIES, value: formData.specialties, onChange: (_, newValue) => setFormData({ ...formData, specialties: newValue }), renderInput: (params) => (_jsx(TextField, { ...params, label: "Specialties", placeholder: "Select specialties", helperText: "Select the services this stylist can perform" })), renderTags: (value, getTagProps) => value.map((option, index) => (_jsx(Chip, { label: option, size: "small", icon: getSpecialtyIcon(option), ...getTagProps({ index }) }))) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Bio", value: formData.bio, onChange: (e) => setFormData({ ...formData, bio: e.target.value }), multiline: true, rows: 3, fullWidth: true, helperText: "A short description of the stylist's experience and expertise" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Email", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Phone", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Profile Image URL", value: formData.imageUrl, onChange: (e) => setFormData({ ...formData, imageUrl: e.target.value }), fullWidth: true, helperText: "Enter a URL for the stylist's profile image" }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(FormControlLabel, { control: _jsx(Switch, { checked: formData.available, onChange: (e) => setFormData({ ...formData, available: e.target.checked }), color: "primary" }), label: "Available for appointments" }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", children: editingId ? 'Update' : 'Add' })] })] }) })] }));
}
