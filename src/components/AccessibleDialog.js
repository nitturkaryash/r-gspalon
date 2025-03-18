import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography, } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
/**
 * An accessible dialog component that properly handles focus management
 * and ARIA attributes to avoid accessibility issues.
 */
export const AccessibleDialog = ({ title, children, actions, onClose, titleIcon, ...dialogProps }) => {
    const closeButtonRef = useRef(null);
    const titleId = `accessible-dialog-title-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = `accessible-dialog-description-${Math.random().toString(36).substr(2, 9)}`;
    // Focus the close button when the dialog opens
    useEffect(() => {
        if (dialogProps.open && closeButtonRef.current) {
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        }
    }, [dialogProps.open]);
    return (_jsxs(Dialog, { ...dialogProps, onClose: onClose, "aria-labelledby": titleId, "aria-describedby": descriptionId, 
        // Ensure proper focus management
        disableEnforceFocus: false, 
        // Don't keep the dialog in the DOM when closed
        keepMounted: false, 
        // Use the portal to render outside the DOM hierarchy
        disablePortal: false, 
        // Ensure focus is properly restored
        disableRestoreFocus: false, 
        // Ensure proper focus trap
        disableAutoFocus: false, children: [_jsx(DialogTitle, { id: titleId, sx: { m: 0, p: 2 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [titleIcon && _jsx(Box, { sx: { mr: 1 }, children: titleIcon }), _jsx(Typography, { variant: "h6", component: "span", children: title })] }), _jsx(IconButton, { "aria-label": "close", onClick: onClose, ref: closeButtonRef, edge: "end", size: "small", tabIndex: 0, children: _jsx(CloseIcon, {}) })] }) }), _jsx(DialogContent, { dividers: true, id: descriptionId, children: children }), actions && _jsx(DialogActions, { children: actions })] }));
};
