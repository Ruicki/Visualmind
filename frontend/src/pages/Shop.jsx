import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { ChevronDown, Search, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import axiosInstance from '../api/axiosConfig';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';

/**
 * Página de tienda — con búsqueda, filtros de categoría y precio.
 * Fuente de datos: API Local + productos estáticos como fallback.
 */
export default function Shop() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");

  // Obtener productos y categorías al montar
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/products/categories');
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
      } else {
        // Fallback to recommended categories if DB categories empty
        const defaultCats = ['action', 'figures', 'posters', 'clothing', 'accessories'];
        setCategories(defaultCats);
      }
    } catch (err) {
      console.warn("Error fetching categories:", err);
      const defaultCats = ['action', 'figures', 'posters', 'clothing', 'accessories'];
      setCategories(defaultCats);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products');
      const apiData = response.data;

      if (apiData && apiData.length > 0) {
        // Combinar datos de API con datos estáticos (evitando duplicados si el id coincide)
        const normalizedStatic = STATIC_PRODUCTS.map(p => ({ ...p, source: 'static' }));
        const apiIds = new Set(apiData.map(p => p.id));
        const uniqueStatic = normalizedStatic.filter(p => !apiIds.has(p.id));
        setProducts([...apiData, ...uniqueStatic]);
      } else {
        setProducts(STATIC_PRODUCTS);
      }
    } catch (err) {
      console.warn("Error al obtener productos de la API, usando fallback estático:", err);
      setProducts(STATIC_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado
  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(p => {
      if (p.sizes) p.sizes.forEach(s => sizes.add(s));
      if (p.variants) p.variants.forEach(v => v.size && sizes.add(v.size));
    });
    return ['S', 'M', 'L', 'XL', 'XXL'].filter(s => sizes.has(s));
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Map();
    products.forEach(p => {
      if (p.colors) p.colors.forEach(c => colors.set(c.name || c, c));
      if (p.variants) p.variants.forEach(v => v.color && colors.set(v.color, v.color));
    });
    return Array.from(colors.values());
  }, [products]);

  const filteredProducts = products.filter(product => {
    if (category !== "all" && product.category !== category) return false;
    if (priceRange === "low" && product.price > 50) return false;
    if (priceRange === "mid" && (product.price <= 50 || product.price > 100)) return false;
    if (priceRange === "high" && product.price <= 100) return false;
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedSize !== "all") {
      const inSizes = product.sizes?.includes(selectedSize);
      const inVariants = product.variants?.some(v => v.size === selectedSize);
      if (!inSizes && !inVariants) return false;
    }
    if (selectedColor !== "all") {
      const colorName = typeof selectedColor === 'object' ? selectedColor.name : selectedColor;
      const inColors = product.colors?.some(c => (c.name || c) === colorName);
      const inVariants = product.variants?.some(v => v.color === colorName);
      if (!inColors && !inVariants) return false;
    }
    return true;
  });

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white' }}>
      <div className="container">

        {/* Categorías Premium - Barra Horizontal */}
        <div style={{ marginBottom: '2rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: '0.8rem', whiteSpace: 'nowrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory("all")}
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: '50px',
                background: category === "all" ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: category === "all" ? 'none' : '1px solid rgba(255,255,255,0.1)',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {t('shop.filter_all') || 'Todas'}
            </motion.button>
            {categories.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '50px',
                  background: category === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  border: category === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s'
                }}
              >
                {t(`shop.cat_${cat}`) || cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cabecera y controles de filtro */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>

            {/* Búsqueda Mejorada */}
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t('shop.search_placeholder') || '¿Qué buscas hoy?'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '14px',
                  padding: '1rem 1rem 1rem 3.5rem', 
                  color: 'white', 
                  outline: 'none', 
                  fontFamily: 'inherit',
                  transition: 'all 0.3s'
                }}
              />
            </div>

            {/* Filtro de precio premium */}
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  padding: '1rem 2.5rem 1rem 1.2rem',
                  color: 'white',
                  appearance: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <option value="all">{t('shop.price_all') || 'Cualquier precio'}</option>
                <option value="low">{t('shop.price_low') || 'Económico ($0 - $50)'}</option>
                <option value="mid">{t('shop.price_mid') || 'Premium ($50 - $100)'}</option>
                <option value="high">{t('shop.price_high') || 'Exclusivo ($100+)'}</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>

            {/* Filtro de talla */}
            <div style={{ position: 'relative', minWidth: '150px' }}>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  padding: '1rem 2.5rem 1rem 1.2rem',
                  color: 'white',
                  appearance: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <option value="all">{t('shop.filter_size') || 'Talla'}</option>
                {availableSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>

            {/* Filtro de color */}
            <div style={{ position: 'relative', minWidth: '150px' }}>
              <select
                value={typeof selectedColor === 'object' ? selectedColor.name || selectedColor : selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  padding: '1rem 2.5rem 1rem 1.2rem',
                  color: 'white',
                  appearance: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <option value="all">{t('shop.filter_color') || 'Color'}</option>
                {availableColors.map((color, i) => {
                  const colorName = typeof color === 'object' ? color.name || color : color;
                  return <option key={i} value={colorName}>{colorName}</option>;
                })}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>

            <button 
              onClick={() => { setCategory('all'); setPriceRange('all'); setSearchQuery(''); setSelectedSize('all'); setSelectedColor('all'); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            {t('common.loading') || 'Cargando productos...'}
          </div>
        ) : (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>{t('shop.no_results') || 'No se encontraron productos con esos filtros.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
