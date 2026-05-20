import { describe, it, expect } from 'vitest';

const BASE = 'http://localhost:5000/api';

describe('Home page - server health', () => {

  it('backend /api/products responds 200', async () => {
    const res = await fetch(`${BASE}/products`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('backend /api/campaigns/active-all responds', async () => {
    const res = await fetch(`${BASE}/campaigns/active-all`);
    expect([200, 404]).toContain(res.status);
  });

  it('backend /api/collections responds', async () => {
    const res = await fetch(`${BASE}/collections`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('frontend dev server responds 200', async () => {
    const res = await fetch('http://localhost:5173');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('root');
  });
});
