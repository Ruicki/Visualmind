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
if (!container) {
  console.error('Main: Root container not found!');
  document.body.innerHTML = '<h1 style="color: red; padding: 2rem;">Error: #root element not found in HTML</h1>';
} else {
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
}

