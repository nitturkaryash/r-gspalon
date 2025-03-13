import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  ButtonGroup
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  AddShoppingCartRounded,
  ShoppingCartRounded,
  LocalMallRounded,
  SaveRounded,
  ClearRounded,
  CalculateRounded
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useInventoryManagement } from '../../hooks/useInventoryManagement';
import { Product } from '../../models/inventoryTypes';

interface InventoryFormProps {
  type: 'purchase' | 'sale' | 'consumption';
  products: Product[];
  onTypeChange: (type: 'purchase' | 'sale' | 'consumption') => void;
  productId?: string;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  type,
  products,
  onTypeChange,
  productId
}) => {
  const initialPurchaseState = {
    date: new Date(),
    product_id: productId || '',
    invoice_no: '',
    qty: 0,
    price_incl_gst: 0,
    price_ex_gst: 0,
    discount_percentage: 0,
    purchase_cost_per_unit_ex_gst: 0,
    gst_percentage: 18, // Default GST rate
    taxable_value: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    invoice_value: 0
  };

  const initialSaleState = {
    date: new Date(),
    product_id: productId || '',
    invoice_no: '',
    qty: 0,
    purchase_cost_per_unit_ex_gst: 0,
    purchase_gst_percentage: 18, // Default GST rate
    purchase_taxable_value: 0,
    purchase_igst: 0,
    purchase_cgst: 0,
    purchase_sgst: 0,
    total_purchase_cost: 0,
    mrp_incl_gst: 0,
    mrp_ex_gst: 0,
    discount_percentage: 0,
    discounted_sales_rate_ex_gst: 0,
    sales_gst_percentage: 18, // Default GST rate
    sales_taxable_value: 0,
    sales_igst: 0,
    sales_cgst: 0,
    sales_sgst: 0,
    invoice_value: 0
  };

  const initialConsumptionState = {
    date: new Date(),
    product_id: productId || '',
    requisition_voucher_no: '',
    qty: 0,
    purchase_cost_per_unit_ex_gst: 0,
    purchase_gst_percentage: 18, // Default GST rate
    taxable_value: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    total_purchase_cost: 0
  };

  const [purchaseData, setPurchaseData] = useState(initialPurchaseState);
  const [saleData, setSaleData] = useState(initialSaleState);
  const [consumptionData, setConsumptionData] = useState(initialConsumptionState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { loading, error, handleInventoryFormSubmit, fetchProduct } = useInventoryManagement();

  // Reset form when type changes
  useEffect(() => {
    setPurchaseData(initialPurchaseState);
    setSaleData(initialSaleState);
    setConsumptionData(initialConsumptionState);
  }, [type]);

  // Fetch product details if productId is provided
  useEffect(() => {
    if (productId) {
      const fetchProductDetails = async () => {
        try {
          const product = await fetchProduct(productId);
          if (product) {
            if (type === 'purchase') {
              setPurchaseData(prev => ({ ...prev, product_id: productId }));
            } else if (type === 'sale') {
              setSaleData(prev => ({ ...prev, product_id: productId }));
            } else {
              setConsumptionData(prev => ({ ...prev, product_id: productId }));
            }
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        }
      };

      fetchProductDetails();
    }
  }, [productId, type, fetchProduct]);

  const handleProductChange = async (event: SelectChangeEvent) => {
    const newProductId = event.target.value;
    if (type === 'purchase') {
      setPurchaseData(prev => ({ ...prev, product_id: newProductId }));
    } else if (type === 'sale') {
      try {
        const product = await fetchProduct(newProductId);
        if (product) {
          setSaleData(prev => ({
            ...prev,
            product_id: newProductId,
            mrp_incl_gst: 0, // Reset price fields
            mrp_ex_gst: 0
          }));
        }
      } catch (error) {
        console.error('Error fetching product for sale:', error);
      }
    } else {
      try {
        const product = await fetchProduct(newProductId);
        if (product) {
          setConsumptionData(prev => ({
            ...prev,
            product_id: newProductId
          }));
        }
      } catch (error) {
        console.error('Error fetching product for consumption:', error);
      }
    }
  };

  // Handle purchase form calculations
  const calculatePurchaseValues = () => {
    const {
      qty,
      price_incl_gst,
      discount_percentage,
      gst_percentage
    } = purchaseData;

    // Calculate price excluding GST from price including GST
    const price_ex_gst = price_incl_gst / (1 + gst_percentage / 100);

    // Apply discount
    const discounted_price = price_ex_gst * (1 - discount_percentage / 100);

    // Calculate purchase cost per unit
    const purchase_cost_per_unit_ex_gst = discounted_price;

    // Calculate taxable value
    const taxable_value = purchase_cost_per_unit_ex_gst * qty;

    // Calculate GST amounts
    const cgst = taxable_value * (gst_percentage / 2) / 100;
    const sgst = taxable_value * (gst_percentage / 2) / 100;
    const igst = 0; // Assuming CGST+SGST model

    // Calculate invoice value
    const invoice_value = taxable_value + cgst + sgst + igst;

    setPurchaseData(prev => ({
      ...prev,
      price_ex_gst: parseFloat(price_ex_gst.toFixed(2)),
      purchase_cost_per_unit_ex_gst: parseFloat(purchase_cost_per_unit_ex_gst.toFixed(2)),
      taxable_value: parseFloat(taxable_value.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst,
      invoice_value: parseFloat(invoice_value.toFixed(2))
    }));
  };

  // Handle sale form calculations
  const calculateSaleValues = () => {
    const {
      qty,
      mrp_incl_gst,
      discount_percentage,
      sales_gst_percentage,
      purchase_cost_per_unit_ex_gst,
      purchase_gst_percentage
    } = saleData;

    // Calculate MRP excluding GST
    const mrp_ex_gst = mrp_incl_gst / (1 + sales_gst_percentage / 100);

    // Calculate discounted rate
    const discounted_sales_rate_ex_gst = mrp_ex_gst * (1 - discount_percentage / 100);

    // Calculate sales taxable value
    const sales_taxable_value = discounted_sales_rate_ex_gst * qty;

    // Calculate sales GST
    const sales_cgst = sales_taxable_value * (sales_gst_percentage / 2) / 100;
    const sales_sgst = sales_taxable_value * (sales_gst_percentage / 2) / 100;
    const sales_igst = 0; // Assuming CGST+SGST model

    // Calculate sales invoice value
    const invoice_value = sales_taxable_value + sales_cgst + sales_sgst + sales_igst;

    // Calculate purchase values for this sale
    const purchase_taxable_value = purchase_cost_per_unit_ex_gst * qty;
    const purchase_cgst = purchase_taxable_value * (purchase_gst_percentage / 2) / 100;
    const purchase_sgst = purchase_taxable_value * (purchase_gst_percentage / 2) / 100;
    const purchase_igst = 0; // Assuming CGST+SGST model
    const total_purchase_cost = purchase_taxable_value + purchase_cgst + purchase_sgst + purchase_igst;

    setSaleData(prev => ({
      ...prev,
      mrp_ex_gst: parseFloat(mrp_ex_gst.toFixed(2)),
      discounted_sales_rate_ex_gst: parseFloat(discounted_sales_rate_ex_gst.toFixed(2)),
      sales_taxable_value: parseFloat(sales_taxable_value.toFixed(2)),
      sales_cgst: parseFloat(sales_cgst.toFixed(2)),
      sales_sgst: parseFloat(sales_sgst.toFixed(2)),
      sales_igst,
      invoice_value: parseFloat(invoice_value.toFixed(2)),
      purchase_taxable_value: parseFloat(purchase_taxable_value.toFixed(2)),
      purchase_cgst: parseFloat(purchase_cgst.toFixed(2)),
      purchase_sgst: parseFloat(purchase_sgst.toFixed(2)),
      purchase_igst,
      total_purchase_cost: parseFloat(total_purchase_cost.toFixed(2))
    }));
  };

  // Handle consumption form calculations
  const calculateConsumptionValues = () => {
    const {
      qty,
      purchase_cost_per_unit_ex_gst,
      purchase_gst_percentage
    } = consumptionData;

    // Calculate taxable value
    const taxable_value = purchase_cost_per_unit_ex_gst * qty;

    // Calculate GST amounts
    const cgst = taxable_value * (purchase_gst_percentage / 2) / 100;
    const sgst = taxable_value * (purchase_gst_percentage / 2) / 100;
    const igst = 0; // Assuming CGST+SGST model

    // Calculate total value
    const total_purchase_cost = taxable_value + cgst + sgst + igst;

    setConsumptionData(prev => ({
      ...prev,
      taxable_value: parseFloat(taxable_value.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst,
      total_purchase_cost: parseFloat(total_purchase_cost.toFixed(2))
    }));
  };

  const handlePurchaseChange = (field: string, value: any) => {
    setPurchaseData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaleChange = (field: string, value: any) => {
    setSaleData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsumptionChange = (field: string, value: any) => {
    setConsumptionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let formData: any;
      
      if (type === 'purchase') {
        formData = {
          ...purchaseData,
          date: format(purchaseData.date, 'yyyy-MM-dd')
        };
      } else if (type === 'sale') {
        formData = {
          ...saleData,
          date: format(saleData.date, 'yyyy-MM-dd')
        };
      } else {
        formData = {
          ...consumptionData,
          date: format(consumptionData.date, 'yyyy-MM-dd')
        };
      }
      
      await handleInventoryFormSubmit(type, formData);
      
      // Reset form after successful submission
      if (type === 'purchase') {
        setPurchaseData(initialPurchaseState);
      } else if (type === 'sale') {
        setSaleData(initialSaleState);
      } else {
        setConsumptionData(initialConsumptionState);
      }
      
      setSnackbar({
        open: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || `Failed to add ${type}`,
        severity: 'error'
      });
    }
  };

  const handleReset = () => {
    if (type === 'purchase') {
      setPurchaseData(initialPurchaseState);
    } else if (type === 'sale') {
      setSaleData(initialSaleState);
    } else {
      setConsumptionData(initialConsumptionState);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
            {type === 'purchase' ? (
              <><AddShoppingCartRounded sx={{ mr: 1 }} /> Add Purchase</>
            ) : type === 'sale' ? (
              <><ShoppingCartRounded sx={{ mr: 1 }} /> Add Sale</>
            ) : (
              <><LocalMallRounded sx={{ mr: 1 }} /> Add Consumption</>
            )}
          </Typography>
          
          <ButtonGroup variant="contained">
            <Button
              color="primary"
              onClick={() => onTypeChange('purchase')}
              variant={type === 'purchase' ? 'contained' : 'outlined'}
              startIcon={<AddShoppingCartRounded />}
            >
              Purchase
            </Button>
            <Button
              color="secondary"
              onClick={() => onTypeChange('sale')}
              variant={type === 'sale' ? 'contained' : 'outlined'}
              startIcon={<ShoppingCartRounded />}
            >
              Sale
            </Button>
            <Button
              color="info"
              onClick={() => onTypeChange('consumption')}
              variant={type === 'consumption' ? 'contained' : 'outlined'}
              startIcon={<LocalMallRounded />}
            >
              Consumption
            </Button>
          </ButtonGroup>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Common fields across all forms */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="product-select-label">Product</InputLabel>
              <Select
                labelId="product-select-label"
                id="product-select"
                value={
                  type === 'purchase'
                    ? purchaseData.product_id
                    : type === 'sale'
                    ? saleData.product_id
                    : consumptionData.product_id
                }
                label="Product"
                onChange={handleProductChange}
                required
              >
                {products.map(product => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.hsn_code} - {product.units})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Date"
              value={
                type === 'purchase'
                  ? purchaseData.date
                  : type === 'sale'
                  ? saleData.date
                  : consumptionData.date
              }
              onChange={(newValue) => {
                if (newValue) {
                  if (type === 'purchase') {
                    handlePurchaseChange('date', newValue);
                  } else if (type === 'sale') {
                    handleSaleChange('date', newValue);
                  } else {
                    handleConsumptionChange('date', newValue);
                  }
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  required: true,
                  InputLabelProps: {
                    shrink: true,
                  },
                },
              }}
            />
          </Grid>

          {/* Purchase specific fields */}
          {type === 'purchase' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={purchaseData.invoice_no}
                  onChange={(e) => handlePurchaseChange('invoice_no', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={purchaseData.qty || ''}
                  onChange={(e) => handlePurchaseChange('qty', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MRP Including GST"
                  type="number"
                  value={purchaseData.price_incl_gst || ''}
                  onChange={(e) => handlePurchaseChange('price_incl_gst', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Discount Percentage"
                  type="number"
                  value={purchaseData.discount_percentage || ''}
                  onChange={(e) => handlePurchaseChange('discount_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Percentage"
                  type="number"
                  value={purchaseData.gst_percentage || ''}
                  onChange={(e) => handlePurchaseChange('gst_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CalculateRounded />}
                  onClick={calculatePurchaseValues}
                  sx={{ mb: 2 }}
                >
                  Calculate Values
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Calculated Values
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MRP Excluding GST"
                  type="number"
                  value={purchaseData.price_ex_gst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Cost per Unit"
                  type="number"
                  value={purchaseData.purchase_cost_per_unit_ex_gst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Taxable Value"
                  type="number"
                  value={purchaseData.taxable_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CGST Amount"
                  type="number"
                  value={purchaseData.cgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SGST Amount"
                  type="number"
                  value={purchaseData.sgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Value"
                  type="number"
                  value={purchaseData.invoice_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
            </>
          )}

          {/* Sale specific fields */}
          {type === 'sale' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={saleData.invoice_no}
                  onChange={(e) => handleSaleChange('invoice_no', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={saleData.qty || ''}
                  onChange={(e) => handleSaleChange('qty', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Cost Per Unit"
                  type="number"
                  value={saleData.purchase_cost_per_unit_ex_gst || ''}
                  onChange={(e) => handleSaleChange('purchase_cost_per_unit_ex_gst', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase GST Percentage"
                  type="number"
                  value={saleData.purchase_gst_percentage || ''}
                  onChange={(e) => handleSaleChange('purchase_gst_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MRP Including GST"
                  type="number"
                  value={saleData.mrp_incl_gst || ''}
                  onChange={(e) => handleSaleChange('mrp_incl_gst', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Discount Percentage"
                  type="number"
                  value={saleData.discount_percentage || ''}
                  onChange={(e) => handleSaleChange('discount_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sales GST Percentage"
                  type="number"
                  value={saleData.sales_gst_percentage || ''}
                  onChange={(e) => handleSaleChange('sales_gst_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CalculateRounded />}
                  onClick={calculateSaleValues}
                  sx={{ mb: 2 }}
                >
                  Calculate Values
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Calculated Sales Values
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MRP Excluding GST"
                  type="number"
                  value={saleData.mrp_ex_gst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Discounted Sales Rate"
                  type="number"
                  value={saleData.discounted_sales_rate_ex_gst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sales Taxable Value"
                  type="number"
                  value={saleData.sales_taxable_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sales CGST Amount"
                  type="number"
                  value={saleData.sales_cgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sales SGST Amount"
                  type="number"
                  value={saleData.sales_sgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Value"
                  type="number"
                  value={saleData.invoice_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Calculated Purchase Cost
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Taxable Value"
                  type="number"
                  value={saleData.purchase_taxable_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Purchase Cost"
                  type="number"
                  value={saleData.total_purchase_cost || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
            </>
          )}

          {/* Consumption specific fields */}
          {type === 'consumption' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Requisition Voucher Number"
                  value={consumptionData.requisition_voucher_no}
                  onChange={(e) => handleConsumptionChange('requisition_voucher_no', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={consumptionData.qty || ''}
                  onChange={(e) => handleConsumptionChange('qty', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Cost Per Unit"
                  type="number"
                  value={consumptionData.purchase_cost_per_unit_ex_gst || ''}
                  onChange={(e) => handleConsumptionChange('purchase_cost_per_unit_ex_gst', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Percentage"
                  type="number"
                  value={consumptionData.purchase_gst_percentage || ''}
                  onChange={(e) => handleConsumptionChange('purchase_gst_percentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CalculateRounded />}
                  onClick={calculateConsumptionValues}
                  sx={{ mb: 2 }}
                >
                  Calculate Values
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Calculated Values
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Taxable Value"
                  type="number"
                  value={consumptionData.taxable_value || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CGST Amount"
                  type="number"
                  value={consumptionData.cgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SGST Amount"
                  type="number"
                  value={consumptionData.sgst || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Value"
                  type="number"
                  value={consumptionData.total_purchase_cost || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearRounded />}
            onClick={handleReset}
          >
            Reset Form
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveRounded />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default InventoryForm; 