# Plan de Implementación

## Grupo 1: Seguridad Backend

- [x] 1.1 Instalar `express-rate-limit` en el backend
  - Ejecutar `npm install express-rate-limit` en `backend/`
  - Verificar que aparece en `backend/package.json`

- [x] 1.2 Configurar CORS restrictivo en `backend/src/server.js`
  - Reemplazar `app.use(cors())` por configuración con lista de orígenes permitidos
  - Leer `ALLOWED_ORIGINS` desde variables de entorno con fallback a `http://localhost:5173`
  - Configurar métodos permitidos: GET, POST, PUT, DELETE, OPTIONS
  - Agregar `ALLOWED_ORIGINS=http://localhost:5173` al archivo `backend/.env`

- [x] 1.3 Agregar rate limiting a endpoints de autenticación en `backend/src/server.js`
  - Crear `loginLimiter`: máximo 10 intentos por IP en ventana de 15 minutos
  - Crear `registerLimiter`: máximo 5 registros por IP en ventana de 60 minutos
  - Aplicar `loginLimiter` a `POST /api/auth/login`
  - Aplicar `registerLimiter` a `POST /api/auth/register`
  - Configurar `skip` para omitir rate limiting en `NODE_ENV=development`

- [x] 1.4 Implementar decremento de stock en `backend/controllers/orderController.js`
  - Refactorizar `createOrder` para usar transacción PostgreSQL con `pool.connect()`
  - Agregar verificación de stock suficiente antes de crear la orden
  - Decrementar `stock` en tabla `products` para cada ítem de la orden dentro de la transacción
  - Retornar HTTP 400 con mensaje descriptivo si algún producto no tiene stock suficiente
  - Agregar campo `shipping_details` al INSERT de la orden

- [x] 1.5 Restaurar stock al cancelar orden en `backend/controllers/orderController.js`
  - Modificar `updateOrderStatus` para detectar cuando el nuevo status es `cancelled`
  - Parsear el campo `items` de la orden y restaurar el stock de cada producto
  - Ejecutar la restauración dentro de una transacción junto con el UPDATE de status

---

## Grupo 2: Shop — Filtros de Talla y Color

- [x] 2.1 Agregar estado de filtros de talla y color en `frontend/src/pages/Shop.jsx`
  - Agregar `const [selectedSize, setSelectedSize] = useState("all")`
  - Agregar `const [selectedColor, setSelectedColor] = useState("all")`
  - Importar `useMemo` de React

- [x] 2.2 Calcular tallas y colores disponibles dinámicamente en `frontend/src/pages/Shop.jsx`
  - Crear `availableSizes` con `useMemo` extrayendo tallas de `product.sizes` y `product.variants`
  - Ordenar tallas en el orden estándar: S, M, L, XL, XXL
  - Crear `availableColors` con `useMemo` extrayendo colores únicos de `product.colors` y `product.variants`

- [x] 2.3 Extender la lógica de filtrado en `frontend/src/pages/Shop.jsx`
  - Agregar condición de filtro por `selectedSize` en `filteredProducts`
  - Agregar condición de filtro por `selectedColor` en `filteredProducts`
  - Incluir `selectedSize` y `selectedColor` en el reset del botón "Limpiar"

- [x] 2.4 Agregar UI de filtros de talla y color en `frontend/src/pages/Shop.jsx`
  - Agregar selector de talla con el mismo estilo visual que el selector de precio
  - Agregar selector de color con el mismo estilo visual que el selector de precio
  - Usar claves i18n `shop.filter_size` y `shop.filter_color` para los labels

---

## Grupo 3: Checkout — Validación y Flujo Completo

- [ ] 3.1 Agregar redirección a login si no autenticado en `frontend/src/pages/Checkout.jsx`
  - Agregar `useEffect` que verifique `user` y `authLoading` al montar el componente
  - Redirigir a `/auth?redirect=/checkout` si el usuario no está autenticado
  - Redirigir a `/shop` si el carrito está vacío
  - Mostrar spinner mientras `authLoading` es `true`

- [~] 3.2 Conectar campos de envío al estado React en `frontend/src/pages/Checkout.jsx`
  - Crear estado `shippingData` con campos: `name`, `email`, `address`, `city`, `zip`
  - Inicializar `email` con `user?.email || ''`
  - Conectar cada `<input>` del formulario de envío con `value` y `onChange` correspondientes
  - Crear estado `fieldErrors` para mensajes de error por campo

- [~] 3.3 Implementar validación de campos de checkout en `frontend/src/pages/Checkout.jsx`
  - Crear función `validateShipping()` que valide nombre (mínimo 2 caracteres), email (formato válido) y dirección (no vacía)
  - Llamar `validateShipping()` al inicio de `handleSubmit` antes de procesar el pago
  - Mostrar mensajes de error bajo cada campo inválido usando `fieldErrors`
  - Limpiar errores al modificar cada campo

- [~] 3.4 Incluir datos de envío en el payload al backend en `frontend/src/pages/Checkout.jsx`
  - Agregar `shippingDetails: shippingData` al objeto enviado en `POST /api/orders`
  - Verificar que el backend recibe y almacena el campo `shipping_details`

---

## Grupo 4: Layout Responsive

- [~] 4.1 Corregir fontSize del h2 en `frontend/src/pages/Collections.jsx`
  - Cambiar `fontSize: '5rem'` a `fontSize: 'clamp(2rem, 5vw, 5rem)'` en el h2 del título de colección
  - Cambiar el título principal "CURATIONS" de `fontSize: '12vw'` a `fontSize: 'clamp(3rem, 10vw, 12vw)'`

- [~] 4.2 Corregir paddingTop excesivo en `frontend/src/components/Hero.jsx`
  - Cambiar `paddingTop: '140px'` a `paddingTop: 'clamp(90px, 12vw, 140px)'`
  - Cambiar `paddingBottom: '80px'` a `paddingBottom: 'clamp(40px, 6vw, 80px)'`

- [~] 4.3 Implementar cierre del menú mobile al hacer clic fuera en el componente Navbar
  - Localizar el componente Navbar en `frontend/src/components/`
  - Agregar `useRef` al contenedor del menú mobile
  - Agregar `useEffect` con listener `mousedown` en `document` para detectar clics fuera
  - Llamar `setMobileMenuOpen(false)` cuando el clic sea fuera del ref del menú

---

## Grupo 5: AuthContext — Validación de JWT

- [~] 5.1 Implementar validación de expiración de JWT en `frontend/src/context/AuthContext.jsx`
  - Crear función `isTokenExpired(token)` que decodifique el payload base64 y compare `exp * 1000` con `Date.now()`
  - Crear función `isTokenValid(token)` que retorne `true` si el token existe y no ha expirado
  - Modificar `checkAuth` para llamar `isTokenValid` antes de establecer el usuario
  - Si el token está expirado, limpiar localStorage y establecer `user` como `null`
  - Exponer `isTokenValid` en el valor del contexto

---

## Grupo 6: Imágenes y Performance

- [~] 6.1 Agregar lazy loading a imágenes en `frontend/src/components/ProductCard.jsx`
  - Agregar atributo `loading="lazy"` al elemento `<img>` del producto
  - Cambiar el fallback `onError` de URL externa a `/placeholder-product.png`

- [~] 6.2 Crear imagen placeholder local en `frontend/public/`
  - Crear o copiar una imagen simple como `frontend/public/placeholder-product.png`
  - La imagen debe ser liviana (< 5KB), puede ser un SVG exportado como PNG

- [~] 6.3 Agregar lazy loading a imágenes en `frontend/src/pages/Collections.jsx`
  - Agregar `loading="lazy"` a las imágenes de colecciones en el listado principal

- [~] 6.4 Agregar lazy loading a imágenes en `frontend/src/pages/admin/AdminProducts.jsx`
  - Agregar `loading="lazy"` a las imágenes de la tabla de productos

- [~] 6.5 Corregir fallback de imagen en `frontend/src/pages/Checkout.jsx`
  - Cambiar `onError` de las imágenes del resumen del pedido para usar `/placeholder-product.png`

- [~] 6.6 Conectar SearchModal a la API en `frontend/src/components/SearchModal.jsx`
  - Importar `axiosInstance` de `../api/axiosConfig`
  - Agregar estado `isSearching` para el indicador de carga
  - Modificar el `useEffect` de búsqueda para consultar `GET /api/products?search=query` además de filtrar locales
  - Combinar resultados de API y locales eliminando duplicados por `id`
  - Actualizar los links de resultados para navegar a `/product/:id` en lugar de `/shop`
  - Mostrar spinner mientras `isSearching` es `true`

---

## Grupo 7: i18n y Textos

- [~] 7.1 Agregar claves de traducción faltantes en `frontend/src/context/LanguageContext.jsx`
  - Agregar `filter_size` y `filter_color` en la sección `shop` de ambos idiomas
  - Agregar `error_name`, `error_email`, `error_address` en la sección `checkout` de ambos idiomas
  - Agregar `vs_prev_month` en la sección `admin` de ambos idiomas
  - Agregar `login_required` en la sección `checkout` si no existe

- [~] 7.2 Usar clave i18n en el botón "Limpiar" de `frontend/src/pages/Shop.jsx`
  - Reemplazar el texto hardcodeado `'Limpiar'` por `{t('shop_extended.reset_filters') || 'Limpiar'}`

- [~] 7.3 Usar clave i18n en AdminDashboard en `frontend/src/pages/admin/AdminDashboard.jsx`
  - Reemplazar el texto hardcodeado `'vs mes anterior'` por `{t('admin.vs_prev_month') || 'vs mes anterior'}`

---

## Grupo 8: Admin — Validación de SKU

- [~] 8.1 Agregar validación de SKU único en `backend/controllers/productController.js`
  - En la función de crear producto: verificar que no exista otro producto con el mismo SKU antes del INSERT
  - En la función de actualizar producto: verificar que no exista otro producto con el mismo SKU (excluyendo el producto actual)
  - Retornar HTTP 409 con mensaje `'El SKU ya está en uso por otro producto'` si hay conflicto
  - Omitir la validación si el campo SKU está vacío o es `null`

- [~] 8.2 Manejar error de SKU duplicado en `frontend/src/pages/admin/AdminProducts.jsx`
  - Agregar estado `skuError` para el mensaje de error del campo SKU
  - En el `catch` del `handleSave`, detectar respuesta HTTP 409 y establecer `skuError`
  - Mostrar `skuError` bajo el campo SKU en el formulario sin cerrar el modal
  - Limpiar `skuError` cuando el usuario modifique el campo SKU

- [~] 8.3 Corregir layout responsive del modal en `frontend/src/pages/admin/AdminProducts.jsx`
  - Cambiar `maxWidth: '700px'` a `width: 'min(700px, 95vw)'` en el contenedor del modal
  - Cambiar el grid de 2 columnas de los campos a `gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'`
  - Verificar que `maxHeight: '90dvh'` y `overflowY: 'auto'` estén en el contenedor de contenido
