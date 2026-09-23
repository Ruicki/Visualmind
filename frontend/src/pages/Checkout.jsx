import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { getProductImage } from '../utils/imageUtils';
import { PAYMENT_METHODS } from '../config/storeConfig';
import { computeTotals, usePricingConfig } from '../utils/pricing';

/**
 * @component CheckoutForm
 * @description Sub-componente que gestiona la captura de datos de envío y la lógica de pago.
 * Procesa la creación de órdenes en el servidor y maneja los estados de carga y error.
 * El pago es manual (Yappy / transferencia / contra entrega): el pedido queda
 * "pendiente de pago" y el admin lo marca como pagado.
 */
const CheckoutForm = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para la información de envío
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  /**
   * Maneja los cambios en los campos de entrada del formulario de envío.
   */
  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  /**
   * Procesa la orden de compra.
   * Valida la sesión del usuario, envía los datos al endpoint de órdenes y
   * gestiona la redirección tras el éxito o error.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError(t('checkout.login_required') || "Inicia sesión para completar tu compra.");
      return;
    }

    if (!paymentMethod) {
      setError('Selecciona un método de pago.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // El servidor recalcula precios, envío, ITBMS y valida el stock
      const { data: order } = await api.post('/orders', {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor?.name || item.selectedColor || null
        })),
        paymentMethod,
        shippingDetails: shippingInfo
      });

      const orderItems = cartItems;
      clearCart();

      navigate('/order-success', {
        state: {
          order: {
            id: order.id,
            items: Array.isArray(order.items) ? order.items : orderItems,
            subtotal: parseFloat(order.subtotal),
            shipping: parseFloat(order.shipping_cost),
            tax: parseFloat(order.tax),
            total: parseFloat(order.total),
            paymentMethod: order.payment_method,
            date: new Date(order.created_at).toLocaleDateString(),
            shippingDetails: order.shipping_details || shippingInfo
          }
        }
      });

    } catch (err) {
      console.error("Error en checkout:", err);
      setError(err.response?.data?.message || err.message || t('checkout.error') || "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Sección de Envío: Captura de datos del destinatario */}
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
            <label className="label-text">Teléfono / WhatsApp</label>
            <input required name="phone" value={shippingInfo.phone} onChange={handleShippingChange} className="input-field" type="tel" placeholder="6000-0000" />
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
              <label className="label-text">{t('checkout.zip') || 'Código Postal'} (opcional)</label>
              <input name="zip" value={shippingInfo.zip} onChange={handleShippingChange} className="input-field" type="text" />
            </div>
          </div>
          <div>
            <label className="label-text">Indicaciones de entrega (opcional)</label>
            <input name="notes" value={shippingInfo.notes} onChange={handleShippingChange} className="input-field" type="text" placeholder="Punto de referencia, horario..." />
          </div>
        </div>
      </div>

      {/* Sección de Pago: métodos manuales (el admin confirma el pago) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          {t('checkout.payment')}
        </h2>
        <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {PAYMENT_METHODS.map(method => {
            const selected = paymentMethod === method.id;
            return (
              <label
                key={method.id}
                style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '1rem 1.2rem', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-secondary)', border: `1px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}` }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selected}
                  onChange={() => setPaymentMethod(method.id)}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>
                  <span style={{ display: 'block', fontWeight: '600' }}>{method.label}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{method.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Al confirmar verás los datos para pagar. Tu pedido se prepara en cuanto confirmemos el pago.
        </p>
        {error && <div role="alert" style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.85rem' }}>{error}</div>}
      </div>

      <button
        type="submit"
        disabled={loading || cartItems.length === 0}
        className="btn-primary"
        style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', opacity: loading ? 0.7 : 1, marginTop: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {loading ? <Loader className="spin" /> : <CheckCircle size={20} />}
        {loading ? (t('common.processing') || 'Procesando...') : (t('checkout.btn_complete') || 'Completar Pedido')}
      </button>

    </form>
  );
};

/**
 * @component Checkout
 * @description Contenedor principal de la página de checkout.
 * Implementa un Guard de autenticación para asegurar que solo usuarios logueados accedan.
 * 
 * @returns {JSX.Element|null} La vista de checkout o redirección si no hay sesión.
 */
export default function Checkout() {
  const { cartItems, getCartTotal } = useCart();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pricing = usePricingConfig();
  const totals = computeTotals(getCartTotal(), pricing);

  /**
   * Middleware de navegación: Redirige al login si se intenta acceder sin sesión activa,
   * preservando el destino original mediante el estado de la ruta.
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: '/checkout', message: 'Inicia sesión para completar tu compra.' }, replace: true });
    }
  }, [user, loading, navigate]);

  // Evitar parpadeo de contenido mientras se verifica la sesión
  if (loading || !user) {
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: '2.5rem' }}>{t('checkout.title')}</h1>

      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3rem' }}>
        {/* Lado Izquierdo: Formulario */}
        <CheckoutForm />

        {/* Lado Derecho: Resumen de Compra (Sticky side) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', height: 'fit-content', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('checkout.summary')}</h2>
          
          {/* Desglose de Items */}
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

          {/* Cálculo de Totales (Subtotal, Envío, Impuestos) */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.subtotal')}</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.shipping')}</span>
              <span style={{ color: totals.shipping > 0 ? 'var(--text-primary)' : '#10b981', fontWeight: totals.shipping > 0 ? 'normal' : '700' }}>
                {totals.shipping > 0 ? `$${totals.shipping.toFixed(2)}` : t('cart.free')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cart.taxes')} ({Math.round(pricing.taxRate * 100)}%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '900', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
              <span>{t('cart.total')}</span>
              <span style={{ color: 'var(--primary)' }}>
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
