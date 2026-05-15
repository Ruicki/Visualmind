/**
 * Utilidades de Gestión de Imágenes.
 * Incluye lógica para compresión de archivos antes de la subida
 * y normalización de URLs para visualización en el frontend.
 */
import imageCompression from 'browser-image-compression';

/**
 * Comprime un archivo de imagen utilizando Web Workers.
 * Optimiza el tamaño del archivo sin sacrificar demasiada calidad visual.
 * @param {File} file - El archivo de imagen original de un input.
 * @param {Object} options - Opciones de compresión personalizadas.
 * @returns {Promise<File>} - El archivo comprimido listo para subir.
 */
export const compressImage = async (file, options = {}) => {
  if (!file) return null;

  const defaultOptions = {
    maxSizeMB: 0.8,          // Tamaño máximo deseado (800KB)
    maxWidthOrHeight: 1200,  // Dimensión máxima para evitar imágenes excesivas
    useWebWorker: true,
    initialQuality: 0.8,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    console.log(`[ImageUtils] Comprimiendo: ${file.size / 1024 / 1024} MB...`);
    const compressedFile = await imageCompression(file, finalOptions);
    console.log(`[ImageUtils] Resultado: ${compressedFile.size / 1024 / 1024} MB`);
    
    // Mantenemos el nombre original para consistencia en la BD
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('[ImageUtils] Error en compresión:', error);
    return file; // Retornamos el original como fail-safe
  }
};

/**
 * Normaliza la URL de una imagen del producto.
 * Gestiona rutas locales del servidor y URLs externas de placeholders.
 * @param {string|number} productId - ID opcional (para futura lógica de caché).
 * @param {string} imageUrl - La ruta guardada en la base de datos.
 * @returns {string} - URL completa y válida para el atributo src.
 */
export const getProductImage = (productId, imageUrl) => {
  // Placeholder si no hay imagen
  if (!imageUrl) return 'https://placehold.co/800x1000?text=Visualmind';
  
  // Si ya es una URL completa o un DataURL, se retorna tal cual
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  
  // Construcción de la URL del backend
  // En desarrollo sin VITE_API_URL, usamos rutas relativas para activar el Proxy de Vite
  const apiBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
    : (import.meta.env.DEV ? '' : 'http://localhost:5000');
  
  // Aseguramos que no haya doble diagonal al concatenar
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  
  // Si apiBase está vacío (modo proxy), solo devolvemos /path
  return apiBase ? `${apiBase}/${cleanPath}` : `/${cleanPath}`;
};
