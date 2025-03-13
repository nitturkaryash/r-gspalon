import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  Grid,
} from '@mui/material';
import {
  DeleteOutlined as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PaymentMethod, PaymentDetail } from '../../hooks/usePOS';
import { Order } from '../../hooks/usePOS';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-toastify';

// Icons for different payment methods
const PaymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <span>💵</span>,
  credit_card: <span>💳</span>,
  debit_card: <span>💳</span>,
  upi: <span>📱</span>,
  bnpl: <span>⏱️</span>,
};

interface CompletePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onCompletePayment: (orderId: string, paymentDetails: PaymentDetail) => Promise<void>;
}

export default function CompletePaymentDialog({
  open,
  onClose,
  order,
  onCompletePayment,
}: CompletePaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && order) {
      setPaymentMethod('cash');
      setPaymentAmount(order.pending_amount);
      setPaymentNote('');
    }
  }, [open, order]);

  const handleSubmit = async () => {
    if (!order) return;
    
    // Validate payment amount
    if (paymentAmount <= 0 || paymentAmount > order.pending_amount) {
      toast.error('Invalid payment amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create new payment record
      const newPayment: PaymentDetail = {
        id: (Math.random() * 1000000).toString(), // Temporary ID - will be replaced on server
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        payment_note: paymentNote || undefined,
      };
      
      // Update the order with the new payment
      await onCompletePayment(order.id, newPayment);
      
      // Close the dialog
      onClose();
      
      // Show success message
      toast.success('Payment completed successfully');
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Failed to complete payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog 
      open={open} 
      onClose={!isProcessing ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Complete Payment</Typography>
          {!isProcessing && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Order Details
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Order ID</strong></TableCell>
                    <TableCell>{order.id.slice(0, 8)}...</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell>{order.client_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total Amount</strong></TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Pending Amount</strong></TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {formatCurrency(order.pending_amount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Existing Payments
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 200 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.payments.map((payment, index) => (
                    <TableRow key={payment.id || index}>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: 8 }}>
                            {PaymentIcons[payment.payment_method]}
                          </span>
                          {PAYMENT_METHOD_LABELS[payment.payment_method]}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {order.payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No payments recorded
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Complete Payment
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Payment Amount"
                  type="number"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 1, max: order.pending_amount }}
                  helperText={`Max: ${formatCurrency(order.pending_amount)}`}
                  margin="normal"
                  disabled={isProcessing}
                  required
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    label="Payment Method"
                    disabled={isProcessing}
                  >
                    {PAYMENT_METHODS.filter(method => method !== 'bnpl').map((method) => (
                      <MenuItem key={method} value={method}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: 8 }}>
                            {PaymentIcons[method]}
                          </span>
                          {PAYMENT_METHOD_LABELS[method]}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Payment Note (Optional)"
                  fullWidth
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  margin="normal"
                  disabled={isProcessing}
                  placeholder="e.g., Reference number, transaction ID, etc."
                />
              </Box>
              
              {paymentAmount < order.pending_amount && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    This is a partial payment. {formatCurrency(order.pending_amount - paymentAmount)} will remain as pending.
                  </Typography>
                </Alert>
              )}
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Completing this payment will update the customer's payment history.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={paymentAmount <= 0 || paymentAmount > order.pending_amount || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Complete Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 