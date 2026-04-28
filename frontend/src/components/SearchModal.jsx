/**
 * @file SearchModal.jsx
 * @description Modal de búsqueda global con debounce y filtrado dinámico.
 * Conecta con la API para buscar productos en tiempo real mientras el usuario escribe.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, ArrowRight, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';
import { isProductVisible } from '../utils/productUtils';

/**
 * SearchModal
 * @component
 * @param {Object} props - Propiedades.
 * @param {boolean} props.isOpen - Controla si el buscador es visible.
 * @param {Function} props.onClose - Función para cerrar el buscador.
 */
export default function SearchModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle Search API
  const performSearch = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/products?search=${searchQuery}`);
      // Filter results to only show visible products (active/published)
      const visibleResults = response.data.filter(isProductVisible);
      setResults(visibleResults.slice(0, 6)); // Show top 6 results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-container" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon-active" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('common.searchPlaceholder') || "What are you looking for?"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query) {
                   onClose();
                   navigate(`/shop?search=${query}`);
                }
              }}
            />
            {loading ? <Loader className="animate-spin" size={20} /> : query && (
                <button className="clear-search" onClick={() => setQuery('')}>
                    <X size={16} />
                </button>
            )}
          </div>
          <button className="close-search" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>

        <div className="search-results">
          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.id}`} 
                  className="search-result-item"
                  onClick={onClose}
                >
                  <img src={getProductImage(product.image, product.image_url)} alt={product.title} />
                  <div className="item-details">
                    <span className="item-name">{product.title}</span>
                    <span className="item-price">${product.price}</span>
                  </div>
                  <ArrowRight size={16} className="arrow-icon" />
                </Link>
              ))}
              {results.length >= 6 && (
                <Link 
                    to={`/shop?search=${query}`} 
                    className="view-all-results"
                    onClick={onClose}
                >
                    View all results for "{query}"
                </Link>
              )}
            </div>
          ) : query.length > 1 && !loading ? (
            <div className="no-results">
              <p>No products found for "{query}"</p>
            </div>
          ) : (
            <div className="search-suggestions">
                <h4>Popular Categories</h4>
                <div className="suggestion-tags">
                    {['T-Shirts', 'Hoodies', 'Accessories', 'New Arrivals'].map(tag => (
                        <button key={tag} onClick={() => {
                            setQuery(tag);
                            inputRef.current?.focus();
                        }}>{tag}</button>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
