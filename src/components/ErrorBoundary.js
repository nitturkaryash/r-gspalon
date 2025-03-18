import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: _jsxs(Paper, { sx: { p: 4, maxWidth: 500, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h5", color: "error", gutterBottom: true, children: "Something went wrong" }), _jsx(Typography, { variant: "body1", paragraph: true, children: this.state.error?.message || 'An unexpected error occurred' }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Button, { variant: "contained", color: "primary", component: Link, to: "/", sx: { mr: 2 }, children: "Go to Dashboard" }), _jsx(Button, { variant: "outlined", onClick: () => {
                                        this.setState({ hasError: false, error: null });
                                        window.location.reload();
                                    }, children: "Reload Page" })] })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
