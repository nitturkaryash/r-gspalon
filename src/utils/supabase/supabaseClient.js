import { createClient } from '@supabase/supabase-js';
// Get environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // Don't persist the session to avoid JWT errors
        autoRefreshToken: false, // Don't try to refresh the token
        detectSessionInUrl: false, // Don't look for the session in the URL
    },
});
// DEVELOPMENT MODE: Create mock data handlers
// This should be removed in production
const DEVELOPMENT_MODE = true;
// List of tables to use mock data for
const MOCK_DATA_TABLES = [
    'inventory_purchases',
    'inventory_sales',
    'inventory_consumption',
    'inventory_balance_stock',
    'product_collections',
    'products'
];
// Mock data for inventory
const mockInventoryData = {
    purchases: Array(10).fill(null).map((_, i) => ({
        id: `purchase-${i}`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        product_name: `Product ${i}`,
        hsn_code: `HSN${1000 + i}`,
        units: 'pcs',
        purchase_qty: Math.floor(Math.random() * 10) + 1,
        mrp_incl_gst: Math.floor(Math.random() * 1000) + 100,
        mrp_excl_gst: Math.floor(Math.random() * 800) + 80,
        gst_percentage: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
        purchase_taxable_value: Math.floor(Math.random() * 5000) + 500,
        purchase_igst: 0,
        purchase_cgst: Math.floor(Math.random() * 250) + 25,
        purchase_sgst: Math.floor(Math.random() * 250) + 25,
        purchase_invoice_value_rs: Math.floor(Math.random() * 6000) + 600,
        discount_on_purchase_percentage: Math.floor(Math.random() * 10),
        vendor_name: `Vendor ${i}`,
        invoice_no: `INV-${1000 + i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })),
    sales: Array(10).fill(null).map((_, i) => ({
        id: `sale-${i}`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        product_name: `Product ${i}`,
        hsn_code: `HSN${1000 + i}`,
        units: 'pcs',
        quantity: Math.floor(Math.random() * 5) + 1,
        mrp_incl_gst: Math.floor(Math.random() * 1000) + 100,
        mrp_excl_gst: Math.floor(Math.random() * 800) + 80,
        discount_percentage: Math.floor(Math.random() * 10),
        gst_percentage: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
        taxable_value: Math.floor(Math.random() * 4000) + 400,
        igst: 0,
        cgst: Math.floor(Math.random() * 200) + 20,
        sgst: Math.floor(Math.random() * 200) + 20,
        invoice_value: Math.floor(Math.random() * 5000) + 500,
        invoice_no: `INV-${1000 + i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })),
    consumption: Array(10).fill(null).map((_, i) => ({
        id: `consumption-${i}`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        product_name: `Product ${i}`,
        hsn_code: `HSN${1000 + i}`,
        units: 'pcs',
        quantity: Math.floor(Math.random() * 3) + 1,
        mrp_incl_gst: Math.floor(Math.random() * 1000) + 100,
        mrp_excl_gst: Math.floor(Math.random() * 800) + 80,
        gst_percentage: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
        taxable_value: Math.floor(Math.random() * 3000) + 300,
        igst: 0,
        cgst: Math.floor(Math.random() * 150) + 15,
        sgst: Math.floor(Math.random() * 150) + 15,
        invoice_value: Math.floor(Math.random() * 4000) + 400,
        purpose: ['Service', 'Staff Use', 'Damage'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })),
    balance_stock: Array(10).fill(null).map((_, i) => ({
        id: `stock-${i}`,
        product_name: `Product ${i}`,
        hsn_code: `HSN${1000 + i}`,
        units: 'pcs',
        opening_stock: Math.floor(Math.random() * 20) + 5,
        purchases: Math.floor(Math.random() * 15) + 5,
        sales: Math.floor(Math.random() * 10) + 1,
        consumption: Math.floor(Math.random() * 5) + 1,
        closing_stock: Math.floor(Math.random() * 25) + 5,
        last_updated: new Date().toISOString(),
    })),
    // We'll keep these as fallback in case the real tables don't exist
    product_collections: [
        { id: 1, name: 'Hair Care', description: 'Products for hair care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: 'Skin Care', description: 'Products for skin care and treatment', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: 'Makeup', description: 'Makeup and cosmetic products', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: 'Nail Care', description: 'Products for nail care and styling', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, name: 'Fragrances', description: 'Perfumes and fragrances', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ],
    products: [
        { id: 1, collection_id: 1, name: 'Shampoo - Premium', description: 'High-quality shampoo for all hair types', price: 59900, stock_quantity: 25, sku: 'HC-SH-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, collection_id: 1, name: 'Conditioner - Premium', description: 'Nourishing conditioner for all hair types', price: 49900, stock_quantity: 20, sku: 'HC-CN-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, collection_id: 1, name: 'Hair Serum', description: 'Smoothing serum for frizzy hair', price: 79900, stock_quantity: 15, sku: 'HC-SR-001', hsn_code: '3305', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, collection_id: 2, name: 'Face Wash', description: 'Gentle face wash for daily use', price: 39900, stock_quantity: 30, sku: 'SC-FW-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, collection_id: 2, name: 'Moisturizer', description: 'Hydrating moisturizer for all skin types', price: 69900, stock_quantity: 25, sku: 'SC-MT-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 6, collection_id: 3, name: 'Foundation', description: 'Long-lasting foundation with SPF', price: 89900, stock_quantity: 10, sku: 'MU-FN-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 7, collection_id: 3, name: 'Lipstick', description: 'Creamy matte lipstick', price: 59900, stock_quantity: 15, sku: 'MU-LS-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 8, collection_id: 4, name: 'Nail Polish', description: 'Quick-dry nail polish', price: 29900, stock_quantity: 20, sku: 'NC-NP-001', hsn_code: '3304', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 9, collection_id: 5, name: 'Perfume - Floral', description: 'Long-lasting floral fragrance', price: 129900, stock_quantity: 8, sku: 'FR-PF-001', hsn_code: '3303', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 10, collection_id: 5, name: 'Perfume - Woody', description: 'Sophisticated woody fragrance', price: 139900, stock_quantity: 7, sku: 'FR-PF-002', hsn_code: '3303', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
};
// Override Supabase methods in development mode
if (DEVELOPMENT_MODE) {
    console.log('🔧 DEVELOPMENT MODE: Using mock data for inventory and real data for products');
    // Create a proxy to intercept Supabase calls
    const originalFrom = supabase.from;
    // Override the from method to intercept table access
    supabase.from = function (table) {
        // Check if we're accessing a table with mock data
        if (MOCK_DATA_TABLES.includes(table)) {
            console.log(`DEV: Intercepting request to ${table} (using mock data)`);
            // Get the appropriate mock data
            let mockData;
            switch (table) {
                case 'inventory_purchases':
                    mockData = mockInventoryData.purchases;
                    break;
                case 'inventory_sales':
                    mockData = mockInventoryData.sales;
                    break;
                case 'inventory_consumption':
                    mockData = mockInventoryData.consumption;
                    break;
                case 'inventory_balance_stock':
                    mockData = mockInventoryData.balance_stock;
                    break;
                case 'product_collections':
                    mockData = mockInventoryData.product_collections;
                    break;
                case 'products':
                    mockData = mockInventoryData.products;
                    break;
                default:
                    mockData = [];
            }
            // Return a mock implementation of the Supabase interface
            return {
                select: (columns) => ({
                    order: (column, { ascending } = { ascending: true }) => ({
                        eq: (column, value) => ({
                            single: () => Promise.resolve({ data: mockData.find(item => item[column] === value), error: null }),
                            then: (callback) => Promise.resolve({ data: mockData.filter(item => item[column] === value), error: null }).then(callback)
                        }),
                        then: (callback) => Promise.resolve({ data: [...mockData].sort((a, b) => {
                                if (ascending) {
                                    return a[column] > b[column] ? 1 : -1;
                                }
                                else {
                                    return a[column] < b[column] ? 1 : -1;
                                }
                            }), error: null }).then(callback)
                    }),
                    eq: (column, value) => ({
                        single: () => Promise.resolve({ data: mockData.find(item => item[column] === value), error: null }),
                        then: (callback) => Promise.resolve({ data: mockData.filter(item => item[column] === value), error: null }).then(callback),
                        order: (column, { ascending } = { ascending: true }) => ({
                            then: (callback) => Promise.resolve({
                                data: [...mockData]
                                    .filter(item => item[column] === value)
                                    .sort((a, b) => {
                                    if (ascending) {
                                        return a[column] > b[column] ? 1 : -1;
                                    }
                                    else {
                                        return a[column] < b[column] ? 1 : -1;
                                    }
                                }),
                                error: null
                            }).then(callback)
                        })
                    }),
                    then: (callback) => {
                        console.log(`DEV: Returning ${mockData.length} mock records for ${table}`);
                        return Promise.resolve({ data: mockData, error: null }).then(callback);
                    }
                }),
                insert: (items) => ({
                    select: () => ({
                        single: () => {
                            const newItem = { ...items[0], id: `new-${Date.now()}` };
                            mockData.unshift(newItem);
                            console.log(`DEV: Inserted 1 mock record into ${table}:`, newItem);
                            return Promise.resolve({ data: newItem, error: null });
                        },
                        then: (callback) => {
                            const newItems = items.map((item, i) => ({ ...item, id: `new-${Date.now()}-${i}` }));
                            mockData.unshift(...newItems);
                            console.log(`DEV: Inserted ${newItems.length} mock records into ${table}`);
                            return Promise.resolve({ data: newItems, error: null }).then(callback);
                        }
                    }),
                    then: (callback) => {
                        const newItems = items.map((item, i) => ({ ...item, id: `new-${Date.now()}-${i}` }));
                        mockData.unshift(...newItems);
                        console.log(`DEV: Inserted ${newItems.length} mock records into ${table} (without select)`);
                        return Promise.resolve({ data: newItems, error: null }).then(callback);
                    }
                }),
                update: (updates) => ({
                    eq: (column, value) => ({
                        select: () => ({
                            single: () => {
                                const index = mockData.findIndex(item => item[column] === value);
                                if (index !== -1) {
                                    mockData[index] = { ...mockData[index], ...updates };
                                    return Promise.resolve({ data: mockData[index], error: null });
                                }
                                return Promise.resolve({ data: null, error: { message: 'Not found' } });
                            },
                            then: (callback) => {
                                const items = mockData.filter(item => item[column] === value);
                                items.forEach(item => Object.assign(item, updates));
                                return Promise.resolve({ data: items, error: null }).then(callback);
                            }
                        }),
                        then: (callback) => {
                            const items = mockData.filter(item => item[column] === value);
                            items.forEach(item => Object.assign(item, updates));
                            return Promise.resolve({ data: items, error: null }).then(callback);
                        }
                    }),
                    then: (callback) => Promise.resolve({ data: mockData, error: null }).then(callback)
                }),
                delete: () => ({
                    eq: (column, value) => {
                        const index = mockData.findIndex(item => item[column] === value);
                        if (index !== -1) {
                            mockData.splice(index, 1);
                        }
                        return Promise.resolve({ data: null, error: null });
                    },
                    then: (callback) => Promise.resolve({ data: null, error: null }).then(callback)
                }),
                then: (callback) => Promise.resolve({ data: mockData, error: null }).then(callback)
            };
        }
        // For product_collections, products, and other tables, use the original implementation
        return originalFrom.call(supabase, table);
    };
    // Override auth methods
    const originalAuth = supabase.auth;
    // Create a fake user and session
    const fakeUser = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        user_metadata: { name: 'Development User' }
    };
    const fakeSession = {
        access_token: 'fake-token',
        refresh_token: 'fake-refresh-token',
        expires_at: new Date().getTime() + 3600000,
        user: fakeUser
    };
    // Only override specific methods, leave the rest intact
    const originalGetUser = originalAuth.getUser;
    originalAuth.getUser = async () => {
        console.log('DEV: Bypassing getUser');
        return { data: { user: fakeUser }, error: null };
    };
    const originalGetSession = originalAuth.getSession;
    originalAuth.getSession = async () => {
        console.log('DEV: Bypassing getSession');
        return { data: { session: fakeSession }, error: null };
    };
    const originalSignOut = originalAuth.signOut;
    originalAuth.signOut = async () => {
        console.log('DEV: Bypassing signOut');
        return { error: null };
    };
    // Add refreshSession method to prevent "refreshSession is not a function" error
    originalAuth.refreshSession = async () => {
        console.log('DEV: Bypassing refreshSession');
        return { data: { session: fakeSession }, error: null };
    };
}
// Tables for inventory management
export const TABLES = {
    PURCHASES: 'inventory_purchases',
    SALES: 'inventory_sales',
    CONSUMPTION: 'inventory_consumption',
};
// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
    console.error('Supabase error:', error);
    return new Error(error.message || 'An error occurred with the database operation');
};
// Helper function to check if user is authenticated
// DEVELOPMENT MODE: Always returns a fake user
export const checkAuthentication = async () => {
    // In development mode, always return a fake user
    if (DEVELOPMENT_MODE) {
        return {
            id: 'dev-user-id',
            email: 'dev@example.com',
            user_metadata: { name: 'Development User' }
        };
    }
    // Normal authentication check (not used in development)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Authentication error:', error);
        throw new Error(`Authentication error: ${error.message}`);
    }
    if (!user) {
        throw new Error('User is not authenticated. Please log in again.');
    }
    return user;
};
