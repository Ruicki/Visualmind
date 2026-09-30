import { describe, it, expect, afterEach, vi } from 'vitest';
import { formatOrderMessage, notifyNewOrder } from '../services/notifier.js';

const order = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  total: 55.62,
  payment_method: 'yappy',
  items: [{ quantity: 2, title: 'Camiseta Gojo', size: 'M', price: 24.99 }],
  shipping_details: { name: 'Ana', phone: '6123-4567', address: 'Vía España', city: 'Panamá', notes: 'Portería' },
};

describe('notifier', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('resume el pedido con total, método, artículos y contacto', () => {
    const text = formatOrderMessage(order);
    expect(text).toContain('#A1B2C3D4');
    expect(text).toContain('$55.62 · Yappy');
    expect(text).toContain('2 × Camiseta Gojo (M) — $49.98');
    expect(text).toContain('Ana · 6123-4567');
    expect(text).toContain('Vía España, Panamá');
  });

  it('no hace nada si Telegram no está configurado', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
    expect(await notifyNewOrder(order)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('un fallo de red no lanza error', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 't');
    vi.stubEnv('TELEGRAM_CHAT_ID', '1');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    await expect(notifyNewOrder(order)).resolves.toBe(false);
  });
});
