/**
 * Contexto de Autenticación.
 * Centraliza la lógica de inicio de sesión, registro, cierre de sesión
 * y validación de tokens JWT para proteger las rutas del frontend.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

/**
 * Hook personalizado para acceder al contexto de autenticación.
 */
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Datos del usuario actual
    const [loading, setLoading] = useState(true); // Estado de carga inicial de la sesión

    /** 
     * Verifica si un JWT (formato header.payload.sig) no ha expirado.
     * Decodifica el payload sin verificar la firma (la firma se valida en el backend).
     * @param {string} token 
     * @returns {boolean} True si el token es válido y no ha expirado.
     */
    const isTokenValid = (token) => {
        try {
            const payloadB64 = token.split('.')[1];
            // Conversión de base64url a base64 estándar para atob()
            const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(padded));
            // 'exp' está en segundos, Date.now() en milisegundos
            return payload.exp > Math.floor(Date.now() / 1000);
        } catch {
            return false;
        }
    };

    /**
     * Efecto de inicialización: Recupera la sesión persistida en localStorage al cargar la app.
     */
    useEffect(() => {
        const checkAuth = () => {
            console.log('[AuthContext] Verificando sesión persistida...');
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                // Validar expiración antes de restaurar el estado del usuario
                if (!isTokenValid(token)) {
                    console.warn('[AuthContext] Token expirado — Limpiando sesión.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (err) {
                    console.error('[AuthContext] Error al parsear usuario guardado:', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    /**
     * Registra un nuevo usuario en la plataforma.
     * @param {string} email 
     * @param {string} password 
     */
    const signUp = async (email, password) => {
        try {
            const response = await api.post('/auth/register', { email, password });
            const { token, user } = response.data;
            
            // Persistencia en almacenamiento local
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { data: { user }, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    };

    /**
     * Inicia sesión con credenciales existentes.
     * @param {string} email 
     * @param {string} password 
     */
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

    /**
     * Elimina el estado de la sesión y limpia el almacenamiento local.
     */
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
