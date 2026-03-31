# Documento de Diseño

## Introducción

Este documento describe el diseño técnico para implementar las correcciones identificadas en la auditoría de Visualmind. Las soluciones están organizadas por área funcional y priorizadas por criticidad. El objetivo es llevar la aplicación a un estado production-ready con mínimas modificaciones estructurales, aprovechando la arquitectura existente.

---

## Arquitectura General

La aplicación mantiene su arquitectura actual:
- **Frontend**: React 19 + Vite, con contextos para estado global (Auth, Cart, Wishlist, Language).
- **Backend**: Express.js con PostgreSQL via `pg` pool, JWT para autenticación.
- **Comunicación**: Axios con instancia configurada en `frontend/src/api/axiosConfig.js`.

No se introducen nuevas dependencias de arquitectura. Los cambios son quirúrgicos sobre archivos existentes.

---

## Grupo 1: Seguridad Backend

### 1.1 CORS Restrictivo

**Archivo**: `backend/src/server.js`

Reemplazar `app.use(cors())` por configuración explícita:

```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej. Postman en dev) solo en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

**Variable de entorno a agregar en `.env`**:
```
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=https://visualmind.com
```

### 1.2 Rate Limiting

**Archivo**: `backend/src/server.js`

Instalar: `npm install express-rate-limit`

```js
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  skip: () => process.env.NODE_ENV === 'development'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutos
  max: 5,
  message: { message: 'Demasiados registros desde esta IP.' },
  skip: () => process.env.NODE_ENV === 'development'
});

// Aplicar antes de las rutas
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
```

### 1.3 Decremento de Stock en OrderController

**Archivo**: `backend/controllers/orderController.js`

La función `createOrder` debe usar una transacción PostgreSQL:

```js
export const createOrder = async (req, res) => {
  const { total, items, shippingDetails } = req.body;
  const userId = req.user.id;

  // Validaciones previas...

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar stock suficiente para todos los ítems
    for (const item of items) {
      const result = await client.query('SELECT stock FROM products WHERE id = $1', [item.product_id]);
      if (!result.rows[0] || result.rows[0].stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Stock insuficiente para: ${item.title}` });
      }
    }

    // 2. Crear la orden
    const newOrder = await client.query(
      'INSERT INTO orders (user_id, total, items, status, shipping_details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, total, JSON.stringify(items), 'pending', JSON.stringify(shippingDetails || {})]
    );

    // 3. Decrementar stock
    for (const item of items) {
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};
```

La función `updateOrderStatus` debe restaurar stock cuando el status cambia a `cancelled`:

```js
// Al cambiar a 'cancelled', restaurar stock
if (status === 'cancelled') {
  const order = await client.query('SELECT items FROM orders WHERE id = $1', [id]);
  const items = JSON.parse(order.rows[0].items);
  for (const item of items) {
    await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
  }
}
```

---

## Grupo 2: Shop — Filtros de Talla y Color

**Archivo**: `frontend/src/pages/Shop.jsx`

### Estado adicional

```js
const [selectedSize, setSelectedSize] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
```

### Extracción de tallas y colores disponibles

```js
const availableSizes = useMemo(() => {
  const sizes = new Set();
  products.forEach(p => {
    if (p.sizes) p.sizes.forEach(s => sizes.add(s));
    if (p.variants) p.variants.forEach(v => v.size && sizes.add(v.size));
  });
  return ['S', 'M', 'L', 'XL', 'XXL'].filter(s => sizes.has(s));
}, [products]);

const availableColors = useMemo(() => {
  const colors = new Map();
  products.forEach(p => {
    if (p.colors) p.colors.forEach(c => colors.set(c.name || c, c));
    if (p.variants) p.variants.forEach(v => v.color && colors.set(v.color, v.color));
  });
  return Array.from(colors.values());
}, [products]);
```

### Lógica de filtrado extendida

```js
const filteredProducts = products.filter(product => {
  // ... filtros existentes ...
  if (selectedSize !== "all") {
    const inSizes = product.sizes?.includes(selectedSize);
    const inVariants = product.variants?.some(v => v.size === selectedSize);
    if (!inSizes && !inVariants) return false;
  }
  if (selectedColor !== "all") {
    const colorName = typeof selectedColor === 'object' ? selectedColor.name : selectedColor;
    const inColors = product.colors?.some(c => (c.name || c) === colorName);
    const inVariants = product.variants?.some(v => v.color === colorName);
    if (!inColors && !inVariants) return false;
  }
  return true;
});
```

### UI de los nuevos filtros

Agregar dos `<select>` adicionales en la barra de filtros, con el mismo estilo visual que el filtro de precio existente.

---

## Grupo 3: Checkout — Validación y Flujo Completo

**Archivo**: `frontend/src/pages/Checkout.jsx`

### Redirección si no autenticado

```jsx
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && !user) {
    navigate('/auth?redirect=/checkout');
  }
  if (!authLoading && user && cartItems.length === 0) {
    navigate('/shop');
  }
}, [user, authLoading, cartItems]);

if (authLoading) return <LoadingSpinner />;
```

### Estado del formulario de envío

```js
const [shippingData, setShippingData] = useState({
  name: '', email: user?.email || '', address: '', city: '', zip: ''
});
const [fieldErrors, setFieldErrors] = useState({});
```

### Función de validación

```js
const validateShipping = () => {
  const errors = {};
  if (!shippingData.name || shippingData.name.trim().length < 2)
    errors.name = t('checkout.error_name') || 'El nombre debe tener al menos 2 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email))
    errors.email = t('checkout.error_email') || 'Ingresa un email válido.';
  if (!shippingData.address.trim())
    errors.address = t('checkout.error_address') || 'La dirección es requerida.';
  return errors;
};
```

### Payload al backend

```js
await api.post('/orders', {
  items: cartItems.map(item => ({ ... })),
  total: getCartTotal(),
  paymentMethodId: paymentMethod.id,
  shippingDetails: shippingData
});
```

---

## Grupo 4: Layout Responsive

### Collections.jsx

```jsx
// h2 de título de colección
<h2 style={{ fontSize: 'clamp(2rem, 5vw, 5rem)', ... }}>

// Título principal "CURATIONS"
<h1 style={{ fontSize: 'clamp(3rem, 10vw, 12vw)', ... }}>
```

### Hero.jsx

```jsx
<header style={{
  paddingTop: 'clamp(90px, 12vw, 140px)',
  paddingBottom: 'clamp(40px, 6vw, 80px)',
  ...
}}>
```

### Navbar — Cerrar menú al hacer clic fuera

```jsx
const menuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMobileMenuOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

---

## Grupo 5: AuthContext — Validación de JWT

**Archivo**: `frontend/src/context/AuthContext.jsx`

```js
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Token malformado = expirado
  }
};

const isTokenValid = (token) => token && !isTokenExpired(token);

// En checkAuth:
if (token && storedUser) {
  if (!isTokenValid(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  } else {
    setUser(JSON.parse(storedUser));
  }
}
```

Exponer `isTokenValid` en el contexto para uso en otros componentes.

---

## Grupo 6: Imágenes y Performance

### ProductCard — lazy loading y fallback local

```jsx
<img
  src={displayImage}
  alt={title}
  loading="lazy"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder-product.png';
  }}
  ...
/>
```

Crear `frontend/public/placeholder-product.png` con una imagen placeholder local (puede ser un SVG renombrado).

### SearchModal — conectar a API

```js
useEffect(() => {
  if (query.trim() === '') { setResults([]); return; }
  
  const searchLocal = ALL_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );
  
  setResults(searchLocal); // Mostrar resultados locales inmediatamente
  setIsSearching(true);
  
  axiosInstance.get(`/products?search=${encodeURIComponent(query)}`)
    .then(res => {
      if (res.data?.length > 0) {
        const apiIds = new Set(res.data.map(p => p.id));
        const uniqueLocal = searchLocal.filter(p => !apiIds.has(p.id));
        setResults([...res.data, ...uniqueLocal]);
      }
    })
    .catch(() => {}) // Mantener resultados locales en caso de error
    .finally(() => setIsSearching(false));
}, [query]);
```

Actualizar los links de resultados para navegar a `/product/:id`.

---

## Grupo 7: i18n y Textos

### LanguageContext — claves faltantes

Agregar en ambos idiomas (`es` y `en`):

```js
// En shop:
filter_size: 'Talla',        // en: 'Size'
filter_color: 'Color',       // en: 'Color'

// En checkout:
login_required: 'Inicia sesión para completar tu compra.',
error_name: 'El nombre debe tener al menos 2 caracteres.',
error_email: 'Ingresa un email válido.',
error_address: 'La dirección es requerida.',

// En admin:
vs_prev_month: 'vs mes anterior',  // en: 'vs last month'
```

### Shop — botón Limpiar

```jsx
<button onClick={() => { setCategory('all'); setPriceRange('all'); setSearchQuery(''); setSelectedSize('all'); setSelectedColor('all'); }}>
  {t('shop_extended.reset_filters') || 'Limpiar'}
</button>
```

---

## Grupo 8: Admin — Validación de SKU

**Archivo**: `backend/controllers/productController.js`

```js
// En createProduct y updateProduct:
if (sku) {
  const existing = await pool.query(
    'SELECT id FROM products WHERE sku = $1 AND id != $2',
    [sku, id || null]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'El SKU ya está en uso por otro producto' });
  }
}
```

**Archivo**: `frontend/src/pages/admin/AdminProducts.jsx`

Mostrar el error de SKU bajo el campo correspondiente en el formulario, capturando el HTTP 409 en el catch del `handleSave`.

---

## Propiedades de Corrección

### Invariantes verificables post-implementación

1. `stock >= 0` para todos los productos después de cualquier orden creada.
2. El número de órdenes creadas con stock insuficiente = 0.
3. Tokens JWT expirados en localStorage = 0 al inicializar AuthContext.
4. Campos de formulario de checkout sin estado React = 0.

### Propiedades de round-trip

- Crear orden → verificar stock decrementado → cancelar orden → verificar stock restaurado.
- Login con token válido → recargar página → usuario sigue autenticado.
- Login con token expirado → recargar página → usuario desautenticado.
