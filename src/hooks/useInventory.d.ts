import { Purchase, PurchaseFormState, ProcessingStats, InventoryExportData } from '../models/inventoryTypes';
export declare const useInventory: () => {
    purchasesQuery: import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
    salesQuery: import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
    consumptionQuery: import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
    balanceStockQuery: import("@tanstack/react-query").DefinedUseQueryResult<unknown, Error>;
    createPurchase: (purchaseData: PurchaseFormState) => Promise<Purchase[]>;
    isCreatingPurchase: boolean;
    syncSalesFromPos: (startDate: string, endDate: string) => Promise<void>;
    isSyncingSales: boolean;
    syncConsumptionFromPos: (startDate: string, endDate: string) => Promise<void>;
    isSyncingConsumption: boolean;
    exportInventoryData: () => Promise<InventoryExportData>;
    isExporting: boolean;
    processingStats: ProcessingStats;
};
