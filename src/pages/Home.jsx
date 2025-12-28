import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/products';
import { ChevronRight, ChevronLeft, ArrowRight, Star, Clock, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function Home() {
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);

    const featuredProducts = PRODUCTS.slice(0, 5);
    const seasonalProducts = PRODUCTS.filter(p => p.category === 'halloween' || p.category === 'fiestas_patrias').slice(0, 4);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featuredProducts.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            <Hero />

            {/* Featured Carousel Section */}
            <section className="container" style={{ padding: '8rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <span style={{ color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.9rem' }}>{t('home_extended.featured_drops')}</span>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginTop: '1rem' }}>{t('home_extended.signature_pieces')}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={prevSlide} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextSlide} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', height: '600px', overflow: 'hidden', borderRadius: '40px' }}>
                    {featuredProducts.map((product, index) => (
                        <div
                            key={product.id}
                            style={{
                                position: 'absolute', inset: 0, opacity: index === currentSlide ? 1 : 0,
                                transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: `scale(${index === currentSlide ? 1 : 1.1})`,
                                padding: '4rem', display: 'flex', alignItems: 'center',
                                background: 'linear-gradient(45deg, #0a0a0a 20%, transparent 100%)'
                            }}
                        >
                            <img
                                src={product.image}
                                alt={product.title}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
                            />
                            <div style={{ maxWidth: '600px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '1.5rem' }}>
                                    <Zap size={20} fill="var(--primary)" /> {t('home_extended.exclusive_release')}
                                </div>
                                <h3 style={{ fontSize: '4.5rem', fontWeight: '900', lineHeight: '1', marginBottom: '1.5rem' }}>{product.title}</h3>
                                <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)', marginBottom: '3rem', lineHeight: '1.6' }}>
                                    {t('home_extended.desc_prefix')} {product.category} {t('home_extended.desc_suffix')}
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <Link to={`/product/${product.id}`} className="btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '16px' }}>
                                        {t('home_extended.btn_explore')}
                                    </Link>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>${product.price}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>{t('home_extended.limited_stock')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: '3rem', right: '4rem', display: 'flex', gap: '0.8rem' }}>
                        {featuredProducts.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                style={{
                                    width: i === currentSlide ? '40px' : '10px', height: '10px',
                                    borderRadius: '10px', background: i === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                    cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Seasonal Limited Drop Section */}
            <section className="reveal theme-halloween" style={{ background: 'var(--bg-secondary)', padding: '10rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.8rem 1.5rem', borderRadius: '100px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            <Clock size={18} /> {t('home_extended.limited_time_drop')}
                        </div>
                        <h2 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '1.5rem' }}>{t('home_extended.seasonal_specials')}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                            {t('home_extended.seasonal_desc')}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                        {seasonalProducts.map(product => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '6rem' }}>
                        <Link to="/shop?filter=halloween" className="flex-center" style={{ gap: '0.8rem', color: 'white', fontWeight: '700', textDecoration: 'none', fontSize: '1.1rem' }}>
                            {t('home_extended.view_full_drop')} <ArrowRight size={22} color="var(--primary)" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Lookbook Interactivo - Asymmetrical Grid */}
            <section className="reveal" style={{ padding: '10rem 0', background: '#000' }}>
                <div className="container">
                    <div style={{ marginBottom: '6rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.9rem' }}>{t('home_extended.visual_experience')}</span>
                            <h2 style={{ fontSize: '4.5rem', fontWeight: '900', marginTop: '1rem', letterSpacing: '-0.02em' }}>{t('home_extended.the_lookbook')}</h2>
                        </div>
                        <Link to="/collections" style={{ color: 'white', textDecoration: 'none', fontWeight: '700', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>{t('home_extended.view_narratives')}</Link>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gridAutoRows: 'minmax(100px, auto)',
                        gap: '2rem'
                    }}>
                        {/* Big Card */}
                        <div className="slow-zoom" style={{ gridColumn: '1 / 8', gridRow: '1 / 6', borderRadius: '40px', overflow: 'hidden', position: 'relative', minHeight: '500px' }}>
                            <img src={seasonalProducts[0]?.image} alt="Look 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '3rem', left: '3rem', zIndex: 10 }}>
                                <span style={{ background: 'var(--primary)', color: 'black', padding: '0.5rem 1.5rem', borderRadius: '100px', fontWeight: '900', fontSize: '0.8rem' }}>{t('home_extended.style_01')}</span>
                                <h4 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginTop: '1rem' }}>{t('home_extended.seasonal_aura')}</h4>
                            </div>
                        </div>

                        {/* Middle Cards */}
                        <div className="reveal slow-zoom" style={{ gridColumn: '8 / 13', gridRow: '1 / 4', borderRadius: '40px', overflow: 'hidden', minHeight: '300px' }}>
                            <img src={featuredProducts[2]?.image} alt="Look 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="reveal slow-zoom" style={{ gridColumn: '8 / 13', gridRow: '4 / 7', borderRadius: '40px', overflow: 'hidden', minHeight: '300px' }}>
                            <img src={featuredProducts[3]?.image} alt="Look 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        {/* Bottom Fullish Card */}
                        <div className="reveal slow-zoom" style={{ gridColumn: '1 / 6', gridRow: '6 / 9', borderRadius: '40px', overflow: 'hidden', minHeight: '300px' }}>
                            <img src={featuredProducts[4]?.image} alt="Look 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="reveal" style={{ gridColumn: '6 / 8', gridRow: '6 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                            <p style={{ fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: '300' }}>
                                {t('home_extended.quote')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Essence / Manifesto */}
            <section style={{ padding: '15rem 0', background: 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)', position: 'relative', overflow: 'hidden' }}>
                <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div className="reveal">
                        <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: '2rem', display: 'block' }}>{t('home_extended.since')}</span>
                        <h2 style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: '900', lineHeight: 1.1, marginBottom: '4rem' }}>
                            {t('home_extended.digital_heritage_1')} <br />
                            <span className="text-gradient">{t('home_extended.digital_heritage_2')}</span>
                        </h2>
                        <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.6)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}>
                            {t('home_extended.about_text')}
                        </p>
                        <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
                            <div>
                                <h5 style={{ fontSize: '3rem', fontWeight: '900', color: 'white' }}>100%</h5>
                                <p style={{ color: 'var(--primary)', fontWeight: '700' }}>{t('home_extended.stat_1')}</p>
                            </div>
                            <div>
                                <h5 style={{ fontSize: '3rem', fontWeight: '900', color: 'white' }}>LIMITED</h5>
                                <p style={{ color: 'var(--primary)', fontWeight: '700' }}>{t('home_extended.stat_2')}</p>
                            </div>
                            <div>
                                <h5 style={{ fontSize: '3rem', fontWeight: '900', color: 'white' }}>GLOBAL</h5>
                                <p style={{ color: 'var(--primary)', fontWeight: '700' }}>{t('home_extended.stat_3')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Refined */}
            <section style={{ padding: '10rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem' }}>{t('home_extended.join_universe')}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4rem', fontSize: '1.2rem' }}>{t('home_extended.join_text')}</p>
                    <form style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            style={{ flex: 1, padding: '1.5rem 2rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'white', fontSize: '1.1rem' }}
                        />
                        <button className="btn-primary" style={{ padding: '0 3rem', borderRadius: '16px', fontWeight: '700' }}>{t('home_extended.subscribe')}</button>
                    </form>
                </div>
            </section>
        </div>
    );
}
