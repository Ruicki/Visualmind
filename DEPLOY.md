# 🚀 Guía de Despliegue — Visualmind (100 % gratis)

| Pieza | Servicio | Plan | Qué corre |
|---|---|---|---|
| Base de datos | **Neon** (`neon-violet-chair`, AWS us-east-1) | Free | PostgreSQL + imágenes subidas |
| Backend (API) | **Render** Web Service | Free | `backend/` (Express, puerto `$PORT`) |
| Frontend (tienda) | **Vercel** | Hobby | `frontend/` (React + Vite, estático) |

```
Navegador ──► Vercel (React SPA) ──HTTPS /api──► Render (Express) ──SSL──► Neon (PostgreSQL)
```

> Railway ya **no** se usa (es de pago). Se eliminó `backend/nixpacks.toml`.

---

## 1. Base de datos — Neon

1. En **console.neon.tech** → proyecto `neon-violet-chair` → **Connect**.
2. Copia la cadena **Pooled connection** (el host contiene `-pooler`). Se ve así:
   `postgresql://USUARIO:CLAVE@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`
3. No hace falta crear tablas a mano: el backend ejecuta `backend/schema.sql` al arrancar si la tabla `users` no existe, y crea la tabla `uploaded_images` si falta.

Límites del plan Free (verifica en **Billing**): ~0.5 GB de almacenamiento por proyecto y horas de cómputo mensuales limitadas. La BD se "duerme" tras 5 min sin uso y despierta sola en la siguiente consulta (unos cientos de ms).

## 2. Backend — Render

### Opción A: Blueprint (recomendado)
1. **dashboard.render.com** → **New → Blueprint** → selecciona el repo `ruicki/visualmind`.
2. Render lee `render.yaml` y crea el servicio `visualmind-api` (plan free, región Virginia, raíz `backend/`, health check `/api/health`).
3. Te pedirá estas variables:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La cadena *Pooled* de Neon (paso 1) |
| `ALLOWED_ORIGINS` | URL(s) del frontend, separadas por coma: `https://<tu-proyecto>.vercel.app` |
| `ADMIN_EMAIL` | Correo del administrador |
| `ADMIN_PASSWORD` | Contraseña **nueva y fuerte** (la antigua está publicada en el historial del repo) |

`JWT_SECRET` se genera automáticamente y `NODE_ENV=production` ya viene fijado.

### Opción B: servicio creado a mano
Si ya tienes el servicio en Render, revisa que tenga: **Root Directory** `backend`, **Build** `npm ci`, **Start** `npm start`, **Health Check Path** `/api/health`, y las variables de la tabla anterior + `JWT_SECRET` (cadena aleatoria larga) + `NODE_ENV=production`.

### Verificar
Abre `https://<tu-servicio>.onrender.com/api/health` → debe responder `{"status":"ok", ...}` con `db_time`.

### Cosas a saber del plan Free de Render
- **Se duerme tras 15 min sin tráfico.** La primera visita después tarda hasta ~1 min en despertar; el frontend espera hasta 60 s (`axiosConfig.js`). Para evitarlo, un monitor gratuito (p. ej. UptimeRobot) puede llamar a `/api/health` cada 10 min (un solo servicio encendido todo el mes cabe en las 750 h gratis).
- **El disco es efímero**: todo lo que hay en `backend/uploads/` se borra en cada deploy o reinicio. Por eso las imágenes subidas desde el admin se guardan también en Neon (tabla `uploaded_images`) y el backend las sirve desde ahí. Las imágenes antiguas que solo existían en disco deben volver a subirse.

## 3. Frontend — Vercel

1. En el proyecto `visualmind` de Vercel → **Settings → General**: **Root Directory** `frontend`, **Framework** `Vite`.
2. **Settings → Environment Variables** (entorno *Production*):
   - `VITE_API_URL` = `https://<tu-servicio>.onrender.com/api`  ← con `/api` al final
3. **Deployments → Redeploy** (las variables `VITE_*` se incrustan al compilar; cambiarlas exige un nuevo deploy).
4. `frontend/vercel.json` ya redirige todas las rutas a `index.html` (SPA).

> ⚠️ **Uso comercial:** el plan Hobby de Vercel es solo para uso personal/no comercial. Cuando la tienda empiece a vender, pasa el frontend a una opción gratuita que sí permita uso comercial (p. ej. un *Static Site* de Render o Cloudflare Pages; mismo build: `npm run build`, carpeta `dist`, rewrite `/* → /index.html`) o a Vercel Pro.

> `VITE_STRIPE_PUBLIC_KEY` ya no se usa: el checkout actual es simulado (sin pasarela de pago).

## 4. Lista de verificación final

- [ ] `https://<render>/api/health` → `status: ok`
- [ ] La tienda en Vercel carga productos (si tarda la primera vez, es Render despertando)
- [ ] Login en `/login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` → acceso a `/admin`
- [ ] Subir una imagen de producto desde el admin → se ve en la tienda
- [ ] Hacer un redeploy en Render → la imagen **sigue** viéndose
- [ ] En la consola del navegador no hay errores de CORS (si los hay, revisa `ALLOWED_ORIGINS`: sin `/` final, con `https://`)

## 5. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Not allowed by CORS` en logs de Render | La URL de Vercel no está en `ALLOWED_ORIGINS` | Añádela exacta (ej. `https://visualmind.vercel.app`) y reinicia |
| La tienda no carga nada y las peticiones van a `localhost:5000` | Falta `VITE_API_URL` en Vercel | Añádela y haz **Redeploy** |
| `timeout of 60000ms exceeded` | Render tardó demasiado en despertar | Reintentar; considerar el monitor de `/api/health` |
| Imágenes rotas (404) de productos antiguos | Estaban solo en el disco efímero | Volver a subirlas desde el admin |
| No puedo entrar al admin | `ADMIN_EMAIL`/`ADMIN_PASSWORD` sin definir en Render | Defínelas; el admin se crea/actualiza al arrancar |
