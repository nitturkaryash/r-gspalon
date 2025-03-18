export interface ProductWithExtras {
    id: string;
    name: string;
    hsn_code: string;
    units: string;
    collection_id?: string;
    price?: number;
    cost?: number;
    stock?: number;
    status?: 'active' | 'inactive';
    created_at?: string;
}
export declare const updateProductInventory: (updates: Array<{
    productId: string;
    quantity: number;
}>) => Promise<{
    success: boolean;
    message?: string;
}>;
export declare const useProducts: () => {
    loading: boolean;
    error: string;
    fetchProducts: () => Promise<ProductWithExtras[]>;
    fetchProduct: (id: string) => Promise<ProductWithExtras | null>;
    createProduct: (product: Omit<ProductWithExtras, "id" | "created_at">) => Promise<ProductWithExtras>;
    updateProduct: (product: ProductWithExtras) => Promise<ProductWithExtras>;
    deleteProduct: (id: string) => Promise<void>;
    updateStock: (update: {
        productId: string;
        quantity: number;
        type: "add" | "remove";
    }) => Promise<ProductWithExtras>;
    updateProductInventory: (updates: Array<{
        productId: string;
        quantity: number;
    }>) => Promise<{
        success: boolean;
        message?: string;
    }>;
    fetchProductsByCollection: (collectionId: string) => Promise<ProductWithExtras[]>;
    searchProducts: (query: string) => Promise<ProductWithExtras[]>;
    deleteProductsByCollection: (collectionId: string) => Promise<void>;
};
