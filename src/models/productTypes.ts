export interface ProductCollection {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductItem {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  price: number; // Stored in paisa (1/100 of a rupee)
  stock_quantity: number;
  sku: string;
  hsn_code?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormState {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  hsn_code?: string;
  active: boolean;
} 