import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/products';
import axiosInstance from '../api/axiosConfig';
import { isProductVisible } from '../utils/productUtils';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * @component Lookbook
 * @description Galería visual inspiracional.
 * Muestra el contenido estético de las campañas actuales mediante un layout
 * de grid dinámico y animaciones de Framer Motion.
 */
export default function Lookbook() {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    const [editorialImages, setEditorialImages] = useState([]);

    useEffect(() => {
        setIsVisible(true);
        axiosInstance.get('/products').then(res => {
            if (res.data?.length > 0) {
                // Filter visible products and pick some for the lookbook
                const visible = res.data.filter(isProductVisible);
                const items = visible.slice(0, 6).map((p, index) => ({
                    url: p.image || p.image_url,
                    title: p.title,
                    size: index % 3 === 0 ? 'large' : (index % 3 === 1 ? 'small' : 'medium')
                }));
                setEditorialImages(items);
            }
        }).catch(() => {});
    }, []);

    return (
        <div style={{ background: '#000', minHeight: '100vh', paddingTop: '120px', paddingBottom: '100px', color: 'white' }}>
            <div className="container">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '800', marginBottom: '3rem', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
                    <ArrowLeft size={18} /> {t('lookbook.back')}
                </Link>

                <header style={{
                    marginBottom: '8rem',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 1s ease-out'
                }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.5em', textTransform: 'uppercase', fontSize: '0.9rem' }}>{t('lookbook.editorial')}</span>
                    <h1 style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', fontWeight: '900', lineHeight: 0.9, letterSpacing: '-0.04em', margin: '1rem 0 3rem 0' }}>
                        {t('lookbook.the')} <br />
                        <span className="text-gradient">{t('lookbook.chronicles')}</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', maxWidth: '500px' }}>
                        {t('lookbook.subtitle')}
                    </p>
                </header>

                <div className="lookbook-grid">
                    {editorialImages.map((img, index) => (
                        <div key={index} className="lookbook-item" style={{
                            breakInside: 'avoid',
                            marginBottom: '2rem',
                            position: 'relative',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }}>
                            <img
                                src={img.url}
                                alt={img.title}
                                style={{ width: '100%', display: 'block', transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                className="lookbook-img"
                            />
                            <div className="lookbook-overlay" style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
                                padding: '2rem',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'space-between',
                                opacity: 0,
                                transition: 'opacity 0.4s'
                            }}>
                                <span style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{img.title}</span>
                                <Maximize2 size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .lookbook-grid {
                    column-count: 3;
                    column-gap: 2rem;
                }
                .lookbook-item:hover .lookbook-img {
                    transform: scale(1.05);
                }
                .lookbook-item:hover .lookbook-overlay {
                    opacity: 1;
                }
                @media (max-width: 1024px) {
                    .lookbook-grid {
                        column-count: 2;
                    }
                }
                @media (max-width: 768px) {
                    .lookbook-grid {
                        column-count: 1;
                    }
                }
            `}</style>
        </div>
    );
}
