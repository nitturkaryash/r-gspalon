import { usePOS } from './usePOS';
export function useOrders() {
    const { orders, isLoading } = usePOS();
    // Sort orders by creation date (newest first)
    const sortedOrders = orders ? [...orders].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }) : [];
    return {
        orders: sortedOrders,
        isLoading,
    };
}
