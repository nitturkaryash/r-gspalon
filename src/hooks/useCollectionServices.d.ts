import type { ServiceItem } from '../models/serviceTypes';
export declare function useCollectionServices(collectionId?: string): {
    services: ServiceItem[];
    isLoading: boolean;
    createService: import("@tanstack/react-query").UseMutateFunction<{
        name: string;
        active: boolean;
        duration: number;
        collection_id: string;
        price: number;
        description: string;
        id: string;
        created_at: string;
    }, Error, Omit<ServiceItem, "id" | "created_at">, unknown>;
    updateService: import("@tanstack/react-query").UseMutateFunction<ServiceItem, Error, Partial<ServiceItem> & {
        id: string;
    }, unknown>;
    deleteService: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
    deleteServicesByCollection: (collectionId: string) => Promise<void>;
};
