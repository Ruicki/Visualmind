import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Página de éxito tras completar un pedido.
 * Incluye generación de recibo digital en PDF.
 */
export default function OrderSuccess() {
  const location = useLocation();
  const receiptRef = useRef();
  
  // Datos del pedido pasados vía state desde Checkout o recuperados
  const orderData = React.useMemo(() => location.state?.order || {
    id: Math.floor(Math.random() * 1000000),
    items: [],
    total: 0,
    date: new Date().toLocaleDateString()
  }, [location.state]);

  useEffect(() => {
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
  }, []);

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
    pdf.save(`recibo-visualmind-${orderData.id}.pdf`);
  };

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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '900' }}>¡Gracias por tu compra!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Tu pedido <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>#{orderData.id}</span> ha sido procesado correctamente.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', alignItems: 'center' }}>
        
        {/* Vista previa del recibo (Lo que se convertirá a PDF) */}
        <div ref={receiptRef} style={{ width: '100%', background: 'white', color: '#111', padding: '2.5rem', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>VISUALMIND</h2>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Recibo Digital</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Fecha: {orderData.date}</p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Pedido: #{orderData.id}</p>
            </div>
          </div>

          {/* Datos de envío si disponibles */}
          {orderData.shippingDetails && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px', fontSize: '0.82rem' }}>
              <p style={{ fontWeight: '700', textTransform: 'uppercase', color: '#888', marginBottom: '0.4rem', fontSize: '0.7rem' }}>Datos de Envío</p>
              <p style={{ fontWeight: '600' }}>{orderData.shippingDetails.name}</p>
              {orderData.shippingDetails.address && <p style={{ color: '#555' }}>{orderData.shippingDetails.address}, {orderData.shippingDetails.city} {orderData.shippingDetails.zip}</p>}
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
              <span>${orderData.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Envío</span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>Gratis ✓</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', marginTop: '0.5rem' }}>
              <span>Total Pagado</span>
              <span>${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px dashed #ddd', paddingTop: '1.5rem', fontSize: '0.75rem', color: '#888' }}>
            Gracias por confiar en Visualmind. Este es un comprobante de pago oficial.
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', maxWidth: '400px' }}>
          <button 
            onClick={downloadReceipt}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.2rem', borderRadius: '12px' }}
          >
            <Download size={18} /> Descargar Recibo Digital
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/shop" className="btn-primary" style={{ textAlign: 'center', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '12px' }}>
              <ShoppingBag size={18} /> Seguir Comprando
            </Link>

            <Link to="/" style={{ textAlign: 'center', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', border: '1px solid var(--border-light)' }}>
              <Home size={16} /> Volver al Inicio
            </Link>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Te hemos enviado una copia de este recibo a tu correo electrónico.
          </p>
        </div>
      </div>
    </div>
  );
}
