/**
 * Componente de Carrito Lateral (Drawer).
 * Gestiona la visualización de productos seleccionados, cálculo de totales
 * y la transición hacia el proceso de pago.
 */
import React from 'react';
import { X, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getProductImage } from '../utils/imageUtils';

export default function Cart() {
    // Hooks de Estado Global y Navegación
    // cartItems: productos en el carrito (persistencia en localStorage vía context)
    // getCartTotal/Count: utilidades para cálculos en tiempo real
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();
    const { t } = useLanguage(); // Función de traducción
    const navigate = useNavigate(); // Hook para redirección

    /**
     * Cierra el carrito y redirige al usuario a la página de pago.
     */
    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    return (
        <>
            {/* Fondo oscuro (Overlay) que cierra el carrito al hacer clic fuera */}
            <div
                className={`cart-overlay ${isCartOpen ? 'active' : ''}`}
                onClick={() => setIsCartOpen(false)}
            />

            {/* Panel lateral deslizable */}
            <div className={`cart-panel ${isCartOpen ? 'active' : ''}`}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Cabecera del Carrito */}
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>
                            {t('cart.title')} 
                            <span style={{ paddingLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 'normal' }}>
                                ({getCartCount()} {t('cart.items_count')})
                            </span>
                        </h2>
                        <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Área central (Scrollable) */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                        {cartItems.length === 0 ? (
                            /* Estado vacío */
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                <Trash2 size={48} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                                <p>{t('cart.empty')}</p>
                                <button onClick={() => setIsCartOpen(false)} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', border: '1px solid var(--border-light)', borderRadius: '100px', color: 'white', background: 'none', cursor: 'pointer' }}>
                                    {t('cart.back')}
                                </button>
                            </div>
                        ) : (
                            /* Lista de productos */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {cartItems.map((item) => (
                                    <div key={item.variantUniqueId} style={{ display: 'flex', gap: '1.5rem' }}>
                                        {/* Imagen del producto con fallback */}
                                        <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                                            <img
                                                src={item.image || getProductImage(item.image, item.image_url)}
                                                alt={item.title}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=?'; }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>

                                        {/* Información y Controles */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.title}</h4>
                                                <button onClick={() => removeFromCart(item.variantUniqueId)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Detalles de la Variante (Color y Talla) */}
                                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                                {item.selectedColor && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.selectedColor.hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                                                        <span style={{ color: 'var(--text-secondary)' }}>{item.selectedColor.name}</span>
    
                                                    </div>
                                                )}
                                                {item.selectedSize && (
                                                    <div style={{ color: 'var(--text-secondary)' }}>
                                                        {t('Talla seleccionada')}: <span style={{ color: 'white', fontWeight: '600' }}>{item.selectedSize}</span>
                                                    </div>
                                                )}
                                            </div>


                                            {/* Controles de Cantidad y Precio por Item */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '100px', border: '1px solid var(--border-light)' }}>
                                                    <button onClick={() => updateQuantity(item.variantUniqueId, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><Minus size={16} /></button>
                                                    <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.variantUniqueId, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><Plus size={16} /></button>
                                                </div>
                                                <p style={{ fontWeight: '700' }}>${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resumen de Pago (Footer del carrito) */}
                    {cartItems.length > 0 && (
                        <div style={{ padding: '2rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{t('cart.subtotal')}</span>
                                    <span>${getCartTotal().toFixed(2)}</span>
                                </div>

                                {/* Impuestos calculados (7%) 
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{t('cart.taxes')} (7%)</span>
                                    <span>${(getCartTotal() * 0.07).toFixed(2)}</span>
                                </div>
                                */}

                                {/* Total Final acumulado */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontWeight: '700' }}>{t('cart.total')}</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                                        ${(getCartTotal() + (getCartTotal() > 50 ? 0 : 5)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Botón de Finalizar Compra */}
                            <button
                                onClick={handleCheckout}
                                className="btn-primary"
                                style={{ width: '100%', padding: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
                            >
                                {t('cart.checkout')} <ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
