import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { supabase } from '../supabaseClient';
import { Filter, X, ChevronRight, ChevronDown, RotateCcw, Loader } from 'lucide-react';

export default function Shop() {
    const { t } = useLanguage();
    // Combined products state
    const [allProducts, setAllProducts] = useState(PRODUCTS);
    const [dbLoading, setDbLoading] = useState(true);

    const [filter, setFilter] = useState('all');
    const [maxPrice, setMaxPrice] = useState(200);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedGroups, setExpandedGroups] = useState(['standard', 'seasons']);
    const [sortBy, setSortBy] = useState('newest');
    const productsPerPage = 12;

    // Fetch products from Supabase
    useEffect(() => {
        const fetchDbProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*');

                if (error) throw error;

                if (data) {
                    // Normalize DB fields to match local product structure
                    const normalizedData = data.map(p => ({
                        id: p.id,
                        title: p.title,
                        price: parseFloat(p.price),
                        category: p.category,
                        subCategory: p.sub_category || '',
                        image: p.image_url || 'https://via.placeholder.com/400x500?text=No+Image',
                        isNew: true, // New DB products are always "New"
                        colors: [], // Placeholder
                        sizes: ['S', 'M', 'L', 'XL'], // Default sizes
                        description: p.description
                    }));

                    // Combine local + DB products
                    setAllProducts([...PRODUCTS, ...normalizedData]);
                }
            } catch (err) {
                console.error("Error loading products from DB:", err);
            } finally {
                setDbLoading(false);
            }
        };

        fetchDbProducts();
    }, []);

    const toggleGroup = (group) => {
        setExpandedGroups(prev =>
            prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
        );
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
        setCurrentPage(1);
    };

    const toggleColor = (colorName) => {
        setSelectedColors(prev =>
            prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
        );
        setCurrentPage(1);
    };

    const filteredAndSortedProducts = allProducts
        .filter(p => {
            const matchesCategory = filter === 'all' ? true :
                filter === 'bestseller' ? p.isBestSeller :
                    p.category === filter;
            const matchesPrice = p.price <= maxPrice;
            const matchesSize = selectedSizes.length === 0 || p.sizes?.some(s => selectedSizes.includes(s));
            const matchesColor = selectedColors.length === 0 || p.colors?.some(c => selectedColors.includes(c.name));

            return matchesCategory && matchesPrice && matchesSize && matchesColor;
        })
        .sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            return 0; // Default: newest
        });

    const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
        setIsSidebarOpen(false);
    };

    const resetAllFilters = () => {
        setFilter('all');
        setMaxPrice(200);
        setSelectedSizes([]);
        setSelectedColors([]);
        setCurrentPage(1);
    };

    const categoryGroups = {
        standard: [
            { id: 'all', label: t('shop.filter_all') },
            { id: 'bestseller', label: t('shop.filter_bestsellers') },
            { id: 'anime', label: t('shop.cat_anime') },
            { id: 'caricaturas', label: t('shop.cat_caricaturas') },
            { id: 'videojuegos', label: t('shop.cat_videojuegos') },
            { id: 'deportes', label: t('shop.cat_deportes') },
        ],
        seasons: [
            { id: 'sanvalentin', label: t('shop.cat_sanvalentin') },
            { id: 'halloween', label: t('shop.cat_halloween') },
            { id: 'fiestas_patrias', label: t('shop.cat_fiestas_patrias') },
        ]
    };

    // Extract unique colors for filter
    const allColors = Array.from(new Set(allProducts.flatMap(p => p.colors?.map(c => c.name) || [])));

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '4rem', textAlign: 'left' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>{t('shop.title')}</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1.1rem' }}>
                    {t('shop.subtitle')}
                </p>
            </header>

            <div style={{ display: 'flex', gap: '3rem', position: 'relative' }}>
                {/* Mobile Filter Button */}
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex-center mobile-filter-btn"
                    style={{
                        display: 'none',
                        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100,
                        width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)',
                        color: 'white', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        cursor: 'pointer'
                    }}
                >
                    <Filter size={24} />
                </button>

                {/* Mobile Sidebar Overlay */}
                <div
                    className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 998,
                        opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none',
                        transition: 'opacity 0.3s'
                    }}
                />

                {/* Sidebar */}
                <aside
                    className={`shop-sidebar ${isSidebarOpen ? 'open' : ''}`}
                    style={{
                        width: '280px',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2.5rem',
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: 'var(--bg-primary)',
                        height: '100%'
                    }}
                >
                    <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Filter size={20} color="var(--primary)" /> {t('shop.filter_title')}
                            </h3>
                            <button onClick={resetAllFilters} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>

                        {/* Categories Grouped */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div onClick={() => toggleGroup('standard')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('shop_extended.collections_group')}</h4>
                                    {expandedGroups.includes('standard') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                {expandedGroups.includes('standard') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                                        {categoryGroups.standard.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleFilterChange(cat.id)}
                                                style={{
                                                    textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: '10px',
                                                    background: filter === cat.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                    color: filter === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem'
                                                }}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div onClick={() => toggleGroup('seasons')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('shop_extended.seasonals_group')}</h4>
                                    {expandedGroups.includes('seasons') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                {expandedGroups.includes('seasons') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                                        {categoryGroups.seasons.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleFilterChange(cat.id)}
                                                style={{
                                                    textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: '10px',
                                                    background: filter === cat.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                    color: filter === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem'
                                                }}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>{t('shop_extended.price_range')}</h4>
                            <input
                                type="range" min="0" max="200" value={maxPrice}
                                onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                                style={{ width: '100%', accentColor: 'var(--primary)', marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: '600' }}>
                                <span>$0</span>
                                <span>${maxPrice}</span>
                            </div>
                        </div>

                        {/* Size Filter */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.05em' }}>{t('shop_extended.sizes')}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {['S', 'M', 'L', 'XL'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        style={{
                                            width: '45px', height: '45px', borderRadius: '10px',
                                            border: `1px solid ${selectedSizes.includes(size) ? 'var(--primary)' : 'var(--border-light)'}`,
                                            background: selectedSizes.includes(size) ? 'var(--primary)' : 'transparent',
                                            color: selectedSizes.includes(size) ? 'white' : 'var(--text-secondary)',
                                            fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Filter */}
                        <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.05em' }}>{t('shop_extended.colors')}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {allColors.slice(0, 10).map(color => (
                                    <button
                                        key={color}
                                        onClick={() => toggleColor(color)}
                                        style={{
                                            padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem',
                                            border: `1px solid ${selectedColors.includes(color) ? 'var(--primary)' : 'var(--border-light)'}`,
                                            background: selectedColors.includes(color) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                            color: selectedColors.includes(color) ? 'var(--primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {t('shop_extended.showing')} <strong style={{ color: 'white' }}>{indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredAndSortedProducts.length)}</strong> {t('shop_extended.of')} <strong style={{ color: 'white' }}>{filteredAndSortedProducts.length}</strong> {t('shop_extended.products')}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('shop_extended.sort_by')}</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-light)',
                                    padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.9rem', cursor: 'pointer', outline: 'none'
                                }}
                            >
                                <option value="newest">{t('shop_extended.sort_newest')}</option>
                                <option value="price-low">{t('shop_extended.sort_low_high')}</option>
                                <option value="price-high">{t('shop_extended.sort_high_low')}</option>
                            </select>
                        </div>
                    </div>

                    {currentProducts.length > 0 ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '2.5rem',
                                marginBottom: '4rem'
                            }}>
                                {currentProducts.map(product => {
                                    // Determine which image to show based on selected filter
                                    const matchedColor = selectedColors.length > 0
                                        ? product.colors?.find(c => selectedColors.includes(c.name))
                                        : null;

                                    const displayImage = matchedColor ? matchedColor.image : product.image;

                                    return (
                                        <ProductCard
                                            key={product.id}
                                            {...product}
                                            image={displayImage}
                                        />
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '4rem' }}>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setCurrentPage(i + 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            style={{
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '12px',
                                                border: `1px solid ${currentPage === i + 1 ? 'var(--primary)' : 'var(--border-light)'}`,
                                                background: currentPage === i + 1 ? 'var(--primary)' : 'transparent',
                                                color: currentPage === i + 1 ? 'white' : 'var(--text-secondary)',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)',
                            borderRadius: '32px', border: '1px dashed var(--border-light)'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('search.no_results')}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('shop_extended.no_results_text')}</p>
                            <button onClick={resetAllFilters} style={{
                                marginTop: '2rem', background: 'none', border: '1px solid var(--primary)',
                                color: 'var(--primary)', padding: '0.75rem 2rem', borderRadius: '100px', cursor: 'pointer'
                            }}>
                                {t('shop_extended.reset_filters')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Injected CSS for responsiveness and sidebar */}
            <style>{`
                @media (max-width: 992px) {
                    .shop-sidebar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        height: 100vh;
                        z-index: 999;
                        padding: 2rem;
                        background: #000 !important;
                        transform: translateX(-100%);
                        width: 85% !important;
                        overflow-y: auto;
                        box-shadow: 10px 0 30px rgba(0,0,0,0.5);
                    }
                    .shop-sidebar.open {
                        transform: translateX(0);
                    }
                    .mobile-filter-btn {
                        display: flex !important;
                    }
                    .sidebar-overlay {
                        display: block !important;
                    }
                }
                .sidebar-overlay {
                    display: none;
                }
            `}</style>
        </div>
    );
}
