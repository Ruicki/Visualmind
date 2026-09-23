/**
 * @file axiosConfig.js
 * @description Configuración centralizada de Axios para las peticiones a la API.
 * Define la URL base dinámicamente, establece timeouts y gestiona la seguridad
 * mediante interceptores de tokens JWT.
 */

import axios from 'axios';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    // Sin esta variable el sitio publicado intenta hablar con localhost y se ve sin datos.
    console.error('[API] Falta VITE_API_URL en el build de producción (Vercel → Settings → Environment Variables).');
}

/**
 * Instancia personalizada de Axios.
 * @const {AxiosInstance} api
 * @property {string} baseURL - Prioriza la variable de entorno VITE_API_URL sobre el localhost.
 * @property {number} timeout - Tiempo máximo de espera de 5 segundos para evitar cuelgues.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api'),
    timeout: 10000, // Aumentado a 10s para conexiones lentas
});

/**
 * Interceptor de Solicitudes.
 * Se ejecuta antes de cada petición saliente para:
 * 1. Recuperar el token JWT del LocalStorage.
 * 2. Inyectarlo en el header 'Authorization' siguiendo el esquema Bearer.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    /**
     * Gestión de errores en la fase de solicitud.
     */
    return Promise.reject(error);
});

export default api;
