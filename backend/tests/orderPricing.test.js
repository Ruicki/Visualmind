import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeTotals, getPricingConfig, unitPrice, findVariant, normalizeCartItems, colorName
} from '../services/orderPricing.js';

describe('computeTotals', () => {
  const free = { shippingCost: 0, freeShippingThreshold: 0, taxRate: 0.07 };

  it('por defecto el envío es gratis para todos', () => {
    expect(computeTotals(20, free)).toEqual({ subtotal: 20, shipping: 0, tax: 1.4, total: 21.4 });
  });

  it('con costo configurado cobra envío, y lo regala al superar el umbral', () => {
    const paid = { shippingCost: 5, freeShippingThreshold: 50, taxRate: 0.07 };
    expect(computeTotals(50, paid)).toEqual({ subtotal: 50, shipping: 5, tax: 3.5, total: 58.5 });
    expect(computeTotals(50.01, paid).shipping).toBe(0);
    expect(computeTotals(500, { ...paid, freeShippingThreshold: 0 }).shipping).toBe(5);
  });

  it('total = subtotal + envío + impuesto, siempre con 2 decimales', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 10_000_000 }),
      fc.integer({ min: 0, max: 5000 }),
      (cents, shipCents) => {
        const t = computeTotals(cents / 100, { shippingCost: shipCents / 100, freeShippingThreshold: 0, taxRate: 0.07 });
        expect(Math.round((t.subtotal + t.shipping + t.tax) * 100)).toBe(Math.round(t.total * 100));
        expect(Math.round(t.total * 100) / 100).toBe(t.total);
      }
    ));
  });
});

describe('getPricingConfig', () => {
  it('lee las variables de entorno e ignora valores inválidos', () => {
    const backup = { ...process.env };
    delete process.env.SHIPPING_COST; delete process.env.FREE_SHIPPING_THRESHOLD; delete process.env.TAX_RATE;
    expect(getPricingConfig()).toEqual({ shippingCost: 0, freeShippingThreshold: 0, taxRate: 0.07 });
    process.env.SHIPPING_COST = '3.5'; process.env.TAX_RATE = 'abc';
    expect(getPricingConfig()).toEqual({ shippingCost: 3.5, freeShippingThreshold: 0, taxRate: 0.07 });
    process.env = backup;
  });
});

describe('unitPrice', () => {
  it('usa el precio publicado sin descuentos automáticos por estado', () => {
    expect(unitPrice({ price: '20.00', lifecycle_state: 'Published' })).toBe(20);
    expect(unitPrice({ price: '20.00', lifecycle_state: 'Legacy' })).toBe(20);
    expect(unitPrice({ price: '20.00', lifecycle_state: 'legacy' })).toBe(20);
  });
});

describe('findVariant', () => {
  const variants = [
    { id: 'a', size: 'M', color: 'Rojo', stock: 0 },
    { id: 'b', size: 'M', color: 'Azul', stock: 3 },
    { id: 'c', size: 'L', color: null, stock: 1 },
  ];

  it('usa talla+color exactos cuando hay color', () => {
    expect(findVariant(variants, 'M', 'rojo').id).toBe('a');
  });

  it('sin color elige la variante de esa talla con más stock', () => {
    expect(findVariant(variants, 'M', null).id).toBe('b');
  });

  it('acepta variantes sin color para cualquier color pedido', () => {
    expect(findVariant(variants, 'L', 'Negro').id).toBe('c');
  });

  it('devuelve null si no hay coincidencia o no hay variantes', () => {
    expect(findVariant(variants, 'XS', null)).toBeNull();
    expect(findVariant([], 'M', null)).toBeNull();
  });
});

describe('normalizeCartItems', () => {
  it('agrupa líneas repetidas del mismo producto/talla/color', () => {
    const lines = normalizeCartItems([
      { product_id: 'p1', size: 'M', color: { name: 'Rojo' }, quantity: 1 },
      { product_id: 'p1', size: 'M', color: 'Rojo', quantity: 2 },
    ]);
    expect(lines).toEqual([{ product_id: 'p1', size: 'M', color: 'Rojo', quantity: 3 }]);
  });

  it('rechaza carritos vacíos y cantidades inválidas', () => {
    expect(() => normalizeCartItems([])).toThrow();
    expect(() => normalizeCartItems([{ product_id: 'p1', quantity: 0 }])).toThrow();
    expect(() => normalizeCartItems([{ product_id: 'p1', quantity: 1.5 }])).toThrow();
    expect(() => normalizeCartItems([{ quantity: 1 }])).toThrow();
  });

  it('colorName acepta string u objeto', () => {
    expect(colorName('Azul')).toBe('Azul');
    expect(colorName({ name: 'Azul' })).toBe('Azul');
    expect(colorName(null)).toBeNull();
  });
});
