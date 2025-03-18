import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemSecondaryAction, Button, TextField, CircularProgress, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, IconButton, Autocomplete, InputAdornment, Stepper, Step, StepLabel, Snackbar, Switch, FormControlLabel, FormHelperText, } from '@mui/material';
import { Person as PersonIcon, Check as CheckIcon, DeleteOutline as DeleteOutlineIcon, CreditCard as CreditCardIcon, LocalAtm as LocalAtmIcon, QrCode as QrCodeIcon, CalendarToday as CalendarTodayIcon, Search as SearchIcon, } from '@mui/icons-material';
import { usePOS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../hooks/usePOS';
import { useStylists } from '../hooks/useStylists';
import { useServices } from '../hooks/useServices';
import { useClients } from '../hooks/useClients';
import { useServiceCollections } from '../hooks/useServiceCollections';
import { useCollectionServices } from '../hooks/useCollectionServices';
import { useCollections } from '../hooks/useCollections';
const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (_jsx("div", { role: "tabpanel", hidden: value !== index, id: `pos-tabpanel-${index}`, "aria-labelledby": `pos-tab-${index}`, ...other, style: { height: '100%' }, children: value === index && (_jsx(Box, { sx: { height: '100%', pt: 2 }, children: children })) }));
};
// Payment icon mapping
const PaymentIcons = {
    cash: _jsx(LocalAtmIcon, {}),
    credit_card: _jsx(CreditCardIcon, {}),
    debit_card: _jsx(CreditCardIcon, {}),
    upi: _jsx(QrCodeIcon, {}),
    bnpl: _jsx(CalendarTodayIcon, {}),
};
// Optimize the payment reducer to prevent unnecessary updates
const paymentReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SPLIT_PAYMENT':
            return state.isSplitPayment === action.value ? state : {
                ...state,
                isSplitPayment: action.value,
                lastUpdated: 'splitPayment'
            };
        case 'SET_SPLIT_PAYMENTS':
            return JSON.stringify(state.splitPayments) === JSON.stringify(action.payments) ? state : {
                ...state,
                splitPayments: action.payments,
                lastUpdated: 'splitPayments'
            };
        case 'SET_PENDING_AMOUNT':
            return isApproximatelyEqual(state.pendingAmount, action.amount) ? state : {
                ...state,
                pendingAmount: action.amount,
                lastUpdated: 'pendingAmount'
            };
        case 'SET_NEW_PAYMENT_AMOUNT':
            return isApproximatelyEqual(state.newPaymentAmount, action.amount) ? state : {
                ...state,
                newPaymentAmount: action.amount,
                lastUpdated: 'newPaymentAmount'
            };
        case 'SET_NEW_PAYMENT_METHOD':
            return state.newPaymentMethod === action.method ? state : {
                ...state,
                newPaymentMethod: action.method,
                lastUpdated: 'newPaymentMethod'
            };
        case 'RESET_PAYMENT_STATE':
            return {
                ...initialPaymentState,
                lastUpdated: 'reset'
            };
        case 'ENTER_PAYMENT_STEP':
            return isApproximatelyEqual(state.pendingAmount, action.total) ? state : {
                ...state,
                pendingAmount: action.total,
                lastUpdated: 'enterPayment'
            };
        default:
            return state;
    }
};
// Add a utility function for safer floating point comparison
const isApproximatelyEqual = (a, b, epsilon = 0.01) => {
    return Math.abs(a - b) < epsilon;
};
// Define initial payment state
const initialPaymentState = {
    isSplitPayment: false,
    splitPayments: [],
    pendingAmount: 0,
    newPaymentAmount: 0,
    newPaymentMethod: 'cash',
    lastUpdated: 'init'
};
// Function to check if the current step is valid
const isStepValid = (activeStep, selectedStylist, selectedClient, customerName, orderItems, isSplitPayment, splitPayments, total, setSnackbarMessage, setSnackbarOpen, setStylistError, setClientError) => {
    switch (activeStep) {
        case 0: // Customer & Stylist
            if (!selectedStylist) {
                setStylistError('Please select a stylist');
                return false;
            }
            if (!selectedClient && !customerName) {
                setClientError('Please select a client or enter customer name');
                return false;
            }
            setStylistError(null);
            setClientError(null);
            return true;
        case 1: // Services
            if (orderItems.length === 0) {
                setSnackbarMessage('Please add at least one service or product to proceed');
                setSnackbarOpen(true);
                return false;
            }
            return true;
        case 2: // Payment
            if (isSplitPayment && splitPayments.length === 0) {
                setSnackbarMessage('Please add at least one payment method for split payment');
                setSnackbarOpen(true);
                return false;
            }
            // Check if total payments match the order total for split payments
            if (isSplitPayment) {
                const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
                if (!isApproximatelyEqual(totalPaid, total)) {
                    setSnackbarMessage(`Payment amount (₹${totalPaid.toFixed(2)}) does not match the order total (₹${total.toFixed(2)})`);
                    setSnackbarOpen(true);
                    return false;
                }
            }
            return true;
        default:
            return true;
    }
};
const POS = () => {
    // State for active tab (appointments vs walk-in)
    const [tabValue, setTabValue] = useState(0);
    // POS query hooks
    const { isLoading, orders, unpaidAppointments, inventoryProducts } = usePOS();
    const { stylists, isLoading: loadingStylists } = useStylists();
    const { services, isLoading: loadingServices } = useServices();
    const { clients, isLoading: loadingClients } = useClients();
    const { serviceCollections, isLoading: loadingServiceCollections } = useServiceCollections();
    const { isLoading: loadingCollectionServices } = useCollectionServices();
    const { collections, isLoading: loadingCollections } = useCollections();
    // State for stepper
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Customer & Stylist', 'Services', 'Payment', 'Confirmation'];
    // Customer and stylist selection state
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedStylist, setSelectedStylist] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [stylistError, setStylistError] = useState(null);
    const [clientError, setClientError] = useState(null);
    // Cart state
    const [orderItems, setOrderItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    // Split Payment state management
    const [splitPayments, setSplitPayments] = useState([]);
    const [paymentState, dispatch] = useReducer(paymentReducer, initialPaymentState);
    const { isSplitPayment, pendingAmount, newPaymentAmount, newPaymentMethod } = paymentState;
    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    // Service search state
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [selectedServiceType, setSelectedServiceType] = useState('all');
    // Selected appointment for payment
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    // Calculate order totals
    const subtotal = useMemo(() => {
        return orderItems.reduce((sum, item) => {
            const price = item.customPrice !== undefined ? item.customPrice : item.service.price;
            return sum + (price * item.quantity);
        }, 0);
    }, [orderItems]);
    const taxAmount = useMemo(() => {
        // Apply 18% GST on the subtotal
        return subtotal * 0.18;
    }, [subtotal]);
    const total = useMemo(() => {
        return subtotal + taxAmount - discount;
    }, [subtotal, taxAmount, discount]);
    // Effect to track changes to active step
    useEffect(() => {
        if (activeStep === 2) { // Payment Step
            dispatch({ type: 'ENTER_PAYMENT_STEP', total });
        }
    }, [activeStep, total]);
    // Effect to track changes in split payments
    useEffect(() => {
        const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const newPendingAmount = Math.max(0, total - totalPaid);
        // Only update pending amount if it's different
        if (!isApproximatelyEqual(pendingAmount, newPendingAmount)) {
            dispatch({ type: 'SET_PENDING_AMOUNT', amount: newPendingAmount });
        }
        // Update split payments in reducer
        if (paymentState.lastUpdated !== 'splitPayments') {
            dispatch({ type: 'SET_SPLIT_PAYMENTS', payments: splitPayments });
        }
    }, [splitPayments, total, pendingAmount, paymentState.lastUpdated]);
    // Handle removing a split payment
    const handleRemoveSplitPayment = useCallback((paymentId) => {
        setSplitPayments(currentPayments => {
            const newPayments = currentPayments.filter(payment => payment.id !== paymentId);
            const totalPaid = newPayments.reduce((sum, payment) => sum + payment.amount, 0);
            const newPendingAmount = Math.max(0, total - totalPaid);
            dispatch({ type: 'SET_PENDING_AMOUNT', amount: newPendingAmount });
            return newPayments;
        });
    }, [total]);
    // Handle next button click in stepper
    const handleNext = () => {
        if (isStepValid(activeStep, selectedStylist, selectedClient, customerName, orderItems, isSplitPayment, splitPayments, total, setSnackbarMessage, setSnackbarOpen, setStylistError, setClientError)) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };
    // Handle back button click in stepper
    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
    const handleAddSplitPayment = () => {
        if (paymentState.newPaymentAmount <= 0) {
            setSnackbarMessage('Please enter a valid amount');
            setSnackbarOpen(true);
            return;
        }
        const newPayment = {
            id: Date.now().toString(),
            payment_method: paymentState.newPaymentMethod,
            amount: paymentState.newPaymentAmount,
            payment_date: new Date().toISOString(),
        };
        setSplitPayments([...splitPayments, newPayment]);
        dispatch({ type: 'SET_NEW_PAYMENT_AMOUNT', amount: 0 });
    };
    const renderClientSelector = () => (_jsx(Autocomplete, { id: "client-selector", options: [], getOptionLabel: (option) => option?.full_name || '', value: selectedClient, onChange: (event, newValue) => {
            setSelectedClient(newValue);
            if (newValue) {
                setCustomerName(newValue.full_name || '');
            }
        }, renderInput: (params) => (_jsx(TextField, { ...params, label: "Select Client *", variant: "outlined", error: !!clientError, helperText: clientError })) }));
    const renderStylistSelector = () => (_jsxs(FormControl, { fullWidth: true, error: !!stylistError, children: [_jsx(InputLabel, { id: "stylist-select-label", children: "Select Stylist *" }), _jsxs(Select, { labelId: "stylist-select-label", value: selectedStylist, label: "Select Stylist *", onChange: (e) => setSelectedStylist(e.target.value), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "None" }) }), stylists?.map((stylist) => (_jsx(MenuItem, { value: stylist.id, children: stylist.name }, stylist.id)))] }), stylistError && _jsx(FormHelperText, { children: stylistError })] }));
    const renderServiceSelectionSection = () => (_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Select Services" }), _jsx(Grid, { container: true, spacing: 2, children: _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Search Services", variant: "outlined", value: serviceSearchQuery, onChange: (e) => setServiceSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                        } }) }) })] }));
    const renderPaymentMethodSection = () => (_jsxs(Box, { children: [_jsxs(FormControl, { fullWidth: true, sx: { mb: 2 }, children: [_jsx(InputLabel, { children: "Payment Method" }), _jsx(Select, { value: paymentState.newPaymentMethod, onChange: (e) => dispatch({ type: 'SET_NEW_PAYMENT_METHOD', method: e.target.value }), children: PAYMENT_METHODS.map((method) => (_jsx(MenuItem, { value: method, children: PAYMENT_METHOD_LABELS[method] }, method))) })] }), _jsx(TextField, { fullWidth: true, label: "Amount", type: "number", value: paymentState.newPaymentAmount, onChange: (e) => dispatch({ type: 'SET_NEW_PAYMENT_AMOUNT', amount: parseFloat(e.target.value) }), sx: { mb: 2 } }), _jsx(Button, { variant: "contained", color: "primary", fullWidth: true, onClick: handleAddSplitPayment, disabled: !paymentState.newPaymentAmount || paymentState.newPaymentAmount <= 0, children: "Add Payment" })] }));
    const SplitPaymentsList = () => (_jsx(List, { children: splitPayments.map((payment) => (_jsxs(ListItem, { children: [_jsx(ListItemText, { primary: `${payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}`, secondary: `₹${payment.amount.toFixed(2)}` }), _jsx(ListItemSecondaryAction, { children: _jsx(IconButton, { edge: "end", onClick: () => handleRemoveSplitPayment(payment.id), children: _jsx(DeleteOutlineIcon, {}) }) })] }, payment.id))) }));
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (_jsxs(Box, { children: [renderClientSelector(), _jsx(Box, { sx: { mt: 2 }, children: renderStylistSelector() })] }));
            case 1:
                return renderServiceSelectionSection();
            case 2:
                return (_jsxs(Box, { children: [_jsx(FormControlLabel, { control: _jsx(Switch, { checked: isSplitPayment, onChange: (e) => dispatch({ type: 'SET_SPLIT_PAYMENT', value: e.target.checked }) }), label: "Split Payment" }), isSplitPayment ? (_jsxs(Box, { children: [renderPaymentMethodSection(), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Payment Methods" }), _jsx(SplitPaymentsList, {}), _jsxs(Typography, { variant: "h6", align: "right", sx: { mt: 2 }, children: ["Remaining: \u20B9", pendingAmount.toFixed(2)] })] })] })) : (_jsxs(FormControl, { fullWidth: true, sx: { mt: 2 }, children: [_jsx(InputLabel, { children: "Payment Method" }), _jsx(Select, { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), children: PAYMENT_METHODS.map((method) => (_jsx(MenuItem, { value: method, children: PAYMENT_METHOD_LABELS[method] }, method))) })] }))] }));
            case 3:
                return (_jsxs(Box, { sx: { textAlign: 'center' }, children: [_jsx(CheckIcon, { sx: { fontSize: 60, color: 'success.main', mb: 2 } }), _jsx(Typography, { variant: "h5", gutterBottom: true, children: "Payment Successful" }), _jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: "The order has been successfully processed." })] }));
            default:
                return null;
        }
    };
    if (isLoading || loadingStylists || loadingServices || loadingClients || loadingServiceCollections || loadingCollectionServices || loadingCollections) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsx(Paper, { sx: { mb: 2, p: 2 }, children: _jsxs(Tabs, { value: tabValue, onChange: (e, newValue) => setTabValue(newValue), "aria-label": "POS tabs", children: [_jsx(Tab, { label: "Walk-In", icon: _jsx(PersonIcon, {}) }), _jsx(Tab, { label: "Appointments", icon: _jsx(CalendarTodayIcon, {}) })] }) }), _jsx(TabPanel, { value: tabValue, index: 0, children: _jsxs(Box, { sx: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsx(Stepper, { activeStep: activeStep, sx: { py: 3 }, children: steps.map((label) => (_jsx(Step, { children: _jsx(StepLabel, { children: label }) }, label))) }), _jsx(Paper, { sx: { p: 3, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }, children: renderStepContent() }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 2 }, children: [_jsx(Button, { disabled: activeStep === 0, onClick: handleBack, variant: "outlined", children: "Back" }), activeStep === steps.length - 1 ? (_jsx(Button, { variant: "contained", color: "primary", onClick: () => {
                                        // Reset form
                                        setActiveStep(0);
                                        setOrderItems([]);
                                        setSelectedClient(null);
                                        setSelectedStylist('');
                                        setCustomerName('');
                                        setSplitPayments([]);
                                        dispatch({ type: 'RESET_PAYMENT_STATE', activeStep: 0 });
                                    }, children: "New Order" })) : (_jsx(Button, { variant: "contained", color: "primary", onClick: handleNext, children: activeStep === steps.length - 2 ? 'Complete Payment' : 'Next' }))] })] }) }), _jsx(TabPanel, { value: tabValue, index: 1, children: _jsx(Typography, { variant: "h6", children: "Unpaid Appointments" }) }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 6000, onClose: () => setSnackbarOpen(false), message: snackbarMessage })] }));
};
export default POS;
