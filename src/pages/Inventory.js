import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { useInventory } from '../hooks/useInventory';
import PurchaseTab from '../components/inventory/PurchaseTab';
import SalesTab from '../components/inventory/SalesTab';
import ConsumptionTab from '../components/inventory/ConsumptionTab';
import { downloadCsv } from '../utils/csvExporter';
import { Link } from 'react-router-dom';
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    margin: theme.spacing(2, 0),
    boxShadow: theme.shadows[2],
}));
const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (_jsx("div", { role: "tabpanel", hidden: value !== index, id: `inventory-tabpanel-${index}`, "aria-labelledby": `inventory-tab-${index}`, ...other, children: value === index && _jsx(Box, { sx: { p: 3 }, children: children }) }));
};
const a11yProps = (index) => {
    return {
        id: `inventory-tab-${index}`,
        'aria-controls': `inventory-tabpanel-${index}`,
    };
};
const Inventory = () => {
    const [tabValue, setTabValue] = useState(0);
    const { purchasesQuery, salesQuery, consumptionQuery, balanceStockQuery, exportInventoryData, isExporting } = useInventory();
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    const handleExportData = async () => {
        try {
            const data = await exportInventoryData();
            downloadCsv(data);
        }
        catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        }
    };
    const isLoading = purchasesQuery.isLoading || salesQuery.isLoading || consumptionQuery.isLoading || balanceStockQuery.isLoading;
    const error = purchasesQuery.error || salesQuery.error || consumptionQuery.error || balanceStockQuery.error;
    // Show a loading state while data is being fetched
    if (isLoading && !error) {
        return (_jsx(Container, { maxWidth: "lg", children: _jsxs(Box, { sx: { my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }, children: [_jsx(CircularProgress, { size: 40, sx: { mb: 3 } }), _jsx(Typography, { variant: "h6", children: "Loading inventory data..." })] }) }));
    }
    return (_jsx(Container, { maxWidth: "lg", children: _jsxs(Box, { sx: { my: 4 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "Inventory Management" }), _jsx(Button, { variant: "contained", color: "primary", startIcon: isExporting ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : _jsx(DownloadIcon, {}), onClick: handleExportData, disabled: isExporting || isLoading || !!error, children: "Export CSV" })] }), error && error.message.includes('does not exist') && (_jsx(Alert, { severity: "warning", sx: { mb: 3 }, action: _jsx(Button, { color: "inherit", size: "small", component: Link, to: "/inventory-setup", children: "Setup Tables" }), children: "Database tables not found. Please run the setup utility to create the required tables." })), _jsxs(StyledPaper, { children: [_jsx(Box, { sx: { borderBottom: 1, borderColor: 'divider' }, children: _jsxs(Tabs, { value: tabValue, onChange: handleTabChange, "aria-label": "inventory tabs", children: [_jsx(Tab, { label: "Purchases", ...a11yProps(0) }), _jsx(Tab, { label: "Sales to Customers", ...a11yProps(1) }), _jsx(Tab, { label: "Salon Consumption", ...a11yProps(2) })] }) }), _jsx(TabPanel, { value: tabValue, index: 0, children: _jsx(PurchaseTab, { purchases: purchasesQuery.data || [], isLoading: purchasesQuery.isLoading, error: purchasesQuery.error }) }), _jsx(TabPanel, { value: tabValue, index: 1, children: _jsx(SalesTab, { sales: salesQuery.data || [], isLoading: salesQuery.isLoading, error: salesQuery.error }) }), _jsx(TabPanel, { value: tabValue, index: 2, children: _jsx(ConsumptionTab, { consumption: consumptionQuery.data || [], isLoading: consumptionQuery.isLoading, error: consumptionQuery.error }) })] })] }) }));
};
export default Inventory;
