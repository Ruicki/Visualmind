import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
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
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Guardar en LocalStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        const variantId = `${product.id}-${product.selectedColor?.name || 'default'}-${product.selectedSize || 'default'}`;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.variantUniqueId === variantId);
            if (existingItem) {
                return prevItems.map(item =>
                    item.variantUniqueId === variantId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...product, variantUniqueId: variantId, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (variantUniqueId) => {
        setCartItems(prev => prev.filter(item => item.variantUniqueId !== variantUniqueId));
    };

    const updateQuantity = (variantUniqueId, change) => {
        const item = cartItems.find(i => i.variantUniqueId === variantUniqueId);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + change);

        setCartItems(prev => prev.map(i => i.variantUniqueId === variantUniqueId ? { ...i, quantity: newQty } : i));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

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
