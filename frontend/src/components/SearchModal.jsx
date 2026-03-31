import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { PRODUCTS as ALL_PRODUCTS } from '../data/products';

export default function SearchModal({ isOpen, onClose }) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }
        const filtered = ALL_PRODUCTS.filter(p =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(2, 6, 23, 0.95)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem'
        }}>
            {/* Header */}
            <div className="container" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '500' }}
                >
                    {t('search.close')} <X size={24} />
                </button>
            </div>

            {/* Input Area */}
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ position: 'relative', marginBottom: '4rem' }}>
                    <SearchIcon size={32} style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                    <input
                        autoFocus
                        type="text"
                        placeholder={t('search.placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            borderBottom: '2px solid var(--border-light)',
                            padding: '1.5rem 0 1.5rem 4rem',
                            fontSize: '2rem',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Results */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                    {results.map(product => (
                        <Link
                            key={product.id}
                            to="/shop"
                            onClick={onClose}
                            style={{ textDecoration: 'none', color: 'white' }}
                        >
                            <div style={{ height: '250px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <img src={product.image || product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{product.title}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${product.price} — {product.category}</p>
                        </Link>
                    ))}

                    {query && results.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{t('search.no_results')} "{query}"</p>
                    )}

                    {!query && (
                        <div>
                            <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>{t('search.trending')}</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(t('search_modal.trending_items') || []).map(item => (
                                    <div
                                        key={item}
                                        onClick={() => setQuery(item)}
                                        style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'color 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                                        onMouseLeave={(e) => e.target.style.color = 'white'}
                                    >
                                        {item} <ArrowRight size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
