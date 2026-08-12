import { describe, it, expect } from 'vitest';
import { getProductImage } from './imageUtils';

describe('imageUtils', () => {
  describe('getProductImage', () => {
    it('returns default placeholder when no imageUrl is provided', () => {
      const result = getProductImage(null, null);
      expect(result).toBe('https://placehold.co/800x1000?text=Visualmind');
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

    it('returns relative path for proxy mode (no VITE_API_URL in dev)', () => {
      const relativePath = 'uploads/test.jpg';
      const result = getProductImage(null, relativePath);
      expect(result).toMatch(/uploads\/test\.jpg$/);
    });

    it('handles leading slash in relative paths', () => {
      const relativePathWithSlash = '/uploads/test.jpg';
      const result = getProductImage(null, relativePathWithSlash);
      expect(result).toMatch(/uploads\/test\.jpg$/);
    });
  });
});
