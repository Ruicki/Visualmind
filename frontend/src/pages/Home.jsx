import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import axiosInstance from '../api/axiosConfig';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { ChevronRight, ChevronLeft, ArrowRight, Clock, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';

/**
 * Página principal — carousel de productos destacados,
 * sección estacional, lookbook editorial y newsletter.
 */
export default function Home() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener productos al montar
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/products');
        if (response.data && response.data.length > 0) {
          setProducts(response.data);
        } else {
          setProducts(STATIC_PRODUCTS);
        }
      } catch (err) {
        console.warn("Usando productos estáticos para Home:", err);
        setProducts(STATIC_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeProducts();
  }, []);

  // Productos para las distintas secciones
  const featuredProducts = products.slice(0, 5);
  const seasonalProducts = products.filter(
    p => p.category === 'halloween' || p.category === 'fiestas_patrias'
  ).slice(0, 4);

  // Auto-slide del carousel
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length);

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <SEO 
        title={t('nav.home') || "Inicio"} 
        description="Visualmind - Tu tienda de moda premium con las últimas tendencias y colecciones exclusivas."
      />
      <Hero />

      {/* === Sección: Carousel de Productos Destacados === */}
      <section className="container" style={{ padding: '6rem 0' }}>
        <div className="carousel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.85rem' }}>
              {t('home_extended.featured_drops')}
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', marginTop: '0.8rem' }}>
              {t('home_extended.signature_pieces')}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={prevSlide} aria-label="Slide anterior" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={22} />
            </button>
            <button onClick={nextSlide} aria-label="Siguiente slide" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Carousel de imágenes hero */}
        <div className="carousel-wrapper" style={{ position: 'relative', height: '500px', overflow: 'hidden', borderRadius: '32px' }}>
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="carousel-slide-content"
              style={{
                position: 'absolute', inset: 0,
                opacity: index === currentSlide ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: `scale(${index === currentSlide ? 1 : 1.1})`,
                padding: 'clamp(1.5rem, 4vw, 4rem)',
                display: 'flex', alignItems: 'flex-end',
                background: 'linear-gradient(45deg, #0a0a0a 20%, transparent 100%)'
              }}
            >
              <img
                src={product.image || product.image_url} alt={product.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
              />
              <div style={{ maxWidth: '550px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <Zap size={18} fill="var(--primary)" /> {t('home_extended.exclusive_release')}
                </div>
                <h3 className="carousel-slide-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', lineHeight: 1, marginBottom: '1rem' }}>
                  {product.title}
                </h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link to={`/product/${product.id}`} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '16px' }}>
                    {t('home_extended.btn_explore')}
                  </Link>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: '900' }}>${product.price}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>{t('home_extended.limited_stock')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Indicadores del carousel */}
          <div className="carousel-dots" style={{ position: 'absolute', bottom: '2rem', right: '3rem', display: 'flex', gap: '0.6rem' }}>
            {featuredProducts.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentSlide(i)}
                role="button"
                aria-label={`Ir al slide ${i + 1}`}
                style={{
                  width: i === currentSlide ? '32px' : '10px', height: '10px',
                  borderRadius: '10px',
                  background: i === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* === Sección: Drops Estacionales === */}
      <section className="reveal theme-halloween" style={{ background: 'var(--bg-secondary)', padding: 'clamp(4rem, 8vw, 10rem) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.6rem 1.2rem', borderRadius: '100px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              <Clock size={16} /> {t('home_extended.limited_time_drop')}
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', marginBottom: '1rem' }}>
              {t('home_extended.seasonal_specials')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('home_extended.seasonal_desc')}
            </p>
          </div>
          {/* Grid de productos estacionales (reducido) */}
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {seasonalProducts.length > 0 ? (
              seasonalProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                {t('home_extended.no_seasonal_drops') || 'No hay colecciones especiales activas en este momento.'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === Sección: Lookbook / Editorial === */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '600px' }}>
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800" 
                alt="Lookbook"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '3rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Editorial</span>
                <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Cyberpunk Aesthetics Vol. 1</h3>
                <Link to="/shop" className="btn-primary" style={{ width: 'fit-content', padding: '0.8rem 2rem' }}>Ver Colección</Link>
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                Más que ropa, <span style={{ color: 'var(--primary)' }}>es una declaración.</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                Nuestras piezas están diseñadas para destacar. Cada diseño es una fusión de cultura pop, 
                estética retro-futurista y calidad premium.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>100% Cotton</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Máxima comodidad y durabilidad en cada prenda.</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>Eco-Friendly</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Comprometidos con procesos de producción responsables.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === Sección: Todos los Productos (Preview) === */}
      <section className="container" style={{ padding: '6rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900' }}>Explora el Catálogo</h2>
          <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
            Ver Todo <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Cargando productos...
          </div>
        ) : (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {products.slice(0, 8).map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </section>

      {/* === Sección: Newsletter === */}
      <section style={{ padding: '100px 0', borderTop: '1px solid var(--border-light)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Únete a la Élite</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
            Suscríbete para recibir acceso anticipado a nuevos drops, ediciones limitadas y ofertas exclusivas.
          </p>
          <form style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="tu@email.com" 
              style={{ flex: 1, padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'white', fontSize: '1rem' }}
            />
            <button className="btn-primary" style={{ padding: '1.2rem 3rem', borderRadius: '16px', fontSize: '1rem', fontWeight: '700' }}>
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
