import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, CheckCircle, Clock, Truck, Loader } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminOrders() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock data for now until we have real orders
    const mockOrders = [
        { id: 1001, customer: 'Ricardo User', date: '2025-12-28', total: 120, status: 'pending', items: 3 },
        { id: 1002, customer: 'Jane Doe', date: '2025-12-27', total: 45, status: 'shipped', items: 1 },
    ];

    useEffect(() => {
        // In the future: fetchOrders();
        setOrders(mockOrders);
        setLoading(false);
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return { bg: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', icon: <Clock size={14} /> };
            case 'shipped': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: <Truck size={14} /> };
            case 'delivered': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: <CheckCircle size={14} /> };
            default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white', icon: null };
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return t('admin.filter_pending');
            case 'shipped': return t('admin.filter_shipped');
            case 'delivered': return t('admin.filter_delivered');
            default: return status;
        }
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '2rem' }}>{t('admin.orders')}</h2>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_id')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_customer')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_date')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_items')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_total')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_status')}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>{t('admin.table_action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const status = getStatusColor(order.status);
                                return (
                                    <tr key={order.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>#{order.id}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>{order.customer}</td>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{order.date}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>{order.items} items</td>
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: 'bold' }}>${order.total}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <span style={{
                                                background: status.bg,
                                                color: status.color,
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '100px',
                                                fontSize: '0.8rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                textTransform: 'capitalize'
                                            }}>
                                                {status.icon} {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                            <button style={{ background: 'none', border: '1px solid var(--border-light)', color: 'white', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
