/**
 * @file storefront.js
 * @description Utilidades para enlazar la tienda pública desde el backend: vistas previas
 * al compartir un producto (Open Graph) y el catálogo para Meta (Instagram/Facebook) y Google.
 */

import { frontendUrl } from '../controllers/authController.js';

/** Escapa texto para insertarlo en HTML. */
export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Origen público del backend (API_PUBLIC_URL o el de la petición). */
export const apiOrigin = (req) =>
  (process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

/**
 * URL absoluta de una imagen de producto.
 * - http(s): se deja igual
 * - /uploads/...: la sirve el backend
 * - otras rutas (/Post/...): están en el frontend
 */
export function absoluteImageUrl(url, req) {
  if (!url) return `${frontendUrl()}/og-image.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  const base = path.startsWith('/uploads/') ? apiOrigin(req) : frontendUrl();
  return base + encodeURI(path);
}

export const productUrl = (id) => `${frontendUrl()}/product/${encodeURIComponent(id)}`;

const plain = (text, max) => {
  const clean = String(text ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

/** Página mínima con metadatos para vistas previas; las personas son redirigidas a la ficha. */
export function renderSharePage(product, req) {
  const url = productUrl(product.id);
  const price = `$${Number(product.price).toFixed(2)}`;
  const title = `${product.title} · ${price} | Visualmind`;
  const description = plain(product.description, 180) || 'Camisetas de anime y cultura pop, diseñadas en Panamá.';
  const image = absoluteImageUrl(product.image_url, req);
  const t = escapeHtml(title), d = escapeHtml(description), i = escapeHtml(image), u = escapeHtml(url);
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Visualmind">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta property="og:url" content="${u}">
<meta property="product:price:amount" content="${Number(product.price).toFixed(2)}">
<meta property="product:price:currency" content="USD">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<link rel="canonical" href="${u}">
<meta http-equiv="refresh" content="0; url=${u}">
</head><body>
<p><a href="${u}">Ver ${escapeHtml(product.title)} en Visualmind</a></p>
<script>location.replace(${JSON.stringify(url)});</script>
</body></html>`;
}

/** Filas del catálogo (formato de feed de Meta Commerce / Google Merchant). */
export function catalogRows(products, req) {
  return products.map(p => [
    p.id,
    plain(p.title, 150),
    plain(p.description, 5000) || plain(p.title, 150),
    Number(p.stock) > 0 ? 'in stock' : 'out of stock',
    'new',
    `${Number(p.price).toFixed(2)} USD`,
    productUrl(p.id),
    absoluteImageUrl(p.image_url, req),
    'Visualmind',
    p.category || '',
  ]);
}

export const CATALOG_HEADERS = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'product_type'];
