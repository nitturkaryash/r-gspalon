import * as XLSX from 'xlsx';
import { Purchase, Sale, Consumption, BalanceStock, Product } from '../models/inventoryTypes';
/**
 * Generate an Excel file with all inventory data in the STOCK DETAILS format
 */
export declare function generateStockDetailsExcel(products: Product[], purchases: Purchase[], sales: Sale[], consumption: Consumption[], balanceStock: BalanceStock[]): XLSX.WorkBook;
/**
 * Export inventory data to an Excel file and trigger download
 */
export declare function exportInventoryToExcel(products: Product[], purchases: Purchase[], sales: Sale[], consumption: Consumption[], balanceStock: BalanceStock[], filename?: string): void;
