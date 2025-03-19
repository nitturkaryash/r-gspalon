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
} from "@mui/material";
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
  Info as InfoIcon,
} from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  usePOS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  PaymentDetail,
} from "../hooks/usePOS";
import { useStylists } from "../hooks/useStylists";
import { useServices } from "../hooks/useServices";
import { useClients } from "../hooks/useClients";
import { useServiceCollections } from "../hooks/useServiceCollections";
import { useCollectionServices } from "../hooks/useCollectionServices";
import { useCollections } from "../hooks/useCollections";
import { useInventory, SalonConsumptionItem } from "../hooks/useInventory";
import { formatCurrency } from "../utils/format";
import { playCashRegisterSound } from "../assets/sounds/cash-register";
import { toast } from "react-toastify";

/**
 * Ensures product price is in the correct format
 * Multiplies the price by 100 to match the Products section display
 */
const normalizeProductPrice = (price: any): number => {
  try {
    if (price === undefined || price === null) {
      console.warn("[POS Debug] Price is undefined or null, using 0");
      return 0;
    }

    // Parse the price to a number if it's not already
    const numericPrice =
      typeof price === "string" ? parseFloat(price) : Number(price);

    // Check if the price is valid
    if (isNaN(numericPrice)) {
      console.warn("[POS Debug] Invalid price detected:", price, "using 0");
      return 0;
    }

    // Multiply by 100 to match the Products section price format
    const adjustedPrice = Math.round(numericPrice * 100);
    
    console.log("[POS Debug] Original price:", numericPrice, "Adjusted price:", adjustedPrice);
    return adjustedPrice;
  } catch (error) {
    console.error(
      "[POS Debug] Error normalizing price:",
      error,
      "for price:",
      price,
    );
    return 0;
  }
};

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
      style={{ height: "100%" }}
    >
      {value === index && <Box sx={{ height: "100%", pt: 2 }}>{children}</Box>}
    </div>
  );
};

// Define POSService interface for this component
interface POSService {
  id: string;
  name: string;
  price: number;
  duration?: number;
  type?: "service" | "product";
}

// Update OrderItem interface to include customPrice
interface OrderItem {
  service: POSService;
  quantity: number;
  type: "service" | "product";
  customPrice?: number; // Add customPrice property
  forSalonUse?: boolean; // Add forSalonUse property for tracking consumption
  consumptionPurpose?: string; // Add consumptionPurpose for tracking reason
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
    calculateTotal,
  } = usePOS();
  const { stylists, isLoading: loadingStylists } = useStylists();
  const { services: allServices, isLoading: loadingServices } = useServices();
  const { serviceCollections, isLoading: loadingServiceCollections } =
    useServiceCollections();
  const { services: collectionServices, isLoading: loadingCollectionServices } =
    useCollectionServices();
  const { collections, isLoading: loadingCollections } = useCollections();
  const { clients, isLoading: loadingClients } = useClients();
  const { recordSalonConsumption } = useInventory();

  // State for order items and tabs
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [walkInDiscount, setWalkInDiscount] = useState(0);
  const [walkInPaymentMethod, setWalkInPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // State for split payment
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<PaymentDetail[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  // State for services and products
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [selectedServiceCollection, setSelectedServiceCollection] =
    useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 for services, 1 for products

  // State for appointment payment processing
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null,
  );
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] =
    useState<PaymentMethod>("upi");
  const [appointmentDiscount, setAppointmentDiscount] = useState<number>(0);
  const [activeStep, setActiveStep] = useState(0);

  // State for walk-in order creation
  const [selectedStylist, setSelectedStylist] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(
    new Date(),
  );
  const [appointmentTime, setAppointmentTime] = useState<Date | null>(
    new Date(),
  );

  // Selected collection state
  const [_expandedServiceCollection, _setExpandedServiceCollection] =
    useState<boolean>(false);
  const [_expandedProductCategory, _setExpandedProductCategory] =
    useState<boolean>(false);

  // Filter active services for the order creation
  const activeServices = allServices?.filter((service) => service.active) || [];

  // Get services for the selected collection or all services if no collection is selected
  const getServicesForCollection = () => {
    if (!selectedServiceCollection) {
      return filteredServices;
    }
    return (
      collectionServices?.filter(
        (service) =>
          service.collection_id === selectedServiceCollection &&
          service.active &&
          (service.name
            .toLowerCase()
            .includes(serviceSearchQuery.toLowerCase()) ||
            (service.description &&
              service.description
                .toLowerCase()
                .includes(serviceSearchQuery.toLowerCase()))),
      ) || []
    );
  };

  // Filter services based on search query
  const filteredServices = activeServices.filter(
    (service) =>
      service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
      (service.description &&
        service.description
          .toLowerCase()
          .includes(serviceSearchQuery.toLowerCase())),
  );

  // Get product categories from collections instead of products
  const getProductCategories = () => {
    try {
      // If collections are available, use them
      if (collections && collections.length > 0) {
        return collections.map((collection) => collection.name);
      }

      // Fallback to existing method if collections aren't available
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const categories = [
        ...new Set(products.map((product: any) => product.category)),
      ];
      return categories;
    } catch (error) {
      console.error("Error getting product categories:", error);
      return [];
    }
  };

  // Wrap the getFilteredProducts function with better error handling
  const getFilteredProducts = () => {
    try {
      // Ensure we're using a single source of truth for products
      let products = [];
      try {
        const storedProducts = localStorage.getItem("products");
        if (!storedProducts) {
          console.warn("[POS Debug] No products found in localStorage");
          return [];
        }
        products = JSON.parse(storedProducts);
      } catch (storageError) {
        console.error(
          "[POS Debug] Error accessing localStorage:",
          storageError,
        );
        return [];
      }

      if (!products || products.length === 0) {
        console.warn(
          "[POS Debug] No products found or empty array in localStorage",
        );
        return [];
      }

      // Add debug logging for the current filtering operation
      console.log(
        `[POS Debug] Filtering products with category: "${selectedProductCategory}" and search: "${productSearchQuery}"`,
      );

      return products.filter((product: any) => {
        if (!product) return false;

        try {
          // Check for active status and stock
          const isActive = product.status === "active";
          const hasStock =
            typeof product.stock === "number" && product.stock > 0;

          // If we have a selected category, find the collection ID that matches the name
          let matchesCategory = true;
          if (selectedProductCategory) {
            // Try multiple ways to match the category
            if (collections && collections.length > 0) {
              const collection = collections.find(
                (c) => c.name === selectedProductCategory,
              );
              if (collection) {
                // Check both collection_id and category fields for flexibility
                matchesCategory =
                  product.collection_id === collection.id ||
                  product.category === selectedProductCategory ||
                  product.collection_name === selectedProductCategory;
              } else {
                // Fallback to category matching if collection not found
                matchesCategory = product.category === selectedProductCategory;
              }
            } else {
              // Fallback to category matching if no collections
              matchesCategory = product.category === selectedProductCategory;
            }
          }

          // Check if product name or description matches search query
          const matchesSearch =
            productSearchQuery === "" ||
            (product.name &&
              product.name
                .toLowerCase()
                .includes(productSearchQuery.toLowerCase())) ||
            (product.description &&
              product.description
                .toLowerCase()
                .includes(productSearchQuery.toLowerCase()));

          return isActive && hasStock && matchesCategory && matchesSearch;
        } catch (filterError) {
          console.error(
            "[POS Debug] Error filtering product:",
            product,
            filterError,
          );
          return false;
        }
      });
    } catch (error) {
      console.error("[POS Debug] Error in getFilteredProducts:", error);
      return [];
    }
  };

  // Calculate separate totals for services and products
  const serviceItems = orderItems.filter((item) => item.type === "service");
  // Only include products that are NOT marked for salon use in the bill
  const productItems = orderItems.filter((item) => item.type === "product" && !item.forSalonUse);
  // Keep track of salon consumption products separately
  const salonUseItems = orderItems.filter((item) => item.type === "product" && item.forSalonUse);

  const serviceSubtotal = serviceItems.reduce(
    (sum, item) =>
      sum + (item.customPrice || item.service.price) * item.quantity,
    0,
  );

  const productSubtotal = productItems.reduce(
    (sum, item) =>
      sum + (item.customPrice || item.service.price) * item.quantity,
    0,
  );

  const orderSubtotal = serviceSubtotal + productSubtotal;

  // Calculate tax and total based on payment method
  // When using split payment, we need to calculate tax differently
  const { tax, total } = useMemo(() => {
    if (isSplitPayment && splitPayments.length > 0) {
      const hasCash = splitPayments.some(
        (payment) => payment.payment_method === "cash",
      );
      const hasNonCash = splitPayments.some(
        (payment) => payment.payment_method !== "cash",
      );
      const hasMixedPayments = hasCash && hasNonCash;

      const totalPaymentAmount = splitPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      let calculatedTax = 0;
      if (hasMixedPayments || hasNonCash) {
        calculatedTax = Math.round(orderSubtotal * 0.18);
      }

      return {
        tax: calculatedTax,
        total: orderSubtotal + calculatedTax - walkInDiscount,
      };
    } else {
      return calculateTotal(
        [orderSubtotal],
        walkInDiscount,
        walkInPaymentMethod,
      );
    }
  }, [
    orderSubtotal,
    walkInDiscount,
    walkInPaymentMethod,
    isSplitPayment,
    splitPayments,
  ]);

  // Function to calculate total paid
  const calculateTotalPaid = (payments: PaymentDetail[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  // Function to calculate pending amount accurately
  const calculateAccuratePendingAmount = (
    total: number,
    payments: PaymentDetail[],
  ) => {
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    // Use strict equality check
    return totalPaid === total ? 0 : Math.max(0, total - totalPaid);
  };

  // Update pending amount when split payments change
  useEffect(() => {
    if (isSplitPayment) {
      // Calculate everything using whole rupee amounts
      const totalAmount = Math.round(total);
      const subtotalAmount = Math.round(orderSubtotal);
      const taxAmount = Math.round(tax);
      const paidAmount = splitPayments.reduce((sum, payment) => {
        return sum + Math.round(payment.amount);
      }, 0);

      // Calculate remaining
      let remainingAmount = totalAmount - paidAmount;

      // If amount paid equals service subtotal, set pending to 0 as requested
      if (Math.abs(paidAmount - subtotalAmount) <= 1) {
        console.log(
          "CRITICAL - useEffect - Amount paid equals service subtotal, forcing pending to 0"
        );
        remainingAmount = 0;
      }

      // If within 1 rupee or negative, force to zero
      if (remainingAmount <= 1) {
        remainingAmount = 0;
      }

      // Critical logic: if paid equals or exceeds total, remaining MUST be 0
      if (paidAmount >= totalAmount) {
        remainingAmount = 0;
      }

      // Critical logging to diagnose the issue
      console.log("CRITICAL - useEffect - Total:", totalAmount);
      console.log("CRITICAL - useEffect - Subtotal:", subtotalAmount);
      console.log("CRITICAL - useEffect - Tax:", taxAmount);
      console.log("CRITICAL - useEffect - Paid:", paidAmount);
      console.log("CRITICAL - useEffect - Remaining:", remainingAmount);
      console.log(
        "CRITICAL - useEffect - Setting pending amount to:",
        remainingAmount
      );

      // DIRECT UPDATE: Set to 0 if very close to zero or paid exceeds total
      setPendingAmount(remainingAmount);
    }
  }, [splitPayments, total, isSplitPayment, orderSubtotal, tax]);

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
        const service = allServices.find(
          (s) => s.id === appointmentData.service_id,
        );

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
      setCustomerName("");
    }
  };

  // Update the handleAddService function to use original prices
  const handleAddService = (
    service: POSService,
    itemType: "service" | "product" = "service",
  ) => {
    // Check if this service already exists in the order
    const existingService = orderItems.find(
      (s) =>
        s.service.id === service.id && s.type === (service.type || itemType),
    );

    // Use the price exactly as provided, with no multiplication
    let finalPrice = service.price;

    if (existingService) {
      // If service exists, update the quantity
      setOrderItems(
        orderItems.map((s) =>
          s.service.id === service.id && s.type === (service.type || itemType)
            ? { ...s, quantity: s.quantity + 1 }
            : s,
        ),
      );
    } else {
      // Otherwise, add a new service
      setOrderItems([
        ...orderItems,
        {
          service: { ...service }, // Use the service as-is
          quantity: 1,
          type: service.type || itemType, // Use the passed itemType parameter or existing type
          customPrice: finalPrice, // Initialize customPrice with exact price
          forSalonUse: false, // Default forSalonUse to false
          consumptionPurpose: "", // Default consumptionPurpose to empty string
        },
      ]);
    }
  };

  // Add a handler for price changes
  const handlePriceChange = (serviceId: string, newPrice: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.service.id === serviceId
          ? { ...item, customPrice: newPrice }
          : item,
      ),
    );
  };

  // Remove a service from the walk-in order
  const handleRemoveService = (serviceId: string) => {
    const existingItemIndex = orderItems.findIndex(
      (item) => item.service.id === serviceId,
    );

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
    setOrderItems(orderItems.filter((item) => item.service.id !== serviceId));
  };

  // Handle steps in walk-in order process
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Update handleAddSplitPayment to use the new function
  const handleAddSplitPayment = () => {
    // Validation for maximum 2 payment methods
    if (splitPayments.length >= 2) {
      setSnackbarMessage("Maximum 2 payment methods allowed");
      setSnackbarOpen(true);
      return;
    }

    // Fix validation to check if amount is between 0 and the remaining amount (inclusive)
    if (newPaymentAmount <= 0 || newPaymentAmount > pendingAmount) {
      setSnackbarMessage("Invalid payment amount");
      setSnackbarOpen(true);
      return;
    }

    const newPayment: PaymentDetail = {
      id: (Math.random() * 1000000).toString(), // Temporary ID - will be replaced on server
      amount: Math.round(newPaymentAmount),
      payment_method: newPaymentMethod,
      payment_date: new Date().toISOString(),
    };

    const updatedSplitPayments = [...splitPayments, newPayment];
    setSplitPayments(updatedSplitPayments);
    setNewPaymentAmount(0);

    // Calculate everything in whole rupees - no paisa/cents
    const totalAmount = Math.round(total);
    const subtotalAmount = Math.round(orderSubtotal);
    const taxAmount = Math.round(tax);
    const paidAmount = updatedSplitPayments.reduce((sum, payment) => {
      return sum + Math.round(payment.amount);
    }, 0);

    // Calculate remaining amount
    let remainingAmount = totalAmount - paidAmount;

    // If amount paid equals service subtotal, set pending to 0 as requested
    if (Math.abs(paidAmount - subtotalAmount) <= 1) {
      console.log(
        "CRITICAL - handleAddSplitPayment - Amount paid equals service subtotal, forcing pending to 0"
      );
      remainingAmount = 0;
    }

    // If within 1 rupee or negative, force to zero
    if (remainingAmount <= 1) {
      remainingAmount = 0;
    }

    // Critical logic: if paid equals or exceeds total, remaining MUST be 0
    if (paidAmount >= totalAmount) {
      remainingAmount = 0;
    }

    // Critical logging to diagnose the issue
    console.log(
      "CRITICAL - handleAddSplitPayment - Total:",
      totalAmount
    );
    console.log(
      "CRITICAL - handleAddSplitPayment - Subtotal:",
      subtotalAmount
    );
    console.log("CRITICAL - handleAddSplitPayment - Tax:", taxAmount);
    console.log(
      "CRITICAL - handleAddSplitPayment - Paid:",
      paidAmount
    );
    console.log(
      "CRITICAL - handleAddSplitPayment - Remaining:",
      remainingAmount
    );
    console.log(
      "CRITICAL - handleAddSplitPayment - Final pending amount:",
      remainingAmount
    );

    // Set the pending amount to the calculated remaining
    setPendingAmount(remainingAmount);
  };

  // Remove a payment from the split payments list
  const handleRemoveSplitPayment = (paymentId: string) => {
    setSplitPayments(
      splitPayments.filter((payment) => payment.id !== paymentId),
    );
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

    // Validate consumption purpose for "For Salon Use" items
    const consumptionItems = orderItems.filter(
      (item) => item.type === "product" && item.forSalonUse,
    );
    const missingPurpose = consumptionItems.some(
      (item) => !item.consumptionPurpose,
    );

    if (missingPurpose) {
      setSnackbarMessage(
        "Please specify a purpose for all salon consumption items",
      );
      setSnackbarOpen(true);
      return;
    }

    setProcessing(true);

    try {
      // Prepare service items for the order - exclude salon use products from the main order
      const serviceItemsForOrder = orderItems
        .filter(item => !(item.type === "product" && item.forSalonUse))
        .map(item => ({
          service_id: item.service.id,
          service_name: item.service.name,
          price: item.customPrice || item.service.price,
          type: item.type,
          forSalonUse: false, // These should always be false as we've filtered out salon use items
          consumptionPurpose: ''
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
        // Calculate everything using whole rupee amounts
        const totalAmount = Math.round(total);
        const subtotalAmount = Math.round(orderSubtotal);
        const taxAmount = Math.round(tax);
        const paidAmount = splitPayments.reduce((sum, payment) => {
          return sum + Math.round(payment.amount);
        }, 0);

        // Calculate remaining
        let remainingAmount = totalAmount - paidAmount;

        // If amount paid equals service subtotal, set pending to 0 as requested
        if (Math.abs(paidAmount - subtotalAmount) <= 1) {
          console.log(
            "CRITICAL - Create Order - Amount paid equals service subtotal, forcing pending to 0"
          );
          remainingAmount = 0;
        }

        // If very close to zero or negative, force to zero
        if (remainingAmount <= 1) {
          remainingAmount = 0;
        }

        // If total paid is at least equal to total, force pending to 0
        if (paidAmount >= totalAmount) {
          remainingAmount = 0;
        }

        // FORCE DIRECT CHECK - If total paid equals or exceeds total, pending MUST be 0
        if (paidAmount >= totalAmount) {
          orderData.pending_amount = 0;
        } else {
          orderData.pending_amount = remainingAmount;
        }

        // Critical logging to diagnose the issue
        console.log("CRITICAL - Create Order - Total:", totalAmount);
        console.log("CRITICAL - Create Order - Subtotal:", subtotalAmount);
        console.log("CRITICAL - Create Order - Tax:", taxAmount);
        console.log("CRITICAL - Create Order - Paid:", paidAmount);
        console.log("CRITICAL - Create Order - Pending:", remainingAmount);
        console.log(
          "CRITICAL - Create Order - Final pending amount:",
          orderData.pending_amount
        );
      } else {
        // No split payment, set pending to 0
        orderData.pending_amount = 0;
      }

      // Create order
      const response = await createWalkInOrder(orderData);

      // Handle salon consumption items separately if there are any
      if (consumptionItems.length > 0) {
        try {
          // Create a unique voucher number for this consumption batch
          const voucherNumber = `POS-${new Date().getTime()}`;

          // Prepare consumption data for each item
          const consumptionData: SalonConsumptionItem[] = consumptionItems.map(
            (item) => ({
              date: new Date().toISOString(),
              product_name: item.service.name,
              hsn_code: "", // This would need to be fetched from product data
              units: "", // This would need to be fetched from product data
              requisition_voucher_no: voucherNumber,
              quantity: item.quantity,
              purpose: item.consumptionPurpose || "Salon Use",
              // Use rounded integer price
              unit_price: Math.round(item.customPrice || item.service.price),
            }),
          );

          // Record consumption in inventory system
          const result = await recordSalonConsumption(consumptionData);
          console.log("Salon consumption recording result:", result);
        } catch (error) {
          console.error("Error recording consumption data:", error);
          // Don't fail the whole transaction if consumption recording fails
          // Just log the error and continue
        }
      }

      // Show success message and play sound
      setSnackbarMessage("Order created successfully!");
      setSnackbarOpen(true);
      playCashRegisterSound();

      // Reset form
      setOrderItems([]);
      setCustomerName("");
      setSelectedClient(null);
      setSelectedStylist("");
      setAppointmentDate(null);
      setAppointmentTime(null);
      setActiveStep(0);
      setWalkInDiscount(0);
      setWalkInPaymentMethod("cash");
      setIsSplitPayment(false);
      setSplitPayments([]);
    } catch (error) {
      console.error("Error creating order:", error);
      setSnackbarMessage("Error creating order. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  // Check if all items in current step are valid
  const isStepValid = () => {
    switch (activeStep) {
      case 0: // Customer & Stylist
        return customerName.trim() !== "" && selectedStylist !== "";
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
    const servicesForCollection = getServicesForCollection();
    const isLoadingServices =
      loadingServices || loadingServiceCollections || loadingCollectionServices;

    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Selected Items
            </Typography>

            {orderItems.length > 0 ? (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mb: 3 }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow
                        key={item.service.id}
                        sx={{
                          backgroundColor:
                            item.type === "product" && item.forSalonUse
                              ? "rgba(255, 152, 0, 0.08)"
                              : "inherit",
                        }}
                      >
                        <TableCell>{item.service.name}</TableCell>
                        <TableCell>
                          {item.type === "service" ? (
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

                          {/* Show "For Salon Use" indicator if applicable */}
                          {item.type === "product" && item.forSalonUse && (
                            <Chip
                              size="small"
                              label="Salon Use"
                              color="warning"
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.customPrice || item.service.price}
                            onChange={(e) =>
                              handlePriceChange(
                                item.service.id,
                                Math.round(Number(e.target.value))
                              )
                            }
                            InputProps={{
                              inputProps: { min: 0, step: 1 },
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            }}
                            sx={{ width: "100px" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleRemoveService(item.service.id)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleAddService(item.service, item.type)
                              }
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            (item.customPrice || item.service.price) *
                              item.quantity,
                          )}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            {/* For Salon Use toggle for product items */}
                            {item.type === "product" && (
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={!!item.forSalonUse}
                                    onChange={(e) =>
                                      handleToggleSalonUse(
                                        item.service.id,
                                        e.target.checked,
                                      )
                                    }
                                    size="small"
                                    color="warning"
                                  />
                                }
                                label="Salon Use"
                                sx={{ mr: 1 }}
                              />
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteService(item.service.id)
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Add Purpose dropdown for Salon Use items */}
                    {orderItems.some(
                      (item) => item.type === "product" && item.forSalonUse,
                    ) && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              bgcolor: "rgba(255, 152, 0, 0.08)",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              Salon Consumption Items
                            </Typography>
                            <Grid container spacing={2}>
                              {orderItems
                                .filter(
                                  (item) =>
                                    item.type === "product" && item.forSalonUse,
                                )
                                .map((item) => (
                                  <Grid
                                    item
                                    xs={12}
                                    key={`purpose-${item.service.id}`}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ minWidth: 120 }}
                                      >
                                        {item.service.name}:
                                      </Typography>
                                      <FormControl size="small" fullWidth>
                                        <InputLabel>Purpose</InputLabel>
                                        <Select
                                          value={item.consumptionPurpose || ""}
                                          onChange={(e) =>
                                            handleConsumptionPurposeChange(
                                              item.service.id,
                                              e.target.value,
                                            )
                                          }
                                          label="Purpose"
                                          required
                                        >
                                          <MenuItem value="">
                                            Select Purpose
                                          </MenuItem>
                                          <MenuItem value="Service Use">
                                            Service Use
                                          </MenuItem>
                                          <MenuItem value="Staff Training">
                                            Staff Training
                                          </MenuItem>
                                          <MenuItem value="Damage/Loss">
                                            Damage/Loss
                                          </MenuItem>
                                          <MenuItem value="Samples">
                                            Samples
                                          </MenuItem>
                                          <MenuItem value="Other">
                                            Other
                                          </MenuItem>
                                        </Select>
                                      </FormControl>
                                    </Box>
                                  </Grid>
                                ))}
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: 1,
                  mb: 3,
                }}
              >
                <InfoIcon color="disabled" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  No items added yet. Select services or products below.
                </Typography>
              </Box>
            )}

            <Typography
              variant="h6"
              gutterBottom
              sx={{ mt: 4, display: "flex", alignItems: "center" }}
            >
              <ContentCutIcon sx={{ mr: 1 }} />
              Add Services to Order
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="service-collection-label">
                      Service Collection
                    </InputLabel>
                    <Select
                      labelId="service-collection-label"
                      value={selectedServiceCollection}
                      onChange={(e) =>
                        setSelectedServiceCollection(e.target.value)
                      }
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

            {/* Services Grid with loading state */}
            <Grid container spacing={2}>
              {isLoadingServices ? (
                <Grid item xs={12} sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress size={30} />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    Loading services...
                  </Typography>
                </Grid>
              ) : servicesForCollection.length > 0 ? (
                servicesForCollection.map((service) => (
                  <Grid item xs={12} sm={6} md={4} key={service.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => handleAddService(service, "service")}
                    >
                      <CardContent>
                        <Typography variant="h6">{service.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {service.description}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 1,
                          }}
                        >
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
                            handleAddService(service, "service");
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
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: "center",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    <Typography color="textSecondary">
                      {serviceSearchQuery
                        ? "No services match your search criteria"
                        : selectedServiceCollection
                          ? "No services found in this collection"
                          : "No services available"}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Add an effect to refresh products when category changes
  useEffect(() => {
    if (activeStep === 1) {
      // We're on the services step, trigger a refresh of the filtered products
      console.log(
        `[POS Debug] Category selection changed to: ${selectedProductCategory}`,
      );
      const filteredProducts = getFilteredProducts();
      console.log(
        `[POS Debug] Filtered products after category changed: Found ${filteredProducts.length} products`,
      );
    }
  }, [selectedProductCategory, activeStep]);

  // Add useEffect to auto-fix products on component mount
  useEffect(() => {
    // Wait for collections to be loaded
    if (collections && collections.length > 0) {
      // Only run this once
      console.log("[POS Debug] Auto-fixing products on component mount");
      forceRefreshProducts();
    }
  }, [collections]);

  // Update forceRefreshProducts to preserve original prices
  const forceRefreshProducts = () => {
    try {
      // Find the Hair Care collection
      const hairCareCollection = collections?.find(
        (c) => c.name === "Hair Care",
      );
      if (!hairCareCollection) {
        console.warn("[POS Debug] Hair Care collection not found");
        return;
      }

      // Get existing products
      let products = [];
      try {
        const productsStr = localStorage.getItem("products");
        if (!productsStr) {
          console.warn("[POS Debug] No products found in localStorage");
          return;
        }
        products = JSON.parse(productsStr);
      } catch (storageError) {
        console.error(
          "[POS Debug] Error accessing localStorage:",
          storageError,
        );
        return;
      }

      if (!products || !Array.isArray(products)) {
        console.warn("[POS Debug] Products is not an array:", products);
        return;
      }

      console.log("[POS Debug] Original products before fix:", products);

      // Update products in Hair Care category to make sure they're visible
      const updatedProducts = products.map((product) => {
        if (!product) return product;

        try {
          // Check if product is in Hair Care category or has related name
          if (
            product.category === "Hair Care" ||
            product.collection_name === "Hair Care" ||
            (product.name && product.name.toLowerCase().includes("shampoo")) ||
            (product.name && product.name.toLowerCase().includes("conditioner"))
          ) {
            // Debug the original product
            console.log(
              "[POS Debug] Fixing product category:",
              product.name,
              "Price remains:",
              product.price,
            );

            // Fix the product - just ensure it's visible and has correct category
            return {
              ...product,
              status: "active",
              stock: product.stock || 1000,
              collection_id: hairCareCollection.id,
              category: "Hair Care",
              collection_name: "Hair Care",
            };
          }
          return product;
        } catch (productError) {
          console.error(
            "[POS Debug] Error updating product:",
            product,
            productError,
          );
          return product;
        }
      });

      // Save back to localStorage
      try {
        localStorage.setItem("products", JSON.stringify(updatedProducts));
        console.log(
          "[POS Debug] Products refreshed for display with corrected prices",
        );
      } catch (storageError) {
        console.error(
          "[POS Debug] Error saving to localStorage:",
          storageError,
        );
        return;
      }

      // Force UI update
      setProductSearchQuery(""); // Reset search
      setTimeout(() => {
        if (selectedProductCategory !== "Hair Care") {
          setSelectedProductCategory("Hair Care");
        } else {
          // Toggle to force refresh
          setSelectedProductCategory("");
          setTimeout(() => setSelectedProductCategory("Hair Care"), 50);
        }
      }, 50);
    } catch (error) {
      console.error("[POS Debug] Error in force refresh:", error);
    }
  };

  // Update the renderProductsSelectionSection function
  const renderProductsSelectionSection = () => {
    const filteredProducts = getFilteredProducts();
    const isLoadingProducts = loadingCollections; // Assuming loadingCollections also affects products

    // Debug log how many products are filtered
    console.log(
      `[POS Debug] Rendering Products Section with ${filteredProducts.length} products`,
    );

    return (
      <Box sx={{ p: 2, mt: 2, borderTop: "1px dashed rgba(0, 0, 0, 0.12)" }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mt: 1, display: "flex", alignItems: "center", mb: 0 }}
              >
                <ShoppingBasketIcon sx={{ mr: 1 }} />
                Add Products to Order
              </Typography>

              {/* Add a Fix Button to resolve the issue */}
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={forceRefreshProducts}
                startIcon={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                    }}
                  >
                    🔄
                  </Box>
                }
              >
                Refresh Products
              </Button>
            </Box>

            {/* Search and filter UI */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="product-category-label">
                      Product Category
                    </InputLabel>
                    <Select
                      labelId="product-category-label"
                      fullWidth
                      variant="outlined"
                      value={selectedProductCategory}
                      onChange={(e) =>
                        setSelectedProductCategory(e.target.value)
                      }
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

            {/* Product Grid View with loading state */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {isLoadingProducts ? (
                <Grid item xs={12} sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress size={30} />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    Loading products...
                  </Typography>
                </Grid>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product: any) => {
                  // Log the product price for debugging
                  console.log(
                    `[POS Debug] Displaying product: ${product.name}, using exact price: ${product.price}`,
                  );

                  return (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 2,
                          },
                        }}
                        onClick={() =>
                          handleAddService(
                            {
                              id: product.id,
                              name: product.name,
                              price: normalizeProductPrice(product.price), // Use normalized price
                              type: "product"
                            },
                            "product"
                          )
                        }
                      >
                        <CardContent>
                          <Typography variant="h6" component="div" noWrap>
                            {product.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {product.description}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(normalizeProductPrice(product.price))}
                            </Typography>
                            <Chip
                              size="small"
                              label={`Stock: ${product.stock || "Available"}`}
                              color={
                                product.stock > 5
                                  ? "success"
                                  : product.stock > 0
                                    ? "warning"
                                    : "error"
                              }
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
                              handleAddService(
                                {
                                  id: product.id,
                                  name: product.name,
                                  price: normalizeProductPrice(product.price), // Use normalized price
                                  type: "product"
                                },
                                "product"
                              );
                            }}
                          >
                            Add to Order
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: "center",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    <Typography color="textSecondary">
                      {productSearchQuery ? (
                        "No products match your search criteria"
                      ) : selectedProductCategory ? (
                        <>
                          No products found in this category.
                          <Button
                            size="small"
                            color="primary"
                            onClick={forceRefreshProducts}
                            sx={{ ml: 1 }}
                          >
                            Refresh Products
                          </Button>
                        </>
                      ) : (
                        "No products available"
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Add functions for handling salon consumption features
  const handleToggleSalonUse = (serviceId: string, isForSalonUse: boolean) => {
    setOrderItems(
      orderItems.map((item) =>
        item.service.id === serviceId
          ? {
              ...item,
              forSalonUse: isForSalonUse,
              consumptionPurpose: isForSalonUse ? item.consumptionPurpose : "",
            }
          : item,
      ),
    );
  };

  const handleConsumptionPurposeChange = (
    serviceId: string,
    purpose: string,
  ) => {
    setOrderItems(
      orderItems.map((item) =>
        item.service.id === serviceId
          ? { ...item, consumptionPurpose: purpose }
          : item,
      ),
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tabs for switching between appointment payments and walk-in sales */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
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
        <Paper sx={{ p: 0, height: "100%" }}>
          {/* Stepper for walkthrough */}
          <Stepper
            activeStep={activeStep}
            sx={{ p: 3, borderBottom: "1px solid rgba(0, 0, 0, 0.12)" }}
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
            }}
          >
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              {/* Left side - Form based on current step */}
              <Grid
                item
                xs={12}
                md={8}
                sx={{ height: "100%", overflowY: "auto" }}
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
                          required
                          error={activeStep === 0 && customerName.trim() === ""}
                          helperText={
                            activeStep === 0 && customerName.trim() === ""
                              ? "Customer name is required"
                              : ""
                          }
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
                    {renderServiceSelectionSection()}
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
                                    {PaymentIcons[method]}
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
                          <Paper variant="outlined" sx={{ p: 2 }}>
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
                                            {PaymentIcons[method]}
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
                                                {
                                                  PaymentIcons[
                                                    payment.payment_method
                                                  ]
                                                }
                                              </Box>
                                              {
                                                PAYMENT_METHOD_LABELS[
                                                  payment.payment_method
                                                ]
                                              }
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
                      color="primary"
                      onClick={handleNext}
                      disabled={!isStepValid()}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Right side - Order Summary */}
              <Grid item xs={12} md={4} sx={{ height: "100%" }}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
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
