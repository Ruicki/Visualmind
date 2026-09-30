/**
 * @file notifier.js
 * @description Aviso al dueño de la tienda cuando entra un pedido.
 *
 * Usa un bot de Telegram (gratis, llega al celular al instante). Se activa con:
 * - TELEGRAM_BOT_TOKEN: token que da @BotFather al crear el bot
 * - TELEGRAM_CHAT_ID: tu chat con el bot (escríbele y consulta getUpdates)
 * Si no están definidas, no hace nada. Un fallo al avisar nunca afecta al pedido.
 */

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const PAYMENT_LABELS = {
  yappy: 'Yappy',
  transfer: 'Transferencia',
  cash_on_delivery: 'Contra entrega',
};

/** Texto del aviso de pedido nuevo. */
export function formatOrderMessage(order) {
  const ship = typeof order.shipping_details === 'string'
    ? JSON.parse(order.shipping_details)
    : (order.shipping_details || {});
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  const lines = items.map(i => `• ${i.quantity} × ${i.title}${i.size ? ` (${i.size})` : ''} — ${money(i.price * i.quantity)}`);
  return [
    `🛍️ Pedido nuevo #${String(order.id).slice(0, 8).toUpperCase()}`,
    `Total: ${money(order.total)} · ${PAYMENT_LABELS[order.payment_method] || order.payment_method}`,
    '',
    ...lines,
    '',
    `👤 ${ship.name || ''} · ${ship.phone || ''}`,
    `📍 ${[ship.address, ship.city].filter(Boolean).join(', ')}`,
    ship.notes ? `📝 ${ship.notes}` : null,
  ].filter(l => l !== null).join('\n');
}

export async function notifyNewOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: formatOrderMessage(order) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn('[Notifier] Telegram respondió', res.status);
    return res.ok;
  } catch (error) {
    console.warn('[Notifier] No se pudo enviar el aviso:', error.message);
    return false;
  }
}
