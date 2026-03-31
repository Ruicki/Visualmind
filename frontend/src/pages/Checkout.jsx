import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { CreditCard, Loader, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

/**
 * Formulario de pago con Stripe Elements.
 * Gestiona el pago y crea la orden en el backend local.
 */
const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!user) {
      setError(t('checkout.login_required') || "Inicia sesión para completar tu compra.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Procesar pago con Stripe (Simulado o real dependiendo de la clave)
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) throw new Error(stripeError.message);
      console.log('[PaymentMethod Success]', paymentMethod);

      // 2. Crear orden en Backend Local
      await api.post('/orders', {
        items: cartItems.map(item => ({
          product_id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          size: item.selectedSize,
          color: item.selectedColor
        })),
        total: getCartTotal(),
        paymentMethodId: paymentMethod.id
      });

      // 3. Limpiar carrito y redirigir
      clearCart();
      navigate('/profile');

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
            <input required className="input-field" type="text" />
          </div>
          <div>
            <label className="label-text">{t('checkout.email')}</label>
            <input required className="input-field" type="email" />
          </div>
          <div>
            <label className="label-text">{t('checkout.address')}</label>
            <input required className="input-field" type="text" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label-text">{t('checkout.city')}</label>
              <input required className="input-field" type="text" />
            </div>
            <div>
              <label className="label-text">{t('checkout.zip') || 'Código Postal'}</label>
              <input required className="input-field" type="text" />
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
          <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
            <CardElement options={{
              style: {
                base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                invalid: { color: '#9e2146' },
              },
            }} />
          </div>
          {error && <div style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        </div>
      </div>

      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary"
        style={{ width: '100%', padding: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader className="spin" /> : <CreditCard size={20} />}
        {loading ? (t('common.processing') || 'Procesando...') : (t('checkout.btn_complete') || 'Completar Pedido')}
      </button>
    </form>
  );
};

/**
 * Página de Checkout — responsiva con grid adaptable.
 */
export default function Checkout() {
  const { cartItems, getCartTotal } = useCart();
  const { t } = useLanguage();

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: '2.5rem' }}>{t('checkout.title')}</h1>

      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3rem' }}>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>

        {/* Resumen del pedido */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', height: 'fit-content', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('checkout.summary')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {cartItems.map(item => (
              <div key={item.variantUniqueId || item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '55px', height: '55px', borderRadius: '8px', overflow: 'hidden', background: '#333', flexShrink: 0 }}>
                  <img
                    src={item.image || getProductImage(item.image, item.image_url)}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/55x55?text=?'; }}
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

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800' }}>
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
