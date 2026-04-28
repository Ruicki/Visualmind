import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { Star, ShoppingBag, Heart, ChevronRight, Truck, ShieldCheck, RotateCcw, Loader } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import axiosInstance from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';
import { isProductVisible } from '../utils/productUtils';
import SEO from '../components/SEO';

/**
 * @component ProductDetails
 * @description Vista detallada de un producto específico.
 * Gestiona la selección de variantes (talla/color), visualización de 
 * especificaciones técnicas, guía de tallas y productos relacionados.
 */
export default function ProductDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // --- Estados de Datos ---
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]); // Para sugerencias relacionadas

  // --- Estados de Selección de Variante ---
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  /**
   * Carga los datos del producto actual y la lista general para productos relacionados.
   * Procesa el estado de ciclo de vida (legacy) y configura valores iniciales de variantes.
   */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // 1. Cargar todos para "También te puede gustar"
        const res = await axiosInstance.get('/products');
        if (res.data?.length > 0) {
            setAllProducts(res.data);
        }

        // 2. Cargar producto específico por ID
        const response = await axiosInstance.get(`/products/${id}`);
        if (response.data) {
          const data = response.data;
          
          // Normalización de datos
          const found = {
            ...data,
            price: parseFloat(data.price),
            colors: data.colors || [],
            sizes: data.sizes || ['S', 'M', 'L', 'XL']
          };

          // Lógica de expiración y estado Legacy
          const isSeasonExpired = found.season_end_date ? new Date(found.season_end_date) < new Date() : false;
          const isLegacy = found.lifecycle_state === 'legacy' || found.season_is_active === false || isSeasonExpired;
          found.isLegacy = isLegacy;
          
          setProduct(found);
          
          // Configuración inicial de selección
          const firstColor = found.colors?.[0] || null;
          setSelectedColor(firstColor);

          // Inicializar talla priorizando variantes de la DB
          if (found.variants && found.variants.length > 0) {
            const sizes = [...new Set(found.variants.map(v => v.size))].sort();
            setSelectedSize(sizes[0]);
          } else {
            setSelectedSize(found.sizes?.[0] || 'M');
          }

          // Imagen inicial: Color seleccionado o imagen base
          setMainImage(firstColor ? firstColor.image : getProductImage(found.image, found.image_url));
        }
      } catch (err) {
        console.error("Error al cargar producto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0); // Reset scroll al navegar entre detalles
  }, [id]);

  /**
   * Sincroniza la imagen principal cuando el usuario cambia el color seleccionado.
   */
  useEffect(() => {
    if (selectedColor && selectedColor.image) {
      setMainImage(selectedColor.image);
    }
  }, [selectedColor]);

  // Manejo de estados de carga
  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}><Loader className="spin" /></div>;
  if (!product) return <div className="container" style={{ paddingTop: '150px' }}>{t('product.not_found') || 'Producto no encontrado'}</div>;

  /**
   * Productos relacionados filtrados por categoría y visibilidad.
   */
  const relatedProducts = allProducts.filter(p => isProductVisible(p) && p.category === product.category && p.id !== product.id).slice(0, 4);

  /**
   * Calcula el stock disponible para la combinación actual de Talla y Color.
   * Si no hay variantes, usa el stock general del producto.
   * 
   * @returns {Object} { inStock: boolean, quantity: number }
   */
  const getStockStatus = () => {
    if (!product.variants || product.variants.length === 0) {
      return { inStock: product.stock > 0, quantity: product.stock };
    }

    const relevantVariants = product.variants.filter(v => v.size === selectedSize);
    
    let stockCount = 0;
    if (selectedColor && relevantVariants.some(v => v.color === selectedColor.name)) {
      const variant = relevantVariants.find(v => v.color === selectedColor.name);
      stockCount = variant ? variant.stock : 0;
    } else {
      // Si no hay color seleccionado (o no existe en variantes), sumamos stock por talla
      stockCount = relevantVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }

    return { inStock: stockCount > 0, quantity: stockCount };
  };

  const { inStock, quantity: stockQuantity } = getStockStatus();

  // Deducción de tallas disponibles basadas en variantes
  const availableSizes = product.variants && product.variants.length > 0
    ? [...new Set(product.variants.map(v => v.size))].sort()
    : (product.sizes || ['S', 'M', 'L', 'XL']);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '100px' }}>
      <SEO 
        title={product.title}
        description={product.description || `Buy ${product.title} at Visualmind Premium Store.`}
        image={mainImage}
        url={window.location.href}
      />
      
      {/* Breadcrumbs: Navegación jerárquica */}
      <div className="container" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.home') || 'Inicio'}</Link>
        <ChevronRight size={14} />
        <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.shop')}</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'white' }}>{product.title}</span>
      </div>

      <div className="container product-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '3rem', marginBottom: '6rem' }}>
        
        {/* Sección Izquierda: Galería y Visualización */}
        <div className="product-detail-gallery" style={{ display: 'flex', gap: '1rem' }}>
          {/* Miniaturas de Colores (Disparadores de cambio de imagen) */}
          {product.colors?.length > 0 && (
            <div className="product-detail-thumbnails" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {product.colors.map(color => (
                <div
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '70px', height: '85px', borderRadius: '10px', overflow: 'hidden',
                    cursor: 'pointer', border: `2px solid ${selectedColor?.name === color.name ? 'var(--primary)' : 'var(--border-light)'}`,
                    opacity: selectedColor?.name === color.name ? 1 : 0.6,
                    transition: 'all 0.3s', flexShrink: 0
                  }}
                >
                  <img src={color.image} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Marco de Imagen Principal */}
          <div className="product-detail-main-image" style={{ flex: 1, height: '600px', borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
            <img src={mainImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Sección Derecha: Información y Compra */}
        <div style={{ padding: '1rem 0' }}>
          <div style={{ color: 'var(--text-accent)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
            {product.subCategory || product.category}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.2rem', fontWeight: '800' }}>{product.title}</h1>

          {/* Social Proof: Valoraciones (Simuladas) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem', color: '#fbbf24' }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="#fbbf24" />)}
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>(4.8 / 5.0)</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>42 {t('product.reviews') || 'reseñas'}</span>
          </div>

          {/* Lógica de Precio y Descuento Legacy */}
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span>${product.isLegacy ? (product.price * 0.5).toFixed(2) : product.price}</span>
            {product.isLegacy && (
              <>
                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                  ${product.price}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 12px', borderRadius: '50px', fontWeight: '700' }}>
                  50% OFF - LEGACY
                </span>
              </>
            )}

            {/* Badge de Stock Dinámico */}
            <div style={{ 
              padding: '6px 16px', 
              borderRadius: '50px', 
              fontSize: '0.85rem', 
              fontWeight: '700',
              background: inStock ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: inStock ? '#22c55e' : '#ef4444',
              border: `1px solid ${inStock ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {inStock ? (stockQuantity < 5 ? `¡SOLO ${stockQuantity} DISPONIBLES!` : 'EN STOCK') : 'AGOTADO'}
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8', marginBottom: '2.5rem', maxWidth: '600px' }}>
            {product.description || t('product.no_description') || 'Sin descripción disponible.'}
          </p>

          {/* Configuración de Variante: Color */}
          {product.colors?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase' }}>
                {t('product.select_color') || 'Color'}: {selectedColor?.name}
              </h4>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', padding: '3px',
                      background: 'transparent',
                      border: `2px solid ${selectedColor?.name === color.name ? 'var(--primary)' : 'transparent'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: color.hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Configuración de Variante: Talla */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase' }}>
              {t('product.select_size') || 'Talla'}
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    width: '50px', height: '50px', borderRadius: '14px',
                    border: `1px solid ${selectedSize === size ? 'var(--primary)' : 'var(--border-light)'}`,
                    background: selectedSize === size ? 'var(--primary)' : 'transparent',
                    color: selectedSize === size ? 'white' : 'var(--text-secondary)',
                    fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones de Compra */}
          <div className="product-detail-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {/* Selector de Cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-light)', padding: '0.4rem' }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem' }}>−</button>
              <span style={{ width: '36px', textAlign: 'center', fontWeight: '700' }}>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem' }}>+</button>
            </div>

            {/* Botón Añadir al Carrito (Aplica descuento si es Legacy) */}
            <button
              className={`btn-primary ${!inStock ? 'disabled' : ''}`}
              disabled={!inStock}
              style={{ 
                flex: 1, 
                minWidth: '180px', 
                height: '55px', 
                borderRadius: '14px', 
                fontSize: '1rem', 
                gap: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                opacity: inStock ? 1 : 0.5,
                cursor: inStock ? 'pointer' : 'not-allowed'
              }}
              onClick={() => {
                if (!inStock) return;
                const finalPrice = product.isLegacy ? product.price * 0.5 : product.price;
                for (let i = 0; i < quantity; i++) {
                  addToCart({ ...product, price: finalPrice, image: mainImage, selectedColor, selectedSize });
                }
              }}
            >
              <ShoppingBag size={20} /> {inStock ? (t('product.add_to_bag') || 'Agregar') : 'Agotado'}
            </button>

            {/* Wishlist Toggle */}
            <button
              onClick={() => toggleWishlist(product)}
              aria-label="Agregar a favoritos"
              style={{ width: '55px', height: '55px', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: isInWishlist(product.id) ? '#ff4d4d' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
            >
              <Heart size={22} fill={isInWishlist(product.id) ? '#ff4d4d' : 'none'} />
            </button>
          </div>

          {/* Trust Badges: USP (Unique Selling Propositions) */}
          <div className="product-detail-trust" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <Truck size={22} style={{ color: 'var(--primary)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>{t('product.free_shipping') || 'Envío Gratis'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <ShieldCheck size={22} style={{ color: 'var(--primary)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>{t('product.secure_pay') || 'Pago Seguro'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <RotateCcw size={22} style={{ color: 'var(--primary)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>{t('product.returns_30') || '30 Días Devolución'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Selling: Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="container" style={{ paddingBottom: '6rem' }}>
          <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '2.5rem', fontWeight: '800' }}>
            {t('product.related') || 'También te puede gustar'}
          </h3>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
