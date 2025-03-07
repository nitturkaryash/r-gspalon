import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Tables = {
  profiles: Profile
  services: Service
  appointments: Appointment
  stylists: Stylist
  clients: Client
  orders: Order
}

export type Profile = {
  id: string
  created_at: string
  email: string
  full_name: string
  avatar_url?: string
}

export type Service = {
  id: string
  created_at: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  active: boolean
}

export type Appointment = {
  id: string
  created_at: string
  client_id: string
  stylist_id: string
  service_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

export type Stylist = {
  id: string
  created_at: string
  profile_id: string
  specialties: string[]
  bio: string
  available: boolean
}

export type Client = {
  id: string
  created_at: string
  profile_id: string
  phone: string
  preferences?: string
  last_visit?: string
}

export type Order = {
  id: string
  created_at: string
  client_id: string
  stylist_id: string
  total: number
  status: 'pending' | 'completed' | 'refunded'
  payment_method: string
} 