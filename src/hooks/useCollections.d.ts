import type { Collection } from '../models/inventoryTypes';
export declare function useCollections(): {
    collections: Collection[];
    isLoading: boolean;
    getCollection: (id: string) => Collection;
    createCollection: import("@tanstack/react-query").UseMutateFunction<{
        name: string;
        description: string;
        id: string;
        created_at: string;
    }, Error, Omit<Collection, "id" | "created_at">, unknown>;
    updateCollection: import("@tanstack/react-query").UseMutateFunction<Collection, Error, Partial<Collection> & {
        id: string;
    }, unknown>;
    deleteCollection: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
};
