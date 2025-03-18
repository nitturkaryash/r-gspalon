import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TextField, FormControl, InputLabel, Select, MenuItem, Box, Paper, InputAdornment, IconButton, Alert, Grid, } from '@mui/material';
import { Close as CloseIcon, } from '@mui/icons-material';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../../hooks/usePOS';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-toastify';
// Icons for different payment methods
const PaymentIcons = {
    cash: _jsx("span", { children: "\uD83D\uDCB5" }),
    credit_card: _jsx("span", { children: "\uD83D\uDCB3" }),
    debit_card: _jsx("span", { children: "\uD83D\uDCB3" }),
    upi: _jsx("span", { children: "\uD83D\uDCF1" }),
    bnpl: _jsx("span", { children: "\u23F1\uFE0F" }),
};
export default function CompletePaymentDialog({ open, onClose, order, onCompletePayment, }) {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentNote, setPaymentNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    // Reset state when dialog opens
    useEffect(() => {
        if (open && order) {
            setPaymentMethod('cash');
            setPaymentAmount(order.pending_amount);
            setPaymentNote('');
        }
    }, [open, order]);
    const handleSubmit = async () => {
        if (!order)
            return;
        // Validate payment amount
        if (paymentAmount <= 0 || paymentAmount > order.pending_amount) {
            toast.error('Invalid payment amount');
            return;
        }
        setIsProcessing(true);
        try {
            // Create new payment record
            const newPayment = {
                id: (Math.random() * 1000000).toString(), // Temporary ID - will be replaced on server
                amount: paymentAmount,
                payment_method: paymentMethod,
                payment_date: new Date().toISOString(),
                payment_note: paymentNote || undefined,
            };
            // Update the order with the new payment
            await onCompletePayment(order.id, newPayment);
            // Close the dialog
            onClose();
            // Show success message
            toast.success('Payment completed successfully');
        }
        catch (error) {
            console.error('Error completing payment:', error);
            toast.error('Failed to complete payment');
        }
        finally {
            setIsProcessing(false);
        }
    };
    if (!order)
        return null;
    return (_jsxs(Dialog, { open: open, onClose: !isProcessing ? onClose : undefined, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h6", children: "Complete Payment" }), !isProcessing && (_jsx(IconButton, { onClick: onClose, size: "small", children: _jsx(CloseIcon, {}) }))] }) }), _jsx(DialogContent, { dividers: true, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, fontWeight: "medium", children: "Order Details" }), _jsx(TableContainer, { component: Paper, variant: "outlined", sx: { mb: 3 }, children: _jsx(Table, { size: "small", children: _jsxs(TableBody, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx("strong", { children: "Order ID" }) }), _jsxs(TableCell, { children: [order.id.slice(0, 8), "..."] })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx("strong", { children: "Customer" }) }), _jsx(TableCell, { children: order.client_name })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx("strong", { children: "Total Amount" }) }), _jsx(TableCell, { children: formatCurrency(order.total) })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx("strong", { children: "Pending Amount" }) }), _jsx(TableCell, { sx: { color: 'error.main', fontWeight: 'bold' }, children: formatCurrency(order.pending_amount) })] })] }) }) }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, fontWeight: "medium", children: "Existing Payments" }), _jsx(TableContainer, { component: Paper, variant: "outlined", sx: { mb: 3, maxHeight: 200 }, children: _jsxs(Table, { size: "small", stickyHeader: true, children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Amount" }), _jsx(TableCell, { children: "Method" }), _jsx(TableCell, { children: "Date" })] }) }), _jsxs(TableBody, { children: [order.payments.map((payment, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: formatCurrency(payment.amount) }), _jsx(TableCell, { children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx("span", { style: { marginRight: 8 }, children: PaymentIcons[payment.payment_method] }), PAYMENT_METHOD_LABELS[payment.payment_method]] }) }), _jsx(TableCell, { children: new Date(payment.payment_date).toLocaleDateString() })] }, payment.id || index))), order.payments.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 3, align: "center", children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No payments recorded" }) }) }))] })] }) })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, fontWeight: "medium", children: "Complete Payment" }), _jsxs(Paper, { variant: "outlined", sx: { p: 3 }, children: [_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(TextField, { label: "Payment Amount", type: "number", fullWidth: true, value: paymentAmount, onChange: (e) => setPaymentAmount(Number(e.target.value)), InputProps: {
                                                        startAdornment: _jsx(InputAdornment, { position: "start", children: "\u20B9" }),
                                                    }, inputProps: { min: 1, max: order.pending_amount }, helperText: `Max: ${formatCurrency(order.pending_amount)}`, margin: "normal", disabled: isProcessing, required: true }), _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { children: "Payment Method" }), _jsx(Select, { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), label: "Payment Method", disabled: isProcessing, children: PAYMENT_METHODS.filter(method => method !== 'bnpl').map((method) => (_jsx(MenuItem, { value: method, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx("span", { style: { marginRight: 8 }, children: PaymentIcons[method] }), PAYMENT_METHOD_LABELS[method]] }) }, method))) })] }), _jsx(TextField, { label: "Payment Note (Optional)", fullWidth: true, value: paymentNote, onChange: (e) => setPaymentNote(e.target.value), margin: "normal", disabled: isProcessing, placeholder: "e.g., Reference number, transaction ID, etc." })] }), paymentAmount < order.pending_amount && (_jsx(Alert, { severity: "warning", sx: { mb: 2 }, children: _jsxs(Typography, { variant: "body2", children: ["This is a partial payment. ", formatCurrency(order.pending_amount - paymentAmount), " will remain as pending."] }) })), _jsx(Alert, { severity: "info", sx: { mb: 2 }, children: _jsx(Typography, { variant: "body2", children: "Completing this payment will update the customer's payment history." }) })] })] })] }) }), _jsxs(DialogActions, { sx: { p: 2 }, children: [_jsx(Button, { onClick: onClose, disabled: isProcessing, children: "Cancel" }), _jsx(Button, { variant: "contained", color: "primary", onClick: handleSubmit, disabled: paymentAmount <= 0 || paymentAmount > order.pending_amount || isProcessing, children: isProcessing ? 'Processing...' : 'Complete Payment' })] })] }));
}
