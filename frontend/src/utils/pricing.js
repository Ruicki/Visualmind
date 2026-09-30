/**
 * @file pricing.js
 * @description Cálculo de envío y total para mostrar en carrito y checkout (sin ITBMS).
 * La configuración viene del servidor (GET /orders/pricing), que es quien cobra;
 * esta fórmula replica backend/services/orderPricing.js → computeTotals.
 */
import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

// Valores por defecto mientras carga (coinciden con los del servidor)
export const DEFAULT_PRICING = { shippingCost: 0, freeShippingThreshold: 0 };

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeTotals(subtotal, config = DEFAULT_PRICING) {
  const sub = round2(subtotal);
  const freeByThreshold = config.freeShippingThreshold > 0 && sub > config.freeShippingThreshold;
  const shipping = freeByThreshold ? 0 : round2(config.shippingCost);
  return { subtotal: sub, shipping, total: round2(sub + shipping) };
}

let pricingPromise = null;

/** Hook: configuración de precios del servidor (una sola petición por sesión). */
export function usePricingConfig() {
  const [config, setConfig] = useState(DEFAULT_PRICING);

  useEffect(() => {
    let active = true;
    if (!pricingPromise) {
      pricingPromise = api.get('/orders/pricing')
        .then(res => ({ ...DEFAULT_PRICING, ...res.data }))
        .catch(() => { pricingPromise = null; return DEFAULT_PRICING; });
    }
    pricingPromise.then(c => { if (active) setConfig(c); });
    return () => { active = false; };
  }, []);

  return config;
}
