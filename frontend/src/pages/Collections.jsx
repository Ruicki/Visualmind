import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';
import axiosInstance from '../api/axiosConfig';
import { isProductVisible } from '../utils/productUtils';

import { getProductImage } from '../utils/imageUtils';

const getCollections = (t) => [];

/**
 * @component Collections
 * @description Vista de gestión y navegación de colecciones de productos.
 * Renderiza dinámicamente la "Colección Destacada" de la campaña actual
 * y lista todas las colecciones disponibles.
 */
export default function Collections() {
    const { t } = useLanguage();
    const [activeCollection, setActiveCollection] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [dbCollections, setDbCollections] = useState([]);
    
    /**
     * Efecto de inicialización: carga productos y colecciones desde el backend.
     * Mapea las colecciones de la DB al formato esperado por la UI de la página.
     */
    useEffect(() => {
        // Carga de todos los productos disponibles
        axiosInstance.get('/products').then(res => {
            if (res.data?.length > 0) {
                setAllProducts(res.data);
            }
        }).catch((err) => console.error('Error cargando productos:', err));

        // Carga y mapeo de colecciones reales desde la base de datos
        axiosInstance.get('/collections').then(res => {
            if (res.data?.length > 0) {
                const mappedCols = res.data.map(col => ({
                    id: col.id,
                    title: col.name,
                    subtitle: col.is_active ? 'COLECCIÓN ACTIVA' : 'ARCHIVO',
                    image: col.image_url || '/placeholder-banner.jpg',
                    description: col.description,
                    is_active: col.is_active,
                    featured: col.is_active // Define si se muestra como destacada
                }));
                setDbCollections(mappedCols);
            }
        }).catch((err) => console.error('Error cargando colecciones:', err));
    }, []);

    if (activeCollection) {
        const filteredProducts = allProducts.filter(p => {
            if (!isProductVisible(p)) return false;
            return p.collection_id === activeCollection.id;
        });
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '120px' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '2rem' }}>
                        <button
                            onClick={() => setActiveCollection(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> {t('collections_page.back')}
                        </button>
                    </div>
                    <header style={{ marginBottom: '5rem' }}>
                        <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '1rem' }}>{activeCollection.title}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px' }}>{activeCollection.description}</p>
                    </header>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '3rem', paddingBottom: '100px' }}>
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const featuredCol = dbCollections.find(c => c.is_active);
    const featuredProducts = featuredCol ? allProducts.filter(p => p.collection_id === featuredCol.id && isProductVisible(p)).slice(0, 4) : [];

    return (
        <div style={{ background: '#050505', color: 'white', overflowX: 'hidden' }}>
            {/* Featured Collection Section (High Impact) */}
            {featuredCol ? (
                <section style={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    padding: '120px 0 6rem 0',
                    background: 'radial-gradient(circle at 70% 30%, #1a1a1a 0%, #050505 70%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div className="container">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                            <div className="reveal visible">
                                <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.4em', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>
                                    {t('collections_page.active_drop') || 'ACTIVE DROP'}
                                </span>
                                <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: '900', lineHeight: 0.9, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: '2rem' }}>
                                    {featuredCol.title}
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '500px', marginBottom: '3rem', lineHeight: 1.6 }}>
                                    {featuredCol.description}
                                </p>
                                <button 
                                    onClick={() => setActiveCollection(featuredCol)}
                                    className="btn-primary" 
                                    style={{ padding: '1.2rem 3rem', borderRadius: '100px', fontSize: '1.1rem' }}
                                >
                                    EXPLORAR COLECCIÓN <ArrowRight size={20} style={{ marginLeft: '0.8rem' }} />
                                </button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {featuredProducts.map((p, i) => (
                                    <div key={p.id} style={{ transform: `translateY(${i % 2 === 0 ? '0' : '40px'})` }}>
                                        <ProductCard {...p} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Background Text Decor */}
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '-5%', 
                        right: '-5%', 
                        fontSize: '20vw', 
                        fontWeight: '900', 
                        color: 'rgba(255,255,255,0.02)', 
                        pointerEvents: 'none',
                        zIndex: 0,
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase'
                    }}>
                        {featuredCol.title}
                    </div>
                </section>
            ) : (
                <section style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem', background: 'radial-gradient(circle at center, #111 0%, #050505 100%)' }}>
                    <div className="container">
                        <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.5em', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>{t('collections_page.archive_title')}</span>
                        <h1 style={{ fontSize: 'clamp(3rem, 12vw, 10rem)', fontWeight: '900', lineHeight: 0.8, letterSpacing: '-0.05em', margin: 0, textTransform: 'uppercase' }}>{t('collections_page.curations')}</h1>
                        <div style={{ marginTop: '3rem' }}>
                            <ChevronDown size={40} strokeWidth={1} style={{ opacity: 0.3 }} />
                        </div>
                    </div>
                </section>
            )}

            <section style={{ padding: '6rem 0 10rem 0' }}>
                <div className="container" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>ARCHIVO COMPLETO</h2>
                </div>
                {dbCollections.filter(c => c.id !== featuredCol?.id).map((col, index) => (
                    <div
                        key={col.id}
                        onClick={() => setActiveCollection(col)}
                        style={{
                            position: 'relative',
                            height: '90vh',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                            alignItems: 'center',
                            marginBottom: '10rem'
                        }}
                        className="collection-row"
                    >
                        <div style={{ flex: 1.2, height: '100%', overflow: 'hidden', position: 'relative' }}>
                            <img
                                src={getProductImage(null, col.image)}
                                alt={col.title}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                className="collection-main-img"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-banner.jpg'; }}
                            />
                            {col.featured && (
                                <div style={{ position: 'absolute', top: '4rem', left: index % 2 === 0 ? 'auto' : '4rem', right: index % 2 === 0 ? '4rem' : 'auto', background: 'var(--primary)', color: 'black', padding: '0.5rem 1.5rem', borderRadius: '100px', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                    {t('collections_page.limited_drop')}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, padding: '0 8rem', textAlign: 'left', zIndex: 10 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{col.subtitle}</span>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', fontWeight: '900', margin: '1rem 0 2rem 0', lineHeight: 0.9 }}>{col.title}</h2>
                            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '3rem', maxWidth: '400px' }}>
                                {col.description}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>
                                {t('collections_page.view_archive')} <ArrowRight size={20} color="var(--primary)" />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <style>{`
                .collection-row:hover .collection-main-img {
                    transform: scale(1.05);
                }
                @media (max-width: 1024px) {
                    .collection-row {
                        flex-direction: column !important;
                        height: auto !important;
                        margin-bottom: 5rem !important;
                    }
                    .collection-row div {
                        padding: 3rem 1.5rem !important;
                        text-align: center !important;
                    }
                    .collection-row h2 {
                        font-size: 3rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
