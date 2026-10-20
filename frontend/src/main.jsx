/**
 * @file main.jsx
 * @description Punto de entrada principal de la aplicación React.
 * Se encarga de la inicialización del DOM, configuración del StrictMode 
 * y la inyección del LanguageProvider (internacionalización) en la raíz.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import api from './api/axiosConfig';
import { enableCatalogMode } from './utils/catalogMode';

/**
 * Registro de inicio de la aplicación para depuración en entornos de desarrollo.
 */
console.log('Main: Starting React application...');

const container = document.getElementById('root');

/**
 * Validación crítica del contenedor raíz.
 * Si el elemento #root no existe, se muestra un mensaje de error fatal
 * directamente en el body para evitar una pantalla en blanco sin contexto.
 */
/**
 * Versión de demostración (VITE_DEMO=1): un servidor simulado responde en el navegador.
 * El build normal lo carga aparte (import dinámico) solo si el backend no responde.
 */
async function prepareDemo() {
  if (import.meta.env.VITE_DEMO) {
    const { installDemo } = await import('./demo/mockBackend.js');
    installDemo(api);
    const { mountDemoBar } = await import('./demo/demoBar.js');
    mountDemoBar(api);
    return;
  }
  // Sitio publicado: si el backend no responde, la tienda abre en modo catálogo
  // (catálogo integrado y pedidos confirmados por WhatsApp) en vez de verse vacía.
  if (import.meta.env.PROD && !(await backendIsUp())) {
    const { installDemo } = await import('./demo/mockBackend.js');
    installDemo(api, { catalog: true });
    enableCatalogMode();
    console.warn('[API] El backend no responde: tienda en modo catálogo.');
  }
}

/** Comprueba GET /health con un tiempo máximo corto para no retrasar la carga. */
async function backendIsUp(timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const base = String(api.defaults.baseURL || '').replace(/\/+$/, '');
    const res = await fetch(`${base}/health`, { signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

if (!container) {
  console.error('Main: Root container not found!');
  document.body.innerHTML = '<h1 style="color: red; padding: 2rem;">Error: #root element not found in HTML</h1>';
} else {
  prepareDemo().then(() => {
  try {
    const root = createRoot(container);
    
    /**
     * Renderizado de la aplicación.
     * @see {@link LanguageProvider} Envuelve toda la app para asegurar que las traducciones estén disponibles desde el inicio.
     * @see {@link App} Componente principal que contiene el Router y el resto de la lógica.
     */
    root.render(
      <React.StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </React.StrictMode>
    );
    console.log('Main: Render called successfully');
  } catch (error) {
    /**
     * Captura de errores críticos durante la fase de montaje inicial.
     */
    console.error('Main: Error during rendering:', error);
    container.innerHTML = `<h1 style="color: red; padding: 2rem;">React Render Error: ${error.message}</h1>`;
  }
  });
}

