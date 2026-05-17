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
import { AlignCenter, ArrowRight, ChevronLeft, ChevronRight, Clock, Radius, Zap } from 'lucide-react';
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEvents, setActiveEvents] = useState([]);
  const [featuredCollection, setFeaturedCollection] = useState(null);
  const [campaignFeaturedProducts, setCampaignFeaturedProducts] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Efecto de Carga de Datos Inicial
   * @description Realiza peticiones concurrentes para minimizar el tiempo de carga.
   * Prioriza temporadas sobre campañas para el banner dinámico.
   */
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [productsRes, campaignRes, collectionsRes] = await Promise.all([
          axiosInstance.get('/products'),
          axiosInstance.get('/campaigns/active-all').catch(() => ({ data: [] })),
          axiosInstance.get('/collections').catch(() => ({ data: [] }))
        ]);
        
        if (productsRes.data && productsRes.data.length > 0) {
          setProducts(productsRes.data);
        }

        if (collectionsRes.data && collectionsRes.data.length > 0) {
          const activeCollections = collectionsRes.data.filter(c => c.is_active);
          if (activeCollections.length > 0) {
            console.log('[DEBUG] Featured collection loaded:', activeCollections[0]);
            console.log('[DEBUG] accent_color:', activeCollections[0].accent_color);
            setFeaturedCollection(activeCollections[0]);
          }
        }

        // Campañas activas, prelaunch y upcoming
        if (campaignRes.data && Array.isArray(campaignRes.data) && campaignRes.data.length > 0) {
          setActiveEvents(campaignRes.data);

          // Cada campaña activa tiene SUS PROPIOS slots destacados
          const activeCampaigns = campaignRes.data.filter(e => e.phase === 'active');
          if (activeCampaigns.length > 0) {
            const campaignSlotsPromises = activeCampaigns.map(c =>
              axiosInstance.get(`/featured-products?campaign_id=${c.id}`)
                .then(res => ({ campaignId: c.id, products: res.data }))
                .catch(() => ({ campaignId: c.id, products: [] }))
            );
            const results = await Promise.all(campaignSlotsPromises);
            const campaignProductsMap = {};
            results.forEach(r => { campaignProductsMap[r.campaignId] = r.products; });
            setCampaignFeaturedProducts(campaignProductsMap);
          }
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

  const activeCampaigns = React.useMemo(() => {
    return activeEvents.filter(e => e.phase === 'active');
  }, [activeEvents]);

  const prelaunchCampaigns = React.useMemo(() => {
    return activeEvents.filter(e => e.phase === 'prelaunch' || e.phase === 'upcoming');
  }, [activeEvents]);

  // Productos de la colección destacada (para template hero)
  const collectionProducts = React.useMemo(() => {
    if (!featuredCollection) return [];
    return availableProducts.filter(p => p.collection_id === featuredCollection.id).slice(0, 2);
  }, [availableProducts, featuredCollection]);

  // Productos destacados por prioridad (para el grid de lanzamientos)
  const featuredProducts = React.useMemo(() => {
    const byPriority = availableProducts.filter(p => (p.priority || 0) > 5).slice(0, 8);
    return byPriority.length > 0 ? byPriority : availableProducts.slice(0, 8);
  }, [availableProducts]);

  // Auto-slide para carrusel de destacados
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

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

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <SEO 
        title={t('nav.home') || "Inicio"} 
        description="Visualmind - Tu tienda de moda premium con las últimas tendencias y colecciones exclusivas."
      />

      <Hero events={activeCampaigns} />

      {/* ─── Lanzamientos Destacados ──────────────────────────────────────────────── */}
        <section className="home-featured" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 'clamp(150px, 20vw, 400px)', height: 'clamp(150px, 20vw, 400px)', borderRadius: '50%', background: 'var(--primary)', opacity: '0.03', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 'clamp(150px, 20vw, 400px)', height: 'clamp(150px, 20vw, 400px)', borderRadius: '50%', background: 'var(--primary)', opacity: '0.03', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: 'linear-gradient(to bottom, var(--primary), transparent)', borderRadius: '2px' }} />
                <div>
                  <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', background: 'linear-gradient(135deg, #fff 30%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    {t('home_extended.featured_title') || 'Lanzamientos Destacados'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1vw, 0.9rem)', margin: '0.2rem 0 0' }}>Lo más buscado de la temporada</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
                  {t('home_extended.view_all')} <ArrowRight size={20} />
                </Link>
                {featuredProducts.length > 1 && (<><button onClick={() => setCurrentSlide(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                  style={{ background: 'var(--bg-card)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginLeft: '0.5rem' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentSlide(prev => (prev + 1) % featuredProducts.length)}
                  style={{ background: 'var(--bg-card)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                  <ChevronRight size={18} />
                </button></>)}
              </div>
            </div>
            <div style={{ overflow: 'hidden', borderRadius: '16px', position: 'relative', width: '100%', minHeight: '300px' }}>
              {featuredProducts.length > 0 ? (
                <Link to={`/product/${featuredProducts[currentSlide]?.id}`} style={{ display: 'block', position: 'relative', height: 'clamp(300px, 40vw, 500px)', background: '#111', textDecoration: 'none' }}>
                  <img src={featuredProducts[currentSlide]?.image_url || FALLBACK_IMG} alt={featuredProducts[currentSlide]?.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(1.5rem, 4vw, 4rem)' }}>
                    <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', fontWeight: '900', marginBottom: '0.3rem', color: 'white' }}>{featuredProducts[currentSlide]?.title}</h3>
                    {featuredProducts[currentSlide]?.price && (
                      <p style={{ color: 'white', fontWeight: '700', fontSize: 'clamp(1rem, 2vw, 1.4rem)' }}>
                        ${Number(featuredProducts[currentSlide].price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No hay productos destacados
                </div>
              )}
            </div>
            {featuredProducts.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                {featuredProducts.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    style={{ width: i === currentSlide ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === currentSlide ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.3s', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>
        </section>

      {/* ─── Próximos Lanzamientos ──────────────────────────────────────────────── */}
      {prelaunchCampaigns.length > 0 && (
        <section style={{ padding: 'clamp(2.5rem, 6vw, 4rem) 0' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: `linear-gradient(to bottom, ${prelaunchCampaigns[0]?.accent_color || '#facc15'}, transparent)`, borderRadius: '2px' }} />
              <div>
                <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', background: `linear-gradient(135deg, #fff 30%, ${prelaunchCampaigns[0]?.accent_color || '#facc15'} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                  {t('home_extended.upcoming_title') || 'Próximos Lanzamientos'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1vw, 0.9rem)', margin: '0.2rem 0 0' }}>Las colecciones que están por llegar</p>
              </div>
            </div>
          </div>
      {prelaunchCampaigns.map((campaign, idx) => {
        const overlaySide = idx % 2 === 0 ? 'to right' : 'to left';
        const textSide = idx % 2 === 0 ? 'flex-start' : 'flex-end';
        const textAlign = idx % 2 === 0 ? 'left' : 'right';
        return (
          <section key={campaign.id} className="home-seasonal" style={{ position: 'relative', height: 'clamp(350px, 50vw, 600px)', overflow: 'hidden', background: campaign.accent_color || '#111' }}>
            {campaign.banner_url ? (
              <img src={campaign.banner_url} alt={campaign.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${campaign.accent_color||'#1a1a2e'},#000)` }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${overlaySide}, rgba(0,0,0,0.85) 0%, transparent 60%)` }} />
            <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: textSide }}>
              <div style={{ maxWidth: '500px', textAlign }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: campaign.accent_color ? `${campaign.accent_color}26` : 'rgba(250,204,21,0.15)', padding: '0.4rem 1rem', borderRadius: '100px', color: campaign.accent_color || '#facc15', fontWeight: '700', fontSize: 'clamp(0.7rem,1.2vw,0.85rem)', marginBottom: 'clamp(0.6rem,1vw,1.2rem)', backdropFilter: 'blur(10px)' }}>
                  <Clock size={14} />
                  {campaign.start_date ? (
                    (() => {
                      const diff = new Date(campaign.start_date) - now;
                      if (diff <= 0) return campaign.phase === 'prelaunch' ? (t('home_extended.pre_order_badge')||'Pre-Venta') : (t('home_extended.upcoming_badge')||'Proximamente');
                      const d = Math.floor(diff / 86400000);
                      const h = Math.floor((diff % 86400000) / 3600000);
                      const m = Math.floor((diff % 3600000) / 60000);
                      const s = Math.floor((diff % 60000) / 1000);
                      return `${d}d ${h}h ${m}m ${s}s`;
                    })()
                  ) : (
                    campaign.phase === 'prelaunch' ? (t('home_extended.pre_order_badge')||'Pre-Venta') : (t('home_extended.upcoming_badge')||'Proximamente')
                  )}
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem,5vw,3.5rem)', fontWeight: '900', marginBottom: 'clamp(0.4rem,1vw,1rem)' }}>{campaign.name}</h2>
                {campaign.description && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.85rem,1.5vw,1.1rem)', marginBottom: 'clamp(0.8rem,1.5vw,1.5rem)', lineHeight: 1.6 }}>{campaign.description}</p>}
                {campaign.start_date && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t('home_extended.upcoming_desc')}: {new Date(campaign.start_date).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>}
                {campaign.phase === 'prelaunch' && (
                  <Link to={campaign.button_link||'/shop'} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2.5rem', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', background: campaign.accent_color || 'var(--primary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = campaign.accent_color ? `${campaign.accent_color}cc` : 'var(--primary-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = campaign.accent_color || 'var(--primary)'; }}
                    onClick={async (e) => {
                      if (!campaign.pre_order_enabled) return;
                      e.preventDefault();
                      try { await axiosInstance.post('/orders/pre-order', { campaign_id: campaign.id }); alert('Pre-orden registrada!'); }
                      catch (err) { if (err.response?.status===401) { window.location.href='/login?redirect=/'; } else { alert('Error al crear pre-orden.'); } }
                    }}
                  >
                    {t('home_extended.pre_order_btn')||'Reservar Ya'}
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      })}
        </section>
      )}

      {/* Sección: Colección Destacada (con soporte de 3 templates) */}
      {featuredCollection && (
        (() => {
          const tmpl = featuredCollection.template_type || 'editorial';
          const colAccent = featuredCollection.accent_color || '#a855f7';
          console.log('[DEBUG] Rendering collection with accent_color:', colAccent, 'from:', featuredCollection.accent_color);
          if (tmpl === 'hero') {
            const leftImg = collectionProducts[0]?.image_url || featuredCollection.image_url || FALLBACK_IMG;
            const rightImg = collectionProducts[1]?.image_url || featuredCollection.image_url || FALLBACK_IMG;
            return (
              <section style={{ position: 'relative', width: '100%', background: 'var(--bg-primary)' }}>
                <div style={{ textAlign: 'center', padding: 'clamp(1rem, 4vw, 3rem) 1rem 1.5rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: `linear-gradient(to bottom, ${colAccent}, transparent)`, borderRadius: '2px' }} />
                    <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 2.2rem)', fontWeight: '900', background: `linear-gradient(135deg, #fff 30%, ${colAccent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                      {t('home_extended.exclusive_collection') || 'Colecciones Exclusivas'}
                    </h2>
                  </div>
                  <div style={{ width: '1400px', height: '3px', background: `linear-gradient(90deg, ${colAccent}, transparent)`, borderRadius: '2px', margin: '0.75rem auto 0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', height: 'clamp(350px, 50vh, 550px)' }}>
                  <div style={{ width: '50%', position: 'relative' }}>
                    <img src={leftImg} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  </div>
                  <div style={{ width: '50%', position: 'relative', overflow: 'hidden' }}>
                    <img src={rightImg} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '50px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(2rem, 4vw, 2rem)', pointerEvents: 'none' }}>
                  <div style={{
                    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    background: 'rgba(2, 6, 23, 0.55)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: 'clamp(1.2rem, 2vw, 2rem) clamp(2rem, 4vw, 3.5rem)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
                  }}>
                    <h2 style={{ color: 'white', fontSize: 'clamp(1.5rem, 3vw, 3rem)', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: '1', margin: '0 0 1.25rem' }}>
                      {featuredCollection.name}
                    </h2>
                    <Link to={`/shop?collection=${featuredCollection.slug}`} style={{ background: colAccent, color: 'white', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 2.5rem', fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${colAccent}cc`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = colAccent; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      {t('home_extended.view_all') || 'Shop'}
                    </Link>
                  </div>
                </div>
              </section>
            );
          }
          if (tmpl === 'grid') {
            return (
              <section className="home-collection-grid" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 'clamp(200px, 30vw, 500px)', height: 'clamp(200px, 30vw, 500px)', borderRadius: '50%', background: `${colAccent}08`, filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div className="container" style={{ position: 'relative' }}>
                   <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                     <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: `linear-gradient(to bottom, ${colAccent}, transparent)`, borderRadius: '2px' }} />
                     <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', background: `linear-gradient(135deg, #fff 30%, ${colAccent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                       Colecciones Exclusivas
                     </h2>
                   </div>
                   <div style={{ width: '1180px', height: '3px', background: `linear-gradient(90deg, ${colAccent}, transparent)`, borderRadius: '2px', margin: '2rem auto 1rem' }} />
                     <h2 style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)', fontWeight: '900', margin: '0.5rem 0', background: `linear-gradient(135deg, #fff 40%, ${colAccent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{featuredCollection.name}</h2>
                     <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)', lineHeight: '1.8', marginBottom: '1rem' }}>
                       {featuredCollection.description || 'Colección destacada del momento.'}
                     </p>
                   </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {[
                      { label: 'Edición Limitada', icon: '◆' },
                      { label: 'Edición Limitada', icon: '◆' },
                      { label: 'Edición Limitada', icon: '◆' },
                      { label: 'Edición Limitada', icon: '◆' }
                    ].map((item, i) => (
                      <Link key={i} to={`/shop?collection=${featuredCollection.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-card)', transition: 'all 0.4s', border: '1px solid rgba(255,255,255,0.03)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                          <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
                            <img src={featuredCollection.image_url || FALLBACK_IMG} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.08)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
                              <span style={{ fontSize: '1.2rem', marginBottom: '0.3rem', display: 'block' }}>{item.icon}</span>
                              <p style={{ color: 'white', fontWeight: '700', fontSize: 'clamp(0.8rem, 1.2vw, 0.95rem)', margin: 0 }}>{item.label}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    {featuredCollection.description_long && (
                      <p style={{ color: 'var(--text-secondary)', opacity: 0.8, fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', lineHeight: '1.7', marginBottom: '2rem' }}>
                        {featuredCollection.description_long}
                      </p>
                    )}
                    <Link to={`/shop?collection=${featuredCollection.slug}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2.5rem', borderRadius: '100px', fontWeight: '800', fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)' }}>
                      {t('home_extended.view_collection')} <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </section>
            );
          }
          // editorial (default) — lookbook con más presencia
          return (
            <section className="home-collection" style={{ background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 'clamp(200px, 30vw, 500px)', height: 'clamp(200px, 30vw, 500px)', borderRadius: '50%', background: `${colAccent}08`, filter: 'blur(80px)', pointerEvents: 'none' }} />
              <div className="container" style={{ position: 'relative' }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
                  <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: `linear-gradient(to bottom, ${colAccent}, transparent)`, borderRadius: '2px' }} />
                  <div>
                    <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', background: `linear-gradient(135deg, #fff 30%, ${colAccent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                      Colecciones Exclusivas
                    </h2>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'clamp(1.5rem, 3vw, 3rem)',
                  alignItems: 'center'
                }}>
                  <div className="home-lookbook-img" style={{ position: 'relative', borderRadius: 'clamp(20px, 2.5vw, 28px)', overflow: 'hidden', height: 'clamp(320px, 55vw, 650px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                    <img src={featuredCollection.image_url || FALLBACK_IMG} alt={featuredCollection.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />
                  </div>
                  <div style={{ padding: 'clamp(0.5rem, 2vw, 2.5rem)' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', margin: '0 0 1rem', lineHeight: '1.1', background: `linear-gradient(135deg, #fff 40%, ${colAccent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {featuredCollection.name}
                    </h2>
                    <span style={{ color: colAccent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: 'clamp(0.65rem, 1.3vw, 0.8rem)', marginBottom: '0.5rem', display: 'block' }}>
                      Colección Exclusiva
                    </span>
                    <div style={{ width: '60px', height: '3px', background: colAccent, borderRadius: '2px', marginBottom: '1.5rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)', lineHeight: '1.8', marginBottom: '1rem' }}>
                      {featuredCollection.description || 'Colección destacada del momento.'}
                    </p>
                    <div style={{ width: '60px', height: '3px', background: colAccent, borderRadius: '2px', marginBottom: '1.5rem' }} />
                    {featuredCollection.description_long && (
                      <p style={{ color: 'var(--text-secondary)', opacity: 0.8, fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', lineHeight: '1.7', marginBottom: '2rem' }}>
                        {featuredCollection.description_long}
                      </p>
                    )}
                    <Link to={`/shop?collection=${featuredCollection.slug}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2.5rem', borderRadius: '100px', fontWeight: '800', fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)' }}>
                      {t('home_extended.view_collection')} <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })()
      )}

      {/* Sección: Preview del Catálogo Completo */}
      <section className="container home-catalog" style={{ padding: 'clamp(2.5rem, 6vw, 6rem) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: 'linear-gradient(to bottom, #06b6d4, transparent)', borderRadius: '2px' }} />
            <div>
              <h2 className="home-catalog-title" style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', fontWeight: '900', margin: 0, background: 'linear-gradient(135deg, #fff 30%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('home_extended.catalog_title')}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1vw, 0.9rem)', margin: '0.2rem 0 0' }}>Explora todo nuestro catálogo</p>
            </div>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: 'clamp(0.4rem, 1vw, 1rem)' }}>
            <div style={{ width: '4px', height: 'clamp(1.8rem, 3vw, 3rem)', background: 'linear-gradient(to bottom, #f43f5e, transparent)', borderRadius: '2px' }} />
            <h2 className="newsletter-title" style={{ fontSize: 'clamp(1.5rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, background: 'linear-gradient(135deg, #fff 30%, #f43f5e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('home_extended.newsletter_title') || 'No te pierdas nada'}</h2>
          </div>
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
