// Collection represents a category or group of products
export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

// Product represents an inventory item
export interface Product {
  id: string;
  collection_id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

// Calculate profit for a product
export const calculateProfit = (price: number, cost: number): number => {
  return parseFloat((price - cost).toFixed(2));
};

// Calculate profit margin as a percentage
export const calculateProfitMargin = (price: number, cost: number): number => {
  if (price <= 0) return 0;
  return parseFloat((((price - cost) / price) * 100).toFixed(2));
}; 