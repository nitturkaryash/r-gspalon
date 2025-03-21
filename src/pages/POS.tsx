import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
  Checkbox,
} from "@mui/material";
import SalonPurchase from '../components/SalonPurchase';
import { 
  Menu as MenuIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  ContentCut as ContentCutIcon,
  AccessTime as AccessTimeIcon,
  DeleteOutline as DeleteOutlineIcon,
  ShoppingCart as CartIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

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
      style={{ height: "100%", width: "100%" }}
    >
      {value === index && <Box sx={{ 
        height: "100%", 
        pt: 2, 
        px: 1, 
        width: "100%",
        borderRadius: '8px', 
        overflow: 'hidden' 
      }}>{children}</Box>}
    </div>
  );
};

// Define POSService interface
interface POSService {
  id: string;
  name: string;
  price: number;
  duration?: number;
  type?: "service" | "product";
}

// Define OrderItem interface with salon purchase properties
interface OrderItem {
  service: POSService;
  quantity: number;
  type: "service" | "product";
  customPrice?: number;
  forSalonUse?: boolean;
  consumptionPurpose?: string;
}

// Define payment method types
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "upi" | "bnpl";

// Payment method labels for display
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  bnpl: "Pay Later",
};

// Available payment methods
const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit_card",
  "debit_card",
  "upi",
  "bnpl",
];

export default function POS() {
  // State for tab selection
  const [tabValue, setTabValue] = useState(0);
  
  // State for current step in the workflow
  const [activeStep, setActiveStep] = useState(0);
  
  // State for customer and stylist selection
  const [customerName, setCustomerName] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState("");
  
  // State for appointment time
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(new Date());
  
  // State for order items and checkout
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<PaymentMethod>("cash");
  const [walkInDiscount, setWalkInDiscount] = useState(0);
  
  // State for split payment
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<any[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>("cash");
  
  // State for processing and notifications
  const [processing, setProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // State for salon purchase
  const [isSalonPurchase, setIsSalonPurchase] = useState<boolean>(false);
  const [salonPurchaseNote, setSalonPurchaseNote] = useState<string>("");
  
  // Mock data for clients and stylists (replace with actual API calls)
  const [clients, setClients] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' }
  ]);
  
  // Calculate different types of items
  const serviceItems = useMemo(() => {
    return orderItems.filter(
      (item) => item.type === "service"
    );
  }, [orderItems]);
  
  const productItems = useMemo(() => {
    return orderItems.filter(
      (item) => item.type === "product" && !item.forSalonUse
    );
  }, [orderItems]);
  
  const salonUseItems = useMemo(() => {
    return orderItems.filter(
      (item) => item.type === "product" && item.forSalonUse
    );
  }, [orderItems]);
  
  // Calculate subtotals
  const serviceSubtotal = useMemo(() => {
    return serviceItems.reduce(
      (sum, item) => sum + (item.customPrice || item.service.price) * item.quantity,
      0
    );
  }, [serviceItems]);
  
  const productSubtotal = useMemo(() => {
    return productItems.reduce(
      (sum, item) => sum + (item.customPrice || item.service.price) * item.quantity,
      0
    );
  }, [productItems]);
  
  const orderSubtotal = useMemo(() => {
    return serviceSubtotal + productSubtotal;
  }, [serviceSubtotal, productSubtotal]);
  
  // Calculate tax (18%)
  const tax = useMemo(() => {
    return Math.round(orderSubtotal * 0.18);
  }, [orderSubtotal]);
  
  // Calculate total
  const total = useMemo(() => {
    return orderSubtotal + tax - walkInDiscount;
  }, [orderSubtotal, tax, walkInDiscount]);
  
  // Get amount paid (for split payment)
  const getAmountPaid = () => {
    return splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };
  
  // Calculate pending amount for split payment
  const pendingAmount = useMemo(() => {
    const amountPaid = getAmountPaid();
    return total - amountPaid;
  }, [total, splitPayments]);
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle client selection
  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    if (client) {
      setCustomerName(client.full_name || '');
    }
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  // Handle adding item to order
  const handleAddToOrder = (service: POSService, quantity: number = 1, customPrice?: number) => {
    // Create a new order item
    const newItem: OrderItem = {
      service,
      quantity,
      type: service.type || "product",
      customPrice,
      // Mark all products as for salon use when in salon purchase mode
      forSalonUse: isSalonPurchase && service.type === "product",
      consumptionPurpose: isSalonPurchase ? salonPurchaseNote : undefined
    };
    
    // Add to order items
    setOrderItems((prev) => [...prev, newItem]);
  };
  
  // Add split payment
  const handleAddSplitPayment = () => {
    const newPayment = {
      id: Date.now().toString(),
      payment_method: newPaymentMethod,
      amount: newPaymentAmount,
    };
    
    setSplitPayments([...splitPayments, newPayment]);
    setNewPaymentAmount(0);
  };
  
  // Remove split payment
  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter((payment) => payment.id !== id));
  };
  
  // Validate current step
  const isStepValid = () => {
    if (activeStep === 0) {
      if (isSalonPurchase) {
        // For salon purchases, only stylist selection is required
        return selectedStylist !== "";
      } else {
        // For regular orders, both customer name and stylist are required
        return customerName.trim() !== "" && selectedStylist !== "";
      }
    }
    
    if (activeStep === 1) {
      if (isSalonPurchase) {
        // Salon purchases must include at least one product
        return orderItems.some(item => item.type === "product");
      } else {
        // Regular orders must have at least one service or product
        return orderItems.length > 0;
      }
    }
    
    // For payment step
    if (activeStep === 2) {
      if (isSplitPayment) {
        return pendingAmount <= 0;
      }
      return true;
    }
    
    return true;
  };
  
  // Create walk-in order
  const handleCreateWalkInOrder = async () => {
    try {
    setProcessing(true);
    
      // Prepare service items for the order
      const serviceItemsForOrder = orderItems.map(item => ({
        service_id: item.service.id,
        service_name: item.service.name,
        price: item.customPrice || item.service.price,
        type: item.type,
        forSalonUse: item.forSalonUse || false,
        consumptionPurpose: item.consumptionPurpose || ''
      }));
      
      // Format appointment time if available
      let formattedAppointmentTime: string | undefined = undefined;
      if (appointmentDate && appointmentTime) {
        const date = new Date(appointmentDate);
        date.setHours(appointmentTime.getHours());
        date.setMinutes(appointmentTime.getMinutes());
        formattedAppointmentTime = date.toISOString();
      }
      
      // Create order data
      const orderData: any = {
        client_name: isSalonPurchase ? "Salon Internal" : customerName,
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
        // Add salon purchase flag and note
        is_salon_purchase: isSalonPurchase,
        salon_purchase_note: isSalonPurchase ? salonPurchaseNote : null,
      };
      
      // Simulate API call (replace with actual API call)
      setTimeout(() => {
        // Success
        setSnackbarMessage("Order created successfully!");
        setSnackbarOpen(true);
        resetFormState();
        setProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error creating order:", error);
      setSnackbarMessage("Error creating order");
      setSnackbarOpen(true);
      setProcessing(false);
    }
  };
  
  // Reset form state
  const resetFormState = () => {
    setCustomerName("");
      setSelectedClient(null);
    setSelectedStylist("");
    setOrderItems([]);
    setWalkInPaymentMethod("cash");
      setWalkInDiscount(0);
      setIsSplitPayment(false);
      setSplitPayments([]);
    setNewPaymentAmount(0);
    setNewPaymentMethod("cash");
    setActiveStep(0);
    setAppointmentDate(new Date());
    setAppointmentTime(new Date());
    
    // Reset salon purchase state
    setIsSalonPurchase(false);
    setSalonPurchaseNote("");
  };
  
  // Render service selection section
  const renderServiceSelectionSection = () => {
    return (
      <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
          Select Services
            </Typography>
        {/* Service selection UI goes here */}
              <Grid container spacing={2}>
          {/* Example service cards */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Haircut</Typography>
                <Typography color="text.secondary">₹500 • 30 min</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleAddToOrder({
                  id: 's1',
                  name: 'Haircut',
                  price: 500,
                  duration: 30,
                  type: 'service'
                })}>
                  Add
                </Button>
              </CardActions>
            </Card>
                </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
                    <CardContent>
                <Typography variant="h6">Hair Coloring</Typography>
                <Typography color="text.secondary">₹2000 • 90 min</Typography>
                    </CardContent>
                    <CardActions>
                <Button size="small" onClick={() => handleAddToOrder({
                  id: 's2',
                  name: 'Hair Coloring',
                  price: 2000,
                  duration: 90,
                  type: 'service'
                })}>
                  Add
                      </Button>
                    </CardActions>
                  </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render product selection section
  const renderProductsSelectionSection = () => {
    return (
      <Box sx={{ mt: !isSalonPurchase ? 3 : 0, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isSalonPurchase ? "Salon Purchase Products" : "Add Products (Optional)"}
            </Typography>
            
        {/* Product selection UI goes here */}
              <Grid container spacing={2}>
          {/* Example product cards */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Shampoo</Typography>
                <Typography color="text.secondary">₹450</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleAddToOrder({
                  id: 'p1',
                  name: 'Shampoo',
                  price: 450,
                      type: 'product'
                })}>
                  Add
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
                    <CardContent>
                <Typography variant="h6">Hair Serum</Typography>
                <Typography color="text.secondary">₹650</Typography>
                    </CardContent>
                    <CardActions>
                <Button size="small" onClick={() => handleAddToOrder({
                  id: 'p2',
                  name: 'Hair Serum',
                  price: 650,
                            type: 'product'
                })}>
                  Add
                      </Button>
                    </CardActions>
                  </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

    return (
    <Box sx={{ 
      flexGrow: 1, 
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch'
    }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ width: '100%' }}
        >
          <Tab label="Walk-In Order" icon={<ShoppingBasketIcon />} />
          <Tab
            label="Appointment Payment"
            icon={<PaymentIcon />}
            disabled={true}
          />
        </Tabs>
      </Paper>

      {/* Walk-In Order Panel */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 0, height: "100%", borderRadius: '8px', width: '100%' }}>
          {/* Stepper for walkthrough */}
          <Stepper
            activeStep={activeStep}
            sx={{ p: 3, borderBottom: "1px solid rgba(0, 0, 0, 0.12)", width: '100%' }}
          >
              <Step>
              <StepLabel>Customer Info</StepLabel>
              </Step>
              <Step>
              <StepLabel>Services & Products</StepLabel>
              </Step>
              <Step>
                <StepLabel>Payment</StepLabel>
              </Step>
            </Stepper>
            
          {/* Main content based on active step */}
          <Box
            sx={{
              p: 0,
              height: "calc(100% - 72px)",
              display: "flex",
              flexDirection: "column",
              width: '100%'
            }}
          >
            <Grid container spacing={2} sx={{ flexGrow: 1, width: '100%', m: 0 }}>
              {/* Left side - Form based on current step */}
              <Grid
                item
                xs={12}
                md={8}
                sx={{ height: "100%", overflowY: "auto", boxSizing: 'border-box' }}
              >
              {activeStep === 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Customer Information
                    </Typography>

                  <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={clients || []}
                          getOptionLabel={(option) => option.full_name || ""}
                        value={selectedClient}
                          onChange={(_, newValue) =>
                            handleClientSelect(newValue)
                          }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                              label="Select Existing Client"
                              variant="outlined"
                              fullWidth
                            />
                          )}
                      />
                    </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Name"
                          variant="outlined"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl
                          fullWidth
                          required
                          error={activeStep === 0 && selectedStylist === ""}
                        >
                          <InputLabel id="stylist-select-label">
                            Select Stylist
                          </InputLabel>
                        <Select
                            labelId="stylist-select-label"
                            id="stylist-select"
                          value={selectedStylist}
                          label="Select Stylist"
                            onChange={(e) => setSelectedStylist(e.target.value)}
                            sx={{ borderRadius: '8px' }}
                        >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                          {stylists?.map((stylist) => (
                            <MenuItem key={stylist.id} value={stylist.id}>
                              {stylist.name}
                            </MenuItem>
                          ))}
                        </Select>
                          {activeStep === 0 && selectedStylist === "" && (
                          <Typography variant="caption" color="error">
                              Stylist is required
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                      
                      {/* Add Salon Purchase component */}
                      <SalonPurchase
                        isSalonPurchase={isSalonPurchase}
                        setIsSalonPurchase={setIsSalonPurchase}
                        salonPurchaseNote={salonPurchaseNote}
                        setSalonPurchaseNote={setSalonPurchaseNote}
                      />
                    
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Appointment Time (Optional)
                      </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          You can optionally specify when this service will be
                          provided.
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <LocalizationProvider
                                dateAdapter={AdapterDateFns}
                              >
                            <DatePicker
                                  label="Date"
                              value={appointmentDate}
                                  onChange={(newValue) =>
                                    setAppointmentDate(newValue)
                                  }
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: "outlined",
                                    },
                                  }}
                                />
                              </LocalizationProvider>
                          </Grid>
                            <Grid item xs={12} md={6}>
                              <LocalizationProvider
                                dateAdapter={AdapterDateFns}
                              >
                            <TimePicker
                                  label="Time"
                              value={appointmentTime}
                                  onChange={(newValue) =>
                                    setAppointmentTime(newValue)
                                  }
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: "outlined",
                                    },
                                  }}
                                  disabled={!appointmentDate}
                                />
                              </LocalizationProvider>
                          </Grid>
                        </Grid>
                        </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {activeStep === 1 && (
                <>
                    {!isSalonPurchase && renderServiceSelectionSection()}
                  {renderProductsSelectionSection()}
                </>
              )}
              
              {activeStep === 2 && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Payment Details
                    </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel id="payment-method-label">
                        Payment Method
                          </InputLabel>
                          <Select
                            labelId="payment-method-label"
                            value={walkInPaymentMethod}
                            onChange={(e) =>
                              setWalkInPaymentMethod(
                                e.target.value as PaymentMethod,
                              )
                            }
                            label="Payment Method"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <MenuItem key={method} value={method}>
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Box sx={{ mr: 1 }}>
                                    {/* Payment icon would go here */}
                                  </Box>
                                  {PAYMENT_METHOD_LABELS[method]}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Discount"
                          variant="outlined"
                          type="number"
                          value={walkInDiscount}
                          onChange={(e) =>
                            setWalkInDiscount(Math.round(Number(e.target.value)))
                          }
                          InputProps={{
                            inputProps: { min: 0, step: 1 },
                            startAdornment: (
                              <InputAdornment position="start">
                                ₹
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isSplitPayment}
                              onChange={(e) =>
                                setIsSplitPayment(e.target.checked)
                              }
                            color="primary"
                          />
                        }
                        label="Split Payment"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Collapse in={isSplitPayment}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Add Payment
                            </Typography>
                            
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={5}>
                                <TextField
                                  fullWidth
                                  label="Amount"
                                  variant="outlined"
                                  type="number"
                                  value={newPaymentAmount}
                                  onChange={(e) =>
                                    setNewPaymentAmount(Math.round(Number(e.target.value)))
                                  }
                                  InputProps={{
                                    inputProps: { min: 0, step: 1 },
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        ₹
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <FormControl fullWidth>
                                  <InputLabel id="new-payment-method-label">
                                    Payment Method
                                  </InputLabel>
                                  <Select
                                    labelId="new-payment-method-label"
                                    value={newPaymentMethod}
                                    onChange={(e) =>
                                      setNewPaymentMethod(
                                        e.target.value as PaymentMethod,
                                      )
                                    }
                                    label="Payment Method"
                                  >
                                    {PAYMENT_METHODS.map((method) => (
                                        <MenuItem key={method} value={method}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                          }}
                                        >
                                          <Box sx={{ mr: 1 }}>
                                            {/* Payment icon would go here */}
                                          </Box>
                                            {PAYMENT_METHOD_LABELS[method]}
                                          </Box>
                                        </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  fullWidth
                                  onClick={handleAddSplitPayment}
                                  disabled={
                                    newPaymentAmount <= 0 ||
                                    newPaymentAmount > pendingAmount ||
                                    splitPayments.length >= 2
                                  }
                                >
                                  Add
                                </Button>
                              </Grid>
                            </Grid>

                            {/* Display pending amount */}
                            <Box
                                      sx={{ 
                                mt: 2,
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography>Pending Amount:</Typography>
                              <Typography
                                fontWeight="medium"
                                color={pendingAmount > 0 ? "error" : "success"}
                              >
                                {formatCurrency(pendingAmount)}
                                      </Typography>
                                    </Box>

                            {/* Show split payments */}
                            {splitPayments.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  Payment Breakdown
                                </Typography>
                                <TableContainer
                                  component={Paper}
                                  variant="outlined"
                                  sx={{ borderRadius: '8px', overflow: 'hidden' }}
                                >
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Method</TableCell>
                                        <TableCell align="right">
                                          Amount
                                        </TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {splitPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                          <TableCell>
                                            <Box
                                        sx={{ 
                                                display: "flex",
                                                alignItems: "center",
                                              }}
                                            >
                                              <Box sx={{ mr: 1 }}>
                                                {/* Payment icon would go here */}
                                      </Box>
                                              {PAYMENT_METHOD_LABELS[payment.payment_method as PaymentMethod]}
                              </Box>
                                          </TableCell>
                                          <TableCell align="right">
                                            {formatCurrency(payment.amount)}
                                          </TableCell>
                                          <TableCell align="right">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() =>
                                                handleRemoveSplitPayment(
                                                  payment.id,
                                                )
                                              }
                                            >
                                              <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow>
                                        <TableCell>
                                          <strong>Total Paid</strong>
                                        </TableCell>
                                        <TableCell align="right" colSpan={2}>
                                          <strong>
                                            {formatCurrency(getAmountPaid())}
                                          </strong>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                            </Box>
                          )}
                      </Paper>
                        </Collapse>
                    </Grid>
                  </Grid>
                </Box>
              )}

                {/* Navigation buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 3,
                  }}
                >
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
                      startIcon={
                        processing ? (
                          <CircularProgress size={20} />
                        ) : (
                          <CheckIcon />
                        )
                      }
                    >
                      {processing ? "Processing..." : "Complete Order"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                      sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '1rem'
                      }}
                >
                  Next
                </Button>
              )}
            </Box>
        </Grid>
        
        {/* Right side - Order Summary */}
              <Grid item xs={12} md={4} sx={{ height: "100%", boxSizing: 'border-box' }}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            {orderItems.length > 0 ? (
                    <Box
                      sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                    >
                      <List sx={{ flex: 1, overflow: "auto" }}>
                  {/* Show services */}
                  {serviceItems.length > 0 && (
                    <ListItem dense>
                      <ListItemText
                              primary={
                                <Typography variant="subtitle2" color="primary">
                                  Services
                                </Typography>
                              }
                      />
                    </ListItem>
                  )}
                  
                  {serviceItems.map((item) => (
                    <ListItem key={item.service.id}>
                      <ListItemText
                        primary={
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <ContentCutIcon
                                    fontSize="small"
                                    sx={{ mr: 1, opacity: 0.7 }}
                                  />
                                  <Typography>
                                    {item.service.name} (×{item.quantity})
                                  </Typography>
                          </Box>
                        }
                              secondary={
                                item.service.duration
                                  ? `${item.service.duration} min`
                                  : null
                              }
                      />
                      <ListItemSecondaryAction>
                              <Typography>
                                {formatCurrency(
                                  (item.customPrice || item.service.price) *
                                    item.quantity,
                                )}
                              </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {/* Show products */}
                  {productItems.length > 0 && (
                          <ListItem
                            dense
                            sx={{ mt: serviceItems.length > 0 ? 2 : 0 }}
                          >
                      <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle2"
                                  color="secondary"
                                >
                                  Products
                                </Typography>
                              }
                      />
                    </ListItem>
                  )}
                  
                  {productItems.map((item) => (
                    <ListItem key={item.service.id}>
                      <ListItemText
                        primary={
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <ShoppingBasketIcon
                                    fontSize="small"
                                    sx={{ mr: 1, opacity: 0.7 }}
                                  />
                                  <Typography>
                                    {item.service.name} (×{item.quantity})
                                  </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                              <Typography>
                                {formatCurrency(
                                  (item.customPrice || item.service.price) *
                                    item.quantity,
                                )}
                              </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                        
                        {/* Show salon-use products separately */}
                        {salonUseItems.length > 0 && (
                          <>
                            <ListItem
                              dense
                              sx={{ mt: 2 }}
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="subtitle2"
                                    color="warning.main"
                                  >
                                    Salon Use Products (not billed to customer)
                                  </Typography>
                                }
                              />
                            </ListItem>
                            
                            {salonUseItems.map((item) => (
                              <ListItem key={`salon-${item.service.id}`}>
                                <ListItemText
                                  primary={
                                    <Box
                                      sx={{ display: "flex", alignItems: "center" }}
                                    >
                                      <ShoppingBasketIcon
                                        fontSize="small"
                                        sx={{ mr: 1, opacity: 0.7, color: "warning.main" }}
                                      />
                                      <Typography color="text.secondary">
                                        {item.service.name} (×{item.quantity})
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={item.consumptionPurpose || "For salon use"}
                                />
                                <ListItemSecondaryAction>
                                  <Typography color="text.secondary">
                                    {formatCurrency(
                                      (item.customPrice || item.service.price) *
                                        item.quantity,
                                    )}
                                  </Typography>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </>
                        )}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Order Totals */}
                <Box>
                  {serviceItems.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                      <Typography>Service Subtotal:</Typography>
                            <Typography>
                              {formatCurrency(serviceSubtotal)}
                            </Typography>
                    </Box>
                  )}
                  
                  {productItems.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                      <Typography>Product Subtotal:</Typography>
                            <Typography>
                              {formatCurrency(productSubtotal)}
                            </Typography>
                    </Box>
                  )}
                  
                        {serviceItems.length > 0 && productItems.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                              pt: 1,
                              borderTop: "1px dashed rgba(0, 0, 0, 0.12)",
                            }}
                          >
                            <Typography fontWeight="medium">
                              Combined Subtotal:
                            </Typography>
                            <Typography fontWeight="medium">
                              {formatCurrency(orderSubtotal)}
                            </Typography>
                    </Box>
                  )}
                  
                  {/* Display GST for all payment methods */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                    <Typography>GST (18%):</Typography>
                    <Typography>{formatCurrency(tax)}</Typography>
                  </Box>
                  
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                    <Typography>Discount:</Typography>
                    <Typography color="error">
                      -{formatCurrency(walkInDiscount)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
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
                            label={`Stylist: ${stylists?.find((s) => s.id === selectedStylist)?.name}`}
                      sx={{ mb: 1 }} 
                    />
                    
                    {appointmentDate && appointmentTime && (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                              label={`${appointmentDate.toLocaleDateString()} at ${appointmentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}`}
                        sx={{ mb: 1 }} 
                      />
                    )}
                  </Box>
                )}
              </Box>
            ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <CartIcon
                        sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                      />
                <Typography variant="h6" color="text.secondary">
                  Your cart is empty
                </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                  Add services to create an order
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
          </Box>
        </Paper>
      </TabPanel>

      {/* Appointment Payment Panel */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Process Appointment Payment
          </Typography>

          {/* This tab is disabled in the current implementation */}
          <Alert severity="info">
            This feature is coming soon! Please use the Walk-In Order tab for
            now.
          </Alert>
        </Paper>
      </TabPanel>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
} 

