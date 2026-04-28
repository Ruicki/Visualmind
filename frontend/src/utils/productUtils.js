
/**
 * Determina si un producto debe ser visible en la tienda.
 * Oculta productos estáticos/legacy pero mantiene productos de la DB con stock 0.
 */
export const isProductVisible = (product) => {
  if (!product) return false;

  // 1. Identificar si es un producto "antiguo" (del archivo data/products.js)
  // Los productos de la DB usan UUID (tienen guiones)
  const isStatic = product.source === 'static' || 
                   (typeof product.id === 'string' && !product.id.includes('-')) ||
                   typeof product.id === 'number';

  if (isStatic) return false;

  // 2. Verificar estado de ciclo de vida
  if (product.lifecycle_state === 'legacy' || product.lifecycle_state === 'archived') {
    return false;
  }

  // 3. Verificar si la temporada está activa (si tiene una asignada)
  if (product.season_is_active === false) {
    return false;
  }

  // 4. Verificar fecha de expiración de temporada
  if (product.season_end_date) {
    const endDate = new Date(product.season_end_date);
    if (endDate < new Date()) {
      return false;
    }
  }

  // Si pasó todos los filtros, es visible (aunque tenga stock 0)
  return true;
};
