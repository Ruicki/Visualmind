import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ activeCampaign }) {
    const { t } = useLanguage();

    const heroStyle = activeCampaign ? {
        paddingTop: '30px',
        paddingBottom: '80px',
        minHeight: 'calc(80vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: activeCampaign.banner_url ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${activeCampaign.banner_url})` : 'var(--bg-primary)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    } : {
        paddingTop: '60px',
        paddingBottom: '80px',
        minHeight: 'calc(90vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <header style={heroStyle} className={activeCampaign ? "" : "container"} id="lookbook">

            {/* Background Glow Effect (only if no banner) */}
            {!activeCampaign?.banner_url && (
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${activeCampaign?.accent_color || 'rgba(59,130,246,0.15)'} 0%, rgba(0,0,0,0) 70%)`,
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>
            )}

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '0 2rem' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: activeCampaign?.accent_color ? `${activeCampaign.accent_color}33` : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${activeCampaign?.accent_color || 'rgba(59, 130, 246, 0.2)'}`,
                    borderRadius: '100px',
                    color: activeCampaign?.accent_color || '#60a5fa',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1.5rem'
                }}>
                    {activeCampaign ? activeCampaign.name : t('hero.badge')}
                </div>

                <h1 style={{
                    fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                    marginBottom: '1.5rem',
                    lineHeight: '1',
                    fontWeight: '900',
                    letterSpacing: '-0.04em'
                }}>
                    {activeCampaign ? activeCampaign.name : (
                        <>
                            {t('hero.title')} <br />
                            <span className="text-gradient">Visualmind</span>
                        </>
                    )}
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '3rem',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    lineHeight: '1.6'
                }}>
                    {activeCampaign?.description || t('hero.subtitle')}
                </p>

                <div className="flex-center" style={{ gap: '1.5rem' }}>
                    <Link 
                      to={activeCampaign ? `/shop?campaign=${activeCampaign.slug}` : "/shop"} 
                      className="btn-primary flex-center" 
                      style={{ 
                        gap: '0.5rem', textDecoration: 'none',
                        background: activeCampaign?.accent_color || 'var(--primary)',
                        color: activeCampaign?.accent_color ? '#000' : '#fff'
                      }}
                    >
                        {activeCampaign ? 'Ver Colección' : t('hero.btn_shop')} <ArrowRight size={20} />
                    </Link>

                    {!activeCampaign && (
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
                    )}
                </div>
            </div>
        </header>
    );
}
