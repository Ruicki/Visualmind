import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Eye, Loader, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ORDER_STATUSES, getPaymentMethod } from '../../config/storeConfig';
import { getProductImage } from '../../utils/imageUtils';

/** Los pedidos antiguos pueden traer items/shipping como string JSON. */
const parseJson = (value, fallback) => {
    if (value == null) return fallback;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return fallback; }
};

const money = (n) => `$${(parseFloat(n) || 0).toFixed(2)}`;

/**
 * @component AdminOrders
 * @description Gestor de pedidos y cumplimiento (fulfillment).
 * Flujo con pago manual: Pendiente de pago → Pagado → Enviado → Entregado (o Cancelado).
 * Al cancelar, el servidor devuelve el stock automáticamente.
 */
export default function AdminOrders() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);

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
        } catch (err) {
            console.error("Error al obtener órdenes:", err);
            setError('No se pudieron cargar los pedidos.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Actualiza el estado de un pedido en la base de datos.
     * Pide confirmación al cancelar porque la acción no se puede deshacer.
     */
    const updateStatus = async (orderId, newStatus) => {
        if (newStatus === 'cancelled' && !window.confirm('¿Cancelar este pedido? El stock se devolverá y no se podrá reabrir.')) {
            return;
        }
        setError(null);
        try {
            const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: data.status } : o));
            setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: data.status } : prev);
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            setError(err.response?.data?.message || 'No se pudo actualizar el estado.');
        }
    };

    const visibleOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const countBy = (status) => orders.filter(o => o.status === status).length;

    const thStyle = { padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' };

    const renderStatusSelect = (order) => {
        const status = ORDER_STATUSES[order.status] || { color: 'var(--text-primary)' };
        return (
            <select
                value={order.status}
                disabled={order.status === 'cancelled'}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                aria-label="Estado del pedido"
                style={{
                    background: 'var(--bg-primary)',
                    color: status.color,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    border: `1px solid ${status.color}`,
                    cursor: order.status === 'cancelled' ? 'not-allowed' : 'pointer'
                }}
            >
                {Object.entries(ORDER_STATUSES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
        );
    };

    const detail = selectedOrder && {
        items: parseJson(selectedOrder.items, []),
        shipping: parseJson(selectedOrder.shipping_details, {}),
        payment: getPaymentMethod(selectedOrder.payment_method),
    };
    const phoneDigits = detail?.shipping?.phone ? String(detail.shipping.phone).replace(/[^\d]/g, '') : '';
    // Números locales de Panamá (8 dígitos) → prefijo 507 para WhatsApp
    const waPhone = phoneDigits.length === 8 ? `507${phoneDigits}` : phoneDigits;

    return (
        <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('admin.orders') || 'Pedidos'}</h2>

            {/* Filtros por estado */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[['all', `Todos (${orders.length})`], ...Object.entries(ORDER_STATUSES).map(([k, v]) => [k, `${v.label} (${countBy(k)})`])].map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        style={{ padding: '0.45rem 1rem', borderRadius: '100px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border-light)', background: filter === value ? 'var(--primary)' : 'var(--bg-secondary)', color: filter === value ? 'white' : 'var(--text-primary)' }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && <div role="alert" style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflowX: 'auto', border: '1px solid var(--border-light)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /></div>
                ) : visibleOrders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay pedidos {filter !== 'all' ? 'con este estado' : 'registrados'}.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={thStyle}>{t('admin.table_id') || 'ID'}</th>
                                <th style={thStyle}>{t('admin.table_customer') || 'Cliente'}</th>
                                <th style={thStyle}>{t('admin.table_date') || 'Fecha'}</th>
                                <th style={thStyle}>Pago</th>
                                <th style={thStyle}>{t('admin.table_total') || 'Total'}</th>
                                <th style={thStyle}>{t('admin.table_status') || 'Estado'}</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>{t('admin.table_action') || 'Acción'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders.map(order => {
                                const shipping = parseJson(order.shipping_details, {});
                                return (
                                    <tr key={order.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <div>{shipping.name || order.user_email}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{shipping.phone || order.user_email}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem' }}>{getPaymentMethod(order.payment_method)?.label || '—'}</td>
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: 'bold' }}>{money(order.total)}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>{renderStatusSelect(order)}</td>
                                        <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                            <button onClick={() => setSelectedOrder(order)} aria-label="Ver detalle" style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-primary)', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    zIndex: 1000, padding: '1rem'
                }} onClick={() => setSelectedOrder(null)}>
                    <div style={{
                        background: 'var(--bg-secondary)', borderRadius: '24px',
                        padding: '2rem', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                        border: '1px solid var(--border-light)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                                Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                                {renderStatusSelect(selectedOrder)}
                            </div>

                            <section>
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Cliente y envío</h4>
                                <div style={{ fontWeight: 600 }}>{detail.shipping.name || '—'}</div>
                                <div>{detail.shipping.email || selectedOrder.user_email}</div>
                                {detail.shipping.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {detail.shipping.phone}
                                        {waPhone && (
                                            <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#25d366', fontSize: '0.85rem' }}>
                                                <MessageCircle size={14} /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                )}
                                <div>{[detail.shipping.address, detail.shipping.city, detail.shipping.zip].filter(Boolean).join(', ') || '—'}</div>
                                {detail.shipping.notes && <div style={{ color: 'var(--text-secondary)' }}>Nota: {detail.shipping.notes}</div>}
                            </section>

                            <section>
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Productos</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                    {detail.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                            <img
                                                src={getProductImage(item.product_id, item.image_url)}
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                                                alt=""
                                                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600 }}>{item.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {[item.size && `Talla ${item.size}`, (item.color?.name || item.color)].filter(Boolean).join(' · ')} × {item.quantity}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{money((parseFloat(item.price) || 0) * (item.quantity || 0))}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {selectedOrder.subtotal != null && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{money(selectedOrder.subtotal)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Envío</span><span>{money(selectedOrder.shipping_cost)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ITBMS</span><span>{money(selectedOrder.tax)}</span></div>
                                    </>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}><span>Total</span><span>{money(selectedOrder.total)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>Método de pago</span><span>{detail.payment?.label || '—'}</span></div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
