import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, TrendingUp, Loader, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axiosConfig';
import { getProductImage } from '../../utils/imageUtils';

/**
 * @component AdminDashboard
 * @description Centro de control principal para administradores.
 * Visualiza métricas clave del negocio (ventas, pedidos, usuarios)
 * mediante tarjetas de resumen y gráficos comparativos.
 */
export default function AdminDashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Efecto para cargar los datos estadísticos del dashboard al montar el componente.
     * Consulta el endpoint '/admin/stats' que devuelve ventas, pedidos, usuarios y alertas.
     */
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/admin/stats');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader className="spin" size={40} style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    /**
     * Definición de las tarjetas de métricas principales.
     * Cada objeto contiene la etiqueta, valor formateado, cambio porcentual y estilo visual.
     */
    const stats = [
        { 
            label: t('admin.stats_sales'), 
            value: `$${data?.stats?.totalSales?.toLocaleString() || '0'}`, 
            change: data?.stats?.growth || '+12.5%', 
            trend: 'up',
            icon: <DollarSign size={24} />, 
            color: '#10b981'
        },
        { 
            label: t('admin.stats_orders'), 
            value: data?.stats?.totalOrders || '0', 
            change: '+5.2%', 
            trend: 'up',
            icon: <ShoppingBag size={24} />, 
            color: '#3b82f6'
        },
        { 
            label: t('admin.stats_customers'), 
            value: data?.stats?.totalCustomers || '0', 
            change: '+2.4%', 
            trend: 'up',
            icon: <Users size={24} />, 
            color: '#8b5cf6'
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="premium-card" style={{
                        background: 'var(--bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: '24px',
                        border: '1px solid var(--border-light)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0 }}>{stat.value}</h3>
                            </div>
                            <div style={{ 
                                padding: '0.8rem', 
                                borderRadius: '16px', 
                                background: `${stat.color}15`, 
                                color: stat.color 
                            }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                            <span style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: stat.trend === 'up' ? '#10b981' : '#ef4444',
                                fontWeight: '600'
                            }}>
                                {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {stat.change}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{t('admin.vs_previous') || 'vs mes anterior'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Sales Chart */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{t('admin.sales_analysis') || 'Análisis de Ventas'}</h3>
                        <select className="premium-input" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                            <option>{t('admin.last_7_days') || 'Últimos 7 días'}</option>
                            <option>{t('admin.last_30_days') || 'Últimos 30 días'}</option>
                        </select>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.weeklySales || []}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip 
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="var(--primary)" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorSales)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Sellers */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>{t('admin.top_sellers') || 'Productos Más Vendidos'}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {data?.topSellers?.length > 0 ? data.topSellers.map((product, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '10px', 
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    color: i === 0 ? 'var(--primary)' : 'white'
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>{product.title}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.items_sold} {t('admin.items_sold') || 'vendidos'}</p>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                    {Math.round((product.items_sold / (data.topSellers[0].items_sold || 1)) * 100)}%
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>{t('admin.no_sales') || 'Sin registros de ventas aún'}</p>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Recent Orders */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{t('admin.recent_orders') || 'Pedidos Recientes'}</h3>
                        <button onClick={() => navigate('/admin/orders')} className="premium-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>{t('admin.view_all') || 'Ver Todos'}</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                                {data?.recentOrders?.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '1.2rem 0', color: 'var(--primary)', fontWeight: '600' }}>#{order.id.substring(0, 8)}</td>
                                        <td style={{ padding: '1.2rem 0', color: 'white' }}>{order.customer_name || order.customer_email}</td>
                                        <td style={{ padding: '1.2rem 0' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1.2rem 0' }}>
                                            <span style={{ 
                                                background: order.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                                color: order.status === 'paid' ? '#10b981' : '#f59e0b', 
                                                padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem 0', color: 'white', fontWeight: '700' }}>${order.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{t('admin.low_stock')}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {data?.lowStock?.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                    <img src={getProductImage(null, item.image_url)} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{item.title}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                        <span style={{ color: item.stock === 0 ? '#ef4444' : '#f59e0b', fontSize: '0.8rem', fontWeight: '600' }}>
                                            {item.stock} {t('admin.stock_units') || 'en stock'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('admin.critical_stock') || 'Stock crítico'}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#333', marginTop: '0.6rem', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.max(5, (item.stock / 10) * 100)}%`, height: '100%', background: item.stock === 0 ? '#ef4444' : '#f59e0b' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
