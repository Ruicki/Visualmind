import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Eye, CheckCircle, Clock, Truck, Loader } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminOrders() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders/all');
            setOrders(response.data);
        } catch (error) {
            console.error("Error al obtener órdenes:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error al actualizar estado:", error);
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
            case 'pending': return t('admin.filter_pending') || 'Pendiente';
            case 'shipped': return t('admin.filter_shipped') || 'Enviado';
            case 'delivered': return t('admin.filter_delivered') || 'Entregado';
            default: return status;
        }
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '2rem' }}>{t('admin.orders') || 'Pedidos'}</h2>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /></div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay pedidos registrados.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_id') || 'ID'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_customer') || 'Cliente'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_date') || 'Fecha'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_items') || 'Items'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_total') || 'Total'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.table_status') || 'Estado'}</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>{t('admin.table_action') || 'Acción'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const status = getStatusColor(order.status);
                                // Parse items if it's a string, or use directly if it's an object/array
                                const itemsCount = Array.isArray(order.items) ? order.items.length : (typeof order.items === 'string' ? JSON.parse(order.items).length : 0);
                                
                                return (
                                    <tr key={order.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>#{order.id.slice(0, 8)}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>{order.user_email}</td>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>{itemsCount} artículos</td>
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: 'bold' }}>${order.total}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <select 
                                                value={order.status} 
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                style={{
                                                    background: status.bg,
                                                    color: status.color,
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '100px',
                                                    fontSize: '0.8rem',
                                                    border: 'none',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="shipped">Enviado</option>
                                                <option value="delivered">Entregado</option>
                                            </select>
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
