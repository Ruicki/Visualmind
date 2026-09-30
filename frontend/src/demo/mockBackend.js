/**
 * @file mockBackend.js
 * @description Servidor simulado para la versión de demostración (build con VITE_DEMO=1).
 * Reemplaza el adaptador de Axios y responde en el navegador con las mismas reglas que
 * el backend real: precios sin ITBMS, stock por talla, estados de pedido, compra como
 * invitado, recuperación de contraseña y panel de administración.
 * Los datos se guardan en localStorage del visitante; "Reiniciar demo" vuelve al inicio.
 * No se incluye en el build normal de la tienda.
 */
import { AxiosError } from 'axios';

const STORAGE_KEY = 'visualmind-demo-db-v1';
export const DEMO_ADMIN = { email: 'admin@demo.visualmind', password: 'Admin2026' };
export const DEMO_CUSTOMER = { email: 'cliente@demo.visualmind', password: 'Cliente2026' };

const TRANSITIONS = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};
const PAYMENT_METHODS = ['yappy', 'transfer', 'cash_on_delivery'];
const PAID = ['paid', 'shipped', 'delivered'];
const MAX_PENDING = 3;
const MAX_UNITS = 20;

const uid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)));
const now = () => new Date().toISOString();
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5).toISOString();
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const norm = (v) => String(v ?? '').trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Datos iniciales                                                     */
/* ------------------------------------------------------------------ */

function seed() {
    const cat = (name, slug) => ({ id: uid(), name, slug, icon: null, description: '', created_at: now() });
    const categories = [cat('Anime', 'anime'), cat('Cartoons', 'cartoons'), cat('Deportes', 'deportes'), cat('Panamá', 'panama')];
    const col = (name, slug, description, image_url) => ({ id: uid(), name, slug, description, description_long: '', image_url, is_active: true, created_at: now() });
    const collections = [
        col('Jujutsu Kaisen', 'jujutsu-kaisen', 'Gojo y Sukuna en cuatro colores', 'img/black-satoru-gojo.webp'),
        col('One Piece', 'one-piece', 'Luffy y Zoro', 'img/black-onepiece-luffy.webp'),
        col('Fiestas Patrias', 'fiestas-patrias', 'Pollera, guna, emberá', 'img/pollera.webp'),
    ];
    const colId = (slug) => collections.find(c => c.slug === slug).id;
    const campaign = {
        id: uid(), name: 'Halloween 2026', slug: 'halloween-2026', description: 'Colección de terror: Uzumaki, alien y más',
        banner_url: 'img/uzumaki.webp', accent_color: '#ff6a00', template_type: 'grid',
        start_date: daysAgo(3), end_date: new Date(Date.now() + 30 * 864e5).toISOString(), is_active: true,
        countdown_enabled: true, type: 'season', button_text: 'Ver colección', button_link: '/shop',
        secondary_images: [], created_at: daysAgo(3), updated_at: daysAgo(3)
    };
    const P = (title, category, price, image, hover, extra = {}) => ({
        id: uid(), title, description: 'Algodón 100% peinado, estampado DTF de alta duración. Diseño original Visualmind.',
        price, category, sub_category: '', parent_category: '', image_url: image, hover_image_url: hover, sku: null,
        stock: 0, is_new: false, discount: 0, featured: false, new_arrival: false, launch_date: null, tags: '',
        lifecycle_state: 'Published', priority: 0, campaign_id: null, collection_id: null, layout_preference: 'standard',
        admin_notes: '', show_on_home: false, created_at: daysAgo(10), updated_at: daysAgo(10), ...extra
    });
    const products = [
        P('Camiseta Satoru Gojo Negra', 'Anime', 24.99, 'img/black-satoru-gojo.webp', 'img/blanco-satoru-gojo.webp', { featured: true, is_new: true, new_arrival: true, show_on_home: true, collection_id: colId('jujutsu-kaisen') }),
        P('Camiseta Sukuna Beige', 'Anime', 24.99, 'img/beige-sukuna.webp', 'img/black-sukuna.webp', { featured: true, new_arrival: true, collection_id: colId('jujutsu-kaisen') }),
        P('Camiseta Luffy Negra', 'Anime', 22.99, 'img/black-onepiece-luffy.webp', 'img/blanco-onepiece-luffy.webp', { featured: true, collection_id: colId('one-piece') }),
        P('Camiseta Zoro Gris', 'Anime', 22.99, 'img/gris-onepiece-zoro.webp', 'img/black-onepiece-zoro.webp', { collection_id: colId('one-piece') }),
        P('Camiseta Snoopy Pink', 'Cartoons', 19.99, 'img/pink-snoopy.webp', 'img/blanco-snoopy.webp', { new_arrival: true, is_new: true }),
        P('Camiseta Garfield Beige', 'Cartoons', 19.99, 'img/beige-garfield.webp', 'img/black-garfield.webp'),
        P('Camiseta Tom & Jerry Gris', 'Cartoons', 19.99, 'img/gris-tom-jerry.webp', 'img/blanco-tom-jerry.webp'),
        P('Camiseta Messi Negra', 'Deportes', 26.99, 'img/black-messi.webp', 'img/blanco-messi.webp', { featured: true, new_arrival: true }),
        P('Camiseta Hollow Knight Negra', 'Anime', 23.99, 'img/blackhollow.webp', 'img/blancohollow.webp', { new_arrival: true }),
        P('Camiseta Pollera', 'Panamá', 21.99, 'img/pollera.webp', 'img/guna.webp', { featured: true, collection_id: colId('fiestas-patrias') }),
        P('Camiseta Guna', 'Panamá', 21.99, 'img/guna.webp', 'img/embera.webp', { collection_id: colId('fiestas-patrias') }),
        P('Camiseta Uzumaki', 'Anime', 25.99, 'img/uzumaki.webp', 'img/alien.webp', { campaign_id: campaign.id, new_arrival: true }),
        P('Camiseta Smile Every Day', 'Cartoons', 18.99, 'img/smile-black.webp', 'img/smile-pink.webp', { lifecycle_state: 'Draft', admin_notes: 'Borrador: no debe verse en la tienda' }),
    ];
    const variants = [];
    const sizes = [['S', 4], ['M', 8], ['L', 6], ['XL', 3]];
    products.forEach((p, i) => sizes.forEach(([size, stock]) => variants.push({
        id: uid(), product_id: p.id, size, color: null, stock: i === 7 && size === 'S' ? 1 : stock, sku: null
    })));
    products.forEach(p => { p.stock = variants.filter(v => v.product_id === p.id).reduce((n, v) => n + v.stock, 0); });

    const users = [
        { id: uid(), email: DEMO_ADMIN.email, password: DEMO_ADMIN.password, full_name: 'Administrador Visualmind', role: 'admin', token_version: 0, created_at: daysAgo(30) },
        { id: uid(), email: DEMO_CUSTOMER.email, password: DEMO_CUSTOMER.password, full_name: 'Ana Rodríguez', role: 'customer', token_version: 0, created_at: daysAgo(20) },
    ];
    const featured = products.filter(p => p.featured).slice(0, 5).map((p, i) => ({ slot_order: i + 1, product_id: p.id, rotation: 'weekly', campaign_id: null }));

    const db = { users, products, variants, categories, collections, campaigns: [campaign], featured, orders: [], events: [], addresses: [], newsletter: [], resets: [] };

    // Pedidos de ejemplo en distintos estados
    const customer = users[1];
    const mk = (ps, status, method, when, ship) => {
        const items = ps.map(([idx, size, qty]) => {
            const p = products[idx];
            const v = variants.find(x => x.product_id === p.id && x.size === size);
            return { product_id: p.id, variant_id: v.id, title: p.title, image_url: p.image_url, size, color: null, quantity: qty, price: p.price };
        });
        const subtotal = round2(items.reduce((n, i) => n + i.price * i.quantity, 0));
        const order = {
            id: uid(), user_id: ship.guest ? null : customer.id, items, subtotal, shipping_cost: 0, tax: 0, total: subtotal,
            status, payment_method: method, created_at: when, paid_at: PAID.includes(status) ? when : null,
            shipping_details: { name: ship.name, email: ship.email, phone: ship.phone, address: ship.address, city: ship.city, zip: '', notes: ship.notes || '' }
        };
        if (status !== 'cancelled') items.forEach(i => { variants.find(v => v.id === i.variant_id).stock -= i.quantity; });
        db.orders.push(order);
        const path = { pending: ['pending'], paid: ['pending', 'paid'], shipped: ['pending', 'paid', 'shipped'], delivered: ['pending', 'paid', 'shipped', 'delivered'], cancelled: ['pending', 'cancelled'] }[status];
        path.forEach((s, k) => db.events.push({ id: db.events.length + 1, order_id: order.id, from_status: k ? path[k - 1] : null, to_status: s, changed_by: k ? users[0].id : order.user_id, note: k ? null : 'Pedido creado', created_at: when }));
    };
    const ana = { name: 'Ana Rodríguez', email: customer.email, phone: '6123-4567', address: 'Vía España, Edif. Sol, apto 4B', city: 'Panamá', notes: 'Portería' };
    mk([[0, 'M', 1], [1, 'L', 1]], 'delivered', 'yappy', daysAgo(6), ana);
    mk([[7, 'L', 2]], 'shipped', 'transfer', daysAgo(3), { name: 'Luis Castillo', email: 'luis@ejemplo.com', phone: '6234-5678', address: 'Calle 50, Obarrio', city: 'Panamá', guest: true });
    mk([[4, 'S', 1]], 'paid', 'cash_on_delivery', daysAgo(2), { name: 'María Gómez', email: 'maria@ejemplo.com', phone: '6345-6789', address: 'Av. Perú, Casa 12', city: 'David', guest: true });
    mk([[2, 'XL', 1], [9, 'M', 1]], 'pending', 'yappy', daysAgo(0, 3), { name: 'Carlos Pérez', email: 'carlos@ejemplo.com', phone: '6456-7890', address: 'Costa del Este, PH Mar', city: 'Panamá', guest: true });
    mk([[8, 'M', 1]], 'cancelled', 'yappy', daysAgo(4), ana);
    products.forEach(p => { p.stock = variants.filter(v => v.product_id === p.id).reduce((n, v) => n + v.stock, 0); });
    return db;
}

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

let db;
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* sin almacenamiento: se usa memoria */ }
    return seed();
}
function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ }
}
export function resetDemo() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
    } catch { /* nada que borrar */ }
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
    constructor(status, body) { super(body?.message || body?.error || 'Error'); this.status = status; this.body = body; }
}
const fail = (status, message, extra = {}) => { throw new HttpError(status, { message, error: message, ...extra }); };

const visible = (p) => ['Published', 'Legacy'].includes(p.lifecycle_state);
const variantsOf = (id) => db.variants.filter(v => v.product_id === id);
const syncStock = (p) => {
    const vs = variantsOf(p.id);
    if (vs.length) p.stock = vs.reduce((n, v) => n + v.stock, 0);
    p.updated_at = now();
};
const withVariants = (p) => ({ ...p, variants: variantsOf(p.id) });
const publicProduct = (p) => { const { admin_notes: _omit, ...rest } = withVariants(p); return rest; };
const toBool = (v) => v === true || v === 'true';

async function readBody(config) {
    const data = config.data;
    if (data == null) return {};
    if (typeof data === 'string') { try { return JSON.parse(data); } catch { return {}; } }
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        const out = {};
        for (const [key, value] of data.entries()) {
            out[key] = (typeof File !== 'undefined' && value instanceof File)
                ? await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(value); })
                : value;
        }
        return out;
    }
    return data;
}

function currentUser(config) {
    const header = config.headers?.Authorization || config.headers?.authorization || '';
    const token = String(header).replace(/^Bearer\s+/, '');
    if (!token) return null;
    let payload = {};
    try { payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { /* token inválido */ }
    const user = db.users.find(u => u.id === payload.id);
    if (!user || user.token_version !== payload.tv) fail(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    return user;
}
const requireUser = (u) => { if (!u) fail(401, 'No autorizado, no hay token'); return u; };
const requireAdmin = (u) => { requireUser(u); if (u.role !== 'admin') fail(403, 'Acceso denegado: permisos insuficientes'); return u; };
// Mismo formato que un JWT (la app revisa su vencimiento al cargar); la firma no se valida en la demo
const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (u) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ id: u.id, role: u.role, tv: u.token_version, exp: Math.floor(Date.now() / 1000) + 86400 })}.demo`;
const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role });
const passwordProblem = (p) => {
    p = String(p ?? '');
    if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'La contraseña debe incluir letras y números';
    return null;
};
const csv = (headers, rows) => {
    const cell = (v) => { let t = v == null ? '' : String(v); if (/^[=+\-@]/.test(t)) t = `'${t}`; return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    return '﻿' + [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
};
const restock = (order) => {
    for (const item of order.items) {
        const v = db.variants.find(x => x.id === item.variant_id)
            || db.variants.find(x => x.product_id === item.product_id && norm(x.size) === norm(item.size));
        const p = db.products.find(x => x.id === item.product_id);
        if (v) v.stock += item.quantity; else if (p) p.stock += item.quantity;
        if (p) syncStock(p);
    }
};
const addEvent = (order, from, to, by, note = null) =>
    db.events.push({ id: db.events.length + 1, order_id: order.id, from_status: from, to_status: to, changed_by: by?.id || null, note, created_at: now() });

/* ------------------------------------------------------------------ */
/* Rutas                                                               */
/* ------------------------------------------------------------------ */

const routes = [];
const on = (method, pattern, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:[a-z_]+/g, (k) => { keys.push(k.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, handler });
};

// --- Catálogo ---
on('get', '/products', ({ query }) => {
    const term = norm(query.search);
    return db.products.filter(visible)
        .filter(p => !term || [p.title, p.category, p.sub_category].some(f => norm(f).includes(term)))
        .sort((a, b) => b.priority - a.priority || b.created_at.localeCompare(a.created_at))
        .map(publicProduct);
});
on('get', '/products/admin', ({ user }) => {
    requireAdmin(user);
    return db.products.map(p => ({
        ...withVariants(p), variants_count: variantsOf(p.id).length, variants_stock: variantsOf(p.id).reduce((n, v) => n + v.stock, 0),
        campaign_name: db.campaigns.find(c => c.id === p.campaign_id)?.name || null,
        collection_name: db.collections.find(c => c.id === p.collection_id)?.name || null,
    }));
});
on('get', '/products/categories', () => [...new Set(db.products.map(p => p.category).filter(Boolean))]);
on('get', '/products/sub-categories', () => [...new Set(db.products.map(p => p.sub_category).filter(Boolean))]);
on('get', '/products/:id', ({ params }) => {
    const p = db.products.find(x => x.id === params.id && visible(x));
    if (!p) fail(404, 'Producto no encontrado');
    return publicProduct(p);
});
function applyProduct(p, body) {
    const price = parseFloat(body.price) || 0;
    if (!(price > 0)) fail(400, 'El precio debe ser mayor que 0.');
    Object.assign(p, {
        title: body.title, description: body.description || '', price, category: body.category || '',
        sub_category: body.sub_category || '', parent_category: body.parent_category || '', sku: body.sku || null,
        is_new: toBool(body.is_new), discount: Math.min(Math.max(parseFloat(body.discount) || 0, 0), 100),
        featured: toBool(body.featured), new_arrival: toBool(body.new_arrival), launch_date: body.launch_date || null,
        lifecycle_state: body.lifecycle_state || 'Published', priority: parseInt(body.priority) || 0,
        campaign_id: body.campaign_id || null, collection_id: body.collection_id || null,
        layout_preference: body.layout_preference || 'standard', admin_notes: body.admin_notes || '',
        tags: body.tags || '', show_on_home: toBool(body.show_on_home), updated_at: now()
    });
    if (body.image) p.image_url = body.image; else if (body.image_url) p.image_url = body.image_url;
    if (body.hover_image) p.hover_image_url = body.hover_image; else if (body.hover_image_url) p.hover_image_url = body.hover_image_url;
    let list = body.variants;
    if (typeof list === 'string') { try { list = JSON.parse(list); } catch { list = []; } }
    if (Array.isArray(list)) {
        const keep = [];
        for (const v of list) {
            const stock = Math.max(parseInt(v.stock) || 0, 0);
            const match = variantsOf(p.id).find(e => !keep.includes(e.id) && ((v.id && e.id === v.id) || (!v.id && norm(e.size) === norm(v.size) && norm(e.color) === norm(v.color))));
            if (match) { Object.assign(match, { size: v.size, color: v.color || null, stock, sku: v.sku || null }); keep.push(match.id); }
            else { const nv = { id: uid(), product_id: p.id, size: v.size, color: v.color || null, stock, sku: v.sku || null }; db.variants.push(nv); keep.push(nv.id); }
        }
        db.variants = db.variants.filter(v => v.product_id !== p.id || keep.includes(v.id));
        if (list.length) syncStock(p); else p.stock = parseInt(body.stock) || 0;
    }
}
on('post', '/products', ({ user, body }) => {
    requireAdmin(user);
    const p = { id: uid(), created_at: now(), stock: 0, image_url: null, hover_image_url: null };
    applyProduct(p, body);
    db.products.push(p);
    return [201, p];
});
on('put', '/products/:id', ({ user, body, params }) => {
    requireAdmin(user);
    const p = db.products.find(x => x.id === params.id);
    if (!p) fail(404, 'Producto no encontrado');
    if (body.expected_updated_at && new Date(body.expected_updated_at).getTime() !== new Date(p.updated_at).getTime()) {
        fail(409, 'Este producto cambió mientras lo editabas (por ejemplo, se vendió una unidad). Cierra el formulario y vuelve a abrirlo para ver el stock actual.', { code: 'STALE_PRODUCT' });
    }
    applyProduct(p, body);
    return p;
});
on('delete', '/products/:id', ({ user, params }) => {
    requireAdmin(user);
    db.products = db.products.filter(p => p.id !== params.id);
    db.variants = db.variants.filter(v => v.product_id !== params.id);
    return { message: 'Producto eliminado correctamente' };
});

// --- Categorías y colecciones ---
on('get', '/categories', () => [...db.categories].sort((a, b) => a.name.localeCompare(b.name)));
on('post', '/categories', ({ user, body }) => { requireAdmin(user); const c = { id: uid(), name: body.name, slug: body.slug, icon: body.icon || null, description: body.description || '', created_at: now() }; db.categories.push(c); return [201, c]; });
on('put', '/categories/:id', ({ user, body, params }) => { requireAdmin(user); const c = db.categories.find(x => x.id === params.id); if (!c) fail(404, 'Categoría no encontrada'); Object.assign(c, { name: body.name, slug: body.slug, icon: body.icon, description: body.description }); return c; });
on('delete', '/categories/:id', ({ user, params }) => { requireAdmin(user); db.categories = db.categories.filter(c => c.id !== params.id); return { message: 'Categoría eliminada' }; });
on('get', '/subcategories', () => []);

on('get', '/collections', () => db.collections);
on('get', '/collections/:slug/products', ({ params }) => {
    const c = db.collections.find(x => x.slug === params.slug);
    if (!c) fail(404, 'Colección no encontrada');
    return db.products.filter(p => p.collection_id === c.id && p.stock > 0 && p.lifecycle_state === 'Published').map(publicProduct);
});
on('get', '/collections/:slug', ({ params }) => db.collections.find(x => x.slug === params.slug) || fail(404, 'Colección no encontrada'));
const saveCollection = (c, body) => Object.assign(c, {
    name: body.name, slug: body.slug, description: body.description || '', description_long: body.description_long || '',
    is_active: toBool(body.is_active), image_url: body.image || body.image_url || c.image_url || null, updated_at: now()
});
on('post', '/collections', ({ user, body }) => { requireAdmin(user); const c = saveCollection({ id: uid(), created_at: now() }, body); db.collections.push(c); return [201, c]; });
on('put', '/collections/:id', ({ user, body, params }) => { requireAdmin(user); const c = db.collections.find(x => x.id === params.id); if (!c) fail(404, 'Colección no encontrada'); return saveCollection(c, body); });
on('delete', '/collections/:id', ({ user, params }) => { requireAdmin(user); db.collections = db.collections.filter(c => c.id !== params.id); return { message: 'Colección eliminada' }; });

// --- Campañas y destacados ---
const liveCampaign = (c) => c.is_active && (!c.end_date || new Date(c.end_date) >= new Date());
on('get', '/campaigns', () => db.campaigns.filter(liveCampaign));
on('get', '/campaigns/admin', ({ user }) => { requireAdmin(user); return db.campaigns; });
on('get', '/campaigns/active', () => db.campaigns.find(c => liveCampaign(c) && (!c.start_date || new Date(c.start_date) <= new Date())) || null);
on('get', '/campaigns/active-all', () => db.campaigns.filter(liveCampaign).map(c => ({ ...c, phase: c.start_date && new Date(c.start_date) > new Date() ? 'upcoming' : 'active' })));
on('get', '/campaigns/upcoming', () => db.campaigns.filter(c => c.is_active && c.start_date && new Date(c.start_date) > new Date()));
const saveCampaign = (c, body) => {
    let secondary = body.secondary_images;
    if (typeof secondary === 'string') { try { secondary = JSON.parse(secondary || '[]'); } catch { secondary = []; } }
    secondary = Array.isArray(secondary) ? secondary : [];
    [0, 1, 2].forEach(i => { if (body[`secondary_image_${i}`]) secondary[i] = body[`secondary_image_${i}`]; });
    return Object.assign(c, {
        name: body.name, slug: body.slug, description: body.description || '', banner_url: body.image || body.banner_url || c.banner_url || null,
        accent_color: body.accent_color, template_type: body.template_type || 'grid',
        start_date: body.start_date && body.start_date !== 'null' ? body.start_date : null,
        end_date: body.end_date && body.end_date !== 'null' ? body.end_date : null,
        is_active: toBool(body.is_active), countdown_enabled: toBool(body.countdown_enabled), type: body.type || 'campaign',
        button_text: body.button_text || '', button_link: body.button_link || '', secondary_images: secondary.filter(Boolean), updated_at: now()
    });
};
on('post', '/campaigns', ({ user, body }) => { requireAdmin(user); const c = saveCampaign({ id: uid(), created_at: now() }, body); db.campaigns.push(c); return [201, c]; });
on('put', '/campaigns/:id', ({ user, body, params }) => { requireAdmin(user); const c = db.campaigns.find(x => x.id === params.id); if (!c) fail(404, 'Campaña no encontrada'); return saveCampaign(c, body); });
on('delete', '/campaigns/:id', ({ user, params }) => { requireAdmin(user); db.campaigns = db.campaigns.filter(c => c.id !== params.id); return { message: 'Campaña eliminada correctamente' }; });
on('post', '/campaigns/expire', ({ user }) => {
    requireAdmin(user);
    const expired = db.campaigns.filter(c => c.is_active && c.end_date && new Date(c.end_date) < new Date());
    expired.forEach(c => { c.is_active = false; });
    return { expiredCount: expired.length, updatedProducts: 0 };
});
on('get', '/featured-products', ({ query }) => {
    const slots = db.featured.filter(s => (query.campaign_id ? s.campaign_id === query.campaign_id : !s.campaign_id)).sort((a, b) => a.slot_order - b.slot_order);
    const list = slots.map(s => db.products.find(p => p.id === s.product_id && p.stock > 0 && p.lifecycle_state === 'Published')).filter(Boolean);
    if (list.length) return list.map((p, i) => ({ ...publicProduct(p), slot_order: slots[i]?.slot_order }));
    return db.products.filter(p => p.stock > 0 && p.lifecycle_state === 'Published').slice(0, query.campaign_id ? 5 : 8).map(publicProduct);
});
on('put', '/featured-products/slots', ({ user, body }) => {
    requireAdmin(user);
    if (!Array.isArray(body.slots)) fail(400, 'slots debe ser un array');
    db.featured = db.featured.filter(s => (body.campaign_id ? s.campaign_id !== body.campaign_id : !!s.campaign_id))
        .concat(body.slots.filter(s => s.product_id).map(s => ({ slot_order: s.slot_order, product_id: s.product_id, rotation: body.rotation || 'weekly', campaign_id: body.campaign_id || null })));
    return { message: 'Slots actualizados correctamente' };
});

// --- Cuentas ---
on('post', '/auth/login', ({ body }) => {
    const u = db.users.find(x => x.email === norm(body.email));
    if (!u || u.password !== String(body.password)) fail(401, 'Credenciales inválidas');
    return { token: tokenFor(u), user: publicUser(u) };
});
on('post', '/auth/register', ({ body }) => {
    const email = norm(body.email);
    if (!EMAIL_RE.test(email)) fail(400, 'Escribe un email válido');
    const problem = passwordProblem(body.password); if (problem) fail(400, problem);
    if (db.users.some(u => u.email === email)) fail(400, 'El usuario ya existe');
    const u = { id: uid(), email, password: String(body.password), full_name: body.full_name || null, role: 'customer', token_version: 0, created_at: now() };
    db.users.push(u);
    return [201, { token: tokenFor(u), user: publicUser(u) }];
});
on('get', '/auth/me', ({ user }) => ({ ...publicUser(requireUser(user)), created_at: user.created_at }));
on('put', '/auth/me', ({ user, body }) => {
    requireUser(user);
    const email = body.email ? norm(body.email) : null;
    if (email && !EMAIL_RE.test(email)) fail(400, 'Escribe un email válido');
    if (email && db.users.some(u => u.email === email && u.id !== user.id)) fail(409, 'El email ya está en uso');
    if (body.full_name != null) user.full_name = String(body.full_name).slice(0, 255);
    if (email) user.email = email;
    return publicUser(user);
});
on('post', '/auth/promote', ({ user, body }) => {
    requireAdmin(user);
    const u = db.users.find(x => x.email === norm(body.email)); if (!u) fail(404, 'Usuario no encontrado');
    u.role = 'admin';
    return { message: 'Usuario promovido a admin', user: publicUser(u) };
});
on('post', '/auth/reset-link', ({ user, body }) => {
    requireAdmin(user);
    const u = db.users.find(x => x.email === norm(body.email)); if (!u) fail(404, 'No hay ninguna cuenta con ese email');
    const token = uid().replace(/-/g, '');
    const expires_at = new Date(Date.now() + 24 * 36e5).toISOString();
    db.resets.push({ token, user_id: u.id, expires_at, used_at: null });
    const base = window.location.href.split('#')[0];
    return [201, { url: `${base}#/reset-password?token=${token}`, expires_at }];
});
on('post', '/auth/reset-password', ({ body }) => {
    const problem = passwordProblem(body.password); if (problem) fail(400, problem);
    const r = db.resets.find(x => x.token === body.token && !x.used_at && new Date(x.expires_at) > new Date());
    if (!r) fail(400, 'El enlace venció o ya se usó. Pide uno nuevo por WhatsApp.');
    const u = db.users.find(x => x.id === r.user_id);
    u.password = String(body.password); u.token_version += 1; r.used_at = now();
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
});

// --- Direcciones y newsletter ---
on('get', '/addresses', ({ user }) => db.addresses.filter(a => a.user_id === requireUser(user).id));
on('post', '/addresses', ({ user, body }) => { requireUser(user); const a = { id: uid(), user_id: user.id, ...body, country: body.country || 'Panama', created_at: now() }; db.addresses.push(a); return [201, a]; });
on('put', '/addresses/:id', ({ user, body, params }) => { requireUser(user); const a = db.addresses.find(x => x.id === params.id && x.user_id === user.id); if (!a) fail(404, 'Dirección no encontrada'); Object.assign(a, body); return a; });
on('delete', '/addresses/:id', ({ user, params }) => { requireUser(user); db.addresses = db.addresses.filter(a => !(a.id === params.id && a.user_id === user.id)); return { message: 'Dirección eliminada' }; });
on('post', '/newsletter/subscribe', ({ body }) => {
    if (body.website) return { message: 'Suscripción exitosa', alreadySubscribed: false };
    const email = norm(body.email); if (!EMAIL_RE.test(email)) fail(400, 'Email inválido');
    if (db.newsletter.some(n => n.email === email)) return { message: 'Ya estabas suscrito', alreadySubscribed: true };
    db.newsletter.push({ email, subscribed_at: now() });
    return { message: 'Suscripción exitosa', alreadySubscribed: false };
});

// --- Pedidos ---
on('get', '/orders/pricing', () => ({ shippingCost: 0, freeShippingThreshold: 0 }));
on('post', '/orders', ({ user, body }) => {
    const ship = body.shippingDetails || {};
    const lines = new Map();
    if (!Array.isArray(body.items) || body.items.length === 0) fail(400, 'El pedido debe tener al menos un artículo');
    for (const raw of body.items) {
        const qty = Number(raw.quantity);
        if (!raw.product_id || !Number.isInteger(qty) || qty < 1 || qty > MAX_UNITS) fail(400, 'Artículo inválido en el carrito');
        const color = typeof raw.color === 'object' ? raw.color?.name || null : raw.color || null;
        const key = `${raw.product_id}|${raw.size}|${color}`;
        const total = (lines.get(key)?.quantity || 0) + qty;
        if (total > MAX_UNITS) fail(400, `Máximo ${MAX_UNITS} unidades por talla en un pedido`);
        lines.set(key, { product_id: raw.product_id, size: raw.size ?? null, color, quantity: total });
    }
    if (!PAYMENT_METHODS.includes(body.paymentMethod)) fail(400, 'Selecciona un método de pago válido');
    const missing = ['name', 'phone', 'address', 'city'].filter(k => !String(ship[k] || '').trim());
    if (missing.length) fail(400, `Faltan datos de envío: ${missing.join(', ')}`);
    const email = norm(ship.email || user?.email);
    if (!user && !EMAIL_RE.test(email)) fail(400, 'Escribe un email válido para enviarte la confirmación.');
    const phone = String(ship.phone).replace(/\D/g, '');
    const pending = db.orders.filter(o => o.status === 'pending' && (user
        ? o.user_id === user.id
        : !o.user_id && (String(o.shipping_details.phone).replace(/\D/g, '') === phone || norm(o.shipping_details.email) === email))).length;
    if (pending >= MAX_PENDING) fail(429, 'Tienes pedidos pendientes de pago. Completa el pago o escríbenos por WhatsApp antes de hacer otro.');

    // Validar todo antes de descontar (equivale a la transacción del servidor)
    const plan = [...lines.values()].map(line => {
        const p = db.products.find(x => x.id === line.product_id);
        if (!p || !visible(p)) fail(409, 'Uno de los productos ya no está disponible');
        const vs = variantsOf(p.id);
        const v = vs.filter(x => norm(x.size) === norm(line.size)).sort((a, b) => b.stock - a.stock)[0];
        if (vs.length && !v) fail(409, `La opción "${line.size || 'sin talla'}" no está disponible para "${p.title}"`);
        const available = v ? v.stock : p.stock;
        const label = [p.title, line.size].filter(Boolean).join(' / ');
        if (available < line.quantity) fail(409, available > 0 ? `Solo quedan ${available} unidades de "${label}"` : `"${label}" está agotado`);
        return { p, v, line };
    });
    const items = plan.map(({ p, v, line }) => {
        if (v) v.stock -= line.quantity; else p.stock -= line.quantity;
        syncStock(p);
        return { product_id: p.id, variant_id: v?.id || null, title: p.title, image_url: p.image_url, size: v?.size || line.size, color: line.color, quantity: line.quantity, price: p.price };
    });
    const subtotal = round2(items.reduce((n, i) => n + i.price * i.quantity, 0));
    const order = {
        id: uid(), user_id: user?.id || null, items, subtotal, shipping_cost: 0, tax: 0, total: subtotal, status: 'pending',
        payment_method: body.paymentMethod, created_at: now(), paid_at: null,
        shipping_details: { name: ship.name, email, phone: ship.phone, address: ship.address, city: ship.city, zip: ship.zip || '', notes: ship.notes || '' }
    };
    db.orders.push(order);
    addEvent(order, null, 'pending', user, 'Pedido creado');
    return [201, order];
});
on('get', '/orders/my', ({ user }) => db.orders.filter(o => o.user_id === requireUser(user).id).sort((a, b) => b.created_at.localeCompare(a.created_at)));
on('get', '/orders/all', ({ user }) => {
    requireAdmin(user);
    return [...db.orders].sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(o => ({ ...o, user_email: db.users.find(u => u.id === o.user_id)?.email || null }));
});
on('get', '/orders/:id/events', ({ user, params }) => {
    requireAdmin(user);
    return db.events.filter(e => e.order_id === params.id).map(e => ({ ...e, changed_by_email: db.users.find(u => u.id === e.changed_by)?.email || null }));
});
on('put', '/orders/:id/status', ({ user, body, params }) => {
    requireAdmin(user);
    const o = db.orders.find(x => x.id === params.id); if (!o) fail(404, 'Orden no encontrada');
    if (o.status === body.status) return o;
    if (!(TRANSITIONS[o.status] || []).includes(body.status)) {
        fail(409, o.status === 'cancelled' ? 'Una orden cancelada no se puede reabrir. Crea un pedido nuevo.' : `No se puede pasar un pedido de "${o.status}" a "${body.status}".`);
    }
    if (body.status === 'cancelled') restock(o);
    if (body.status === 'paid' && !o.paid_at) o.paid_at = now();
    addEvent(o, o.status, body.status, user);
    o.status = body.status;
    return o;
});

// --- Admin: panel y reportes ---
on('get', '/admin/stats', ({ user }) => {
    requireAdmin(user);
    const paid = db.orders.filter(o => PAID.includes(o.status));
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const lastStart = new Date(monthStart); lastStart.setMonth(lastStart.getMonth() - 1);
    const sum = (list) => round2(list.reduce((n, o) => n + Number(o.total), 0));
    const thisMonth = sum(paid.filter(o => new Date(o.created_at) >= monthStart));
    const lastMonth = sum(paid.filter(o => new Date(o.created_at) >= lastStart && new Date(o.created_at) < monthStart));
    const pending = db.orders.filter(o => o.status === 'pending');
    const week = {};
    paid.filter(o => Date.now() - new Date(o.created_at) < 7 * 864e5).forEach(o => {
        const d = new Date(o.created_at); const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        week[key] = round2((week[key] || 0) + Number(o.total));
    });
    const sold = {};
    paid.forEach(o => o.items.forEach(i => { sold[i.title] = sold[i.title] || { title: i.title, sales_count: 0, items_sold: 0 }; sold[i.title].sales_count += 1; sold[i.title].items_sold += i.quantity; }));
    const low = db.variants.filter(v => v.stock < 10).map(v => { const p = db.products.find(x => x.id === v.product_id); return p && { id: p.id, title: `${p.title} (${v.size}/${v.color || ''})`, stock: v.stock, image_url: p.image_url, type: 'Variant' }; }).filter(Boolean).slice(0, 10);
    return {
        stats: {
            totalSales: sum(paid), salesThisMonth: thisMonth, growth: lastMonth > 0 ? Math.round((thisMonth - lastMonth) / lastMonth * 1000) / 10 : null,
            pendingPayment: { count: pending.length, amount: sum(pending) }, totalOrders: db.orders.filter(o => o.status !== 'cancelled').length,
            totalCustomers: db.users.filter(u => u.role === 'customer').length, newsletterSubscribers: db.newsletter.length
        },
        weeklySales: Object.entries(week).map(([date, amount]) => ({ date, amount })),
        topSellers: Object.values(sold).sort((a, b) => b.items_sold - a.items_sold).slice(0, 5),
        recentOrders: [...db.orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5).map(o => ({ ...o, customer_email: o.shipping_details.email, customer_name: o.shipping_details.name })),
        lowStock: low
    };
});
on('get', '/admin/reports/sales.csv', ({ user, query }) => {
    requireAdmin(user);
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(new Date(query.to).getTime() + 864e5) : null;
    const rows = db.orders.filter(o => PAID.includes(o.status)).filter(o => { const d = new Date(o.paid_at || o.created_at); return (!from || d >= from) && (!to || d < to); })
        .map(o => [o.id.slice(0, 8).toUpperCase(), o.created_at, o.paid_at || o.created_at, o.status, o.payment_method, o.subtotal, o.shipping_cost, o.total, o.shipping_details.name, o.shipping_details.email, o.shipping_details.phone, o.shipping_details.city, o.items.map(i => `${i.quantity}x ${i.title} (${i.size})`).join(' | ')]);
    return new Blob([csv(['Pedido', 'Creado', 'Pagado', 'Estado', 'Método', 'Subtotal', 'Envío', 'Total', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Artículos'], rows)], { type: 'text/csv' });
});
on('get', '/admin/reports/newsletter.csv', ({ user }) => {
    requireAdmin(user);
    return new Blob([csv(['Email', 'Fecha'], db.newsletter.map(n => [n.email, n.subscribed_at]))], { type: 'text/csv' });
});

/* ------------------------------------------------------------------ */
/* Adaptador de Axios                                                  */
/* ------------------------------------------------------------------ */

async function adapter(config) {
    await new Promise(r => setTimeout(r, 120)); // latencia realista
    const url = new URL(config.url.replace(/^\/?api/, ''), 'http://demo.local');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = (config.method || 'get').toLowerCase();
    const query = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };
    const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });
    try {
        const route = routes.find(r => r.method === method && r.re.test(path));
        if (!route) fail(404, `Ruta no disponible en la demo: ${method.toUpperCase()} ${path}`);
        const match = path.match(route.re);
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        const user = currentUser(config);
        const body = await readBody(config);
        let result = await route.handler({ user, body, params, query });
        let status = 200;
        if (Array.isArray(result) && typeof result[0] === 'number' && result.length === 2) [status, result] = result;
        save();
        // Copia profunda: la app nunca comparte objetos con la "base de datos" simulada
        return respond(status, result instanceof Blob ? result : JSON.parse(JSON.stringify(result ?? null)));
    } catch (caught) {
        if (!(caught instanceof HttpError)) console.error('[Demo]', caught);
        const error = caught instanceof HttpError ? caught : new HttpError(500, { message: 'Error interno de la demo' });
        const response = respond(error.status, error.body);
        throw new AxiosError(error.message, error.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response);
    }
}

/** Activa la demo sobre la instancia de Axios de la tienda. */
export function installDemo(api) {
    db = load();
    save();
    api.defaults.adapter = adapter;
}
