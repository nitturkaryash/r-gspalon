import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Tooltip, InputAdornment, Alert } from '@mui/material';
import { PersonAdd as PersonAddIcon, Edit as EditIcon, CreditCard as CreditCardIcon, Search as SearchIcon, CalendarToday as CalendarTodayIcon } from '@mui/icons-material';
import { useClients } from '../hooks/useClients';
import { formatCurrency } from '../utils/format';

export default function Clients() {
    const { clients = [], isLoading, createClient, updateClient, processPendingPayment } = useClients();
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        notes: ''
    });
    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    // Filter clients based on search query
    const filteredClients = searchQuery
        ? clients.filter(client => 
            client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.phone && client.phone.includes(searchQuery)) ||
            (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())))
        : clients;
    // Handle add client
    const handleAddClient = async () => {
        await createClient(formData);
        setFormData({
            full_name: '',
            phone: '',
            email: '',
            notes: ''
        });
        setOpenAddDialog(false);
    };
    // Handle edit client
    const handleEditClient = async () => {
        if (!selectedClient)
            return;
        await updateClient({
            id: selectedClient.id,
            ...formData
        });
        setSelectedClient(null);
        setOpenEditDialog(false);
    };
    // Open edit dialog with client data
    const handleOpenEditDialog = (client) => {
        setSelectedClient(client);
        setFormData({
            full_name: client.full_name,
            phone: client.phone,
            email: client.email,
            notes: client.notes
        });
        setOpenEditDialog(true);
    };
    // Open payment dialog for BNPL
    const handleOpenPaymentDialog = (client) => {
        setSelectedClient(client);
        setPaymentAmount(client.pending_payment);
        setOpenPaymentDialog(true);
    };
    // Process pending payment
    const handleProcessPayment = async () => {
        if (!selectedClient)
            return;
        await processPendingPayment({
            clientId: selectedClient.id,
            amount: paymentAmount
        });
        setSelectedClient(null);
        setPaymentAmount(0);
        setOpenPaymentDialog(false);
    };
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h1", children: "Clients" }), _jsx(Button, { variant: "contained", startIcon: _jsx(PersonAddIcon, {}), onClick: () => setOpenAddDialog(true), sx: { height: 'fit-content' }, children: "Add Client" })] }), _jsx(TextField, { fullWidth: true, variant: "outlined", placeholder: "Search clients by name, phone, or email...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                    startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                }, sx: { mb: 3 } }), _jsx(Paper, { sx: { p: 3 }, children: clients && clients.length > 0 ? (_jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Name" }), _jsx(TableCell, { children: "Contact" }), _jsx(TableCell, { children: "Last Visit" }), _jsx(TableCell, { children: "Total Spent" }), _jsx(TableCell, { children: "Pending Payment" }), _jsx(TableCell, { children: "Actions" })] }) }), _jsx(TableBody, { children: filteredClients.map((client) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: client.full_name }), _jsxs(TableCell, { children: [_jsx(Typography, { variant: "body2", children: client.phone }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: client.email })] }), _jsx(TableCell, { children: client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never' }), _jsx(TableCell, { children: _jsx(Typography, { color: "success.main", fontWeight: "bold", children: formatCurrency(client.total_spent) }) }), _jsx(TableCell, { children: client.pending_payment > 0 ? (_jsx(Chip, { label: formatCurrency(client.pending_payment), color: "warning", onClick: () => handleOpenPaymentDialog(client) })) : (_jsx(Typography, { color: "text.secondary", children: "No pending amount" })) }), _jsx(TableCell, { children: _jsxs(Box, { children: [_jsx(Tooltip, { title: "Edit Client", children: _jsx(IconButton, { onClick: () => handleOpenEditDialog(client), children: _jsx(EditIcon, {}) }) }), client.pending_payment > 0 && (_jsx(Tooltip, { title: "Process Payment", children: _jsx(IconButton, { color: "primary", onClick: () => handleOpenPaymentDialog(client), children: _jsx(CreditCardIcon, {}) }) }))] }) })] }, client.id))) })] }) })) : (_jsx(Typography, { variant: "body1", color: "text.secondary", children: "No clients in the database. Add a client to get started." })) }), _jsxs(Dialog, { open: openAddDialog, onClose: () => setOpenAddDialog(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Add New Client" }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { name: "full_name", label: "Full Name", value: formData.full_name, onChange: handleInputChange, fullWidth: true, required: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { name: "phone", label: "Phone Number", value: formData.phone, onChange: handleInputChange, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { name: "email", label: "Email", type: "email", value: formData.email, onChange: handleInputChange, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { name: "notes", label: "Notes", value: formData.notes, onChange: handleInputChange, fullWidth: true, multiline: true, rows: 3 }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpenAddDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleAddClient, variant: "contained", disabled: !formData.full_name, children: "Add Client" })] })] }), _jsxs(Dialog, { open: openEditDialog, onClose: () => setOpenEditDialog(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Edit Client" }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { name: "full_name", label: "Full Name", value: formData.full_name, onChange: handleInputChange, fullWidth: true, required: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { name: "phone", label: "Phone Number", value: formData.phone, onChange: handleInputChange, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { name: "email", label: "Email", type: "email", value: formData.email, onChange: handleInputChange, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { name: "notes", label: "Notes", value: formData.notes, onChange: handleInputChange, fullWidth: true, multiline: true, rows: 3 }) }), selectedClient && (_jsxs(_Fragment, { children: [_jsxs(Grid, { item: true, xs: 12, sm: 6, children: [_jsx(Typography, { variant: "subtitle2", children: "Total Spent" }), _jsx(Typography, { variant: "h6", color: "success.main", children: formatCurrency(selectedClient.total_spent) })] }), _jsxs(Grid, { item: true, xs: 12, sm: 6, children: [_jsx(Typography, { variant: "subtitle2", children: "Pending Payment" }), _jsx(Typography, { variant: "h6", color: selectedClient.pending_payment > 0 ? "warning.main" : "text.secondary", children: selectedClient.pending_payment > 0
                                                        ? formatCurrency(selectedClient.pending_payment)
                                                        : "No pending amount" })] }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "subtitle2", children: "Last Visit" }), _jsxs(Typography, { variant: "body1", sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CalendarTodayIcon, { fontSize: "small", sx: { mr: 1 } }), selectedClient.last_visit
                                                            ? new Date(selectedClient.last_visit).toLocaleDateString()
                                                            : "Never visited"] })] })] }))] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpenEditDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleEditClient, variant: "contained", disabled: !formData.full_name, children: "Save Changes" })] })] }), _jsxs(Dialog, { open: openPaymentDialog, onClose: () => setOpenPaymentDialog(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Process Pending Payment" }), _jsx(DialogContent, { children: selectedClient && (_jsx(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: _jsxs(Grid, { item: true, xs: 12, children: [_jsxs(Alert, { severity: "info", sx: { mb: 2 }, children: ["Processing payment for ", selectedClient.full_name] }), _jsxs(Typography, { variant: "subtitle1", gutterBottom: true, children: ["Total Pending Amount: ", formatCurrency(selectedClient.pending_payment)] }), _jsx(TextField, { label: "Payment Amount", type: "number", value: paymentAmount, onChange: (e) => setPaymentAmount(Number(e.target.value)), fullWidth: true, InputProps: {
                                            inputProps: { min: 0, max: selectedClient.pending_payment },
                                            startAdornment: _jsx(InputAdornment, { position: "start", children: "\u20B9" }),
                                        }, error: paymentAmount > selectedClient.pending_payment, helperText: paymentAmount > selectedClient.pending_payment ? "Amount exceeds pending payment" : "", sx: { mt: 2 } })] }) })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpenPaymentDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleProcessPayment, variant: "contained", disabled: !selectedClient || paymentAmount <= 0 || paymentAmount > (selectedClient?.pending_payment || 0), startIcon: _jsx(CreditCardIcon, {}), children: "Process Payment" })] })] })] }));
}
