import React, { createContext, useState, useEffect, useContext } from 'react';

// Типи для контексту авторизації
interface AuthContextType {
    token: string | null;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

// Початкове значення контексту
const AuthContext = createContext<AuthContextType | null>(null);

// Хук для доступу до контексту
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Провайдер для авторизації
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);

    // Завантаження токенів із localStorage при завантаженні сторінки
    useEffect(() => {
        const savedAccessToken = localStorage.getItem('accessToken');
        if (savedAccessToken) {
            setToken(savedAccessToken);
        }
    }, []);

    // Логін: зберігаємо обидва токени
    const login = (accessToken: string, refreshToken: string) => {
        setToken(accessToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    };

    // Логаут: видаляємо токени
    const logout = () => {
        setToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
