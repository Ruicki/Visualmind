/**
 * @file axiosConfig.js
 * @description Configuración centralizada de Axios para las peticiones a la API.
 * Define la URL base dinámicamente, establece timeouts y gestiona la seguridad
 * mediante interceptores de tokens JWT.
 */

import axios from 'axios';

/**
 * Instancia personalizada de Axios.
 * @const {AxiosInstance} api
 * @property {string} baseURL - Prioriza la variable de entorno VITE_API_URL sobre el localhost.
 * @property {number} timeout - 60s: el backend en Render (plan gratuito) se duerme tras 15 min
 * sin tráfico y la primera petición puede tardar ~50s en despertarlo.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api'),
    timeout: 60000,
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
