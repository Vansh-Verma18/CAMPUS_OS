import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';

export interface User {
    _id: string;
    email: string;
    username: string;
    role: string;
    display_name: string;
    department_id?: string;
    club_id?: string;
    account_status: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetchWithAuth('/auth/me');
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error("Failed to fetch user", err);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
