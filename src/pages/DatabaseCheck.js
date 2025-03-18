import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Alert, Snackbar } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
// Development mode flag
const DEVELOPMENT_MODE = true;
// List of tables in localStorage
const LOCAL_STORAGE_TABLES = [
    'profiles',
    'services',
    'appointments',
    'stylists',
    'clients',
    'orders'
];
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (_jsx("div", { role: "tabpanel", hidden: value !== index, id: `tabpanel-${index}`, "aria-labelledby": `tab-${index}`, ...other, children: value === index && (_jsx(Box, { sx: { p: 3 }, children: children })) }));
}
export default function DatabaseCheck() {
    const [value, setValue] = useState(0);
    const [localData, setLocalData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editTable, setEditTable] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    // Load data from localStorage
    useEffect(() => {
        const loadedData = {};
        LOCAL_STORAGE_TABLES.forEach(table => {
            const storageKey = `local_${table}`;
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                try {
                    loadedData[table] = JSON.parse(storedData);
                }
                catch (error) {
                    console.error(`Error parsing ${table} data:`, error);
                    loadedData[table] = [];
                }
            }
            else {
                loadedData[table] = [];
            }
        });
        setLocalData(loadedData);
    }, []);
    const handleChange = (_event, newValue) => {
        setValue(newValue);
    };
    const handleEditClick = (item, table) => {
        setEditItem({ ...item });
        setEditTable(table);
        setIsEditing(true);
    };
    const handleAddClick = (table) => {
        // Create a new empty item with just an ID
        const newItem = {
            id: uuidv4(),
            created_at: new Date().toISOString()
        };
        setEditItem(newItem);
        setEditTable(table);
        setIsEditing(true);
    };
    const handleDeleteClick = (id, table) => {
        // Filter out the item with the given ID
        const updatedData = localData[table].filter(item => item.id !== id);
        // Update local state
        setLocalData({
            ...localData,
            [table]: updatedData
        });
        // Save to localStorage
        localStorage.setItem(`local_${table}`, JSON.stringify(updatedData));
        // Show success message
        setSnackbar({
            open: true,
            message: `Item deleted from ${table}`,
            severity: 'success'
        });
    };
    const handleDialogClose = () => {
        setIsEditing(false);
        setEditItem(null);
    };
    const handleSave = () => {
        if (!editItem || !editTable)
            return;
        const isNewItem = !localData[editTable].some(item => item.id === editItem.id);
        let updatedData;
        if (isNewItem) {
            // Add new item
            updatedData = [...localData[editTable], editItem];
        }
        else {
            // Update existing item
            updatedData = localData[editTable].map(item => item.id === editItem.id ? editItem : item);
        }
        // Update local state
        setLocalData({
            ...localData,
            [editTable]: updatedData
        });
        // Save to localStorage
        localStorage.setItem(`local_${editTable}`, JSON.stringify(updatedData));
        // Close dialog
        setIsEditing(false);
        setEditItem(null);
        // Show success message
        setSnackbar({
            open: true,
            message: isNewItem ? `New item added to ${editTable}` : `Item updated in ${editTable}`,
            severity: 'success'
        });
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditItem({
            ...editItem,
            [name]: value
        });
    };
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    // Function to render edit dialog fields based on the table
    const renderEditFields = () => {
        if (!editItem)
            return null;
        // Get all keys from the item
        const keys = Object.keys(editItem);
        // Add common fields that should be present in all items
        const commonFields = ['id', 'created_at'];
        const allKeys = Array.from(new Set([...commonFields, ...keys]));
        return allKeys.map(key => (_jsx(TextField, { margin: "dense", name: key, label: key, type: "text", fullWidth: true, variant: "outlined", value: editItem[key] || '', onChange: handleInputChange, disabled: key === 'id', sx: { mb: 2 } }, key)));
    };
    // Function to clear all data for a table
    const handleClearTable = (table) => {
        // Clear the table data
        setLocalData({
            ...localData,
            [table]: []
        });
        // Save to localStorage
        localStorage.setItem(`local_${table}`, JSON.stringify([]));
        // Show success message
        setSnackbar({
            open: true,
            message: `All data cleared from ${table}`,
            severity: 'success'
        });
    };
    return (_jsxs(Box, { children: [_jsx(PageHeader, { title: "Database Check", children: DEVELOPMENT_MODE && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Development Mode: All data is stored in localStorage. You can add, edit, or delete data here." })) }), _jsxs(Paper, { sx: { width: '100%' }, children: [_jsx(Tabs, { value: value, onChange: handleChange, indicatorColor: "primary", textColor: "primary", variant: "scrollable", scrollButtons: "auto", children: LOCAL_STORAGE_TABLES.map((table, index) => (_jsx(Tab, { label: table, id: `tab-${index}` }, table))) }), LOCAL_STORAGE_TABLES.map((table, index) => (_jsxs(TabPanel, { value: value, index: index, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 2 }, children: [_jsxs(Typography, { variant: "h6", children: [table, " Table"] }), _jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(AddIcon, {}), onClick: () => handleAddClick(table), sx: { mr: 1 }, children: "Add New" }), _jsx(Button, { variant: "outlined", color: "error", onClick: () => handleClearTable(table), children: "Clear All" })] })] }), localData[table] && localData[table].length > 0 ? (_jsx(TableContainer, { component: Paper, sx: { maxHeight: 440 }, children: _jsxs(Table, { stickyHeader: true, "aria-label": `${table} table`, size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [Object.keys(localData[table][0]).map(key => (_jsx(TableCell, { children: key }, key))), _jsx(TableCell, { children: "Actions" })] }) }), _jsx(TableBody, { children: localData[table].map((row) => (_jsxs(TableRow, { children: [Object.keys(localData[table][0]).map(key => (_jsx(TableCell, { children: typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] || '') }, `${row.id}-${key}`))), _jsxs(TableCell, { children: [_jsx(IconButton, { color: "primary", onClick: () => handleEditClick(row, table), size: "small", children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { color: "error", onClick: () => handleDeleteClick(row.id, table), size: "small", children: _jsx(DeleteIcon, { fontSize: "small" }) })] })] }, row.id))) })] }) })) : (_jsxs(Box, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { variant: "body1", sx: { mb: 2 }, children: "No data available" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Click \"Add New\" to create your first entry in this table." })] }))] }, table)))] }), _jsxs(Dialog, { open: isEditing, onClose: handleDialogClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editItem && editItem.id ? 'Edit Item' : 'Add New Item' }), _jsx(DialogContent, { children: renderEditFields() }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleDialogClose, children: "Cancel" }), _jsx(Button, { onClick: handleSave, variant: "contained", color: "primary", children: "Save" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 6000, onClose: handleCloseSnackbar, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: handleCloseSnackbar, severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }));
}
