export interface Stylist {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization?: string;
  joinDate: string;
  profileImage?: string;
  status: 'active' | 'inactive';
} 