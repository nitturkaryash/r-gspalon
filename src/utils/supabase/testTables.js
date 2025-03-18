import { supabase } from './supabaseClient';
/**
 * Test script to check if the inventory tables exist
 */
export const testInventoryTables = async () => {
    console.log('Testing if inventory tables exist...');
    // Check purchases table
    const { error: purchasesError } = await supabase
        .from('inventory_purchases')
        .select('count(*)', { count: 'exact', head: true });
    const purchasesExists = !purchasesError;
    console.log('inventory_purchases exists:', purchasesExists);
    // Check sales table
    const { error: salesError } = await supabase
        .from('inventory_sales')
        .select('count(*)', { count: 'exact', head: true });
    const salesExists = !salesError;
    console.log('inventory_sales exists:', salesExists);
    // Check consumption table
    const { error: consumptionError } = await supabase
        .from('inventory_consumption')
        .select('count(*)', { count: 'exact', head: true });
    const consumptionExists = !consumptionError;
    console.log('inventory_consumption exists:', consumptionExists);
    // Check balance stock view
    const { error: balanceStockError } = await supabase
        .from('inventory_balance_stock')
        .select('count(*)', { count: 'exact', head: true });
    const balanceStockExists = !balanceStockError;
    console.log('inventory_balance_stock exists:', balanceStockExists);
    return {
        purchasesExists,
        salesExists,
        consumptionExists,
        balanceStockExists
    };
};
// Function to insert a test purchase record
export const insertTestPurchase = async () => {
    try {
        const testPurchase = {
            product_name: 'Test Shampoo',
            hsn_code: '33051010',
            units: 'bottles',
            purchase_invoice_number: 'TEST-001',
            purchase_qty: 10,
            mrp_incl_gst: 500,
            discount_on_purchase_percentage: 5,
            gst_percentage: 18
        };
        const { data, error } = await supabase
            .from('inventory_purchases')
            .insert([testPurchase])
            .select();
        if (error) {
            console.error('Error inserting test purchase:', error);
            return false;
        }
        console.log('Test purchase inserted successfully:', data);
        return true;
    }
    catch (error) {
        console.error('Failed to insert test purchase:', error);
        return false;
    }
};
// Function to check if the tables have data
export const checkTableData = async () => {
    // Check purchases count
    const { data: purchasesData, error: purchasesError } = await supabase
        .from('inventory_purchases')
        .select('count', { count: 'exact', head: true });
    const purchasesCount = purchasesError ? 0 : (purchasesData?.count || 0);
    // Check sales count
    const { data: salesData, error: salesError } = await supabase
        .from('inventory_sales')
        .select('count', { count: 'exact', head: true });
    const salesCount = salesError ? 0 : (salesData?.count || 0);
    // Check consumption count
    const { data: consumptionData, error: consumptionError } = await supabase
        .from('inventory_consumption')
        .select('count', { count: 'exact', head: true });
    const consumptionCount = consumptionError ? 0 : (consumptionData?.count || 0);
    console.log('Table data counts:', {
        purchasesCount,
        salesCount,
        consumptionCount
    });
    return {
        purchasesCount,
        salesCount,
        consumptionCount
    };
};
