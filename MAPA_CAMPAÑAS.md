# Mapa de Componentes: Sistema de Campañas

Este documento detalla qué partes del código interactúan con el sistema de Campañas y Temporadas, facilitando la visualización de cómo fluye la información desde el panel de administración hasta el cliente final.

---

## 1. Núcleo de Gestión (Panel de Control)
Estos componentes definen qué campaña está activa y cuáles son sus datos (banners, colores, textos).

| Componente | Función Principal | Archivo |
| :--- | :--- | :--- |
| **AdminCampaigns** | Interfaz para crear/editar campañas, subir banners y configurar el botón CTA. | `AdminCampaigns.jsx` |
| **AdminProducts** | Permite asignar un producto específico a una campaña o temporada. | `AdminProducts.jsx` |
| **CampaignController** | Procesa las peticiones del admin y decide qué campaña es la "activa" para la web. | `campaignController.js` |

---

## 2. Visualización en el Home (Experiencia de Usuario)
Aquí es donde el cliente ve el impacto de la campaña.

### A. Barra de Anuncio Superior
- **Componente:** `Home.jsx` (Líneas 149-190).
- **Qué hace:** Muestra una franja delgada con el nombre de la campaña y el **Contador (Countdown)** si hay una fecha de fin.

### B. Banner Principal (Hero)
- **Componente:** `Hero.jsx`.
- **Qué hace:**
    - **Fondo:** Usa la `banner_url` de la campaña.
    - **Acento:** Aplica el `accent_color` al botón y elementos visuales.
    - **CTA:** Renderiza el `button_text` y redirige al `button_link` configurado.

### C. Drops Estacionales
- **Componente:** `Home.jsx` (Líneas 274-299).
- **Qué hace:** Filtra automáticamente los productos que "pertenecen" a la campaña activa para mostrarlos en una cuadrícula destacada.

---

## 3. Navegación y Tienda
- **Shop Page (`Shop.jsx`):** Recibe el parámetro `?campaign=slug` para mostrar solo los productos de ese evento.
- **Navbar:** Puede adaptarse dinámicamente para resaltar la campaña vigente.

---

## 4. Automatización (Servicios en segundo plano)
- **EventService (`eventService.js`):** Cada vez que se inicia el servidor o se solicita, comprueba si una campaña ha caducado y cambia el estado de los productos a "Legacy" automáticamente.

---

### ¿Qué quieres ajustar ahora?
Sabiendo este mapa, podemos enfocarnos en:
1. **Estética del Hero:** Cambiar animaciones, fuentes o disposición del banner.
2. **Interactividad:** Mejorar el contador o añadir efectos cuando pasas el ratón por los productos de campaña.
3. **Flujo de Compra:** Personalizar la página de destino cuando el usuario hace clic en el botón de la campaña.
