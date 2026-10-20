/**
 * @file share.js
 * @description Enlaces para compartir productos. El enlace apunta a /share/p/:id del backend,
 * que entrega la foto, el nombre y el precio a WhatsApp/Facebook/Instagram y luego
 * redirige a la ficha del producto en la tienda.
 */

/** Origen del backend: VITE_API_URL sin el sufijo /api (en desarrollo, el propio sitio vía proxy). */
export function apiOrigin() {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && /^https?:\/\//.test(apiUrl)) return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return typeof window !== 'undefined' ? window.location.origin : '';
}

export const productShareUrl = (id) => `${apiOrigin()}/share/p/${encodeURIComponent(id)}`;

export const whatsappShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const facebookShareLink = (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
