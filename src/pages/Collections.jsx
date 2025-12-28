import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';

const getCollections = (t) => [
    {
        id: 'anime',
        title: t('shop.cat_anime'),
        subtitle: t('collections_page.anime_sub'),
        image: '/Post/One pice/Black-onepiece-luffy.png',
        description: t('collections_page.anime_desc'),
        category: 'anime'
    },
    {
        id: 'videojuegos',
        title: t('shop.cat_videojuegos'),
        subtitle: t('collections_page.videojuegos_sub'),
        image: '/Post/HOllownaig/Blackhollow.png',
        description: t('collections_page.videojuegos_desc'),
        category: 'videojuegos'
    },
    {
        id: 'halloween',
        title: t('collections_page.halloween_title'),
        subtitle: t('collections_page.halloween_sub'),
        image: '/Post/halloween/NEGRO@2x.png',
        description: t('collections_page.halloween_desc'),
        category: 'halloween',
        featured: true
    },
    {
        id: 'deportes',
        title: t('shop.cat_deportes'),
        subtitle: t('collections_page.deportes_sub'),
        image: '/Post/futbol/Black-messi.png',
        description: t('collections_page.deportes_desc'),
        category: 'deportes'
    }
];

export default function Collections() {
    const { t } = useLanguage();
    const [activeCollection, setActiveCollection] = useState(null);
    const collections = getCollections(t);

    if (activeCollection) {
        const filteredProducts = PRODUCTS.filter(p => p.category === activeCollection.category);
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

    return (
        <div style={{ background: '#050505', color: 'white', overflowX: 'hidden' }}>
            <section style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem', background: 'radial-gradient(circle at center, #111 0%, #050505 100%)' }}>
                <div className="container">
                    <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.5em', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>{t('collections_page.archive_title')}</span>
                    <h1 style={{ fontSize: '12vw', fontWeight: '900', lineHeight: 0.8, letterSpacing: '-0.05em', margin: 0, textTransform: 'uppercase' }}>{t('collections_page.curations')}</h1>
                    <div style={{ marginTop: '3rem' }}>
                        <ChevronDown size={40} strokeWidth={1} style={{ opacity: 0.3 }} />
                    </div>
                </div>
            </section>

            <section style={{ padding: '0 0 10rem 0' }}>
                {collections.map((col, index) => (
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
                                src={col.image}
                                alt={col.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                className="collection-main-img"
                            />
                            {col.featured && (
                                <div style={{ position: 'absolute', top: '4rem', left: index % 2 === 0 ? 'auto' : '4rem', right: index % 2 === 0 ? '4rem' : 'auto', background: 'var(--primary)', color: 'black', padding: '0.5rem 1.5rem', borderRadius: '100px', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                    {t('collections_page.limited_drop')}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, padding: '0 8rem', textAlign: 'left', zIndex: 10 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{col.subtitle}</span>
                            <h2 style={{ fontSize: '5rem', fontWeight: '900', margin: '1rem 0 2rem 0', lineHeight: 0.9 }}>{col.title}</h2>
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
