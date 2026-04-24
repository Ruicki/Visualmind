import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload.
 * @param {File} file - The original image file.
 * @param {Object} options - Custom compression options.
 * @returns {Promise<File>} - The compressed file.
 */
export const compressImage = async (file, options = {}) => {
  if (!file) return null;

  const defaultOptions = {
    maxSizeMB: 0.8, // Max size 800KB
    maxWidthOrHeight: 1200, // Max dimension
    useWebWorker: true,
    initialQuality: 0.8,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
    const compressedFile = await imageCompression(file, finalOptions);
    console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
    
    // Maintain the original name
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Fallback to original
  }
};

/**
 * Normalizes product image URLs.
 * @param {string|number} productId - Optional ID.
 * @param {string} imageUrl - The URL or path from DB.
 * @returns {string} - Full URL.
 */
export const getProductImage = (productId, imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/800x1000?text=Visualmind';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Remove leading slash if present
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  return `${apiBase}/${cleanPath}`;
};
