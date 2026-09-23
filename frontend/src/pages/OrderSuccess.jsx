import React, { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, ShoppingBag, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getPaymentMethod, whatsappLink } from '../config/storeConfig';

/**
 * @component OrderSuccess
 * @description Página de confirmación post-compra.
 * Muestra el resumen del pedido, las instrucciones de pago (pago manual) y permite
 * descargar el resumen en PDF utilizando jsPDF y html2canvas.
 */
export default function OrderSuccess() {
  const location = useLocation();
  const receiptRef = useRef();
  
  // Datos del pedido pasados vía state desde Checkout
  const orderData = location.state?.order;
  const shortId = orderData ? String(orderData.id).slice(0, 8).toUpperCase() : '';
  const payment = getPaymentMethod(orderData?.paymentMethod);
  const paymentDetails = (payment?.details || []).filter(([, value]) => value);
  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  useEffect(() => {
    if (!orderData) return;
    // Lanzar confeti al cargar
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [orderData]);

  const downloadReceipt = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`pedido-visualmind-${shortId}.pdf`);
  };

  if (!orderData) {
    return (
      <div className="container" style={{ paddingTop: '140px', paddingBottom: '6rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No hay un pedido reciente para mostrar</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Puedes ver el estado de tus pedidos en tu perfil.</p>
        <Link to="/profile" className="btn-primary" style={{ padding: '1rem 2rem', textDecoration: 'none', borderRadius: '12px' }}>Ver mis pedidos</Link>
      </div>
    );
  }

  const whatsappMessage = `Hola! Hice el pedido #${shortId} por ${money(orderData.total)} (${payment?.label || orderData.paymentMethod}). Adjunto el comprobante de pago.`;

  return (
    <div className="container" style={{ paddingTop: '140px', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', color: '#10b981', marginBottom: '1.5rem' }}>
          <CheckCircle size={64} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '900' }}>¡Pedido recibido!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Tu pedido <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>#{shortId}</span> está registrado y pendiente de pago.
        </p>
      </motion.div>

      {/* Instrucciones de pago */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Cómo completar tu pago: {payment?.label || orderData.paymentMethod}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: paymentDetails.length ? '1rem' : 0 }}>
          {orderData.paymentMethod === 'cash_on_delivery'
            ? `Ten listo ${money(orderData.total)} en efectivo al recibir tu pedido. Te contactaremos para coordinar la entrega.`
            : `Paga ${money(orderData.total)} e indica el número de pedido #${shortId} en la referencia. Luego envíanos el comprobante por WhatsApp.`}
        </p>
        {paymentDetails.length > 0 && (
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.4rem 1rem', fontSize: '0.95rem', margin: 0 }}>
            {paymentDetails.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt style={{ color: 'var(--text-secondary)' }}>{label}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {orderData.paymentMethod !== 'cash_on_delivery' && paymentDetails.length === 0 && (
          <p style={{ fontSize: '0.9rem' }}>Escríbenos por WhatsApp y te enviamos los datos para pagar.</p>
        )}
        <a
          href={whatsappLink(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ marginTop: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.4rem', borderRadius: '12px', textDecoration: 'none' }}
        >
          <MessageCircle size={18} /> {orderData.paymentMethod === 'cash_on_delivery' ? 'Coordinar entrega por WhatsApp' : 'Enviar comprobante por WhatsApp'}
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', alignItems: 'center' }}>
        
        {/* Vista previa del recibo (Lo que se convertirá a PDF) */}
        <div ref={receiptRef} style={{ width: '100%', background: 'white', color: '#111', padding: '2.5rem', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#111' }}>VISUALMIND</h2>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Resumen de pedido</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Fecha: {orderData.date}</p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Pedido: #{shortId}</p>
            </div>
          </div>

          {/* Datos de envío si disponibles */}
          {orderData.shippingDetails && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px', fontSize: '0.82rem' }}>
              <p style={{ fontWeight: '700', textTransform: 'uppercase', color: '#888', marginBottom: '0.4rem', fontSize: '0.7rem' }}>Datos de Envío</p>
              <p style={{ fontWeight: '600' }}>{orderData.shippingDetails.name}</p>
              {orderData.shippingDetails.address && <p style={{ color: '#555' }}>{orderData.shippingDetails.address}, {orderData.shippingDetails.city} {orderData.shippingDetails.zip}</p>}
              {orderData.shippingDetails.phone && <p style={{ color: '#555' }}>{orderData.shippingDetails.phone}</p>}
              {orderData.shippingDetails.email && <p style={{ color: '#555' }}>{orderData.shippingDetails.email}</p>}
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '0.5rem 0' }}>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cant.</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {orderData.items?.length > 0 ? orderData.items.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: '0.9rem', borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '1rem 0' }}>
                      <div style={{ fontWeight: '600' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.selectedSize || item.size}{(item.selectedColor || item.color) ? ` — ${(item.selectedColor?.name || item.selectedColor || item.color?.name || item.color)}` : ''}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '2rem 0', textAlign: 'center', color: '#999' }}>Lista de items no disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '2px solid #eee', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>{money(orderData.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Envío</span>
              <span>{orderData.shipping > 0 ? money(orderData.shipping) : 'Gratis'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>ITBMS</span>
              <span>{money(orderData.tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', marginTop: '0.5rem' }}>
              <span>Total a pagar</span>
              <span>{money(orderData.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              <span>Método de pago</span>
              <span>{payment?.label || orderData.paymentMethod}</span>
            </div>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px dashed #ddd', paddingTop: '1.5rem', fontSize: '0.75rem', color: '#888' }}>
            Gracias por confiar en Visualmind. Este documento es un resumen de pedido, no un comprobante de pago.
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', maxWidth: '400px' }}>
          <button 
            onClick={downloadReceipt}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.2rem', borderRadius: '12px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', cursor: 'pointer' }}
          >
            <Download size={18} /> Descargar resumen (PDF)
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/shop" className="btn-primary" style={{ textAlign: 'center', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '12px' }}>
              <ShoppingBag size={18} /> Seguir Comprando
            </Link>

            <Link to="/" style={{ textAlign: 'center', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', border: '1px solid var(--border-light)' }}>
              <Home size={16} /> Volver al Inicio
            </Link>
          </div>

          <Link to="/profile" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Ver el estado de mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
