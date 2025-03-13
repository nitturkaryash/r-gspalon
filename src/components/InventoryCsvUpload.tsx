import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import {
  Box,
  Button,
  TextField,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';

interface Product {
  name: string;
  id: number;
}

interface ManualInputData {
  productName: string;
  hsnCode: string;
  units: string;
  purchaseInvoiceNumber: string;
  purchaseQuantity: number;
  purchaseCostPerUnit: number;
  gstPercentage: number;
}

const InventoryCsvUpload: React.FC = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualData, setManualData] = useState<ManualInputData>({
    productName: '',
    hsnCode: '',
    units: '',
    purchaseInvoiceNumber: '',
    purchaseQuantity: 0,
    purchaseCostPerUnit: 0,
    gstPercentage: 0,
  });

  const queryClient = useQueryClient();

  // Fetch products for dropdown
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    }
  });

  // Calculate derived values
  const calculateDerivedValues = useCallback((data: any) => {
    const purchaseQuantity = Number(data['Purchase Quantity'] || data.purchaseQuantity);
    const purchaseCostPerUnit = Number(data['Purchase Cost per Unit'] || data.purchaseCostPerUnit);
    const gstPercentage = Number(data['GST Percentage'] || data.gstPercentage);

    const purchaseTaxableValue = purchaseQuantity * purchaseCostPerUnit;
    const purchasesCGST = (gstPercentage / 2) * purchaseTaxableValue / 100;
    const purchasesSGST = (gstPercentage / 2) * purchaseTaxableValue / 100;
    const purchaseInvoiceValue = purchaseTaxableValue + purchasesCGST + purchasesSGST;

    return {
      purchaseTaxableValue,
      purchasesCGST,
      purchasesSGST,
      purchaseInvoiceValue,
    };
  }, []);

  // Validate derived values
  const validateDerivedValues = useCallback((data: any, calculated: any) => {
    const tolerance = 0.01;
    
    if (data['Purchase Taxable Value'] !== undefined && 
        Math.abs(Number(data['Purchase Taxable Value']) - calculated.purchaseTaxableValue) > tolerance) {
      throw new Error('validation error');
    }
    
    if (data['Purchases CGST'] !== undefined && 
        Math.abs(Number(data['Purchases CGST']) - calculated.purchasesCGST) > tolerance) {
      throw new Error('validation error');
    }
    
    if (data['Purchases SGST'] !== undefined && 
        Math.abs(Number(data['Purchases SGST']) - calculated.purchasesSGST) > tolerance) {
      throw new Error('validation error');
    }
    
    if (data['Purchase Invoice Value'] !== undefined && 
        Math.abs(Number(data['Purchase Invoice Value']) - calculated.purchaseInvoiceValue) > tolerance) {
      throw new Error('validation error');
    }
  }, []);

  // Mutation for inserting purchases
  const insertPurchase = useMutation({
    mutationFn: async (purchaseData: any) => {
      const { data, error } = await supabase.from('purchases').insert([purchaseData]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_balances'] });
      setSuccess('Purchase data inserted successfully');
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Handle CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const processedData = results.data.map((row: any) => {
            const calculated = calculateDerivedValues(row);
            validateDerivedValues(row, calculated);
            return { ...row, ...calculated };
          });

          setCsvData(processedData);
          processedData.forEach((row) => {
            insertPurchase.mutate(row);
          });
        } catch (err: any) {
          setError(err.message);
        }
      },
      error: (error) => {
        setError(error.message);
      },
    });
  };

  // Handle manual input
  const handleManualInput = () => {
    if (!manualData.productName || !manualData.purchaseQuantity) {
      setError('Product name and purchase quantity are required');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const calculated = calculateDerivedValues(manualData);
      const purchaseData = {
        ...manualData,
        ...calculated,
      };
      insertPurchase.mutate(purchaseData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventory CSV Upload
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Upload CSV
          </Typography>
          <Button
            variant="contained"
            component="label"
            sx={{ mb: 2 }}
          >
            Upload File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleCsvUpload}
              aria-label="upload csv"
            />
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Manual Stock Input
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="product-name-label">Product Name</InputLabel>
                <Select
                  labelId="product-name-label"
                  id="product-name"
                  value={manualData.productName}
                  label="Product Name"
                  onChange={(e) => setManualData({ ...manualData, productName: e.target.value as string })}
                >
                  {products?.map((product) => (
                    <MenuItem key={product.id} value={product.name}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HSN Code"
                value={manualData.hsnCode}
                onChange={(e) => setManualData({ ...manualData, hsnCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Units"
                value={manualData.units}
                onChange={(e) => setManualData({ ...manualData, units: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Invoice Number"
                value={manualData.purchaseInvoiceNumber}
                onChange={(e) => setManualData({ ...manualData, purchaseInvoiceNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Quantity"
                value={manualData.purchaseQuantity}
                onChange={(e) => setManualData({ ...manualData, purchaseQuantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Cost per Unit"
                value={manualData.purchaseCostPerUnit}
                onChange={(e) => setManualData({ ...manualData, purchaseCostPerUnit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="GST Percentage"
                value={manualData.gstPercentage}
                onChange={(e) => setManualData({ ...manualData, gstPercentage: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleManualInput}
                disabled={!manualData.productName || !manualData.purchaseQuantity}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryCsvUpload; 