import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, subscribeToAuthChanges } from '../lib/auth';
const AuthContext = createContext({
    session: null,
    isLoading: true,
});
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        // Get initial session
        getSession().then(({ session }) => {
            setSession(session);
            setIsLoading(false);
        });
        // Subscribe to auth changes
        const { data: { subscription } } = subscribeToAuthChanges((event, session) => {
            setSession(session);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    return (_jsx(AuthContext.Provider, { value: { session, isLoading }, children: children }));
}
export function useAuth() {
    return useContext(AuthContext);
}
