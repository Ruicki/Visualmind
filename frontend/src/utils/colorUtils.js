/**
 * @file colorUtils.js
 * @description Utilities for color manipulation and contrast calculation.
 */

/**
 * Calculates the best contrast color (black or white) for a given hex background color.
 * @param {string} hex - The background color in hex format (e.g., "#ffffff").
 * @returns {string} - "#000000" for light backgrounds, "#ffffff" for dark backgrounds.
 */
export const getContrastColor = (hex) => {
    if (!hex) return '#ffffff';
    
    // Remove the hash if present
    const cleanHex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    
    // Calculate YIQ (brightness)
    // Formula: (R * 299 + G * 587 + B * 114) / 1000
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return (yiq >= 128) ? '#000000' : '#ffffff';
};
