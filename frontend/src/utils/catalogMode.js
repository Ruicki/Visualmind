/**
 * @file catalogMode.js
 * @description Modo catálogo del sitio publicado: si el backend no responde al cargar,
 * la tienda sigue funcionando con el catálogo integrado y los pedidos se confirman por
 * WhatsApp (ver main.jsx). Este módulo solo guarda si el modo está activo.
 */
let active = false;

export const isCatalogMode = () => active;
export const enableCatalogMode = () => { active = true; };
