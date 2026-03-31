# 🚀 Guía de Despliegue (Visualmind)

Esta guía te ayudará a poner tu tienda online en producción usando **GitHub**, **Vercel** y **Railway**.

---

## 1. Subir el Código a GitHub

1. Crea un repositorio vacío en GitHub llamado `visualmind`.
2. Si ya tienes el remoto configurado, solo necesitas subir los cambios:
   ```bash
   git add .
   git commit -m "chore: preparar para despliegue en producción"
   git branch -M main
   git push -u origin main
   ```

---

## 2. Desplegar el Backend (Railway)

Railway es perfecto para tu servidor Express y la base de datos PostgreSQL.

1. Ve a [Railway.app](https://railway.app/) e inicia sesión con GitHub.
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio `visualmind`.
4. **IMPORTANTE**: Cuando te pregunte por el directorio, selecciona la carpeta `backend`.
5. En la pestaña **Variables**, añade las siguientes (copia los valores de tu `.env` local o de Supabase):
   - `JWT_SECRET`: (Una clave secreta larga)
   - `PORT`: 5000 (Railway asignará uno automáticamente si no lo pones, pero 5000 está bien).
   - `ALLOWED_ORIGINS`: Tu URL de Vercel (ej: `https://visualmind.vercel.app`).
6. **Base de Datos**: 
   - Puedes añadir un servicio de "PostgreSQL" en el mismo proyecto de Railway.
   - Railway te dará una `DATABASE_URL`. Cópiala y añádela como variable de entorno al servicio del backend.

---

## 3. Desplegar el Frontend (Vercel)

1. Ve a [Vercel.com](https://vercel.com/) e importa tu repositorio `visualmind`.
2. En la configuración:
   - **Framework Preset**: Vite.
   - **Root Directory**: `frontend` (Esto es clave).
3. En **Environment Variables**, añade:
   - `VITE_API_URL`: La URL que te dio Railway (ej: `https://visualmind-production.up.railway.app/api`).
   - `VITE_STRIPE_PUBLIC_KEY`: Tu clave de Stripe.
4. Haz clic en **Deploy**.

---

## 💡 Notas Importantes

- **Imágenes**: Actualmente el servidor guarda imágenes localmente en `/backend/uploads`. En Railway, estas se borrarán cada vez que reinicies el servidor a menos que configures un **Volume** (Disco persistente).
- **CORS**: Si recibes errores de "CORS", asegúrate de que la URL de tu frontend esté en la variable `ALLOWED_ORIGINS` del backend.
