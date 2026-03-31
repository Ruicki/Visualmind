import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings } from 'lucide-react';

export default function AdminLayout() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // AdminRoute ya garantiza que user existe y tiene role='admin'
    // Solo mostramos loading si user aún no está disponible
    if (!user) return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                <div className="loader spin"></div>
                <div>{t('admin.starting') || 'Cargando Panel...'}</div>
            </div>
        </div>
    );

    const navItems = [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: t('admin.dashboard') || 'Dashboard' },
        { path: '/admin/products', icon: <Package size={20} />, label: t('admin.products') || 'Productos' },
        { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: t('admin.orders') || 'Pedidos' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: t('admin.settings') || 'Ajustes' },
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
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{t('admin.title') || 'Visualmind Admin'}</span>
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

                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', borderRadius: '12px', transition: 'all 0.2s' }}>
                        🏠 {t('admin.go_home') || 'Volver a la Tienda'}
                    </Link>
                    <button
                        onClick={signOut}
                        style={{
                            width: '100%',
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
                        {t('admin.log_out') || 'Cerrar Sesión'}
                    </button>
                </div>
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{t('admin.overview') || 'Resumen'}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{t('admin.user_label') || 'Administrador'}</div>
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
