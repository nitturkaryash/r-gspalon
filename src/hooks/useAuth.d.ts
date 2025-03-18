interface AuthUser {
    id: string;
    username: string;
    role: string;
}
interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (credentials: {
        username: string;
        password: string;
    }) => Promise<void>;
    logout: () => void;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
