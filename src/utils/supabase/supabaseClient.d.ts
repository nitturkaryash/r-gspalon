export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
export declare const TABLES: {
    PURCHASES: string;
    SALES: string;
    CONSUMPTION: string;
};
export declare const handleSupabaseError: (error: any) => Error;
export declare const checkAuthentication: () => Promise<import("@supabase/auth-js").User | {
    id: string;
    email: string;
    user_metadata: {
        name: string;
    };
}>;
