import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from DB on login
    useEffect(() => {
        if (!user) {
            // Optional: Load from localStorage if not logged in
            const localCart = localStorage.getItem('cart');
            if (localCart) setCartItems(JSON.parse(localCart));
            return;
        }

        const fetchCart = async () => {
            const { data, error } = await supabase
                .from('cart_items')
                .select('*, product:products(*)')
                .eq('user_id', user.id);

            if (data) {
                // Map DB format to UI format
                // Note: We need to handle the fact that DB stores product_id and variant_id
                // We'll reconstruct the UI item structure
                const formattedItems = data.map(item => {
                    const variantId = item.variant_id || `${item.product.id}-default-default`;
                    const [pid, colorName, size] = variantId.split('-'); // rudimentary parsing based on how we constructed ID

                    return {
                        id: item.product.id,
                        title: item.product.title,
                        price: item.product.price,
                        image: item.product.image_url,
                        selectedSize: size === 'default' ? null : size,
                        selectedColor: colorName === 'default' ? null : { name: colorName }, // Simplification
                        quantity: item.quantity,
                        variantUniqueId: variantId,
                        db_id: item.id // Keep reference to DB row
                    };
                });
                setCartItems(formattedItems);
            }
        };

        fetchCart();
    }, [user]);

    // Save to LocalStorage if not logged in
    useEffect(() => {
        if (!user) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, user]);

    const addToCart = async (product) => {
        const variantId = `${product.id}-${product.selectedColor?.name || 'default'}-${product.selectedSize || 'default'}`;

        if (user) {
            // Optimistic UI Update
            setCartItems(prev => {
                const existing = prev.find(i => i.variantUniqueId === variantId);
                if (existing) {
                    return prev.map(i => i.variantUniqueId === variantId ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { ...product, variantUniqueId: variantId, quantity: 1 }];
            });

            // DB Update (Upsert)
            // We first need the ID of the item if it exists to update quantity, or just upsert based on constraint
            // The unique constraint on (user_id, variant_id) handles this, but upsert syntax varies slightly.
            // Simplified: We'll assume the user mostly adds 1. 
            // Better: Check if exists to get current qty + 1, or rely on UI state.
            // Let's rely on finding it in the current state for the quantity calculation.
            const currentItem = cartItems.find(i => i.variantUniqueId === variantId);
            const newQty = (currentItem?.quantity || 0) + 1;

            await supabase
                .from('cart_items')
                .upsert({
                    user_id: user.id,
                    product_id: product.id,
                    variant_id: variantId,
                    quantity: newQty
                }, { onConflict: 'user_id, variant_id' });

        } else {
            // Local Logic
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
        }
        setIsCartOpen(true);
    };

    const removeFromCart = async (variantUniqueId) => {
        setCartItems(prev => prev.filter(item => item.variantUniqueId !== variantUniqueId));
        if (user) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('variant_id', variantUniqueId);
        }
    };

    const updateQuantity = async (variantUniqueId, change) => {
        const item = cartItems.find(i => i.variantUniqueId === variantUniqueId);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + change);

        setCartItems(prev => prev.map(i => i.variantUniqueId === variantUniqueId ? { ...i, quantity: newQty } : i));

        if (user) {
            await supabase
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('user_id', user.id)
                .eq('variant_id', variantUniqueId);
        }
    };

    const clearCart = async () => {
        setCartItems([]);
        if (user) {
            await supabase.from('cart_items').delete().eq('user_id', user.id);
        } else {
            localStorage.removeItem('cart');
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
