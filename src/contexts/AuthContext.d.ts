import { ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
interface AuthContextType {
    session: Session | null;
    isLoading: boolean;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
