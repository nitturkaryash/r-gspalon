import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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
export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  title,
  children,
  actions,
  onClose,
  titleIcon,
  ...dialogProps
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  return (
    <Dialog
      {...dialogProps}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Ensure proper focus management
      disableEnforceFocus={false}
      // Don't keep the dialog in the DOM when closed
      keepMounted={false}
      // Use the portal to render outside the DOM hierarchy
      disablePortal={false}
      // Ensure focus is properly restored
      disableRestoreFocus={false}
      // Ensure proper focus trap
      disableAutoFocus={false}
    >
      <DialogTitle id={titleId} sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {titleIcon && <Box sx={{ mr: 1 }}>{titleIcon}</Box>}
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            ref={closeButtonRef}
            edge="end"
            size="small"
            tabIndex={0}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers id={descriptionId}>
        {children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}; 