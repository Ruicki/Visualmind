import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';

console.log('Main: Starting React application...');

const container = document.getElementById('root');

if (!container) {
  console.error('Main: Root container not found!');
  document.body.innerHTML = '<h1 style="color: red; padding: 2rem;">Error: #root element not found in HTML</h1>';
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </React.StrictMode>
    );
    console.log('Main: Render called successfully');
  } catch (error) {
    console.error('Main: Error during rendering:', error);
    container.innerHTML = `<h1 style="color: red; padding: 2rem;">React Render Error: ${error.message}</h1>`;
  }
}
