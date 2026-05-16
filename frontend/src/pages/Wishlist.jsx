import React, { useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import { Heart, ShoppingBag, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isProductVisible } from '../utils/productUtils';

/**
 * @component Wishlist
 * @description Vista de lista de deseos (Favoritos).
 * Requiere autenticación. Si el usuario no está logueado, redirige a /login?redirect=wishlist.
 */
export default function Wishlist() {
    const { wishlistItems } = useWishlist();
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login?redirect=wishlist', { replace: true });
        }
    }, [authLoading, user, navigate]);

    if (authLoading) return null;
    if (!user) return null;

    const visibleItems = wishlistItems.filter(isProductVisible);

    if (wishlistItems.length === 0) {
        return (
            <div className="container" style={{ paddingTop: '150px', paddingBottom: '100px', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Heart size={80} strokeWidth={1} style={{ color: 'var(--border-light)' }} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{t('wishlist_page.empty_title')}</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
                    {t('wishlist_page.empty_desc')}
                </p>
                <Link to="/shop" className="btn-primary" style={{ padding: '1rem 3rem' }}>
                    {t('wishlist_page.explore')}
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '150px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem' }}>{t('wishlist_page.title')}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {t('wishlist_page.count_text').replace('{{count}}', visibleItems.length)}
                </p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2.5rem'
            }}>
                {visibleItems.map(product => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </div>
    );
}
