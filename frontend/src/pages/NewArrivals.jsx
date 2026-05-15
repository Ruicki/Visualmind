/**
 * @file NewArrivals.jsx
 * @description Página de Novedades conectada a datos reales.
 * Muestra eventos activos (campañas y temporadas) con sus productos asociados,
 * eventos próximos, countdowns dinámicos y manejo de errores con reintento.
 *
 * Feature: home-hero-products-redesign
 * Tasks: 12.1, 12.2, 12.4, 12.6, 12.7, 12.8
 */

import { useState, useEffect } from 'react';
import { Clock, Calendar, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../api/axiosConfig';
import ProductCard from '../components/ProductCard';
import { getTimeLeft } from '../utils/heroUtils';
import { getProductImage } from '../utils/imageUtils';
import SEO from '../components/SEO';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Devuelve entre 4 y 8 productos asociados a un evento.
 * Filtra por campaign_id o season_id; si no hay asociados usa los más recientes.
 *
 * @param {Object} event - Evento (campaña o temporada)
 * @param {Array}  allProducts - Todos los productos disponibles
 * @returns {Array} Productos a mostrar para este evento
 */
const getEventProducts = (event, allProducts) => {
    const associated = allProducts.filter(
        p => p.campaign_id === event.id || p.season_id === event.id
    );
    if (associated.length > 0) return associated.slice(0, 8);
    // Fallback: productos más recientes
    return allProducts.slice(0, 4);
};

/**
 * Formatea una fecha ISO a cadena legible en español.
 * @param {string} dateStr - Fecha ISO
 * @returns {string}
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function NewArrivals() {
    const [activeEvents, setActiveEvents]     = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [products, setProducts]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    /** { [eventId]: { days, hours, minutes, seconds } | null } */
    const [countdowns, setCountdowns]         = useState({});

    // ── Carga de datos ──────────────────────────────────────────────────────

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [activeRes, upcomingRes, productsRes] = await Promise.all([
                axiosInstance.get('/campaigns/active-all'),
                axiosInstance.get('/campaigns/upcoming'),
                axiosInstance.get('/products'),
            ]);

            const now = new Date();

            // Task 12.1 — eventos activos ordenados por start_date DESC
            // Task 12.4 — filtrar eventos expirados (is_active=true pero end_date < NOW)
            const rawActive = Array.isArray(activeRes.data) ? activeRes.data : [];
            const filtered = rawActive.filter(ev => {
                if (!ev.end_date) return true; // sin fecha de fin → siempre activo
                return new Date(ev.end_date) >= now;
            });
            // El backend ya ordena por prioridad (campaigns primero) y start_date DESC
            setActiveEvents(filtered);

            // Task 12.2 — eventos próximos
            const rawUpcoming = Array.isArray(upcomingRes.data) ? upcomingRes.data : [];
            setUpcomingEvents(rawUpcoming);

            const rawProducts = Array.isArray(productsRes.data) ? productsRes.data : [];
            setProducts(rawProducts);
        } catch (err) {
            console.error('[NewArrivals] Error al cargar datos:', err);
            setError('No se pudieron cargar los eventos. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Task 12.6 — Countdown dinámico por evento (actualizado cada segundo)
    useEffect(() => {
        const eventsWithCountdown = activeEvents.filter(ev => ev.end_date);
        if (eventsWithCountdown.length === 0) return;

        const tick = () => {
            const next = {};
            eventsWithCountdown.forEach(ev => {
                next[ev.id] = getTimeLeft(ev.end_date);
            });
            setCountdowns(next);
        };

        tick(); // valor inicial inmediato
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeEvents]);

    // ── Render: Loading ─────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{
                background: 'var(--bg-primary)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                color: 'var(--text-secondary)',
            }}>
                <SEO title="Novedades" description="Descubre las últimas campañas y temporadas de Visualmind." />
                <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>Cargando novedades…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ── Render: Error ───────────────────────────────────────────────────────

    if (error) {
        return (
            <div style={{
                background: 'var(--bg-primary)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                color: 'white',
                padding: '2rem',
                textAlign: 'center',
            }}>
                <SEO title="Novedades" description="Descubre las últimas campañas y temporadas de Visualmind." />
                <AlertCircle size={48} color="#ef4444" />
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '480px' }}>
                    {error}
                </p>
                {/* Task 12.8 — botón de reintento */}
                <button
                    onClick={fetchData}
                    style={{
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '100px',
                        padding: '0.75rem 2rem',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // ── Render: Contenido ───────────────────────────────────────────────────

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '120px', color: 'white' }}>
            <SEO
                title="Novedades"
                description="Descubre las últimas campañas y temporadas de Visualmind con sus productos exclusivos."
            />

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 6rem' }}>

                {/* ── Encabezado de página ─────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textAlign: 'center', marginBottom: '5rem' }}
                >
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                        fontWeight: '900',
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        textTransform: 'uppercase',
                        marginBottom: '1.5rem',
                    }}>
                        Novedades
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto' }}>
                        Campañas y temporadas activas con sus colecciones exclusivas.
                    </p>
                </motion.section>

                {/* ── Eventos Activos ──────────────────────────────────── */}
                {activeEvents.length > 0 && (
                    <section style={{ marginBottom: '6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', whiteSpace: 'nowrap' }}>
                                Eventos Activos
                            </h2>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)', opacity: 0.3 }} />
                            <span style={{
                                background: '#22c55e',
                                color: 'black',
                                fontSize: '0.7rem',
                                fontWeight: '900',
                                padding: '4px 12px',
                                borderRadius: '100px',
                                letterSpacing: '0.08em',
                                whiteSpace: 'nowrap',
                            }}>
                                {activeEvents.length} ACTIVO{activeEvents.length !== 1 ? 'S' : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
                            {activeEvents.map((event, idx) => {
                                const eventProducts = getEventProducts(event, products);
                                const countdown = countdowns[event.id];
                                const bannerUrl = getProductImage(null, event.banner_url);

                                return (
                                    <motion.article
                                        key={event.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '24px',
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        {/* Tarjeta: imagen + info */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'clamp(280px, 40%, 560px) 1fr',
                                            minHeight: '360px',
                                        }}
                                            className="event-card-grid"
                                        >
                                            {/* Imagen del banner */}
                                            <div style={{ position: 'relative', overflow: 'hidden', minHeight: '280px' }}>
                                                <img
                                                    src={bannerUrl}
                                                    alt={event.name}
                                                    onError={e => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to right, transparent 60%, var(--bg-secondary))',
                                                }} />
                                            </div>

                                            {/* Contenido del evento */}
                                            <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem' }}>
                                                {/* Badge ACTIVO */}
                                                <div>
                                                    <span style={{
                                                        background: '#22c55e',
                                                        color: 'black',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '900',
                                                        padding: '4px 12px',
                                                        borderRadius: '100px',
                                                        letterSpacing: '0.1em',
                                                    }}>
                                                        ACTIVO
                                                    </span>
                                                </div>

                                                <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: '900', lineHeight: 1.1, margin: 0 }}>
                                                    {event.name}
                                                </h3>

                                                {event.description && (
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Fechas */}
                                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                    {event.start_date && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                            <Calendar size={14} />
                                                            <span>Inicio: {formatDate(event.start_date)}</span>
                                                        </div>
                                                    )}
                                                    {event.end_date && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                            <Calendar size={14} />
                                                            <span>Fin: {formatDate(event.end_date)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Task 12.6 — Countdown dinámico */}
                                                {countdown && (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                                                            <Clock size={13} />
                                                            TIEMPO RESTANTE
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                            {[
                                                                { value: countdown.days,    label: 'días' },
                                                                { value: countdown.hours,   label: 'hrs' },
                                                                { value: countdown.minutes, label: 'min' },
                                                                { value: countdown.seconds, label: 'seg' },
                                                            ].map(({ value, label }) => (
                                                                <div key={label} style={{
                                                                    background: 'var(--bg-primary)',
                                                                    border: '1px solid var(--border-light)',
                                                                    borderRadius: '10px',
                                                                    padding: '0.6rem 0.9rem',
                                                                    textAlign: 'center',
                                                                    minWidth: '52px',
                                                                }}>
                                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', lineHeight: 1 }}>
                                                                        {String(value).padStart(2, '0')}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>
                                                                        {label}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CTA */}
                                                {event.button_link && (
                                                    <div>
                                                        <Link
                                                            to={event.button_link}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                background: event.accent_color || 'var(--primary)',
                                                                color: 'black',
                                                                padding: '0.65rem 1.5rem',
                                                                borderRadius: '100px',
                                                                fontWeight: '800',
                                                                fontSize: '0.85rem',
                                                                textDecoration: 'none',
                                                                letterSpacing: '0.05em',
                                                            }}
                                                        >
                                                            {event.button_text || 'Ver colección'}
                                                            <ArrowRight size={15} />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Task 12.7 — Productos asociados al evento */}
                                        {eventProducts.length > 0 && (
                                            <div style={{ padding: '2rem 2.5rem 2.5rem', borderTop: '1px solid var(--border-light)' }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                                                    PRODUCTOS DE ESTA COLECCIÓN
                                                </p>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                                    gap: '1.5rem',
                                                }}>
                                                    {eventProducts.map(product => (
                                                        <ProductCard key={product.id} {...product} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Separador ────────────────────────────────────────── */}
                {activeEvents.length > 0 && upcomingEvents.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        marginBottom: '4rem',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)', opacity: 0.3 }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
                            PRÓXIMAMENTE
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)', opacity: 0.3 }} />
                    </div>
                )}

                {/* ── Task 12.2 — Eventos Próximos ─────────────────────── */}
                {upcomingEvents.length > 0 && (
                    <section style={{ marginBottom: '4rem' }}>
                        {activeEvents.length === 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', whiteSpace: 'nowrap' }}>
                                    Próximamente
                                </h2>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)', opacity: 0.3 }} />
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '2rem',
                        }}>
                            {upcomingEvents.map((event, idx) => {
                                const bannerUrl = getProductImage(null, event.banner_url);
                                return (
                                    <motion.article
                                        key={event.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '20px',
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        {/* Banner */}
                                        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                                            <img
                                                src={bannerUrl}
                                                alt={event.name}
                                                onError={e => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                                            />
                                            {/* Badge PRÓXIMAMENTE */}
                                            <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                                                <span style={{
                                                    background: '#f59e0b',
                                                    color: 'black',
                                                    fontSize: '0.65rem',
                                                    fontWeight: '900',
                                                    padding: '4px 10px',
                                                    borderRadius: '100px',
                                                    letterSpacing: '0.1em',
                                                }}>
                                                    PRÓXIMAMENTE
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>
                                                {event.name}
                                            </h3>

                                            {event.description && (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                                                    {event.description}
                                                </p>
                                            )}

                                            {event.start_date && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: '700' }}>
                                                    <Calendar size={14} />
                                                    <span>Disponible el {formatDate(event.start_date)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Estado vacío ─────────────────────────────────────── */}
                {!loading && activeEvents.length === 0 && upcomingEvents.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)' }}
                    >
                        <p style={{ fontSize: '1.1rem' }}>No hay eventos activos ni próximos en este momento.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vuelve pronto para ver las novedades.</p>
                    </motion.div>
                )}
            </main>

            {/* Responsive: en mobile la tarjeta de evento apila imagen arriba y contenido abajo */}
            <style>{`
                @media (max-width: 768px) {
                    .event-card-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
