import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, IconButton, Button, Grid, Divider, ButtonGroup, Tooltip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Stack, } from '@mui/material';
import { Visibility as VisibilityIcon, Receipt as ReceiptIcon, PictureAsPdf as PdfIcon, TableChart as CsvIcon, Search as SearchIcon, FilterList as FilterIcon, Spa as SpaIcon, Inventory as InventoryIcon, ShoppingBag as ShoppingBagIcon, PaymentRounded as PaymentIcon, } from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../utils/format';
import { AccessibleDialog } from '../components/AccessibleDialog';
import { exportToCSV, exportToPDF, formatOrdersForExport, orderExportHeaders } from '../utils/exportUtils';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, usePOS } from '../hooks/usePOS';
import CompletePaymentDialog from '../components/orders/CompletePaymentDialog';
export default function Orders() {
    const { orders, isLoading } = useOrders();
    const { updateOrderPayment } = usePOS();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };
    const handleCloseDetails = () => {
        setDetailsOpen(false);
        // Clear the selected order after dialog closes
        setTimeout(() => setSelectedOrder(null), 300);
    };
    const handleExportCSV = () => {
        if (!orders || orders.length === 0)
            return;
        const formattedOrders = formatOrdersForExport(filteredOrders);
        exportToCSV(formattedOrders, 'salon-orders-export', orderExportHeaders);
    };
    const handleExportPDF = () => {
        if (!orders || orders.length === 0)
            return;
        const formattedOrders = formatOrdersForExport(filteredOrders);
        exportToPDF(formattedOrders, 'salon-orders-export', orderExportHeaders, 'Salon Orders Report');
    };
    // Determine purchase type for an order
    const getPurchaseType = (order) => {
        if (!order.services || order.services.length === 0)
            return 'unknown';
        const hasServices = order.services.some((service) => !service.type || service.type === 'service');
        const hasProducts = order.services.some((service) => service.type === 'product');
        if (hasServices && hasProducts)
            return 'both';
        if (hasProducts)
            return 'product';
        return 'service';
    };
    // Handler for opening the payment completion dialog
    const handleCompletePayment = (order) => {
        setSelectedOrder(order);
        setPaymentDialogOpen(true);
    };
    // Handler for processing the payment update
    const handlePaymentUpdate = async (orderId, paymentDetails) => {
        await updateOrderPayment({ orderId, paymentDetails });
    };
    // Filter orders based on search query, payment method filter, and status filter
    const filteredOrders = useMemo(() => {
        if (!orders)
            return [];
        return orders.filter(order => {
            // Payment method filter
            if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all' && order.status !== statusFilter) {
                return false;
            }
            // Search query
            const searchLower = searchQuery.toLowerCase();
            return (order.client_name.toLowerCase().includes(searchLower) ||
                order.id.toLowerCase().includes(searchLower) ||
                order.stylist_name.toLowerCase().includes(searchLower) ||
                order.services.some((service) => service.service_name.toLowerCase().includes(searchLower)));
        });
    }, [orders, searchQuery, paymentFilter, statusFilter]);
    // Render purchase type chip
    const renderPurchaseTypeChip = (type) => {
        switch (type) {
            case 'service':
                return (_jsx(Chip, { icon: _jsx(SpaIcon, {}), label: "Service", size: "small", color: "primary" }));
            case 'product':
                return (_jsx(Chip, { icon: _jsx(InventoryIcon, {}), label: "Product", size: "small", color: "secondary" }));
            case 'both':
                return (_jsx(Chip, { icon: _jsx(ShoppingBagIcon, {}), label: "Service & Product", size: "small", color: "success" }));
            default:
                return (_jsx(Chip, { label: "Unknown", size: "small", color: "default" }));
        }
    };
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h1", gutterBottom: true, sx: { mb: 0 }, children: "Orders" }), orders && orders.length > 0 && (_jsxs(ButtonGroup, { variant: "outlined", size: "small", children: [_jsx(Tooltip, { title: "Export to CSV", children: _jsx(Button, { onClick: handleExportCSV, startIcon: _jsx(CsvIcon, {}), "aria-label": "Export to CSV", children: "CSV" }) }), _jsx(Tooltip, { title: "Export to PDF", children: _jsx(Button, { onClick: handleExportPDF, startIcon: _jsx(PdfIcon, {}), "aria-label": "Export to PDF", children: "PDF" }) })] }))] }), orders && orders.length > 0 && (_jsxs(Box, { mb: 3, display: "flex", gap: 2, flexWrap: "wrap", children: [_jsx(TextField, { placeholder: "Search orders...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), variant: "outlined", size: "small", sx: { flexGrow: 1, minWidth: '250px' }, InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })),
                        } }), _jsxs(FormControl, { sx: { minWidth: '200px' }, size: "small", children: [_jsx(InputLabel, { id: "payment-filter-label", children: "Payment Method" }), _jsxs(Select, { labelId: "payment-filter-label", value: paymentFilter, onChange: (e) => setPaymentFilter(e.target.value), label: "Payment Method", startAdornment: _jsx(InputAdornment, { position: "start", children: _jsx(FilterIcon, { fontSize: "small" }) }), children: [_jsx(MenuItem, { value: "all", children: "All Payment Methods" }), PAYMENT_METHODS.map((method) => (_jsx(MenuItem, { value: method, children: PAYMENT_METHOD_LABELS[method] }, method)))] })] }), _jsxs(FormControl, { sx: { minWidth: '200px' }, size: "small", children: [_jsx(InputLabel, { id: "status-filter-label", children: "Status" }), _jsxs(Select, { labelId: "status-filter-label", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), label: "Status", children: [_jsx(MenuItem, { value: "all", children: "All Statuses" }), _jsx(MenuItem, { value: "completed", children: "Completed" }), _jsx(MenuItem, { value: "pending", children: "Pending" }), _jsx(MenuItem, { value: "cancelled", children: "Cancelled" })] })] })] })), filteredOrders.length > 0 ? (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Order ID" }), _jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Customer" }), _jsx(TableCell, { children: "Stylist" }), _jsx(TableCell, { children: "Items" }), _jsx(TableCell, { children: "Type" }), _jsx(TableCell, { children: "Payment" }), _jsx(TableCell, { children: "Status" }), _jsx(TableCell, { children: "Total" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: filteredOrders.map((order) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs(Typography, { variant: "body2", fontFamily: "monospace", children: [order.id.substring(0, 8), "..."] }) }), _jsx(TableCell, { children: new Date(order.created_at).toLocaleDateString() }), _jsx(TableCell, { children: order.client_name }), _jsx(TableCell, { children: order.stylist_name }), _jsx(TableCell, { children: order.services.length }), _jsx(TableCell, { children: renderPurchaseTypeChip(getPurchaseType(order)) }), _jsxs(TableCell, { children: [_jsx(Chip, { size: "small", label: PAYMENT_METHOD_LABELS[order.payment_method] }), order.is_split_payment && (_jsx(Chip, { size: "small", label: "Split", color: "secondary", sx: { ml: 0.5 } }))] }), _jsx(TableCell, { children: _jsx(Chip, { size: "small", label: order.status.charAt(0).toUpperCase() + order.status.slice(1), color: order.status === 'completed' ? 'success' :
                                                order.status === 'pending' ? 'warning' :
                                                    'error' }) }), _jsxs(TableCell, { children: [formatCurrency(order.total), order.pending_amount > 0 && (_jsx(Box, { sx: { mt: 0.5 }, children: _jsx(Chip, { size: "small", label: `Pending: ${formatCurrency(order.pending_amount)}`, color: "error", variant: "outlined" }) }))] }), _jsx(TableCell, { align: "right", children: _jsxs(Stack, { direction: "row", spacing: 1, justifyContent: "flex-end", children: [_jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", onClick: () => handleViewDetails(order), "aria-label": "view order details", children: _jsx(VisibilityIcon, { fontSize: "small" }) }) }), order.status === 'pending' && order.pending_amount > 0 && (_jsx(Tooltip, { title: "Complete Payment", children: _jsx(IconButton, { size: "small", onClick: () => handleCompletePayment(order), "aria-label": "complete payment", color: "primary", children: _jsx(PaymentIcon, { fontSize: "small" }) }) }))] }) })] }, order.id))) })] }) })) : (_jsx(Paper, { sx: { p: 3 }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: orders && orders.length > 0
                        ? 'No orders match your search criteria. Try adjusting your filters.'
                        : 'No orders found. Orders from the POS system will appear here.' }) })), selectedOrder && (_jsx(AccessibleDialog, { open: detailsOpen, onClose: handleCloseDetails, maxWidth: "md", fullWidth: true, title: "Order Details", titleIcon: _jsx(ReceiptIcon, {}), actions: _jsx(Button, { onClick: handleCloseDetails, color: "primary", variant: "contained", children: "Close" }), children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Order Information" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Order ID:" }), " ", selectedOrder.id] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Date:" }), " ", new Date(selectedOrder.created_at).toLocaleString()] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Customer:" }), " ", selectedOrder.client_name] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Stylist:" }), " ", selectedOrder.stylist_name] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Purchase Type:" }), " ", _jsx(Box, { component: "span", sx: { ml: 1 }, children: renderPurchaseTypeChip(getPurchaseType(selectedOrder)) })] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Status:" }), " ", selectedOrder.status] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Payment Method:" }), " ", PAYMENT_METHOD_LABELS[selectedOrder.payment_method] ||
                                                    selectedOrder.payment_method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())] }), selectedOrder.appointment_time && (_jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Appointment Time:" }), " ", new Date(selectedOrder.appointment_time).toLocaleString()] }))] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Payment Summary" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", children: "Subtotal:" }), _jsx(Typography, { variant: "body2", children: formatCurrency(selectedOrder.subtotal) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", children: "GST (18%):" }), _jsx(Typography, { variant: "body2", children: formatCurrency(selectedOrder.tax) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", children: "Discount:" }), _jsxs(Typography, { variant: "body2", color: "error", children: ["-", formatCurrency(selectedOrder.discount)] })] }), _jsx(Divider, { sx: { my: 1 } }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Typography, { variant: "subtitle2", children: "Total:" }), _jsx(Typography, { variant: "subtitle2", color: "primary", children: formatCurrency(selectedOrder.total) })] })] })] }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Services" }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Service" }), _jsx(TableCell, { align: "right", children: "Price" })] }) }), _jsx(TableBody, { children: selectedOrder.services.map((service, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: service.service_name }), _jsx(TableCell, { align: "right", children: formatCurrency(service.price) })] }, index))) })] }) })] })] }) })), _jsx(CompletePaymentDialog, { open: paymentDialogOpen, onClose: () => setPaymentDialogOpen(false), order: selectedOrder, onCompletePayment: handlePaymentUpdate })] }));
}
