import type { ServiceCollection } from '../models/serviceTypes';
export declare function useServiceCollections(): {
    serviceCollections: ServiceCollection[];
    isLoading: boolean;
    getServiceCollection: (id: string) => ServiceCollection;
    createServiceCollection: import("@tanstack/react-query").UseMutateFunction<{
        name: string;
        description: string;
        id: string;
        created_at: string;
    }, Error, Omit<ServiceCollection, "id" | "created_at">, unknown>;
    updateServiceCollection: import("@tanstack/react-query").UseMutateFunction<ServiceCollection, Error, Partial<ServiceCollection> & {
        id: string;
    }, unknown>;
    deleteServiceCollection: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
};
