# 🚀 Visualmind — Auditoría de Estabilización y Producción (Fase 5)

> **Estado**: 🛠️ **En Ejecución**
> 
> Objetivo: Transformar el prototipo en una plataforma e-commerce profesional, orgánica y segura.

---

## 🌍 Bloque 1: Localización e Integridad (Prioridad 1)
- [ ] **Corrección Masiva de Traducciones:** Actualizar `LanguageContext.jsx` con todas las llaves faltantes identificadas en la auditoría (Shop, Footer, Políticas).
- [x] **Estabilidad de Red:** Implementado timeout de 5s en `axiosConfig.js` para evitar cuelgues del frontend.
- [x] **Fail-safe de Animaciones:** Asegurar que los elementos `.reveal` se muestren tras 2s si el observador falla.

---

## 🛠️ Bloque 2: Panel Administrativo "Súper Admin"
- [x] **Gestión Orgánica de Campañas:**
    - [x] Crear entidad/interfaz para Campañas (Nombre, Banner, Color, Cuenta Regresiva).
    - [x] Implementar selector de "Look & Feel" (Templates: Editorial, Masonry, Grid).
- [x] **Control Visual de Imágenes:**
    - [x] Implementar **Tooltips Visuales** con esquemas de proporción (4:5, 16:9) en el panel de carga.
    - [ ] Añadir compresión de imágenes en el cliente antes de la subida.
- [x] **Ciclo de Vida de Producto:**
    - [x] Añadir estados: `Draft`, `Published`, `Legacy/Archive`.
    - [x] Implementar sistema de **Prioridad (1-100)** para orden de visualización.
    - [x] Soporte para **Galería Multi-imagen** (hasta 4 por producto).
- [/] **Corrección y Optimización de Imágenes:**
    - [ ] Corregir construcción de URLs (quitar `/api` de rutas estáticas).
    - [ ] Simplificar Admin: Eliminar subida vía URL, permitir solo archivos locales.
    - [ ] Implementar validación visual pre-guardado para detectar archivos corruptos.
    - [ ] Migrar placeholders externos a `placehold.co` para estabilidad.

---

## 🎨 Bloque 3: Experiencia Orgánica (Frontend)
- [x] **Sección Estacional Dinámica:**
    - [x] Home debe leer la campaña activa y aplicar el banner/cuenta regresiva automáticamente.
    - [x] Implementar componente `CountdownTimer`.
- [x] **Lógica Legacy/Sale:**
    - [x] Crear sección automatizada en el catálogo para productos "Legacy" con incentivo de descuento.
    - [x] Badge visual de "Oferta" dinámico basado en `original_price`.
- [x] **Efectos Premium:**
    - [x] Implementar `HoverPreview` (cambio a segunda imagen en el grid del shop).
    - [x] Navbar: Integrar link de 'Inicio', logo corporativo y texto 'Visualmind' con animaciones.
- [x] **Variantes Dinámicas y Stock:**
    - [x] Backend: Retorno automático de variantes vía SQL `JSON_AGG`.
    - [x] QuickView: Mensajes de disponibilidad por talla/color (Agotado, Solo X, En Stock).
    - [x] ProductDetails: Selección inteligente de tallas desde la base de datos.
    - [x] ProductCard: Overlay de "AGOTADO" y bloqueo de compra rápida si no hay stock.

---

## 💰 Bloque 4: Checkout y Confianza
- [ ] **Transparencia Financiera:**
    - [ ] Desglose detallado en Carrito y Checkout (Subtotal, Envío: $0.00, Impuestos: $0.00).
- [ ] **Badge de Confianza:**
    - [ ] Implementar componente `TrustBadges.jsx` (Pagos Seguros, Envío Garantizado).
- [x] **Documentación Técnica Integral:**
    - [x] Documentación técnica integral (JSDoc en español)
    - [x] Documentar componentes del frontend (Cart, ProductCard, Navbar, etc.)
    - [x] Documentar páginas públicas (Home, Shop, ProductDetails, etc.)
    - [x] Documentar módulos administrativos (Dashboard, Products, Orders, etc.)
    - [x] Documentar utilidades y configuración de API (axiosConfig)
    - [x] Documentar lógica del backend (Controllers, Services, Config)
    - [x] Auditoría final de comentarios y coherencia terminológica
- [x] **Recibos Digitales:**
    - [x] Generación de PDF de recibo descargable en `OrderSuccess.jsx` mediante jsPDF y html2canvas.

---

---

## 🚀 Bloque 5: Despliegue y Producción (MVP)
- [x] **Infraestructura Railway (Backend):**
    - [x] Configuración de monorepo con `nixpacks.toml` en `/backend`.
    - [x] Sincronización con GitHub corregida.
    - [x] Limpieza de raíz para evitar errores de autodetección.
- [x] **Infraestructura Vercel (Frontend):**
    - [x] Root directory configurado en `/frontend`.
    - [x] Fix de `vercel.json` para despliegues fallidos.
- [/] **Persistencia de Datos:**
    - [x] Script de inicialización de DB (`init_prod_db.js`) creado.
    - [ ] Ejecución de migraciones en producción.
    - [ ] Verificación de credenciales Admin (`visualmind@admin.com`).
- [/] **Conectividad:**
    - [x] Fix de CORS con logging de diagnóstico.
    - [ ] Verificación de `Network Error` resuelto.

---


> **Última actualización**: 28 de Abril, 2026.
