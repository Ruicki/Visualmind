import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /** Verifica si un JWT (formato header.payload.sig) no ha expirado */
    const isTokenValid = (token) => {
        try {
            const payloadB64 = token.split('.')[1];
            // base64url → base64 estándar
            const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(padded));
            // exp es en segundos, Date.now() en ms
            return payload.exp > Math.floor(Date.now() / 1000);
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                // Validar expiración antes de confiar en el token
                if (!isTokenValid(token)) {
                    console.warn('[AuthContext] Token expirado — cerrando sesión.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
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
