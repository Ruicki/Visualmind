import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { CreditCard, Loader, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../supabaseClient';

// Initialize Stripe (Replace with your actual Publishable Key)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Validate User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Please log in to complete your purchase.");

            // 2. Process Payment (Stripe)
            const cardElement = elements.getElement(CardElement);
            const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (stripeError) throw new Error(stripeError.message);

            console.log('[PaymentMethod]', paymentMethod);

            // 3. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total: getCartTotal(),
                    status: 'processing' // In a real app, this would be 'paid' after successful charge
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 4. Create Order Items
            // Map cart items to order_items structure
            const itemsToInsert = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // 5. Success
            await clearCart();
            navigate('/profile');

        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred during checkout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                    {t('checkout.shipping')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="label-text">{t('checkout.name')}</label>
                        <input required className="input-field" type="text" />
                    </div>
                    <div>
                        <label className="label-text">{t('checkout.email')}</label>
                        <input required className="input-field" type="email" />
                    </div>
                    <div>
                        <label className="label-text">{t('checkout.address')}</label>
                        <input required className="input-field" type="text" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label-text">{t('checkout.city')}</label>
                            <input required className="input-field" type="text" />
                        </div>
                        <div>
                            <label className="label-text">Zip Code</label>
                            <input required className="input-field" type="text" />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                    {t('checkout.payment')}
                </h2>
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <Lock size={16} /> {t('common.secure_payment')}
                    </div>
                    <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                        <CardElement options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#9e2146',
                                },
                            },
                        }} />
                    </div>
                    {error && <div style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || loading}
                className="btn-primary"
                style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
            >
                {loading ? <Loader className="spin" /> : <CreditCard size={20} />}
                {loading ? t('common.processing') : t('checkout.btn_complete')}
            </button>
        </form>
    );
};

export default function Checkout() {
    const { cartItems, getCartTotal } = useCart();
    const { t } = useLanguage();

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>{t('checkout.title')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
                <Elements stripe={stripePromise}>
                    <CheckoutForm />
                </Elements>

                {/* Order Summary */}
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', height: 'fit-content', border: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{t('checkout.summary')}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {cartItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                                    <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.title} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.title}</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {item.selectedSize} - {item.selectedColor?.name || item.selectedColor}
                                    </p>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
                                </div>
                                <div style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800' }}>
                            <span>Total</span>
                            <span>${getCartTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .label-text {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .input-field {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-light);
                    padding: 1rem;
                    border-radius: 12px;
                    color: white;
                    width: 100%;
                    font-family: inherit;
                    outline: none;
                }
                .input-field:focus {
                    border-color: var(--primary);
                }
            `}</style>
        </div>
    );
}
