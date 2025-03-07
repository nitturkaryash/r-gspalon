import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import { updateProductInventory } from './useProducts'
import { useClients } from './useClients'

// Extended payment method types to include BNPL
export const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'upi', 'bnpl'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  bnpl: 'Buy Now Pay Later',
}

// Mock data
const mockUnpaidAppointments = [
  {
    id: '1',
    client_id: '1',
    stylist_id: '1',
    service_id: '1',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: 'completed',
    paid: false,
    clients: { full_name: 'Alice Johnson' },
    services: { name: 'Men\'s Haircut', price: 3000 },
    stylists: { name: 'John Doe' }
  }
];

// Mock orders data
let mockOrders: Order[] = [];

// Load orders from localStorage or use empty array
const loadOrdersFromStorage = (): Order[] => {
  try {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      return JSON.parse(savedOrders);
    }
    return [];
  } catch (error) {
    console.error('Error loading orders from localStorage:', error);
    return [];
  }
};

// Save orders to localStorage
const saveOrdersToStorage = (orders: Order[]) => {
  try {
    localStorage.setItem('orders', JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving orders to localStorage:', error);
  }
};

// Initialize orders from storage
mockOrders = loadOrdersFromStorage();

interface CreateOrderData {
  appointment_id?: string
  client_name: string
  stylist_id: string
  services: Array<{
    service_id: string;
    service_name: string;
    price: number;
    type?: 'service' | 'product'; // Add type to distinguish between services and products
  }>
  total: number
  payment_method: PaymentMethod
  subtotal: number
  tax: number
  discount: number
  appointment_time?: string
  is_walk_in: boolean
}

export interface Order {
  id: string
  created_at: string
  client_name: string
  stylist_id: string
  stylist_name: string
  services: Array<{
    service_id: string;
    service_name: string;
    price: number;
    type?: 'service' | 'product'; // Add type to distinguish between services and products
  }>
  total: number
  subtotal: number
  tax: number
  discount: number
  payment_method: PaymentMethod
  status: 'completed' | 'pending' | 'cancelled'
  appointment_time?: string
  appointment_id?: string
  is_walk_in: boolean
}

const GST_RATE = 0.18 // 18% GST for salon services in India

export function usePOS() {
  const queryClient = useQueryClient()
  const { updateClientFromOrder } = useClients()

  // Query for unpaid appointments
  const { data: unpaidAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['unpaid-appointments'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockUnpaidAppointments
    },
  })

  // Query for all orders
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockOrders
    },
  })

  // Process payment for existing appointment
  const processAppointmentPayment = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (!data.appointment_id) {
        throw new Error('Appointment ID is required')
      }
      
      // Find the appointment
      const appointment = mockUnpaidAppointments.find(a => a.id === data.appointment_id)
      if (!appointment) {
        throw new Error('Appointment not found')
      }
      
      // Create order
      const order: Order = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        client_name: data.client_name,
        stylist_id: data.stylist_id,
        stylist_name: appointment.stylists.name,
        services: data.services,
        total: data.total,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        payment_method: data.payment_method,
        status: data.payment_method === 'bnpl' ? 'pending' : 'completed',
        appointment_id: data.appointment_id,
        is_walk_in: false,
        appointment_time: appointment.start_time
      }
      
      // Add to orders
      mockOrders.push(order)
      saveOrdersToStorage(mockOrders)
      
      // Remove from unpaid appointments
      const index = mockUnpaidAppointments.findIndex(a => a.id === data.appointment_id)
      if (index !== -1) {
        mockUnpaidAppointments.splice(index, 1)
      }
      
      // Update product inventory if there are products in the order
      const productUpdates = data.services
        .filter(service => service.service_id && service.type === 'product')
        .map(service => ({
          productId: service.service_id,
          quantity: 1 // Default quantity is 1, can be updated if quantity is tracked
        }));
      
      if (productUpdates.length > 0) {
        const result = updateProductInventory(productUpdates);
        if (!result.success) {
          console.error('Failed to update product inventory');
        }
      }
      
      // Update client spending data
      await updateClientFromOrder(
        data.client_name,
        data.total,
        data.payment_method,
        order.created_at
      );
      
      return { success: true, order }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unpaid-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Invalidate products to refresh inventory
      queryClient.invalidateQueries({ queryKey: ['clients'] }) // Invalidate clients to refresh client data
      toast.success('Payment processed successfully')
    },
    onError: (error) => {
      toast.error('Failed to process payment')
      console.error('Payment error:', error)
    },
  })
  
  // Create a new walk-in order
  const createWalkInOrder = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get the stylist name from the stylists data
      const stylistsData = queryClient.getQueryData<any[]>(['stylists']);
      const stylistName = stylistsData?.find(s => s.id === data.stylist_id)?.name || 'Unknown Stylist';
      
      // Create order
      const order: Order = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        client_name: data.client_name,
        stylist_id: data.stylist_id,
        stylist_name: stylistName, // Use the correct stylist name
        services: data.services,
        total: data.total,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        payment_method: data.payment_method,
        status: data.payment_method === 'bnpl' ? 'pending' : 'completed',
        appointment_time: data.appointment_time,
        is_walk_in: true
      }
      
      // Add to orders
      mockOrders.push(order)
      saveOrdersToStorage(mockOrders)
      
      // Update product inventory if there are products in the order
      const productUpdates = data.services
        .filter(service => service.service_id && service.type === 'product')
        .map(service => ({
          productId: service.service_id,
          quantity: 1 // Default quantity is 1, can be updated if quantity is tracked
        }));
      
      if (productUpdates.length > 0) {
        const result = updateProductInventory(productUpdates);
        if (!result.success) {
          console.error('Failed to update product inventory');
        }
      }
      
      // Update client spending data
      await updateClientFromOrder(
        data.client_name,
        data.total,
        data.payment_method,
        order.created_at
      );
      
      return { success: true, order }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Invalidate products to refresh inventory
      queryClient.invalidateQueries({ queryKey: ['clients'] }) // Invalidate clients to refresh client data
      toast.success('Walk-in order created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create order')
      console.error('Order error:', error)
    },
  })

  const calculateTotal = (
    servicePrices: number[],
    discount: number = 0,
    paymentMethod: PaymentMethod = 'upi'
  ) => {
    const subtotal = servicePrices.reduce((sum, price) => sum + price, 0)
    
    // Apply GST only if payment method is not cash
    const tax = paymentMethod === 'cash' 
      ? 0 // No GST for cash payments
      : Math.round(subtotal * GST_RATE) // Apply GST for other payment methods
    
    const total = subtotal + tax - discount

    return {
      subtotal: Math.round(subtotal), // Round to whole rupees
      tax: tax,
      total: Math.round(total), // Round to whole rupees
    }
  }

  return {
    unpaidAppointments,
    orders,
    isLoading: loadingAppointments || loadingOrders,
    processAppointmentPayment: processAppointmentPayment.mutate,
    createWalkInOrder: createWalkInOrder.mutate,
    calculateTotal,
  }
} 