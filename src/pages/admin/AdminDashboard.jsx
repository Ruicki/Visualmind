import React from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDashboard() {
    const { t } = useLanguage();

    const stats = [
        { label: t('admin.stats_sales'), value: '$12,450', change: '+12%', icon: <DollarSign size={24} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.1)' },
        { label: t('admin.stats_orders'), value: '24', change: 'Processing', icon: <ShoppingBag size={24} color="#3b82f6" />, bg: 'rgba(59, 130, 246, 0.1)' },
        { label: t('admin.stats_customers'), value: '1,205', change: '+5 new', icon: <Users size={24} color="#8b5cf6" />, bg: 'rgba(139, 92, 246, 0.1)' },
        { label: t('admin.stats_rate'), value: '3.2%', change: '+0.4%', icon: <TrendingUp size={24} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.1)' },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{
                        background: 'var(--bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: '20px',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{stat.value}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>{t('admin.recent_orders')}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                                    <th style={{ paddingBottom: '1rem', color: 'white' }}>{t('admin.table_id')}</th>
                                    <th style={{ paddingBottom: '1rem', color: 'white' }}>{t('admin.table_customer')}</th>
                                    <th style={{ paddingBottom: '1rem', color: 'white' }}>{t('admin.table_date')}</th>
                                    <th style={{ paddingBottom: '1rem', color: 'white' }}>{t('admin.table_status')}</th>
                                    <th style={{ paddingBottom: '1rem', color: 'white' }}>{t('admin.table_total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1001, 1002, 1003, 1004].map(id => (
                                    <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1rem 0', color: 'var(--primary)' }}>#{id}</td>
                                        <td style={{ padding: '1rem 0' }}>John Doe</td>
                                        <td style={{ padding: '1rem 0' }}>Dec 28, 2025</td>
                                        <td style={{ padding: '1rem 0' }}>
                                            <span style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '0.8rem' }}>{t('admin.filter_pending')}</span>
                                        </td>
                                        <td style={{ padding: '1rem 0', color: 'white' }}>$120.00</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>{t('admin.low_stock')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {['Anime T-Shirt', 'Gojo Hoodie', 'Luffy Cap'].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '50px', height: '50px', background: '#333', borderRadius: '12px' }} />
                                <div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>{item}</div>
                                    <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{t('admin.stock_left').replace('{{count}}', 3)}</div>
                                    <div style={{ width: '100%', height: '4px', background: '#333', marginTop: '0.5rem', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: '10%', height: '100%', background: '#ef4444' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
