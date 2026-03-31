/**
 * Resuelve la URL de una imagen de producto.
 * Maneja assets locales, URLs externas y rutas del backend local.
 * @param {string} image - Ruta de imagen estática (ej. /Post/...)
 * @param {string} image_url - URL o ruta de imagen dinámica (ej. http://... o /uploads/...)
 * @returns {string} URL completa de la imagen o placeholder
 */
export const getProductImage = (image, image_url) => {
    const path = image || image_url;

    if (!path) return 'https://via.placeholder.com/400x500?text=Sin+Imagen';

    // URL completa o data URI
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Assets estáticos del frontend (carpeta /Post/)
    if (path.startsWith('/Post/') || path.startsWith('/post/')) return path;

    // Rutas de uploads del backend — con o sin slash inicial
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (normalizedPath.startsWith('/uploads/')) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        return `${baseUrl}${normalizedPath}`;
    }

    // Cualquier otra ruta relativa — asumir backend
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
