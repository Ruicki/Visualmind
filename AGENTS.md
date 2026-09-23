# Visualmind — E-commerce de Ropa Premium

## Stack
- **Frontend**: React 19 + Vite 7 + React Router 7
- **Backend**: Express 5 + PostgreSQL (pg) + JWT
- **Testing**: Vitest 4 + fast-check (property-based) + jsdom
- **Deploy (gratis)**: Frontend → Vercel, Backend → Render (`render.yaml`), BD → Neon (PostgreSQL). Ver `DEPLOY.md`

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
`frontend/src/pages/Home.health.test.js` necesita backend y frontend corriendo; falla sin ellos.
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
│   ├── services/eventService.js  # Expira campañas vencidas automáticamente
│   ├── services/imageStore.js    # Guarda/sirve imágenes subidas desde la BD (disco de Render es efímero)
│   ├── schema.sql            # DDL ejecutado automáticamente si no existen tablas
│   ├── scripts/              # Scripts DB ad-hoc
│   ├── tests/campaigns.test.js
│   └── uploads/              # Caché local de imágenes subidas (la fuente de verdad es la tabla uploaded_images)
├── frontend/                 # React SPA (:5173)
│   ├── vite.config.js        # Proxy /api → :5000, /uploads → :5000
│   ├── src/main.jsx          # Entrypoint — React 19 StrictMode
│   ├── src/App.jsx           # Router + providers (Theme → Auth → Wishlist → Cart)
│   ├── src/pages/            # 15 públicas + 7 admin (bajo /admin)
│   ├── src/components/       # Navbar, Footer, Cart (drawer), Hero, etc.
│   ├── src/context/          # 5 contextos (Auth, Cart, Wishlist, Theme, Language)
│   └── src/api/axiosConfig.js  # Axios instance con JWT interceptor
├── render.yaml               # Blueprint de Render (backend, plan free)
├── DEPLOY.md                 # Guía de deploy Neon + Render + Vercel
├── DEV.bat                   # Lanzador local (Windows)
└── .specs/                   # SRS y requisitos (SRS-Visualmind.md)
```

## Convenciones importantes

- **Admin**: se crea/actualiza al arrancar con `ADMIN_EMAIL` / `ADMIN_PASSWORD` (variables de entorno). Nunca poner credenciales en el código
- **CORS**: Desarrollo permite todo; producción usa `ALLOWED_ORIGINS` (default: localhost:5173)
- **Rate limiting**: Login (10/15min), Register (5/60min) — solo en producción
- **Proxy Vite**: `/api/*` y `/uploads/*` se redirigen a `localhost:5000` en dev
- **Uploads**: Multer guarda en `backend/uploads/` y `imageStore.persistUploads` copia cada archivo a la tabla `uploaded_images`; `/uploads/*` se sirve del disco y, si no está, de la BD. En rutas usar `upload.fields([...])`
- **Proxy**: `app.set('trust proxy', 1)` es necesario en Render para que el rate limiting vea la IP real
- **Cold start**: Render free se duerme tras 15 min; axios usa timeout de 60 s
- **Refresh**: Sin refresh manual — Vite HMR para frontend, nodemon para backend
- **i18n**: `LanguageContext` maneja español/inglés
- **Campañas**: Sistema de eventos con `type: campaign|season`, banners, countdown, expiración automática

## Variables de entorno requeridas

### Backend (.env en backend/)
```
PORT=5000
NODE_ENV=production            # En Render
DATABASE_URL=postgresql://...  # Neon, cadena "Pooled connection" (SSL)
DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME  # Opción local
JWT_SECRET=<string>
ALLOWED_ORIGINS=http://localhost:5173   # En prod: URL de Vercel, sin "/" final
ADMIN_EMAIL=<correo>
ADMIN_PASSWORD=<contraseña fuerte>
```

### Frontend (.env en frontend/)
```
VITE_API_URL=http://localhost:5000/api  # Opcional en dev (proxy de Vite). En Vercel: https://<render>.onrender.com/api
```

## Notas de testing
- Los tests importan lógica pura duplicada (no los componentes reales) para hacer property-based testing sin montar React
- fast-check arbitraries están definidos por archivo de test
- Sin tests de integración con DB — todos son unitarios
