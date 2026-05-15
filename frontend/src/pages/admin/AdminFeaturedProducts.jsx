import React, { useState, useEffect, useCallback } from 'react';
import {
    Star, Search, X, Save, Loader, CheckCircle,
    Package, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';

const DEFAULT_SLOTS = 8;
const CAMPAIGN_SLOTS = 5;

const emptySlots = (count) =>
    Array.from({ length: count }, (_, i) => ({
        slot_order: i + 1,
        product_id: null,
        product: null,
    }));

/**
 * @component AdminFeaturedProducts
 * @description Panel de administración para gestionar los slots del carousel
 * de productos destacados en la home. Permite asignar/quitar productos por slot
 * y configurar la frecuencia de rotación global.
 */
export default function AdminFeaturedProducts({ campaignId = null }) {
    const totalSlots = campaignId ? CAMPAIGN_SLOTS : DEFAULT_SLOTS;
    const [slots, setSlots] = useState(() => emptySlots(totalSlots));
    const [rotation, setRotation] = useState('weekly');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState(null);

    // Buscador
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);

    // ── Carga inicial ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetchCurrentSlots();
    }, [campaignId]);

    const fetchCurrentSlots = async () => {
        try {
            setLoading(true);
            const params = campaignId ? { campaign_id: campaignId } : {};
            const response = await api.get('/featured-products', { params });
            const data = response.data;

            const built = emptySlots(totalSlots);
            data.forEach((item) => {
                const idx = (item.slot_order ?? 1) - 1;
                if (idx >= 0 && idx < totalSlots && item.id) {
                    built[idx] = {
                        slot_order: item.slot_order ?? idx + 1,
                        product_id: item.id,
                        product: {
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            image_url: item.image_url,
                        },
                    };
                }
            });
            setSlots(built);

            const withRotation = data.find((r) => r.rotation);
            if (withRotation) setRotation(withRotation.rotation);
        } catch (error) {
            console.error('Error cargando slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            setIsSearching(true);
            const response = await api.get('/products', { params: { search: query, limit: 10 } });
            const products = Array.isArray(response.data)
                ? response.data
                : response.data.products ?? [];
            setSearchResults(products.slice(0, 10));
        } catch (error) {
            console.error('Error buscando productos:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const assignProduct = (product) => {
        if (activeSlot === null) return;
        setSlots((prev) =>
            prev.map((s) =>
                s.slot_order === activeSlot
                    ? { ...s, product_id: product.id, product }
                    : s
            )
        );
        setActiveSlot(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeProduct = (slotOrder) => {
        setSlots((prev) =>
            prev.map((s) =>
                s.slot_order === slotOrder
                    ? { ...s, product_id: null, product: null }
                    : s
            )
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveResult(null);
        try {
            await api.put('/featured-products/slots', {
                slots: slots.map((s) => ({
                    slot_order: s.slot_order,
                    product_id: s.product_id || null,
                })),
                rotation,
                campaign_id: campaignId,
            });
            setSaveResult({ success: true, msg: 'Configuración guardada correctamente.' });
            setTimeout(() => setSaveResult(null), 4000);
        } catch (error) {
            console.error('Error guardando slots:', error);
            const msg = error.response?.data?.error || error.response?.data?.details || 'Error al guardar la configuración.';
            setSaveResult({ success: false, msg });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Helpers de imagen ──────────────────────────────────────────────────────
    const getImageSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
        return `${base}${url}`;
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Loader className="spin" size={40} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container" style={{ padding: '2rem' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Star size={28} style={{ color: '#facc15' }} />
                        {campaignId ? 'Slots de Campaña' : 'Productos Destacados'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                        {campaignId ? `Gestiona los ${totalSlots} slots de esta campaña.` : `Gestiona los ${totalSlots} slots del carousel global.`}
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem', borderRadius: '12px', fontSize: '0.95rem' }}
                >
                    {isSaving ? <Loader className="spin" size={18} /> : <Save size={18} />}
                    Guardar Configuración
                </button>
            </div>

            {/* ── Feedback de guardado ── */}
            <AnimatePresence>
                {saveResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            background: saveResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: saveResult.success ? '#22c55e' : '#ef4444',
                            border: `1px solid ${saveResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            marginBottom: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                        }}
                    >
                        {saveResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {saveResult.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Rotación global ── */}
            <div
                className="bg-secondary"
                style={{
                    padding: '1.5rem 2rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    flexWrap: 'wrap',
                }}
            >
                <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>Frecuencia de rotación:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: rotation === 'daily' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    <input
                        type="radio"
                        name="rotation"
                        value="daily"
                        checked={rotation === 'daily'}
                        onChange={() => setRotation('daily')}
                        style={{ accentColor: '#facc15' }}
                    />
                    Diaria
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: rotation === 'weekly' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    <input
                        type="radio"
                        name="rotation"
                        value="weekly"
                        checked={rotation === 'weekly'}
                        onChange={() => setRotation('weekly')}
                        style={{ accentColor: '#facc15' }}
                    />
                    Semanal
                </label>
            </div>

            {/* ── Buscador (visible cuando hay un slot activo) ── */}
            <AnimatePresence>
                {activeSlot !== null && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '2rem' }}
                    >
                        <div
                            className="bg-secondary"
                            style={{
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(250,204,21,0.3)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: '700', color: '#facc15', fontSize: '0.9rem' }}>
                                    Asignando producto al Slot #{activeSlot}
                                </span>
                                <button
                                    onClick={() => { setActiveSlot(null); setSearchQuery(''); setSearchResults([]); }}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Input de búsqueda */}
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar producto por nombre..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                    className="input-field"
                                    style={{ paddingLeft: '2.75rem', width: '100%', boxSizing: 'border-box' }}
                                />
                                {isSearching && (
                                    <Loader size={16} className="spin" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                )}
                            </div>

                            {/* Resultados */}
                            {searchResults.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => assignProduct(product)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem 1rem',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'background 0.15s',
                                                color: '#fff',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(250,204,21,0.08)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        >
                                            {product.image_url ? (
                                                <img
                                                    src={getImageSrc(product.image_url)}
                                                    alt={product.title}
                                                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                                />
                                            ) : (
                                                <div style={{ width: '44px', height: '44px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Package size={18} style={{ color: '#666' }} />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    {product.price != null ? `$${Number(product.price).toFixed(2)}` : '—'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchQuery && !isSearching && searchResults.length === 0 && (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                                    No se encontraron productos para "{searchQuery}"
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Grid de slots ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {slots.map((slot) => (
                    <SlotCard
                        key={slot.slot_order}
                        slot={slot}
                        isActive={activeSlot === slot.slot_order}
                        onAssign={() => {
                            setActiveSlot(slot.slot_order);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                        onRemove={() => removeProduct(slot.slot_order)}
                        getImageSrc={getImageSrc}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ── Sub-componente: tarjeta de slot ───────────────────────────────────────────
function SlotCard({ slot, isActive, onAssign, onRemove, getImageSrc }) {
    const hasProduct = slot.product !== null;

    return (
        <motion.div
            layout
            style={{
                borderRadius: '20px',
                border: isActive
                    ? '2px solid rgba(250,204,21,0.6)'
                    : hasProduct
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px dashed rgba(255,255,255,0.15)',
                background: hasProduct ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
            }}
        >
            {/* Número de slot */}
            <div style={{
                padding: '0.6rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                    SLOT {slot.slot_order}
                </span>
                {hasProduct && (
                    <span style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: '700' }}>● ASIGNADO</span>
                )}
            </div>

            {hasProduct ? (
                /* ── Slot con producto ── */
                <div>
                    <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                        {slot.product.image_url ? (
                            <img
                                src={getImageSrc(slot.product.image_url)}
                                alt={slot.product.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={32} style={{ color: '#444' }} />
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {slot.product.title}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                            {slot.product.price != null ? `$${Number(slot.product.price).toFixed(2)}` : '—'}
                        </p>
                        <button
                            onClick={onRemove}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '8px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                            }}
                        >
                            <X size={14} /> Quitar
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Slot vacío ── */
                <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Package size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Slot vacío</p>
                    <button
                        onClick={onAssign}
                        style={{
                            padding: '0.55rem 1.2rem',
                            background: isActive ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isActive ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.12)'}`,
                            borderRadius: '8px',
                            color: isActive ? '#facc15' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Search size={13} /> Asignar producto
                    </button>
                </div>
            )}
        </motion.div>
    );
}
