import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    // Opcional: Podríamos tener un endpoint /api/auth/me para verificar el token
                    // Por ahora confiamos en el localStorage si hay token
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Error al parsear usuario guardado:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const signUp = async (email, password) => {
        try {
            const response = await api.post('/auth/register', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { data: { user }, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    };

    const signIn = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { data: { session: { user }, user }, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    };

    const signOut = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        return { error: null };
    };

    const value = {
        signUp,
        signIn,
        signOut,
        user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
