import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, Languages, Heart, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';
import '../styles/PremiumEffects.css';

export default function Navbar() {
  const { getCartCount, setIsCartOpen } = useCart();
  const { wishlistItems } = useWishlist();
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartCount = getCartCount();
  const wishlistCount = wishlistItems.length;

  const handleAuthAction = async () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo Section */}
          <div className="logo" style={{ flex: 1 }}>
            <Link to="/" className="flex-center" style={{ gap: '0.8rem', justifyContent: 'flex-start', textDecoration: 'none' }}>
              <img
                src="/Post/Recurso%205@4x.png"
                alt="Visualmind Logo"
                style={{ width: '45px', height: '45px', objectFit: 'contain' }}
              />
              <span className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Visualmind
              </span>
            </Link>
          </div>

          {/* Desktop Links (Centered) */}
          <div className="hidden-mobile" style={{ display: 'flex', gap: '2.5rem', flex: 2, justifyContent: 'center' }}>
            {['shop', 'collections', 'new-arrivals', 'about'].map((item) => (
              <Link
                key={item}
                to={`/${item}`}
                style={{
                  fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)',
                  transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '0.1em',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.7)'; e.target.style.transform = 'translateY(0)'; }}
              >
                {t(`nav.${item.replace('-', '_')}`)}
              </Link>
            ))}
          </div>

          {/* Icons & Actions */}
          <div className="flex-center" style={{ gap: '1.2rem', flex: 1, justifyContent: 'flex-end' }}>
            <button
              className="flex-center"
              onClick={toggleLanguage}
              style={{
                color: 'white', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '0.4rem 0.6rem',
                fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer',
                gap: '0.4rem', textTransform: 'uppercase', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
            >
              <Languages size={14} />
              {lang}
            </button>

            <button
              style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              style={{ color: 'white', position: 'relative', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <Heart size={22} strokeWidth={1.5} fill={wishlistCount > 0 ? 'var(--primary)' : 'none'} color={wishlistCount > 0 ? 'var(--primary)' : 'white'} />
              {wishlistCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  background: 'white', color: 'black', width: '16px', height: '16px',
                  borderRadius: '50%', fontSize: '10px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: '900'
                }}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User Icon */}
            <button
              onClick={handleAuthAction}
              style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }}
            >
              <User size={22} strokeWidth={1.5} color={user ? 'var(--primary)' : 'white'} />
            </button>

            {/* Cart Icon */}
            <button
              style={{ color: 'white', position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  background: 'var(--primary)', width: '18px', height: '18px',
                  borderRadius: '50%', fontSize: '11px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
