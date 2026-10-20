import api from './axiosConfig';

/**
 * Descarga un archivo de la API con la sesión actual (p. ej. un CSV del admin).
 * @param {string} url - Ruta relativa a la API
 * @param {string} filename - Nombre sugerido para el archivo
 * @param {object} [params] - Parámetros de la URL
 */
export async function downloadFromApi(url, filename, params) {
    const response = await api.get(url, { params, responseType: 'blob' });
    const href = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
}
