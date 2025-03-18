import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery, Avatar, Button, Alert, Collapse, } from '@mui/material';
import { Menu as MenuIcon, Dashboard, CalendarMonth, People, Person, ShoppingCart, PointOfSale, ChevronLeft, Category, CardMembership, Logout, Inventory, Settings, Spa, Close as CloseIcon, DataObject, Storage as DatabaseIcon, } from '@mui/icons-material';
import * as FramerMotion from 'framer-motion';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
// DEVELOPMENT MODE flag
const DEVELOPMENT_MODE = true;
const drawerWidth = 240;
const menuLinks = [
    { text: 'Dashboard', path: '/dashboard', icon: _jsx(Dashboard, {}) },
    { text: 'Appointments', path: '/appointments', icon: _jsx(CalendarMonth, {}) },
    { text: 'Clients', path: '/clients', icon: _jsx(People, {}) },
    { text: 'Services', path: '/services', icon: _jsx(Category, {}) },
    { text: 'Stylists', path: '/stylists', icon: _jsx(Person, {}) },
    { text: 'Orders', path: '/orders', icon: _jsx(ShoppingCart, {}) },
    { text: 'POS', path: '/pos', icon: _jsx(PointOfSale, {}) },
    { text: 'Members', path: '/members', icon: _jsx(CardMembership, {}) },
    { text: 'Inventory', path: '/inventory', icon: _jsx(Inventory, {}) },
    { text: 'Inventory Setup', path: '/inventory-setup', icon: _jsx(Settings, {}) },
    { text: 'Database Check', path: '/database-check', icon: _jsx(DatabaseIcon, {}) },
    { text: 'Local Data', path: '/local-data', icon: _jsx(DataObject, {}) },
];
const ListItemStyled = styled(ListItem)(({ theme }) => ({
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        backgroundColor: alpha(theme.palette.salon?.olive || theme.palette.primary.main, 0.1),
        transform: 'translateY(-2px)',
    },
}));
const MenuIconStyled = styled(FramerMotion.motion.div)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});
const menuItemVariants = {
    hover: {
        scale: 1.05,
        transition: { duration: 0.2 },
    },
};
// Simple development mode layout
export default function Layout() {
    const theme = useTheme();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showDevBanner, setShowDevBanner] = useState(DEVELOPMENT_MODE);
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const handleMenuItemClick = (path) => {
        // Use window.location for navigation instead of React Router Link
        window.location.href = path;
        if (isMobile) {
            setMobileOpen(false);
        }
    };
    const handleLogout = () => {
        // Clear auth tokens and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
    };
    // Simplified user section with hardcoded development user
    const userSection = (_jsxs(Box, { sx: { p: 2, borderTop: 1, borderColor: 'divider' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(Avatar, { sx: { bgcolor: 'primary.main', mr: 2 }, children: "A" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", sx: { fontWeight: 600 }, children: "Admin User" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Administrator" })] })] }), _jsx(Button, { fullWidth: true, variant: "outlined", color: "primary", startIcon: _jsx(Logout, {}), onClick: handleLogout, sx: {
                    justifyContent: 'flex-start',
                    px: 2,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                }, children: "Logout" })] }));
    const drawer = (_jsxs(_Fragment, { children: [_jsxs(Toolbar, { sx: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: [1]
                }, children: [_jsx(Typography, { variant: "h6", noWrap: true, component: "div", color: "primary", children: "R&G Salon" }), isMobile && (_jsx(IconButton, { onClick: handleDrawerToggle, children: _jsx(ChevronLeft, {}) }))] }), _jsx(Divider, {}), _jsx(List, { sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1,
                    gap: 1,
                    flexGrow: 1
                }, children: menuLinks.map((link) => (_jsx(FramerMotion.motion.div, { whileHover: "hover", variants: menuItemVariants, style: { width: '100%' }, children: _jsx(ListItemStyled, { disablePadding: true, sx: { width: '100%' }, children: _jsxs(ListItemButton, { onClick: () => handleMenuItemClick(link.path), selected: location.pathname === link.path, sx: {
                                borderRadius: 1,
                                minHeight: '48px',
                                px: 2,
                            }, children: [_jsx(ListItemIcon, { sx: {
                                        color: location.pathname === link.path ? 'primary.main' : 'inherit',
                                        minWidth: 40,
                                    }, children: link.icon }), _jsx(ListItemText, { primary: link.text, sx: {
                                        '& .MuiListItemText-primary': {
                                            color: location.pathname === link.path ? 'primary.main' : 'inherit',
                                            fontWeight: location.pathname === link.path ? 600 : 400,
                                        }
                                    } })] }) }) }, link.text))) }), userSection] }));
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column' }, children: [_jsx(Collapse, { in: showDevBanner, children: _jsx(Alert, { severity: "info", sx: {
                        borderRadius: 0,
                        position: 'sticky',
                        top: 0,
                        zIndex: theme.zIndex.drawer + 2,
                    }, action: _jsx(IconButton, { "aria-label": "close", color: "inherit", size: "small", onClick: () => setShowDevBanner(false), children: _jsx(CloseIcon, { fontSize: "inherit" }) }), children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Development Mode:" }), " Using mock data. Database operations are simulated and stored in localStorage."] }) }) }), _jsx(AppBar, { position: "fixed", sx: {
                    display: { xs: 'flex', md: 'none' },
                    backgroundColor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 1,
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    top: showDevBanner ? '56px' : 0,
                    transition: 'top 0.3s',
                }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "primary", "aria-label": "open drawer", edge: "start", onClick: handleDrawerToggle, sx: { mr: 2 }, children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", color: "primary", children: "R&G Salon" })] }) }), _jsxs(Box, { sx: { display: 'flex', flex: 1 }, children: [_jsxs(Box, { component: "nav", sx: {
                            width: { md: drawerWidth },
                            flexShrink: { md: 0 },
                            ...(showDevBanner && {
                                '& .MuiDrawer-paper': {
                                    top: '56px',
                                    height: 'calc(100% - 56px)',
                                }
                            })
                        }, children: [_jsx(Drawer, { variant: "temporary", open: mobileOpen, onClose: handleDrawerToggle, ModalProps: { keepMounted: true }, sx: {
                                    display: { xs: 'block', md: 'none' },
                                    '& .MuiDrawer-paper': {
                                        boxSizing: 'border-box',
                                        width: drawerWidth,
                                        backgroundColor: 'background.paper',
                                        borderRight: '1px solid',
                                        borderColor: 'divider',
                                        ...(showDevBanner && {
                                            top: '56px',
                                            height: 'calc(100% - 56px)',
                                        })
                                    },
                                }, children: drawer }), _jsx(Drawer, { variant: "permanent", sx: {
                                    display: { xs: 'none', md: 'block' },
                                    '& .MuiDrawer-paper': {
                                        boxSizing: 'border-box',
                                        width: drawerWidth,
                                        backgroundColor: 'background.paper',
                                        borderRight: '1px solid',
                                        borderColor: 'divider',
                                        ...(showDevBanner && {
                                            top: '56px',
                                            height: 'calc(100% - 56px)',
                                        })
                                    },
                                }, open: true, children: drawer })] }), _jsx(Box, { component: "main", sx: {
                            flexGrow: 1,
                            p: 3,
                            width: { md: `calc(100% - ${drawerWidth}px)` },
                            mt: { xs: 8, md: 0 },
                            minHeight: '100vh',
                            backgroundColor: 'background.default',
                            ...(showDevBanner && isMobile && {
                                mt: { xs: 'calc(56px + 64px)', md: '56px' },
                            }),
                            ...(showDevBanner && !isMobile && {
                                mt: '56px',
                            }),
                        }, children: _jsx(Outlet, {}) })] })] }));
}
