import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, TablePagination, Autocomplete } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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

const PurchaseTab = ({ purchases, isLoading, error }) => {
    const { createPurchase, isCreatingPurchase } = useInventory();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [products, setProducts] = useState([]);
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
        gst_percentage: 0,
        purchase_taxable_value: 0,
        purchase_igst: 0,
        purchase_cgst: 0,
        purchase_sgst: 0,
        purchase_invoice_value_rs: 0,
    });
    const [formErrors, setFormErrors] = useState({});

    // Load products on component mount
    useEffect(() => {
        const loadedProducts = getAllProducts();
        setProducts(loadedProducts);
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // For numeric fields, convert to numbers
        const numericFields = ['purchase_qty', 'mrp_incl_gst', 'mrp_excl_gst', 'discount_on_purchase_percentage', 'gst_percentage'];
        const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
        setFormState(prevState => ({
            ...prevState,
            [name]: newValue
        }));
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
            setFormState(prevState => ({
                ...prevState,
                product_name: newValue.name,
                // Also update HSN code and units if available
                ...(newValue.hsn_code && { hsn_code: newValue.hsn_code }),
                ...(newValue.units && { units: newValue.units }),
                // Set MRP from product price if available
                ...(newValue.price && { 
                    mrp_incl_gst: newValue.price,
                    // Recalculate MRP excluding GST based on current GST percentage
                    mrp_excl_gst: newValue.price / (1 + (prevState.gst_percentage / 100))
                })
            }));
            // Clear errors when fields are updated
            const clearedErrors = { ...formErrors };
            if (clearedErrors.product_name) delete clearedErrors.product_name;
            if (newValue.hsn_code && clearedErrors.hsn_code) delete clearedErrors.hsn_code;
            if (newValue.units && clearedErrors.units) delete clearedErrors.units;
            setFormErrors(clearedErrors);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            await createPurchase(formState);
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
                gst_percentage: 0,
                purchase_taxable_value: 0,
                purchase_igst: 0,
                purchase_cgst: 0,
                purchase_sgst: 0,
                purchase_invoice_value_rs: 0,
            });
        }
        catch (error) {
            console.error('Error creating purchase:', error);
        }
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
        <Box>
            <Typography variant="h6" gutterBottom>
                Add New Purchase
            </Typography>
            
            <Paper sx={{ p: 3, mb: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Date"
                                type="date"
                                name="date"
                                value={formState.date}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <Autocomplete
                                options={products}
                                getOptionLabel={(option) => option.name || ''}
                                value={products.find(p => p.name === formState.product_name) || null}
                                onChange={handleProductSelect}
                                onInputChange={handleProductInputChange}
                                freeSolo
                                fullWidth
                                disableClearable={false}
                                autoComplete
                                includeInputInList
                                filterSelectedOptions
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <div>
                                            <Typography variant="body1">{option.name}</Typography>
                                            {option.price && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Price: ₹{option.price.toFixed(2)}
                                                </Typography>
                                            )}
                                        </div>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Product Name"
                                        name="product_name"
                                        value={formState.product_name}
                                        onChange={handleProductInputChange}
                                        fullWidth
                                        margin="normal"
                                        error={!!formErrors.product_name}
                                        helperText={formErrors.product_name}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="HSN Code"
                                name="hsn_code"
                                value={formState.hsn_code}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.hsn_code}
                                helperText={formErrors.hsn_code}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Units"
                                name="units"
                                value={formState.units}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.units}
                                helperText={formErrors.units}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase Invoice Number"
                                name="purchase_invoice_number"
                                value={formState.purchase_invoice_number}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_invoice_number}
                                helperText={formErrors.purchase_invoice_number}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase Quantity"
                                name="purchase_qty"
                                type="number"
                                value={formState.purchase_qty}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_qty}
                                helperText={formErrors.purchase_qty}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="MRP (Incl. GST)"
                                name="mrp_incl_gst"
                                type="number"
                                value={formState.mrp_incl_gst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.mrp_incl_gst}
                                helperText={formErrors.mrp_incl_gst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="MRP (Excl. GST)"
                                name="mrp_excl_gst"
                                type="number"
                                value={formState.mrp_excl_gst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.mrp_excl_gst}
                                helperText={formErrors.mrp_excl_gst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Discount on Purchase (%)"
                                name="discount_on_purchase_percentage"
                                type="number"
                                value={formState.discount_on_purchase_percentage}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.discount_on_purchase_percentage}
                                helperText={formErrors.discount_on_purchase_percentage}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase Cost per Unit (Ex.GST) (Rs.)"
                                name="purchase_cost_per_unit_ex_gst"
                                type="number"
                                value={formState.purchase_cost_per_unit_ex_gst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_cost_per_unit_ex_gst}
                                helperText={formErrors.purchase_cost_per_unit_ex_gst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="GST Percentage"
                                name="gst_percentage"
                                type="number"
                                value={formState.gst_percentage}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.gst_percentage}
                                helperText={formErrors.gst_percentage}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Taxable Value (Rs.)"
                                name="purchase_taxable_value"
                                type="number"
                                value={formState.purchase_taxable_value}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_taxable_value}
                                helperText={formErrors.purchase_taxable_value}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase IGST (Rs.)"
                                name="purchase_igst"
                                type="number"
                                value={formState.purchase_igst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_igst}
                                helperText={formErrors.purchase_igst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase CGST (Rs.)"
                                name="purchase_cgst"
                                type="number"
                                value={formState.purchase_cgst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_cgst}
                                helperText={formErrors.purchase_cgst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase SGST (Rs.)"
                                name="purchase_sgst"
                                type="number"
                                value={formState.purchase_sgst}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_sgst}
                                helperText={formErrors.purchase_sgst}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Purchase Invoice Value (Rs.)"
                                name="purchase_invoice_value_rs"
                                type="number"
                                value={formState.purchase_invoice_value_rs}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                error={!!formErrors.purchase_invoice_value_rs}
                                helperText={formErrors.purchase_invoice_value_rs}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isCreatingPurchase}
                                startIcon={isCreatingPurchase ? <CircularProgress size={20} /> : <AddIcon />}
                                sx={{ mt: 2 }}
                            >
                                Add Purchase
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
                Purchase Records
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading purchases: {error.message}
                </Alert>
            )}
            
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {purchases.length === 0 ? (
                        <Alert severity="info">No purchase records found.</Alert>
                    ) : (
                        <Paper>
                            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                                <Table stickyHeader aria-label="purchases table">
                                    <TableHead>
                                        <TableRow key="header-row">
                                            <StyledTableCell>Date</StyledTableCell>
                                            <StyledTableCell>Product Name</StyledTableCell>
                                            <StyledTableCell>HSN Code</StyledTableCell>
                                            <StyledTableCell>Units</StyledTableCell>
                                            <StyledTableCell>Purchase Invoice Number</StyledTableCell>
                                            <StyledTableCell align="right">Purchase Quantity</StyledTableCell>
                                            <StyledTableCell align="right">MRP (Incl. GST)</StyledTableCell>
                                            <StyledTableCell align="right">MRP (Excl. GST)</StyledTableCell>
                                            <StyledTableCell align="right">Discount on Purchase (%)</StyledTableCell>
                                            <StyledTableCell align="right">Purchase Cost per Unit (Ex.GST) (Rs.)</StyledTableCell>
                                            <StyledTableCell align="right">GST Percentage</StyledTableCell>
                                            <StyledTableCell align="right">Taxable Value (Rs.)</StyledTableCell>
                                            <StyledTableCell align="right">Purchase IGST (Rs.)</StyledTableCell>
                                            <StyledTableCell align="right">Purchase CGST (Rs.)</StyledTableCell>
                                            <StyledTableCell align="right">Purchase SGST (Rs.)</StyledTableCell>
                                            <StyledTableCell align="right">Purchase Invoice Value (Rs.)</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {purchases
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((purchase) => (
                                                <TableRow 
                                                    key={purchase.purchase_id || `purchase-${purchase.product_name}-${purchase.date}`}
                                                    hover 
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell>{formatDate(purchase.date)}</TableCell>
                                                    <TableCell>{purchase.product_name}</TableCell>
                                                    <TableCell>{purchase.hsn_code}</TableCell>
                                                    <TableCell>{purchase.units}</TableCell>
                                                    <TableCell>{purchase.purchase_invoice_number}</TableCell>
                                                    <TableCell align="right">{purchase.purchase_qty}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.mrp_incl_gst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.mrp_excl_gst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">{parseFloat(purchase.discount_on_purchase_percentage || 0).toFixed(2)}%</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_cost_per_unit_ex_gst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">{parseFloat(purchase.gst_percentage || 0).toFixed(2)}%</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_taxable_value || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_igst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_cgst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_sgst || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{parseFloat(purchase.purchase_invoice_value_rs || 0).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={purchases.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
};

export default PurchaseTab;
