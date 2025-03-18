import React, { ReactNode } from 'react';
type AuthContextType = {
    user: any | null;
    session: any | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
};
export declare const AuthProvider: React.FC<{
    children: ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export {};
