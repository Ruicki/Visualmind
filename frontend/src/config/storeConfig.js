/**
 * @file storeConfig.js
 * @description Datos de cobro de la tienda (pago manual).
 * Se configuran con variables de entorno en Vercel (Settings → Environment Variables)
 * para poder cambiarlos sin tocar código. Si una variable está vacía, ese dato no se muestra.
 * Las reglas de precio (envío/ITBMS) viven en el backend: services/orderPricing.js.
 */

const env = import.meta.env;

// Número usado por el botón flotante de WhatsApp (WhatsAppButton.jsx) como valor por defecto
export const WHATSAPP_NUMBER = (env.VITE_WHATSAPP_NUMBER || '+50763148640').replace(/[^\d]/g, '');

export const PAYMENT_METHODS = [
  {
    id: 'yappy',
    label: 'Yappy',
    description: 'Envía el pago por Yappy y comparte el comprobante por WhatsApp.',
    details: [
      ['Yappy / Directorio', env.VITE_YAPPY_NUMBER],
    ],
  },
  {
    id: 'transfer',
    label: 'Transferencia bancaria (ACH)',
    description: 'Transfiere el total y comparte el comprobante por WhatsApp.',
    details: [
      ['Banco', env.VITE_BANK_NAME],
      ['Tipo de cuenta', env.VITE_BANK_ACCOUNT_TYPE],
      ['Número de cuenta', env.VITE_BANK_ACCOUNT],
      ['Titular', env.VITE_BANK_HOLDER],
    ],
  },
  {
    id: 'cash_on_delivery',
    label: 'Pago contra entrega',
    description: 'Pagas en efectivo al recibir tu pedido.',
    details: [],
  },
];

export const getPaymentMethod = (id) => PAYMENT_METHODS.find(m => m.id === id);

/** Etiquetas y colores de los estados de un pedido (compartido por admin y perfil). */
export const ORDER_STATUSES = {
  pending:   { label: 'Pendiente de pago', color: '#ffc107' },
  paid:      { label: 'Pagado',            color: '#8b5cf6' },
  shipped:   { label: 'Enviado',           color: '#3b82f6' },
  delivered: { label: 'Entregado',         color: '#10b981' },
  cancelled: { label: 'Cancelado',         color: '#ef4444' },
};

/** Link de WhatsApp de la tienda con un mensaje prellenado. */
export const whatsappLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
