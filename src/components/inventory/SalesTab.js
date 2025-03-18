import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Alert, TablePagination, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, LinearProgress } from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useInventory } from '../../hooks/useInventory';
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
}));
const SalesTab = ({ sales, isLoading, error }) => {
    const { syncSalesFromPos, isSyncingSales, processingStats } = useInventory();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    const handleOpenSyncDialog = () => {
        setSyncDialogOpen(true);
    };
    const handleCloseSyncDialog = () => {
        setSyncDialogOpen(false);
    };
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSyncData = async () => {
        try {
            await syncSalesFromPos(dateRange.startDate, dateRange.endDate);
            handleCloseSyncDialog();
        }
        catch (error) {
            console.error('Error syncing sales data:', error);
        }
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN');
        }
        catch (e) {
            return dateStr;
        }
    };
    // Calculate progress percentage
    const calculateProgress = () => {
        if (!processingStats)
            return 0;
        const { total, processed } = processingStats;
        return total > 0 ? Math.round((processed / total) * 100) : 0;
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h6", children: "Sales Records" }), _jsx(Button, { variant: "contained", color: "primary", startIcon: isSyncingSales ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : _jsx(SyncIcon, {}), onClick: handleOpenSyncDialog, disabled: isSyncingSales, children: "Sync with POS" })] }), isSyncingSales && processingStats && (_jsxs(Box, { sx: { width: '100%', mb: 2 }, children: [_jsx(LinearProgress, { variant: "determinate", value: calculateProgress() }), _jsxs(Typography, { variant: "body2", color: "text.secondary", align: "center", children: ["Processing: ", processingStats.processed, " of ", processingStats.total, " items", processingStats.errors > 0 && ` (${processingStats.errors} errors)`] })] })), error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Error loading sales: ", error.message] })), isLoading ? (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) })) : (_jsx(_Fragment, { children: sales.length === 0 ? (_jsx(Alert, { severity: "info", children: "No sales records found. Sync with the POS system to fetch sales data." })) : (_jsxs(Paper, { children: [_jsx(TableContainer, { component: Paper, sx: { maxHeight: 440 }, children: _jsxs(Table, { stickyHeader: true, "aria-label": "sales table", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(StyledTableCell, { children: "Date" }), _jsx(StyledTableCell, { children: "Invoice #" }), _jsx(StyledTableCell, { children: "Product Name" }), _jsx(StyledTableCell, { children: "HSN Code" }), _jsx(StyledTableCell, { children: "Units" }), _jsx(StyledTableCell, { align: "right", children: "Qty" }), _jsx(StyledTableCell, { align: "right", children: "MRP (Incl. GST)" }), _jsx(StyledTableCell, { align: "right", children: "Discount %" }), _jsx(StyledTableCell, { align: "right", children: "Sale Rate (Excl. GST)" }), _jsx(StyledTableCell, { align: "right", children: "GST %" }), _jsx(StyledTableCell, { align: "right", children: "Taxable Value" }), _jsx(StyledTableCell, { align: "right", children: "Total Value" })] }) }), _jsx(TableBody, { children: sales
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((sale) => (_jsxs(TableRow, { hover: true, sx: { '&:last-child td, &:last-child th': { border: 0 } }, children: [_jsx(TableCell, { children: formatDate(sale.date) }), _jsx(TableCell, { children: sale.invoice_no }), _jsx(TableCell, { children: sale.product_name }), _jsx(TableCell, { children: sale.hsn_code }), _jsx(TableCell, { children: sale.units }), _jsx(TableCell, { align: "right", children: sale.sales_qty }), _jsxs(TableCell, { align: "right", children: ["\u20B9", sale.mrp_incl_gst?.toFixed(2)] }), _jsxs(TableCell, { align: "right", children: [sale.discount_on_sales_percentage, "%"] }), _jsxs(TableCell, { align: "right", children: ["\u20B9", sale.discounted_sales_rate_excl_gst?.toFixed(2)] }), _jsxs(TableCell, { align: "right", children: [sale.sales_gst_percentage, "%"] }), _jsxs(TableCell, { align: "right", children: ["\u20B9", sale.sales_taxable_value?.toFixed(2)] }), _jsxs(TableCell, { align: "right", children: ["\u20B9", sale.invoice_value_rs?.toFixed(2)] })] }, sale.sale_id))) })] }) }), _jsx(TablePagination, { rowsPerPageOptions: [5, 10, 25, 50], component: "div", count: sales.length, rowsPerPage: rowsPerPage, page: page, onPageChange: handleChangePage, onRowsPerPageChange: handleChangeRowsPerPage })] })) })), _jsxs(Dialog, { open: syncDialogOpen, onClose: handleCloseSyncDialog, children: [_jsx(DialogTitle, { children: "Sync Sales Data from POS" }), _jsxs(DialogContent, { children: [_jsx(DialogContentText, { children: "Select a date range to sync sales data from the POS system. This process may take a few minutes depending on the amount of data." }), _jsxs(Box, { sx: { mt: 2, display: 'flex', gap: 2 }, children: [_jsx(TextField, { label: "Start Date", type: "date", name: "startDate", value: dateRange.startDate, onChange: handleDateChange, fullWidth: true, InputLabelProps: { shrink: true } }), _jsx(TextField, { label: "End Date", type: "date", name: "endDate", value: dateRange.endDate, onChange: handleDateChange, fullWidth: true, InputLabelProps: { shrink: true } })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseSyncDialog, children: "Cancel" }), _jsx(Button, { onClick: handleSyncData, color: "primary", variant: "contained", disabled: isSyncingSales, startIcon: isSyncingSales ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : _jsx(SyncIcon, {}), children: "Sync Data" })] })] })] }));
};
export default SalesTab;
