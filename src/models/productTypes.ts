// ProductCollection represents a category or group of products
export interface ProductCollection {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

// Product represents a product with pricing and stock information
export interface Product {
  id: string;
  collection_id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  active: boolean;
  image_url?: string;
  created_at?: string;
} 