import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AccessibleDialogProps extends Omit<DialogProps, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
  disableCloseButton?: boolean;
}

/**
 * An accessible dialog component that properly handles focus management
 * and implements WAI-ARIA design patterns
 */
export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  title,
  description,
  actions,
  onClose,
  children,
  disableCloseButton = false,
  ...dialogProps
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `accessible-dialog-title-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = `accessible-dialog-description-${Math.random().toString(36).substr(2, 9)}`;

  // Focus the close button when the dialog opens
  useEffect(() => {
    if (dialogProps.open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [dialogProps.open]);

  return (
    <Dialog
      {...dialogProps}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      keepMounted={false} // Don't keep the dialog in the DOM when closed
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle 
        id={titleId} 
        sx={{ 
          m: 0, 
          p: 2.5,
          fontSize: '1.2rem',
          fontWeight: 600,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {!disableCloseButton && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            ref={closeButtonRef}
            edge="end"
            sx={{ 
              color: 'text.secondary',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent 
        dividers 
        id={descriptionId}
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderBottom: actions ? '1px solid' : 'none',
          borderColor: 'divider'
        }}
      >
        {children}
      </DialogContent>
      {actions && <DialogActions sx={{ p: 2.5 }}>{actions}</DialogActions>}
    </Dialog>
  );
}; 