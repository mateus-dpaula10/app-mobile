import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';  
import api from '../services/api';

type User = {
    id: number;
    name: string;
    email: string;
    role: 'client' | 'store' | 'delivery' | 'admin'
};

type AuthContextType = {
    user: User | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('@user');
                const token = await AsyncStorage.getItem('@token');
                if (storedUser && token) {
                    setUser(JSON.parse(storedUser));
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                }
            } catch (e) {
                console.error('Erro ao carregar usuário:', e);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (userData: User, token: string) => {
        setUser(userData);
        await AsyncStorage.setItem('@user', JSON.stringify(userData));
        await AsyncStorage.setItem('@token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('@user');
        await AsyncStorage.removeItem('@token');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}