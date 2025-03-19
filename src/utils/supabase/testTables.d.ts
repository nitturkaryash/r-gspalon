/**
 * Test script to check if the inventory tables exist
 */
export declare const testInventoryTables: () => Promise<{
    purchasesExists: boolean;
    salesExists: boolean;
    consumptionExists: boolean;
    balanceStockExists: boolean;
}>;
export declare const insertTestPurchase: () => Promise<boolean>;
export declare const checkTableData: () => Promise<{
    purchasesCount: number;
    salesCount: number;
    consumptionCount: number;
}>;
