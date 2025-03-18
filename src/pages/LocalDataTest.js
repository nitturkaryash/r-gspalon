import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Divider, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PageHeader from '../components/PageHeader';
import LocalDataDebugger from '../components/LocalDataDebugger';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
// List of tables in localStorage
const LOCAL_STORAGE_TABLES = [
    'profiles',
    'services',
    'appointments',
    'stylists',
    'clients',
    'orders'
];
export default function LocalDataTest() {
    const [selectedTable, setSelectedTable] = useState('services');
    const [operation, setOperation] = useState('select');
    const [queryParams, setQueryParams] = useState({
        column: 'id',
        value: '',
        updateData: '{}'
    });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [refreshDebugger, setRefreshDebugger] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const handleTableChange = (event) => {
        setSelectedTable(event.target.value);
        // Reset result and error
        setResult(null);
        setError(null);
    };
    const handleOperationChange = (event) => {
        setOperation(event.target.value);
        // Reset result and error
        setResult(null);
        setError(null);
    };
    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setQueryParams({
            ...queryParams,
            [name]: value
        });
    };
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    const executeQuery = async () => {
        try {
            setError(null);
            setResult(null);
            let response;
            switch (operation) {
                case 'select':
                    response = await supabase
                        .from(selectedTable)
                        .select()
                        .eq(queryParams.column, queryParams.value);
                    break;
                case 'insert':
                    try {
                        const insertData = JSON.parse(queryParams.updateData);
                        response = await supabase
                            .from(selectedTable)
                            .insert(insertData);
                    }
                    catch (e) {
                        throw new Error(`Invalid JSON for insert: ${e instanceof Error ? e.message : String(e)}`);
                    }
                    break;
                case 'update':
                    try {
                        const updateData = JSON.parse(queryParams.updateData);
                        response = await supabase
                            .from(selectedTable)
                            .update(updateData)
                            .eq(queryParams.column, queryParams.value);
                    }
                    catch (e) {
                        throw new Error(`Invalid JSON for update: ${e instanceof Error ? e.message : String(e)}`);
                    }
                    break;
                case 'delete':
                    response = await supabase
                        .from(selectedTable)
                        .delete()
                        .eq(queryParams.column, queryParams.value);
                    break;
                default:
                    throw new Error('Invalid operation');
            }
            if (response.error) {
                throw new Error(response.error.message);
            }
            setResult(response.data);
            setSnackbar({
                open: true,
                message: `Operation ${operation} completed successfully`,
                severity: 'success'
            });
            // Refresh the debugger
            setRefreshDebugger(prev => prev + 1);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error occurred');
            setSnackbar({
                open: true,
                message: e instanceof Error ? e.message : 'Unknown error occurred',
                severity: 'error'
            });
        }
    };
    // Helper function to generate example data for insert/update
    const generateExampleData = () => {
        let exampleData = {};
        switch (selectedTable) {
            case 'services':
                exampleData = {
                    name: `Service ${Math.floor(Math.random() * 1000)}`,
                    description: 'Example service description',
                    duration: 30,
                    price: 5000,
                    category: 'Example',
                    active: true
                };
                break;
            case 'clients':
                exampleData = {
                    profile_id: uuidv4(),
                    phone: '555-123-4567',
                    preferences: 'Example preferences',
                    last_visit: new Date().toISOString()
                };
                break;
            case 'appointments':
                exampleData = {
                    client_id: '1',
                    stylist_id: '1',
                    service_id: '1',
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    status: 'scheduled',
                    notes: 'Example appointment',
                    paid: false
                };
                break;
            default:
                exampleData = {
                    name: 'Example',
                    description: 'Example description'
                };
        }
        setQueryParams({
            ...queryParams,
            updateData: JSON.stringify(exampleData, null, 2)
        });
    };
    return (_jsxs(Box, { children: [_jsx(PageHeader, { title: "Local Data Test", children: _jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "This page allows you to test CRUD operations with localStorage data and verify routing." }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Test Operations" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { id: "table-select-label", children: "Table" }), _jsx(Select, { labelId: "table-select-label", value: selectedTable, label: "Table", onChange: handleTableChange, children: LOCAL_STORAGE_TABLES.map(table => (_jsx(MenuItem, { value: table, children: table }, table))) })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { id: "operation-select-label", children: "Operation" }), _jsxs(Select, { labelId: "operation-select-label", value: operation, label: "Operation", onChange: handleOperationChange, children: [_jsx(MenuItem, { value: "select", children: "Select" }), _jsx(MenuItem, { value: "insert", children: "Insert" }), _jsx(MenuItem, { value: "update", children: "Update" }), _jsx(MenuItem, { value: "delete", children: "Delete" })] })] }) }), (operation === 'select' || operation === 'update' || operation === 'delete') && (_jsxs(_Fragment, { children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Column", name: "column", value: queryParams.column, onChange: handleParamChange, margin: "normal" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Value", name: "value", value: queryParams.value, onChange: handleParamChange, margin: "normal" }) })] })), (operation === 'insert' || operation === 'update') && (_jsxs(Grid, { item: true, xs: 12, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Data (JSON)" }), _jsx(Button, { size: "small", variant: "outlined", onClick: generateExampleData, children: "Generate Example" })] }), _jsx(TextField, { fullWidth: true, multiline: true, rows: 6, name: "updateData", value: queryParams.updateData, onChange: handleParamChange, margin: "normal", variant: "outlined" })] })), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Button, { variant: "contained", color: "primary", onClick: executeQuery, fullWidth: true, children: ["Execute ", operation] }) })] })] }), _jsxs(Paper, { sx: { p: 3, mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Result" }), error ? (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })) : result ? (_jsx("pre", { style: {
                                            overflow: 'auto',
                                            maxHeight: '300px',
                                            backgroundColor: '#f1f1f1',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }, children: JSON.stringify(result, null, 2) })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Execute an operation to see results" }))] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Current Data State" }), _jsx(LocalDataDebugger, { tableName: selectedTable, title: "Current Table Data" }, `${selectedTable}-${refreshDebugger}`), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "h6", gutterBottom: true, children: "Related Tables" }), LOCAL_STORAGE_TABLES.filter(table => table !== selectedTable).map(table => (_jsx(LocalDataDebugger, { tableName: table, title: "Related Table" }, `${table}-${refreshDebugger}`)))] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 6000, onClose: handleCloseSnackbar, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: handleCloseSnackbar, severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }));
}
