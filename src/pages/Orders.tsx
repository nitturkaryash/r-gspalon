import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Button,
  Grid,
  Divider,
  ButtonGroup,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Spa as SpaIcon,
  Inventory as InventoryIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material'
import { useOrders } from '../hooks/useOrders'
import { formatCurrency } from '../utils/format'
import { AccessibleDialog } from '../components/AccessibleDialog'
import { exportToCSV, exportToPDF, formatOrdersForExport, orderExportHeaders } from '../utils/exportUtils'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../hooks/usePOS'

export default function Orders() {
  const { orders, isLoading } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order)
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    // Clear the selected order after dialog closes
    setTimeout(() => setSelectedOrder(null), 300)
  }

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) return;
    
    const formattedOrders = formatOrdersForExport(filteredOrders);
    exportToCSV(formattedOrders, 'salon-orders-export', orderExportHeaders);
  }

  const handleExportPDF = () => {
    if (!orders || orders.length === 0) return;
    
    const formattedOrders = formatOrdersForExport(filteredOrders);
    exportToPDF(
      formattedOrders, 
      'salon-orders-export', 
      orderExportHeaders, 
      'Salon Orders Report'
    );
  }

  // Determine purchase type for an order
  const getPurchaseType = (order: any) => {
    if (!order.services || order.services.length === 0) return 'unknown';
    
    const hasServices = order.services.some((service: any) => !service.type || service.type === 'service');
    const hasProducts = order.services.some((service: any) => service.type === 'product');
    
    if (hasServices && hasProducts) return 'both';
    if (hasProducts) return 'product';
    return 'service';
  };

  // Filter orders based on search query and payment method filter
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Payment method filter
      const paymentMethodMatch = paymentFilter === 'all' || order.payment_method === paymentFilter;
      
      // Search query filter (case insensitive)
      const query = searchQuery.toLowerCase();
      const searchMatch = 
        !searchQuery || 
        order.id.toLowerCase().includes(query) || 
        order.client_name.toLowerCase().includes(query) || 
        order.stylist_name.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.payment_method.toLowerCase().includes(query) ||
        order.total.toString().includes(query);
      
      return paymentMethodMatch && searchMatch;
    });
  }, [orders, searchQuery, paymentFilter]);

  // Render purchase type chip
  const renderPurchaseTypeChip = (type: string) => {
    switch (type) {
      case 'service':
        return (
          <Chip 
            icon={<SpaIcon />}
            label="Service" 
            size="small" 
            color="primary"
          />
        );
      case 'product':
        return (
          <Chip 
            icon={<InventoryIcon />}
            label="Product" 
            size="small" 
            color="secondary"
          />
        );
      case 'both':
        return (
          <Chip 
            icon={<ShoppingBagIcon />}
            label="Service & Product" 
            size="small" 
            color="success"
          />
        );
      default:
        return (
          <Chip 
            label="Unknown" 
            size="small" 
            color="default"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h1" gutterBottom sx={{ mb: 0 }}>Orders</Typography>
        
        {orders && orders.length > 0 && (
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Export to CSV">
              <Button
                onClick={handleExportCSV}
                startIcon={<CsvIcon />}
                aria-label="Export to CSV"
              >
                CSV
              </Button>
            </Tooltip>
            <Tooltip title="Export to PDF">
              <Button
                onClick={handleExportPDF}
                startIcon={<PdfIcon />}
                aria-label="Export to PDF"
              >
                PDF
              </Button>
            </Tooltip>
          </ButtonGroup>
        )}
      </Box>
      
      {/* Search and filter controls */}
      {orders && orders.length > 0 && (
        <Box mb={3} display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: '250px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: '200px' }} size="small">
            <InputLabel id="payment-filter-label">Payment Method</InputLabel>
            <Select
              labelId="payment-filter-label"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              label="Payment Method"
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Payment Methods</MenuItem>
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {filteredOrders.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Stylist</TableCell>
                <TableCell>Purchase Type</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {order.id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>{order.stylist_name}</TableCell>
                  <TableCell>
                    {renderPurchaseTypeChip(getPurchaseType(order))}
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status} 
                      color={order.status === 'completed' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod] || 
                      order.payment_method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleViewDetails(order)}
                      size="small"
                      aria-label={`View details for order ${order.id.substring(0, 8)}`}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {orders && orders.length > 0 
              ? 'No orders match your search criteria. Try adjusting your filters.'
              : 'No orders found. Orders from the POS system will appear here.'}
          </Typography>
        </Paper>
      )}

      {/* Order Details Dialog - Using the accessible dialog component */}
      {selectedOrder && (
        <AccessibleDialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
          title="Order Details"
          titleIcon={<ReceiptIcon />}
          actions={
            <Button 
              onClick={handleCloseDetails} 
              color="primary" 
              variant="contained"
            >
              Close
            </Button>
          }
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Order Information</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Order ID:</strong> {selectedOrder.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Customer:</strong> {selectedOrder.client_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Stylist:</strong> {selectedOrder.stylist_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Purchase Type:</strong> <Box component="span" sx={{ ml: 1 }}>{renderPurchaseTypeChip(getPurchaseType(selectedOrder))}</Box>
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedOrder.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Method:</strong> {PAYMENT_METHOD_LABELS[selectedOrder.payment_method as PaymentMethod] ||
                    selectedOrder.payment_method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Typography>
                {selectedOrder.appointment_time && (
                  <Typography variant="body2">
                    <strong>Appointment Time:</strong> {new Date(selectedOrder.appointment_time).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Payment Summary</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(selectedOrder.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">GST (18%):</Typography>
                  <Typography variant="body2">{formatCurrency(selectedOrder.tax)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" color="error">-{formatCurrency(selectedOrder.discount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Total:</Typography>
                  <Typography variant="subtitle2" color="primary">{formatCurrency(selectedOrder.total)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Services</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.services.map((service: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{service.service_name}</TableCell>
                        <TableCell align="right">{formatCurrency(service.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </AccessibleDialog>
      )}
    </Box>
  )
} 