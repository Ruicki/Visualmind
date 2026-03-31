# Tasks — Visualmind MVP Completion

## Task List

- [x] 1. Middleware `checkRole` en el backend
  - [x] 1.1 Añadir export `checkRole(role)` en `backend/middleware/authMiddleware.js`
  - [x] 1.2 Verificar que `protect` expone `req.user.role` correctamente (ya lo hace vía JWT decode)
  - **Requirement:** 2.1, 2.2

- [x] 2. Proteger rutas de productos con `checkRole('admin')`
  - [x] 2.1 Importar `protect` y `checkRole` en `backend/routes/productRoutes.js`
  - [x] 2.2 Añadir `protect, checkRole('admin')` a `POST /`, `PUT /:id`, `DELETE /:id`
  - **Requirement:** 2.3

- [x] 3. Proteger rutas de órdenes con `checkRole('admin')`
  - [x] 3.1 Añadir `checkRole('admin')` a `GET /all` en `backend/routes/orderRoutes.js`
  - [x] 3.2 Añadir `checkRole('admin')` a `PUT /:id/status` en `backend/routes/orderRoutes.js`
  - **Requirement:** 2.4, 2.7

- [x] 4. Proteger rutas admin y auth con `checkRole('admin')`
  - [x] 4.1 Añadir `checkRole('admin')` a `GET /stats` en `backend/routes/adminRoutes.js`
  - [x] 4.2 Añadir `checkRole('admin')` a `POST /promote` en `backend/routes/authRoutes.js`
  - **Requirement:** 2.5, 2.6

- [x] 5. Endpoint `PUT /api/auth/me` — actualizar perfil
  - [x] 5.1 Añadir handler `updateMe` en `backend/controllers/authController.js`
    - Verificar email duplicado → 409 si ya existe en otro usuario
    - `UPDATE users SET full_name=$1, email=$2 WHERE id=$3 RETURNING id, email, full_name, role`
  - [x] 5.2 Registrar ruta `PUT /me` con `protect` en `backend/routes/authRoutes.js`
  - **Requirement:** 4.1, 4.2, 4.3

- [x] 6. CRUD de direcciones — backend
  - [x] 6.1 Crear `backend/controllers/addressController.js` con handlers: `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`
    - `updateAddress` y `deleteAddress` verifican `address.user_id === req.user.id` → 403 si no coincide
  - [x] 6.2 Crear `backend/routes/addressRoutes.js` con las 4 rutas protegidas con `protect`
  - [x] 6.3 Registrar `addressRoutes` en `backend/src/server.js` bajo `/api/addresses`
  - **Requirement:** 4.4, 4.5

- [x] 7. Schema SQL actualizado
  - [x] 7.1 Reescribir `backend/schema.sql` con todas las tablas: `users`, `products`, `product_variants`, `orders`, `order_items`, `shipping_addresses`, `stock_logs`, `coupons`
  - [x] 7.2 Eliminar todas las referencias a `auth.users` de Supabase y políticas RLS
  - [x] 7.3 Añadir comentarios explicativos por tabla
  - **Requirement:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9

- [x] 8. Variables de entorno — backend
  - [x] 8.1 Crear `backend/.env.example` con: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `STRIPE_SECRET_KEY` (placeholder), `STRIPE_WEBHOOK_SECRET` (placeholder)
  - [x] 8.2 Añadir validación de variables críticas al arrancar en `backend/src/server.js` (antes de `app.listen`): si falta `JWT_SECRET` o `DATABASE_URL`, loguear error y `process.exit(1)`
  - [x] 8.3 Verificar que `backend/.env` está en `.gitignore`
  - **Requirement:** 6.1, 6.3, 6.5, 6.6

- [x] 9. Variables de entorno — frontend
  - [x] 9.1 Crear `frontend/.env.example` con: `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY` (placeholder)
  - [x] 9.2 Verificar que `frontend/.env` está en `.gitignore`
  - **Requirement:** 6.2, 6.4, 6.5

- [x] 10. Componente `AdminRoute` en el frontend
  - [x] 10.1 Crear `frontend/src/components/AdminRoute.jsx`
    - Si `loading === true` → renderizar spinner
    - Si `user === null` → `<Navigate to="/login" replace />`
    - Si `user.role !== 'admin'` → `<Navigate to="/" replace />`
    - Si `user.role === 'admin'` → renderizar `children`
  - [x] 10.2 Asegurarse de que `AuthContext` expone `loading` en el value (ya lo hace)
  - **Requirement:** 3.1, 3.2, 3.3, 3.5

- [x] 11. Actualizar `App.jsx` para usar `AdminRoute`
  - [x] 11.1 Importar `AdminRoute` en `frontend/src/App.jsx`
  - [x] 11.2 Envolver el `<Route path="/admin">` con `<AdminRoute>` como elemento de la ruta padre
  - **Requirement:** 3.4

- [x] 12. Actualizar `UserProfile.jsx` — sección de perfil editable
  - [x] 12.1 Añadir estado local para `full_name` y `email` inicializado desde `profile`
  - [x] 12.2 Añadir formulario con inputs y botón guardar que llame `PUT /api/auth/me`
  - [x] 12.3 Mostrar mensaje de éxito/error inline tras la actualización
  - [x] 12.4 Añadir `<Navigate to="/login" replace />` si `user === null`
  - **Requirement:** 4.6, 4.9

- [x] 13. Actualizar `UserProfile.jsx` — sección de direcciones
  - [x] 13.1 Añadir estado `addresses` y fetch inicial desde `GET /api/addresses`
  - [x] 13.2 Renderizar lista de direcciones con botones Editar y Eliminar
  - [x] 13.3 Añadir formulario inline para crear/editar dirección (campos: `full_name`, `address_line`, `city`, `province`, `postal_code`, `country`)
  - [x] 13.4 Conectar acciones a `POST`, `PUT /:id`, `DELETE /:id` de `/api/addresses`
  - **Requirement:** 4.7

- [x] 14. Actualizar `UserProfile.jsx` — sección de historial de pedidos
  - [x] 14.1 Actualizar el render de cada orden para mostrar: número de orden, fecha, total, estado, y lista de productos del campo `items` (JSONB)
  - **Requirement:** 4.8
