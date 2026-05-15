import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Eye, CheckCircle, Clock, Truck, Loader } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * @component AdminOrders
 * @description Gestor de pedidos y cumplimiento (fulfillment).
 * Lista todas las transacciones realizadas, permite actualizar estados 
 * de envío y visualizar detalles específicos de cada orden.
 */
export default function AdminOrders() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    /**
     * @function fetchOrders
     * @description Obtiene la lista completa de pedidos desde la API.
     */
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

    /**
     * Actualiza el estado de un pedido en la base de datos.
     * @param {string} orderId - ID único del pedido.
     * @param {string} newStatus - Nuevo estado (pending, shipped, delivered).
     */
    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error al actualizar estado:", error);
        }
    };

    /**
     * Define los estilos visuales (colores e iconos) según el estado del pedido.
     */
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

    const viewDetails = (order) => setSelectedOrder(order);
    const closeDetails = () => setSelectedOrder(null);

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
                                            <button onClick={() => viewDetails(order)} style={{ background: 'none', border: '1px solid var(--border-light)', color: 'white', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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

            {selectedOrder && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '2rem'
                }} onClick={closeDetails}>
                    <div style={{
                        background: 'var(--bg-secondary)', borderRadius: '24px',
                        padding: '2.5rem', maxWidth: '500px', width: '100%',
                        border: '1px solid var(--border-light)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                                Pedido #{selectedOrder.id.slice(0, 8)}
                            </h3>
                            <button onClick={closeDetails} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><strong>Cliente:</strong> {selectedOrder.user_email}</div>
                            <div><strong>Fecha:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                            <div><strong>Items:</strong> {
                                Array.isArray(selectedOrder.items)
                                    ? selectedOrder.items.length
                                    : (typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items).length : 0)
                            } artículos</div>
                            <div><strong>Total:</strong> ${selectedOrder.total}</div>
                            <div>
                                <strong>Estado:</strong>{' '}
                                <span style={{
                                    display: 'inline-block', padding: '0.2rem 0.8rem', borderRadius: '100px',
                                    fontSize: '0.85rem', fontWeight: '600',
                                    background: selectedOrder.status === 'pending' ? 'rgba(255,193,7,0.1)' :
                                        selectedOrder.status === 'shipped' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                                    color: selectedOrder.status === 'pending' ? '#ffc107' :
                                        selectedOrder.status === 'shipped' ? '#3b82f6' : '#10b981'
                                }}>
                                    {selectedOrder.status === 'pending' ? 'Pendiente' :
                                        selectedOrder.status === 'shipped' ? 'Enviado' : 'Entregado'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
