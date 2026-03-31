# 🏗️ Visualmind — Decisiones de Arquitectura

> **Estado**: ✅ Aprobado — Requerimientos definidos
>
> Contiene las decisiones técnicas fundamentales del proyecto basadas en `requirements.md`.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | React 19 + Vite | *Ya implementado* |
| **Estilos** | CSS Vanilla (Mobile-First) | *Ya implementado* |
| **Routing** | React Router 7 | *Ya implementado* |
| **Estado global** | Context API | *Ya implementado* |
| **Backend** | Node.js + Express | Transición desde Supabase para mayor control local y en hosting gratuito |
| **Base de datos** | PostgreSQL | Robusto, relacional, ideal para productos con variantes. Uso local + Railway en producción. |
| **Almacenamiento de imágenes** | API Backend (servir desde el server) | Migración desde Supabase Storage. Backend gestionará subidas (multer). |
| **Autenticación** | JWT (JSON Web Tokens) + Bcrypt | Reemplazo de Supabase Auth. Sesiones stateless gestionadas por el backend. |
| **Pagos** | Stripe | Procesamiento seguro de pagos (futura integración). |
| **Hosting Frontend** | Vercel | Gratuito, rápido, ideal para Vite/React. |
| **Hosting Backend+DB**| Railway / Render | Free tier generoso para Node.js y PostgreSQL. |
| **SEO Base** | Meta tags, Open Graph, Sitemap | Optimización básica estructurada en el frontend. |
| **Notificaciones** | Botón Flotante WhatsApp | Solución práctica y sin costo extra (enlaza a WA Business con mensaje predefinido). |

---

## 2. Arquitectura de Datos (Modelos Base para PostgreSQL)

### `users`
- id (UUID), email, password_hash, role ('admin', 'customer'), created_at

### `products`
- id (UUID), title, description, price, category, sub_category, image_url, sku, stock, is_new, discount, created_at

### `product_variants` (Para tallas y colores)
- id (UUID), product_id, size, color_name, color_hex, image_url, stock_override

### `orders`
- id (UUID), user_id, status (pending, paid, shipped), total_amount, stripe_session_id, created_at

### `order_items`
- id (UUID), order_id, product_id, variant_id, quantity, price_at_time

---

## 3. Estructura de Proyecto (Monorepo simple o Repositorios Separados)

**Recomendación**: Mantener repositorios separados (`visualmind-frontend` y `visualmind-backend`) para facilitar el despliegue independiente en Vercel y Railway.

---

## 4. Flujo de Migración desde Supabase

1. **Backend**: Crear API Node.js/Express.
2. **Database**: Levantar PostgreSQL local y crear esquemas.
3. **Frontend**: Cambiar llamadas de `supabase.js` a `fetch` al nuevo backend.
4. **Auth**: Implementar login propio enviando tokens en los requests.
5. **Storage**: Implementar endpoint de subida de imágenes en Express y servirlas de forma estática.

---

> **Siguiente paso**: Completar `requirements.md` → Generar este documento → Crear `tasks.md`
