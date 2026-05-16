import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ChevronDown, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import axiosInstance from '../api/axiosConfig';
import { isProductVisible } from '../utils/productUtils';

const PRICE_RANGES = [
  { key: 'all', label: 'Todas' },
  { key: 'low', label: '$0 – $50' },
  { key: 'mid', label: '$50 – $100' },
  { key: 'high', label: '$100+' },
];

const SIZE_LIST = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const COLOR_SWATCHES = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  pink: '#EC4899',
  orange: '#F97316',
  gray: '#6B7280',
  navy: '#1E3A5F',
  beige: '#F5F5DC',
  brown: '#8B4513',
};

export default function Shop() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeCampaignData, setActiveCampaignData] = useState(null);
  const [activeCollectionData, setActiveCollectionData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [category, setCategory] = useState("all");
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();

    const campaignSlug = searchParams.get('campaign');
    if (campaignSlug) fetchCampaignDetails(campaignSlug);
    const collectionSlug = searchParams.get('collection');
    if (collectionSlug) fetchCollectionDetails(collectionSlug);
  }, [searchParams]);

  const fetchCampaignDetails = async (slug) => {
    try {
      const response = await axiosInstance.get('/campaigns');
      const found = response.data?.find(c => c.slug === slug);
      if (found) setActiveCampaignData(found);
    } catch (err) {
      console.warn("Error fetching campaign details:", err);
    }
  };

  const fetchCollectionDetails = async (slug) => {
    try {
      const response = await axiosInstance.get(`/collections/${slug}/products`);
      setActiveCollectionData({ slug, products: response.data });
    } catch (err) {
      console.warn("Error fetching collection products:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
      }
    } catch (err) {
      console.warn("Error fetching categories:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await axiosInstance.get('/subcategories');
      if (response.data) setSubcategories(response.data);
    } catch (err) {
      console.warn("Error fetching subcategories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products');
      if (response.data && response.data.length > 0) {
        setProducts(response.data);
      }
    } catch (err) {
      console.warn("Error al obtener productos:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(p => {
      if (p.sizes) p.sizes.forEach(s => sizes.add(s));
      if (p.variants) p.variants.forEach(v => v.size && sizes.add(v.size));
    });
    return SIZE_LIST.filter(s => sizes.has(s));
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Map();
    products.forEach(p => {
      if (p.colors) p.colors.forEach(c => colors.set(c.name || c, c));
      if (p.variants) p.variants.forEach(v => v.color && colors.set(v.color, v.color));
    });
    return Array.from(colors.values());
  }, [products]);

  const subcategoriesByCategory = useMemo(() => {
    const map = {};
    subcategories.forEach(sc => {
      const catId = sc.category_id;
      if (!map[catId]) map[catId] = [];
      map[catId].push(sc);
    });
    return map;
  }, [subcategories]);

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color) => {
    const colorName = typeof color === 'object' ? color.name || color : color;
    setSelectedColors(prev =>
      prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
    );
  };

  const clearFilters = () => {
    setCategory("all");
    setSubcategoryId(null);
    setPriceRange("all");
    setSearchQuery("");
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  const hasActiveFilters = category !== "all" || subcategoryId || priceRange !== "all" || searchQuery || selectedSizes.length > 0 || selectedColors.length > 0;

  const filteredProducts = products.filter(product => {
    if (!isProductVisible(product)) return false;

    if (category !== "all" && product.category !== category) return false;

    if (subcategoryId && product.subcategory_id !== subcategoryId) return false;

    if (priceRange === "low" && product.price > 50) return false;
    if (priceRange === "mid" && (product.price <= 50 || product.price > 100)) return false;
    if (priceRange === "high" && product.price <= 100) return false;

    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    if (selectedSizes.length > 0) {
      const hasSize = selectedSizes.some(size =>
        product.sizes?.includes(size) || product.variants?.some(v => v.size === size)
      );
      if (!hasSize) return false;
    }

    if (selectedColors.length > 0) {
      const hasColor = selectedColors.some(colorName => {
        const inColors = product.colors?.some(c => (c.name || c) === colorName);
        const inVariants = product.variants?.some(v => v.color === colorName);
        return inColors || inVariants;
      });
      if (!hasColor) return false;
    }

    const campaignSlug = searchParams.get('campaign');
    if (campaignSlug && activeCampaignData) {
      if (product.campaign_id !== activeCampaignData.id) return false;
    }

    const collectionSlug = searchParams.get('collection');
    if (collectionSlug && activeCollectionData?.products) {
      if (!activeCollectionData.products.some(p => p.id === product.id)) return false;
    }

    return true;
  });

  const sidebarContent = (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={18} /> {t('shop.filter_title') || 'Filtros'}
        </h3>
        <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'none' }} className="sidebar-close-btn">
          <X size={20} />
        </button>
      </div>

      {/* Categorías */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {t('shop.filter_categories') || 'Categorías'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <button
            onClick={() => { setCategory("all"); setSubcategoryId(null); }}
            style={{
              textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: category === "all" ? '700' : '500', background: category === "all" ? 'var(--primary)' : 'transparent', color: category === "all" ? '#000' : 'var(--text-primary)', transition: 'all 0.2s'
            }}
          >
            {t('shop.filter_all') || 'Todas'}
          </button>
          {categories.map(cat => (
            <React.Fragment key={cat.id || cat}>
              <button
                onClick={() => { setCategory(cat.name || cat); setSubcategoryId(null); }}
                style={{
                  textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: category === (cat.name || cat) ? '700' : '500', background: category === (cat.name || cat) ? 'var(--primary)' : 'transparent', color: category === (cat.name || cat) ? '#000' : 'var(--text-primary)', transition: 'all 0.2s'
                }}
              >
                {cat.name || cat}
              </button>
              {/* Subcategorías anidadas */}
              {subcategoriesByCategory[cat.id] && subcategoriesByCategory[cat.id].length > 0 && (
                <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {subcategoriesByCategory[cat.id].map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => { setCategory(cat.name || cat); setSubcategoryId(sc.id); }}
                      style={{
                        textAlign: 'left', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: subcategoryId === sc.id ? '700' : '400', background: subcategoryId === sc.id ? 'rgba(var(--primary-rgb),0.15)' : 'transparent', color: subcategoryId === sc.id ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s'
                      }}
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
          {t('shop.filter_price') || 'Rango de Precio'}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {PRICE_RANGES.map(pr => (
            <button
              key={pr.key}
              onClick={() => setPriceRange(pr.key)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '100px', border: priceRange === pr.key ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', background: priceRange === pr.key ? 'var(--primary)' : 'transparent', color: priceRange === pr.key ? '#000' : 'var(--text-primary)', transition: 'all 0.2s'
              }}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tallas como pills */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
          {t('shop.sizes') || 'Tallas'}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              style={{
                width: '40px', height: '40px', borderRadius: '12px', border: selectedSizes.includes(size) ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', background: selectedSizes.includes(size) ? 'var(--primary)' : 'transparent', color: selectedSizes.includes(size) ? '#000' : 'var(--text-primary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colores como swatches */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
          {t('shop.filter_color') || 'Colores'}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {availableColors.map((color, i) => {
            const colorName = typeof color === 'object' ? color.name || color : color;
            const hex = COLOR_SWATCHES[colorName.toLowerCase()] || '#888';
            const isSelected = selectedColors.includes(colorName);
            return (
              <button
                key={i}
                onClick={() => toggleColor(color)}
                title={colorName}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: isSelected ? '3px solid var(--primary)' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', background: hex, transition: 'all 0.2s', outline: 'none', boxShadow: isSelected ? '0 0 0 2px var(--bg-primary)' : 'none'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
        >
          {t('shop.clear_filters') || 'Limpiar Filtros'}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white' }}>
      <SEO
        title={t('shop.title') || 'Shop'}
        description="Explora nuestra colección exclusiva de productos premium."
      />
      <div className="container">
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

        {/* Mobile toggle */}
        <div className="mobile-filter-toggle" style={{ display: 'none', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <Filter size={18} /> {t('shop.filter_title') || 'Filtros'} {hasActiveFilters && <span style={{ background: 'var(--primary)', color: '#000', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.65rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{selectedSizes.length + selectedColors.length + (category !== "all" ? 1 : 0) + (priceRange !== "all" ? 1 : 0)}</span>}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', marginLeft: '1rem' }}>
              {t('shop.clear_filters') || 'Limpiar'}
            </button>
          )}
        </div>

        {/* Desktop layout: sidebar + grid */}
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* Sidebar Desktop */}
          <aside className="shop-sidebar-desktop" style={{ width: '280px', flexShrink: 0, background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'sticky', top: 'calc(var(--navbar-height, 80px) + 20px)' }}>
            {/* Búsqueda en sidebar */}
            <div style={{ padding: '1.5rem 1.5rem 0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder={t('shop.search_placeholder') || 'Buscar...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.7rem 0.8rem 0.7rem 2.2rem', color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            {sidebarContent}
          </aside>

          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }}
                onClick={() => setSidebarOpen(false)}
              >
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', maxWidth: '85vw', background: 'var(--bg-secondary)', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.1)' }}
                  className="shop-sidebar-mobile"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder={t('shop.search_placeholder') || 'Buscar...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.7rem 0.8rem 0.7rem 2.2rem', color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem' }}
                      />
                    </div>
                    <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginLeft: '0.8rem', flexShrink: 0 }}>
                      <X size={22} />
                    </button>
                  </div>
                  {sidebarContent}
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Result info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {filteredProducts.length} {t('shop.products_count') || 'productos'}
              </p>
            </div>

            {loading ? (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '340px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <p>{t('shop.no_results') || 'No se encontraron productos con esos filtros.'}</p>
              </div>
            ) : (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
