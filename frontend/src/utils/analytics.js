/**
 * @file analytics.js
 * @description Píxel de Meta (Facebook/Instagram Ads). Se activa solo si existe
 * VITE_META_PIXEL_ID; sin esa variable todas las funciones no hacen nada.
 * Eventos estándar: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
let initialized = false;

function init() {
    if (initialized || !PIXEL_ID || typeof window === 'undefined') return initialized;
    /* Fragmento oficial de Meta, sin cambios de comportamiento */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    initialized = true;
    return true;
}

export function track(event, params) {
    if (!init()) return;
    try {
        window.fbq('track', event, params);
    } catch {
        // La analítica nunca debe romper la tienda
    }
}

export const trackPageView = () => track('PageView');

export const trackViewContent = (product) => product && track('ViewContent', {
    content_ids: [product.id], content_type: 'product', content_name: product.title,
    value: Number(product.price) || 0, currency: 'USD'
});

export const trackAddToCart = (product, quantity = 1) => product && track('AddToCart', {
    content_ids: [product.id], content_type: 'product', content_name: product.title,
    value: (Number(product.price) || 0) * quantity, currency: 'USD'
});

export const trackInitiateCheckout = (items, total) => track('InitiateCheckout', {
    content_ids: items.map(i => i.id), num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
    value: Number(total) || 0, currency: 'USD'
});

export const trackPurchase = (order) => order && track('Purchase', {
    content_ids: (order.items || []).map(i => i.product_id || i.id), content_type: 'product',
    value: Number(order.total) || 0, currency: 'USD'
});
