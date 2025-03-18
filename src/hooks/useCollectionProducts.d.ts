import { ProductItem } from '../models/productTypes';
export declare function useCollectionProducts(collectionId: string): {
    products: ProductItem[];
    isLoading: boolean;
    error: Error;
    createProduct: import("@tanstack/react-query").UseMutateFunction<any, Error, Omit<ProductItem, "id">, unknown>;
    updateProduct: import("@tanstack/react-query").UseMutateFunction<any, Error, ProductItem, unknown>;
    deleteProduct: import("@tanstack/react-query").UseMutateFunction<string, Error, string, unknown>;
};
