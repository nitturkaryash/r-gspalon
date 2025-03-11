import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Autocomplete,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  Collapse,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  DeleteOutline as DeleteOutlineIcon,
  CreditCard as CreditCardIcon,
  LocalAtm as LocalAtmIcon,
  QrCode as QrCodeIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  ContentCut as ContentCutIcon,
  Search as SearchIcon,
  ShoppingBasket as ShoppingBasketIcon,
  DeleteOutlined,
  CreditCard,
  Payment,
  MoneyOff,
} from '@mui/icons-material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { usePOS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod, PaymentDetail } from '../hooks/usePOS'
import { useStylists } from '../hooks/useStylists'
import { useServices } from '../hooks/useServices'
import { useClients } from '../hooks/useClients'
import { useServiceCollections } from '../hooks/useServiceCollections'
import { useCollectionServices } from '../hooks/useCollectionServices'
import { useCollections } from '../hooks/useCollections'
import { formatCurrency } from '../utils/format'
import { playCashRegisterSound } from '../assets/sounds/cash-register'
import { toast } from 'react-toastify'

// Tab interface for switching between appointment payments and walk-in sales
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pos-tabpanel-${index}`}
      aria-labelledby={`pos-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Define POSService interface for this component
interface POSService {
  id: string;
  name: string;
  price: number;
  duration?: number;
  type?: 'service' | 'product';
}

// Update OrderItem interface to include customPrice
interface OrderItem {
  service: POSService;
  quantity: number;
  type: 'service' | 'product';
  customPrice?: number; // Add customPrice property
}

// Payment icon mapping
const PaymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <LocalAtmIcon />,
  credit_card: <CreditCardIcon />,
  debit_card: <CreditCardIcon />,
  upi: <QrCodeIcon />,
  bnpl: <CalendarTodayIcon />,
};

export default function POS() {
  // Get location for accessing navigation state
  const location = useLocation();
  const appointmentData = location.state?.appointmentData;
  
  // Data hooks
  const { 
    unpaidAppointments, 
    isLoading, 
    processAppointmentPayment, 
    createWalkInOrder,
    calculateTotal 
  } = usePOS();
  const { stylists, isLoading: loadingStylists } = useStylists();
  const { services: allServices, isLoading: loadingServices } = useServices();
  const { serviceCollections, isLoading: loadingServiceCollections } = useServiceCollections();
  const { services: collectionServices, isLoading: loadingCollectionServices } = useCollectionServices();
  const { collections, isLoading: loadingCollections } = useCollections();
  const { clients, isLoading: loadingClients } = useClients();
  
  // State for order items and tabs
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [walkInDiscount, setWalkInDiscount] = useState(0)
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<PaymentMethod>('cash')
  const [processing, setProcessing] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  
  // State for split payment
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<PaymentDetail[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('cash');
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  
  // State for services and products
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')
  const [selectedServiceCollection, setSelectedServiceCollection] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState('')
  const [activeTab, setActiveTab] = useState(0) // 0 for services, 1 for products
  
  // State for appointment payment processing
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] = useState<PaymentMethod>('upi');
  const [appointmentDiscount, setAppointmentDiscount] = useState<number>(0);
  const [activeStep, setActiveStep] = useState(0);
  
  // State for walk-in order creation
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(new Date());
  
  // Selected collection state
  const [_expandedServiceCollection, _setExpandedServiceCollection] = useState<boolean>(false);
  const [_expandedProductCategory, _setExpandedProductCategory] = useState<boolean>(false);
  
  // Filter active services for the order creation
  const activeServices = allServices?.filter(service => service.active) || [];
  
  // Get services for the selected collection or all services if no collection is selected
  const getServicesForCollection = () => {
    if (!selectedServiceCollection) {
      return filteredServices;
    }
    return collectionServices?.filter(service => 
        service.collection_id === selectedServiceCollection && 
        service.active &&
        (service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) || 
         (service.description && service.description.toLowerCase().includes(serviceSearchQuery.toLowerCase())))
      ) || [];
  };
  
  // Filter services based on search query
  const filteredServices = activeServices.filter(service => 
    service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
  );
  
  // Get product categories from collections instead of products
  const getProductCategories = () => {
    try {
      // If collections are available, use them
      if (collections && collections.length > 0) {
        return collections.map(collection => collection.name);
      }
      
      // Fallback to existing method if collections aren't available
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const categories = [...new Set(products.map((product: any) => product.category))];
      return categories;
    } catch (error) {
      console.error('Error getting product categories:', error);
      return [];
    }
  };
  
  // Update getFilteredProducts to use collection names instead of product categories
  const getFilteredProducts = () => {
    try {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      
      return products
        .filter((product: any) => {
          // If we have a selected category, find the collection ID that matches the name
          let matchesCategory = true;
          if (selectedProductCategory) {
            // If we have collections, find the one with the matching name
            if (collections && collections.length > 0) {
              const collection = collections.find(c => c.name === selectedProductCategory);
              if (collection) {
                matchesCategory = product.collection_id === collection.id;
              } else {
                // Fallback to the old category matching if collection not found
                matchesCategory = product.category === selectedProductCategory;
              }
            } else {
              // Fallback to the old category matching if no collections
              matchesCategory = product.category === selectedProductCategory;
            }
          }
          
          return (
            product.status === 'active' && 
            product.stock > 0 &&
            matchesCategory &&
            product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
          );
        });
    } catch (error) {
      console.error('Error parsing products:', error);
      return [];
    }
  };
  
  // Calculate separate totals for services and products
  const serviceItems = orderItems.filter(item => item.type === 'service');
  const productItems = orderItems.filter(item => item.type === 'product');

  const serviceSubtotal = serviceItems.reduce((sum, item) => 
    sum + ((item.customPrice || item.service.price) * item.quantity), 0);
    
  const productSubtotal = productItems.reduce((sum, item) => 
    sum + ((item.customPrice || item.service.price) * item.quantity), 0);
    
  const orderSubtotal = serviceSubtotal + productSubtotal;
  
  // Calculate tax and total based on payment method
  // When using split payment, we need to calculate tax differently
  const { tax, total } = useMemo(() => {
    if (isSplitPayment && splitPayments.length > 0) {
      // Check if we have a mix of cash and other payment methods
      const hasCash = splitPayments.some(payment => payment.payment_method === 'cash');
      const hasNonCash = splitPayments.some(payment => payment.payment_method !== 'cash');
      const hasMixedPayments = hasCash && hasNonCash;
      
      // Calculate total payment amount
      const totalPaymentAmount = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      let calculatedTax = 0;
      
      if (hasMixedPayments) {
        // If mix of cash and non-cash, apply GST to the total amount
        calculatedTax = Math.round(totalPaymentAmount * 0.18 / 1.18);
      } else if (hasNonCash) {
        // If only non-cash payments, apply GST
        calculatedTax = Math.round(totalPaymentAmount * 0.18 / 1.18);
      }
      // If only cash payments, tax remains 0
      
      // Calculate total from the orderSubtotal plus tax minus discount
      return {
        tax: calculatedTax,
        total: orderSubtotal + calculatedTax - walkInDiscount
      };
    } else {
      // Standard calculation for single payment method
      return calculateTotal([orderSubtotal], walkInDiscount, walkInPaymentMethod);
    }
  }, [orderSubtotal, walkInDiscount, walkInPaymentMethod, isSplitPayment, splitPayments]);
  
  // Update pending amount when split payments change
  useEffect(() => {
    if (isSplitPayment) {
      const amountPaid = getAmountPaid();
      // This is the proper calculation - total should be the order amount
      setPendingAmount(Math.max(0, total - amountPaid));
    }
  }, [splitPayments, total, isSplitPayment]);

  // Handle pre-filled appointment data
  useEffect(() => {
    if (appointmentData) {
      // Find the appointment's client
      const client = clients?.find((c) => c.id === appointmentData.client_id);
      
      // Set the client name if found, or use the appointment client name as fallback
      if (client) {
        setSelectedClient(client);
        setCustomerName(client.full_name);
      } else if (appointmentData.client_name) {
        setCustomerName(appointmentData.client_name);
      }
      
      // Set the stylist ID
      if (appointmentData.stylist_id) {
        setSelectedStylist(appointmentData.stylist_id);
      }
      
      // Find and add the appointment service
      if (appointmentData.service_id && allServices) {
        const service = allServices.find(s => s.id === appointmentData.service_id);
        
        // Add service to order items if found
        if (service) {
          handleAddService(service);
        }
      }
      
      // Set appointment time if available
      if (appointmentData.appointmentTime) {
        const appointmentDateTime = new Date(appointmentData.appointmentTime);
        setAppointmentDate(appointmentDateTime);
        setAppointmentTime(appointmentDateTime);
      }
      
      // Move to services step
      setActiveStep(1);
    }
  }, [appointmentData, allServices, clients]);

  // Handle client selection
  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    if (client) {
      setCustomerName(client.full_name);
    } else {
      setCustomerName('');
    }
  };

  // Update the handleAddService function
  const handleAddService = (service: POSService, itemType: 'service' | 'product' = 'service') => {
    // Check if the service is already in the order
    const existingService = orderItems.find(
      (s) => s.service.id === service.id
    );

    if (existingService) {
      // If the service already exists, increment its quantity
      setOrderItems(
        orderItems.map((s) =>
          s.service.id === service.id
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      );
    } else {
      // If the service doesn't exist, add it to the order with a quantity of 1
      setOrderItems([
        ...orderItems,
        { 
          service, 
          quantity: 1, 
          type: service.type || itemType, // Use the passed itemType parameter or existing type
          customPrice: service.price // Initialize customPrice with service price
        }
      ]);
    }
  };

  // Add a handler for price changes
  const handlePriceChange = (serviceId: string, newPrice: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.service.id === serviceId
          ? { ...item, customPrice: newPrice }
          : item
      )
    );
  };

  // Remove a service from the walk-in order
  const handleRemoveService = (serviceId: string) => {
    const existingItemIndex = orderItems.findIndex(item => item.service.id === serviceId);
    
    if (existingItemIndex === -1) return;
    
    const updatedItems = [...orderItems];
    
    if (updatedItems[existingItemIndex].quantity > 1) {
      // Decrement quantity
      updatedItems[existingItemIndex].quantity -= 1;
    } else {
      // Remove item completely
      updatedItems.splice(existingItemIndex, 1);
    }
    
    setOrderItems(updatedItems);
  };

  // Delete a service completely from the order
  const handleDeleteService = (serviceId: string) => {
    setOrderItems(orderItems.filter(item => item.service.id !== serviceId));
  };

  // Handle steps in walk-in order process
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle adding a new payment in split payment mode
  const handleAddSplitPayment = () => {
    // Validation for maximum 2 payment methods
    if (splitPayments.length >= 2) {
      setSnackbarMessage('Maximum 2 payment methods allowed');
      setSnackbarOpen(true);
      return;
    }

    // Fix validation to check if amount is between 0 and the remaining amount (inclusive)
    if (newPaymentAmount <= 0 || newPaymentAmount > pendingAmount) {
      setSnackbarMessage('Invalid payment amount');
      setSnackbarOpen(true);
      return;
    }
    
    const newPayment: PaymentDetail = {
      id: (Math.random() * 1000000).toString(), // Temporary ID - will be replaced on server
      amount: newPaymentAmount,
      payment_method: newPaymentMethod,
      payment_date: new Date().toISOString(),
    };
    
    setSplitPayments([...splitPayments, newPayment]);
    setNewPaymentAmount(0);
  };
  
  // Remove a payment from the split payments list
  const handleRemoveSplitPayment = (paymentId: string) => {
    setSplitPayments(splitPayments.filter(payment => payment.id !== paymentId));
  };
  
  // Calculate total amount already paid
  const getAmountPaid = () => {
    return splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };
  
  // Reset split payment state when moving between steps
  useEffect(() => {
    if (activeStep !== 2) {
      setIsSplitPayment(false);
      setSplitPayments([]);
      setNewPaymentAmount(0);
    } else {
      // When entering payment step, set pending amount to total
      setPendingAmount(total);
    }
  }, [activeStep, total]);
  
  // Update the handleCreateWalkInOrder function
  const handleCreateWalkInOrder = async () => {
    if (!isStepValid()) return;
    
    setProcessing(true);
    
    try {
      // Prepare service items for the order
      const serviceItemsForOrder = orderItems.map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: item.customPrice || item.service.price,
        type: item.type,
      }));
      
      // Format appointment time if available
      let formattedAppointmentTime: string | undefined = undefined;
      if (appointmentDate && appointmentTime) {
        const date = new Date(appointmentDate);
        date.setHours(appointmentTime.getHours());
        date.setMinutes(appointmentTime.getMinutes());
        formattedAppointmentTime = date.toISOString();
      }
      
      // Create order data with or without split payment
      const orderData: any = {
        client_name: customerName,
        stylist_id: selectedStylist,
        services: serviceItemsForOrder,
        total: total,
        subtotal: orderSubtotal,
        tax: tax,
        discount: walkInDiscount,
        payment_method: walkInPaymentMethod,
        is_walk_in: true,
        appointment_time: formattedAppointmentTime,
        payments: isSplitPayment ? splitPayments : undefined,
        pending_amount: isSplitPayment ? pendingAmount : 0,
      };
      
      // Create order
      const response = await createWalkInOrder(orderData);
      
      // Show success message and play sound
      setSnackbarMessage('Order created successfully!');
      setSnackbarOpen(true);
      playCashRegisterSound();
      
      // Reset form
      setOrderItems([]);
      setCustomerName('');
      setSelectedClient(null);
      setSelectedStylist('');
      setAppointmentDate(null);
      setAppointmentTime(null);
      setActiveStep(0);
      setWalkInDiscount(0);
      setWalkInPaymentMethod('cash');
      setIsSplitPayment(false);
      setSplitPayments([]);
      
    } catch (error) {
      console.error('Error creating order:', error);
      setSnackbarMessage('Error creating order. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  // Check if all items in current step are valid
  const isStepValid = () => {
    switch (activeStep) {
      case 0: // Customer & Stylist
        return customerName.trim() !== '' && selectedStylist !== '';
      case 1: // Services
        return orderItems.length > 0;
      case 2: // Payment
        return true; // Payment method is pre-selected
      default:
        return false;
    }
  };

  // Services Step JSX (Replace the existing service selection section)
  const renderServiceSelectionSection = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Selected Items
            </Typography>
            
            {orderItems.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.service.id}>
                        <TableCell>{item.service.name}</TableCell>
                        <TableCell>
                          {item.type === 'service' ? (
                            <Chip 
                              size="small" 
                              label="Service" 
                              color="primary" 
                              icon={<ContentCutIcon fontSize="small" />} 
                              variant="outlined" 
                            />
                          ) : (
                            <Chip 
                              size="small" 
                              label="Product" 
                              color="secondary" 
                              icon={<ShoppingBasketIcon fontSize="small" />} 
                              variant="outlined" 
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            variant="outlined"
                            value={(item.customPrice || item.service.price)}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value);
                              if (!isNaN(newPrice) && newPrice >= 0) {
                                handlePriceChange(item.service.id, newPrice);
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">₹</InputAdornment>
                              ),
                              inputProps: {
                                min: 0,
                                style: { textAlign: 'right' }
                              }
                            }}
                            sx={{ width: '120px' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveService(item.service.id)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleAddService(item.service, item.type)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency((item.customPrice || item.service.price) * item.quantity)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDeleteService(item.service.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                No items added yet. Select services or products below.
              </Alert>
            )}
            
            <Typography variant="h6" gutterBottom>
              Available Services
            </Typography>
            
            {/* Search and filter UI */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="service-collection-label">Service Collection</InputLabel>
                    <Select
                      labelId="service-collection-label"
                      value={selectedServiceCollection}
                      onChange={(e) => setSelectedServiceCollection(e.target.value)}
                      label="Service Collection"
                    >
                      <MenuItem value="">
                        <em>All Collections</em>
                      </MenuItem>
                      {serviceCollections?.map((collection) => (
                        <MenuItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* Services Grid */}
            <Grid container spacing={2}>
              {getServicesForCollection().map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleAddService(service, 'service')}
                  >
                    <CardContent>
                      <Typography variant="h6">{service.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(service.price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {service.duration} min
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddService(service, 'service');
                        }}
                      >
                        Add to Order
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Products Section JSX (Replace the existing products section)
  const renderProductsSelectionSection = () => {
    return (
      <Box sx={{ p: 2, mt: 2, borderTop: '1px dashed rgba(0, 0, 0, 0.12)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
              Add Products to Order
            </Typography>
            
            {/* Search and filter UI */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="product-category-label">Product Category</InputLabel>
                    <Select
                      fullWidth
                      variant="outlined"
                      value={selectedProductCategory}
                      onChange={(e) => setSelectedProductCategory(e.target.value)}
                      label="Product Category"
                    >
                      <MenuItem value="">
                        <em>All Categories</em>
                      </MenuItem>
                      {getProductCategories().map((category) => {
                        const categoryStr = String(category);
                        return (
                          <MenuItem key={categoryStr} value={categoryStr}>
                            {categoryStr}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* Product Grid View */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {getFilteredProducts().map((product: any) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleAddService({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      type: 'product'
                    }, 'product')}
                  >
                    <CardContent>
                      <Typography variant="h6">{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(product.price)}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`Stock: ${product.stock}`} 
                          color={product.stock > 5 ? 'success' : product.stock > 0 ? 'warning' : 'error'} 
                          variant="outlined" 
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddService({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            type: 'product'
                          }, 'product');
                        }}
                      >
                        Add to Order
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  if (isLoading || loadingStylists || loadingServices || loadingClients || loadingServiceCollections || loadingCollectionServices || loadingCollections) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Point of Sale
      </Typography>

      {/* Remove tab structure and directly show Walk-in Sale content */}
      <Grid container spacing={2} sx={{ flex: 1, height: 'calc(100% - 48px)' }}>
        {/* Left side - Order Creation */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Customer & Stylist</StepLabel>
              </Step>
              <Step>
                <StepLabel>Services</StepLabel>
              </Step>
              <Step>
                <StepLabel>Payment</StepLabel>
              </Step>
            </Stepper>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Step 1: Customer & Stylist */}
              {activeStep === 0 && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Autocomplete
                        id="client-select"
                        options={clients || []}
                        getOptionLabel={(option) => option.full_name}
                        value={selectedClient}
                        onChange={(event, newValue) => handleClientSelect(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Client"
                            required
                            error={customerName.trim() === ''}
                            helperText={customerName.trim() === '' ? 'Client name is required' : ''}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <PersonIcon />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => {
                          // Extract the key from props to pass it directly
                          const { key, ...otherProps } = props;
                          return (
                            <li key={key} {...otherProps}>
                              <Box>
                                <Typography variant="body1">{option.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.phone && `Phone: ${option.phone}`} 
                                  {option.total_spent > 0 && ` • Total Spent: ${formatCurrency(option.total_spent)}`}
                                  {option.pending_payment > 0 && ` • Pending: ${formatCurrency(option.pending_payment)}`}
                                </Typography>
                              </Box>
                            </li>
                          );
                        }}
                        freeSolo
                        onInputChange={(event, newInputValue) => {
                          setCustomerName(newInputValue);
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth required error={selectedStylist === ''}>
                        <InputLabel>Select Stylist</InputLabel>
                        <Select
                          value={selectedStylist}
                          onChange={(e) => setSelectedStylist(e.target.value as string)}
                          label="Select Stylist"
                        >
                          {stylists?.map((stylist) => (
                            <MenuItem key={stylist.id} value={stylist.id}>
                              {stylist.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {selectedStylist === '' && (
                          <Typography variant="caption" color="error">
                            Stylist selection is required
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Schedule Appointment (Optional)
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <DatePicker
                              label="Appointment Date"
                              value={appointmentDate}
                              onChange={(newDate) => setAppointmentDate(newDate)}
                              slotProps={{ textField: { fullWidth: true } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TimePicker
                              label="Appointment Time"
                              value={appointmentTime}
                              onChange={(newTime) => setAppointmentTime(newTime)}
                              slotProps={{ textField: { fullWidth: true } }}
                            />
                          </Grid>
                        </Grid>
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Step 2: Services */}
              {activeStep === 1 && (
                <>
                  {renderServiceSelectionSection()}
                  {renderProductsSelectionSection()}
                </>
              )}
              
              {/* Step 3: Payment */}
              {activeStep === 2 && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Payment Method
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isSplitPayment}
                            onChange={(e) => setIsSplitPayment(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Split Payment"
                        sx={{ mb: 2 }}
                      />
                      
                      {isSplitPayment ? (
                        // Split payment UI
                        <Box>
                          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                              Split Payment Details
                            </Typography>
                            
                            {/* Show GST information at the top */}
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                GST (18%) is applied to non-cash payment methods. When mixing cash with other payment methods, 
                                GST will be applied to the complete amount. Maximum 2 payment methods allowed. No two payments of the same type allowed.
                              </Typography>
                            </Alert>
                            
                            <TableContainer sx={{ maxHeight: 200, mb: 2 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Method</TableCell>
                                    <TableCell>GST Applicable</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {splitPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                      <TableCell>{PAYMENT_METHOD_LABELS[payment.payment_method]}</TableCell>
                                      <TableCell>
                                        {payment.payment_method === 'cash' && 
                                         !splitPayments.some(p => p.payment_method !== 'cash') ? (
                                          <Typography color="success.main">No</Typography>
                                        ) : (
                                          <Typography>Yes</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleRemoveSplitPayment(payment.id)}
                                          aria-label="delete payment"
                                        >
                                          <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {splitPayments.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                          No payments added yet
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            
                            {/* Only show the payment input fields if less than 2 payment methods are added */}
                            {splitPayments.length < 2 ? (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                <TextField
                                  label="Amount"
                                  type="number"
                                  value={newPaymentAmount}
                                  onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                                  sx={{ minWidth: 120 }}
                                  InputProps={{
                                    inputProps: { min: 1, max: pendingAmount },
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                  }}
                                  helperText={`Max: ${formatCurrency(pendingAmount)}`}
                                />
                                
                                <FormControl sx={{ minWidth: 150 }}>
                                  <InputLabel>Payment Method</InputLabel>
                                  <Select
                                    value={newPaymentMethod}
                                    onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                                    label="Payment Method"
                                  >
                                    {PAYMENT_METHODS.map((method) => {
                                      // If one payment method is already used and we're selecting for the second method,
                                      // don't allow selecting the same method again
                                      const isMethodAlreadyUsed = 
                                        splitPayments.length === 1 && 
                                        splitPayments[0].payment_method === method;
                                        
                                      return !isMethodAlreadyUsed ? (
                                        <MenuItem key={method} value={method}>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ mr: 1 }}>{PaymentIcons[method]}</Box>
                                            {PAYMENT_METHOD_LABELS[method]}
                                            {method === 'cash' && (
                                              <Chip 
                                                size="small" 
                                                label="No GST" 
                                                color="success" 
                                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                              />
                                            )}
                                          </Box>
                                        </MenuItem>
                                      ) : null;
                                    })}
                                  </Select>
                                </FormControl>
                                
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<AddIcon />}
                                  onClick={handleAddSplitPayment}
                                  disabled={newPaymentAmount <= 0 || newPaymentAmount > pendingAmount}
                                >
                                  Add Payment
                                </Button>
                              </Box>
                            ) : (
                              <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                  Maximum of 2 payment methods reached. Remove one to add another.
                                </Typography>
                              </Alert>
                            )}
                            
                            {/* Payment summary */}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                              <Typography>
                                Amount Paid: <strong>{formatCurrency(getAmountPaid())}</strong>
                              </Typography>
                              <Typography>
                                Pending: <strong>{formatCurrency(pendingAmount)}</strong>
                              </Typography>
                            </Box>
                          </Paper>
                          
                          {/* Display GST breakdown for split payments */}
                          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                              GST Breakdown
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              {/* Check if we have mixed payment methods (cash + non-cash) */}
                              {(() => {
                                const hasCash = splitPayments.some(payment => payment.payment_method === 'cash');
                                const hasNonCash = splitPayments.some(payment => payment.payment_method !== 'cash');
                                const hasMixedPayments = hasCash && hasNonCash;
                                
                                // If mixed payments, show GST for all payments
                                if (hasMixedPayments) {
                                  return splitPayments.map((payment, index) => (
                                    <Box 
                                      key={index} 
                                      sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        mb: 1 
                                      }}
                                    >
                                      <Typography>
                                        GST on {PAYMENT_METHOD_LABELS[payment.payment_method]} ({formatCurrency(payment.amount)}):
                                      </Typography>
                                      <Typography>
                                        {formatCurrency(Math.round(payment.amount * 0.18 / 1.18))}
                                      </Typography>
                                    </Box>
                                  ));
                                } else {
                                  // Otherwise only show GST for non-cash payments
                                  return splitPayments
                                    .filter(payment => payment.payment_method !== 'cash')
                                    .map((payment, index) => (
                                      <Box 
                                        key={index} 
                                        sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          mb: 1 
                                        }}
                                      >
                                        <Typography>
                                          GST on {PAYMENT_METHOD_LABELS[payment.payment_method]} ({formatCurrency(payment.amount)}):
                                        </Typography>
                                        <Typography>
                                          {formatCurrency(Math.round(payment.amount * 0.18 / 1.18))}
                                        </Typography>
                                      </Box>
                                    ));
                                }
                              })()}
                              
                              {/* Show total GST */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                borderTop: '1px dashed rgba(0, 0, 0, 0.12)',
                                pt: 1,
                                mt: 1
                              }}>
                                <Typography fontWeight="medium">Total GST:</Typography>
                                <Typography fontWeight="medium">
                                  {formatCurrency(tax)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Only show the cash exemption alert if there's no mixed payment */}
                            {splitPayments.some(payment => payment.payment_method === 'cash') && 
                            !splitPayments.some(payment => payment.payment_method !== 'cash') && (
                              <Alert severity="success" sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                  No GST applied to cash payments: {formatCurrency(
                                    splitPayments
                                      .filter(payment => payment.payment_method === 'cash')
                                      .reduce((sum, payment) => sum + payment.amount, 0)
                                  )}
                                </Typography>
                              </Alert>
                            )}
                          </Paper>
                          
                          {pendingAmount > 0 && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              The remaining amount of {formatCurrency(pendingAmount)} will be marked as pending and can be collected later.
                            </Alert>
                          )}
                        </Box>
                      ) : (
                        // Standard payment UI
                        <>
                          <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                              value={walkInPaymentMethod}
                              onChange={(e) => setWalkInPaymentMethod(e.target.value as PaymentMethod)}
                              label="Payment Method"
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <MenuItem key={method} value={method}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ mr: 1 }}>{PaymentIcons[method]}</Box>
                                    {PAYMENT_METHOD_LABELS[method]}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          {walkInPaymentMethod === 'bnpl' && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                              Buy Now Pay Later: The customer will need to pay the full amount later.
                            </Alert>
                          )}
                          
                          {walkInPaymentMethod !== 'cash' && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography>GST (18%):</Typography>
                              <Typography>{formatCurrency(tax)}</Typography>
                            </Box>
                          )}
                          
                          {walkInPaymentMethod === 'cash' && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography color="success.main">No GST (Cash Payment)</Typography>
                              <Typography color="success.main">₹0</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      
                      <TextField
                        label="Discount Amount"
                        type="number"
                        value={walkInDiscount}
                        onChange={(e) => setWalkInDiscount(Number(e.target.value))}
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0, max: orderSubtotal },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Order Summary
                      </Typography>
                      
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box>
                          {serviceItems.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography>Service Subtotal:</Typography>
                              <Typography>{formatCurrency(serviceSubtotal)}</Typography>
                            </Box>
                          )}
                          
                          {productItems.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography>Product Subtotal:</Typography>
                              <Typography>{formatCurrency(productSubtotal)}</Typography>
                            </Box>
                          )}
                          
                          {(serviceItems.length > 0 && productItems.length > 0) && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pt: 1, borderTop: '1px dashed rgba(0, 0, 0, 0.12)' }}>
                              <Typography fontWeight="medium">Combined Subtotal:</Typography>
                              <Typography fontWeight="medium">{formatCurrency(orderSubtotal)}</Typography>
                            </Box>
                          )}
                          
                          {/* Display GST for all payment methods */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>GST (18%):</Typography>
                            <Typography>{formatCurrency(tax)}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Discount:</Typography>
                            <Typography color="error">
                              -{formatCurrency(walkInDiscount)}
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Total:</Typography>
                            <Typography variant="h6" color="primary">{formatCurrency(total)}</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              
              {activeStep === 2 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateWalkInOrder}
                  disabled={processing || !isStepValid()}
                  startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {processing ? 'Processing...' : 'Complete Order'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Right side - Order Summary */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            {orderItems.length > 0 ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <List sx={{ flex: 1, overflow: 'auto' }}>
                  {/* Show services */}
                  {serviceItems.length > 0 && (
                    <ListItem dense>
                      <ListItemText
                        primary={<Typography variant="subtitle2" color="primary">Services</Typography>}
                      />
                    </ListItem>
                  )}
                  
                  {serviceItems.map((item) => (
                    <ListItem key={item.service.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ContentCutIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography>{item.service.name} (×{item.quantity})</Typography>
                          </Box>
                        }
                        secondary={item.service.duration ? `${item.service.duration} min` : null}
                      />
                      <ListItemSecondaryAction>
                        <Typography>{formatCurrency((item.customPrice || item.service.price) * item.quantity)}</Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {/* Show products */}
                  {productItems.length > 0 && (
                    <ListItem dense sx={{ mt: serviceItems.length > 0 ? 2 : 0 }}>
                      <ListItemText
                        primary={<Typography variant="subtitle2" color="secondary">Products</Typography>}
                      />
                    </ListItem>
                  )}
                  
                  {productItems.map((item) => (
                    <ListItem key={item.service.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ShoppingBasketIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography>{item.service.name} (×{item.quantity})</Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography>{formatCurrency((item.customPrice || item.service.price) * item.quantity)}</Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Order Totals */}
                <Box>
                  {serviceItems.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Service Subtotal:</Typography>
                      <Typography>{formatCurrency(serviceSubtotal)}</Typography>
                    </Box>
                  )}
                  
                  {productItems.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Product Subtotal:</Typography>
                      <Typography>{formatCurrency(productSubtotal)}</Typography>
                    </Box>
                  )}
                  
                  {(serviceItems.length > 0 && productItems.length > 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pt: 1, borderTop: '1px dashed rgba(0, 0, 0, 0.12)' }}>
                      <Typography fontWeight="medium">Combined Subtotal:</Typography>
                      <Typography fontWeight="medium">{formatCurrency(orderSubtotal)}</Typography>
                    </Box>
                  )}
                  
                  {/* Display GST for all payment methods */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>GST (18%):</Typography>
                    <Typography>{formatCurrency(tax)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Discount:</Typography>
                    <Typography color="error">
                      -{formatCurrency(walkInDiscount)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">{formatCurrency(total)}</Typography>
                  </Box>
                </Box>
                
                {/* Customer & Stylist Info */}
                {customerName && selectedStylist && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      icon={<PersonIcon />} 
                      label={`Customer: ${customerName}`} 
                      sx={{ mb: 1, mr: 1 }} 
                    />
                    <Chip 
                      icon={<ContentCutIcon />} 
                      label={`Stylist: ${stylists?.find(s => s.id === selectedStylist)?.name}`} 
                      sx={{ mb: 1 }} 
                    />
                    
                    {appointmentDate && appointmentTime && (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                        label={`${appointmentDate.toLocaleDateString()} at ${appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`} 
                        sx={{ mb: 1 }} 
                      />
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CartIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Your cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Add services to create an order
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  )
} 