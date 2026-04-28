/**
 * @file ThemeContext.jsx
 * @description Contexto de Tema (Dark/Light Mode).
 * Gestiona la apariencia visual de la aplicación inyectando atributos
 * en el nodo raíz del DOM para aplicar estilos CSS globales.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Contexto de tema.
 */
const ThemeContext = createContext();

/**
 * Hook personalizado para consumir el estado del tema.
 * @returns {{ theme: string, toggleTheme: Function }}
 * @example
 * const { theme, toggleTheme } = useTheme();
 */
export const useTheme = () => {
    return useContext(ThemeContext);
};

/**
 * Proveedor del contexto de tema.
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element}
 */
export const ThemeProvider = ({ children }) => {
    /**
     * Estado del tema. Prioriza la preferencia guardada en localStorage.
     * Por defecto es 'dark'.
     */
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'dark';
    });

    /**
     * Efecto secundario para sincronizar el estado de React con el atributo HTML
     * y persistir la preferencia en localStorage.
     */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    /**
     * Alterna entre modo claro ('light') y oscuro ('dark').
     */
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
