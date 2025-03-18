import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Divider, Link, Grid } from '@mui/material';
import { Container } from '@mui/material';
import { setupProductTables, checkProductTablesExist } from '../utils/supabase/setupProductTables';
import sqlScript from '../utils/supabase/product_tables.sql?raw';
import { toast } from 'react-toastify';
import { debugSupabase } from '../utils/supabase/debugSupabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
const ProductSetup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [tablesExist, setTablesExist] = useState(null);
    const [showSql, setShowSql] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState(null);
    const [isDebugging, setIsDebugging] = useState(false);
    const [isRefreshingSession, setIsRefreshingSession] = useState(false);
    const navigate = useNavigate();
    const { refreshSession } = useAuth();
    const handleSetupTables = async () => {
        setIsLoading(true);
        setStatus('idle');
        setMessage('');
        try {
            // Try to refresh the session first
            try {
                await refreshSession();
            }
            catch (error) {
                console.error('Failed to refresh session:', error);
                throw new Error('Authentication error. Please log in again.');
            }
            await setupProductTables();
            setStatus('success');
            setMessage('Product tables have been successfully set up in Supabase.');
            toast.success('Product tables created successfully!');
            checkIfTablesExist();
        }
        catch (error) {
            console.error('Error setting up product tables:', error);
            setStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setMessage(errorMessage);
            toast.error(`Failed to set up product tables: ${errorMessage}`);
            // If it's an authentication error, redirect to login
            if (error instanceof Error &&
                (error.message.includes('authentication') ||
                    error.message.includes('session') ||
                    error.message.includes('log in'))) {
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const checkIfTablesExist = async () => {
        try {
            const exists = await checkProductTablesExist();
            console.log('Product tables exist:', exists);
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
        toast.success('SQL script copied to clipboard!');
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
    // Try to refresh the session when the component mounts
    useEffect(() => {
        const tryRefreshSession = async () => {
            setIsRefreshingSession(true);
            try {
                await refreshSession();
            }
            catch (error) {
                console.error('Failed to refresh session:', error);
            }
            finally {
                setIsRefreshingSession(false);
            }
        };
        tryRefreshSession();
    }, [refreshSession]);
    // Check if tables exist on page load
    useEffect(() => {
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
    if (initialLoading || isRefreshingSession) {
        return (_jsx(Container, { maxWidth: "md", children: _jsxs(Box, { sx: { my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }, children: [_jsx(CircularProgress, { size: 40, sx: { mb: 3 } }), _jsx(Typography, { variant: "h6", children: isRefreshingSession ? 'Refreshing session...' : 'Checking database status...' })] }) }));
    }
    return (_jsx(Container, { maxWidth: "md", children: _jsxs(Box, { sx: { my: 4 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "Product System Setup" }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "body1", paragraph: true, children: "Before using the product management system, you need to set up the required database tables in Supabase. This utility will create the necessary tables, indexes, and policies for managing product collections and products." }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Database Status:" }), tablesExist === null ? (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CircularProgress, { size: 20, sx: { mr: 1 } }), _jsx(Typography, { children: "Checking database status..." })] })) : tablesExist ? (_jsx(Alert, { severity: "success", children: "Product tables are properly set up in your Supabase database." })) : (_jsx(Alert, { severity: "warning", children: "Product tables are not found in your Supabase database. Click the button below to set them up." }))] }), status === 'success' && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: message })), status === 'error' && (_jsxs(Alert, { severity: "error", sx: { mb: 3 }, children: ["Error: ", message] })), _jsx(Grid, { container: true, spacing: 2, children: _jsx(Grid, { item: true, children: _jsx(Button, { variant: "contained", onClick: handleSetupTables, disabled: isLoading || tablesExist === true, startIcon: isLoading && _jsx(CircularProgress, { size: 20, color: "inherit" }), children: isLoading ? 'Setting Up Tables...' : tablesExist ? 'Tables Already Exist' : 'Set Up Product Tables' }) }) })] }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Manual Setup Option" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "If the automatic setup doesn't work, you can manually run the SQL script in the Supabase SQL Editor:" }), _jsxs("ol", { children: [_jsx("li", { children: _jsxs(Typography, { paragraph: true, children: ["Log in to your Supabase dashboard at ", _jsx(Link, { href: "https://app.supabase.io", target: "_blank", rel: "noopener noreferrer", children: "https://app.supabase.io" })] }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Select your project and go to the SQL Editor" }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Create a new query and paste the SQL script below" }) }), _jsx("li", { children: _jsx(Typography, { paragraph: true, children: "Run the script to create the tables" }) })] }), _jsx(Button, { variant: "outlined", onClick: () => setShowSql(!showSql), sx: { mb: 2 }, children: showSql ? 'Hide SQL Script' : 'Show SQL Script' }), _jsx(Button, { variant: "outlined", onClick: handleCopySql, sx: { ml: 2, mb: 2 }, children: "Copy SQL Script" }), showSql && (_jsx(Box, { component: "pre", sx: {
                                p: 2,
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '0.875rem'
                            }, children: sqlScript }))] }), _jsxs(Paper, { sx: { p: 3, mb: 4 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Debug Supabase Connection" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "If you're experiencing issues with the product system, you can run a diagnostic check on your Supabase connection:" }), _jsx(Button, { variant: "outlined", color: "info", onClick: handleDebugSupabase, disabled: isDebugging, startIcon: isDebugging && _jsx(CircularProgress, { size: 20, color: "inherit" }), sx: { mb: 3 }, children: isDebugging ? 'Debugging...' : 'Run Diagnostic Check' }), debugInfo && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Diagnostic Results:" }), _jsxs(Alert, { severity: debugInfo.connection.success ? "success" : "error", sx: { mb: 2 }, children: ["Connection: ", debugInfo.connection.message] }), _jsxs(Alert, { severity: debugInfo.auth.authenticated ? "success" : "warning", sx: { mb: 2 }, children: ["Authentication: ", debugInfo.auth.message] }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Tables Status:" }), _jsx("ul", { children: Object.entries(debugInfo.tables).map(([table, exists]) => (_jsxs("li", { children: [table, ": ", exists ? '✅ Accessible' : '❌ Not accessible'] }, table))) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Connection Details:" }), _jsx(Box, { component: "pre", sx: {
                                        bgcolor: 'background.paper',
                                        p: 2,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        fontSize: '0.75rem',
                                        maxHeight: '200px'
                                    }, children: JSON.stringify(debugInfo.connection.details, null, 2) })] }))] })] }) }));
};
export default ProductSetup;
