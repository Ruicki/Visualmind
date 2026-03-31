# Requirements Document — Visualmind MVP Completion

## Introduction

Visualmind es una tienda online de ropa y serigrafía ubicada en Panamá, orientada a diseños originales con temática cultural (anime, deportes, etc.). El proyecto ya tiene un frontend React + backend Node.js/Express/PostgreSQL funcional con autenticación JWT, panel admin, y checkout con Stripe Elements parcialmente integrado.

Este documento define los requerimientos para completar el MVP lanzable, cubriendo cinco áreas críticas:
1. Integración real de pagos con Stripe (PaymentIntent + Webhook)
2. Protección de rutas admin en backend y frontend
3. Perfil de usuario completo con historial de pedidos y direcciones
4. Schema SQL actualizado y limpio
5. Gestión segura de variables de entorno

---

## Glossary

- **System**: El sistema completo Visualmind (frontend + backend)
- **Backend**: Servidor Node.js + Express que expone la API REST
- **Frontend**: Aplicación React 19 + Vite que consume la API
- **AuthMiddleware**: Middleware Express que verifica el JWT en el header `Authorization`
- **RoleMiddleware**: Middleware Express que verifica que `req.user.role === 'admin'`
- **ProtectedRoute**: Componente React que redirige a `/login` si el usuario no está autenticado
- **AdminRoute**: Componente React que redirige a `/` si el usuario autenticado no tiene rol `admin`
- **Stripe**: Procesador de pagos externo utilizado para cobros con tarjeta
- **PaymentIntent**: Objeto de Stripe que representa una intención de cobro confirmada del lado del servidor
- **Webhook**: Endpoint HTTP que Stripe llama para notificar eventos de pago (ej. `payment_intent.succeeded`)
- **Order**: Registro en la tabla `orders` que representa una compra realizada
- **User**: Registro en la tabla `users` con campos `id`, `email`, `password_hash`, `role`, `full_name`
- **ShippingAddress**: Registro en la tabla `shipping_addresses` asociado a un usuario
- **Schema**: Archivo `schema.sql` que define la estructura completa de la base de datos PostgreSQL
- **EnvFile**: Archivo `.env` o `.env.example` que contiene variables de configuración del entorno

---

## Requirements

---

### Requirement 1: Integración Real de Pagos con Stripe

**User Story:** Como cliente, quiero poder pagar mi pedido con tarjeta de crédito/débito de forma segura, para que mi compra quede confirmada y registrada correctamente.

#### Acceptance Criteria

1. THE Backend SHALL exponer un endpoint `POST /api/payments/create-intent` que reciba el monto total y retorne un `client_secret` de Stripe PaymentIntent.

2. WHEN el Frontend inicia el checkout, THE Frontend SHALL obtener el `client_secret` llamando a `POST /api/payments/create-intent` antes de confirmar el pago con Stripe.js.

3. WHEN Stripe confirma el pago exitosamente en el cliente, THE Frontend SHALL enviar el `paymentIntentId` al Backend para crear la Order con estado `paid`.

4. THE Backend SHALL exponer un endpoint `POST /api/payments/webhook` que reciba eventos de Stripe firmados con `STRIPE_WEBHOOK_SECRET`.

5. WHEN el Backend recibe el evento `payment_intent.succeeded` en el webhook, THE Backend SHALL actualizar el estado de la Order correspondiente a `paid` si aún está en estado `pending`.

6. IF el evento de webhook recibido no puede ser verificado con la firma de Stripe, THEN THE Backend SHALL responder con HTTP 400 y no procesar el evento.

7. THE Backend SHALL leer la clave secreta de Stripe desde la variable de entorno `STRIPE_SECRET_KEY` y nunca incluirla en el código fuente.

8. THE Frontend SHALL leer la clave pública de Stripe desde la variable de entorno `VITE_STRIPE_PUBLIC_KEY` y nunca incluirla como literal en el código fuente.

9. WHEN se crea una Order tras un pago exitoso, THE Backend SHALL almacenar el `stripe_payment_intent_id` en la tabla `orders`.

---

### Requirement 2: Protección de Rutas Admin en el Backend

**User Story:** Como administrador, quiero que solo los usuarios con rol `admin` puedan acceder a los endpoints de administración, para que los datos y operaciones críticas estén protegidos.

#### Acceptance Criteria

1. THE Backend SHALL incluir un middleware `checkRole(role)` que verifique que `req.user.role` coincide con el rol requerido.

2. IF un usuario autenticado sin rol `admin` intenta acceder a un endpoint protegido con `checkRole('admin')`, THEN THE Backend SHALL responder con HTTP 403 y el mensaje `"Acceso denegado: se requiere rol admin"`.

3. THE Backend SHALL aplicar `protect` y `checkRole('admin')` a los endpoints `POST /api/products`, `PUT /api/products/:id`, y `DELETE /api/products/:id`.

4. THE Backend SHALL aplicar `protect` y `checkRole('admin')` al endpoint `GET /api/orders/all`.

5. THE Backend SHALL aplicar `protect` y `checkRole('admin')` al endpoint `GET /api/admin/stats`.

6. THE Backend SHALL aplicar `protect` y `checkRole('admin')` al endpoint `POST /api/auth/promote`.

7. THE Backend SHALL aplicar `protect` y `checkRole('admin')` al endpoint `PUT /api/orders/:id/status`.

---

### Requirement 3: Protección de Rutas Admin en el Frontend

**User Story:** Como administrador, quiero que el panel de administración solo sea accesible para usuarios con rol `admin`, para que ningún cliente pueda acceder a él aunque conozca la URL.

#### Acceptance Criteria

1. THE Frontend SHALL incluir un componente `AdminRoute` que verifique que el usuario autenticado tiene `role === 'admin'`.

2. WHEN un usuario no autenticado intenta acceder a cualquier ruta bajo `/admin/*`, THE Frontend SHALL redirigirlo a `/login`.

3. WHEN un usuario autenticado con rol `customer` intenta acceder a cualquier ruta bajo `/admin/*`, THE Frontend SHALL redirigirlo a `/` con un mensaje de acceso denegado.

4. THE Frontend SHALL envolver todas las rutas bajo `/admin` con el componente `AdminRoute` en `App.jsx`.

5. WHILE el estado de autenticación está cargando, THE Frontend SHALL mostrar un indicador de carga en lugar de redirigir, para evitar redirecciones falsas.

---

### Requirement 4: Perfil de Usuario Completo

**User Story:** Como cliente registrado, quiero poder ver y editar mi información personal, gestionar mis direcciones de envío y consultar mi historial de pedidos con detalle, para tener control sobre mi cuenta.

#### Acceptance Criteria

1. THE Backend SHALL exponer un endpoint `PUT /api/auth/me` protegido con `protect` que permita actualizar `full_name` y `email` del usuario autenticado.

2. WHEN el cliente actualiza su perfil con datos válidos, THE Backend SHALL retornar el usuario actualizado con HTTP 200.

3. IF el nuevo email ya está registrado por otro usuario, THEN THE Backend SHALL responder con HTTP 409 y el mensaje `"El email ya está en uso"`.

4. THE Backend SHALL exponer endpoints CRUD bajo `/api/addresses` protegidos con `protect` para gestionar las direcciones de envío del usuario autenticado:
   - `GET /api/addresses` — listar direcciones del usuario
   - `POST /api/addresses` — crear nueva dirección
   - `PUT /api/addresses/:id` — actualizar dirección propia
   - `DELETE /api/addresses/:id` — eliminar dirección propia

5. IF un usuario intenta modificar o eliminar una dirección que no le pertenece, THEN THE Backend SHALL responder con HTTP 403.

6. THE Frontend SHALL mostrar en `UserProfile` un formulario para editar `full_name` y `email` del usuario.

7. THE Frontend SHALL mostrar en `UserProfile` la lista de direcciones de envío guardadas con opciones para agregar, editar y eliminar.

8. THE Frontend SHALL mostrar en `UserProfile` el historial de pedidos con: número de orden, fecha, total, estado, y lista de productos comprados.

9. WHEN el usuario no está autenticado y accede a `/profile`, THE Frontend SHALL redirigirlo a `/login`.

---

### Requirement 5: Schema SQL Actualizado

**User Story:** Como desarrollador, quiero tener un archivo `schema.sql` que refleje el estado real de la base de datos, para poder reproducir el entorno de producción desde cero sin errores.

#### Acceptance Criteria

1. THE Schema SHALL definir la tabla `users` con columnas: `id` (UUID PK), `email` (VARCHAR UNIQUE NOT NULL), `password_hash` (VARCHAR NOT NULL), `full_name` (VARCHAR), `role` (VARCHAR DEFAULT `'customer'`), `created_at` (TIMESTAMPTZ DEFAULT NOW()).

2. THE Schema SHALL definir la tabla `products` con columnas: `id`, `title`, `description`, `price`, `category`, `sub_category`, `parent_category`, `image_url`, `sku`, `stock`, `is_new`, `discount`, `featured`, `new_arrival`, `launch_date`, `created_at`.

3. THE Schema SHALL definir la tabla `product_variants` con columnas: `id`, `product_id` (FK → products), `size`, `color`, `stock`, `sku`, `created_at`.

4. THE Schema SHALL definir la tabla `orders` con columnas: `id`, `user_id` (FK → users), `items` (JSONB), `total`, `status` (DEFAULT `'pending'`), `stripe_payment_intent_id`, `created_at`.

5. THE Schema SHALL definir la tabla `order_items` con columnas: `id`, `order_id` (FK → orders), `product_id` (FK → products), `variant_id` (FK → product_variants, nullable), `quantity`, `price_at_purchase`.

6. THE Schema SHALL definir la tabla `shipping_addresses` con columnas: `id`, `user_id` (FK → users), `full_name`, `address_line`, `city`, `province`, `postal_code`, `country` (DEFAULT `'Panama'`), `is_default` (BOOLEAN DEFAULT FALSE), `created_at`.

7. THE Schema SHALL definir la tabla `stock_logs` con columnas: `id`, `product_id` (FK → products), `variant_id` (FK → product_variants, nullable), `change`, `reason`, `created_at`.

8. THE Schema SHALL definir la tabla `coupons` con columnas: `id`, `code` (VARCHAR UNIQUE), `discount_percent`, `max_uses`, `used_count`, `expires_at`, `created_at`.

9. THE Schema SHALL NOT referenciar `auth.users` de Supabase ni ningún objeto externo a PostgreSQL estándar.

10. THE Schema SHALL incluir comentarios que expliquen el propósito de cada tabla.

---

### Requirement 6: Gestión de Variables de Entorno

**User Story:** Como desarrollador, quiero que todas las claves y configuraciones sensibles estén en variables de entorno y documentadas en archivos `.env.example`, para poder desplegar el proyecto de forma segura sin exponer credenciales.

#### Acceptance Criteria

1. THE Backend SHALL leer todas las configuraciones sensibles desde variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PORT`.

2. THE Frontend SHALL leer la clave pública de Stripe desde `VITE_STRIPE_PUBLIC_KEY` y la URL del API desde `VITE_API_URL`.

3. THE System SHALL incluir un archivo `backend/.env.example` con todas las variables requeridas documentadas con valores de ejemplo no sensibles.

4. THE System SHALL incluir un archivo `frontend/.env.example` con todas las variables requeridas documentadas con valores de ejemplo no sensibles.

5. THE System SHALL incluir `backend/.env` y `frontend/.env` en `.gitignore` para que nunca sean commiteados al repositorio.

6. IF una variable de entorno crítica (`JWT_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) no está definida al iniciar el Backend, THEN THE Backend SHALL lanzar un error descriptivo y detener el proceso.
