import { InventoryExportData } from '../models/inventoryTypes';
export declare const generateCsvData: (data: InventoryExportData) => string;
export declare const downloadCsv: (data: InventoryExportData) => void;
