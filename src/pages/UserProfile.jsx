import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Package, User, LogOut, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function UserProfile() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Fetch Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                setOrders(ordersData || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!user) return (
        <div className="container" style={{ paddingTop: '150px', textAlign: 'center', color: 'white' }}>
            <p>{t('profile.login_prompt')}</p>
            <Link to="/login" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>{t('profile.btn_login')}</Link>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{t('profile.title')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Profile Card */}
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {user.email[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{profile?.full_name || 'User'}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                            {profile?.role === 'admin' && (
                                <Link to="/admin" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block', textDecoration: 'none' }}>
                                    {t('profile.admin_access')} →
                                </Link>
                            )}
                        </div>
                    </div>
                    <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                        <LogOut size={18} /> {t('profile.sign_out')}
                    </button>
                </div>

                {/* Orders History */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={24} color="var(--primary)" /> {t('profile.history')}
                    </h2>

                    {loading ? (
                        <div>{t('profile.loading')}</div>
                    ) : orders.length === 0 ? (
                        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {t('profile.no_orders')}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map(order => (
                                <div key={order.id} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>{t('profile.order_prefix')}#{order.id.slice(0, 8)}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>${order.total}</div>
                                        <div style={{
                                            fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            background: order.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            color: order.status === 'delivered' ? '#10b981' : '#eab308'
                                        }}>
                                            {order.status === 'delivered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {order.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
