import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { CreditCard, Loader, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';

/**
 * Formulario de checkout simplificado (sin Stripe).
 */
const CheckoutForm = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    zip: ''
  });

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError(t('checkout.login_required') || "Inicia sesión para completar tu compra.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear orden en Backend (sin Stripe por ahora)
      const orderResponse = await api.post('/orders', {
        items: cartItems.map(item => ({
          product_id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          size: item.selectedSize,
          color: item.selectedColor
        })),
        total: getCartTotal(),
        shippingDetails: shippingInfo
      });

      // Limpiar carrito y redirigir
      clearCart();
      navigate('/order-success', { 
        state: { 
          order: {
            id: orderResponse.data.id || Math.floor(Math.random() * 1000000),
            items: cartItems,
            total: getCartTotal(),
            date: new Date().toLocaleDateString(),
            shippingDetails: shippingInfo
          }
        } 
      });

    } catch (err) {
      console.error("Error en checkout:", err);
      setError(err.response?.data?.message || err.message || t('checkout.error') || "Ocurrió un error durante el pago.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      {/* Sección de envío */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          {t('checkout.shipping')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label className="label-text">{t('checkout.name')}</label>
            <input required name="name" value={shippingInfo.name} onChange={handleShippingChange} className="input-field" type="text" />
          </div>
          <div>
            <label className="label-text">{t('checkout.email')}</label>
            <input required name="email" value={shippingInfo.email} onChange={handleShippingChange} className="input-field" type="email" />
          </div>
          <div>
            <label className="label-text">{t('checkout.address')}</label>
            <input required name="address" value={shippingInfo.address} onChange={handleShippingChange} className="input-field" type="text" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label-text">{t('checkout.city')}</label>
              <input required name="city" value={shippingInfo.city} onChange={handleShippingChange} className="input-field" type="text" />
            </div>
            <div>
              <label className="label-text">{t('checkout.zip') || 'Código Postal'}</label>
              <input required name="zip" value={shippingInfo.zip} onChange={handleShippingChange} className="input-field" type="text" />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de pago */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          {t('checkout.payment')}
        </h2>
        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Lock size={14} /> {t('common.secure_payment') || 'Pago seguro'}
          </div>
          {/* Simulación de tarjeta de crédito */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {t('checkout.payment_info') || 'Información de pago (simulado)'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input 
                type="text" 
                placeholder="Número de tarjeta" 
                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                disabled
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <input 
                  type="text" 
                  placeholder="MM/AA" 
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  disabled
                />
                <input 
                  type="text" 
                  placeholder="CVV" 
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  disabled
                />
              </div>
            </div>
          </div>
          {error && <div style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        </div>
      </div>

      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', opacity: loading ? 0.7 : 1, marginTop: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {loading ? <Loader className="spin" /> : <CreditCard size={20} />}
        {loading ? (t('common.processing') || 'Procesando...') : (t('checkout.btn_complete') || 'Completar Pedido')}
      </button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <p>Tus datos están protegidos por encriptación SSL de 256 bits.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', opacity: 0.6, filter: 'grayscale(1)' }}>
            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>VISA</span>
            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>MASTERCARD</span>
            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>AMERICAN EXPRESS</span>
        </div>
      </div>
    </form>
  );
};

/**
 * Página de Checkout — responsiva con grid adaptable.
 */
export default function Checkout() {
  const { cartItems, getCartTotal } = useCart();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Guard: redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: '/checkout', message: 'Inicia sesión para completar tu compra.' }, replace: true });
    }
  }, [user, loading, navigate]);

  console.log('[Checkout] Render state:', { loading, userEmail: user?.email, cartItemsCount: cartItems.length });

  // Mostrar nada mientras se verifica la sesión
  if (loading || !user) {
    console.log('[Checkout] Returning null because loading is', loading, 'or user is null');
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: '2.5rem' }}>{t('checkout.title')}</h1>

      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3rem' }}>
        <CheckoutForm />

        {/* Resumen del pedido */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', height: 'fit-content', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('checkout.summary')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {cartItems.map(item => (
              <div key={item.variantUniqueId || item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '55px', height: '55px', borderRadius: '8px', overflow: 'hidden', background: '#333', flexShrink: 0 }}>
                  <img
                    src={item.image || getProductImage(item.image, item.image_url)}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={item.title}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.selectedSize} - {item.selectedColor?.name || item.selectedColor}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('cart.qty') || 'Qty'}: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.subtotal')}</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.shipping')}</span>
              <span style={{ color: getCartTotal() > 50 ? '#10b981' : 'white', fontWeight: getCartTotal() > 50 ? '700' : 'normal' }}>
                {getCartTotal() > 50 ? t('cart.free') : '$5.00'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.taxes')} (7%)</span>
              <span>${(getCartTotal() * 0.07).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '900', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
              <span>{t('cart.total')}</span>
              <span style={{ color: 'var(--primary)' }}>
                ${(getCartTotal() + (getCartTotal() > 50 ? 0 : 5) + (getCartTotal() * 0.07)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
