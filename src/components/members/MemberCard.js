import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, Typography, Button, IconButton, TextField, Box, Avatar, } from '@mui/material';
import { Delete as DeleteIcon, Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, AttachMoney as AttachMoneyIcon, } from '@mui/icons-material';
import { format } from 'date-fns';
import { styled } from '@mui/material/styles';
// Styled components for premium design
const PremiumCard = styled(Card)(({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
    color: theme.palette.common.white,
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.8)',
    },
    height: '100%',
}));
const CardHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.7)',
    position: 'relative',
    zIndex: 1,
}));
const PremiumAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid #FFD700',
    color: '#FFD700',
    marginRight: theme.spacing(2),
    width: 50,
    height: 50,
}));
const MembershipCardContent = styled(CardContent)(({ theme }) => ({
    position: 'relative',
    zIndex: 1,
    padding: theme.spacing(3),
}));
const SpotlightEffect = styled(Box)(() => ({
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.6) 100%)',
    opacity: 0.6,
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
}));
const GoldButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(45deg, #B8860B, #FFD700)',
    color: theme.palette.common.black,
    fontWeight: 'bold',
    '&:hover': {
        background: 'linear-gradient(45deg, #DAA520, #FFF8DC)',
    },
}));
export default function MemberCard({ member, onTopUp, onDelete, formatCurrency }) {
    const [isToppingUp, setIsToppingUp] = useState(false);
    const [amount, setAmount] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const handleTopUp = () => {
        const topUpAmount = parseInt(amount, 10);
        if (isNaN(topUpAmount) || topUpAmount < 1000) {
            alert('Please enter a valid amount (minimum ₹1,000)');
            return;
        }
        onTopUp(member.id, topUpAmount);
        setIsToppingUp(false);
        setAmount('');
    };
    const joinDate = new Date(member.joinDate);
    const memberSince = format(joinDate, 'MMMM d, yyyy');
    return (_jsxs(PremiumCard, { children: [_jsx(SpotlightEffect, {}), _jsxs(CardHeader, { children: [_jsx(PremiumAvatar, { children: _jsx(PersonIcon, {}) }), _jsxs(Box, { sx: { flexGrow: 1 }, children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }, children: member.name }), _jsxs(Typography, { variant: "caption", sx: { opacity: 0.9, textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }, children: ["Member since ", memberSince] })] }), _jsx(IconButton, { size: "small", sx: { color: '#FFD700' }, onClick: () => onDelete(member.id), title: "Delete member", children: _jsx(DeleteIcon, {}) })] }), _jsxs(MembershipCardContent, { children: [_jsxs(Box, { sx: { mb: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "body2", sx: { color: 'rgba(255,255,255,0.7)', mb: 1 }, children: "PREMIUM BALANCE" }), _jsx(Typography, { variant: "h4", sx: {
                                    fontWeight: 'bold',
                                    textShadow: '0 0 10px rgba(255,215,0,0.5)',
                                    letterSpacing: '1px'
                                }, children: formatCurrency(member.balance) })] }), isExpanded && (_jsxs(Box, { sx: {
                            mb: 3,
                            p: 1.5,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            borderRadius: 1,
                            backdropFilter: 'blur(5px)'
                        }, children: [member.email && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [_jsx(EmailIcon, { fontSize: "small", sx: { mr: 1, color: '#FFD700' } }), _jsx(Typography, { variant: "body2", children: member.email })] })), member.phone && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(PhoneIcon, { fontSize: "small", sx: { mr: 1, color: '#FFD700' } }), _jsx(Typography, { variant: "body2", children: member.phone })] }))] })), !isToppingUp ? (_jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(GoldButton, { variant: "contained", fullWidth: true, onClick: () => setIsToppingUp(true), startIcon: _jsx(AttachMoneyIcon, {}), sx: { py: 1 }, children: "Top Up" }), _jsx(Button, { variant: "outlined", size: "small", onClick: () => setIsExpanded(!isExpanded), sx: {
                                    borderColor: '#FFD700',
                                    color: '#FFD700',
                                    '&:hover': {
                                        borderColor: '#FFF8DC',
                                        color: '#FFF8DC',
                                        bgcolor: 'rgba(0,0,0,0.3)'
                                    }
                                }, children: isExpanded ? 'Less' : 'More' })] })) : (_jsxs(Box, { sx: { mt: 2 }, children: [_jsx(TextField, { fullWidth: true, label: "Amount", type: "number", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "Enter amount", inputProps: { min: 1000 }, sx: {
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        backdropFilter: 'blur(5px)',
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,215,0,0.5)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#FFD700',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#FFD700',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255,255,255,0.7)',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#FFD700',
                                    },
                                }, autoFocus: true }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(GoldButton, { variant: "contained", onClick: handleTopUp, disabled: !amount, fullWidth: true, children: "Confirm" }), _jsx(Button, { variant: "outlined", onClick: () => setIsToppingUp(false), fullWidth: true, sx: {
                                            borderColor: '#FFD700',
                                            color: '#FFD700',
                                            '&:hover': {
                                                borderColor: '#FFF8DC',
                                                color: '#FFF8DC',
                                                bgcolor: 'rgba(0,0,0,0.3)'
                                            }
                                        }, children: "Cancel" })] })] }))] })] }));
}
