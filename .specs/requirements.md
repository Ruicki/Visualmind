# 📋 Visualmind — Requerimientos del Proyecto

> **Instrucciones**: Responde cada sección con la mayor claridad posible.
> Donde haya opciones entre corchetes `[ ]`, marca con `[x]` la que aplique.
> Esto servirá como fuente de verdad para todas las decisiones técnicas.

---

## 1. Visión General

**¿Qué es Visualmind?**
claramente es una tienda online de ropa y productos de cerigrafia

**¿Cuál es el público objetivo?**
esta por el momento ubicada en Panamá y el publico objetivo es de 18 a 55 años apoximadamente ya que no tenemos limite para que las personas escojan lo que quiere tiene si un enfoque en cosas culturales como annime y otras pero simplemente tratamos de crear diseños diviertidos y originales

**¿Qué problema resuelve?**
al ser local y poder llegar a pedir tu diseño personalizado damos la opcion de crear lo que mas te gusta asi como tambien comprar los diseños que ya tenemos a disposicision ademas en panama no tenemos muchas tiendas con este tiepo de pagians web

---

## 2. Tipo de Plataforma

**¿Qué tipo de plataforma es?**

- [x] Tienda online real (con pagos y envíos)
- [ ] Catálogo / portafolio (solo mostrar productos, sin compras online)
- [ ] Marketplace (múltiples vendedores)
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

**¿Se procesan pagos reales?**

- [ x] Sí, con Stripe u otro procesador es lo que se quiere lograr
- [ ] No por ahora, pero se planea a futuro
- [ ] No, nunca

**¿Se hacen envíos físicos?**

- [x ] Sí, envíos nacionales por el momento
- [ ] Sí, envíos nacionales e internacionales
- [ ] No, solo producto digital
- [ ] No por ahora, pero se planea

**¿En qué país/región opera principalmente?**
Panamá y proxima latinoamerica aun no estamos local

---

## 3. Usuarios y Roles

### 3.1 Administrador(es)

**¿Quién administra la plataforma?**

- [ ] Solo yo (una persona)
- [x] Un equipo pequeño (2-5 personas)
- [ ] Múltiples administradores con diferentes permisos

**¿Qué necesita poder hacer el admin?**

- [x] Agregar / editar / eliminar productos
- [x] Subir imágenes de productos
- [x] Gestionar categorías y subcategorías
- [x] Ver y gestionar pedidos
- [x] Ver estadísticas / dashboard de ventas (Gráficas mensuales/semanales, art. más vendidos)
- [x] Gestionar usuarios / clientes (Registro de nuevos clientes, datos de contacto)
- [x] Gestionar descuentos / cupones y promociones (Fechas de lanzamiento, destacados)
- [x] Configurar información de la tienda (logo, nombre, etc.)
- [x] Control de inventario avanzado (Stock inicial, aumento de stock, variantes por talla/color)
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

### 3.2 Clientes / Visitantes

**¿Los clientes necesitan registrarse?**

- [x] Sí, obligatorio para comprar
- [ ] Opcional (pueden comprar como invitados)
- [ ] No, sin registro

**¿Qué puede hacer un cliente registrado?**

- [x] Ver historial de pedidos
- [x] Guardar productos en wishlist / favoritos
- [x] Dejar reseñas / valoraciones ( a furturo )
- [x] Gestionar direcciones de envío
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

**¿Cuándo esperas tener tráfico real de clientes?**

- [ ] Ya hay tráfico
- [x] En las próximas semanas ( cuando este lista la pagina )
- [ ] En los próximos meses
- [ ] Todavía no sé

---

## 4. Productos

**¿Cuántos productos hay actualmente?**
por el momento si hablamios de stock no lo teno a mano ya que es por pedido se realizan pero actualmernte en catalogo lo que vez aunque proximamente cuando se agrege todas las funciones de administrador y de control de productosy inventario esperamos mas de 40

**¿Cuántos productos se esperan a futuro?**

- [x] Menos de 50
- [ ] 50 - 200
- [ ] 200 - 1000
- [ ] Más de 1000

**¿Qué información tiene cada producto?**

- [x] Título / nombre
- [x] Precio
- [x] Categoría
- [x] Subcategoría
- [x] Imagen principal
- [x] Múltiples imágenes / galería
- [x] Descripción larga
- [x] Tallas disponibles y Stock por talla
- [x] Colores / variantes y Stock por color
- [x] Stock / inventario (Inicial y actual)
- [ ] Peso (para calcular envío)
- [x] SKU / código de producto
- [x] Producto destacado / nuevo (Control de visibilidad en Home/Novedades)
- [x] Descuento / precio de oferta / Fechas de lanzamiento
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

**¿Las categorías son fijas o dinámicas?**

- [ ] Fijas (las defino yo en el código)
- [x] Dinámicas (el admin puede crear nuevas desde el panel)

**Categorías actuales conocidas:**
anime, videojuegos, deportes, etc actualmente

---

## 5. Imágenes

**¿De dónde vienen las imágenes de productos?**

- [x] Fotos propias subidas desde mi computadora mi socio osea el dueño de la tienda hace las imagenes y el las tienpricipalemerte no estaan en otro lado asiq eu no es necesario url externos
- [ ] URLs externas (Imgur, CDN, etc.)
- [ ] Ambas
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

**¿Cuántas imágenes por producto?**

- [ ] Solo 1 imagen principal
- [x] 1 principal + variantes por color
- [ ] Galería completa (3-10 imágenes)

**¿Formato y tamaño típico?**
JPG/PNG/WEBP, 1-5MB cada una

---

## 6. Idioma e Internacionalización

**¿En qué idiomas funciona la tienda?**

- [ ] Solo español
- [ ] Solo inglés
- [x] Español + Inglés (bilingüe)
- [ ] Más idiomas: **\*\*\*\***\_**\*\*\*\***

**¿El contenido de productos está en un solo idioma o se traduce?**

- [ ] Un solo idioma
- [x] Se traduce cada producto

---

## 7. Backend y Almacenamiento

**Estado actual de Supabase:**
la verdad no se usar mucho supabase y ademas se que hayq ue pagar por el momento quiero primero estructurar toda la pagina si es posible local y que luego solo sea hacer pocos cambios y poder usar el hosting que mas me convenga

**¿Qué prefieres para almacenar datos?**

- [ ] Supabase (ya está configurado, solo falta pulir)
- [] Base de datos local (JSON/SQLite) — más simple para desarrollo
- [x] Backend propio (Node.js + Express + DB)
- [ ] No estoy seguro, recomiéndame
      la que en este caso me funcione mas actuqalmente tengo ya postgresql en mi pc y es l que he visto un poco mas

**¿Qué prefieres para almacenar imágenes?**

- [ ] Supabase Storage (nube)
- [x] Carpeta local en el proyecto (`public/images/`)
- [ ] CDN externo (Cloudinary, Imgur)
- [x] No estoy seguro, recomiéndame

**¿Dónde planeas hacer deploy?**

- [x] Vercel es donde esta por el momento aunqeu en algun punto me gustaria que tenga un dominio propio
- [ ] Netlify
- [ ] Servidor propio (VPS)
- [ ] Hosting compartido
- [ ] Todavía no sé
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

---

## 8. Funcionalidades Extra

**¿Cuáles de estas funcionalidades necesitas?**

- [x] Carrito de compras
- [x] Wishlist / favoritos
- [x] Búsqueda de productos
- [x] Filtros (categoría, precio, etc.)
- [ ] Sistema de cupones / descuentos
- [x] Reseñas de clientes a furuto es es prioridad
- [x] Notificaciones por email y mensajeria como whatsapp(confirmación de pedido, etc.)
- [ ] Blog / sección de noticias
- [x] Integración con redes sociales
- [x] SEO avanzado ( explicame este paso )
- [x] Analytics (Google Analytics, etc. a p´robar nucna lo hemos usado es una empresa nueva y micro)
- [ ] Chat en vivo / soporte
- [ ] Otro: **\*\*\*\***\_**\*\*\*\***

---

## 9. Prioridades

**Ordena del 1 (más urgente) al 5 (menos urgente):**

- [3] Admin panel funcional (CRUD de productos con imágenes)
- [1] Tienda profesional y responsive
- [2] Sistema de pagos funcional
- [4] Catálogo fácil de gestionar
- [5] Preparar para producción / deploy

---

## 10. Restricciones y Preferencias

**Presupuesto para servicios:**

- [1] Solo servicios gratuitos (free tier)
- [2] Dispuesto a pagar servicios básicos ($5-20/mes)
- [ ] Sin restricción de presupuesto
- los marco porque quisiera empesar con algo que sea gratis y si ya es algo que renta poder decidir hacer el cambio a algo estable de pago
  **Nivel técnico del equipo:**

solo yo se programar me consideraria nivel medio de desarrollo ya que me apoloo mucho en ti la ia pero tengo conocimientos basicos de programacion con estudios intermedios

**Plazo de entrega esperado:**

calculemos una fecha con un flujo de trabajo organizado y con tareas claras y cronogramadas para un correcto mvp y webapp de ventas

---

> **Nota**: Una vez completes este documento, se generarán las decisiones de
> arquitectura en `design.md` y el plan de tareas en `tasks.md`.
