import { useState, useEffect, useMemo, useCallback, useRef, useReducer } from 'react'
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
  SelectChangeEvent,
  FormHelperText,
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

// Define action types
type POSAction =
  | { type: 'SET_SPLIT_PAYMENT', value: boolean }
  | { type: 'SET_SPLIT_PAYMENTS', payments: PaymentDetail[] }
  | { type: 'SET_PENDING_AMOUNT', amount: number }
  | { type: 'SET_NEW_PAYMENT_AMOUNT', amount: number }
  | { type: 'SET_NEW_PAYMENT_METHOD', method: PaymentMethod }
  | { type: 'RESET_PAYMENT_STATE', activeStep: number }
  | { type: 'ENTER_PAYMENT_STEP', total: number };

// Define state interface
interface POSPaymentState {
  isSplitPayment: boolean;
  splitPayments: PaymentDetail[];
  pendingAmount: number;
  newPaymentAmount: number;
  newPaymentMethod: PaymentMethod;
  lastUpdated: string; // Track what was last updated to prevent loops
}

// Define reducer
const paymentReducer = (state: POSPaymentState, action: POSAction): POSPaymentState => {
  switch (action.type) {
    case 'SET_SPLIT_PAYMENT':
      if (state.isSplitPayment === action.value) return state;
      return { ...state, isSplitPayment: action.value, lastUpdated: 'isSplitPayment' };
      
    case 'SET_SPLIT_PAYMENTS':
      return { ...state, splitPayments: action.payments, lastUpdated: 'splitPayments' };
      
    case 'SET_PENDING_AMOUNT':
      if (Math.abs(state.pendingAmount - action.amount) < 0.01) return state;
      return { ...state, pendingAmount: action.amount, lastUpdated: 'pendingAmount' };
      
    case 'SET_NEW_PAYMENT_AMOUNT':
      return { ...state, newPaymentAmount: action.amount, lastUpdated: 'newPaymentAmount' };
      
    case 'SET_NEW_PAYMENT_METHOD':
      return { ...state, newPaymentMethod: action.method, lastUpdated: 'newPaymentMethod' };
      
    case 'RESET_PAYMENT_STATE':
      if (action.activeStep !== 2) {
        return {
          ...state,
          isSplitPayment: false,
          splitPayments: [],
          newPaymentAmount: 0,
          lastUpdated: 'reset'
        };
      }
      return state;
      
    case 'ENTER_PAYMENT_STEP':
      if (Math.abs(state.pendingAmount - action.total) > 0.01) {
        return {
          ...state,
          pendingAmount: action.total,
          lastUpdated: 'enterPayment'
        };
      }
      return state;
      
    default:
      return state;
  }
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
    calculateTotal,
    inventoryProducts 
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
  
  // Setup payment state reducer
  const initialPaymentState: POSPaymentState = {
    isSplitPayment: false,
    splitPayments: [],
    pendingAmount: 0,
    newPaymentAmount: 0,
    newPaymentMethod: 'cash',
    lastUpdated: 'init'
  };
  
  const [paymentState, dispatch] = useReducer(paymentReducer, initialPaymentState);
  const { isSplitPayment, splitPayments, pendingAmount, newPaymentAmount, newPaymentMethod } = paymentState;
  
  // State for services and products
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')
  const [selectedServiceCollection, setSelectedServiceCollection] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0) // 0 for services, 1 for products
  
  // State for appointment payment processing
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] = useState<PaymentMethod>('upi');
  const [appointmentDiscount, setAppointmentDiscount] = useState<number>(0);
  const [activeStep, setActiveStep] = useState(0);
  
  // State for walk-in order creation
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [stylistError, setStylistError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(new Date());
  
  // Selected collection state
  const [_expandedServiceCollection, _setExpandedServiceCollection] = useState<boolean>(false);
  const [_expandedProductCategory, _setExpandedProductCategory] = useState<boolean>(false);
  
  // Add a state for inventory product category
  const [showInventoryProducts, setShowInventoryProducts] = useState(true);
  
  // Filter active services for the order creation
  const activeServices = allServices?.filter(service => service.active) || [];
  
  // Calculate separate totals for services and products
  const serviceItems = orderItems.filter(item => item.type === 'service');
  const productItems = orderItems.filter(item => item.type === 'product');

  const serviceSubtotal = serviceItems.reduce((sum, item) => 
    sum + ((item.customPrice || item.service.price) * item.quantity), 0);
    
  const productSubtotal = productItems.reduce((sum, item) => 
    sum + ((item.customPrice || item.service.price) * item.quantity), 0);
    
  const orderSubtotal = serviceSubtotal + productSubtotal;
  
  // Calculate tax and total
  const { tax, total } = useMemo(() => {
    let calculatedTax = 0;
    let calculatedTotal = 0;
    
    if (isSplitPayment) {
      // For split payments, use different tax calculation based on payment methods
      const hasCash = splitPayments.some(payment => payment.payment_method === 'cash');
      const hasNonCash = splitPayments.some(payment => payment.payment_method !== 'cash');
      const hasMixedPayments = hasCash && hasNonCash;
      
      if (hasMixedPayments || hasNonCash) {
        calculatedTax = Math.round(orderSubtotal * 0.18);
      }
      
      calculatedTotal = orderSubtotal + calculatedTax - walkInDiscount;
    } else {
      // Use the existing calculation function for non-split payments
      const result = calculateTotal([orderSubtotal], walkInDiscount, walkInPaymentMethod);
      calculatedTax = result.tax;
      calculatedTotal = result.total;
    }
    
    return {
      tax: calculatedTax,
      total: calculatedTotal
    };
  }, [orderSubtotal, isSplitPayment, splitPayments, walkInDiscount, walkInPaymentMethod, calculateTotal]);
  
  // Add refs to track previous values
  const prevPendingAmountRef = useRef<number>(0);
  const prevActiveStepRef = useRef<number>(0);
  const prevTotalRef = useRef<number>(0);
  
  // Move isStepValid function before it's used
  // Function to check if the current step is valid
  const isStepValid = useCallback(() => {
    switch (activeStep) {
      case 0: // Customer & Stylist
        // Check if stylist is selected
        if (!selectedStylist) {
          setStylistError('Please select a stylist');
          return false;
        }
        
        // Check if client is selected or customer name is entered
        if (!selectedClient && !customerName) {
          setClientError('Please select a client or enter customer name');
          return false;
        }
        
        // Clear any previous errors
        if (stylistError) setStylistError(null);
        if (clientError) setClientError(null);
        return true;
        
      case 1: // Services
        // Check if at least one service is added
        if (orderItems.length === 0) {
          setSnackbarMessage('Please add at least one service or product');
          setSnackbarOpen(true);
          return false;
        }
        return true;
        
      case 2: // Payment
        // For split payment, ensure all amount is accounted for
        if (isSplitPayment) {
          // Using the accurate pending amount calculation
          const amountPaid = calculateTotalPaid(splitPayments);
          const pendingAmount = calculateAccuratePendingAmount(total, splitPayments);
          
          // Allow proceeding if pending amount is small (less than 1)
          if (pendingAmount > 1) {
            setSnackbarMessage('Please pay the full amount before proceeding');
            setSnackbarOpen(true);
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  }, [
    activeStep, 
    selectedStylist, 
    selectedClient, 
    customerName, 
    stylistError, 
    clientError, 
    orderItems.length, 
    isSplitPayment, 
    splitPayments, 
    total, 
    setSnackbarMessage, 
    setSnackbarOpen
  ]);
  
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
  
  // Update getFilteredProducts to work without category filtering
  const getFilteredProducts = () => {
    try {
      // First get regular products
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      
      let filteredProducts = products
        .filter((product: any) => {
          // Check if product name or description matches search query
          return productSearchQuery === '' || 
            product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(productSearchQuery.toLowerCase()));
        })
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          type: 'product',
          description: product.description,
          image: product.image
        }));
      
      // Add inventory products if selected
      if (showInventoryProducts) {
        const inventoryItems = inventoryProducts || [];
        
        // Filter inventory products by search query
        const filteredInventoryItems = inventoryItems.filter((product: any) => 
          productSearchQuery === '' || 
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(productSearchQuery.toLowerCase()))
        );
        
        // Add filtered inventory products to the result
        filteredProducts = [...filteredProducts, ...filteredInventoryItems];
      }
      
      return filteredProducts;
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  };
  
  // Function to calculate total paid
  const calculateTotalPaid = (payments: PaymentDetail[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  // Function to calculate pending amount accurately
  const calculateAccuratePendingAmount = (total: number, payments: PaymentDetail[]) => {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    // Use strict equality check
    return totalPaid === total ? 0 : Math.max(0, total - totalPaid);
  };

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
  const handleClientSelect = useCallback((client: any) => {
    setSelectedClient(client);
    if (client) {
      setCustomerName(client.full_name);
    } else {
      setCustomerName('');
    }
  }, []);

  // Update the handleAddService function
  const handleAddService = useCallback((service: POSService, itemType: 'service' | 'product' = 'service') => {
    // Check if the service is already in the order
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.service.id === service.id
      );
  
      if (existingItemIndex >= 0) {
        // If the service is already in the order, increment the quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Otherwise, add the service to the order
        return [
          ...prevItems,
          {
            service,
            quantity: 1,
            type: itemType
          }
        ];
      }
    });
  
    // Show a toast notification
    toast.success(`Added ${service.name} to order`);
  }, []);

  // Add a handler for price changes
  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    setOrderItems(prevItems =>
      prevItems.map((item) =>
        item.service.id === serviceId
          ? { ...item, customPrice: newPrice }
          : item
      )
    );
  }, []);

  // Remove a service from the walk-in order
  const handleRemoveService = useCallback((serviceId: string) => {
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.service.id === serviceId);
      
      if (existingItemIndex === -1) return prevItems;
      
      const updatedItems = [...prevItems];
      
      if (updatedItems[existingItemIndex].quantity > 1) {
        // Decrement quantity
        updatedItems[existingItemIndex].quantity -= 1;
      } else {
        // Remove item completely
        updatedItems.splice(existingItemIndex, 1);
      }
      
      return updatedItems;
    });
  }, []);

  // Delete a service completely from the order
  const handleDeleteService = useCallback((serviceId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.service.id !== serviceId));
  }, []);

  // Handle steps in walk-in order process
  const handleNext = useCallback(() => {
    // Validate current step before proceeding
    if (!isStepValid()) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  }, [isStepValid]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  // Update handleAddSplitPayment to use the new function
  const handleAddSplitPayment = useCallback(() => {
    // Validation for maximum 2 payment methods
    if (splitPayments.length >= 2) {
      setSnackbarMessage('Maximum 2 payment methods allowed');
      setSnackbarOpen(true);
      return;
    }
    
    // Validate the required fields
    if (!newPaymentMethod) {
      setSnackbarMessage('Please select a payment method');
      setSnackbarOpen(true);
      return;
    }
    
    // Fix validation to check if amount is between 0 and the remaining amount (inclusive)
    if (newPaymentAmount <= 0 || newPaymentAmount > pendingAmount) {
      setSnackbarMessage('Invalid payment amount');
      setSnackbarOpen(true);
      return;
    }
    
    // Create new payment object
    const newPayment: PaymentDetail = {
      id: (Math.random() * 1000000).toString(), // Temporary ID - will be replaced on server
      amount: newPaymentAmount,
      payment_method: newPaymentMethod,
      payment_date: new Date().toISOString(),
    };
    
    // Batch state updates to prevent multiple renders
    const updatedPayments = [...splitPayments, newPayment];
    
    // Update state through reducer with a single dispatch if possible
    dispatch({ 
      type: 'SET_SPLIT_PAYMENTS', 
      payments: updatedPayments 
    });
    
    // Only reset payment method if it's not already 'cash'
    if (newPaymentMethod !== 'cash') {
      dispatch({ type: 'SET_NEW_PAYMENT_METHOD', method: 'cash' });
    }
    
    // Only reset payment amount if it's not already 0
    if (newPaymentAmount !== 0) {
      dispatch({ type: 'SET_NEW_PAYMENT_AMOUNT', amount: 0 });
    }
  }, [splitPayments, newPaymentMethod, newPaymentAmount, pendingAmount, setSnackbarMessage, setSnackbarOpen]);

  // Remove a payment from the split payments list
  const handleRemoveSplitPayment = useCallback((paymentId: string) => {
    dispatch({ 
      type: 'SET_SPLIT_PAYMENTS', 
      payments: splitPayments.filter(payment => payment.id !== paymentId) 
    });
  }, [splitPayments]);

  // Calculate total amount already paid
  const getAmountPaid = () => {
    return splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };
  
  // Reset split payment state when moving between steps
  useEffect(() => {
    // Store previous values for comparison
    const prevActiveStep = prevActiveStepRef.current;
    prevActiveStepRef.current = activeStep;
    
    // Only reset payment state when step changes
    if (prevActiveStep !== activeStep) {
      // Reset payment state when step changes and not entering payment step
      if (activeStep !== 2) {
        // Only dispatch if there's something to reset
        if (isSplitPayment || splitPayments.length > 0 || newPaymentAmount > 0) {
          dispatch({ type: 'RESET_PAYMENT_STATE', activeStep });
        }
      } else if (activeStep === 2) {
        // Only update pending amount when entering payment step and if it's different
        if (Math.abs(pendingAmount - total) > 0.01) {
          dispatch({ type: 'ENTER_PAYMENT_STEP', total });
        }
      }
    }
  }, [activeStep, total, isSplitPayment, splitPayments.length, newPaymentAmount, pendingAmount]);
  
  // Add a useEffect to update pending amount when split payments change
  useEffect(() => {
    // Only run this effect when in payment step and split payment is enabled
    if (activeStep === 2 && isSplitPayment) {
      const totalPaid = calculateTotalPaid(splitPayments);
      const remaining = Math.max(0, total - totalPaid);
      
      // Only update if the pending amount is significantly different
      if (Math.abs(pendingAmount - remaining) > 0.01) {
        dispatch({ type: 'SET_PENDING_AMOUNT', amount: remaining });
      }
    }
  }, [activeStep, isSplitPayment, splitPayments, total, pendingAmount, calculateTotalPaid]);
  
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
      };
      
      // ROBUST APPROACH for pending amount calculation
      if (isSplitPayment) {
        // COMPLETELY NEW APPROACH: Convert to paise (cents) for precision
        const totalInPaise = Math.round(total * 100);
        const subtotalInPaise = Math.round(orderSubtotal * 100);
        const taxInPaise = Math.round(tax * 100);
        const paidInPaise = Math.round(splitPayments.reduce((sum, payment) => {
          return sum + Math.round(payment.amount * 100);
        }, 0));
        
        // Calculate remaining in paise
        let remainingInPaise = totalInPaise - paidInPaise;
        
        // NEW CRITICAL FIX: If amount paid equals service subtotal, set pending to 0 as requested
        if (Math.abs(paidInPaise - subtotalInPaise) <= 100) {
          console.log('CRITICAL - Create Order - Amount paid equals service subtotal, forcing pending to 0');
          remainingInPaise = 0;
        }
        
        // If very close to zero or negative, force to zero
        if (remainingInPaise <= 100) { // Within 1 rupee
          remainingInPaise = 0;
        }
        
        // If total paid is at least equal to total, force pending to 0
        if (paidInPaise >= totalInPaise) {
          remainingInPaise = 0;
        }
        
        // Convert back to rupees
        const pendingAmount = remainingInPaise / 100;
        
        // FORCE DIRECT CHECK - If total paid equals or exceeds total, pending MUST be 0
        if (paidInPaise >= totalInPaise) {
          orderData.pending_amount = 0;
        } else {
          orderData.pending_amount = pendingAmount;
        }
        
        // Critical logging to diagnose the issue
        console.log('CRITICAL - Create Order - Total in paise:', totalInPaise);
        console.log('CRITICAL - Create Order - Subtotal in paise:', subtotalInPaise);
        console.log('CRITICAL - Create Order - Tax in paise:', taxInPaise);
        console.log('CRITICAL - Create Order - Paid in paise:', paidInPaise);
        console.log('CRITICAL - Create Order - Pending in paise:', remainingInPaise);
        console.log('CRITICAL - Create Order - Final pending amount:', orderData.pending_amount);
      } else {
        // No split payment, set pending to 0
        orderData.pending_amount = 0;
      }
      
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

  // Update renderProductsSelectionSection to remove category selector
  const renderProductsSelectionSection = () => {
    const filteredProducts = getFilteredProducts();
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Products
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
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
                variant="outlined"
                size="small"
              />
            </Grid>
            
            {/* Add toggle for inventory products */}
            {inventoryProducts && inventoryProducts.length > 0 && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showInventoryProducts}
                      onChange={(e) => setShowInventoryProducts(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Inventory Products"
                />
              </Grid>
            )}
          </Grid>
        </Box>
        
        {/* Product Grid */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => (
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
                        {product.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(product.price)}
                        </Typography>
                        {product.stock !== undefined && (
                          <Chip 
                            size="small" 
                            label={`Stock: ${product.stock}`} 
                            color={product.stock > 5 ? 'success' : product.stock > 0 ? 'warning' : 'error'} 
                            variant="outlined" 
                          />
                        )}
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
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No products found. Try adjusting your search.
                  </Typography>
                  {!inventoryProducts?.length && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No inventory products available. Add products in the Inventory Management section.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    );
  };

  const handlePaymentMethodChange = (event: SelectChangeEvent<PaymentMethod>) => {
    const selectedMethod = event.target.value as PaymentMethod;
    dispatch({ type: 'SET_NEW_PAYMENT_METHOD', method: selectedMethod });
    
    // If this is the second payment method, set the amount to the pending amount
    if (splitPayments.length === 1) {
      dispatch({ type: 'SET_NEW_PAYMENT_AMOUNT', amount: pendingAmount });
    }
  };

  // Add a helper function to get stylists from localStorage if needed
  const getStylists = () => {
    // First try to get from the hook
    if (stylists && stylists.length > 0) {
      return stylists;
    }
    
    // If hook fails, try localStorage
    try {
      const localStylists = localStorage.getItem('local_stylists');
      if (localStylists) {
        return JSON.parse(localStylists);
      }
    } catch (error) {
      console.error('Error loading stylists from localStorage:', error);
    }
    
    // If all else fails, return empty array
    return [];
  };

  // When rendering the stylist selector, use the getStylists helper
  const renderStylistSelector = () => {
    const availableStylists = getStylists();
    
    return (
      <FormControl fullWidth error={!!stylistError}>
        <InputLabel id="stylist-select-label">Select Stylist *</InputLabel>
        <Select
          labelId="stylist-select-label"
          value={selectedStylist}
          label="Select Stylist *"
          onChange={(e) => setSelectedStylist(e.target.value)}
        >
          {availableStylists.map((stylist: any) => (
            <MenuItem key={stylist.id} value={stylist.id}>
              {stylist.name}
            </MenuItem>
          ))}
        </Select>
        {stylistError && <FormHelperText>{stylistError}</FormHelperText>}
      </FormControl>
    );
  };

  // Add a helper function to get clients from localStorage if needed
  const getClients = () => {
    // First try to get from the hook
    if (clients && clients.length > 0) {
      return clients;
    }
    
    // If hook fails, try localStorage
    try {
      const localClients = localStorage.getItem('local_clients');
      if (localClients) {
        return JSON.parse(localClients);
      }
    } catch (error) {
      console.error('Error loading clients from localStorage:', error);
    }
    
    // If all else fails, return empty array
    return [];
  };

  // When rendering the client selector, use the getClients helper
  const renderClientSelector = () => {
    const availableClients = getClients();
    
    return (
      <Autocomplete
        id="client-selector"
        options={availableClients}
        getOptionLabel={(option) => option.full_name || ''}
        value={selectedClient}
        onChange={(event, newValue) => {
          setSelectedClient(newValue);
          if (newValue) {
            setCustomerName(newValue.full_name || '');
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Client *"
            variant="outlined"
            error={!!clientError}
            helperText={clientError}
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
      />
    );
  };

  // Add a helper function to get services from localStorage if needed
  const getServices = () => {
    // First try to get from the hook
    if (allServices && allServices.length > 0) {
      return allServices;
    }
    
    // If hook fails, try localStorage
    try {
      const localServices = localStorage.getItem('local_services');
      if (localServices) {
        return JSON.parse(localServices);
      }
    } catch (error) {
      console.error('Error loading services from localStorage:', error);
    }
    
    // If all else fails, return empty array
    return [];
  };

  // Update the service filter using the getServices helper
  const getFilteredServices = () => {
    const services = getServices();
    
    return services.filter(service => 
      service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
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
                      {renderClientSelector()}
                    </Grid>
                    
                    <Grid item xs={12}>
                      {renderStylistSelector()}
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
                            onChange={(e) => dispatch({ type: 'SET_SPLIT_PAYMENT', value: e.target.checked })}
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
                                  onChange={(e) => dispatch({ type: 'SET_NEW_PAYMENT_AMOUNT', amount: Number(e.target.value) })}
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
                                    onChange={handlePaymentMethodChange}
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