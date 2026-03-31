import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * Footer del sitio — responsivo con grid flexible.
 * Eliminados imports no usados y estilos inline por hover en CSS global.
 */
export default function Footer() {
  const { t } = useLanguage();

  // Redes sociales con favicons
  const socialLinks = [
    { name: 'Instagram', favicon: 'https://cdn-icons-png.flaticon.com/512/3955/3955024.png', url: '#' },
    { name: 'TikTok', favicon: 'https://cdn-icons-png.flaticon.com/512/3046/3046122.png', url: '#' },
    { name: 'YouTube', favicon: 'https://cdn-icons-png.flaticon.com/512/3670/3670147.png', url: '#' },
    { name: 'Facebook', favicon: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png', url: '#' },
  ];

  // Links de la tienda
  const shopLinks = ['Anime', 'Videojuegos', 'Deportes', 'Halloween'];

  // Links de soporte
  const supportLinks = [
    { path: '/info/shipping', label: t('footer.shipping') || 'Envíos' },
    { path: '/info/returns', label: t('footer.returns') || 'Devoluciones' },
    { path: '/info/faq', label: 'FAQ' },
  ];

  return (
    <footer style={{ background: '#050505', padding: '6rem 0 2rem 0', color: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* Textura de fondo decorativa */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.5, pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Grid principal */}
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>

          {/* Marca */}
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.05em', marginBottom: '1rem' }}>
              VISUALMIND<span style={{ color: 'var(--primary)' }}>.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              {t('footer.description')}
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('footer.shop')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {shopLinks.map(item => (
                <li key={item}>
                  <Link to="/collections" className="footer-link">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('footer.support')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {supportLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('footer.follow')}</h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {socialLinks.map(social => (
                <a key={social.name} href={social.url} className="social-icon-wrapper" aria-label={social.name}>
                  <img src={social.favicon} alt={social.name} className="social-favicon" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} Visualmind. {t('footer.rights')}
          </p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to="/" className="footer-link" style={{ fontSize: '0.85rem' }}>{t('footer.privacy')}</Link>
            <Link to="/" className="footer-link" style={{ fontSize: '0.85rem' }}>{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
