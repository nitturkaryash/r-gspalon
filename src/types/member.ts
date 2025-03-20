export interface Member {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  joinDate: string | Date;
  balance: number;
  profileImage?: string;
  status?: 'active' | 'inactive';
  membershipType?: 'regular' | 'premium';
  notes?: string;
} 