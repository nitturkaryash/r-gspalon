export interface Client {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    created_at: string;
    total_spent: number;
    pending_payment: number;
    last_visit: string | null;
    notes: string;
}
export declare function useClients(): {
    clients: Client[];
    isLoading: boolean;
    createClient: import("@tanstack/react-query").UseMutateFunction<Client, Error, Omit<Client, "id" | "created_at" | "total_spent" | "pending_payment" | "last_visit">, unknown>;
    updateClient: import("@tanstack/react-query").UseMutateFunction<Client, Error, Partial<Client> & {
        id: string;
    }, unknown>;
    updateClientFromOrder: (clientName: string, orderTotal: number, paymentMethod: string, orderDate: string) => Promise<Client>;
    processPendingPayment: import("@tanstack/react-query").UseMutateFunction<Client, Error, {
        clientId: string;
        amount: number;
    }, unknown>;
};
