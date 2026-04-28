import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * @context CartContext
 * @description Contexto global para la gestión del carrito de compras.
 */
const CartContext = createContext();

/**
 * @hook useCart
 * @description Hook personalizado para acceder de forma sencilla a las funciones y estado del carrito.
 * @returns {Object} { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, isCartOpen, setIsCartOpen }
 */
export const useCart = () => {
    return useContext(CartContext);
};

/**
 * @component CartProvider
 * @description Proveedor del estado del carrito. Maneja la hidratación inicial desde LocalStorage
 * y expone la lógica de negocio para manipular los productos seleccionados.
 */
export const CartProvider = ({ children }) => {
    // Inicialización del estado: Intenta recuperar datos previos de LocalStorage para mantener la sesión de compra
    const [cartItems, setCartItems] = useState(() => {
        const localCart = localStorage.getItem('cart');
        if (localCart) {
            try {
                return JSON.parse(localCart);
            } catch (err) {
                console.error("Error al cargar carrito:", err);
            }
        }
        return [];
    });
    
    // Estado para controlar la visibilidad del componente lateral (Drawer) del carrito
    const [isCartOpen, setIsCartOpen] = useState(false);

    /**
     * @effect
     * @description Persiste automáticamente cualquier cambio en el carrito hacia LocalStorage.
     */
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    /**
     * @function addToCart
     * @description Agrega un producto al carrito o incrementa su cantidad si ya existe.
     * Genera un variantUniqueId combinando ID + Color + Talla para distinguir entre variantes del mismo producto.
     * 
     * @param {Object} product - El producto con su variante seleccionada (id, title, price, selectedSize, selectedColor).
     */
    const addToCart = (product) => {
        const variantId = `${product.id}-${product.selectedColor?.name || 'default'}-${product.selectedSize || 'default'}`;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.variantUniqueId === variantId);
            if (existingItem) {
                // Si la variante ya está en el carrito, incrementa la cantidad
                return prevItems.map(item =>
                    item.variantUniqueId === variantId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // Si es nueva, la agrega con cantidad inicial de 1
            return [...prevItems, { ...product, variantUniqueId: variantId, quantity: 1 }];
        });
        
        // UX: Abre automáticamente el carrito al agregar un producto
        setIsCartOpen(true);
    };

    /**
     * @function removeFromCart
     * @description Elimina una variante específica del carrito usando su ID único generado.
     * @param {string} variantUniqueId - ID compuesto de la variante.
     */
    const removeFromCart = (variantUniqueId) => {
        setCartItems(prev => prev.filter(item => item.variantUniqueId !== variantUniqueId));
    };

    /**
     * @function updateQuantity
     * @description Ajusta la cantidad de un item específico, con validación de mínimo (1).
     * 
     * @param {string} variantUniqueId - ID de la variante a modificar.
     * @param {number} change - Valor de incremento o decremento (e.g., 1 o -1).
     */
    const updateQuantity = (variantUniqueId, change) => {
        const item = cartItems.find(i => i.variantUniqueId === variantUniqueId);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + change);

        setCartItems(prev => prev.map(i => i.variantUniqueId === variantUniqueId ? { ...i, quantity: newQty } : i));
    };

    /**
     * @function clearCart
     * @description Vacía completamente el carrito y limpia LocalStorage.
     */
    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    /**
     * @function getCartTotal
     * @description Calcula la suma total de los precios de todos los items (sin impuestos/envío).
     * @returns {number} Subtotal acumulado.
     */
    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    };

    /**
     * @function getCartCount
     * @description Cuenta el número total de unidades físicas en el carrito.
     * @returns {number} Cantidad total de items.
     */
    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    // Exposición de API del contexto
    return (
        <CartContext.Provider value={{
            cartItems,
            isCartOpen,
            setIsCartOpen,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
