import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';
// Create the auth context
const AuthContext = createContext(undefined);
// Constants for auth storage
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
// Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Initialize auth state from localStorage
    React.useEffect(() => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const savedUser = localStorage.getItem(AUTH_USER_KEY);
        if (token && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setSession({ token });
            }
            catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);
    // Function to refresh the session (development mode stub)
    const refreshSession = async () => {
        console.log('DEV MODE: Refreshing session (no-op)');
        // In development mode, just ensure we have a user
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const savedUser = localStorage.getItem(AUTH_USER_KEY);
        if (!token || !savedUser) {
            // If no user, create one
            const dummyUser = {
                id: 'dev-user-id',
                username: 'admin',
                role: 'admin',
            };
            localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token-' + Date.now());
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dummyUser));
            setUser(dummyUser);
            setSession({ token: 'dummy-token-' + Date.now() });
            toast.info('Development mode: Session refreshed');
        }
        return Promise.resolve();
    };
    // Function to sign out
    const signOut = async () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
        setSession(null);
        window.location.href = '/login';
    };
    // Provide the auth context value
    const value = {
        user,
        session,
        isLoading,
        signOut,
        refreshSession,
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
