/**
 * @file Navbar.jsx
 * @description Componente de navegación principal.
 * Gestiona la visibilidad del menú mobile, el estado del scroll para efectos visuales,
 * y centraliza el acceso a funcionalidades clave (Carrito, Deseos, Perfil, Idioma).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Globe, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar
 * @component
 * @description Navbar adaptativo con 3 estados visuales:
 * 1. Transparente (al inicio de la página).
 * 2. Con fondo/blur (al hacer scroll > 50px).
 * 3. Mobile (menú hamburguesa y overlay lateral).
 */
export default function Navbar() {
  // Integración con Contextos de Estado
  const { setIsCartOpen, getCartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { language, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();

  // Estados Locales de UI
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  /** Ref para el contenedor del nav (usado para detectar clics fuera en mobile) */
  const navRef = useRef(null);

  /**
   * Efecto: Monitoreo del scroll para cambiar el estilo del navbar (glassmorphism).
   */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Efecto: Cierra el menú mobile si se hace clic fuera del área del navbar.
   */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  /**
   * Configuración de enlaces principales traducidos.
   */
  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/shop', label: t('nav.shop') },
    { path: '/collections', label: t('nav.collections') },
    { path: '/new-arrivals', label: t('nav.new_arrivals') },
    { path: '/about', label: t('nav.about') },
  ];

  return (
    <>  
      <nav
        ref={navRef}
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
          {/* Sección Logo: Incluye fallback para nombres de archivo con/sin mayúsculas */}
          <div className="navbar-logo">
            <Link to="/">
              <img 
                src="/Logo.png" 
                alt="Visualmind" 
                className="navbar-logo-img"
                onError={(e) => {
                  if (e.target.src.includes('/Logo.png')) {
                    e.target.src = '/logo.png';
                  }
                }}
              />
              <span className="navbar-logo-text">
                Visualmind</span>
              </Link>
          </div>

          {/* Enlaces de Navegación (Desktop) */}
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

          {/* Barra de Acciones (Iconos y Toggles) */}
          <div className="navbar-actions">
            {/* Buscador */}
            <button
              className="navbar-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Selector de Tema (Oscuro/Claro) */}
            <ThemeToggle />

            {/* Selector de Idioma (ES/EN) */}
            <button
              className="navbar-lang-btn"
              onClick={toggleLanguage}
              aria-label="Cambiar idioma"
            >
              <Globe size={14} />
              <span className="lang-label">{language.toUpperCase()}</span>
            </button>

            {/* Usuario / Autenticación */}
            <Link
              to={user ? '/profile' : '/login'}
              className="navbar-icon-btn"
              aria-label={user ? 'Perfil' : 'Iniciar sesión'}
            >
              <User size={20} />
            </Link>

            {/* Favoritos con indicador numérico */}
            <Link
              to="/wishlist"
              className="navbar-icon-btn"
              aria-label={t('nav.wishlist') || 'Lista de deseos'}
              style={{ position: 'relative' }}
            >
              <Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="cart-badge">{wishlistItems.length}</span>
              )}
            </Link>

            {/* Carrito con indicador dinámico (Badge) */}
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

            {/* Trigger de Menú Hamburguesa (Solo Mobile/Tablet) */}
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

      {/* Menú Mobile Desplegable */}
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

      {/* Modal de Búsqueda Global */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

