/**
 * @file orderPricing.js
 * @description Reglas de precio del checkout, calculadas SIEMPRE en el servidor.
 * El frontend obtiene la misma configuración vía GET /api/orders/pricing, así que
 * el total mostrado y el cobrado salen de aquí.
 *
 * Configurable por variables de entorno (sin tocar código):
 * - SHIPPING_COST (por defecto 0 → envío gratis para todos)
 * - FREE_SHIPPING_THRESHOLD (por defecto 0 → sin umbral; si es > 0, el envío es gratis
 *   cuando el subtotal lo supera)
 * - TAX_RATE (por defecto 0.07 → ITBMS de Panamá)
 */

export const PAYMENT_METHODS = ['yappy', 'transfer', 'cash_on_delivery'];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const envNumber = (name, fallback) => {
  const value = parseFloat(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

/** Configuración de precios vigente (se lee en cada llamada para respetar cambios de env). */
export function getPricingConfig() {
  return {
    shippingCost: envNumber('SHIPPING_COST', 0),
    freeShippingThreshold: envNumber('FREE_SHIPPING_THRESHOLD', 0),
    taxRate: envNumber('TAX_RATE', 0.07),
  };
}

/** Precio unitario real de un producto (el precio publicado, sin descuentos automáticos). */
export function unitPrice(product) {
  return round2(parseFloat(product.price) || 0);
}

/** Desglose del pedido a partir del subtotal. */
export function computeTotals(subtotal, config = getPricingConfig()) {
  const sub = round2(subtotal);
  const freeByThreshold = config.freeShippingThreshold > 0 && sub > config.freeShippingThreshold;
  const shipping = freeByThreshold ? 0 : round2(config.shippingCost);
  const tax = round2(sub * config.taxRate);
  return { subtotal: sub, shipping, tax, total: round2(sub + shipping + tax) };
}

/** Normaliza el color que llega del carrito (puede ser string u objeto {name}). */
export function colorName(color) {
  if (!color) return null;
  if (typeof color === 'string') return color;
  return color.name || null;
}

/**
 * Elige la variante que corresponde a la talla/color pedidos.
 * - Con color: busca talla+color exactos.
 * - Sin color (la tienda suma el stock por talla): toma la variante de esa talla con más stock.
 * Devuelve null si el producto no tiene variantes o ninguna coincide.
 */
export function findVariant(variants, size, color) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const norm = (v) => (v == null ? '' : String(v).trim().toLowerCase());
  const s = norm(size);
  const c = norm(color);
  const bySize = variants.filter(v => norm(v.size) === s);
  const candidates = c ? bySize.filter(v => norm(v.color) === c || !v.color) : bySize;
  if (candidates.length === 0) return null;
  const exact = c ? candidates.filter(v => norm(v.color) === c) : [];
  const pool = exact.length ? exact : candidates;
  return pool.reduce((best, v) => ((parseInt(v.stock) || 0) > (parseInt(best.stock) || 0) ? v : best));
}

/**
 * Agrupa las líneas del carrito por (producto, talla, color) y valida cantidades.
 * @returns {Array<{product_id, size, color, quantity}>}
 * @throws {Error} con .status = 400 si alguna línea es inválida
 */
export function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('El pedido debe tener al menos un artículo'), { status: 400 });
  }
  const map = new Map();
  for (const raw of items) {
    const quantity = Number(raw?.quantity);
    if (!raw?.product_id || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw Object.assign(new Error('Artículo inválido en el carrito'), { status: 400 });
    }
    const size = raw.size ?? null;
    const color = colorName(raw.color);
    const key = `${raw.product_id}|${size}|${color}`;
    const prev = map.get(key);
    map.set(key, { product_id: String(raw.product_id), size, color, quantity: (prev?.quantity || 0) + quantity });
  }
  return [...map.values()];
}
