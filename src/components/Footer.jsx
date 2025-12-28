import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Instagram, Youtube, Facebook, Music2 } from 'lucide-react'; // Music2 for TikTok as per lucide standard

export default function Footer() {
    const { t } = useLanguage();

    const socialLinks = [
        {
            name: 'Instagram',
            icon: <Instagram size={24} />,
            url: 'https://instagram.com',
            hoverColor: '#E4405F',
            favicon: 'https://www.instagram.com/favicon.ico'
        },
        {
            name: 'YouTube',
            icon: <Youtube size={24} />,
            url: 'https://youtube.com',
            hoverColor: '#FF0000',
            favicon: 'https://www.youtube.com/favicon.ico'
        },
        {
            name: 'Facebook',
            icon: <Facebook size={24} />,
            url: 'https://facebook.com',
            hoverColor: '#1877F2',
            favicon: 'https://www.facebook.com/favicon.ico'
        },
        {
            name: 'TikTok',
            icon: <Music2 size={24} />,
            url: 'https://tiktok.com',
            hoverColor: '#00F2EA',
            favicon: 'https://www.tiktok.com/favicon.ico'
        }
    ];

    return (
        <footer style={{ background: '#0a0a0a', padding: '8rem 0 4rem 0', borderTop: '1px solid var(--border-light)' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem', marginBottom: '6rem' }}>

                    {/* Brand Section */}
                    <div style={{ maxWidth: '300px' }}>
                        <Link to="/" className="flex-center" style={{ gap: '0.8rem', justifyContent: 'flex-start', textDecoration: 'none', marginBottom: '1.5rem' }}>
                            <img
                                src="/Post/Recurso%205@4x.png"
                                alt="Visualmind Logo"
                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            />
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>Visualmind</span>
                        </Link>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            {t('footer.desc')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('footer.shop')}</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {['Anime', 'Videojuegos', 'Deportes', 'Halloween'].map(item => (
                                <li key={item}><Link to="/shop" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s' }}>{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('footer.support')}</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{t('footer.links.shipping')}</Link></li>
                            <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{t('footer.links.returns')}</Link></li>
                            <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{t('footer.links.size_guide')}</Link></li>
                            <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{t('footer.links.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* Social Hub with "Favicons" */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('footer.follow')}</h4>
                        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                            {socialLinks.map(social => (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-icon-wrapper"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        position: 'relative'
                                    }}
                                >
                                    <img
                                        src={social.favicon}
                                        alt={social.name}
                                        style={{ width: '22px', height: '22px', filter: 'grayscale(1) brightness(2)' }}
                                        className="social-favicon"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                        © 2024 Visualmind. {t('footer.rights')}
                    </p>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.85rem' }}>{t('footer.privacy')}</Link>
                        <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.85rem' }}>{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>

            <style>{`
                .social-icon-wrapper:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-5px);
                    border-color: var(--primary);
                }
                .social-icon-wrapper:hover .social-favicon {
                    filter: grayscale(0) brightness(1);
                }
            `}</style>
        </footer>
    );
}
