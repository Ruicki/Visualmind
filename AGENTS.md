# Visualmind — E-commerce de Ropa Premium

## Stack
- **Frontend**: React 19 + Vite 7 + React Router 7
- **Backend**: Express 5 + PostgreSQL (pg) + JWT
- **Testing**: Vitest 4 + fast-check (property-based) + jsdom
- **Deploy**: Frontend → Vercel, Backend → Railway (nixpacks.toml)

## Comandos clave

### Desarrollo local
```
DEV.bat                  # Inicia backend (:5000) y frontend (:5173) en ventanas separadas
cd backend && npm run dev    # Backend con nodemon
cd frontend && npm run dev   # Frontend con Vite (host: true)
```

### Testing
```
cd backend && npm test       # Tests del backend (Vitest)
cd frontend && npx vitest    # Tests del frontend (Vitest)
```
Tests usan **property-based testing** con `fast-check`. Busca lógica pura extraída de componentes/controladores.

### Lint
```
cd frontend && npm run lint  # ESLint (frontend only)
```
Sin typecheck ni prettier configurados.

## Estructura del proyecto
```
visualmind/
├── backend/                  # Express API (:5000)
│   ├── src/server.js         # Entrypoint — monta rutas, init DB, health check
│   ├── src/config/db.js      # Pool PostgreSQL con reintentos (5 intentos, 3s delay)
│   ├── routes/               # 9 routers (auth, products, orders, admin, campaigns, etc.)
│   ├── controllers/          # Lógica por recurso
│   ├── middleware/            # authMiddleware (JWT), uploadMiddleware (multer)
│   ├── services/             # orderPricing (precios), orderExpiry (stock y vencimiento de pedidos),
│   │                         # eventService (campañas vencidas), csv
│   ├── schema.sql            # DDL idempotente, se aplica en cada arranque
│   ├── scripts/init_prod_db.js  # Aplica el esquema contra DATABASE_URL a mano
│   ├── tests/                # campaigns, orderPricing, csv
│   └── uploads/              # Imágenes subidas (statiqo via /uploads)
├── frontend/                 # React SPA (:5173)
│   ├── vite.config.js        # Proxy /api → :5000, /uploads → :5000
│   ├── src/main.jsx          # Entrypoint — React 19 StrictMode
│   ├── src/App.jsx           # Router + providers (Theme → Auth → Wishlist → Cart)
│   ├── src/pages/            # 15 públicas + 7 admin (bajo /admin)
│   ├── src/components/       # Navbar, Footer, Cart (drawer), Hero, etc.
│   ├── src/context/          # 5 contextos (Auth, Cart, Wishlist, Theme, Language)
│   └── src/api/axiosConfig.js  # Axios instance con JWT interceptor
├── DEPLOY.md                 # Guía de deploy Railway + Vercel
├── DEV.bat                   # Lanzador local (Windows)
└── .specs/                   # Requisitos y plan de tareas
```

## Convenciones importantes

- **Admin**: en local (sin `DATABASE_URL`) se crea `visualmind@admin.com` con una contraseña aleatoria mostrada en consola si no hay ningún admin (o la de `ADMIN_PASSWORD` si está en `.env`). No escribir contraseñas en el código. En despliegues el admin se define con `ADMIN_PASSWORD` (+ `ADMIN_EMAIL` opcional); nunca se resetea la contraseña en cada arranque. El registro público siempre crea `customer`.
- **Pedidos**: precios, envío y stock los calcula el servidor (los productos no llevan ITBMS: total = subtotal + envío) (`backend/services/orderPricing.js`, configurable con `SHIPPING_COST`/`FREE_SHIPPING_THRESHOLD`; envío gratis por defecto). El frontend usa la misma fórmula (`frontend/src/utils/pricing.js`) con la config de `GET /api/orders/pricing`. Sin descuentos automáticos por estado del producto. Pago manual: `pending → paid → shipped → delivered`; se puede cancelar desde pending o paid (devuelve stock). Las transiciones válidas están en `ORDER_TRANSITIONS` (backend `orderController.js` y frontend `storeConfig.js`, mantenerlas iguales) y cada cambio queda en `order_events`. Los pedidos Yappy/transferencia sin pago vencen a las `PENDING_ORDER_HOURS` (48 h) y devuelven stock; contra entrega no vence. Un cliente puede tener hasta `MAX_PENDING_ORDERS` (3) sin pagar. Si un producto tiene tallas, la talla pedida debe existir y `products.stock` siempre es la suma de sus variantes (`syncProductStock`). El dashboard solo cuenta como venta paid/shipped/delivered.
- **Productos**: al editar, las variantes conservan su ID y el formulario manda `expected_updated_at`; si el producto cambió (p. ej. una venta) el servidor responde 409 `STALE_PRODUCT`. La tienda pública nunca recibe `admin_notes` (`toPublicProduct`) ni productos que no estén `Published`/`Legacy`.
- **Sesiones**: `protect` lee el usuario de la BD en cada petición; el rol efectivo es el de la BD y `users.token_version` (campo `tv` del JWT) invalida sesiones. Emails siempre en minúsculas; contraseñas de 8+ caracteres con letras y números.
- **Admin del negocio**: `GET /api/admin/reports/sales.csv?from&to` (ventas cobradas) y `/api/admin/reports/newsletter.csv`. Campañas: `/api/campaigns` es la lista pública (solo activas); el admin usa `/api/campaigns/admin`.
- **i18n**: `LanguageContext` maneja español/inglés. `t(clave, respaldo?)` devuelve el respaldo (o la clave) si falta la traducción; añade toda clave nueva en `es` y `en`.
- **Imágenes**: además del disco se guardan en la tabla `uploaded_files`; `/uploads/*` las sirve desde la BD si faltan en disco. Solo se aceptan JPEG/PNG/WebP verificados por su firma real. Las fotos de `frontend/public/Post` están en WebP (máx. 1600 px).
- **CORS**: Desarrollo permite todo; producción usa `ALLOWED_ORIGINS` (default: localhost:5173)
- **Rate limiting**: Login (10 fallos/15 min por IP+email), Register (5/60 min), Newsletter (5/60 min) — solo en producción. `trust proxy` = `TRUST_PROXY` (1 por defecto, Railway/Render).
- **Seguridad HTTP**: `helmet` en el backend; cabeceras del frontend en `frontend/vercel.json`.
- **Proxy Vite**: `/api/*` y `/uploads/*` se redirigen a `localhost:5000` en dev
- **Uploads**: Multer guarda en `backend/uploads/`, expuesto estáticamente en `/uploads`
- **Refresh**: Sin refresh manual — Vite HMR para frontend, nodemon para backend
- **Campañas**: Sistema de eventos con `type: campaign|season`, banners, countdown, expiración automática

## Variables de entorno requeridas

### Backend (.env en backend/)
```
PORT=5000
DATABASE_URL=postgresql://...  # Opción cloud (SSL rejectUnauthorized: false)
DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME  # Opción local
JWT_SECRET=<32+ caracteres>   # en producción el servidor no arranca sin él
ALLOWED_ORIGINS=http://localhost:5173
ADMIN_EMAIL=/ADMIN_PASSWORD=   # obligatorio en despliegues
SHIPPING_COST=0 / FREE_SHIPPING_THRESHOLD=0                    # opcionales
PENDING_ORDER_HOURS=48 / MAX_PENDING_ORDERS=3                   # opcionales
TRUST_PROXY=1                                                   # opcional
```

### Frontend (.env en frontend/)
```
VITE_API_URL=http://localhost:5000/api  # Opcional en dev (proxy de Vite); obligatoria en Vercel
VITE_WHATSAPP_NUMBER / VITE_YAPPY_NUMBER / VITE_BANK_*  # Datos de cobro mostrados al cliente
VITE_INSTAGRAM_URL / VITE_FACEBOOK_URL / VITE_TIKTOK_URL  # Redes del pie (vacío = oculto)
VITE_SITE_URL                           # URL pública para vistas previas; en Vercel se detecta sola
```

## Notas de testing
- Los tests importan lógica pura duplicada (no los componentes reales) para hacer property-based testing sin montar React
- fast-check arbitraries están definidos por archivo de test
- Sin tests de integración con DB — todos son unitarios, salvo `frontend/src/pages/Home.health.test.js`, que necesita backend (:5000) y Vite (:5173) encendidos
