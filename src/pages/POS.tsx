import { useState, useEffect } from 'react'
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
  Stack,
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
  Tooltip,
} from '@mui/material'
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  AddCircle as AddCircleIcon,
  DeleteOutline as DeleteOutlineIcon,
  CreditCard as CreditCardIcon,
  LocalAtm as LocalAtmIcon,
  QrCode as QrCodeIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  ContentCut as ContentCutIcon,
  Search as SearchIcon,
  ShoppingBasket as ShoppingBasketIcon,
} from '@mui/icons-material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { usePOS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../hooks/usePOS'
import { useStylists } from '../hooks/useStylists'
import { useServices } from '../hooks/useServices'
import { useClients } from '../hooks/useClients'
import { useServiceCollections } from '../hooks/useServiceCollections'
import { useCollectionServices } from '../hooks/useCollectionServices'
import { useCollections } from '../hooks/useCollections'
import { formatCurrency } from '../utils/format'
import { playCashRegisterSound, addCashRegisterTestButton } from '../assets/sounds/cash-register'
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
  
  // Tab state
  const [tabValue, setTabValue] = useState(appointmentData ? 1 : 0); // Set to appointment tab if data exists
  
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
  
  // Search state
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  // State for appointment payment processing
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] = useState<PaymentMethod>('upi');
  const [appointmentDiscount, setAppointmentDiscount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  
  // State for walk-in order creation
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(new Date());
  const [walkInDiscount, setWalkInDiscount] = useState<number>(0);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<PaymentMethod>('cash');
  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Selected collection state
  const [selectedServiceCollection, setSelectedServiceCollection] = useState<string>('');
  const [expandedServiceCollection, setExpandedServiceCollection] = useState<boolean>(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('');
  const [expandedProductCategory, setExpandedProductCategory] = useState<boolean>(false);
  
  // Filter active services for the order creation
  const activeServices = allServices?.filter(service => service.active) || [];
  
  // Get services for the selected collection or all services if no collection is selected
  const getServicesForCollection = () => {
    if (!selectedServiceCollection) {
      return filteredServices;
    }
    return collectionServices
      .filter(service => 
        service.collection_id === selectedServiceCollection && 
        service.active &&
        (service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) || 
         (service.description && service.description.toLowerCase().includes(serviceSearchQuery.toLowerCase())))
      );
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
  const { tax, total } = calculateTotal([orderSubtotal], walkInDiscount, walkInPaymentMethod);

  // Handle pre-filled appointment data
  useEffect(() => {
    if (appointmentData && unpaidAppointments) {
      // Find the appointment in unpaid appointments
      const appointment = unpaidAppointments.find(a => a.id === appointmentData.id);
      
      if (appointment) {
        // Set the selected appointment
        setSelectedAppointment(appointment);
      } else {
        // If appointment not found in unpaid list, create a walk-in order with the data
        setTabValue(0); // Switch to walk-in tab
        
        // Set customer name and stylist
        setCustomerName(appointmentData.clientName);
        
        // Try to find client in clients list
        if (clients) {
          const client = clients.find(c => 
            c.full_name.toLowerCase() === appointmentData.clientName.toLowerCase()
          );
          if (client) {
            setSelectedClient(client);
          }
        }
        
        setSelectedStylist(appointmentData.stylistId);
        
        // Find the service in services list
        const service = allServices?.find(s => s.id === appointmentData.serviceId);
        
        if (service) {
          // Add service to order items
          handleAddService(service);
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
    }
  }, [appointmentData, unpaidAppointments, allServices, clients]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCustomerName(appointment?.client_name || '');
    setAppointmentDiscount(0); // Reset discount when selecting new appointment
  };

  // Handle client selection
  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    if (client) {
      setCustomerName(client.full_name);
    } else {
      setCustomerName('');
    }
  };

  // Update handleAppointmentPayment function to separate services and products
  const handleAppointmentPayment = async () => {
    try {
      if (!selectedAppointment) {
        setSnackbarMessage('Please select an appointment');
        setSnackbarOpen(true);
        return;
      }
      
      setProcessing(true);
      
      // Get services from order items
      const serviceItems = orderItems.filter(item => item.type === 'service').map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: (item.customPrice || item.service.price) * item.quantity,
        type: 'service'
      }));
      
      const productItems = orderItems.filter(item => item.type === 'product').map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: (item.customPrice || item.service.price) * item.quantity,
        type: 'product'
      }));
      
      // Combine both for the final services array
      const services = [...serviceItems, ...productItems];
      
      // Calculate prices for each item
      const servicePrices = orderItems.map(item => (item.customPrice || item.service.price) * item.quantity);
      
      // Calculate totals
      const { subtotal, tax, total } = calculateTotal(servicePrices, appointmentDiscount, appointmentPaymentMethod);
      
      // Process payment
      await processAppointmentPayment({
        appointment_id: selectedAppointment.id,
        client_name: selectedAppointment.clients.full_name,
        stylist_id: selectedAppointment.stylist_id,
        services,
        total,
        subtotal,
        tax,
        discount: appointmentDiscount,
        payment_method: appointmentPaymentMethod,
        is_walk_in: false
      });
      
      // Reset form
      setSelectedAppointment(null);
      setOrderItems([]);
      setAppointmentDiscount(0);
      setAppointmentPaymentMethod('credit_card');
      
      // Navigate back to first step
      setActiveStep(0);
      
      // Show success message
      setSnackbarMessage('Payment processed successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Payment error:', error);
      setSnackbarMessage('Failed to process payment');
      setSnackbarOpen(true);
    } finally {
      setProcessing(false);
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

  // Update the handleCreateWalkInOrder function
  const handleCreateWalkInOrder = async () => {
    try {
      // Validate required fields
      if (!customerName || !selectedStylist || orderItems.length === 0) {
        setSnackbarMessage('Please fill in all required fields');
        setSnackbarOpen(true);
        return;
      }
      
      // Separate services and products
      const serviceItems = orderItems.filter(item => item.type === 'service').map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: (item.customPrice || item.service.price) * item.quantity,
        type: 'service'
      }));
      
      const productItems = orderItems.filter(item => item.type === 'product').map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: (item.customPrice || item.service.price) * item.quantity,
        type: 'product'
      }));
      
      // Combine both for the final services array with clear type distinction
      const services = [...serviceItems, ...productItems];
      
      // Use the combined orderSubtotal for total calculation
      const { subtotal, tax, total } = calculateTotal([orderSubtotal], walkInDiscount, walkInPaymentMethod);
      
      // Create appointment time if scheduled
      let appointmentDateTime: string | undefined = undefined;
      if (appointmentDate && appointmentTime) {
        const dateTime = new Date(appointmentDate);
        dateTime.setHours(
          appointmentTime.getHours(),
          appointmentTime.getMinutes(),
          0, 0
        );
        appointmentDateTime = dateTime.toISOString();
      }
      
      // Set processing state
      setProcessing(true);
      
      // Create order
      await createWalkInOrder({
        client_name: customerName,
        stylist_id: selectedStylist,
        services,
        total,
        subtotal,
        tax,
        discount: walkInDiscount,
        payment_method: walkInPaymentMethod,
        appointment_time: appointmentDateTime,
        is_walk_in: true
      });
      
      // Reset form
      setCustomerName('');
      setSelectedStylist('');
      setOrderItems([]);
      setWalkInDiscount(0);
      setWalkInPaymentMethod('cash');
      setAppointmentDate(new Date());
      setAppointmentTime(new Date());
      
      // Reset step
      setActiveStep(0);
      
      // Show success message
      setSnackbarMessage('Order created successfully');
      setSnackbarOpen(true);
      
      // Play cash register sound
      playCashRegisterSound();
    } catch (error) {
      console.error('Order error:', error);
      setSnackbarMessage('Failed to create order');
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
                      labelId="product-category-label"
                      value={selectedProductCategory}
                      onChange={(e) => setSelectedProductCategory(e.target.value)}
                      label="Product Category"
                    >
                      <MenuItem value="">
                        <em>All Categories</em>
                      </MenuItem>
                      {getProductCategories().map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
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
    <Box>
      <Typography variant="h1" gutterBottom>Point of Sale</Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab 
            icon={<CartIcon />} 
            label="Walk-in Sale" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Appointment Payment" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Walk-in Sales Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Left side - Cart and Process */}
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
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Discount:</Typography>
                      <Typography color="error">
                        -{formatCurrency(walkInDiscount)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(total)}
                      </Typography>
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
      </TabPanel>
      
      {/* Appointment Payment Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Left side - Appointment List */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>Unpaid Appointments</Typography>
              {unpaidAppointments?.length ? (
                <List>
                  {unpaidAppointments.map((appointment) => (
                    <ListItem
                      key={appointment.id}
                      button
                      selected={selectedAppointment?.id === appointment.id}
                      onClick={() => handleAppointmentSelect(appointment)}
                      sx={{ 
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 1,
                          borderColor: 'primary.main',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          }
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {appointment.clients.full_name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {appointment.services.name} - {formatCurrency(appointment.services.price)}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(appointment.start_time).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(appointment.services.price)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No unpaid appointments found. All appointments have been processed.
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Right side - Payment Processing */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>Payment Details</Typography>
              
              {selectedAppointment ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Client: {selectedAppointment.clients.full_name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Service: {selectedAppointment.services.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Appointment: {new Date(selectedAppointment.start_time).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </Typography>
                  </Box>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={appointmentPaymentMethod}
                      label="Payment Method"
                      onChange={(e) => setAppointmentPaymentMethod(e.target.value as PaymentMethod)}
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

                  <TextField
                    label="Discount"
                    type="number"
                    value={appointmentDiscount}
                    onChange={(e) => setAppointmentDiscount(Number(e.target.value))}
                    fullWidth
                    sx={{ mb: 3 }}
                    InputProps={{
                      inputProps: { min: 0, max: selectedAppointment.services.price },
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />

                  <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Payment Summary */}
                    <Box sx={{ mb: 2 }}>
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
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Discount:</Typography>
                        <Typography color="error">
                          -{formatCurrency(appointmentDiscount)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(
                            calculateTotal([selectedAppointment.services.price], appointmentDiscount, appointmentPaymentMethod).total
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleAppointmentPayment}
                      disabled={processing}
                      startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
                    >
                      {processing ? 'Processing...' : 'Process Payment'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <PaymentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    Select an appointment to process payment
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
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