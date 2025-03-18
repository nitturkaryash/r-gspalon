export interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    active: boolean;
}
export declare function useServices(): {
    services: Service[];
    isLoading: boolean;
    createService: import("@tanstack/react-query").UseMutateFunction<{
        name: string;
        active: boolean;
        duration: number;
        price: number;
        description: string;
        category: string;
        id: string;
    }, Error, Omit<Service, "id">, unknown>;
    updateService: import("@tanstack/react-query").UseMutateFunction<Service, Error, Partial<Service> & {
        id: string;
    }, unknown>;
    deleteService: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
};
