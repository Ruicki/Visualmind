import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { Sparkles, Clock, Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/products';
import axiosInstance from '../api/axiosConfig';
import { isProductVisible } from '../utils/productUtils';

/**
 * @component NewArrivals
 * @description Sección de novedades de la tienda.
 * Filtra y muestra automáticamente los productos marcados como "new"
 * o con fechas de creación recientes para destacar los últimos lanzamientos.
 */
export default function NewArrivals() {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [allProducts, setAllProducts] = useState(PRODUCTS);

    useEffect(() => {
        setIsVisible(true);
        axiosInstance.get('/products').then(res => {
            if (res.data?.length > 0) {
                setAllProducts(res.data);
            }
        }).catch(() => {});
    }, []);

    // Filter logic for drops (Utilizando utilidad centralizada)
    const availableProducts = allProducts.filter(isProductVisible);

    const freshNew = availableProducts.filter(p => p.isNew || p.new_arrival || p.priority > 3).slice(0, 12);

    return (
        <div style={{ background: '#050505', minHeight: '100vh', paddingTop: '140px', color: 'white' }}>
            <main className="container">
                {/* Dynamic Header */}
                <section style={{
                    textAlign: 'center',
                    marginBottom: '8rem',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.2rem', borderRadius: '100px', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.2em', marginBottom: '2rem' }}>
                        <Zap size={16} fill="var(--primary)" /> {t('new_arrivals_page.seasonal_active')}
                    </div>
                    <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: '900', lineHeight: 0.9, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: '2rem' }}>
                        Next <br />
                        <span className="text-gradient">Generation</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                        {t('new_arrivals_page.desc')}
                    </p>
                </section>

                {/* Fresh New Section */}
                <section style={{ marginBottom: '12rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900' }}>{t('new_arrivals_page.fresh_in')}</h2>
                        <div style={{ height: '1px', flex: 1, background: 'var(--border-light)', margin: '0 3rem', opacity: 0.3 }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{freshNew.length} {t('new_arrivals_page.items')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '3rem' }}>
                        {freshNew.map(product => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </section>

                {/* Coming Soon Teaser */}
                <section className="reveal" style={{ padding: '8rem 0', textAlign: 'center' }}>
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.4em' }}>{t('new_arrivals_page.coming_soon')}</span>
                        <h3 style={{ fontSize: '3rem', fontWeight: '900', marginTop: '1.5rem', marginBottom: '2rem' }}>{t('new_arrivals_page.winter_series')}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>
                            {t('new_arrivals_page.winter_desc')}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem' }}>30</div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem' }}>12</div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem' }}>45</div>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .drop-card:hover {
                    transform: translateY(-15px);
                }
                @keyframes reveal {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
