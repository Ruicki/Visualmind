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

---

## 🎨 Bloque 3: Experiencia Orgánica (Frontend)
- [x] **Sección Estacional Dinámica:**
    - [x] Home debe leer la campaña activa y aplicar el banner/cuenta regresiva automáticamente.
    - [x] Implementar componente `CountdownTimer`.
- [x] **Lógica Legacy/Sale:**
    - [x] Crear sección automatizada en el catálogo para productos "Legacy" con incentivo de descuento.
    - [x] Badge visual de "Oferta" dinámico basado en `original_price`.
- [ ] **Efectos Premium:**
    - [ ] Implementar `HoverPreview` (cambio a segunda imagen en el grid del shop).

---

## 💰 Bloque 4: Checkout y Confianza
- [ ] **Transparencia Financiera:**
    - [ ] Desglose detallado en Carrito y Checkout (Subtotal, Envío: $0.00, Impuestos: $0.00).
- [ ] **Badge de Confianza:**
    - [ ] Implementar componente `TrustBadges.jsx` (Pagos Seguros, Envío Garantizado).
- [ ] **Recibos Digitales:**
    - [ ] Generación de PDF/Imagen de recibo descargable en `OrderSuccess.jsx`.

---

- [x] Sincronización final con GitHub (main branch).
- [ ] Auditoría visual completa con `browser subagent`.
- [ ] Prueba de estrés de subida de imágenes optimizadas.
- [ ] Sincronización final con Vercel.

---

> **Última actualización**: 24 de Abril, 2026.
