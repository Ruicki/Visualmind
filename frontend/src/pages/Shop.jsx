import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ChevronDown, Search, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import axiosInstance from '../api/axiosConfig';
import { isProductVisible } from '../utils/productUtils';

/**
 * @component Shop
 * @description Página del catálogo principal de productos.
 * Implementa un motor de filtrado avanzado por:
 * - Categoría, Precio, Talla, Color.
 * - Temporada y Campaña.
 * Incluye visualización de estados de stock y persistencia de filtros.
 */
export default function Shop() {
  const { t } = useLanguage();
  
  // --- Estados de Datos ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCampaignData, setActiveCampaignData] = useState(null);

  // --- Estados de Filtrado ---
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [showLegacyOnly, setShowLegacyOnly] = useState(false);
  
  // Hooks de navegación y parámetros
  const [searchParams] = useSearchParams();

  /**
   * Efecto inicial: Carga productos, categorías y metadatos de campaña si existen en la URL.
   */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    const campaignSlug = searchParams.get('campaign');
    if (campaignSlug) {
      fetchCampaignDetails(campaignSlug);
    }
  }, [searchParams]);

  /**
   * Obtiene los detalles de una campaña específica para personalizar la cabecera de la tienda.
   * @param {string} slug - Identificador único de la campaña.
   */
  const fetchCampaignDetails = async (slug) => {
    try {
      const response = await axiosInstance.get(`/campaigns/${slug}`);
      setActiveCampaignData(response.data);
    } catch (err) {
      console.warn("Error fetching campaign details:", err);
    }
  };

  /**
   * Recupera la lista de categorías dinámicas del backend.
   * Si falla, aplica un conjunto de categorías predefinidas (fallback).
   */
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/products/categories');
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
      } else {
        const defaultCats = ['action', 'figures', 'posters', 'clothing', 'accessories'];
        setCategories(defaultCats);
      }
    } catch (err) {
      console.warn("Error fetching categories:", err);
      const defaultCats = ['action', 'figures', 'posters', 'clothing', 'accessories'];
      setCategories(defaultCats);
    }
  };

  /**
   * Obtiene todos los productos disponibles del backend.
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products');
      const apiData = response.data;

      if (apiData && apiData.length > 0) {
        setProducts(apiData);
      }
    } catch (err) {
      console.warn("Error al obtener productos de la API:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @memo availableSizes
   * Extrae todas las tallas únicas disponibles en el set de productos cargado.
   * Escanea tanto el array de tallas base como las variantes.
   */
  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(p => {
      if (p.sizes) p.sizes.forEach(s => sizes.add(s));
      if (p.variants) p.variants.forEach(v => v.size && sizes.add(v.size));
    });
    return ['S', 'M', 'L', 'XL', 'XXL'].filter(s => sizes.has(s));
  }, [products]);

  /**
   * @memo availableColors
   * Extrae todos los colores únicos disponibles.
   */
  const availableColors = useMemo(() => {
    const colors = new Map();
    products.forEach(p => {
      if (p.colors) p.colors.forEach(c => colors.set(c.name || c, c));
      if (p.variants) p.variants.forEach(v => v.color && colors.set(v.color, v.color));
    });
    return Array.from(colors.values());
  }, [products]);

  /**
   * Lógica de filtrado combinada.
   * Aplica filtros de visibilidad (legacy/lifecycle), categoría, rango de precio, búsqueda,
   * tallas, colores y campañas de forma secuencial.
   */
  const filteredProducts = products.filter(product => {
    // 1. Visibilidad: Comprobar si el producto es apto para mostrarse (ciclo de vida, stock, fecha)
    if (!isProductVisible(product)) return false;

    // 2. Filtro de Categoría
    if (category !== "all" && product.category !== category) return false;

    // 3. Filtro de Precio (rangos definidos arbitrariamente para UX)
    if (priceRange === "low" && product.price > 50) return false;
    if (priceRange === "mid" && (product.price <= 50 || product.price > 100)) return false;
    if (priceRange === "high" && product.price <= 100) return false;

    // 4. Búsqueda Textual (Case Insensitive)
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // 5. Filtro de Talla (Escanea base y variantes)
    if (selectedSize !== "all") {
      const inSizes = product.sizes?.includes(selectedSize);
      const inVariants = product.variants?.some(v => v.size === selectedSize);
      if (!inSizes && !inVariants) return false;
    }
    
    // 6. Filtro de Color
    if (selectedColor !== "all") {
      const colorName = typeof selectedColor === 'object' ? selectedColor.name : selectedColor;
      const inColors = product.colors?.some(c => (c.name || c) === colorName);
      const inVariants = product.variants?.some(v => v.color === colorName);
      if (!inColors && !inVariants) return false;
    }
    
    // 7. Filtro por campaña (URL param)
    const campaignSlug = searchParams.get('campaign');
    if (campaignSlug && activeCampaignData) {
      if (product.campaign_id !== activeCampaignData.id) return false;
    }

    return true;
  });

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white' }}>
      <SEO 
        title={t('shop.title') || 'Shop'} 
        description="Explora nuestra colección exclusiva de productos premium."
      />
      <div className="container">
        
        {/* Banner de Campaña Activa: Se muestra si se está filtrando por una campaña específica */}
        {activeCampaignData && (
          <div style={{ 
            marginBottom: '4rem', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            background: activeCampaignData.banner_url ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${activeCampaignData.banner_url})` : 'rgba(255,255,255,0.02)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: activeCampaignData.accent_color ? `1px solid ${activeCampaignData.accent_color}` : '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{ color: activeCampaignData.accent_color || 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('shop.campaign_special')}</span>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginTop: '1rem' }}>{activeCampaignData.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '1.5rem auto' }}>{activeCampaignData.description}</p>
          </div>
        )}

        {/* Navegación por Categorías (Barra Horizontal) */}
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

        {/* Toolbar de Filtros: Búsqueda y Dropdowns */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>

            {/* Input de Búsqueda */}
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

            {/* Selector de Precio */}
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

            {/* Selector de Talla */}
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

            {/* Selector de Color */}
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
              onClick={() => { setCategory('all'); setPriceRange('all'); setSearchQuery(''); setSelectedSize('all'); setSelectedColor('all'); setShowLegacyOnly(false); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('shop.clear_filters') || 'Limpiar'}
            </button>
          </div>
        </div>

        {/* Grid de Productos */}
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

        {/* Empty State: Sin resultados */}
        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>{t('shop.no_results') || 'No se encontraron productos con esos filtros.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
