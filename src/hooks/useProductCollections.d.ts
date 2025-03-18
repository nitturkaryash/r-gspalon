import { ProductCollection } from '../models/productTypes';
export declare function useProductCollections(): {
    productCollections: ProductCollection[];
    isLoading: boolean;
    error: Error;
    getProductCollection: (id: string) => ProductCollection;
    createProductCollection: import("@tanstack/react-query").UseMutateFunction<any, Error, Omit<ProductCollection, "id">, unknown>;
    updateProductCollection: import("@tanstack/react-query").UseMutateFunction<any, Error, ProductCollection, unknown>;
    deleteProductCollection: import("@tanstack/react-query").UseMutateFunction<string, Error, string, unknown>;
};
