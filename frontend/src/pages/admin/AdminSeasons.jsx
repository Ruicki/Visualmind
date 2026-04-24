import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Plus, Edit, Trash2, Calendar, Info, X, Save, Loader, AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Gestión de Temporadas (Seasons)
 */
export default function AdminSeasons() {
    const { t } = useLanguage();
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expireResult, setExpireResult] = useState(null);
    const [isExpiring, setIsExpiring] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: false
    });

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        try {
            setLoading(true);
            const response = await api.get('/seasons');
            setSeasons(response.data || []);
        } catch (error) {
            console.error('Error fetching seasons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (season) => {
        setFormData({
            id: season.id,
            name: season.name,
            description: season.description || '',
            start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : '',
            end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : '',
            is_active: season.is_active
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            id: null,
            name: '',
            description: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta temporada? Los productos asociados dejarán de estar vinculados.')) return;
        try {
            await api.delete(`/seasons/${id}`);
            setSeasons(seasons.filter(s => s.id !== id));
        } catch (error) {
            alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (formData.id) {
                await api.put(`/seasons/${formData.id}`, formData);
            } else {
                await api.post('/seasons', formData);
            }
            setIsModalOpen(false);
            fetchSeasons();
        } catch (error) {
            alert('Error al guardar: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleExpire = async () => {
        if (!window.confirm('¿Ejecutar expiración de temporadas? Los productos de temporadas finalizadas pasarán a estado "Legacy"')) return;
        setIsExpiring(true);
        setExpireResult(null);
        try {
            const res = await api.post('/admin/expire-seasons');
            setExpireResult({ success: true, msg: `${res.data.expiredCount} temporada(s) expirada(s). ${res.data.updatedProducts} producto(s) actualizados.` });
            fetchSeasons();
        } catch (err) {
            setExpireResult({ success: false, msg: err.response?.data?.error || 'Error al expirar' });
        } finally {
            setIsExpiring(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Temporadas
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Controla las campañas estacionales y la vigencia de lanzamientos.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={handleExpire} disabled={isExpiring} style={{ padding: '0.8rem 1.2rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,165,0,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                        {isExpiring ? <Loader className="spin" size={16} /> : <Zap size={16} />}
                        Ejecutar Expiración
                    </button>
                    <button onClick={handleAddNew} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Plus size={20} /> Nueva Temporada
                    </button>
                </div>
            </div>

            {/* Resultado de expiración */}
            {expireResult && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', borderRadius: '12px', background: expireResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${expireResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: expireResult.success ? '#22c55e' : '#ef4444', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {expireResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {expireResult.msg}
                </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><Loader className="spin" size={40} /></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Periodo</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Estado</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seasons.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay temporadas configuradas.</td>
                                    </tr>
                                ) : (
                                    seasons.map(season => (
                                        <tr key={season.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{season.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{season.description || 'Sin descripción'}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                                                    {new Date(season.start_date).toLocaleDateString()} - {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'Indefinido'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                {season.is_active ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        <CheckCircle2 size={16} /> Activa
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#666', fontSize: '0.85rem' }}>
                                                        <AlertCircle size={16} /> Inactiva
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                                    <button onClick={() => handleEdit(season)} className="icon-btn-blue"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(season.id)} className="icon-btn-red"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Temporada */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-secondary"
                            style={{ width: '100%', maxWidth: '500px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{formData.id ? 'Editar Temporada' : 'Nueva Temporada'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label-text">Nombre de la Temporada</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Ej: Verano 2024 - JJK" />
                                </div>

                                <div className="form-group">
                                    <label className="label-text">Descripción</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Detalles de la temporada..." />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label-text">Fecha Inicio</label>
                                        <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label className="label-text">Fecha Expiración (Opcional)</label>
                                        <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    style={{ 
                                        padding: '1.2rem', borderRadius: '16px', cursor: 'pointer',
                                        background: formData.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${formData.is_active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Temporada Activa</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Si está inactiva, no aparecerá en destacados.</div>
                                    </div>
                                    <div style={{ width: '40px', height: '20px', borderRadius: '20px', background: formData.is_active ? '#22c55e' : '#333', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '2px', left: formData.is_active ? '22px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                                        {isSaving ? <Loader className="spin" size={20} /> : <Save size={20} />}
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                    z-index: 2000; display: flex; alignItems: center; justifyContent: center; padding: 1.5rem;
                }
                .label-text { font-size: 0.8rem; font-weight: 600; color: #aaa; margin-bottom: 0.5rem; display: block; }
                .input-field { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; color: white; transition: all 0.3s; }
                .table-row-hover:hover { background: rgba(255,255,255,0.02); }
                .icon-btn-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
                .icon-btn-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
                .close-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
}
