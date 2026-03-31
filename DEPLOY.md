# 🚀 Guía de Despliegue Express (Visualmind)

He configurado el repositorio para que **Railway** y **Vercel** detecten automáticamente las carpetas correctas. Solo sigue estos pasos:

---

## 1. Backend (Railway) - ARREGLAR EL ERROR ROJO
Ya he subido los cambios. Para que el error desaparezca:
1. Ve a tu proyecto en **Railway.app**.
2. Haz clic en el servicio **"Visualmind"** (el que sale en rojo).
3. Railway debería detectar el nuevo commit y empezar a construir solo gracias al archivo `nixpacks.toml` que acabo de añadir.
4. **IMPORTANTE**: Ve a la pestaña **Variables** y añade:
   - `JWT_SECRET`: (Tu clave secreta)
   - `DATABASE_URL`: (La URL de tu base de datos de Railway o Supabase)
   - `ALLOWED_ORIGINS`: La URL que te asigne Vercel (ej: `https://visualmind.vercel.app`)

---

## 2. Frontend (Vercel)
1. Ve a **Vercel.com** e importa el repositorio.
2. **Configuración CRÍTICA**:
   - En **Root Directory**, selecciona la carpeta `frontend`.
   - En **Framework Preset**, asegúrate de que sea `Vite`.
3. En **Environment Variables**, añade:
   - `VITE_API_URL`: La URL de tu backend en Railway (terminando en `/api`).
   - `VITE_STRIPE_PUBLIC_KEY`: Tu clave de Stripe.
4. Haz clic en **Deploy**.

---

## 💡 Notas de Mantenimiento
- **Imágenes**: Se guardan en `/backend/uploads`. Si quieres que persistan al reiniciar, añade un **Volume** en Railway montado en `/app/backend/uploads`.
- **Base de Datos**: Si usas la de Railway, asegúrate de haber ejecutado tus scripts de migración (tablas) en ella.

