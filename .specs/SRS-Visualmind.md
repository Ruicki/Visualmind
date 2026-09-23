# SRS — Especificación de Requisitos de Software
## Visualmind · E-commerce de ropa premium

| Campo | Valor |
|---|---|
| Versión | 1.0 |
| Fecha | 2026-09-23 |
| Estado | Borrador para validación del dueño del producto |
| Estándar de referencia | IEEE 830 / ISO/IEC/IEEE 29148 |
| Repositorio | `ruicki/visualmind` |

**Leyenda de estado de cada requisito:** ✅ Implementado · 🟡 Parcial · ⬜ Pendiente
**Prioridad:** Alta (imprescindible para vender) · Media (importante) · Baja (deseable)

---

## 1. Introducción

### 1.1 Propósito
Este documento define qué debe hacer Visualmind, con qué calidad y bajo qué restricciones. Sirve como:
- Referencia única del alcance del emprendimiento (qué existe, qué falta, qué no se hará).
- Base para priorizar trabajo, estimar y verificar entregas (cada requisito tiene criterios de aceptación).
- Documento vivo: se actualiza cada vez que cambie un requisito (ver §9).

### 1.2 Alcance
**Visualmind** es una tienda en línea de ropa premium con:
- **Tienda pública**: catálogo, colecciones, campañas y temporadas, carrito, lista de deseos, checkout y perfil de cliente.
- **Panel de administración**: gestión de productos, variantes, categorías, colecciones, campañas, productos destacados y pedidos, con métricas básicas de ventas.

Objetivo de negocio: vender ropa en línea en Panamá con **costo de infraestructura $0** mientras el volumen lo permita.

### 1.3 Definiciones y acrónimos
| Término | Significado |
|---|---|
| SPA | Single Page Application (el frontend React) |
| API | Interfaz HTTP del backend (`/api/*`) |
| JWT | JSON Web Token, credencial de sesión |
| Campaña | Evento de marketing con banner, fechas y cuenta regresiva (`type = campaign`) |
| Temporada | Evento estacional (`type = season`), p. ej. Halloween |
| Colección | Agrupación editorial de productos con página propia |
| Slot destacado | Posición del carrusel de la home asignada a un producto |
| Ciclo de vida | Estado de un producto: `Draft`, `Published`, `Legacy`, `Archived` |
| Pre-orden | Venta anticipada de un producto con `launch_date` futura |
| Cold start | Tiempo que tarda Render (plan free) en despertar el backend dormido |

### 1.4 Referencias
- `AGENTS.md` — guía técnica del repositorio.
- `DEPLOY.md` — despliegue en Neon + Render + Vercel.
- `MAPA_CAMPAÑAS.md` — funcionamiento del sistema de campañas.
- `backend/schema.sql` — modelo de datos.

---

## 2. Descripción general

### 2.1 Perspectiva del producto
Sistema web de tres capas, todo en planes gratuitos:

```
Cliente/Admin (navegador)
        │ HTTPS
        ▼
Vercel ── Frontend React 19 + Vite 7 (SPA estática)
        │ HTTPS  /api/*  (JWT en header Authorization)
        ▼
Render ── Backend Express 5 (Node 22)  ── también sirve /uploads/*
        │ SSL
        ▼
Neon ──── PostgreSQL (datos + imágenes subidas en tabla uploaded_images)
```

### 2.2 Usuarios y roles
| Rol | Descripción | Acceso |
|---|---|---|
| Visitante | Navega sin cuenta | Catálogo, colecciones, campañas, carrito, newsletter |
| Cliente (`customer`) | Usuario registrado | Lo anterior + checkout, perfil, direcciones, historial de pedidos, lista de deseos |
| Administrador (`admin`) | Dueño/operador de la tienda | Panel `/admin` completo |

### 2.3 Funciones principales (resumen)
1. Catálogo con filtros, detalle de producto, variantes (talla/color) y stock.
2. Marketing: campañas, temporadas, colecciones, productos destacados, novedades, lookbook, pre-órdenes.
3. Compra: carrito, lista de deseos, checkout con dirección de envío, confirmación de pedido.
4. Cuenta: registro, login, perfil, direcciones, historial.
5. Administración: CRUD de catálogo y marketing, gestión de estados de pedidos, métricas.
6. Experiencia: tema claro/oscuro, español/inglés.

### 2.4 Restricciones
| ID | Restricción |
|---|---|
| R-01 | **Costo de infraestructura $0**: solo planes gratuitos (Neon Free, Render Free, Vercel Hobby). Railway queda descartado por ser de pago. |
| R-02 | **Render Free** duerme el backend tras 15 min sin tráfico (cold start de hasta ~1 min) y su disco es **efímero** (se borra en cada deploy/reinicio). No tiene discos persistentes. |
| R-03 | **Neon Free**: ~0.5 GB de almacenamiento por proyecto y horas de cómputo mensuales limitadas; la BD se suspende tras 5 min sin uso. Región AWS us-east-1. |
| R-04 | **Vercel Hobby** solo permite uso **no comercial**. Al empezar a vender se debe migrar el frontend (ver riesgo RS-02). |
| R-05 | Stack fijo: React 19 + Vite 7 (frontend), Express 5 + `pg` (backend), PostgreSQL, JavaScript sin TypeScript. |
| R-06 | Las credenciales (BD, JWT, admin) viven **solo** en variables de entorno de cada plataforma, nunca en el repositorio. |

### 2.5 Supuestos y dependencias
- Mercado inicial: **Panamá**, moneda **USD** (país por defecto en direcciones: `Panama`).
- Dependencias externas: GitHub (código y despliegue automático), Neon, Render, Vercel, `placehold.co` (imagen por defecto).
- El volumen inicial es bajo (decenas de pedidos/día), compatible con los planes gratuitos.
- Las imágenes se comprimen en el navegador antes de subirse (máx. ~800 KB, 1200 px), lo que permite guardar varios cientos en Neon.

---

## 3. Requisitos funcionales

### 3.1 Catálogo y navegación
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-01 | Listar productos publicados en la tienda (`/shop`) | Alta | ✅ | Solo se muestran productos `Published`/`Legacy`; carga con el backend despierto en < 2 s |
| RF-02 | Filtrar por categoría, subcategoría y otros criterios en barra lateral | Alta | ✅ | Al elegir un filtro, la lista muestra solo productos que cumplen |
| RF-03 | Ver detalle de producto (`/product/:id`) con imágenes (principal y hover), precio, descuento, variantes y stock | Alta | ✅ | Se muestran tallas/colores disponibles; un producto inexistente muestra error/404 |
| RF-04 | Guía de tallas en el detalle de producto | Media | ✅ | Accesible desde el detalle; editable desde el admin |
| RF-05 | Página de novedades (`/new-arrivals`) | Media | ✅ | Muestra productos marcados como nuevos / `new_arrival` |
| RF-06 | Páginas de colecciones (`/collections`, detalle por slug) | Media | ✅ | Cada colección activa muestra su imagen, descripción y productos |
| RF-07 | Lookbook, Sobre nosotros y páginas informativas (`/info/:page`) | Baja | ✅ | Las rutas cargan contenido; rutas desconocidas muestran 404 |
| RF-08 | Página 404 para rutas inexistentes | Baja | ✅ | Cualquier ruta no definida muestra la página NotFound |

### 3.2 Marketing: campañas, temporadas y destacados
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-10 | Crear/editar/eliminar campañas y temporadas con banner, hasta 3 imágenes secundarias, color de acento, fechas, botón (texto/enlace) y plantilla | Alta | ✅ | Los cambios se reflejan en la home sin redeploy |
| RF-11 | Mostrar la(s) campaña(s) activa(s) en la home con cuenta regresiva opcional | Alta | ✅ | Solo se muestran eventos con `is_active` y dentro de su rango de fechas |
| RF-12 | Expirar automáticamente campañas vencidas | Media | ✅ | Al arrancar el servidor y bajo demanda (`POST /api/campaigns/expire`), las vencidas pasan a inactivas |
| RF-13 | Pre-lanzamiento / pre-orden de productos asociados a campañas con fecha futura | Media | ✅ | El producto muestra su estado de pre-orden hasta `launch_date` |
| RF-14 | Configurar slots de productos destacados del carrusel de la home (por campaña o global) | Media | ✅ | El admin asigna un producto por slot y la home respeta el orden |
| RF-15 | Suscripción al newsletter por email | Baja | ✅ | Email inválido → error 400; email repetido → "Ya estabas suscrito" |
| RF-16 | Enviar correos a los suscritos del newsletter | Baja | ⬜ | Fuera de alcance v1 (ver §8) |

### 3.3 Carrito, lista de deseos y checkout
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-20 | Carrito lateral (drawer): agregar, cambiar cantidad y quitar productos con variante | Alta | ✅ | El carrito persiste al recargar (localStorage) |
| RF-21 | Lista de deseos (requiere sesión) | Media | ✅ | Sin sesión se pide iniciar sesión; persiste al recargar |
| RF-22 | Checkout con datos de envío y resumen del pedido | Alta | ✅ | Solo usuarios autenticados; crea un pedido `pending` y redirige a `/order-success` |
| RF-23 | **Cobro real** mediante pasarela de pago (p. ej. Yappy, tarjeta vía Stripe/PayPal) o, como mínimo, pago contra entrega/transferencia con instrucciones | **Alta** | ⬜ | Hoy el pago es **simulado**. Un pedido solo pasa a pagado cuando el pago se confirma |
| RF-24 | El servidor debe **calcular el total** del pedido a partir de los precios de la BD (no confiar en el total enviado por el navegador) | **Alta** | ⬜ | Un total manipulado desde el navegador es ignorado; se usa precio × cantidad − descuentos |
| RF-25 | Verificar y **descontar stock** al crear el pedido (por variante) | **Alta** | ⬜ | Hoy está desactivado ("para testing"). Sin stock → error claro; con stock → se descuenta y se registra en `stock_logs` |
| RF-26 | Cupones de descuento en el checkout | Baja | ⬜ | La tabla `coupons` existe pero no está conectada |
| RF-27 | Correo de confirmación de pedido al cliente | Media | ⬜ | Al crear un pedido se envía un correo con el resumen |

### 3.4 Cuenta de cliente
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-30 | Registro con email y contraseña | Alta | ✅ | Email duplicado → error; contraseña guardada con bcrypt |
| RF-31 | Inicio de sesión con emisión de JWT | Alta | ✅ | Credenciales inválidas → 401; sesión persiste al recargar |
| RF-32 | Ver y editar perfil (`/profile`) | Media | ✅ | Los cambios se guardan vía `PUT /api/auth/me` |
| RF-33 | Gestionar direcciones de envío (CRUD, dirección por defecto) | Media | ✅ | Cada usuario solo ve/edita sus direcciones |
| RF-34 | Ver historial de pedidos propios con estado | Media | ✅ | Lista ordenada por fecha, solo del usuario autenticado |
| RF-35 | Recuperar contraseña olvidada por email | Media | ⬜ | Enlace de un solo uso con expiración |

### 3.5 Administración
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-40 | Acceso a `/admin` solo con rol `admin` | Alta | ✅ | Cliente o visitante → redirigido / 403 en la API |
| RF-41 | CRUD de productos: datos, precio, descuento, imágenes (principal y hover), variantes, estado de ciclo de vida, prioridad, etiquetas, notas internas, campaña/colección, mostrar en home | Alta | ✅ | Las imágenes subidas **sobreviven a reinicios y deploys** (se guardan en Neon) |
| RF-42 | CRUD de categorías y subcategorías | Alta | ✅ | Las categorías nuevas aparecen en filtros de la tienda |
| RF-43 | CRUD de colecciones con imagen y descripción larga | Media | ✅ | Igual que RF-06 |
| RF-44 | Gestión de pedidos: listar todos y cambiar estado (`pending` → `shipped` → `delivered` / `cancelled`) | Alta | ✅ | El cliente ve el nuevo estado en su historial |
| RF-45 | Dashboard con ventas totales, número de pedidos, clientes y ventas por periodo | Media | ✅ | Excluye pedidos cancelados de las ventas |
| RF-46 | Promover un usuario a administrador | Baja | ✅ | Solo un admin puede hacerlo |
| RF-47 | El admin inicial se crea desde variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) | Alta | ✅ | Sin esas variables no se crea ni modifica ningún admin; no existe endpoint público para crearlo |
| RF-48 | Exportar pedidos (CSV) para contabilidad | Baja | ⬜ | Descarga con fecha, cliente, artículos, total y estado |

### 3.6 Experiencia de usuario
| ID | Requisito | Prioridad | Estado | Criterios de aceptación |
|---|---|---|---|---|
| RF-50 | Tema claro/oscuro | Baja | ✅ | La preferencia se recuerda |
| RF-51 | Idioma español/inglés | Media | ✅ | Todos los textos de la tienda cambian al alternar |

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito | Estado |
|---|---|---|---|
| RNF-01 | Costo | La operación mensual cuesta **$0** mientras se cumplan los límites de los planes gratuitos (R-01…R-04). | ✅ |
| RNF-02 | Rendimiento | Con el backend despierto, las páginas del catálogo responden en < 2 s; imágenes servidas con caché de 1 año (`Cache-Control: immutable`). | ✅ |
| RNF-03 | Disponibilidad | Tolerar el cold start de Render: el frontend espera hasta 60 s antes de dar error. Opcional: monitor gratuito que llame a `/api/health` cada 10 min. | 🟡 |
| RNF-04 | Durabilidad | Ningún dato de negocio (productos, pedidos, usuarios, **imágenes**) depende del disco del servidor; todo vive en Neon. | ✅ |
| RNF-05 | Seguridad — credenciales | Contraseñas con bcrypt; JWT firmado con `JWT_SECRET` de entorno; sin credenciales en el código. La contraseña de admin antigua (publicada en el historial de git) debe cambiarse. | ✅ código / ⬜ rotación |
| RNF-06 | Seguridad — red | CORS restringido en producción a `ALLOWED_ORIGINS`; HTTPS en las tres plataformas; SSL hacia Neon. | ✅ |
| RNF-07 | Seguridad — abuso | Rate limiting: login 10/15 min, registro 5/60 min por IP real (`trust proxy` activo en Render). | ✅ |
| RNF-08 | Seguridad — autorización | Toda ruta de escritura de catálogo/marketing/pedidos requiere JWT + rol `admin`; los clientes solo acceden a sus propios datos. | ✅ |
| RNF-09 | Seguridad — datos | Los errores 500 no exponen stack traces en producción. | ✅ |
| RNF-10 | Usabilidad | Diseño responsive (móvil primero); textos en ES/EN. | ✅ |
| RNF-11 | Mantenibilidad | Lint sin errores (`npm run lint`); tests unitarios con Vitest + fast-check en backend y frontend; guía en `AGENTS.md`. | ✅ |
| RNF-12 | Observabilidad | Endpoint `/api/health` que verifica la conexión con la BD; logs en el panel de Render. | ✅ |
| RNF-13 | Escalabilidad | Al superar los límites gratuitos, migrar sin cambios de código: Render Starter, Neon Launch, frontend a plan comercial. | ⬜ (plan) |
| RNF-14 | Legal | Publicar términos y condiciones, política de privacidad y de devoluciones antes de vender (páginas `/info/*`). | 🟡 |

---

## 5. Interfaces externas

### 5.1 Interfaz de usuario
- **Tienda**: `/`, `/shop`, `/collections`, `/new-arrivals`, `/lookbook`, `/about`, `/product/:id`, `/wishlist`, `/checkout`, `/order-success`, `/login`, `/profile`, `/info/:page`, 404.
- **Admin** (`/admin`): Dashboard, Productos, Pedidos, Categorías, Colecciones, Campañas, Eventos, Productos destacados, Ajustes.

### 5.2 Interfaz de software (API REST, base `/api`)
| Recurso | Público | Cliente autenticado | Admin |
|---|---|---|---|
| `auth` | `POST /login`, `POST /register` | `GET/PUT /me` | `POST /promote` |
| `products` | `GET /`, `GET /:id`, `GET /categories`, `GET /sub-categories` | — | `GET /admin`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `categories`, `subcategories` | `GET` | — | `POST`, `PUT`, `DELETE` |
| `collections` | `GET /`, `GET /:slug`, `GET /:slug/products` | — | `POST`, `PUT`, `DELETE` |
| `campaigns` | `GET /`, `/active`, `/active-all`, `/upcoming` | — | `POST`, `PUT`, `DELETE`, `POST /expire` |
| `featured-products` | `GET /` | — | `PUT /slots` |
| `orders` | — | `POST /`, `GET /my` | `GET /all`, `PUT /:id/status` |
| `addresses` | — | `GET`, `POST`, `PUT`, `DELETE` | — |
| `admin` | — | — | `GET /stats` |
| `newsletter` | `POST /subscribe` | — | — |
| `health` | `GET /health` | — | — |

Autenticación: header `Authorization: Bearer <JWT>`. Imágenes: `GET /uploads/<carpeta>/<archivo>` (disco → fallback BD).

### 5.3 Hardware
No aplica (100 % en la nube). Clientes: cualquier navegador moderno de escritorio o móvil.

### 5.4 Comunicaciones y servicios
| Servicio | Uso | Configuración |
|---|---|---|
| **Neon** | PostgreSQL gestionado | `DATABASE_URL` (cadena *pooled*, SSL) |
| **Render** | Hosting del backend | `render.yaml`; variables `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV` |
| **Vercel** | Hosting del frontend | Root `frontend/`; variable `VITE_API_URL` |
| **GitHub** | Código fuente y despliegue automático al hacer push | Repo `ruicki/visualmind` |

---

## 6. Modelo de datos

```
users ─┬─< orders ─< order_items >─ products ─< product_variants
       ├─< shipping_addresses              │
       │                                   ├─> categories (por nombre)
       │                                   ├─> collections
       │                                   ├─> campaigns ─< featured_product_slots
       │                                   └─> seasons
       │                         products ─< stock_logs
coupons (sin usar) · newsletter_subscribers · uploaded_images (path → bytes)
```

| Entidad | Campos clave | Notas |
|---|---|---|
| `users` | id (UUID), email único, password_hash, full_name, role | role: `customer` / `admin` |
| `products` | title, price, discount, category, sub_category, image_url, hover_image_url, stock, lifecycle_state, priority, launch_date, campaign_id, collection_id, show_on_home, tags | Núcleo del catálogo |
| `product_variants` | product_id, size, color, stock, sku | Stock por talla/color |
| `orders` | user_id, items (JSONB), total, status, shipping_details (JSONB) | status: pending/shipped/delivered/cancelled |
| `order_items` | order_id, product_id, variant_id, quantity, price_at_purchase | Reservado para reportes/stock (aún no se llena) |
| `shipping_addresses` | user_id, full_name, address_line, city, province, country, is_default | País por defecto Panamá |
| `campaigns` | name, slug, banner_url, secondary_images, accent_color, start/end_date, is_active, countdown_enabled, type, button_text/link | campaign / season |
| `collections` | name, slug, image_url, description_long, is_active | |
| `categories` | name, slug, icon | Subcategorías con su propia tabla/controlador |
| `featured_product_slots` | slot_order, product_id, campaign_id, rotation | Único por (campaign_id, slot_order) |
| `stock_logs` | product_id, variant_id, change, reason | Auditoría de stock (aún no se usa) |
| `newsletter_subscribers` | email único, subscribed_at | |
| `uploaded_images` | path (PK), mime_type, data (BYTEA), size | Imágenes persistentes independientes del disco |

---

## 7. Casos de uso / historias de usuario clave

| ID | Historia | Requisitos |
|---|---|---|
| HU-01 | Como **visitante**, quiero explorar el catálogo y filtrar por categoría para encontrar ropa que me guste. | RF-01, RF-02, RF-03 |
| HU-02 | Como **visitante**, quiero ver la campaña activa con su cuenta regresiva para no perderme el lanzamiento. | RF-11, RF-13 |
| HU-03 | Como **cliente**, quiero agregar productos al carrito, pagar y recibir confirmación de mi pedido. | RF-20, RF-22, RF-23, RF-27 |
| HU-04 | Como **cliente**, quiero guardar mis direcciones y ver el estado de mis pedidos. | RF-33, RF-34 |
| HU-05 | Como **admin**, quiero subir un producto con fotos y variantes y que las fotos no desaparezcan nunca. | RF-41, RNF-04 |
| HU-06 | Como **admin**, quiero lanzar una campaña con banner y productos destacados sin tocar código. | RF-10, RF-14 |
| HU-07 | Como **admin**, quiero ver los pedidos nuevos, marcarlos como enviados y conocer mis ventas del mes. | RF-44, RF-45 |

**Caso de uso detallado — CU-01 Comprar (HU-03)**
1. El cliente agrega productos (con talla/color) al carrito.
2. Va a `/checkout`; si no tiene sesión, se le pide iniciar sesión.
3. Ingresa o elige su dirección de envío.
4. *(Pendiente RF-23)* Elige método de pago y paga.
5. El sistema valida stock (RF-25), calcula el total en el servidor (RF-24) y crea el pedido.
6. Se muestra `/order-success` y *(pendiente RF-27)* se envía un correo de confirmación.
7. El admin ve el pedido en `/admin/orders` y actualiza su estado hasta `delivered`.

---

## 8. Fuera de alcance (v1) y riesgos

### 8.1 Fuera de alcance
- App móvil nativa.
- Multi-moneda y envíos internacionales con cálculo automático de tarifas.
- Marketplace con varios vendedores.
- Campañas de email masivo del newsletter (RF-16).
- Programa de puntos/fidelización.

### 8.2 Riesgos
| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| RS-01 | **No hay cobro real** (checkout simulado) y el **total lo envía el navegador** | Alto: no se puede vender; un pedido podría registrarse con precio manipulado | Implementar RF-23 y RF-24 antes de abrir ventas |
| RS-02 | Vercel Hobby **prohíbe uso comercial** | Medio: suspensión del frontend | Migrar el frontend a Render Static Site o Cloudflare Pages (gratis, uso comercial) o a Vercel Pro |
| RS-03 | Cold start de Render (~1 min) | Medio: primeras visitas lentas, abandono | Monitor gratuito de `/api/health`; mensaje de "cargando"; plan pago cuando haya ventas |
| RS-04 | Límite de 0.5 GB de Neon (imágenes en BD) | Medio: no se podrán subir más imágenes | Compresión en navegador; al crecer, mover imágenes a almacenamiento de objetos (p. ej. Cloudinary/R2) |
| RS-05 | Contraseña de admin antigua publicada en el historial del repo | Alto: acceso no autorizado al panel | Definir `ADMIN_PASSWORD` nueva en Render (rota la contraseña al arrancar) |
| RS-06 | Stock no se valida ni descuenta | Alto: sobreventa | Implementar RF-25 |
| RS-07 | Imágenes antiguas que solo estaban en el disco de Render | Bajo: imágenes rotas en productos existentes | Volver a subirlas desde el admin |
| RS-08 | Dependencia de un solo desarrollador y scripts sueltos en `backend/` | Medio | Este SRS + `AGENTS.md` + limpieza de scripts ad-hoc |

---

## 9. Control de cambios y próximos pasos

### 9.1 Historial
| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-09-23 | Primera versión: levantamiento del sistema existente; infraestructura gratuita Neon + Render + Vercel |

### 9.2 Próximos pasos recomendados (orden sugerido)
1. **Hoy**: desplegar según `DEPLOY.md` y definir una `ADMIN_PASSWORD` nueva (RS-05).
2. **Antes de vender**: RF-24 (total en servidor), RF-25 (stock) y RF-23 (método de pago; lo más simple en Panamá: Yappy/transferencia con confirmación manual del admin).
3. **Al vender**: migrar el frontend a un hosting que permita uso comercial (RS-02) y publicar las páginas legales (RNF-14).
4. **Después**: RF-27 (correo de confirmación), RF-35 (recuperar contraseña), RF-26 (cupones), RF-48 (exportar CSV).

> Todo requisito nuevo o cambio de alcance se registra aquí **antes** de programarlo.
