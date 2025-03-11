export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  balance: number;
  membershipType?: 'regular' | 'premium';
  notes?: string;
} 