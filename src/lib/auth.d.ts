import { ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    signIn: (email: string, password: string) => Promise<{
        error: AuthError | null;
    }>;
    signUp: (email: string, password: string) => Promise<{
        error: AuthError | null;
    }>;
    signOut: () => Promise<{
        error: AuthError | null;
    }>;
}
interface AuthProviderProps {
    children: ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export declare function signInWithEmail(email: string, password: string): Promise<{
    data: {
        user: User;
        session: Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    } | {
        user: null;
        session: null;
        weakPassword?: null;
    };
    error: any;
} | {
    data: any;
    error: any;
}>;
export declare function signUpWithEmail(email: string, password: string): Promise<{
    data: {
        user: User | null;
        session: Session | null;
    } | {
        user: null;
        session: null;
    };
    error: any;
} | {
    data: any;
    error: any;
}>;
export declare function signOutUser(): Promise<{
    error: any;
}>;
export declare function getSession(): Promise<{
    session: Session;
    error: any;
} | {
    session: any;
    error: any;
}>;
export declare function subscribeToAuthChanges(callback: (event: any, session: any) => void): {
    data: {
        subscription: import("@supabase/auth-js").Subscription;
    };
};
export {};
