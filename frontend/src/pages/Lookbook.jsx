import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS } from '../data/products';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Lookbook() {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const editorialImages = [
        { url: PRODUCTS.find(p => p.id === 'op-luffy')?.image, title: t('lookbook.look1'), size: 'large' },
        { url: PRODUCTS.find(p => p.id === 'hal-classic')?.colors?.[1]?.image, title: t('lookbook.look2'), size: 'small' },
        { url: PRODUCTS.find(p => p.id === 'dep-messi')?.image, title: t('lookbook.look3'), size: 'medium' },
        { url: PRODUCTS.find(p => p.id === 'vg-hollow')?.image, title: t('lookbook.look4'), size: 'large' },
        { url: PRODUCTS.find(p => p.id === 'jjk-gojo')?.image, title: t('lookbook.look5'), size: 'small' },
        { url: PRODUCTS.find(p => p.id === 'sv-pucca')?.image, title: t('lookbook.look6'), size: 'medium' }
    ].filter(item => item.url); // Safety check: only show items with valid image URLs

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
