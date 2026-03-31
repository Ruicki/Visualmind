import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Globe, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';

/**
 * Navbar principal con menú hamburguesa para móvil.
 * Se adapta a 3 breakpoints: desktop, tablet, mobile.
 */
export default function Navbar() {
  const { setIsCartOpen, getCartCount } = useCart();
  const { language, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();

  // Estado para la versión scrolleada y el menú mobile
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Links de navegación
  const navLinks = [
    { path: '/shop', label: t('nav.shop') },
    { path: '/collections', label: t('nav.collections') },
    { path: '/new-arrivals', label: t('nav.new_arrivals') },
    { path: '/lookbook', label: t('nav.lookbook') || 'Lookbook' },
    { path: '/about', label: t('nav.about') },
  ];

  return (
    <>
      <nav
        className="navbar"
        style={{
          background: scrolled
            ? 'rgba(2, 6, 23, 0.9)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="container navbar-inner">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/">
              <img src="/logo.png" alt="Visualmind" />
              <span className="navbar-logo-text">Visualmind</span>
            </Link>
          </div>

          {/* Links de escritorio (se ocultan en tablet/mobile via CSS) */}
          <div className="navbar-links">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="navbar-link"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Acciones: búsqueda, idioma, usuario, carrito, hamburguesa */}
          <div className="navbar-actions">
            {/* Búsqueda */}
            <button
              className="navbar-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Cambio de idioma */}
            <button
              className="navbar-lang-btn"
              onClick={toggleLanguage}
              aria-label="Cambiar idioma"
            >
              <Globe size={14} />
              <span className="lang-label">{language.toUpperCase()}</span>
            </button>

            {/* Perfil / Login */}
            <Link
              to={user ? '/profile' : '/login'}
              className="navbar-icon-btn"
              aria-label={user ? 'Perfil' : 'Iniciar sesión'}
            >
              <User size={20} />
            </Link>

            {/* Carrito */}
            <button
              className="navbar-icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="Abrir carrito"
              style={{ position: 'relative' }}
            >
              <ShoppingBag size={20} />
              {getCartCount() > 0 && (
                <span
                  className="navbar-badge"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {getCartCount()}
                </span>
              )}
            </button>

            {/* Botón Hamburguesa (visible solo en tablet/mobile via CSS) */}
            <button
              className="navbar-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú de navegación"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menú mobile (se controla con clase .open) */}
      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className="navbar-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Modal de búsqueda */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
