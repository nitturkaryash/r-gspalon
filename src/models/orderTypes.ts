// Fix OrderBy type to match the string literals used in the components
export type OrderBy = 
  'product_name' | 
  'hsn_code' | 
  'unit' | 
  'balance_qty' | 
  'avg_rate' | 
  'balance_value';

// Interface for Excel data parser
export interface ExcelData {
  products: Array<any>;
  purchases: Array<any>;
  sales: Array<any>;
  consumption: Array<any>;
} 