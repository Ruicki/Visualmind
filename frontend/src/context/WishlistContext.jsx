/**
 * @file WishlistContext.jsx
 * @description Contexto de Wishlist (Favoritos).
 * Permite a los usuarios guardar productos de interés sin necesidad
 * de añadirlos directamente al carrito, con persistencia en LocalStorage.
 */
import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Contexto de favoritos.
 */
const WishlistContext = createContext();

/**
 * Hook personalizado para acceder a la lista de favoritos y sus métodos.
 * @returns {{ wishlistItems: Array, toggleWishlist: Function, isInWishlist: Function }}
 */
export const useWishlist = () => useContext(WishlistContext);

/**
 * Proveedor del contexto de Wishlist.
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element}
 */
export const WishlistProvider = ({ children }) => {
    /**
     * Estado de los artículos en favoritos, hidratado desde localStorage.
     */
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    /**
     * Sincroniza los cambios en la wishlist con localStorage.
     */
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    /**
     * Alterna la presencia de un producto en la lista de favoritos.
     * Si el producto ya existe, lo elimina; de lo contrario, lo añade.
     * @param {Object} product - El objeto del producto a alternar.
     */
    const toggleWishlist = (product) => {
        setWishlistItems(prev => {
            const isExist = prev.find(item => item.id === product.id);
            if (isExist) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    /**
     * Verifica si un producto específico ya está incluido en la lista de favoritos.
     * @param {number|string} productId - ID del producto a verificar.
     * @returns {boolean} True si el producto está en favoritos.
     */
    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};
