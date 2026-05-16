import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div style={{ paddingTop: '150px', paddingBottom: '100px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <SEO title="404 — Página no encontrada" description="La página que buscas no existe." />
      <h1 style={{ fontSize: 'clamp(5rem, 15vw, 10rem)', fontWeight: '900', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg, var(--primary), #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
      <p style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '2rem' }}>
        {t('notfound.message') || 'Esta página no existe o fue eliminada.'}
      </p>
      <Link to="/" className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none' }}>
        {t('notfound.back_home') || 'Volver al Inicio'}
      </Link>
    </div>
  );
}
