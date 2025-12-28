import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { Star, ShoppingBag, Heart, ChevronRight, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import ProductCard from '../components/ProductCard';

import { supabase } from '../supabaseClient';
import { Loader } from 'lucide-react';

export default function ProductDetails() {
    const { id } = useParams();
    const { t } = useLanguage();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [product, setProduct] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState('M');
    const [mainImage, setMainImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // 1. Try to find in local data first (for speed/static items)
                let found = PRODUCTS.find(p => p.id === id);

                // 2. If not found locally, check Supabase
                if (!found) {
                    const { data, error } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (data) {
                        found = {
                            id: data.id,
                            title: data.title,
                            price: parseFloat(data.price),
                            category: data.category,
                            image: data.image_url,
                            description: data.description,
                            colors: [], // DB products simple for now
                            sizes: ['S', 'M', 'L', 'XL']
                        };
                    }
                }

                if (found) {
                    setProduct(found);
                    setSelectedColor(found.colors?.[0] || null);
                    setMainImage(found.image);
                }
            } catch (err) {
                console.error("Error loading product:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (selectedColor) {
            setMainImage(selectedColor.image);
        }
    }, [selectedColor]);

    if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}><Loader className="spin" /></div>;
    if (!product) return <div className="container" style={{ paddingTop: '150px' }}>Product not found</div>;

    const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Breadcrumbs */}
            <div className="container" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                <ChevronRight size={14} />
                <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
                <ChevronRight size={14} />
                <span style={{ color: 'white' }}>{product.title}</span>
            </div>

            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '4rem', marginBottom: '6rem' }}>
                {/* Image Gallery */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {product.colors?.map(color => (
                            <div
                                key={color.name}
                                onClick={() => setSelectedColor(color)}
                                style={{
                                    width: '80px', height: '100px', borderRadius: '12px', overflow: 'hidden',
                                    cursor: 'pointer', border: `2px solid ${selectedColor?.name === color.name ? 'var(--primary)' : 'var(--border-light)'}`,
                                    opacity: selectedColor?.name === color.name ? 1 : 0.6,
                                    transition: 'all 0.3s'
                                }}
                            >
                                <img src={color.image} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: 1, height: '700px', borderRadius: '32px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <img src={mainImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem 0' }}>
                    <div style={{ color: 'var(--text-accent)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                        {product.subCategory || product.category}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>{product.title}</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '0.2rem', color: '#fbbf24' }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="#fbbf24" />)}
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>(4.8 / 5.0)</span>
                        </div>
                        <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>42 Reviews</span>
                    </div>

                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2.5rem' }}>${product.price}</div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '3rem', maxWidth: '600px' }}>
                        {t('about.vision_text')}. This premium piece is designed to elevate your style while providing ultimate comfort. Each item is crafted with attention to every single stitch.
                    </p>

                    {/* Color Selection */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem', fontWeight: '600', textTransform: 'uppercase' }}>Color: {selectedColor?.name}</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {product.colors?.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%', padding: '3px',
                                        background: 'transparent',
                                        border: `2px solid ${selectedColor?.name === color.name ? 'var(--primary)' : 'transparent'}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: color.hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1.2rem', fontWeight: '600', textTransform: 'uppercase' }}>Size</h4>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            {['S', 'M', 'L', 'XL'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        width: '60px', height: '60px', borderRadius: '16px',
                                        border: `1px solid ${selectedSize === size ? 'var(--primary)' : 'var(--border-light)'}`,
                                        background: selectedSize === size ? 'var(--primary)' : 'transparent',
                                        color: selectedSize === size ? 'white' : 'var(--text-secondary)',
                                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '0.5rem' }}>
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>-</button>
                            <span style={{ width: '40px', textAlign: 'center', fontWeight: '700' }}>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} style={{ width: '40px', height: '40px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>+</button>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ flex: 1, height: '65px', borderRadius: '16px', fontSize: '1.1rem', gap: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => {
                                for (let i = 0; i < quantity; i++) {
                                    addToCart({ ...product, image: mainImage, selectedColor, selectedSize });
                                }
                            }}
                        >
                            <ShoppingBag size={22} /> Add to Bag
                        </button>
                        <button
                            onClick={() => toggleWishlist(product)}
                            style={{ width: '65px', height: '65px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: isInWishlist(product.id) ? '#ff4d4d' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                        >
                            <Heart size={24} fill={isInWishlist(product.id) ? '#ff4d4d' : 'none'} />
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '2.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Truck size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Free Shipping</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <ShieldCheck size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Secure Pay</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <RotateCcw size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>30 Days Return</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            <div className="container" style={{ paddingBottom: '6rem' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '3rem', fontWeight: '800' }}>You May Also Like</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    {relatedProducts.map(p => (
                        <ProductCard key={p.id} {...p} />
                    ))}
                </div>
            </div>
        </div>
    );
}
