/**
 * @file QuickViewModal.jsx
 * @description Modal de vista rápida que permite seleccionar variantes y añadir al carrito
 * sin abandonar la página actual. Incluye lógica compleja de validación de stock por variante.
 */

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getProductImage } from '../utils/imageUtils';

/**
 * QuickViewModal
 * @component
 * @param {Object} props - Propiedades.
 * @param {Object} props.product - Objeto completo del producto.
 * @param {boolean} props.isOpen - Estado de visibilidad del modal.
 * @param {Function} props.onClose - Callback para cerrar el modal.
 */
export default function QuickViewModal({ product, isOpen, onClose }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentStock, setCurrentStock] = useState(0);

  // Initialize selections
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
      if (product.variants && product.variants.length > 0) {
        setSelectedSize(product.variants[0].size);
      } else if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product, isOpen]);

  // Dynamic stock calculation based on variant
  useEffect(() => {
    if (!product) return;
    
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => 
        v.size === selectedSize && 
        (!selectedColor || v.color_name === selectedColor.name)
      );
      setCurrentStock(variant ? parseInt(variant.stock) || 0 : 0);
    } else {
      setCurrentStock(parseInt(product.stock) || 0);
    }
  }, [product, selectedSize, selectedColor]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    
    addToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity,
      image: selectedColor?.image || getProductImage(product.image, product.image_url)
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };

  const displayPrice = product.lifecycle_state === 'legacy' ? product.price * 0.5 : product.price;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quickview-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="quickview-grid">
          <div className="quickview-gallery">
            <img 
              src={selectedColor?.image || getProductImage(product.image, product.image_url)} 
              alt={product.title} 
              className="quickview-main-image"
              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
            />
            {product.colors && product.colors.length > 1 && (
                <div className="quickview-thumbs">
                    {product.colors.map((c, i) => (
                        <img 
                            key={i}
                            src={c.image} 
                            alt={c.name}
                            onClick={() => setSelectedColor(c)}
                            className={selectedColor?.name === c.name ? 'active' : ''}
                        />
                    ))}
                </div>
            )}
          </div>

          <div className="quickview-info">
            <span className="product-category-tag">{product.category}</span>
            <h2 className="quickview-title">{product.title}</h2>
            
            <div className="quickview-rating">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < 4 ? "var(--primary)" : "none"} stroke="var(--primary)" />
                ))}
                <span className="rating-count">(24 reviews)</span>
            </div>

            <div className="quickview-price-container">
                <span className="quickview-price">${displayPrice.toFixed(2)}</span>
                {product.lifecycle_state === 'legacy' && (
                    <span className="quickview-old-price">${product.price}</span>
                )}
            </div>

            <p className="quickview-description">
              {product.description || "High-quality material and modern design. Perfect for everyday use and special occasions."}
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="selection-group">
                <label>{t('common.color')}: <strong>{selectedColor?.name}</strong></label>
                <div className="color-options">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      className={`color-btn ${selectedColor?.name === color.name ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex || color.name }}
                      onClick={() => setSelectedColor(color)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="selection-group">
              <label>{t('common.size')}</label>
              <div className="size-options">
                {(product.variants?.map(v => v.size) || product.sizes || ['S', 'M', 'L']).map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="quickview-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</button>
              </div>

              <button 
                className={`add-to-cart-btn ${added ? 'added' : ''} ${currentStock <= 0 ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={added || currentStock <= 0}
              >
                {added ? (
                  <><Check size={20} /> {t('common.added')}</>
                ) : currentStock <= 0 ? (
                  "OUT OF STOCK"
                ) : (
                  <><ShoppingBag size={20} /> {t('common.addToCart')}</>
                )}
              </button>
            </div>
            
            {currentStock > 0 && currentStock < 10 && (
                <p className="stock-warning">Only {currentStock} left in stock - order soon!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
