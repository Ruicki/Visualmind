import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { Package, User, LogOut, Clock, CheckCircle, XCircle, Loader, MapPin, Pencil, Trash2, Plus } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function UserProfile() {
    const { user, loading: authLoading, signOut } = useAuth();
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    // Profile form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text: string }
    const [profileLoading, setProfileLoading] = useState(false);

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [addrForm, setAddrForm] = useState({ full_name: '', address_line: '', city: '', province: '', postal_code: '', country: 'Panama' });
    const [editingAddrId, setEditingAddrId] = useState(null); // null = creating new, string = editing existing
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [addrMsg, setAddrMsg] = useState(null);
    const [addrLoading, setAddrLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Profile from local backend
                const profileRes = await api.get('/auth/me');
                setProfile(profileRes.data);
                setFullName(profileRes.data.full_name || '');
                setEmail(profileRes.data.email || '');

                // Fetch Orders from local backend
                const ordersRes = await api.get('/orders/my');
                setOrders(ordersRes.data || []);

                // Fetch Addresses
                const addrRes = await api.get('/addresses');
                setAddresses(addrRes.data || []);

            } catch (err) {
                console.error("Error al obtener datos del perfil:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            const res = await api.put('/auth/me', { full_name: fullName, email });
            setProfile(res.data);
            setProfileMsg({ type: 'success', text: t('profile.update_success') || 'Perfil actualizado correctamente.' });
        } catch (err) {
            const msg = err.response?.data?.message || t('profile.update_error') || 'Error al actualizar el perfil.';
            setProfileMsg({ type: 'error', text: msg });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleAddrSubmit = async (e) => {
        e.preventDefault();
        setAddrLoading(true);
        setAddrMsg(null);
        try {
            if (editingAddrId) {
                const res = await api.put(`/addresses/${editingAddrId}`, addrForm);
                setAddresses(prev => prev.map(a => a.id === editingAddrId ? res.data : a));
                setAddrMsg({ type: 'success', text: 'Dirección actualizada correctamente.' });
            } else {
                const res = await api.post('/addresses', addrForm);
                setAddresses(prev => [...prev, res.data]);
                setAddrMsg({ type: 'success', text: 'Dirección agregada correctamente.' });
            }
            setShowAddrForm(false);
            setEditingAddrId(null);
            setAddrForm({ full_name: '', address_line: '', city: '', province: '', postal_code: '', country: 'Panama' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar la dirección.';
            setAddrMsg({ type: 'error', text: msg });
        } finally {
            setAddrLoading(false);
        }
    };

    const handleAddrEdit = (addr) => {
        setEditingAddrId(addr.id);
        setAddrForm({
            full_name: addr.full_name || '',
            address_line: addr.address_line || '',
            city: addr.city || '',
            province: addr.province || '',
            postal_code: addr.postal_code || '',
            country: addr.country || 'Panama',
        });
        setShowAddrForm(true);
        setAddrMsg(null);
    };

    const handleAddrDelete = async (id) => {
        setAddrMsg(null);
        try {
            await api.delete(`/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al eliminar la dirección.';
            setAddrMsg({ type: 'error', text: msg });
        }
    };

    if (!authLoading && !user) return <Navigate to="/login" replace />;

    if (!user) return (
        <div className="container" style={{ paddingTop: '150px', textAlign: 'center', color: 'white' }}>
            <p>{t('profile.login_prompt') || "Inicia sesión para ver tu perfil."}</p>
            <Link to="/login" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>{t('profile.btn_login') || "Iniciar Sesión"}</Link>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{t('profile.title') || "Mi Perfil"}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Profile Card */}
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{profile?.full_name || 'Usuario'}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                            {profile?.role === 'admin' && (
                                <Link to="/admin" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block', textDecoration: 'none' }}>
                                    {t('profile.admin_access') || "Panel de Admin"} →
                                </Link>
                            )}
                        </div>
                    </div>
                    <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                        <LogOut size={18} /> {t('profile.sign_out') || "Cerrar Sesión"}
                    </button>
                </div>

                {/* Edit Profile Form */}
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} color="var(--primary)" /> {t('profile.edit_title') || "Editar Perfil"}
                    </h2>
                    <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {t('profile.full_name') || "Nombre completo"}
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {t('profile.email') || "Correo electrónico"}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        {profileMsg && (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: profileMsg.type === 'success' ? '#10b981' : '#ef4444' }}>
                                {profileMsg.text}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={profileLoading}
                            style={{ padding: '0.8rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: profileLoading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: profileLoading ? 0.7 : 1 }}
                        >
                            {profileLoading ? (t('profile.saving') || "Guardando...") : (t('profile.save') || "Guardar cambios")}
                        </button>
                    </form>
                </div>

                {/* Addresses Section */}
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <MapPin size={20} color="var(--primary)" /> Direcciones de Envío
                        </h2>
                        {!showAddrForm && (
                            <button
                                onClick={() => { setShowAddrForm(true); setEditingAddrId(null); setAddrForm({ full_name: '', address_line: '', city: '', province: '', postal_code: '', country: 'Panama' }); setAddrMsg(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                            >
                                <Plus size={15} /> Agregar dirección
                            </button>
                        )}
                    </div>

                    {addrMsg && (
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: addrMsg.type === 'success' ? '#10b981' : '#ef4444' }}>
                            {addrMsg.text}
                        </p>
                    )}

                    {addresses.length === 0 && !showAddrForm && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tienes direcciones guardadas.</p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {addresses.map(addr => (
                            <div key={addr.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{addr.full_name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    {addr.address_line}<br />
                                    {addr.city}{addr.province ? `, ${addr.province}` : ''}{addr.postal_code ? ` ${addr.postal_code}` : ''}<br />
                                    {addr.country}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    <button
                                        onClick={() => handleAddrEdit(addr)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                                    >
                                        <Pencil size={13} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleAddrDelete(addr.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}
                                    >
                                        <Trash2 size={13} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {showAddrForm && (
                        <form onSubmit={handleAddrSubmit} style={{ marginTop: addresses.length > 0 ? '1.5rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem', fontWeight: '600' }}>
                                {editingAddrId ? 'Editar dirección' : 'Nueva dirección'}
                            </h3>
                            {[
                                { key: 'full_name', label: 'Nombre completo', type: 'text' },
                                { key: 'address_line', label: 'Dirección', type: 'text' },
                                { key: 'city', label: 'Ciudad', type: 'text' },
                                { key: 'province', label: 'Provincia', type: 'text' },
                                { key: 'postal_code', label: 'Código postal', type: 'text' },
                                { key: 'country', label: 'País', type: 'text' },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</label>
                                    <input
                                        type={type}
                                        value={addrForm[key]}
                                        onChange={e => setAddrForm(prev => ({ ...prev, [key]: e.target.value }))}
                                        required={['full_name', 'address_line', 'city'].includes(key)}
                                        style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button
                                    type="submit"
                                    disabled={addrLoading}
                                    style={{ flex: 1, padding: '0.7rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: addrLoading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: addrLoading ? 0.7 : 1 }}
                                >
                                    {addrLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddrForm(false); setEditingAddrId(null); setAddrMsg(null); }}
                                    style={{ padding: '0.7rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Orders History */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={24} color="var(--primary)" /> {t('profile.history') || "Historial de Pedidos"}
                    </h2>

                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Loader className="spin" size={18} /> {t('profile.loading') || "Cargando..."}
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {t('profile.no_orders') || "Aún no tienes pedidos."}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map(order => (
                                <div key={order.id} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>{t('profile.order_prefix') || "Pedido "}#{order.id.slice(0, 8)}</div>
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
                                    {Array.isArray(order.items) && order.items.length > 0 && (
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-primary)' }}>
                                                        {item.title || item.name || 'Producto'} <span style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span>
                                                    </span>
                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                        ${item.price ?? item.price_at_purchase}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
