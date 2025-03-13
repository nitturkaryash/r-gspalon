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

// Interface for payment details - used for split payments
export interface PaymentDetail {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  payment_note?: string;
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
  // New fields for split payment
  payments?: PaymentDetail[]
  pending_amount?: number
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
  // Added for split payment functionality
  payments: PaymentDetail[]
  pending_amount: number
  is_split_payment: boolean
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

  // Process payment for existing appointment with split payment support
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
      
      // Calculate payments and pending amount
      const payments = data.payments || [];
      const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Fix: Use strict equality check when determining if pending amount should be zero
      const pendingAmount = paidAmount === data.total ? 0 : Math.max(0, data.total - paidAmount);
      
      const isSplitPayment = payments.length > 0;
      
      // Set order status based on payment
      let orderStatus: 'completed' | 'pending' | 'cancelled' = 'completed';
      if (pendingAmount > 0 || data.payment_method === 'bnpl') {
        orderStatus = 'pending';
      }
      
      // If no split payments provided, create a default payment
      if (!isSplitPayment) {
        payments.push({
          id: uuidv4(),
          amount: data.total,
          payment_method: data.payment_method,
          payment_date: new Date().toISOString(),
        });
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
        status: orderStatus,
        appointment_id: data.appointment_id,
        is_walk_in: false,
        appointment_time: appointment.start_time,
        payments: payments,
        pending_amount: pendingAmount,
        is_split_payment: isSplitPayment
      }
      
      // Add to orders
      mockOrders.push(order)
      saveOrdersToStorage(mockOrders)
      
      // Remove from unpaid appointments if fully paid
      if (pendingAmount === 0) {
        const index = mockUnpaidAppointments.findIndex(a => a.id === data.appointment_id)
        if (index !== -1) {
          mockUnpaidAppointments.splice(index, 1)
        }
      }
      
      // Update product inventory if there are products in the order
      const productUpdates = data.services
        .filter(service => service.service_id && service.type === 'product')
        .map(service => ({
          productId: service.service_id,
          quantity: 1 // Default quantity is 1, can be updated if quantity is tracked
        }));
      
      if (productUpdates.length > 0) {
        try {
          const result = await updateProductInventory(productUpdates);
          if (!result.success) {
            console.error('Failed to update product inventory');
          }
        } catch (error) {
          console.error('Error updating product inventory:', error);
        }
      }
      
      // Update client spending data
      await updateClientFromOrder(
        data.client_name,
        paidAmount, // Only update with the paid amount
        payments.length === 1 ? payments[0].payment_method : 'bnpl', // Use the first payment method or BNPL if multiple
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
  
  // Create a new walk-in order with split payment support
  const createWalkInOrder = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // CRITICAL FIX - COMPLETELY OVERRIDE THE PENDING CALCULATION
      // Force recalculation of all values to avoid any floating point or calculation issues
      data = JSON.parse(JSON.stringify(data)); // Deep clone to avoid reference issues
      
      // Get the stylist name from the stylists data
      const stylistsData = queryClient.getQueryData<any[]>(['stylists']);
      const stylistName = stylistsData?.find(s => s.id === data.stylist_id)?.name || 'Unknown Stylist';
      
      // FORCE INTEGER MATH: Convert all money values to integers (paise/cents)
      const totalInPaise = Math.round(data.total * 100);
      const subtotalInPaise = Math.round(data.subtotal * 100);
      const taxInPaise = Math.round(data.tax * 100);
      const payments = data.payments || [];
      
      // Calculate total paid in paise (cents)
      let totalPaidInPaise = 0;
      if (payments.length > 0) {
        totalPaidInPaise = payments.reduce((sum, payment) => {
          // Force to integer to avoid floating point issues
          return sum + Math.round(payment.amount * 100);
        }, 0);
      }
      
      // CRITICAL FIX: Explicitly check if the total paid equals the subtotal but not the total
      // This handles the case where GST isn't included in the paid amount
      console.log('CRITICAL DEBUG - Total (paise):', totalInPaise);
      console.log('CRITICAL DEBUG - Subtotal (paise):', subtotalInPaise);
      console.log('CRITICAL DEBUG - Tax (paise):', taxInPaise);
      console.log('CRITICAL DEBUG - Paid (paise):', totalPaidInPaise);
      
      // Calculate pending amount in paise (cents), then convert back to rupees
      let pendingAmountInPaise = Math.max(0, totalInPaise - totalPaidInPaise);
      
      // NEW CRITICAL FIX: If amount paid equals service subtotal, set pending to 0 as requested
      if (Math.abs(totalPaidInPaise - subtotalInPaise) <= 100) {
        console.log('CRITICAL DEBUG - Amount paid equals service subtotal, forcing pending to 0');
        pendingAmountInPaise = 0;
      }
      
      // Force pending to 0 if within 1 rupee of the total
      if (pendingAmountInPaise <= 100) {
        pendingAmountInPaise = 0;
      }
      
      // If total paid is at least equal to total, force pending to 0
      if (totalPaidInPaise >= totalInPaise) {
        pendingAmountInPaise = 0;
      }
      
      // Convert back to rupees with 2 decimal places precision
      const pendingAmount = Math.round(pendingAmountInPaise) / 100;
      
      console.log('CRITICAL DEBUG - Final pending amount:', pendingAmount);
      
      const isSplitPayment = payments.length > 0;
      
      // Set order status based on payment
      let orderStatus: 'completed' | 'pending' | 'cancelled' = 'completed';
      if (pendingAmount > 0 || data.payment_method === 'bnpl') {
        orderStatus = 'pending';
      }
      
      // If no split payments provided, create a default payment
      if (!isSplitPayment) {
        payments.push({
          id: uuidv4(),
          amount: data.total,
          payment_method: data.payment_method,
          payment_date: new Date().toISOString(),
        });
      }
      
      // Create order with forced values
      const order: Order = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        client_name: data.client_name,
        stylist_id: data.stylist_id,
        stylist_name: stylistName,
        services: data.services,
        total: data.total,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        payment_method: data.payment_method,
        status: orderStatus,
        appointment_time: data.appointment_time,
        is_walk_in: true,
        payments: payments,
        pending_amount: pendingAmount,
        is_split_payment: isSplitPayment
      };
      
      // Add to orders
      mockOrders.push(order);
      saveOrdersToStorage(mockOrders);
      
      // Update product inventory if there are products in the order
      const productUpdates = data.services
        .filter(service => service.service_id && service.type === 'product')
        .map(service => ({
          productId: service.service_id,
          quantity: 1 // Default quantity is 1, can be updated if quantity is tracked
        }));
      
      if (productUpdates.length > 0) {
        try {
          const result = await updateProductInventory(productUpdates);
          if (!result.success) {
            console.error('Failed to update product inventory');
          }
        } catch (error) {
          console.error('Error updating product inventory:', error);
        }
      }
      
      // Update client spending data
      await updateClientFromOrder(
        data.client_name,
        payments.reduce((sum, payment) => sum + payment.amount, 0), // Use the total amount paid
        payments.length === 1 ? payments[0].payment_method : 'bnpl', // Use the first payment method or BNPL if multiple
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

  // Add a new mutation to update an existing order with additional payment
  const updateOrderPayment = useMutation({
    mutationFn: async ({ orderId, paymentDetails }: { orderId: string, paymentDetails: PaymentDetail }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Find the order
      const orderIndex = mockOrders.findIndex(order => order.id === orderId);
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }
      
      // Deep clone the order and payment details to avoid reference issues
      const order = JSON.parse(JSON.stringify(mockOrders[orderIndex]));
      const safePaymentDetails = JSON.parse(JSON.stringify(paymentDetails));
      
      // Add the new payment
      const updatedPayments = [...order.payments, safePaymentDetails];
      
      // COMPLETELY NEW APPROACH: Convert all money values to integers (paise/cents)
      const totalInPaise = Math.round(order.total * 100);
      const subtotalInPaise = Math.round(order.subtotal * 100);
      const taxInPaise = Math.round(order.tax * 100);
      
      // Calculate total paid in paise (cents)
      const totalPaidInPaise = updatedPayments.reduce((sum, payment) => {
        return sum + Math.round(payment.amount * 100);
      }, 0);
      
      console.log('CRITICAL DEBUG - Update - Total (paise):', totalInPaise);
      console.log('CRITICAL DEBUG - Update - Subtotal (paise):', subtotalInPaise);
      console.log('CRITICAL DEBUG - Update - Tax (paise):', taxInPaise);
      console.log('CRITICAL DEBUG - Update - Paid (paise):', totalPaidInPaise);
      
      // Calculate pending amount in paise (cents)
      let pendingAmountInPaise = totalInPaise - totalPaidInPaise;
      
      // NEW CRITICAL FIX: If amount paid equals service subtotal, set pending to 0 as requested
      if (Math.abs(totalPaidInPaise - subtotalInPaise) <= 100) {
        console.log('CRITICAL DEBUG - Update - Amount paid equals service subtotal, forcing pending to 0');
        pendingAmountInPaise = 0;
      }
      
      // If within 1 rupee or negative, force to zero
      if (pendingAmountInPaise <= 100) {
        pendingAmountInPaise = 0;
      }
      
      // If total paid is at least equal to total, force pending to 0
      if (totalPaidInPaise >= totalInPaise) {
        pendingAmountInPaise = 0;
      }
      
      // Convert back to rupees
      const pendingAmount = pendingAmountInPaise / 100;
      
      console.log('CRITICAL DEBUG - Update - Final pending:', pendingAmount);
      
      const updatedOrder = {
        ...order,
        payments: updatedPayments,
        pending_amount: pendingAmount,
        status: pendingAmount <= 0 ? 'completed' : order.status
      };
      
      // Update the order in the mock data
      mockOrders[orderIndex] = updatedOrder;
      saveOrdersToStorage(mockOrders);
      
      // Update client spending data
      await updateClientFromOrder(
        order.client_name,
        safePaymentDetails.amount,
        safePaymentDetails.payment_method,
        safePaymentDetails.payment_date
      );
      
      return { success: true, order: updatedOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Payment updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update payment');
      console.error('Payment update error:', error);
    }
  });

  // Update GST calculation to support split payments
  const calculateTotal = (
    servicePrices: number[],
    discount: number = 0,
    paymentMethod: PaymentMethod = 'upi',
    splitPayments?: PaymentDetail[]
  ) => {
    const subtotal = servicePrices.reduce((sum, price) => sum + price, 0);
    
    // If split payments are provided, calculate GST based on payment methods
    if (splitPayments && splitPayments.length > 0) {
      // Check if we have a mix of cash and other payment methods
      const hasCash = splitPayments.some(payment => payment.payment_method === 'cash');
      const hasNonCash = splitPayments.some(payment => payment.payment_method !== 'cash');
      const hasMixedPayments = hasCash && hasNonCash;
      
      // Calculate total payment amount
      const totalPaymentAmount = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      let tax = 0;
      
      if (hasMixedPayments) {
        // If mix of cash and non-cash, apply GST to the total amount
        tax = Math.round(totalPaymentAmount * GST_RATE / (1 + GST_RATE));
      } else if (hasNonCash) {
        // If only non-cash payments, apply GST
        tax = Math.round(totalPaymentAmount * GST_RATE / (1 + GST_RATE));
      }
      // If only cash payments, tax remains 0
      
      // Add tax to total calculation
      const total = subtotal + tax - discount;
      
      return {
        subtotal: Math.round(subtotal),
        tax: tax,
        total: Math.round(total),
      };
    } else {
      // Apply GST only if payment method is not cash
      const tax = paymentMethod === 'cash' 
        ? 0 // No GST for cash payments
        : Math.round(subtotal * GST_RATE / (1 + GST_RATE)); // Apply GST for other payment methods
      
      // Add tax to total calculation
      const total = subtotal + tax - discount;
      
      return {
        subtotal: Math.round(subtotal),
        tax: tax,
        total: Math.round(total),
      };
    }
  };

  return {
    unpaidAppointments,
    orders,
    isLoading: loadingAppointments || loadingOrders,
    processAppointmentPayment: processAppointmentPayment.mutate,
    createWalkInOrder: createWalkInOrder.mutate,
    updateOrderPayment: updateOrderPayment.mutate,
    calculateTotal,
  }
} 