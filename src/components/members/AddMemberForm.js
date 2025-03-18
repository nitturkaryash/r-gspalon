import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, TextField, Button, Grid, Typography, InputAdornment, } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
// Styled components for premium form
const GoldTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        transition: 'all 0.3s',
        '& fieldset': {
            borderColor: 'rgba(255, 215, 0, 0.3)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255, 215, 0, 0.5)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#FFD700',
            borderWidth: 2,
        },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#FFD700',
    },
    '& .MuiSvgIcon-root': {
        color: 'rgba(255, 215, 0, 0.7)',
    },
}));
const GoldButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(45deg, #B8860B, #FFD700)',
    color: theme.palette.common.black,
    fontWeight: 'bold',
    padding: theme.spacing(1.2, 2),
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.3s',
    '&:hover': {
        background: 'linear-gradient(45deg, #DAA520, #FFF8DC)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 215, 0, 0.3)',
    },
}));
const CancelButton = styled(Button)(({ theme }) => ({
    borderColor: 'rgba(255, 215, 0, 0.5)',
    color: '#FFD700',
    padding: theme.spacing(1.2, 2),
    '&:hover': {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
    },
}));
export default function AddMemberForm({ onAddMember }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        balance: 0,
        membershipType: 'regular',
    });
    const [errors, setErrors] = useState({
        name: false,
        email: false,
        phone: false,
    });
    const validateForm = () => {
        const newErrors = {
            name: formData.name.trim() === '',
            email: formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
            phone: formData.phone.trim() !== '' && !/^[0-9]{10}$/.test(formData.phone.trim()),
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onAddMember(formData);
            setFormData({
                name: '',
                email: '',
                phone: '',
                balance: 0,
                membershipType: 'regular'
            });
        }
    };
    return (_jsxs(Box, { component: "form", onSubmit: handleSubmit, sx: { mt: 1 }, children: [_jsx(Typography, { variant: "body2", sx: { mb: 2, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }, children: "All new members start with a \u20B90 balance. They can top up their accounts after registration." }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(GoldTextField, { required: true, fullWidth: true, id: "name", name: "name", label: "Member Name", value: formData.name, onChange: handleChange, error: errors.name, helperText: errors.name ? 'Name is required' : '', InputProps: {
                                startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(PersonIcon, {}) })),
                            } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(GoldTextField, { fullWidth: true, id: "email", name: "email", label: "Email Address", value: formData.email, onChange: handleChange, error: errors.email, helperText: errors.email ? 'Please enter a valid email address' : '', InputProps: {
                                startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(EmailIcon, {}) })),
                            } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(GoldTextField, { fullWidth: true, id: "phone", name: "phone", label: "Phone Number", value: formData.phone, onChange: handleChange, error: errors.phone, helperText: errors.phone ? 'Please enter a 10-digit phone number' : '', InputProps: {
                                startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(PhoneIcon, {}) })),
                            } }) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }, children: [_jsx(CancelButton, { variant: "outlined", onClick: () => {
                            setFormData({
                                name: '',
                                email: '',
                                phone: '',
                                balance: 0,
                                membershipType: 'regular'
                            });
                            setErrors({ name: false, email: false, phone: false });
                        }, children: "Clear" }), _jsx(GoldButton, { type: "submit", variant: "contained", children: "Add Member" })] })] }));
}
