import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';  

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
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
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
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('@user');
        await AsyncStorage.removeItem('@token');
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