import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings } from 'lucide-react';

export default function AdminLayout() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    // Protect Route & Check Role
    React.useEffect(() => {
        const checkRole = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                // Check profile for admin role
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error || data?.role !== 'admin') {
                    console.log("Access denied: User is not admin");
                    setLoading(false);
                    // Do not redirect, show denied screen
                } else {
                    setIsAdmin(true);
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        checkRole();
    }, [user, navigate]);

    if (!user || loading) return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                <div className="loader spin"></div>
                <div>{t('admin.starting')}</div>
            </div>
        </div>
    );

    if (!isAdmin) return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div style={{ textAlign: 'center', padding: '2rem', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333' }}>
                <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>{t('admin.access_denied')}</h1>
                <p style={{ marginBottom: '2rem', color: '#888' }}>{t('admin.denied_msg')}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/" style={{ padding: '0.8rem 1.5rem', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>
                        {t('admin.go_home')}
                    </Link>
                    <button onClick={signOut} style={{ padding: '0.8rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        {t('admin.log_out')}
                    </button>
                </div>
            </div>
        </div>
    );

    const navItems = [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: t('admin.dashboard') },
        { path: '/admin/products', icon: <Package size={20} />, label: t('admin.products') },
        { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: t('admin.orders') },
        { path: '/admin/settings', icon: <Settings size={20} />, label: t('admin.settings') },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
            {/* Sidebar */}
            <div style={{
                width: '260px',
                borderRight: '1px solid var(--border-light)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '8px' }} />
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{t('admin.title')}</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'white' : 'var(--text-secondary)',
                                background: location.pathname === item.path ? 'rgba(255,255,255,0.05)' : 'transparent',
                                transition: 'all 0.2s',
                                fontWeight: '600'
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <button
                    onClick={signOut}
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#ff4d4d',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    <LogOut size={20} />
                    {t('admin.log_out')}
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <header style={{
                    height: '80px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 3rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{t('admin.overview')}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{t('admin.user_label')}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }} />
                    </div>
                </header>

                <div style={{ padding: '3rem' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
