# 🚀 Guía de despliegue de Visualmind

Arquitectura: **Frontend (Vercel)** → **Backend Express (Railway o Render)** → **PostgreSQL**.
Las imágenes subidas desde el admin se guardan también en PostgreSQL (tabla `uploaded_files`),
así que **no se pierden en los redeploys**, sin importar el hosting.

El esquema de la BD se aplica solo al arrancar el backend (`schema.sql` es idempotente):
no hace falta ejecutar migraciones a mano.

---

## Paso 0 — Elegir hosting del backend

**Plan acordado:** mientras la tienda se prepara (sin ventas), usar la **Opción B gratis**
(Render + Neon). Cuando empiecen las ventas, pasar a un plan que no se duerma
(Railway Hobby o Render de pago). Mover el backend es solo cambiar `VITE_API_URL` en Vercel
y copiar la BD (`pg_dump` / `pg_restore`); el código no cambia.

| | Render (gratis) + Neon (gratis) | Railway Hobby |
|---|---|---|
| Costo | $0 | $5/mes (incluye $5 de consumo) |
| Velocidad | Se duerme tras 15 min: la 1ª visita tarda ~1 min | Siempre encendido |
| Datos viejos | Se empieza con BD vacía | Se pueden recuperar si el volumen de Postgres sigue existiendo |
| Uso recomendado | Preparar la tienda y cargar productos | Vender |

---

## Opción A — Railway (para cuando haya ventas)

El servicio ya está configurado: rama `main`, Root Directory `/backend`, builder Railpack
(arranca con `npm start` → `node src/server.js`) y dominio `visualmind-production.up.railway.app`.

1. En railway.com → **Upgrade** al plan **Hobby**.
2. Abre el servicio **Postgres** → **Redeploy**. Comprueba que arranca (si el volumen fue
   borrado por la prueba vencida, se creará vacío).
3. Revisa las **Variables** del servicio **Visualmind** (ya existen casi todas):
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres)
   - `JWT_SECRET` = cadena aleatoria de 32+ caracteres (p. ej. `openssl rand -hex 32`). **Sin ella el servidor no arranca.**
   - `NODE_ENV` = `production`
   - `ADMIN_PASSWORD` = contraseña fuerte del admin. Se aplica a `visualmind@admin.com`
     (o al email de `ADMIN_EMAIL`, si la defines). **No reutilices contraseñas antiguas del admin: están en el historial público del repositorio.**
   - `ALLOWED_ORIGINS` = URL de Vercel, p. ej. `https://tu-tienda.vercel.app` (varias separadas por coma, sin espacios)
   - `DB_HOST`, `DB_USER`, etc. sobran si existe `DATABASE_URL` (se ignoran).
4. Haz merge de estos cambios a `main` (Railway despliega `main`) o pulsa **Redeploy**.
5. Comprueba: `https://visualmind-production.up.railway.app/api/health` debe responder `{"status":"ok", ...}`.

## Opción B — Render + Neon (gratis, recomendado ahora)

1. **Neon** (neon.com): crea un proyecto y copia la *connection string* (`postgresql://...sslmode=require`).
2. **Render** (render.com) → New → **Web Service** → conecta este repo:
   - Root Directory: `backend`
   - Build Command: `npm ci`
   - Start Command: `node src/server.js`
   - Instance type: Free
3. **Environment** (variables):
   - `DATABASE_URL` = la de Neon
   - `JWT_SECRET` = cadena aleatoria de 32+ caracteres (p. ej. `openssl rand -hex 32`). **Sin ella el servidor no arranca.**
   - `NODE_ENV` = `production`
   - `ADMIN_PASSWORD` = contraseña fuerte (admin `visualmind@admin.com`, o el email de `ADMIN_EMAIL`)
   - `ALLOWED_ORIGINS` = URL de Vercel (p. ej. `https://tu-tienda.vercel.app`)
4. Comprueba `https://<tu-servicio>.onrender.com/api/health` (la 1ª vez puede tardar ~1 min en despertar).

---

## Frontend — Vercel

1. Proyecto **visualmind** → Settings → General → **Root Directory** = `frontend`, Framework = Vite.
2. Settings → **Environment Variables** (Production):
   - `VITE_API_URL` = URL del backend **terminando en `/api`** (obligatoria; sin ella la web se ve vacía)
   - Datos de cobro (opcionales; lo que quede vacío no se muestra):
     `VITE_WHATSAPP_NUMBER`, `VITE_YAPPY_NUMBER`, `VITE_BANK_NAME`, `VITE_BANK_ACCOUNT_TYPE`,
     `VITE_BANK_ACCOUNT`, `VITE_BANK_HOLDER`
   - Redes del pie (opcionales): `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL`, `VITE_TIKTOK_URL`
   - `VITE_SITE_URL` solo si usas un dominio propio (p. ej. `https://visualmind.com.pa`); si no, se usa el de Vercel
3. **Redeploy** (las variables `VITE_*` se leen al compilar: cambiar una exige redeploy).

---

## Checklist tras desplegar

- [ ] `/api/health` responde `ok`
- [ ] La tienda muestra productos (si la BD es nueva, créalos desde `/admin/products`)
- [ ] Entrar al admin con `ADMIN_EMAIL` (o `visualmind@admin.com`) y `ADMIN_PASSWORD`
- [ ] Compra de prueba: carrito → checkout → elegir pago → aparece en `/admin/orders`
- [ ] Marcar el pedido de prueba como **Cancelado** (devuelve el stock)
- [ ] En los logs del backend aparece `Admin asegurado desde variables de entorno` (o `Admin verificado`)
- [ ] Compartir la URL de la tienda por WhatsApp muestra la imagen de vista previa

## Compras sin cuenta, contraseñas olvidadas y compartir

- Los clientes pueden comprar **sin registrarse** (invitado). En el admin esos pedidos llevan la etiqueta *Invitado*.
- Si un cliente olvida su contraseña, te escribe por WhatsApp desde el login. En **Admin → Ajustes → Restablecer
  contraseña** generas un enlace (sirve una vez, vence en 24 h) y se lo envías por WhatsApp. No hace falta servicio de correo.
- Cada producto tiene botones para compartir. El enlace (`https://<backend>/share/p/<id>`) muestra foto, nombre y precio
  en WhatsApp/Facebook. Define `FRONTEND_URL` en el backend con la URL de la tienda para que redirija bien.

## Instagram / Facebook Shopping y Google

1. **Catálogo:** en Meta Commerce Manager → Catálogo → Orígenes de datos → *Feed programado*, pega
   `https://<backend>/api/feeds/catalog.csv` (se actualiza solo). Sirve igual para Google Merchant Center.
2. **Píxel:** crea un píxel en el Administrador de eventos de Meta y define `VITE_META_PIXEL_ID` en Vercel.
   La tienda envía PageView, ViewContent, AddToCart, InitiateCheckout y Purchase para medir y hacer remarketing.

## Pedidos sin pagar

Los pedidos por Yappy o transferencia que no se pagan en 48 h se cancelan solos y el stock
vuelve a la venta (`PENDING_ORDER_HOURS`). Contra entrega no vence. Cada cliente puede tener
hasta 3 pedidos sin pagar a la vez (`MAX_PENDING_ORDERS`).

## Reportes

En **Admin → Pedidos → Exportar ventas (CSV)** descargas las ventas cobradas de un rango de fechas,
con subtotal, envío y total. En **Admin → Ajustes** descargas la lista
de suscriptores del newsletter.

## Flujo de ventas (pago manual)

1. El cliente compra y elige **Yappy**, **Transferencia** o **Contra entrega**.
2. Ve los datos para pagar y un botón para enviar el comprobante por WhatsApp.
3. En `/admin/orders` el admin cambia el estado: **Pendiente de pago → Pagado → Enviado → Entregado**.
4. **Cancelado** devuelve el stock automáticamente (no se puede reabrir).

## Precios y envío

El servidor calcula todo (`backend/services/orderPricing.js`) y el carrito/checkout leen la misma
configuración desde `GET /api/orders/pricing`, así que lo mostrado = lo cobrado.
Los productos no llevan ITBMS: total = subtotal + envío.
Se cambia con variables del backend, **sin tocar código** (reinicia el servicio tras cambiarlas):

| Variable | Por defecto | Efecto |
|---|---|---|
| `SHIPPING_COST` | `0` | Costo de envío. `0` = envío gratis para todos (situación actual) |
| `FREE_SHIPPING_THRESHOLD` | `0` | Si es > 0, el envío es gratis cuando el subtotal lo supera |

Ejemplo futuro: `SHIPPING_COST=5` y `FREE_SHIPPING_THRESHOLD=50` → $5 de envío, gratis desde $50.

## Dashboard

"Ventas" solo suma pedidos **cobrados** (Pagado, Enviado, Entregado). Los pedidos en
"Pendiente de pago" aparecen aparte en **Pendiente de cobro**, y los cancelados no cuentan.
