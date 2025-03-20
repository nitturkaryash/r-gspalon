// Define types for displaying the balance stock in the UI
export interface BalanceStockDisplay {
  id: string;
  product_name: string; 
  balance_qty: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
} 