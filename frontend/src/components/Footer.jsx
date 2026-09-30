/**
 * @file Footer.jsx
 * @description Pie de página de la aplicación.
 * Proporciona enlaces de soporte, navegación secundaria, redes sociales y avisos legales.
 * Utiliza un diseño de grid flexible y soporte multilingüe.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SOCIAL_LINKS } from '../config/storeConfig';

/** Íconos de marca en SVG propio: no dependen de imágenes externas. */
const SOCIAL_ICONS = {
  instagram: <path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 100 13.4 6.7 6.7 0 000-13.4zm0 11a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm7-11.3a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z" />,
  facebook: <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z" />,
  tiktok: <path d="M16.6 2h-3.3v13.4a2.9 2.9 0 11-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.3 6.3 0 105.3 6.2V8.7a8 8 0 004.4 1.3V6.7a4.6 4.6 0 01-4.4-4.7z" />,
  whatsapp: <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2c0 1.3 1 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />,
};

/**
 * Footer
 * @component
 * @description Componente responsivo que se adapta a diferentes anchos de pantalla mediante CSS Grid.
 * Incluye una textura decorativa en SVG y enlaces dinámicos basados en la configuración de idioma.
 */
export default function Footer() {
  const { t } = useLanguage();

  /** Redes sociales configuradas (ver SOCIAL_LINKS en storeConfig). */
  const socialLinks = SOCIAL_LINKS;

  /** 
   * Enlaces de soporte y políticas.
   * Las rutas apuntan al componente InfoPage con parámetros dinámicos.
   */
  const supportLinks = [
    { path: '/info/shipping', label: t('footer.shipping') },
    { path: '/info/returns', label: t('footer.returns') },
    { path: '/info/faq', label: 'FAQ' },
  ];

  return (
    <footer style={{ background: '#050505', padding: '6rem 0 2rem 0', color: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* 
        Textura de fondo decorativa: 
        Implementada mediante un patrón SVG en línea para minimizar peticiones HTTP.
      */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.5, pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Grid Principal de Contenido */}
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>

          {/* Bloque de Marca y Descripción */}
          <div style={{ maxWidth: '300px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.05em', marginBottom: '1rem' }}>VISUALMIND </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              {t('footer.description')}
            </p>
          </div>

          {/* Bloque de Soporte / Enlaces Útiles */}
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

          {/* Bloque de Redes Sociales */}
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('footer.follow')}</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {socialLinks.map(social => (
                <a key={social.id} href={social.url} className="social-icon-wrapper" aria-label={social.name} title={social.name} target="_blank" rel="noopener noreferrer">
                  <svg className="social-favicon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                    {SOCIAL_ICONS[social.id]}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Barra Inferior (Copyright y Políticas) */}
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem', paddingBottom: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} Visualmind. {t('footer.rights')}
          </p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to="/info/privacy" className="footer-link" style={{ fontSize: '0.85rem' }}>{t('footer.privacy')}</Link>
            <Link to="/info/terms" className="footer-link" style={{ fontSize: '0.85rem' }}>{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

