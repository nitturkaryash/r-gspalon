import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Divider, Link, Grid } from '@mui/material';
import { Container } from '@mui/material';
import { setupInventoryTables, checkInventoryTablesExist } from '../utils/supabase/setupInventoryTables';
import { testInventoryTables, insertTestPurchase, checkTableData } from '../utils/supabase/testTables';
import sqlScript from '../utils/supabase/inventory_tables.sql?raw';
import { toast } from 'react-toastify';
import { debugSupabase } from '../utils/supabase/debugSupabase';
const InventorySetup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [tablesExist, setTablesExist] = useState(null);
    const [showSql, setShowSql] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [isTestingTables, setIsTestingTables] = useState(false);
    const [isInsertingTestData, setIsInsertingTestData] = useState(false);
    const [tableData, setTableData] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState(null);
    const [isDebugging, setIsDebugging] = useState(false);
    const handleSetupTables = async () => {
        setIsLoading(true);
        setStatus('idle');
        setMessage('');
        try {
            await setupInventoryTables();
            setStatus('success');
            setMessage('Inventory tables have been successfully set up in Supabase.');
            toast.success('Inventory tables created successfully!');
            checkIfTablesExist();
        }
        catch (error) {
            console.error('Error setting up inventory tables:', error);
            setStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setMessage(errorMessage);
            toast.error(`Failed to set up inventory tables: ${errorMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const checkIfTablesExist = async () => {
        try {
            const exists = await checkInventoryTablesExist();
            console.log('Inventory tables exist:', exists);
            setTablesExist(exists);
        }
        catch (error) {
            console.error('Error checking if tables exist:', error);
            setTablesExist(false);
        }
        finally {
            setInitialLoading(false);
        }
    };
    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlScript);
        alert('SQL script copied to clipboard!');
    };
    const handleTestTables = async () => {
        setIsTestingTables(true);
        try {
            const results = await testInventoryTables();
            setTestResults(results);
            // Also check table data
            const data = await checkTableData();
            setTableData(data);
            // Show success toast if all tables exist
            if (results.purchasesExists && results.salesExists && results.consumptionExists && results.balanceStockExists) {
                toast.success('All inventory tables and views are properly set up!');
            }
            else {
                toast.warning('Some inventory tables or views are missing. Please check the test results.');
            }
        }
        catch (error) {
            console.error('Error testing tables:', error);
            toast.error('Failed to test inventory tables: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
        finally {
            setIsTestingTables(false);
        }
    };
    const handleInsertTestData = async () => {
        setIsInsertingTestData(true);
        try {
            const success = await insertTestPurchase();
            if (success) {
                toast.success('Test purchase record inserted successfully!');
                // Refresh table data
                const data = await checkTableData();
                setTableData(data);
            }
            else {
                toast.error('Failed to insert test purchase record.');
            }
        }
        catch (error) {
            console.error('Error inserting test data:', error);
            toast.error('Error inserting test data: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
        finally {
            setIsInsertingTestData(false);
        }
    };
    const handleDebugSupabase = async () => {
        setIsDebugging(true);
        try {
            const debug = await debugSupabase();
            setDebugInfo(debug);
            if (debug.success) {
                toast.success('Supabase connection is working properly');
            }
            else {
                toast.warning('Supabase connection has issues. Check the debug information.');
            }
        }
        catch (error) {
            console.error('Error debugging Supabase:', error);
            toast.error('Failed to debug Supabase: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
        finally {
            setIsDebugging(false);
        }
    };
    // Check if tables exist on page load
    React.useEffect(() => {
        // Wrap in a try-catch to prevent unhandled promise rejections
        const checkTables = async () => {
            try {
                await checkIfTablesExist();
            }
            catch (error) {
                console.error('Error in initial table check:', error);
                setTablesExist(false);
                setInitialLoading(false);
            }
        };
        checkTables();
    }, []);
    // Show a loading state while initial check is happening
    if (initialLoading) {
        return (_jsx(Container, { maxWidth: "md", children: _jsxs(Box, { sx: { my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }, children: [_jsx(CircularProgress, { size: 40, sx: { mb: 3 } }), _jsx(Typography, { variant: "h6", children: "Checking database status..." })] }) }));
    }
    return (_jsx(Container, { maxWidth: "md", children: _jsxs(Box, { sx: { my: 4 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "Inventory System Setup" }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "body1", paragraph: true, children: "Before using the inventory management system, you need to set up the required database tables in Supabase. This utility will create the necessary tables, indexes, and views for tracking purchases, sales, consumption, and balance stock." }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Database Status:" }), tablesExist === null ? (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CircularProgress, { size: 20, sx: { mr: 1 } }), _jsx(Typography, { children: "Checking database status..." })] })) : tablesExist ? (_jsx(Alert, { severity: "success", children: "Inventory tables are properly set up in your Supabase database." })) : (_jsx(Alert, { severity: "warning", children: "Inventory tables are not found in your Supabase database. Click the button below to set them up." }))] }), status === 'success' && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: message })), status === 'error' && (_jsxs(Alert, { severity: "error", sx: { mb: 3 }, children: ["Error: ", message] })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, children: _jsx(Button, { variant: "contained", onClick: handleSetupTables, disabled: isLoading || tablesExist === true, startIcon: isLoading && _jsx(CircularProgress, { size: 20, color: "inherit" }), children: isLoading ? 'Setting Up Tables...' : tablesExist ? 'Tables Already Exist' : 'Set Up Inventory Tables' }) }), _jsx(Grid, { item: true, children: _jsx(Button, { variant: "outlined", onClick: handleTestTables, disabled: isTestingTables, startIcon: isTestingTables && _jsx(CircularProgress, { size: 20, color: "inherit" }), children: isTestingTables ? 'Testing...' : 'Test Tables' }) }), _jsx(Grid, { item: true, children: _jsx(Button, { variant: "outlined", onClick: handleInsertTestData, disabled: isInsertingTestData || !tablesExist, startIcon: isInsertingTestData && _jsx(CircularProgress, { size: 20, color: "inherit" }), children: isInsertingTestData ? 'Inserting...' : 'Insert Test Data' }) })] }), testResults && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Test Results:" }), _jsxs("ul", { children: [_jsxs("li", { children: ["Purchases Table: ", testResults.purchasesExists ? '✅ Exists' : '❌ Missing'] }), _jsxs("li", { children: ["Sales Table: ", testResults.salesExists ? '✅ Exists' : '❌ Missing'] }), _jsxs("li", { children: ["Consumption Table: ", testResults.consumptionExists ? '✅ Exists' : '❌ Missing'] }), _jsxs("li", { children: ["Balance Stock View: ", testResults.balanceStockExists ? '✅ Exists' : '❌ Missing'] })] })] })), tableData && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Table Data:" }), _jsxs("ul", { children: [_jsxs("li", { children: ["Purchases Count: ", tableData.purchasesCount] }), _jsxs("li", { children: ["Sales Count: ", tableData.salesCount] }), _jsxs("li", { children: ["Consumption Count: ", tableData.consumptionCount] })] })] }))] }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Manual Setup Option" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "If the automatic setup doesn't work, you can manually run the SQL script in the Supabase SQL Editor:" }), _jsxs("ol", { children: [_jsx("li", { children: _jsxs(Typography, { paragraph: true, children: ["Log in to your Supabase dashboard at ", _jsx(Link, { href: "https://app.supabase.io", target: "_blank", rel: "noopener noreferrer", children: "https://app.supabase.io" })] }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Select your project and go to the SQL Editor" }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Copy the SQL script below and paste it into the SQL Editor" }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Click \"Run\" to execute the script" }) })] }), _jsx(Button, { variant: "outlined", onClick: handleCopySql, sx: { mb: 2 }, children: "Copy SQL Script" }), _jsx(Button, { variant: "text", onClick: () => setShowSql(!showSql), sx: { ml: 2, mb: 2 }, children: showSql ? 'Hide SQL' : 'Show SQL' }), showSql && (_jsx(Box, { component: "pre", sx: {
                                p: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '0.875rem'
                            }, children: sqlScript }))] }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Debug Supabase Connection" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "If you're experiencing issues with the inventory system, you can run a diagnostic check on your Supabase connection:" }), _jsx(Button, { variant: "outlined", color: "info", onClick: handleDebugSupabase, disabled: isDebugging, startIcon: isDebugging && _jsx(CircularProgress, { size: 20, color: "inherit" }), sx: { mb: 3 }, children: isDebugging ? 'Debugging...' : 'Run Diagnostic Check' }), debugInfo && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Diagnostic Results:" }), _jsxs(Alert, { severity: debugInfo.connection.success ? "success" : "error", sx: { mb: 2 }, children: ["Connection: ", debugInfo.connection.message] }), _jsxs(Alert, { severity: debugInfo.auth.authenticated ? "success" : "warning", sx: { mb: 2 }, children: ["Authentication: ", debugInfo.auth.message] }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Tables Status:" }), _jsx("ul", { children: Object.entries(debugInfo.tables).map(([table, exists]) => (_jsxs("li", { children: [table, ": ", exists ? '✅ Accessible' : '❌ Not accessible'] }, table))) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Connection Details:" }), _jsx(Box, { component: "pre", sx: {
                                        bgcolor: 'background.paper',
                                        p: 2,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        fontSize: '0.75rem',
                                        maxHeight: '200px'
                                    }, children: JSON.stringify(debugInfo.connection.details, null, 2) })] }))] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Next Steps:" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "After setting up the tables, return to the Inventory page to start using the system. You'll be able to:" }), _jsxs("ul", { children: [_jsx("li", { children: "Add purchase records manually" }), _jsx("li", { children: "Sync sales data from your POS" }), _jsx("li", { children: "Track salon consumption" }), _jsx("li", { children: "Export consolidated inventory data to CSV" })] })] })] }) }));
};
export default InventorySetup;
