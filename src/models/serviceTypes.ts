// ServiceCollection represents a category or group of services
export interface ServiceCollection {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

// Service represents a salon service with pricing and duration
export interface ServiceItem {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
  created_at?: string;
} 