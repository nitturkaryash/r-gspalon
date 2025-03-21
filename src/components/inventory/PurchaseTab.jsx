import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, TablePagination, Autocomplete, InputAdornment, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useInventory } from '../../hooks/useInventory';

// Function to get all products from localStorage
const getAllProducts = () => {
    try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }
        return [];
    } catch (error) {
        console.error('Error loading products from localStorage:', error);
        return [];
    }
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
}));

// Update the form layout for better spacing
function PurchaseForm({ onSubmit, isSubmitting }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        product_name: '',
        hsn_code: '',
        units: '',
        purchase_invoice_number: '',
        purchase_qty: 0,
        mrp_incl_gst: 0,
        mrp_excl_gst: 0,
        discount_on_purchase_percentage: 0,
        purchase_cost_per_unit_ex_gst: 0,
        gst_percentage: 18,
        purchase_taxable_value: 0,
        purchase_igst: 0,
        purchase_cgst: 0,
        purchase_sgst: 0,
        purchase_invoice_value_rs: 0,
    });
    const [formErrors, setFormErrors] = useState({});
    const [productOptions, setProductOptions] = useState([]);

    // Load products from localStorage
    useEffect(() => {
        try {
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                const products = JSON.parse(savedProducts);
                setProductOptions(products.map(p => ({ 
                    label: p.product_name, 
                    value: p.product_name,
                    product: p 
                })));
            }
        } catch (error) {
            console.error('Error loading products from localStorage:', error);
        }
    }, []);

    const handleProductSelect = (value, option) => {
        if (!option?.product) return;
        
        const product = option.product;
        
        // Update form with product data
        const updatedFormData = {
            ...formData,
            product_name: product.product_name,
            hsn_code: product.hsn_code,
            units: product.unit_type,
            mrp_incl_gst: product.mrp_incl_gst,
            gst_percentage: product.gst_percentage,
            discount_on_purchase_percentage: product.discount_on_purchase_percentage
        };
        
        // Recalculate derived values
        handleCalculatedValues(updatedFormData);
    };

    const handleCalculatedValues = (updatedData) => {
        // Calculate MRP excluding GST
        const gstPercentage = updatedData.gst_percentage;
        const mrpInclGst = updatedData.mrp_incl_gst;
        
        // Calculate MRP excluding GST = MRP including GST / (1 + GST%)
        updatedData.mrp_excl_gst = gstPercentage > 0 
            ? parseFloat((mrpInclGst / (1 + (gstPercentage / 100))).toFixed(2))
            : mrpInclGst;
        
        // Calculate purchase cost per unit after discount
        const discountPercentage = updatedData.discount_on_purchase_percentage;
        updatedData.purchase_cost_per_unit_ex_gst = parseFloat((updatedData.mrp_excl_gst * (1 - (discountPercentage / 100))).toFixed(2));
        
        // Calculate taxable value = purchase cost per unit * quantity
        updatedData.purchase_taxable_value = parseFloat((updatedData.purchase_cost_per_unit_ex_gst * updatedData.purchase_qty).toFixed(2));
        
        // Calculate GST components
        const gstAmount = parseFloat((updatedData.purchase_taxable_value * (gstPercentage / 100)).toFixed(2));
        
        // Split between CGST and SGST
        updatedData.purchase_igst = 0;
        updatedData.purchase_cgst = parseFloat((gstAmount / 2).toFixed(2));
        updatedData.purchase_sgst = parseFloat((gstAmount / 2).toFixed(2));
        
        // Calculate invoice value
        updatedData.purchase_invoice_value_rs = parseFloat((updatedData.purchase_taxable_value + 
            updatedData.purchase_igst + updatedData.purchase_cgst + updatedData.purchase_sgst).toFixed(2));
        
        setFormData(updatedData);
    };

    const handleInputChange = (name, value) => {
        const newValue = typeof value === 'string' ? value : parseFloat(value) || 0;
        
        // Create updated form data with the new field value
        const updatedFormData = {
            ...formData,
            [name]: newValue
        };
        
        // Default GST percentage to 18% if it's empty
        if (name === 'gst_percentage' && newValue === 0) {
            updatedFormData.gst_percentage = 18;
        }
        
        // Initialize GST to 18% by default if it hasn't been set
        if (updatedFormData.gst_percentage === 0) {
            updatedFormData.gst_percentage = 18;
        }
        
        // Perform calculations when relevant fields change
        if (['mrp_incl_gst', 'gst_percentage', 'purchase_qty', 'discount_on_purchase_percentage'].includes(name)) {
            handleCalculatedValues(updatedFormData);
        } else {
            setFormData(updatedFormData);
        }
        
        // Clear error when field is updated
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        onSubmit(formData);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.product_name)
            errors.product_name = 'Product name is required';
        if (!formData.hsn_code)
            errors.hsn_code = 'HSN code is required';
        if (!formData.units)
            errors.units = 'Units is required';
        if (!formData.purchase_invoice_number)
            errors.purchase_invoice_number = 'Invoice number is required';
        if (!formData.purchase_qty || formData.purchase_qty <= 0)
            errors.purchase_qty = 'Quantity must be greater than 0';
        if (!formData.mrp_incl_gst || formData.mrp_incl_gst <= 0)
            errors.mrp_incl_gst = 'MRP must be greater than 0';
        if (formData.gst_percentage < 0)
            errors.gst_percentage = 'GST percentage cannot be negative';
        if (formData.discount_on_purchase_percentage < 0 || formData.discount_on_purchase_percentage > 100) {
            errors.discount_on_purchase_percentage = 'Discount must be between 0 and 100%';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.default'
        }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Add New Purchase
            </Typography>
            
            <Grid container spacing={2} sx={{ width: '100%' }}>
                {/* Row 1 */}
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                        sx={{ '& .MuiInputBase-input': { textAlign: 'left' } }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <Autocomplete
                        options={productOptions}
                        getOptionLabel={(option) => option.label || ''}
                        onChange={(e, option) => handleProductSelect(option?.value, option)}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Product Name" 
                                value={formData.product_name}
                                onChange={(e) => handleInputChange('product_name', e.target.value)}
                                fullWidth 
                                required 
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="HSN Code"
                        value={formData.hsn_code}
                        onChange={(e) => handleInputChange('hsn_code', e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Units"
                        value={formData.units}
                        onChange={(e) => handleInputChange('units', e.target.value)}
                        fullWidth
                        placeholder="e.g., pcs, boxes"
                    />
                </Grid>
                
                {/* Row 2 */}
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase Invoice Number"
                        value={formData.purchase_invoice_number}
                        onChange={(e) => handleInputChange('purchase_invoice_number', e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase Quantity"
                        type="number"
                        value={formData.purchase_qty}
                        onChange={(e) => handleInputChange('purchase_qty', e.target.value)}
                        fullWidth
                        required
                        InputProps={{ inputProps: { min: 0 } }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="MRP (Incl. GST)"
                        type="number"
                        value={formData.mrp_incl_gst}
                        onChange={(e) => handleInputChange('mrp_incl_gst', e.target.value)}
                        fullWidth
                        required
                        InputProps={{ 
                            inputProps: { min: 0, step: 0.01 },
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="MRP (Excl. GST)"
                        type="number"
                        value={formData.mrp_excl_gst}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                
                {/* Row 3 */}
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Discount on Purchase (%)"
                        type="number"
                        value={formData.discount_on_purchase_percentage}
                        onChange={(e) => handleInputChange('discount_on_purchase_percentage', e.target.value)}
                        fullWidth
                        InputProps={{ 
                            inputProps: { min: 0, max: 100, step: 0.01 },
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase Cost per Unit (Ex.GST)"
                        type="number"
                        value={formData.purchase_cost_per_unit_ex_gst}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="GST Percentage"
                        type="number"
                        value={formData.gst_percentage}
                        onChange={(e) => handleInputChange('gst_percentage', e.target.value)}
                        fullWidth
                        required
                        InputProps={{ 
                            inputProps: { min: 0, max: 100, step: 0.01 },
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Taxable Value (Rs.)"
                        type="number"
                        value={formData.purchase_taxable_value}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                
                {/* Added GST breakdown fields */}
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase IGST (Rs.)"
                        type="number"
                        value={formData.purchase_igst}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase CGST (Rs.)"
                        type="number"
                        value={formData.purchase_cgst}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase SGST (Rs.)"
                        type="number"
                        value={formData.purchase_sgst}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
                
                {/* Added Purchase Invoice Value field */}
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <TextField
                        label="Purchase Invoice Value (Rs.)"
                        type="number"
                        value={formData.purchase_invoice_value_rs}
                        fullWidth
                        disabled
                        InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Grid>
            </Grid>
            
            {/* Button Row */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, mb: 2 }}>
                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    disabled={isSubmitting}
                    sx={{ px: 3 }}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Add Purchase'}
                </Button>
            </Box>
        </Box>
    );
}

const PurchaseTab = ({ purchases, isLoading, error, purchasesQuery }) => {
    const { createPurchase, isCreatingPurchase, fetchInventoryData } = useInventory();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [products, setProducts] = useState([]);
    const [newPurchaseId, setNewPurchaseId] = useState(null);
    const [localPurchases, setLocalPurchases] = useState([]);
    const [showRefreshAlert, setShowRefreshAlert] = useState(false);
    const [formState, setFormState] = useState({
        date: new Date().toISOString().split('T')[0],
        product_name: '',
        hsn_code: '',
        units: '',
        purchase_invoice_number: '',
        purchase_qty: 0,
        mrp_incl_gst: 0,
        mrp_excl_gst: 0,
        discount_on_purchase_percentage: 0,
        purchase_cost_per_unit_ex_gst: 0,
        gst_percentage: 18,
        purchase_taxable_value: 0,
        purchase_igst: 0,
        purchase_cgst: 0,
        purchase_sgst: 0,
        purchase_invoice_value_rs: 0,
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const loadedProducts = getAllProducts();
        setProducts(loadedProducts);
        console.log('PurchaseTab received purchases:', purchases);
    }, [purchases]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleInputChange = (name, value) => {
        const newValue = typeof value === 'string' ? value : parseFloat(value) || 0;
        
        // Create updated form state with the new field value
        const updatedFormState = {
            ...formState,
            [name]: newValue
        };
        
        // Default GST percentage to 18% if it's empty
        if (name === 'gst_percentage' && newValue === 0) {
            updatedFormState.gst_percentage = 18;
        }
        
        // Initialize GST to 18% by default if it hasn't been set
        if (updatedFormState.gst_percentage === 0) {
            updatedFormState.gst_percentage = 18;
        }
        
        // Perform calculations when relevant fields change
        if (['mrp_incl_gst', 'gst_percentage', 'purchase_qty', 'discount_on_purchase_percentage'].includes(name)) {
            // Calculate MRP excluding GST
            const gstPercentage = updatedFormState.gst_percentage;
            const mrpInclGst = updatedFormState.mrp_incl_gst;
            
            // Calculate MRP excluding GST = MRP including GST / (1 + GST%)
            updatedFormState.mrp_excl_gst = gstPercentage > 0 
                ? parseFloat((mrpInclGst / (1 + (gstPercentage / 100))).toFixed(2))
                : mrpInclGst;
            
            // Calculate purchase cost per unit after discount
            const discountPercentage = updatedFormState.discount_on_purchase_percentage;
            updatedFormState.purchase_cost_per_unit_ex_gst = parseFloat((updatedFormState.mrp_excl_gst * (1 - (discountPercentage / 100))).toFixed(2));
            
            // Calculate taxable value = purchase cost per unit * quantity
            updatedFormState.purchase_taxable_value = parseFloat((updatedFormState.purchase_cost_per_unit_ex_gst * updatedFormState.purchase_qty).toFixed(2));
            
            // Calculate GST components
            const gstAmount = parseFloat((updatedFormState.purchase_taxable_value * (gstPercentage / 100)).toFixed(2));
            
            // For simplicity, split between CGST and SGST evenly if not IGST
            // In a real application, this logic would depend on whether it's inter-state (IGST) or intra-state (CGST+SGST)
            updatedFormState.purchase_igst = 0; // Default to 0, would be set based on state-to-state transaction
            updatedFormState.purchase_cgst = parseFloat((gstAmount / 2).toFixed(2));
            updatedFormState.purchase_sgst = parseFloat((gstAmount / 2).toFixed(2));
            
            // Calculate invoice value = taxable value + IGST + CGST + SGST
            updatedFormState.purchase_invoice_value_rs = parseFloat((updatedFormState.purchase_taxable_value + 
                updatedFormState.purchase_igst + updatedFormState.purchase_cgst + updatedFormState.purchase_sgst).toFixed(2));
        }
        
        setFormState(updatedFormState);
        
        // Clear error when field is updated
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    // Handle input change specifically for the Product Name autocomplete when typing
    const handleProductInputChange = (event, newInputValue) => {
        setFormState(prevState => ({
            ...prevState,
            product_name: newInputValue
        }));
        
        // Clear error when field is updated
        if (formErrors.product_name) {
            setFormErrors(prev => ({
                ...prev,
                product_name: undefined
            }));
        }
    };

    // Handle autocomplete product selection
    const handleProductSelect = (event, newValue) => {
        if (newValue) {
            const updatedFormState = {
                ...formState,
                product_name: newValue.name,
                // Also update HSN code and units if available
                ...(newValue.hsn_code && { hsn_code: newValue.hsn_code }),
                ...(newValue.units && { units: newValue.units }),
                // Set MRP from product price if available
                ...(newValue.price && { 
                    mrp_incl_gst: newValue.price,
                    // Recalculate MRP excluding GST based on current GST percentage
                    mrp_excl_gst: parseFloat((newValue.price / (1 + (formState.gst_percentage / 100))).toFixed(2))
                })
            };

            // Ensure GST percentage is set to 18% by default if not already set
            if (updatedFormState.gst_percentage === 0) {
                updatedFormState.gst_percentage = 18;
            }

            // Calculate other values based on updated MRP
            if (newValue.price) {
                const gstPercentage = updatedFormState.gst_percentage;
                const discountPercentage = updatedFormState.discount_on_purchase_percentage;
                
                // Calculate purchase cost per unit after discount
                updatedFormState.purchase_cost_per_unit_ex_gst = parseFloat((updatedFormState.mrp_excl_gst * (1 - (discountPercentage / 100))).toFixed(2));
                
                // Calculate taxable value
                updatedFormState.purchase_taxable_value = parseFloat((updatedFormState.purchase_cost_per_unit_ex_gst * updatedFormState.purchase_qty).toFixed(2));
                
                // Calculate GST components
                const gstAmount = parseFloat((updatedFormState.purchase_taxable_value * (gstPercentage / 100)).toFixed(2));
                
                updatedFormState.purchase_igst = 0; // Default to 0
                updatedFormState.purchase_cgst = parseFloat((gstAmount / 2).toFixed(2));
                updatedFormState.purchase_sgst = parseFloat((gstAmount / 2).toFixed(2));
                
                // Calculate invoice value
                updatedFormState.purchase_invoice_value_rs = parseFloat((updatedFormState.purchase_taxable_value + 
                    updatedFormState.purchase_igst + updatedFormState.purchase_cgst + updatedFormState.purchase_sgst).toFixed(2));
            }
            
            setFormState(updatedFormState);
            
            // Clear errors when fields are updated
            const clearedErrors = { ...formErrors };
            if (clearedErrors.product_name) delete clearedErrors.product_name;
            if (newValue.hsn_code && clearedErrors.hsn_code) delete clearedErrors.hsn_code;
            if (newValue.units && clearedErrors.units) delete clearedErrors.units;
            setFormErrors(clearedErrors);
        }
    };

    const handleSubmit = async (e) => {
        // Check if e is an event object with preventDefault method
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        
        if (!validateForm())
            return;
        try {
            console.log('Submitting purchase form with data:', formState);
            // Create the purchase
            const newPurchase = await createPurchase(formState);
            console.log('Purchase created successfully:', newPurchase);
            
            // Store the ID of the new purchase for highlighting
            if (newPurchase && newPurchase.purchase_id) {
                setNewPurchaseId(newPurchase.purchase_id);
                
                // Clear the highlight after 5 seconds
                setTimeout(() => {
                    setNewPurchaseId(null);
                }, 5000);
            }
            
            // Show success message with alert
            alert('Purchase added successfully!');
            
            // Try multiple approaches to refresh the data
            let refreshed = false;
            
            // Approach 1: Use the query refetch if available
            if (purchasesQuery && typeof purchasesQuery.refetch === 'function') {
                console.log('Refreshing data via purchasesQuery.refetch()');
                try {
                    await purchasesQuery.refetch();
                    refreshed = true;
                } catch (err) {
                    console.error('Error refreshing via query:', err);
                }
            }
            
            // Approach 2: Use direct fetchInventoryData
            if (!refreshed && fetchInventoryData) {
                console.log('Refreshing data via fetchInventoryData()');
                try {
                    await fetchInventoryData();
                    refreshed = true;
                } catch (err) {
                    console.error('Error refreshing via fetchInventoryData:', err);
                }
            }
            
            // Approach 3: Add to local state and dispatch event
            if (newPurchase) {
                console.log('Adding purchase to local state:', newPurchase);
                // Keep a local copy of the new purchase
                setLocalPurchases(prev => [newPurchase, ...prev]);
                // Try the event-based approach as fallback
                window.dispatchEvent(new CustomEvent('refresh-inventory-data'));
                setShowRefreshAlert(true);
                setTimeout(() => setShowRefreshAlert(false), 5000);
            }
            
            // Reset to first page
            setPage(0);
            
            // Reset form on success
            setFormState({
                date: new Date().toISOString().split('T')[0],
                product_name: '',
                hsn_code: '',
                units: '',
                purchase_invoice_number: '',
                purchase_qty: 0,
                mrp_incl_gst: 0,
                mrp_excl_gst: 0,
                discount_on_purchase_percentage: 0,
                purchase_cost_per_unit_ex_gst: 0,
                gst_percentage: 18,
                purchase_taxable_value: 0,
                purchase_igst: 0,
                purchase_cgst: 0,
                purchase_sgst: 0,
                purchase_invoice_value_rs: 0,
            });
            
            // Scroll to the table to show the new entry
            const purchasesTable = document.querySelector('.purchase-records-table');
            if (purchasesTable) {
                purchasesTable.scrollIntoView({ behavior: 'smooth' });
            }
        }
        catch (error) {
            console.error('Error creating purchase:', error);
            alert(`Error creating purchase: ${error.message || 'Unknown error'}`);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formState.product_name)
            errors.product_name = 'Product name is required';
        if (!formState.hsn_code)
            errors.hsn_code = 'HSN code is required';
        if (!formState.units)
            errors.units = 'Units is required';
        if (!formState.purchase_invoice_number)
            errors.purchase_invoice_number = 'Invoice number is required';
        if (!formState.purchase_qty || formState.purchase_qty <= 0)
            errors.purchase_qty = 'Quantity must be greater than 0';
        if (!formState.mrp_incl_gst || formState.mrp_incl_gst <= 0)
            errors.mrp_incl_gst = 'MRP must be greater than 0';
        if (formState.gst_percentage < 0)
            errors.gst_percentage = 'GST percentage cannot be negative';
        if (formState.discount_on_purchase_percentage < 0 || formState.discount_on_purchase_percentage > 100) {
            errors.discount_on_purchase_percentage = 'Discount must be between 0 and 100%';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const formatDate = (dateStr) => {
        if (!dateStr)
            return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN');
        }
        catch (e) {
            return dateStr;
        }
    };

    return (
        <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 4,
            margin: '0 auto',
            maxWidth: '100%',
            overflow: 'visible'
        }}>
            <Paper sx={{ 
                p: 3, 
                width: '100%', 
                mb: 3, 
                borderRadius: '8px',
                boxSizing: 'border-box'
            }}>
                <PurchaseForm 
                    onSubmit={handleSubmit}
                    isSubmitting={isCreatingPurchase}
                />
            </Paper>

            <Box sx={{ width: '100%' }}>
                <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                    Purchase Records
                </Typography>

                {showRefreshAlert && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        New purchase added! If you don't see it in the table, try using the Force Refresh button.
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            console.log('Force refresh clicked');
                            if (purchasesQuery && typeof purchasesQuery.refetch === 'function') {
                                purchasesQuery.refetch();
                            } else if (fetchInventoryData) {
                                fetchInventoryData();
                            } else {
                                window.dispatchEvent(new CustomEvent('refresh-inventory-data'));
                            }
                        }}
                        sx={{ borderRadius: 4 }}
                    >
                        Force Refresh
                    </Button>
                </Box>

                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        width: '100%', 
                        borderRadius: '8px', 
                        overflow: 'auto', 
                        maxHeight: '500px' 
                    }}
                    className="purchase-records-table"
                >
                    <Table 
                        aria-label="purchase records table" 
                        size="small" 
                        stickyHeader 
                        sx={{ tableLayout: 'auto', minWidth: '100%' }}
                    >
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Product Name</StyledTableCell>
                                <StyledTableCell>HSN Code</StyledTableCell>
                                <StyledTableCell>Units</StyledTableCell>
                                <StyledTableCell>Invoice Number</StyledTableCell>
                                <StyledTableCell>Qty</StyledTableCell>
                                <StyledTableCell>MRP (Incl. GST)</StyledTableCell>
                                <StyledTableCell>MRP (Excl. GST)</StyledTableCell>
                                <StyledTableCell>Discount</StyledTableCell>
                                <StyledTableCell>Cost/Unit</StyledTableCell>
                                <StyledTableCell>GST %</StyledTableCell>
                                <StyledTableCell>Taxable Value</StyledTableCell>
                                <StyledTableCell>IGST</StyledTableCell>
                                <StyledTableCell>CGST</StyledTableCell>
                                <StyledTableCell>SGST</StyledTableCell>
                                <StyledTableCell>Invoice Value</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Combine server data with local data for immediate feedback */}
                            {[...localPurchases, ...(purchases || [])]
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((purchase) => {
                                    // Check if this is the newly added purchase
                                    const isNewPurchase = newPurchaseId && 
                                        (purchase.purchase_id === newPurchaseId || purchase.id === newPurchaseId);
                                    
                                    // Generate a unique key based on available ID fields
                                    const purchaseKey = purchase.purchase_id || purchase.id || 
                                        `purchase-${purchase.product_name}-${purchase.date}-${Math.random()}`;
                                    
                                    return (
                                        <TableRow 
                                            key={purchaseKey}
                                            hover 
                                            sx={{ 
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                // Add highlight style for new purchases
                                                ...(isNewPurchase && { 
                                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                    transition: 'background-color 1s ease-in-out' 
                                                })
                                            }}
                                        >
                                            <TableCell align="left">{formatDate(purchase.date)}</TableCell>
                                            <TableCell align="left">{purchase.product_name}</TableCell>
                                            <TableCell align="left">{purchase.hsn_code}</TableCell>
                                            <TableCell align="left">{purchase.units}</TableCell>
                                            <TableCell align="left">{purchase.purchase_invoice_number}</TableCell>
                                            <TableCell align="left">{purchase.purchase_qty}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.mrp_incl_gst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.mrp_excl_gst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">{parseFloat(purchase.discount_on_purchase_percentage || 0).toFixed(2)}%</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_cost_per_unit_ex_gst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">{parseFloat(purchase.gst_percentage || 0).toFixed(2)}%</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_taxable_value || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_igst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_cgst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_sgst || 0).toFixed(2)}</TableCell>
                                            <TableCell align="left">₹{parseFloat(purchase.purchase_invoice_value_rs || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                    
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={purchases.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </Box>
        </Box>
    );
};

export default PurchaseTab;
