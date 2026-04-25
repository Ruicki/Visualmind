import { describe, it, expect } from 'vitest';
import { getProductImage } from './imageUtils';

describe('imageUtils', () => {
  describe('getProductImage', () => {
    it('returns default placeholder when no imageUrl is provided', () => {
      const result = getProductImage(null, null);
      expect(result).toBe('https://via.placeholder.com/800x1000?text=Visualmind');
    });

    it('returns the same url when it starts with http', () => {
      const url = 'https://example.com/image.jpg';
      const result = getProductImage(null, url);
      expect(result).toBe(url);
    });

    it('returns the same url when it starts with data:', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const result = getProductImage(null, url);
      expect(result).toBe(url);
    });

    it('returns full url based on VITE_API_URL or fallback localhost for relative paths', () => {
      const relativePath = 'uploads/test.jpg';
      const result = getProductImage(null, relativePath);
      expect(result).toMatch(/\/uploads\/test\.jpg$/);
      // It should include the base API URL (e.g., http://localhost:5000/api/uploads/test.jpg)
      expect(result.startsWith('http://localhost:5000/api/')).toBe(true);
    });

    it('removes leading slash from relative paths', () => {
      const relativePathWithSlash = '/uploads/test.jpg';
      const result = getProductImage(null, relativePathWithSlash);
      expect(result).toMatch(/\/uploads\/test\.jpg$/);
      expect(result.startsWith('http://localhost:5000/api/')).toBe(true);
      expect(result).toBe('http://localhost:5000/api/uploads/test.jpg');
    });
  });
});
