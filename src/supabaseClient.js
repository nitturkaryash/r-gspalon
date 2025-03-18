import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// DEVELOPMENT MODE: Create localStorage data handlers
// This should be removed in production
const DEVELOPMENT_MODE = true;
// List of tables to use localStorage for
const LOCAL_STORAGE_TABLES = [
    'profiles',
    'services',
    'appointments',
    'stylists',
    'clients',
    'orders'
];
// Initialize minimal starter data if localStorage is empty
const initializeLocalStorageIfEmpty = () => {
    LOCAL_STORAGE_TABLES.forEach(table => {
        const storageKey = `local_${table}`;
        if (!localStorage.getItem(storageKey)) {
            // Create empty array for the table
            localStorage.setItem(storageKey, JSON.stringify([]));
        }
    });
};
// Helper to get data from localStorage
const getLocalData = (table) => {
    const storageKey = `local_${table}`;
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
        try {
            return JSON.parse(storedData);
        }
        catch (error) {
            console.error(`Error parsing ${table} data:`, error);
            return [];
        }
    }
    return [];
};
// Helper to save data to localStorage
const saveLocalData = (table, data) => {
    const storageKey = `local_${table}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
};
// Initialize localStorage if needed
if (DEVELOPMENT_MODE) {
    initializeLocalStorageIfEmpty();
}
// Override Supabase methods in development mode
if (DEVELOPMENT_MODE) {
    console.log('🔧 DEVELOPMENT MODE: Using localStorage for all data');
    // Store the original methods
    const originalFrom = supabase.from;
    const originalAuth = supabase.auth;
    // Create a proxy for the 'from' method
    supabase.from = function (table) {
        // Check if we're accessing a table that should use localStorage
        if (LOCAL_STORAGE_TABLES.includes(table)) {
            console.log(`DEV: Intercepting request to ${table}`);
            // Get the current data for this table
            let tableData = getLocalData(table);
            // Create a mock interface that mimics Supabase's query builder
            return {
                select: (columns) => {
                    console.log(`DEV: SELECT on ${table}`, columns);
                    return {
                        eq: (column, value) => {
                            const filtered = tableData.filter((row) => row[column] === value);
                            console.log(`DEV: Filtered ${table} by ${column}=${value}`, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        in: (column, values) => {
                            const filtered = tableData.filter((row) => values.includes(row[column]));
                            console.log(`DEV: Filtered ${table} by ${column} in [${values.join(', ')}]`, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        order: (column, options) => {
                            const ascending = options?.ascending !== false;
                            const sorted = [...tableData].sort((a, b) => {
                                if (ascending) {
                                    return a[column] > b[column] ? 1 : -1;
                                }
                                else {
                                    return a[column] < b[column] ? 1 : -1;
                                }
                            });
                            console.log(`DEV: Ordered ${table} by ${column} ${ascending ? 'ASC' : 'DESC'}`);
                            return {
                                data: sorted,
                                error: null,
                                then: (callback) => Promise.resolve({ data: sorted, error: null }).then(callback)
                            };
                        },
                        match: (criteria) => {
                            const filtered = tableData.filter((row) => {
                                return Object.entries(criteria).every(([key, value]) => row[key] === value);
                            });
                            console.log(`DEV: Matched ${table} with criteria`, criteria, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        gte: (column, value) => {
                            const filtered = tableData.filter((row) => row[column] >= value);
                            console.log(`DEV: Filtered ${table} by ${column}>=${value}`, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        lte: (column, value) => {
                            const filtered = tableData.filter((row) => row[column] <= value);
                            console.log(`DEV: Filtered ${table} by ${column}<=${value}`, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        gt: (column, value) => {
                            const filtered = tableData.filter((row) => row[column] > value);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        lt: (column, value) => {
                            const filtered = tableData.filter((row) => row[column] < value);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        like: (column, pattern) => {
                            const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
                            const filtered = tableData.filter((row) => regex.test(row[column]));
                            console.log(`DEV: Filtered ${table} by ${column} LIKE ${pattern}`, filtered);
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        ilike: (column, pattern) => {
                            const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
                            const filtered = tableData.filter((row) => regex.test(row[column]));
                            return {
                                data: filtered,
                                error: null,
                                then: (callback) => Promise.resolve({ data: filtered, error: null }).then(callback)
                            };
                        },
                        data: tableData,
                        error: null,
                        then: (callback) => Promise.resolve({ data: tableData, error: null }).then(callback)
                    };
                },
                insert: (data) => {
                    console.log(`DEV: INSERT into ${table}`, data);
                    const newData = Array.isArray(data) ? data : [data];
                    // Add IDs and created_at if not present
                    const timestamp = new Date().toISOString();
                    const dataWithIds = newData.map((item) => ({
                        id: item.id || uuidv4(),
                        created_at: item.created_at || timestamp,
                        ...item
                    }));
                    // Update the data
                    const updatedData = [...tableData, ...dataWithIds];
                    saveLocalData(table, updatedData);
                    console.log(`DEV: Inserted ${dataWithIds.length} records into ${table}`);
                    return {
                        data: dataWithIds,
                        error: null,
                        then: (callback) => Promise.resolve({ data: dataWithIds, error: null }).then(callback)
                    };
                },
                update: (data) => {
                    console.log(`DEV: UPDATE in ${table}`, data);
                    return {
                        eq: (column, value) => {
                            const index = tableData.findIndex((row) => row[column] === value);
                            if (index !== -1) {
                                const updatedData = [...tableData];
                                updatedData[index] = { ...updatedData[index], ...data };
                                saveLocalData(table, updatedData);
                                console.log(`DEV: Updated record in ${table} where ${column}=${value}`, updatedData[index]);
                                return {
                                    data: [updatedData[index]],
                                    error: null,
                                    then: (callback) => Promise.resolve({ data: [updatedData[index]], error: null }).then(callback)
                                };
                            }
                            console.log(`DEV: Failed to update record in ${table} where ${column}=${value} - not found`);
                            return {
                                data: null,
                                error: { message: 'Record not found' },
                                then: (callback) => Promise.resolve({ data: null, error: { message: 'Record not found' } }).then(callback)
                            };
                        },
                        match: (criteria) => {
                            // Find all records matching the criteria
                            const indices = tableData
                                .map((row, index) => ({ row, index }))
                                .filter(({ row }) => Object.entries(criteria).every(([key, value]) => row[key] === value))
                                .map(({ index }) => index);
                            if (indices.length > 0) {
                                const updatedData = [...tableData];
                                indices.forEach(index => {
                                    updatedData[index] = { ...updatedData[index], ...data };
                                });
                                saveLocalData(table, updatedData);
                                const updatedRecords = indices.map(index => updatedData[index]);
                                console.log(`DEV: Updated ${updatedRecords.length} records in ${table} matching criteria`, criteria);
                                return {
                                    data: updatedRecords,
                                    error: null,
                                    then: (callback) => Promise.resolve({ data: updatedRecords, error: null }).then(callback)
                                };
                            }
                            console.log(`DEV: Failed to update records in ${table} matching criteria - none found`, criteria);
                            return {
                                data: [],
                                error: null,
                                then: (callback) => Promise.resolve({ data: [], error: null }).then(callback)
                            };
                        },
                        in: (column, values) => {
                            // Find all records with column value in the values array
                            const indices = tableData
                                .map((row, index) => ({ row, index }))
                                .filter(({ row }) => values.includes(row[column]))
                                .map(({ index }) => index);
                            if (indices.length > 0) {
                                const updatedData = [...tableData];
                                indices.forEach(index => {
                                    updatedData[index] = { ...updatedData[index], ...data };
                                });
                                saveLocalData(table, updatedData);
                                const updatedRecords = indices.map(index => updatedData[index]);
                                console.log(`DEV: Updated ${updatedRecords.length} records in ${table} where ${column} in [${values.join(', ')}]`);
                                return {
                                    data: updatedRecords,
                                    error: null,
                                    then: (callback) => Promise.resolve({ data: updatedRecords, error: null }).then(callback)
                                };
                            }
                            console.log(`DEV: Failed to update records in ${table} where ${column} in [${values.join(', ')}] - none found`);
                            return {
                                data: [],
                                error: null,
                                then: (callback) => Promise.resolve({ data: [], error: null }).then(callback)
                            };
                        }
                    };
                },
                delete: () => {
                    return {
                        eq: (column, value) => {
                            const originalLength = tableData.length;
                            const filtered = tableData.filter((row) => row[column] !== value);
                            saveLocalData(table, filtered);
                            const deletedCount = originalLength - filtered.length;
                            console.log(`DEV: Deleted ${deletedCount} records from ${table} where ${column}=${value}`);
                            return {
                                data: { count: deletedCount },
                                error: null,
                                then: (callback) => Promise.resolve({ data: { count: deletedCount }, error: null }).then(callback)
                            };
                        },
                        match: (criteria) => {
                            const originalLength = tableData.length;
                            const filtered = tableData.filter((row) => {
                                return !Object.entries(criteria).every(([key, value]) => row[key] === value);
                            });
                            saveLocalData(table, filtered);
                            const deletedCount = originalLength - filtered.length;
                            console.log(`DEV: Deleted ${deletedCount} records from ${table} matching criteria`, criteria);
                            return {
                                data: { count: deletedCount },
                                error: null,
                                then: (callback) => Promise.resolve({ data: { count: deletedCount }, error: null }).then(callback)
                            };
                        },
                        in: (column, values) => {
                            const originalLength = tableData.length;
                            const filtered = tableData.filter((row) => !values.includes(row[column]));
                            saveLocalData(table, filtered);
                            const deletedCount = originalLength - filtered.length;
                            console.log(`DEV: Deleted ${deletedCount} records from ${table} where ${column} in [${values.join(', ')}]`);
                            return {
                                data: { count: deletedCount },
                                error: null,
                                then: (callback) => Promise.resolve({ data: { count: deletedCount }, error: null }).then(callback)
                            };
                        }
                    };
                },
                // Add support for upsert operations
                upsert: (data, options) => {
                    console.log(`DEV: UPSERT into ${table}`, data, options);
                    const newData = Array.isArray(data) ? data : [data];
                    const timestamp = new Date().toISOString();
                    // Process each record for upsert
                    const processedData = newData.map((item) => {
                        // If the item has an ID, check if it exists
                        if (item.id) {
                            const existingIndex = tableData.findIndex((row) => row.id === item.id);
                            if (existingIndex >= 0) {
                                // Update existing record
                                return {
                                    ...tableData[existingIndex],
                                    ...item,
                                    updated_at: timestamp
                                };
                            }
                        }
                        else if (options?.onConflict) {
                            // Check for conflict on the specified column
                            const conflictColumn = options.onConflict;
                            const existingIndex = tableData.findIndex((row) => row[conflictColumn] === item[conflictColumn]);
                            if (existingIndex >= 0) {
                                // Update existing record based on conflict column
                                return {
                                    ...tableData[existingIndex],
                                    ...item,
                                    updated_at: timestamp
                                };
                            }
                        }
                        // Insert new record
                        return {
                            id: item.id || uuidv4(),
                            created_at: item.created_at || timestamp,
                            updated_at: timestamp,
                            ...item
                        };
                    });
                    // Remove existing records that will be replaced
                    const idsToKeep = new Set(processedData.filter(item => item.id).map(item => item.id));
                    const filteredData = tableData.filter(row => !processedData.some(item => item.id === row.id));
                    // Combine filtered existing data with processed data
                    const updatedData = [...filteredData, ...processedData];
                    saveLocalData(table, updatedData);
                    console.log(`DEV: Upserted ${processedData.length} records into ${table}`);
                    return {
                        data: processedData,
                        error: null,
                        then: (callback) => Promise.resolve({ data: processedData, error: null }).then(callback)
                    };
                }
            };
        }
        // Fall back to the original method for tables not in our mock list
        return originalFrom(table);
    };
    // Mock auth methods
    supabase.auth = {
        ...originalAuth,
        signIn: () => Promise.resolve({
            data: {
                user: {
                    id: 'dev-user-id',
                    email: 'dev@example.com',
                    user_metadata: { full_name: 'Development User' }
                },
                session: { access_token: 'dev-token' }
            },
            error: null
        }),
        signUp: () => Promise.resolve({
            data: {
                user: {
                    id: 'dev-user-id',
                    email: 'dev@example.com',
                    user_metadata: { full_name: 'Development User' }
                },
                session: { access_token: 'dev-token' }
            },
            error: null
        }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({
            data: {
                session: {
                    access_token: 'dev-token',
                    user: {
                        id: 'dev-user-id',
                        email: 'dev@example.com',
                        user_metadata: { full_name: 'Development User' }
                    }
                }
            },
            error: null
        })
    };
}
