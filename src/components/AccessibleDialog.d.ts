import React from 'react';
import { DialogProps } from '@mui/material';
interface AccessibleDialogProps extends Omit<DialogProps, 'title'> {
    title: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    onClose: () => void;
    titleIcon?: React.ReactNode;
}
/**
 * An accessible dialog component that properly handles focus management
 * and ARIA attributes to avoid accessibility issues.
 */
export declare const AccessibleDialog: React.FC<AccessibleDialogProps>;
export {};
