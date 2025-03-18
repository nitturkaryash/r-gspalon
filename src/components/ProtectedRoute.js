import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
export default function ProtectedRoute({ children }) {
    // During development, we'll skip auth checks
    // const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    useEffect(() => {
        // Short timeout to ensure smooth transition
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);
    if (isChecking) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", children: _jsx(CircularProgress, {}) }));
    }
    // During development, we'll skip auth checks and always render children
    // if (!isAuthenticated) {
    //   console.log('Not authenticated, redirecting to login from:', location.pathname);
    //   return <Navigate to="/login" state={{ from: location }} replace />;
    // }
    return _jsx(_Fragment, { children: children });
}
