import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, ArrowRight, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';

export default function SearchModal({ isOpen, onClose }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    // Limpiar estado al cerrar
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Buscar en la API con debounce de 300ms
    const searchProducts = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/products?search=${encodeURIComponent(searchQuery)}`);
            setResults(res.data || []);
        } catch {
            // Fallback silencioso — sin romper la UI
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchProducts(query);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, searchProducts]);

    const handleSelectProduct = (product) => {
        onClose();
        navigate(`/product/${product.id}`);
    };

    // Cerrar con Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const TRENDING = t('search_modal.trending_items') || ['Anime', 'Halloween', 'Streetwear', 'Fútbol'];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 300,
                background: 'rgba(2, 6, 23, 0.95)',
                backdropFilter: 'blur(15px)',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Header */}
            <div className="container" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '500' }}
                >
                    {t('search.close')} <X size={24} />
                </button>
            </div>

            {/* Input */}
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ position: 'relative', marginBottom: '3rem' }}>
                    <SearchIcon size={32} style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                    <input
                        autoFocus
                        type="text"
                        placeholder={t('search.placeholder') || 'Buscar productos...'}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            borderBottom: '2px solid var(--border-light)',
                            padding: '1.5rem 3rem 1.5rem 4rem',
                            fontSize: '2rem',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                    {loading && (
                        <Loader size={22} style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                    )}
                </div>

                {/* Resultados de la API */}
                {query && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                        {results.map(product => (
                            <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                onClick={onClose}
                                style={{ cursor: 'pointer', textDecoration: 'none', color: 'white', display: 'block' }}
                            >
                                <div style={{ height: '220px', borderRadius: '16px', overflow: 'hidden', marginBottom: '0.8rem', background: '#111' }}>
                                    <img
                                        src={getProductImage(null, product.image_url)}
                                        alt={product.title}
                                        loading="lazy"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        onError={e => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                                    />
                                </div>
                                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem', fontWeight: '700' }}>{product.title}</h4>
                                <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '800' }}>${product.price}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{product.category}</p>
                            </Link>
                        ))}

                        {!loading && results.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', gridColumn: '1/-1' }}>
                                {t('search.no_results') || 'Sin resultados para'} &ldquo;{query}&rdquo;
                            </p>
                        )}
                    </div>
                )}

                {/* Trending cuando no hay búsqueda */}
                {!query && (
                    <div>
                        <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                            {t('search.trending') || 'Tendencias'}
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {TRENDING.map(item => (
                                <div
                                    key={item}
                                    onClick={() => setQuery(item)}
                                    style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'color 0.2s', color: 'white' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'white'}
                                >
                                    {item} <ArrowRight size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
