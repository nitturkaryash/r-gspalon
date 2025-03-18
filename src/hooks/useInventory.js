import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, TABLES, handleSupabaseError } from '../utils/supabase/supabaseClient';
// Query keys for caching
const QUERY_KEYS = {
    PURCHASES: 'inventory-purchases',
    SALES: 'inventory-sales',
    CONSUMPTION: 'inventory-consumption',
    BALANCE_STOCK: 'inventory-balance-stock',
};
export const useInventory = () => {
    const queryClient = useQueryClient();
    const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
    const [isSyncingSales, setIsSyncingSales] = useState(false);
    const [isSyncingConsumption, setIsSyncingConsumption] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [processingStats, setProcessingStats] = useState(null);
    // Function to calculate derived values for purchases
    const calculatePurchaseValues = (data) => {
        const mrpInclGst = data.mrp_incl_gst;
        const gstPercentage = data.gst_percentage;
        const discountPercentage = data.discount_on_purchase_percentage;
        const quantity = data.purchase_qty;
        // Calculate MRP excluding GST
        const mrpExclGst = mrpInclGst / (1 + (gstPercentage / 100));
        // Apply discount
        const discountedRate = mrpExclGst * (1 - (discountPercentage / 100));
        // Calculate taxable value (rate * quantity)
        const taxableValue = discountedRate * quantity;
        // Calculate GST amounts
        const totalGst = taxableValue * (gstPercentage / 100);
        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        const igst = 0; // Assuming IGST is 0 for local purchases
        // Calculate invoice value
        const invoiceValue = taxableValue + totalGst;
        return {
            ...data,
            mrp_excl_gst: parseFloat(mrpExclGst.toFixed(2)),
            purchase_taxable_value: parseFloat(taxableValue.toFixed(2)),
            purchase_igst: parseFloat(igst.toFixed(2)),
            purchase_cgst: parseFloat(cgst.toFixed(2)),
            purchase_sgst: parseFloat(sgst.toFixed(2)),
            purchase_invoice_value_rs: parseFloat(invoiceValue.toFixed(2)),
        };
    };
    // Query to fetch purchases
    const purchasesQuery = useQuery({
        queryKey: [QUERY_KEYS.PURCHASES],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from(TABLES.PURCHASES)
                    .select('*')
                    .order('date', { ascending: false });
                if (error)
                    throw handleSupabaseError(error);
                return data;
            }
            catch (error) {
                console.error('Error fetching purchases:', error);
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false,
        suspense: false, // Disable suspense mode
    });
    // Query to fetch sales
    const salesQuery = useQuery({
        queryKey: [QUERY_KEYS.SALES],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from(TABLES.SALES)
                    .select('*')
                    .order('date', { ascending: false });
                if (error)
                    throw handleSupabaseError(error);
                return data;
            }
            catch (error) {
                console.error('Error fetching sales:', error);
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false,
        suspense: false, // Disable suspense mode
    });
    // Query to fetch consumption
    const consumptionQuery = useQuery({
        queryKey: [QUERY_KEYS.CONSUMPTION],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from(TABLES.CONSUMPTION)
                    .select('*')
                    .order('date', { ascending: false });
                if (error)
                    throw handleSupabaseError(error);
                return data;
            }
            catch (error) {
                console.error('Error fetching consumption:', error);
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false,
        suspense: false, // Disable suspense mode
    });
    // Query to fetch balance stock
    const balanceStockQuery = useQuery({
        queryKey: [QUERY_KEYS.BALANCE_STOCK],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from('inventory_balance_stock')
                    .select('*');
                if (error)
                    throw handleSupabaseError(error);
                return data;
            }
            catch (error) {
                console.error('Error fetching balance stock:', error);
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false,
        suspense: false, // Disable suspense mode
    });
    // Mutation to create a new purchase
    const createPurchaseMutation = useMutation({
        mutationFn: async (purchaseData) => {
            setIsCreatingPurchase(true);
            try {
                // Calculate derived values
                const fullPurchaseData = calculatePurchaseValues(purchaseData);
                // Insert into Supabase
                const { data, error } = await supabase
                    .from(TABLES.PURCHASES)
                    .insert([fullPurchaseData])
                    .select();
                if (error)
                    throw handleSupabaseError(error);
                return data;
            }
            catch (error) {
                console.error('Error creating purchase:', error);
                throw error;
            }
            finally {
                setIsCreatingPurchase(false);
            }
        },
        onSuccess: () => {
            // Invalidate cache and refetch data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PURCHASES] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
        }
    });
    // Function to create a new purchase
    const createPurchase = async (purchaseData) => {
        return createPurchaseMutation.mutateAsync(purchaseData);
    };
    // Mock function to simulate fetching sales from POS
    // In a real application, this would connect to your POS API
    const fetchSalesFromPOS = async (startDate, endDate) => {
        // This is a placeholder - you'll replace with actual POS integration
        // For now, generate some mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const mockOrders = [];
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const dayDiff = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
        // Generate some mock orders
        for (let i = 0; i < Math.min(dayDiff + 1, 10); i++) {
            const orderDate = new Date(startDateTime);
            orderDate.setDate(startDateTime.getDate() + i);
            const orderItems = [];
            const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
            for (let j = 0; j < itemCount; j++) {
                // Get a random product from purchases if available, or use placeholder
                const products = purchasesQuery.data || [];
                const product = products.length > 0
                    ? products[Math.floor(Math.random() * products.length)]
                    : {
                        product_name: `Product ${j + 1}`,
                        hsn_code: `HSN${Math.floor(1000 + Math.random() * 9000)}`,
                        units: 'pcs',
                        mrp_incl_gst: Math.floor(100 + Math.random() * 900),
                        mrp_excl_gst: Math.floor(80 + Math.random() * 800),
                        gst_percentage: [5, 12, 18, 28][Math.floor(Math.random() * 4)]
                    };
                orderItems.push({
                    product_name: product.product_name,
                    hsn_code: product.hsn_code,
                    units: product.units,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    mrp_incl_gst: product.mrp_incl_gst,
                    mrp_excl_gst: product.mrp_excl_gst,
                    discount_percentage: Math.floor(Math.random() * 10),
                    gst_percentage: product.gst_percentage
                });
            }
            mockOrders.push({
                order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                invoice_no: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
                date: orderDate.toISOString(),
                items: orderItems
            });
        }
        return mockOrders;
    };
    // Function to sync sales data from POS
    const syncSalesFromPos = async (startDate, endDate) => {
        setIsSyncingSales(true);
        setProcessingStats({
            startTime: new Date(),
            endTime: null,
            total: 0,
            processed: 0,
            errors: 0
        });
        try {
            // Fetch orders from POS
            const orders = await fetchSalesFromPOS(startDate, endDate);
            setProcessingStats(prev => ({
                ...prev,
                total: orders.reduce((acc, order) => acc + order.items.length, 0)
            }));
            // Process each order
            for (const order of orders) {
                // Process each item in the order
                for (const item of order.items) {
                    try {
                        // Calculate sales values
                        const mrpInclGst = item.mrp_incl_gst;
                        const mrpExclGst = item.mrp_excl_gst;
                        const discountPercentage = item.discount_percentage;
                        const gstPercentage = item.gst_percentage;
                        const quantity = item.quantity;
                        // Calculate discounted rate
                        const discountedRateExclGst = mrpExclGst * (1 - (discountPercentage / 100));
                        // Calculate taxable value
                        const taxableValue = discountedRateExclGst * quantity;
                        // Calculate GST amounts
                        const totalGst = taxableValue * (gstPercentage / 100);
                        const cgst = totalGst / 2;
                        const sgst = totalGst / 2;
                        const igst = 0; // Assuming IGST is 0 for local sales
                        // Calculate invoice value
                        const invoiceValue = taxableValue + totalGst;
                        // Get purchase cost details (for FIFO costing)
                        // In a real application, you would implement FIFO logic here
                        // For now, use simplified approach by getting the latest purchase
                        const { data: purchaseData } = await supabase
                            .from(TABLES.PURCHASES)
                            .select('*')
                            .eq('product_name', item.product_name)
                            .order('date', { ascending: false })
                            .limit(1);
                        const purchaseCost = purchaseData && purchaseData.length > 0
                            ? {
                                purchase_cost_per_unit_ex_gst: purchaseData[0].mrp_excl_gst * (1 - (purchaseData[0].discount_on_purchase_percentage / 100)),
                                purchase_gst_percentage: purchaseData[0].gst_percentage,
                                total_purchase_cost: (purchaseData[0].mrp_excl_gst * (1 - (purchaseData[0].discount_on_purchase_percentage / 100)) * item.quantity) * (1 + (purchaseData[0].gst_percentage / 100))
                            }
                            : {
                                purchase_cost_per_unit_ex_gst: mrpExclGst * 0.5, // Fallback: assume 50% of MRP is cost
                                purchase_gst_percentage: gstPercentage,
                                total_purchase_cost: (mrpExclGst * 0.5 * quantity) * (1 + (gstPercentage / 100))
                            };
                        // Prepare sale record
                        const saleRecord = {
                            date: order.date,
                            invoice_no: order.invoice_no,
                            product_name: item.product_name,
                            hsn_code: item.hsn_code,
                            units: item.units,
                            sales_qty: quantity,
                            mrp_incl_gst: mrpInclGst,
                            mrp_excl_gst: mrpExclGst,
                            discount_on_sales_percentage: discountPercentage,
                            discounted_sales_rate_excl_gst: discountedRateExclGst,
                            sales_gst_percentage: gstPercentage,
                            sales_taxable_value: taxableValue,
                            igst_rs: igst,
                            cgst_rs: cgst,
                            sgst_rs: sgst,
                            invoice_value_rs: invoiceValue,
                            purchase_cost_per_unit_ex_gst: purchaseCost.purchase_cost_per_unit_ex_gst,
                            purchase_gst_percentage: purchaseCost.purchase_gst_percentage,
                            purchase_taxable_value: purchaseCost.purchase_cost_per_unit_ex_gst * quantity,
                            purchase_cgst: (purchaseCost.purchase_cost_per_unit_ex_gst * quantity * purchaseCost.purchase_gst_percentage / 100) / 2,
                            purchase_sgst: (purchaseCost.purchase_cost_per_unit_ex_gst * quantity * purchaseCost.purchase_gst_percentage / 100) / 2,
                            total_purchase_cost: purchaseCost.total_purchase_cost
                        };
                        // Insert sale record
                        await supabase.from(TABLES.SALES).insert([saleRecord]);
                        // Update processing stats
                        setProcessingStats(prev => ({
                            ...prev,
                            processed: prev.processed + 1
                        }));
                    }
                    catch (error) {
                        console.error('Error processing sales item:', error);
                        setProcessingStats(prev => ({
                            ...prev,
                            processed: prev.processed + 1,
                            errors: prev.errors + 1
                        }));
                    }
                }
            }
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SALES] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
            setProcessingStats(prev => ({
                ...prev,
                endTime: new Date()
            }));
        }
        catch (error) {
            console.error('Error syncing sales data:', error);
            throw error;
        }
        finally {
            setIsSyncingSales(false);
        }
    };
    // Function to sync consumption data from POS
    const syncConsumptionFromPos = async (startDate, endDate) => {
        setIsSyncingConsumption(true);
        setProcessingStats({
            startTime: new Date(),
            endTime: null,
            total: 0,
            processed: 0,
            errors: 0
        });
        try {
            // For this example, we'll convert a percentage of existing sales into consumption
            // In a real application, you would fetch actual consumption data from your POS or inventory system
            // Fetch sales data within the date range
            const { data: salesData, error: salesError } = await supabase
                .from(TABLES.SALES)
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate);
            if (salesError)
                throw handleSupabaseError(salesError);
            // For demo purposes, select 30% of sales items to convert to consumption
            const selectedItems = salesData
                ? salesData.filter(() => Math.random() < 0.3)
                : [];
            setProcessingStats(prev => ({
                ...prev,
                total: selectedItems.length
            }));
            // Process each selected item
            for (const [index, item] of selectedItems.entries()) {
                try {
                    // Create consumption record based on sale data
                    const consumptionRecord = {
                        date: item.date,
                        requisition_voucher_no: `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
                        product_name: item.product_name,
                        hsn_code: item.hsn_code,
                        units: item.units,
                        consumption_qty: Math.ceil(item.sales_qty * 0.5), // Use half of sales quantity for demo
                        purchase_cost_per_unit_ex_gst: item.purchase_cost_per_unit_ex_gst,
                        purchase_gst_percentage: item.purchase_gst_percentage,
                        purchase_taxable_value: item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5),
                        purchase_cgst: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5) * item.purchase_gst_percentage / 100) / 2,
                        purchase_sgst: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5) * item.purchase_gst_percentage / 100) / 2,
                        total_purchase_cost: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5)) * (1 + (item.purchase_gst_percentage / 100)),
                        // These values would be calculated more accurately in a real system
                        balance_qty: 0, // Will be updated by the balance stock view
                        taxable_value: item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5),
                        cgst_rs: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5) * item.purchase_gst_percentage / 100) / 2,
                        sgst_rs: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5) * item.purchase_gst_percentage / 100) / 2,
                        invoice_value: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5)) * (1 + (item.purchase_gst_percentage / 100))
                    };
                    // Insert consumption record
                    await supabase.from(TABLES.CONSUMPTION).insert([consumptionRecord]);
                    // Update processing stats
                    setProcessingStats(prev => ({
                        ...prev,
                        processed: prev.processed + 1
                    }));
                    // For demo purposes, add a small delay between operations
                    if (index < selectedItems.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                catch (error) {
                    console.error('Error processing consumption item:', error);
                    setProcessingStats(prev => ({
                        ...prev,
                        processed: prev.processed + 1,
                        errors: prev.errors + 1
                    }));
                }
            }
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONSUMPTION] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
            setProcessingStats(prev => ({
                ...prev,
                endTime: new Date()
            }));
        }
        catch (error) {
            console.error('Error syncing consumption data:', error);
            throw error;
        }
        finally {
            setIsSyncingConsumption(false);
        }
    };
    // Function to export inventory data for CSV
    const exportInventoryData = async () => {
        setIsExporting(true);
        try {
            // Fetch all required data
            const [purchases, sales, consumption, balanceStock] = await Promise.all([
                supabase.from(TABLES.PURCHASES).select('*').then(res => res.data || []),
                supabase.from(TABLES.SALES).select('*').then(res => res.data || []),
                supabase.from(TABLES.CONSUMPTION).select('*').then(res => res.data || []),
                supabase.from('inventory_balance_stock').select('*').then(res => res.data || [])
            ]);
            return {
                purchases: purchases,
                sales: sales,
                consumption: consumption,
                balanceStock: balanceStock
            };
        }
        catch (error) {
            console.error('Error exporting inventory data:', error);
            throw error;
        }
        finally {
            setIsExporting(false);
        }
    };
    return {
        // Queries
        purchasesQuery,
        salesQuery,
        consumptionQuery,
        balanceStockQuery,
        // Create purchase
        createPurchase,
        isCreatingPurchase,
        // Sync sales
        syncSalesFromPos,
        isSyncingSales,
        // Sync consumption
        syncConsumptionFromPos,
        isSyncingConsumption,
        // Export data
        exportInventoryData,
        isExporting,
        // Processing stats for UI feedback
        processingStats
    };
};
