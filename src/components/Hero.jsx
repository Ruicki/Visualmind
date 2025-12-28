import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <header style={{
            paddingTop: '140px',
            paddingBottom: '80px',
            minHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }} className="container" id="lookbook">

            {/* Background Glow Effect */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)',
                zIndex: -1,
                pointerEvents: 'none'
            }}></div>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '100px',
                    color: '#60a5fa',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1.5rem'
                }}>
                    {t('hero.badge')}
                </div>

                <h1 style={{
                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                    marginBottom: '1.5rem',
                    lineHeight: '1.1'
                }}>
                    {t('hero.title')} <br />
                    <span className="text-gradient">Visualmind</span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    {t('hero.subtitle')}
                </p>

                <div className="flex-center" style={{ gap: '1.5rem' }}>
                    <Link to="/shop" className="btn-primary flex-center" style={{ gap: '0.5rem', textDecoration: 'none' }}>
                        {t('hero.btn_shop')} <ArrowRight size={20} />
                    </Link>

                    <Link to="/lookbook" style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid var(--border-light)',
                        borderRadius: '9999px',
                        color: 'white',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        textDecoration: 'none'
                    }}
                        onMouseEnter={(e) => { e.target.style.borderColor = 'white'; }}
                        onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-light)'; }}
                    >
                        {t('hero.btn_lookbook')}
                    </Link>
                </div>
            </div>
        </header>
    );
}
