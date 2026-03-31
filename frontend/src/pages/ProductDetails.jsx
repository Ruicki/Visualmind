import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { Star, ShoppingBag, Heart, ChevronRight, Truck, ShieldCheck, RotateCcw, Loader } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import axiosInstance from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';

/**
 * Página de detalle de producto — responsive con grid adaptable.
 */
export default function ProductDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState(PRODUCTS);

  // Obtener datos del producto (local o API)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Cargar todos los productos para relacionados
        axiosInstance.get('/products').then(res => {
          if (res.data?.length > 0) {
            const apiIds = new Set(res.data.map(p => p.id));
            const uniqueStatic = PRODUCTS.filter(p => !apiIds.has(p.id));
            setAllProducts([...res.data, ...uniqueStatic]);
          }
        }).catch(() => {});

        let found = PRODUCTS.find(p => p.id === id);

        if (!found) {
          try {
            const response = await axiosInstance.get(`/products/${id}`);
            if (response.data) {
              const data = response.data;
              found = {
                ...data,
                price: parseFloat(data.price),
                colors: data.colors || [],
                sizes: data.sizes || ['S', 'M', 'L', 'XL']
              };
            }
          } catch (apiErr) {
            console.warn("Producto no encontrado en API, buscando en estáticos:", apiErr);
          }
        }

        if (found) {
          setProduct(found);
          const firstColor = found.colors?.[0] || null;
          setSelectedColor(firstColor);
          // Si tiene color, usamos su imagen, si no, la imagen base
          setMainImage(firstColor ? firstColor.image : getProductImage(found.image, found.image_url));
        }
      } catch (err) {
        console.error("Error al cargar producto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Actualizar imagen principal al cambiar de color (sin redundancia inicial)
  useEffect(() => {
    if (selectedColor && selectedColor.image) {
      setMainImage(selectedColor.image);
    }
  }, [selectedColor]);

  // Estados de carga y error
  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}><Loader className="spin" /></div>;
  if (!product) return <div className="container" style={{ paddingTop: '150px' }}>{t('product.not_found') || 'Producto no encontrado'}</div>;

  // Productos relacionados de la misma categoría (incluye DB + estáticos)
  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Breadcrumbs */}
      <div className="container" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.home') || 'Inicio'}</Link>
        <ChevronRight size={14} />
        <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.shop')}</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'white' }}>{product.title}</span>
      </div>

      {/* Grid de producto — 2 columnas en desktop, 1 en mobile */}
      <div className="container product-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '3rem', marginBottom: '6rem' }}>
        {/* Galería de imágenes */}
        <div className="product-detail-gallery" style={{ display: 'flex', gap: '1rem' }}>
          {/* Miniaturas si hay colores */}
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


          {/* Imagen principal */}
          <div className="product-detail-main-image" style={{ flex: 1, height: '600px', borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
            <img src={mainImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Información del producto */}
        <div style={{ padding: '1rem 0' }}>
          <div style={{ color: 'var(--text-accent)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
            {product.subCategory || product.category}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.2rem', fontWeight: '800' }}>{product.title}</h1>

          {/* Estrellas de valoración */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem', color: '#fbbf24' }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="#fbbf24" />)}
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>(4.8 / 5.0)</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>42 {t('product.reviews') || 'reseñas'}</span>
          </div>

          {/* Precio */}
          <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '2rem' }}>${product.price}</div>

          {/* Descripción */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8', marginBottom: '2.5rem', maxWidth: '600px' }}>
            {product.description || t('product.no_description') || 'Sin descripción disponible.'}
          </p>

          {/* Selector de color */}
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

          {/* Selector de talla */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase' }}>
              {t('product.select_size') || 'Talla'}
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {(product.sizes || ['S', 'M', 'L', 'XL']).map(size => (
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

          {/* Acciones: cantidad, agregar al carrito, wishlist */}
          <div className="product-detail-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {/* Control de cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-light)', padding: '0.4rem' }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem' }}>−</button>
              <span style={{ width: '36px', textAlign: 'center', fontWeight: '700' }}>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem' }}>+</button>
            </div>

            {/* Botón de agregar al carrito */}
            <button
              className="btn-primary"
              style={{ flex: 1, minWidth: '180px', height: '55px', borderRadius: '14px', fontSize: '1rem', gap: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  addToCart({ ...product, image: mainImage, selectedColor, selectedSize });
                }
              }}
            >
              <ShoppingBag size={20} /> {t('product.add_to_bag') || 'Agregar'}
            </button>

            {/* Botón wishlist */}
            <button
              onClick={() => toggleWishlist(product)}
              aria-label="Agregar a favoritos"
              style={{ width: '55px', height: '55px', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: isInWishlist(product.id) ? '#ff4d4d' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
            >
              <Heart size={22} fill={isInWishlist(product.id) ? '#ff4d4d' : 'none'} />
            </button>
          </div>

          {/* Insignias de confianza */}
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

      {/* Productos relacionados */}
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
