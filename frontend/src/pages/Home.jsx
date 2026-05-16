/**
 * @file Home.jsx
 * @description Página de inicio de la aplicación.
 * Orquesta la visualización de campañas activas, productos destacados, colecciones estacionales
 * y secciones editoriales mediante la integración de múltiples endpoints.
 */

import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import axiosInstance from '../api/axiosConfig';
import { ChevronRight, ChevronLeft, ArrowRight, Clock, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { isProductVisible } from '../utils/productUtils';

/**
 * Componente Home
 * @component
 * @description Punto de entrada visual principal. Maneja la lógica de:
 * 1. Banners dinámicos (Campañas vs Temporadas).
 * 2. Carousel de productos destacados (Priority > 5).
 * 3. Countdown timer para ofertas limitadas.
 * 4. Integración de SEO dinámico.
 */
/**
 * @component Home
 * @description Página de inicio de Visualmind.
 * Orquestador principal que renderiza el Hero estacional, secciones de 
 * productos destacados, categorías principales y contenido de campaña.
 */
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800';

export default function Home() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEvents, setActiveEvents] = useState([]);
  const [featuredCollection, setFeaturedCollection] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  /**
   * Efecto de Carga de Datos Inicial
   * @description Realiza peticiones concurrentes para minimizar el tiempo de carga.
   * Prioriza temporadas sobre campañas para el banner dinámico.
   */
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [productsRes, campaignRes, collectionsRes, featuredRes] = await Promise.all([
          axiosInstance.get('/products'),
          axiosInstance.get('/campaigns/active-all').catch(() => ({ data: [] })),
          axiosInstance.get('/collections').catch(() => ({ data: [] })),
          axiosInstance.get('/featured-products').catch(() => ({ data: [] }))
        ]);
        
        if (productsRes.data && productsRes.data.length > 0) {
          setProducts(productsRes.data);
        }

        if (collectionsRes.data && collectionsRes.data.length > 0) {
          const activeCollections = collectionsRes.data.filter(c => c.is_active);
          if (activeCollections.length > 0) {
            setFeaturedCollection(activeCollections[0]);
          }
        }

        if (campaignRes.data && Array.isArray(campaignRes.data) && campaignRes.data.length > 0) {
          setActiveEvents(campaignRes.data);
          // Si hay campañas activas, intentar obtener sus slots destacados
          const campaignEvent = campaignRes.data.find(e => e.type === 'campaign');
          if (campaignEvent) {
            try {
              const campaignSlots = await axiosInstance.get(`/featured-products?campaign_id=${campaignEvent.id}`);
              if (campaignSlots.data && campaignSlots.data.length > 0) {
                setFeaturedProducts(campaignSlots.data);
              } else {
                setFeaturedProducts(featuredRes.data || []);
              }
            } catch {
              setFeaturedProducts(featuredRes.data || []);
            }
          } else {
            setFeaturedProducts(featuredRes.data || []);
          }
        } else if (campaignRes.data && !Array.isArray(campaignRes.data)) {
          setActiveEvents([campaignRes.data]);
          setFeaturedProducts(featuredRes.data || []);
        } else {
          setFeaturedProducts(featuredRes.data || []);
        }
      } catch (err) {
        console.warn("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Segmentación de productos para las distintas secciones de la home
  const availableProducts = products.filter(isProductVisible);

  // Productos marcados para aparecer en "Explora el Catálogo" (show_on_home) con fallback
  const homeCatalogProducts = React.useMemo(() => {
    const marked = availableProducts.filter(p => p.show_on_home).slice(0, 8);
    return marked.length > 0 ? marked : availableProducts.slice(0, 8);
  }, [availableProducts]);

  // Carousel: Productos destacados desde el endpoint, con fallback a priority > 5
  const carouselProducts = featuredProducts.length > 0
    ? featuredProducts
    : (availableProducts.filter(p => p.priority > 5).slice(0, 5).length > 0
        ? availableProducts.filter(p => p.priority > 5).slice(0, 5)
        : availableProducts.slice(0, 5));

  const activeCampaigns = React.useMemo(() => {
    return activeEvents.filter(e => e.phase === 'active');
  }, [activeEvents]);

  const prelaunchCampaigns = React.useMemo(() => {
    return activeEvents.filter(e => e.phase === 'prelaunch' || e.phase === 'upcoming');
  }, [activeEvents]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('sending');
    try {
      const res = await axiosInstance.post('/newsletter/subscribe', { email: newsletterEmail });
      setNewsletterStatus(res.data.alreadySubscribed ? 'already' : 'success');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  /**
   * Auto-slide del carousel de destacados
   */
  useEffect(() => {
    if (carouselProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselProducts.length]);

  const nextSlide = () => {
    if (carouselProducts.length === 0) return;
    setCurrentSlide(prev => (prev + 1) % carouselProducts.length);
  };
  const prevSlide = () => {
    if (carouselProducts.length === 0) return;
    setCurrentSlide(prev => (prev - 1 + carouselProducts.length) % carouselProducts.length);
  };

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <SEO 
        title={t('nav.home') || "Inicio"} 
        description="Visualmind - Tu tienda de moda premium con las últimas tendencias y colecciones exclusivas."
      />

      <Hero events={activeCampaigns} />

      {/* Sección: Carousel de Productos Destacados */}
      <section className="container home-carousel" style={{ padding: 'clamp(1.5rem, 4vw, 4rem) 0 clamp(3rem, 6vw, 6rem) 0' }}>
        <div className="carousel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
          <div>
            <span style={{ display: 'block', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', marginBottom: 'clamp(0.3rem, 0.5vw, 0.5rem)' }}>
              {t('home_extended.featured_drops')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 3.5rem)', fontWeight: '900' }}>
                  {t('home_extended.featured_title') || 'Lo Nuevo'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={prevSlide} aria-label="Slide anterior" aria-disabled={carouselProducts.length === 0} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: carouselProducts.length === 0 ? 'var(--text-secondary)' : 'white', cursor: carouselProducts.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: carouselProducts.length === 0 ? 0.3 : 1 }}>
              <ChevronLeft size={22} />
            </button>
            <button onClick={nextSlide} aria-label="Siguiente slide" aria-disabled={carouselProducts.length === 0} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: carouselProducts.length === 0 ? 'var(--text-secondary)' : 'white', cursor: carouselProducts.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: carouselProducts.length === 0 ? 0.3 : 1 }}>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        <div className="carousel-wrapper" style={{ position: 'relative', height: '500px', overflow: 'hidden', borderRadius: '32px' }}>
          {carouselProducts.length === 0 && !loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              {t('home_extended.catalog_empty')}
            </div>
          ) : loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '32px' }} />
          ) : carouselProducts.map((product, index) => (
            <div
              key={product.id}
              className="carousel-slide-content"
              style={{
                position: 'absolute', inset: 0,
                opacity: index === currentSlide ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: `scale(${index === currentSlide ? 1 : 1.1})`,
                padding: 'clamp(1rem, 4vw, 4rem)',
                display: 'flex', alignItems: 'flex-end',
                background: 'linear-gradient(45deg, var(--bg-primary) 20%, transparent 100%)'
              }}
            >
              <img
                src={product.image || product.image_url}
                alt={product.title}
                loading="lazy"
                onError={(e) => { e.target.src = FALLBACK_IMG; }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1, transition: 'opacity 0.4s ease' }}
              />
              <div style={{ maxWidth: '550px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <Zap size={18} fill="var(--primary)" /> {t('home_extended.exclusive_release')}
                </div>
                <h3 className="carousel-slide-title" style={{ fontSize: 'clamp(1.2rem, 5vw, 3.5rem)', fontWeight: '900', lineHeight: 1, marginBottom: 'clamp(0.6rem, 1vw, 1rem)' }}>
                  {product.title}
                </h3>
                <div style={{ display: 'flex', gap: 'clamp(0.5rem, 1vw, 1rem)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link to={`/product/${product.id}`} className="btn-primary" style={{ paddingTop: 'clamp(0.6rem, 1.5vw, 1rem)', paddingBottom: 'clamp(0.6rem, 1.5vw, 1rem)', paddingLeft: 'clamp(1.2rem, 2.5vw, 2.5rem)', paddingRight: 'clamp(1.2rem, 2.5vw, 2.5rem)', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', borderRadius: 'clamp(12px, 1.5vw, 16px)' }}>
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

          {carouselProducts.length > 0 && !loading && (
          <div className="carousel-dots" style={{ position: 'absolute', bottom: '2rem', right: '3rem', display: 'flex', gap: '0.6rem' }}>
            {carouselProducts.map((_, i) => (
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
          )}
        </div>
      </section>

      {/* Sección: Próximos Lanzamientos (Campañas Prelaunch + Upcoming) */}
      {prelaunchCampaigns.length > 0 && (
      <section className="home-seasonal" style={{ background: 'var(--bg-secondary)', padding: 'clamp(2.5rem, 8vw, 10rem) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 4vw, 4rem)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.6rem 1.2rem', borderRadius: '100px', color: 'var(--primary)', fontWeight: '700', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', marginBottom: 'clamp(0.5rem, 1vw, 1.2rem)' }}>
              <Clock size={16} /> {t('home_extended.upcoming_badge') || 'Próximamente'}
            </div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 5vw, 3.5rem)', fontWeight: '900', marginBottom: 'clamp(0.4rem, 1vw, 1rem)' }}>
              {t('home_extended.upcoming_title') || 'Próximos Lanzamientos'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 2vw, 1.1rem)', maxWidth: '600px', margin: '0 auto' }}>
              {t('home_extended.upcoming_desc')}
            </p>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {prelaunchCampaigns.map(campaign => (
              <div key={campaign.id} style={{ background: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.3s' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative', background: '#111' }}>
                  {campaign.banner_url ? (
                    <img src={campaign.banner_url} alt={campaign.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '3rem', fontWeight: '900' }}>
                      ?
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--primary)', color: '#000', padding: '0.3rem 0.8rem', borderRadius: '100px', fontWeight: '800', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={12} /> {campaign.phase === 'prelaunch' ? t('home_extended.pre_order_badge') || 'Reserva Ya' : t('home_extended.upcoming_badge') || 'Próximamente'}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{campaign.name}</h3>
                  {campaign.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>{campaign.description}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {campaign.start_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={12} /> {new Date(campaign.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {campaign.type === 'season' ? 'Temporada' : 'Campaña'}
                    </span>
                  </div>
                  {campaign.phase === 'prelaunch' && (
                    <div style={{ marginTop: '1rem' }}>
                      <button className="btn-primary" style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem' }}>
                        {t('home_extended.pre_order_btn') || 'Reservar Ya'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Sección: Colección Destacada (con soporte de 3 templates) */}
      {featuredCollection && (
        (() => {
          const tmpl = featuredCollection.template_type || 'editorial';
          if (tmpl === 'hero') {
            return (
              <section className="home-collection-hero" style={{ position: 'relative', height: 'clamp(300px, 60vw, 700px)', overflow: 'hidden' }}>
                <img src={featuredCollection.image_url || FALLBACK_IMG} alt={featuredCollection.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, transparent 100%)', display: 'flex', alignItems: 'center', padding: 'clamp(2rem, 6vw, 6rem)' }}>
                  <div style={{ maxWidth: '500px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 'clamp(0.65rem, 1.5vw, 0.85rem)' }}>{t('home_extended.exclusive_collection')}</span>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)', fontWeight: '900', margin: '0.5rem 0 1rem' }}>{featuredCollection.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)' }}>{featuredCollection.description}</p>
                    <Link to={`/shop?collection=${featuredCollection.slug}`} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '700' }}>{t('home_extended.view_collection')}</Link>
                  </div>
                </div>
              </section>
            );
          }
          if (tmpl === 'grid') {
            return (
              <section className="home-collection-grid" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0', background: 'var(--bg-secondary)' }}>
                <div className="container">
                  <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 'clamp(0.65rem, 1.5vw, 0.85rem)' }}>{t('home_extended.exclusive_collection')}</span>
                    <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', margin: '0.5rem 0' }}>{featuredCollection.name}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{featuredCollection.description}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                        <Link to={`/shop?collection=${featuredCollection.slug}`}>
                          <img src={featuredCollection.image_url || FALLBACK_IMG} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link to={`/shop?collection=${featuredCollection.slug}`} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '700' }}>{t('home_extended.view_collection')}</Link>
                  </div>
                </div>
              </section>
            );
          }
          // editorial (default)
          return (
            <section className="home-collection" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0', background: 'var(--bg-primary)' }}>
              <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(1rem, 2vw, 2rem)', alignItems: 'center' }}>
                  <div className="home-lookbook-img" style={{ position: 'relative', borderRadius: 'clamp(16px, 2vw, 24px)', overflow: 'hidden', height: 'clamp(260px, 50vw, 600px)' }}>
                    <img src={featuredCollection.image_url || FALLBACK_IMG} alt={featuredCollection.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(1.2rem, 3vw, 3rem)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', fontSize: 'clamp(0.65rem, 1.5vw, 0.85rem)', marginBottom: 'clamp(0.3rem, 0.5vw, 0.5rem)' }}>
                        {t('home_extended.exclusive_collection')}
                      </span>
                      <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: '800', marginBottom: 'clamp(0.5rem, 1vw, 1rem)' }}>
                        {featuredCollection.name}
                      </h3>
                      <Link to={`/shop?collection=${featuredCollection.slug}`} className="btn-primary" style={{ width: 'fit-content', paddingTop: 'clamp(0.5rem, 1vw, 0.8rem)', paddingBottom: 'clamp(0.5rem, 1vw, 0.8rem)', paddingLeft: 'clamp(1.2rem, 2vw, 2rem)', paddingRight: 'clamp(1.2rem, 2vw, 2rem)', fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)' }}>{t('home_extended.view_collection')}</Link>
                    </div>
                  </div>
                  <div style={{ padding: 'clamp(0.5rem, 2vw, 2rem)' }}>
                    <h2 className="home-collection-title" style={{ fontSize: 'clamp(1.3rem, 4vw, 3rem)', fontWeight: '900', marginBottom: 'clamp(0.6rem, 1.5vw, 1.5rem)', lineHeight: '1.1' }}>
                      {featuredCollection.description_long || t('home_extended.editorial_title')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', lineHeight: '1.8', marginBottom: 0 }}>
                      {featuredCollection.description || 'Colección destacada del momento.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })()
      )}

      {/* Sección: Preview del Catálogo Completo */}
      <section className="container home-catalog" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
          <h2 className="home-catalog-title" style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900' }}>{t('home_extended.catalog_title')}</h2>
          <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
            {t('home_extended.view_all')} <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '340px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : homeCatalogProducts.length > 0 ? (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {homeCatalogProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            {t('home_extended.catalog_empty')}
          </div>
        )}
      </section>

      {/* Sección: Newsletter */}
      <section className="newsletter-section" style={{ padding: 'clamp(2.5rem, 8vw, 6rem) 0', borderTop: '1px solid var(--border-light)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 className="newsletter-title" style={{ fontSize: 'clamp(1.3rem, 5vw, 3rem)', fontWeight: '900', marginBottom: 'clamp(0.4rem, 1vw, 1rem)' }}>{t('home_extended.newsletter_title')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(1rem, 2.5vw, 2.5rem)', fontSize: 'clamp(0.85rem, 2vw, 1.1rem)' }}>
            {t('home_extended.newsletter_desc')}
          </p>
          {newsletterStatus === 'success' || newsletterStatus === 'already' ? (
            <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>
              {newsletterStatus === 'already' ? t('home_extended.newsletter_already') : t('home_extended.newsletter_success')}
            </p>
          ) : (
            <form style={{ display: 'flex', gap: 'clamp(0.5rem, 1vw, 1rem)', flexDirection: 'column', flexWrap: 'wrap' }} onSubmit={handleNewsletterSubmit}>
              <input 
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{ flex: 1, paddingTop: 'clamp(0.75rem, 1.5vw, 1.2rem)', paddingBottom: 'clamp(0.75rem, 1.5vw, 1.2rem)', paddingLeft: 'clamp(1rem, 1.5vw, 1.5rem)', paddingRight: 'clamp(1rem, 1.5vw, 1.5rem)', borderRadius: 'clamp(12px, 1.5vw, 16px)', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'white', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)' }}
              />
              <button type="submit" className="btn-primary" disabled={newsletterStatus === 'sending'} style={{ paddingTop: 'clamp(0.75rem, 1.5vw, 1.2rem)', paddingBottom: 'clamp(0.75rem, 1.5vw, 1.2rem)', paddingLeft: 'clamp(1.5rem, 3vw, 3rem)', paddingRight: 'clamp(1.5rem, 3vw, 3rem)', borderRadius: 'clamp(12px, 1.5vw, 16px)', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)', fontWeight: '700' }}>
                {newsletterStatus === 'sending' ? t('home_extended.newsletter_sending') : t('home_extended.newsletter_btn')}
              </button>
              {newsletterStatus === 'error' && (
                <p style={{ width: '100%', color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {t('home_extended.newsletter_error')}
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
