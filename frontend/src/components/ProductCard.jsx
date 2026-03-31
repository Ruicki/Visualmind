import React, { useState, useEffect } from 'react';
import { Plus, Eye, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link } from 'react-router-dom';
import QuickViewModal from './QuickViewModal';
import { getProductImage } from '../utils/imageUtils';

export default function ProductCard(props) {
    // Normalizar: productos estáticos usan 'image', productos de DB usan 'image_url'
    const { id, title, price, image, image_url, category } = props;
    
    const displayImage = getProductImage(image, image_url);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <div className={`product-card reveal ${isVisible ? 'visible' : ''}`} style={{
                background: 'var(--bg-secondary)',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                transition: 'var(--transition-base)',
                position: 'relative'
            }}>
                {/* Image Container */}
                <div className="slow-zoom" style={{
                    height: '320px',
                    width: '100%',
                    background: '#1e293b',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Link to={`/product/${id}`}>
                        <img
                            src={displayImage}
                            alt={title}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x500?text=Image+Not+Found';
                                console.log(`Failed to load image: ${displayImage}`);
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.5s ease'
                            }}
                            className="product-img"
                        />
                    </Link>

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(props);
                        }}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            width: '40px',
                            height: '40px',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: isInWishlist(id) ? '#ff4d4d' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20,
                            transition: 'all 0.3s'
                        }}
                    >
                        <Heart size={20} fill={isInWishlist(id) ? '#ff4d4d' : 'none'} />
                    </button>

                    {/* Hover Overlay */}
                    <div className="overlay-actions" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                        onClick={() => setIsQuickViewOpen(true)}
                    >
                        <div style={{ background: 'white', color: 'black', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                            <Eye size={22} />
                        </div>
                    </div>

                    <button
                        className="flex-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            const defaultColor = props.colors?.[0] || null;
                            const defaultSize = props.sizes?.[0] || 'M';
                            const displayImg = defaultColor?.image || getProductImage(props.image, props.image_url);
                            addToCart({
                                ...props,
                                image: displayImg,
                                selectedColor: defaultColor,
                                selectedSize: defaultSize,
                            });
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            width: '40px',
                            height: '40px',
                            background: 'white',
                            borderRadius: '50%',
                            color: 'black',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 10,
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-accent)',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em'
                    }}>
                        {category}
                    </div>
                    <Link to={`/product/${id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: '600', color: 'white' }}>{title}</h3>
                    </Link>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>${price}</div>
                </div>
            </div>

            <QuickViewModal
                product={props}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
            />
        </>
    );
}
