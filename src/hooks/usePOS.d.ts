export declare const PAYMENT_METHODS: readonly ["cash", "credit_card", "debit_card", "upi", "bnpl"];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export declare const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string>;
export interface PaymentDetail {
    id: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    payment_note?: string;
}
interface CreateOrderData {
    appointment_id?: string;
    client_name: string;
    stylist_id: string;
    services: Array<{
        service_id: string;
        service_name: string;
        price: number;
        type?: 'service' | 'product';
    }>;
    total: number;
    payment_method: PaymentMethod;
    subtotal: number;
    tax: number;
    discount: number;
    appointment_time?: string;
    is_walk_in: boolean;
    payments?: PaymentDetail[];
    pending_amount?: number;
}
export interface Order {
    id: string;
    created_at: string;
    client_name: string;
    stylist_id: string;
    stylist_name: string;
    services: Array<{
        service_id: string;
        service_name: string;
        price: number;
        type?: 'service' | 'product';
    }>;
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    payment_method: PaymentMethod;
    status: 'completed' | 'pending' | 'cancelled';
    appointment_time?: string;
    appointment_id?: string;
    is_walk_in: boolean;
    payments: PaymentDetail[];
    pending_amount: number;
    is_split_payment: boolean;
}
export declare function usePOS(): {
    unpaidAppointments: {
        id: string;
        client_id: string;
        stylist_id: string;
        service_id: string;
        start_time: string;
        end_time: string;
        status: string;
        paid: boolean;
        clients: {
            full_name: string;
        };
        services: {
            name: string;
            price: number;
        };
        stylists: {
            name: string;
        };
    }[];
    orders: Order[];
    isLoading: boolean;
    processAppointmentPayment: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
        order: Order;
    }, Error, CreateOrderData, unknown>;
    createWalkInOrder: import("@tanstack/react-query").UseMutateFunction<Order, Error, CreateOrderData, unknown>;
    updateOrderPayment: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
        order: any;
    }, Error, {
        orderId: string;
        paymentDetails: PaymentDetail;
    }, unknown>;
    calculateTotal: (servicePrices: number[], discount?: number, paymentMethod?: PaymentMethod, splitPayments?: PaymentDetail[]) => {
        subtotal: number;
        tax: number;
        total: number;
    };
    inventoryProducts: any;
};
export {};
