import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function QuickViewModal({ product, isOpen, onClose }) {
    const { addToCart } = useCart();
    const { t } = useLanguage();
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState('M');
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        if (product) {
            setSelectedColor(product.colors?.[0] || null);
            setSelectedSize('M');
            setMainImage(product.image);
        }
    }, [product]);

    useEffect(() => {
        if (selectedColor) {
            setMainImage(selectedColor.image);
        }
    }, [selectedColor]);

    if (!isOpen || !product) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1000px',
                background: 'var(--bg-secondary)',
                borderRadius: '32px',
                overflow: 'hidden',
                display: 'flex',
                flexWrap: 'wrap',
                maxHeight: '94vh',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                {/* Left: Image Container */}
                <div style={{ flex: '1.2', minWidth: '350px', background: '#1e293b', position: 'relative' }}>
                    <img
                        src={mainImage}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '600px', transition: 'all 0.4s ease' }}
                    />
                </div>

                {/* Right: Info */}
                <div style={{ flex: '0.8', minWidth: '350px', padding: '2.5rem', overflowY: 'auto' }}>
                    <div style={{ color: 'var(--text-accent)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {product.subCategory || product.category}
                    </div>
                    <h2 style={{ fontSize: '2.2rem', marginBottom: '0.8rem', color: 'white' }}>{product.title}</h2>

                    <div style={{ display: 'flex', gap: '0.2rem', color: '#fbbf24', marginBottom: '1rem' }}>
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#fbbf24" />)}
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem', fontSize: '0.85rem' }}>(42 {t('product.reviews')})</span>
                    </div>

                    <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', color: 'white' }}>${product.price}</div>

                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.95rem' }}>
                        {t('about.vision_text')}
                    </p>

                    {/* Color Selection */}
                    {product.colors && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('product.select_color')}: <span style={{ color: 'var(--text-accent)' }}>{selectedColor?.name}</span>
                            </h4>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {product.colors.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            padding: '2px',
                                            background: 'transparent',
                                            border: `2px solid ${selectedColor?.name === color.name ? 'var(--primary)' : 'transparent'}`,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ width: '100%', height: '100%', background: color.hex, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Selection */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('product.select_size')}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            {['S', 'M', 'L', 'XL'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        width: '45px',
                                        height: '45px',
                                        border: `1px solid ${selectedSize === size ? 'var(--primary)' : 'var(--border-light)'}`,
                                        borderRadius: '12px',
                                        background: selectedSize === size ? 'var(--primary)' : 'transparent',
                                        color: selectedSize === size ? 'white' : 'var(--text-secondary)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary flex-center"
                            style={{ flex: 1, gap: '0.75rem', height: '55px', fontSize: '1.1rem' }}
                            onClick={() => {
                                addToCart({
                                    ...product,
                                    image: mainImage,
                                    selectedColor,
                                    selectedSize
                                });
                                onClose();
                            }}
                        >
                            <ShoppingBag size={22} /> {t('product.add_to_bag')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
