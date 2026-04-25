import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle, Loader, RefreshCw } from 'lucide-react';

// Categorías predefinidas del sistema (siempre presentes)
const SYSTEM_CATEGORIES = [
    { value: 'anime', label: 'Anime', icon: '🎌', desc: 'Productos de anime y manga' },
    { value: 'caricaturas', label: 'Caricaturas / Cartoons', icon: '📺', desc: 'Personajes animados occidentales' },
    { value: 'videojuegos', label: 'Videojuegos', icon: '🎮', desc: 'Gaming y e-sports' },
    { value: 'deportes', label: 'Deportes', icon: '⚽', desc: 'Equipos y atletas' },
    { value: 'san_valentin', label: 'San Valentín', icon: '❤️', desc: 'Colección de amor y San Valentín' },
    { value: 'halloween', label: 'Halloween', icon: '🎃', desc: 'Terror y Halloween' },
    { value: 'fiestas_patrias', label: 'Fiestas Patrias', icon: '🇨🇱', desc: 'Celebraciones nacionales' },
    { value: 'streetwear', label: 'Streetwear', icon: '🧢', desc: 'Moda urbana y callejera' },
    { value: 'ropa', label: 'Ropa General', icon: '👕', desc: 'Ropa sin categoría específica' },
    { value: 'accesorios', label: 'Accesorios', icon: '🧣', desc: 'Gorras, medias, bolsos y más' },
];

export default function AdminCategories() {
    const [dbCategories, setDbCategories] = useState([]);
    const [productCounts, setProductCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [newCat, setNewCat] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catsRes, productsRes] = await Promise.all([
                api.get('/products/categories'),
                api.get('/products/admin')
            ]);

            const dbCats = catsRes.data || [];
            setDbCategories(dbCats);

            // Contar productos por categoría
            const counts = {};
            (productsRes.data || []).forEach(p => {
                if (p.category) {
                    counts[p.category] = (counts[p.category] || 0) + 1;
                }
            });
            setProductCounts(counts);
        } catch (e) {
            console.error('Error loading categories:', e);
            setFeedback({ type: 'error', msg: 'Error al cargar datos.' });
        } finally {
            setLoading(false);
        }
    };

    const showFeedback = (type, msg) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    // Las categorías "extra" son las que están en la DB pero no en el sistema
    const extraCategories = dbCategories.filter(
        c => !SYSTEM_CATEGORIES.find(s => s.value === c)
    );

    // Todas las categorías que aparecen en productos (para conteo correcto)
    const allKnownCats = [...new Set([
        ...SYSTEM_CATEGORIES.map(c => c.value),
        ...dbCategories
    ])];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{
                        fontSize: '2rem', fontWeight: '800',
                        background: 'linear-gradient(to right, #fff, #888)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Gestión de Categorías
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Categorías del sistema y personalizadas para clasificar productos.
                    </p>
                </div>
                <button onClick={loadData} style={{
                    padding: '0.7rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.85rem'
                }}>
                    <RefreshCw size={16} /> Recargar
                </button>
            </div>

            {/* Feedback */}
            {feedback && (
                <div style={{
                    marginBottom: '1.5rem', padding: '1rem 1.5rem', borderRadius: '12px',
                    background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${feedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: feedback.type === 'success' ? '#22c55e' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '600'
                }}>
                    {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {feedback.msg}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <Loader className="spin" size={40} style={{ color: 'var(--primary)' }} />
                </div>
            ) : (
                <>
                    {/* Resumen */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                        {[
                            { label: 'Sistema', count: SYSTEM_CATEGORIES.length, color: '#3b82f6' },
                            { label: 'En uso (DB)', count: dbCategories.length, color: '#22c55e' },
                            { label: 'Personalizadas', count: extraCategories.length, color: '#f59e0b' },
                            { label: 'Total productos', count: Object.values(productCounts).reduce((a, b) => a + b, 0), color: '#a78bfa' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                padding: '1.2rem', borderRadius: '16px',
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stat.color }}>{stat.count}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Categorías del Sistema */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.2rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Tag size={18} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Categorías del Sistema</h3>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.3rem 0.8rem', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', borderRadius: '100px', fontWeight: '700' }}>
                                SISTEMA
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
                            {SYSTEM_CATEGORIES.map((cat, i) => (
                                <motion.div
                                    key={cat.value}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{
                                        padding: '1.2rem 1.8rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        borderRight: (i + 1) % 2 === 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                        display: 'flex', alignItems: 'center', gap: '1rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1.8rem' }}>{cat.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{cat.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cat.desc}</div>
                                        <code style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{cat.value}</code>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.3rem', color: (productCounts[cat.value] || 0) > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                                            {productCounts[cat.value] || 0}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>productos</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Categorías Extra (solo en DB) */}
                    {extraCategories.length > 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.03)', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
                            <div style={{ padding: '1.2rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Tag size={18} style={{ color: '#f59e0b' }} />
                                <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Categorías Personalizadas</h3>
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.3rem 0.8rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '100px', fontWeight: '700' }}>
                                    DB
                                </span>
                            </div>
                            {extraCategories.map(cat => (
                                <div key={cat} style={{
                                    padding: '1rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: 'flex', alignItems: 'center', gap: '1rem'
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700' }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                                        <code style={{ fontSize: '0.7rem', color: '#f59e0b', fontFamily: 'monospace' }}>{cat}</code>
                                    </div>
                                    <div style={{ fontWeight: '800', color: (productCounts[cat] || 0) > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                                        {productCounts[cat] || 0} productos
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info */}
                    <div style={{
                        padding: '1.5rem', borderRadius: '16px',
                        background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
                        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8'
                    }}>
                        <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>ℹ️ Cómo funcionan las categorías</strong>
                        Las <strong style={{ color: 'white' }}>categorías del sistema</strong> son predefinidas y siempre aparecen en el selector al crear/editar un producto.
                        Las <strong style={{ color: 'white' }}>categorías personalizadas</strong> provienen directamente de la base de datos (productos con categorías no listadas arriba).
                        Para añadir una nueva, ve a <strong style={{ color: 'white' }}>Productos → Nuevo Producto → Categoría → ✏️ Personalizado</strong>.
                    </div>
                </>
            )}
        </motion.div>
    );
}
