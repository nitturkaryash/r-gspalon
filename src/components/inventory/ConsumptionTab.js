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
const ConsumptionTab = ({ consumption, isLoading, error }) => {
    const { syncConsumptionFromPos, isSyncingConsumption, processingStats } = useInventory();
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
            await syncConsumptionFromPos(dateRange.startDate, dateRange.endDate);
            handleCloseSyncDialog();
        }
        catch (error) {
            console.error('Error syncing consumption data:', error);
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
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h6", children: "Salon Consumption Records" }), _jsx(Button, { variant: "contained", color: "primary", startIcon: isSyncingConsumption ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : _jsx(SyncIcon, {}), onClick: handleOpenSyncDialog, disabled: isSyncingConsumption, children: "Sync from POS" })] }), isSyncingConsumption && processingStats && (_jsxs(Box, { sx: { width: '100%', mb: 2 }, children: [_jsx(LinearProgress, { variant: "determinate", value: calculateProgress() }), _jsxs(Typography, { variant: "body2", color: "text.secondary", align: "center", children: ["Processing: ", processingStats.processed, " of ", processingStats.total, " items", processingStats.errors > 0 && ` (${processingStats.errors} errors)`] })] })), error && (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Error loading consumption data: ", error.message] })), isLoading ? (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) })) : (_jsx(_Fragment, { children: consumption.length === 0 ? (_jsx(Alert, { severity: "info", children: "No consumption records found. Sync with the POS system to fetch salon consumption data." })) : (_jsxs(Paper, { children: [_jsx(TableContainer, { component: Paper, sx: { maxHeight: 440 }, children: _jsxs(Table, { stickyHeader: true, "aria-label": "consumption table", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(StyledTableCell, { children: "Date" }), _jsx(StyledTableCell, { children: "Requisition #" }), _jsx(StyledTableCell, { children: "Product Name" }), _jsx(StyledTableCell, { children: "HSN Code" }), _jsx(StyledTableCell, { children: "Units" }), _jsx(StyledTableCell, { align: "right", children: "Qty" }), _jsx(StyledTableCell, { align: "right", children: "Cost/Unit (Excl. GST)" }), _jsx(StyledTableCell, { align: "right", children: "GST %" }), _jsx(StyledTableCell, { align: "right", children: "Taxable Value" }), _jsx(StyledTableCell, { align: "right", children: "Total Value" }), _jsx(StyledTableCell, { align: "right", children: "Balance Qty" })] }) }), _jsx(TableBody, { children: consumption
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((item) => (_jsxs(TableRow, { hover: true, sx: { '&:last-child td, &:last-child th': { border: 0 } }, children: [_jsx(TableCell, { children: formatDate(item.date) }), _jsx(TableCell, { children: item.requisition_voucher_no }), _jsx(TableCell, { children: item.product_name }), _jsx(TableCell, { children: item.hsn_code }), _jsx(TableCell, { children: item.units }), _jsx(TableCell, { align: "right", children: item.consumption_qty }), _jsxs(TableCell, { align: "right", children: ["\u20B9", item.purchase_cost_per_unit_ex_gst?.toFixed(2)] }), _jsxs(TableCell, { align: "right", children: [item.purchase_gst_percentage, "%"] }), _jsxs(TableCell, { align: "right", children: ["\u20B9", item.taxable_value?.toFixed(2)] }), _jsxs(TableCell, { align: "right", children: ["\u20B9", item.invoice_value?.toFixed(2)] }), _jsx(TableCell, { align: "right", children: item.balance_qty })] }, item.consumption_id))) })] }) }), _jsx(TablePagination, { rowsPerPageOptions: [5, 10, 25, 50], component: "div", count: consumption.length, rowsPerPage: rowsPerPage, page: page, onPageChange: handleChangePage, onRowsPerPageChange: handleChangeRowsPerPage })] })) })), _jsxs(Dialog, { open: syncDialogOpen, onClose: handleCloseSyncDialog, children: [_jsx(DialogTitle, { children: "Sync Consumption Data from POS" }), _jsxs(DialogContent, { children: [_jsx(DialogContentText, { children: "Select a date range to sync salon consumption data from the POS system. This process may take a few minutes depending on the amount of data." }), _jsxs(Box, { sx: { mt: 2, display: 'flex', gap: 2 }, children: [_jsx(TextField, { label: "Start Date", type: "date", name: "startDate", value: dateRange.startDate, onChange: handleDateChange, fullWidth: true, InputLabelProps: { shrink: true } }), _jsx(TextField, { label: "End Date", type: "date", name: "endDate", value: dateRange.endDate, onChange: handleDateChange, fullWidth: true, InputLabelProps: { shrink: true } })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseSyncDialog, children: "Cancel" }), _jsx(Button, { onClick: handleSyncData, color: "primary", variant: "contained", disabled: isSyncingConsumption, startIcon: isSyncingConsumption ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : _jsx(SyncIcon, {}), children: "Sync Data" })] })] })] }));
};
export default ConsumptionTab;
