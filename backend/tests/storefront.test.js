import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { escapeHtml, absoluteImageUrl, renderSharePage, catalogRows, CATALOG_HEADERS } from '../services/storefront.js';

const req = { protocol: 'https', get: () => 'api.visualmind.test' };

describe('storefront', () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://tienda.visualmind.test/';
    delete process.env.API_PUBLIC_URL;
  });

  it('arma URLs absolutas de imágenes según dónde viven', () => {
    expect(absoluteImageUrl('/uploads/products/a.png', req)).toBe('https://api.visualmind.test/uploads/products/a.png');
    expect(absoluteImageUrl('/Post/One pice/Luffy.webp', req)).toBe('https://tienda.visualmind.test/Post/One%20pice/Luffy.webp');
    expect(absoluteImageUrl('https://cdn.x/y.jpg', req)).toBe('https://cdn.x/y.jpg');
    expect(absoluteImageUrl(null, req)).toBe('https://tienda.visualmind.test/og-image.jpg');
  });

  it('la vista previa lleva título, precio, imagen y redirige a la ficha', () => {
    const html = renderSharePage({ id: 'p1', title: 'Camiseta Gojo', price: '24.9', description: '<b>Algodón</b>', image_url: '/Post/a.webp' }, req);
    expect(html).toContain('<meta property="og:title" content="Camiseta Gojo · $24.90 | Visualmind">');
    expect(html).toContain('content="Algodón"');
    expect(html).toContain('https://tienda.visualmind.test/Post/a.webp');
    expect(html).toContain('url=https://tienda.visualmind.test/product/p1');
  });

  it('ningún texto del producto puede inyectar HTML en la vista previa (propiedad)', () => {
    const count = (html) => (html.slice(0, html.indexOf('<script>')).match(/</g) || []).length;
    const baseline = count(renderSharePage({ id: 'p1', title: 'A', description: 'B', price: 10, image_url: null }, req));
    fc.assert(fc.property(fc.string(), fc.string(), (title, description) => {
      const html = renderSharePage({ id: 'p1', title, description, price: 10, image_url: null }, req);
      expect(count(html)).toBe(baseline);
      expect(escapeHtml(title)).not.toMatch(/[<>"']/);
    }));
  });

  it('el catálogo tiene una fila por producto con el formato de Meta/Google', () => {
    const rows = catalogRows([{ id: 'p1', title: 'Camiseta', description: '', price: 22, stock: 0, image_url: '/uploads/x.png', category: 'Anime' }], req);
    expect(rows[0]).toHaveLength(CATALOG_HEADERS.length);
    expect(rows[0][3]).toBe('out of stock');
    expect(rows[0][5]).toBe('22.00 USD');
    expect(rows[0][6]).toBe('https://tienda.visualmind.test/product/p1');
  });
});
