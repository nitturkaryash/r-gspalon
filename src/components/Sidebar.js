import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
const Sidebar = () => {
    const location = { pathname: window.location.pathname };
    const listItemStyle = {
        padding: '10px 20px',
        borderRadius: '0 20px 20px 0',
        marginBottom: '10px',
        backgroundColor: location.pathname === '/settings' ? '#007bff' : 'transparent',
        '&:hover': {
            backgroundColor: '#007bff',
        },
    };
    return (_jsxs("div", { children: [_jsxs(ListItemButton, { component: Link, to: "/settings", selected: location.pathname === '/settings', sx: listItemStyle, children: [_jsx(ListItemIcon, { children: _jsx(SettingsIcon, {}) }), _jsx(ListItemText, { primary: "Settings" })] }), process.env.NODE_ENV === 'development' && (_jsxs(ListItemButton, { component: Link, to: "/local-data", selected: location.pathname === '/local-data', sx: listItemStyle, children: [_jsx(ListItemIcon, { children: _jsx(StorageIcon, {}) }), _jsx(ListItemText, { primary: "Local Data" })] }))] }));
};
export default Sidebar;
