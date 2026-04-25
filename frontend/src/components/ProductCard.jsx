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
    
    const [isHovered, setIsHovered] = useState(false);
    const displayImage = getProductImage(image, image_url);
    
    // Logic for hover image: use the second color variant's image if it exists, otherwise use a slight zoom or filter
    const hoverImage = props.hover_image_url 
        ? getProductImage(null, props.hover_image_url)
        : (props.colors && props.colors.length > 1 
            ? props.colors[1].image 
            : (props.colors && props.colors.length === 1 && props.colors[0].image !== displayImage 
                ? props.colors[0].image 
                : displayImage));

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const layoutPref = props.layout_preference || 'standard';

    // Dynamic legacy logic
    const isSeasonExpired = props.season_end_date ? new Date(props.season_end_date) < new Date() : false;
    const isLegacy = props.lifecycle_state === 'legacy' || 
                     props.season_is_active === false || 
                     isSeasonExpired;

    return (
        <>
            <div 
                className={`product-card layout-${layoutPref} reveal ${isVisible ? 'visible' : ''}`} 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                    transition: 'var(--transition-base)',
                    position: 'relative',
                    gridColumn: layoutPref === 'hero' ? '1 / -1' : 'auto', 
                }}
            >
                {/* Image Container */}
                <div className="product-card-image" style={{
                    width: '100%',
                    background: '#1e293b',
                    position: 'relative',
                    overflow: 'hidden',
                    aspectRatio: '4/5'
                }}>
                    <Link to={`/product/${id}`}>
                        {/* Base Image */}
                        <img
                            src={displayImage}
                            alt={title}
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'opacity 0.6s ease, transform 0.6s ease',
                                opacity: isHovered && hoverImage !== displayImage ? 0 : 1,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                position: 'absolute',
                                inset: 0
                            }}
                        />
                        {/* Hover Image */}
                        {hoverImage !== displayImage && (
                            <img
                                src={hoverImage}
                                alt={`${title} hover`}
                                loading="lazy"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                                    opacity: isHovered ? 1 : 0,
                                    transform: isHovered ? 'scale(1.1)' : 'scale(1.05)',
                                    position: 'absolute',
                                    inset: 0
                                }}
                            />
                        )}
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
                                price: isLegacy ? price * 0.5 : price,
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
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-accent)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {category}
                        </div>
                        
                        {/* Status Badges */}
                        {isLegacy && (
                            <span style={{ background: '#f59e0b', color: 'black', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>LEGACY</span>
                        )}
                        {props.priority > 8 && !isLegacy && props.lifecycle_state === 'published' && (
                            <span style={{ background: 'var(--primary)', color: 'black', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>NEW</span>
                        )}
                        {props.lifecycle_state === 'draft' && (
                            <span style={{ background: '#64748b', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>DRAFT</span>
                        )}
                    </div>

                    <Link to={`/product/${id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: '600', color: 'white' }}>{title}</h3>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                            ${isLegacy ? (price * 0.5).toFixed(2) : price}
                        </div>
                        {isLegacy && (
                            <div style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                                ${price}
                            </div>
                        )}
                        {isLegacy && (
                            <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '0.8rem' }}>50% OFF</div>
                        )}
                    </div>
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
