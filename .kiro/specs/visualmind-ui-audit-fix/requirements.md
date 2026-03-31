# Documento de Requisitos

## Introducción

Este documento cubre la auditoría completa y corrección de Visualmind antes del deploy a producción. Visualmind es una tienda online de ropa en Panamá construida con React 19 + Vite (frontend) y Node.js/Express/PostgreSQL (backend). La auditoría identificó 24 problemas clasificados como críticos, altos y medios que deben resolverse para garantizar seguridad, funcionalidad correcta y experiencia de usuario adecuada en producción.

## Glosario

- **Shop**: Página `/shop` que lista todos los productos con filtros.
- **SearchModal**: Componente modal de búsqueda global accesible desde la Navbar.
- **AuthContext**: Contexto React que gestiona el estado de autenticación del usuario.
- **OrderController**: Controlador Express que maneja la creación y gestión de órdenes.
- **CheckoutForm**: Componente de formulario de pago dentro de la página `/checkout`.
- **AdminProducts**: Panel de administración para crear y editar productos.
- **AdminDashboard**: Panel de estadísticas del administrador.
- **ProductCard**: Componente de tarjeta de producto reutilizable.
- **CartContext**: Contexto React que gestiona el estado del carrito de compras.
- **WishlistContext**: Contexto React que gestiona la lista de deseos.
- **LanguageContext**: Contexto React que gestiona las traducciones i18n.
- **JWT**: JSON Web Token usado para autenticación.
- **CORS**: Cross-Origin Resource Sharing, política de seguridad HTTP.
- **SKU**: Stock Keeping Unit, identificador único de producto.
- **Hero**: Componente de sección principal de la página de inicio.
- **Collections**: Página que muestra las colecciones de productos.
- **Navbar**: Barra de navegación principal de la aplicación.
- **Footer**: Pie de página de la aplicación.

---

## Requisitos

### Requisito 1: Filtros de Talla y Color en Shop

**Historia de Usuario:** Como cliente, quiero filtrar productos por talla y color en la tienda, para encontrar rápidamente artículos disponibles en mi talla y color preferido.

#### Criterios de Aceptación

1. THE Shop SHALL mostrar un selector de talla con las opciones: S, M, L, XL, XXL.
2. THE Shop SHALL mostrar un selector de color con los colores disponibles extraídos de los productos cargados.
3. WHEN el usuario selecciona una talla, THE Shop SHALL mostrar únicamente los productos que tengan esa talla disponible en sus variantes o en el campo `sizes`.
4. WHEN el usuario selecciona un color, THE Shop SHALL mostrar únicamente los productos que tengan ese color disponible en sus variantes o en el campo `colors`.
5. WHEN el usuario activa múltiples filtros simultáneamente (categoría, precio, talla, color), THE Shop SHALL aplicar todos los filtros de forma combinada (AND lógico).
6. WHEN el usuario hace clic en el botón de limpiar filtros, THE Shop SHALL restablecer todos los filtros incluyendo talla y color a su valor por defecto.
7. THE Shop SHALL usar las claves de traducción `shop_extended.sizes` y `shop_extended.colors` del LanguageContext para los labels de los nuevos filtros.

---

### Requisito 2: SearchModal Conectado a la API

**Historia de Usuario:** Como cliente, quiero que la búsqueda global encuentre productos reales de la base de datos, para no perderme artículos que no están en los datos estáticos.

#### Criterios de Aceptación

1. WHEN el usuario escribe en el SearchModal, THE SearchModal SHALL consultar el endpoint `GET /api/products` con un parámetro de búsqueda en lugar de filtrar únicamente `STATIC_PRODUCTS`.
2. WHEN la consulta a la API retorna resultados, THE SearchModal SHALL mostrar los productos de la API combinados con los resultados de los datos estáticos, eliminando duplicados por `id`.
3. WHEN el usuario hace clic en un resultado del SearchModal, THE SearchModal SHALL navegar a `/product/:id` del producto seleccionado en lugar de redirigir genéricamente a `/shop`.
4. IF la consulta a la API falla, THEN THE SearchModal SHALL continuar mostrando resultados filtrados de los datos estáticos como fallback.
5. WHILE la consulta a la API está en progreso, THE SearchModal SHALL mostrar un indicador de carga visible.

---

### Requisito 3: CORS Restrictivo en Backend

**Historia de Usuario:** Como administrador del sistema, quiero que el backend solo acepte peticiones de orígenes autorizados, para prevenir accesos no autorizados desde dominios externos.

#### Criterios de Aceptación

1. THE Server SHALL configurar CORS con una lista explícita de orígenes permitidos definida en variables de entorno (`ALLOWED_ORIGINS`).
2. WHEN una petición llega desde un origen no incluido en `ALLOWED_ORIGINS`, THE Server SHALL rechazarla con HTTP 403.
3. THE Server SHALL incluir en `ALLOWED_ORIGINS` por defecto: `http://localhost:5173` para desarrollo y el dominio de producción configurado en `FRONTEND_URL`.
4. WHERE el entorno es producción (`NODE_ENV=production`), THE Server SHALL rechazar peticiones sin cabecera `Origin` definida para rutas de API.
5. THE Server SHALL configurar los métodos HTTP permitidos explícitamente: GET, POST, PUT, DELETE, OPTIONS.

---

### Requisito 4: Validación de Expiración de JWT en Frontend

**Historia de Usuario:** Como usuario, quiero que mi sesión expire automáticamente cuando el token JWT caduque, para que mi cuenta no quede accesible indefinidamente en dispositivos compartidos.

#### Criterios de Aceptación

1. WHEN el AuthContext inicializa y encuentra un token en localStorage, THE AuthContext SHALL decodificar el payload del JWT y verificar el campo `exp` contra la fecha/hora actual.
2. IF el token almacenado en localStorage tiene el campo `exp` menor o igual al timestamp actual, THEN THE AuthContext SHALL eliminar el token y el usuario de localStorage y establecer el estado `user` como `null`.
3. THE AuthContext SHALL realizar la verificación de expiración sin llamadas al backend, usando únicamente decodificación base64 del payload del JWT.
4. WHEN el usuario autenticado realiza una acción y el token ha expirado durante la sesión activa, THE AuthContext SHALL limpiar el estado de autenticación y redirigir al usuario a `/auth`.
5. THE AuthContext SHALL exponer una función `isTokenValid()` que retorne `true` si el token existe y no ha expirado, `false` en caso contrario.

---

### Requisito 5: Decremento de Stock al Crear Orden

**Historia de Usuario:** Como administrador, quiero que el stock de los productos se actualice automáticamente al confirmarse una orden, para mantener el inventario preciso en la base de datos.

#### Criterios de Aceptación

1. WHEN el OrderController crea una orden exitosamente, THE OrderController SHALL decrementar el campo `stock` de cada producto en la tabla `products` según la `quantity` de cada ítem de la orden.
2. THE OrderController SHALL ejecutar la creación de la orden y el decremento de stock dentro de una transacción de base de datos, de modo que si el decremento falla, la orden no se cree.
3. IF el stock de un producto es insuficiente para cubrir la cantidad solicitada en la orden, THEN THE OrderController SHALL rechazar la orden completa con HTTP 400 y un mensaje descriptivo indicando qué producto no tiene stock suficiente.
4. WHEN una orden es cancelada (status cambia a `cancelled`), THE OrderController SHALL restaurar el stock de los productos involucrados en la orden.
5. THE OrderController SHALL actualizar el stock de variantes específicas (por talla/color) si el ítem de la orden incluye los campos `size` y `color`, buscando la variante correspondiente en el campo `variants` del producto.

---

### Requisito 6: Validación de Formulario de Checkout

**Historia de Usuario:** Como cliente, quiero que el formulario de checkout valide mis datos antes de procesar el pago, para evitar errores por información incompleta o incorrecta.

#### Criterios de Aceptación

1. THE CheckoutForm SHALL mantener estado React (`useState`) para cada campo del formulario de envío: nombre, email, dirección, ciudad y código postal.
2. WHEN el usuario intenta enviar el formulario con el campo nombre vacío o con menos de 2 caracteres, THE CheckoutForm SHALL mostrar un mensaje de error bajo ese campo.
3. WHEN el usuario intenta enviar el formulario con un email que no cumple el formato `usuario@dominio.ext`, THE CheckoutForm SHALL mostrar un mensaje de error bajo el campo email.
4. WHEN el usuario intenta enviar el formulario con el campo dirección vacío, THE CheckoutForm SHALL mostrar un mensaje de error bajo ese campo.
5. WHEN todos los campos del formulario son válidos, THE CheckoutForm SHALL incluir los datos de envío (nombre, email, dirección, ciudad, código postal) en el payload enviado al endpoint `POST /api/orders`.
6. THE CheckoutForm SHALL enviar al backend el objeto `shippingDetails` con los campos: `name`, `email`, `address`, `city`, `zip` junto con los `items` y el `total` de la orden.

---

### Requisito 7: Checkout Redirige a Login si No Autenticado

**Historia de Usuario:** Como propietario de la tienda, quiero que los usuarios no autenticados sean redirigidos al login al intentar acceder al checkout, para evitar que se procesen órdenes sin usuario asociado.

#### Criterios de Aceptación

1. WHEN un usuario no autenticado navega a la ruta `/checkout`, THE Checkout SHALL redirigirlo inmediatamente a `/auth` usando `useNavigate`.
2. THE Checkout SHALL verificar el estado de autenticación usando `useAuth()` antes de renderizar el formulario de pago.
3. WHILE el AuthContext está en estado `loading`, THE Checkout SHALL mostrar un indicador de carga en lugar del formulario.
4. WHEN el usuario no autenticado es redirigido a `/auth`, THE Checkout SHALL pasar el parámetro `?redirect=/checkout` en la URL para que tras el login sea redirigido de vuelta al checkout.
5. IF el carrito está vacío cuando el usuario autenticado accede al checkout, THEN THE Checkout SHALL redirigirlo a `/shop` con un mensaje informativo.

---

### Requisito 8: Modal de AdminProducts Responsive

**Historia de Usuario:** Como administrador, quiero que el modal de crear/editar productos sea usable en pantallas pequeñas, para poder gestionar el catálogo desde dispositivos móviles.

#### Criterios de Aceptación

1. THE AdminProducts modal SHALL usar `width: min(700px, 95vw)` en lugar de `maxWidth: '700px'` fijo para adaptarse a pantallas pequeñas.
2. WHEN el viewport es menor a 640px, THE AdminProducts modal SHALL cambiar el grid de 2 columnas de los campos de formulario a 1 columna.
3. THE AdminProducts modal SHALL tener `maxHeight: '90dvh'` y `overflowY: 'auto'` en el contenedor de contenido para permitir scroll en pantallas con altura limitada.
4. WHEN el viewport es menor a 640px, THE AdminProducts modal SHALL posicionarse con `margin: auto` y `padding: 1rem` para evitar que quede cortado en los bordes.
5. THE AdminProducts modal SHALL mantener el botón de guardar siempre visible en la parte inferior del modal, sin quedar oculto por el scroll del contenido.

---

### Requisito 9: Correcciones de Layout Responsive

**Historia de Usuario:** Como cliente, quiero que la tienda se vea correctamente en dispositivos móviles, para tener una experiencia de compra cómoda desde mi teléfono.

#### Criterios de Aceptación

1. THE Collections page SHALL usar `fontSize: 'clamp(2rem, 5vw, 5rem)'` en el elemento `h2` de título de colección en lugar del valor fijo `5rem`.
2. THE Hero component SHALL usar `paddingTop: 'clamp(90px, 12vw, 140px)'` en lugar del valor fijo `140px`.
3. WHEN el viewport es menor a 768px, THE Hero component SHALL reducir el `paddingBottom` a un valor no mayor a `40px`.
4. THE Collections page SHALL usar `fontSize: 'clamp(6vw, 10vw, 12vw)'` para el título principal "CURATIONS" en lugar del valor fijo `12vw` que resulta ilegible en pantallas muy pequeñas.
5. THE Navbar mobile menu SHALL cerrarse WHEN el usuario hace clic fuera del menú, implementando un listener de `mousedown` en el `document` que detecte clics fuera del elemento del menú.

---

### Requisito 10: Lazy Loading de Imágenes

**Historia de Usuario:** Como cliente, quiero que la tienda cargue rápidamente, para no esperar a que se carguen todas las imágenes antes de poder navegar.

#### Criterios de Aceptación

1. THE ProductCard SHALL agregar el atributo `loading="lazy"` a todos los elementos `<img>` de productos.
2. THE Collections page SHALL agregar el atributo `loading="lazy"` a las imágenes de colecciones que no estén en el viewport inicial.
3. THE AdminProducts table SHALL agregar el atributo `loading="lazy"` a las imágenes de la tabla de productos.
4. THE ProductCard SHALL usar una imagen de fallback local (ej. `/placeholder-product.png`) en el handler `onError` en lugar de la URL externa `https://via.placeholder.com/`.
5. THE Checkout summary SHALL usar una imagen de fallback local en el handler `onError` de las imágenes de ítems del carrito.

---

### Requisito 11: Precios Formateados Correctamente

**Historia de Usuario:** Como cliente, quiero ver los precios siempre con dos decimales, para tener claridad sobre el costo exacto de los productos.

#### Criterios de Aceptación

1. THE ProductCard SHALL mostrar el precio usando `Number(price).toFixed(2)` en lugar del valor crudo `price`.
2. THE CartContext `getCartTotal()` SHALL retornar el total como número con precisión de dos decimales usando `parseFloat(total.toFixed(2))`.
3. THE AdminProducts table SHALL mostrar el precio de cada producto usando `Number(product.price).toFixed(2)`.
4. WHEN el precio de un producto es `null` o `undefined`, THE ProductCard SHALL mostrar `$0.00` como valor por defecto.

---

### Requisito 12: Textos i18n Completos

**Historia de Usuario:** Como usuario hispanohablante, quiero que todos los textos de la interfaz estén traducidos, para tener una experiencia coherente en español.

#### Criterios de Aceptación

1. THE Shop "Limpiar" button SHALL usar la clave de traducción `shop_extended.reset_filters` del LanguageContext en lugar del texto hardcodeado "Limpiar".
2. THE LanguageContext SHALL incluir la clave `shop.filter_size` con valor "Talla" en español y "Size" en inglés.
3. THE LanguageContext SHALL incluir la clave `shop.filter_color` con valor "Color" en español y "Color" en inglés.
4. THE LanguageContext SHALL incluir la clave `checkout.login_required` con valor "Inicia sesión para completar tu compra." en español y "Please log in to complete your purchase." en inglés.
5. THE AdminDashboard "vs mes anterior" text SHALL usar una clave de traducción `admin.vs_prev_month` en lugar del texto hardcodeado.
6. THE LanguageContext SHALL incluir las claves de traducción para los nuevos filtros de talla y color en ambos idiomas (es/en).

---

### Requisito 13: Rate Limiting en Endpoints de Autenticación

**Historia de Usuario:** Como administrador del sistema, quiero que los endpoints de login y registro tengan límite de intentos, para proteger la aplicación contra ataques de fuerza bruta.

#### Criterios de Aceptación

1. THE Server SHALL aplicar un middleware de rate limiting al endpoint `POST /api/auth/login` que permita un máximo de 10 intentos por IP en una ventana de 15 minutos.
2. IF una IP supera el límite de intentos en `POST /api/auth/login`, THEN THE Server SHALL responder con HTTP 429 y un mensaje indicando el tiempo de espera restante.
3. THE Server SHALL aplicar un middleware de rate limiting al endpoint `POST /api/auth/register` que permita un máximo de 5 registros por IP en una ventana de 60 minutos.
4. THE Server SHALL usar el paquete `express-rate-limit` para implementar el rate limiting.
5. WHERE el entorno es desarrollo (`NODE_ENV=development`), THE Server SHALL omitir el rate limiting para facilitar las pruebas.

---

### Requisito 14: Validación de SKU Único en AdminProducts

**Historia de Usuario:** Como administrador, quiero que el sistema me avise si intento crear un producto con un SKU ya existente, para mantener la integridad del catálogo.

#### Criterios de Aceptación

1. WHEN el administrador intenta guardar un producto con un SKU que ya existe en la base de datos, THE AdminProducts SHALL mostrar un mensaje de error indicando que el SKU ya está en uso.
2. THE ProductController SHALL verificar la unicidad del SKU antes de insertar o actualizar un producto en la base de datos.
3. IF el SKU ya existe al crear un producto nuevo, THEN THE ProductController SHALL responder con HTTP 409 y el mensaje "El SKU ya está en uso por otro producto".
4. THE AdminProducts form SHALL mostrar el error de SKU duplicado bajo el campo SKU en el formulario, sin cerrar el modal.
5. WHERE el campo SKU está vacío, THE ProductController SHALL omitir la validación de unicidad y permitir múltiples productos sin SKU.
