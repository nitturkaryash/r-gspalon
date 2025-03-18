import type { Tables } from '../supabaseClient';
type TableNames = keyof Tables;
export declare function useSupabaseQuery<T extends TableNames>(tableName: T, options?: {
    select?: string;
    filter?: Record<string, any>;
    limit?: number;
}): import("@tanstack/react-query").UseQueryResult<Tables[T][], Error>;
export {};
