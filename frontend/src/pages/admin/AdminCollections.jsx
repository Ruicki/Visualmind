import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Plus, Edit, Trash2, Layers, Image as ImageIcon, 
    Save, X, Loader 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getProductImage, compressImage } from '../../utils/imageUtils';

/**
 * @component AdminCollections
 * @description Gestión de colecciones de productos.
 * Permite agrupar productos bajo un concepto visual (ej: "Neon Genesis")
 * y subir imágenes de portada para cada colección.
 */
export default function AdminCollections() {
    const { t } = useLanguage();
    // --- Estados de Datos ---
    const [collections, setCollections] = useState([]); // Lista de colecciones registradas
    const [campaigns, setCampaigns] = useState([]); // Campañas disponibles para vincular
    const [loading, setLoading] = useState(true); // Estado de carga inicial
    
    // --- Control de UI y Guardado ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // --- Datos del Formulario ---
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        slug: '',
        description: '',
        description_long: '',
        image_url: '',
        is_active: true,
        template_type: 'editorial',
        campaign_id: '',
        image_file: null,
        accent_color: ''
    });

    useEffect(() => {
        fetchCollections();
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await api.get('/campaigns');
            setCampaigns(response.data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    /**
     * Recupera la lista de colecciones desde el servidor.
     */
    const fetchCollections = async () => {
        try {
            setLoading(true);
            const response = await api.get('/collections');
            setCollections(response.data || []);
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setFormData({
            id: null,
            name: '',
            slug: '',
            description: '',
            description_long: '',
            image_url: '',
            is_active: true,
            template_type: 'editorial',
            campaign_id: '',
            image_file: null,
            accent_color: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (collection) => {
        setFormData({
            ...collection,
            image_file: null,
            accent_color: collection.accent_color || '' // Convertir null a string vacío
        });
        console.log('[DEBUG] Editing collection with accent_color:', collection.accent_color);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta colección? Los productos que formen parte de ella perderán su vinculación.')) return;
        try {
            await api.delete(`/collections/${id}`);
            setCollections(collections.filter(c => c.id !== id));
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const collectionFormData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'image_file' && formData.image_file) {
                    collectionFormData.append('image', formData.image_file);
                } else if (key === 'campaign_id' && !formData.campaign_id) {
                    collectionFormData.append('campaign_id', '');
                } else if (key === 'accent_color') {
                    // Solo agregar accent_color si tiene un valor válido
                    if (formData.accent_color && formData.accent_color !== 'null' && formData.accent_color !== 'undefined') {
                        collectionFormData.append('accent_color', formData.accent_color);
                    }
                } else if (key !== 'image_file') {
                    collectionFormData.append(key, formData[key]);
                }
            });
            
            console.log('[DEBUG] Saving accent_color:', formData.accent_color);
            console.log('[DEBUG] FormData accent_color:', collectionFormData.get('accent_color'));

            // Enviar accent_color en query parameter para ambos casos (PUT y POST)
            const accentColorParam = formData.accent_color && formData.accent_color !== 'null' && formData.accent_color !== 'undefined' 
                ? `?accent_color=${encodeURIComponent(formData.accent_color)}` 
                : '';

            if (formData.id) {
                await api.put(`/collections/${formData.id}${accentColorParam}`, collectionFormData);
            } else {
                await api.post(`/collections${accentColorParam}`, collectionFormData);
            }
            setIsModalOpen(false);
            fetchCollections();
        } catch (error) {
            alert('Error al guardar: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1200 });
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_file: compressed, image_url: reader.result });
            };
            reader.readAsDataURL(compressed);
        } catch (error) {
            console.error("Compression error:", error);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Gestión de Colecciones
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Las colecciones agrupan categorías y productos por temáticas.</p>
                </div>
                <button onClick={handleAddNew} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Plus size={20} /> Nueva Colección
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', gridColumn: '1/-1' }}><Loader className="spin" size={40} /></div>
                ) : (
                    collections.map(collection => (
                        <motion.div 
                            key={collection.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ 
                                background: 'rgba(255,255,255,0.02)', 
                                borderRadius: '24px', 
                                border: `1px solid ${collection.is_active ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            <div style={{ height: '140px', background: '#222', position: 'relative', overflow: 'hidden' }}>
                                {collection.image_url ? (
                                    <img src={getProductImage(null, collection.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.4rem 0.8rem', borderRadius: '100px', 
                                        background: collection.is_active ? '#22c55e' : '#333', 
                                        color: 'white', fontSize: '0.7rem', fontWeight: '800', backdropFilter: 'blur(10px)'
                                    }}>
                                        {collection.is_active ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {collection.accent_color && <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: collection.accent_color, display: 'inline-block' }} />}
                                        {collection.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(collection)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(collection.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {collection.description || 'Sin descripción.'}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-secondary"
                            style={{ width: '100%', maxWidth: '600px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{formData.id ? 'Editar Colección' : 'Nueva Colección'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            <div style={{ padding: '2rem', overflowY: 'auto' }}>
                                <form id="collection-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="label-text">Nombre de la Colección</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} className="input-field" placeholder="Ej: Dragon Ball Z" />
                                    </div>

                                    <div className="form-group">
                                        <label className="label-text">Descripción Corta</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Breve descripción para la tarjeta de colección." />
                                    </div>

                                    <div className="form-group">
                                        <label className="label-text">Descripción Editorial (Home)</label>
                                        <textarea value={formData.description_long} onChange={e => setFormData({ ...formData, description_long: e.target.value })} className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} placeholder="Texto largo para la sección editorial del home. Ej: 'Cada diseño es una fusión de cultura pop...'" />
                                    </div>

                                    <div className="form-group">
                                        <label className="label-text">Imagen de Colección / Portada</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '80px', height: '45px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {formData.image_url && <img src={formData.image_url.startsWith('data:') ? formData.image_url : getProductImage(null, formData.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <input type="file" onChange={handleFileChange} accept="image/*" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span style={{ fontSize: '0.9rem' }}>Colección Activa y Visible</span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem', background: 'rgba(250,204,21,0.05)', borderRadius: '12px', border: '1px solid rgba(250,204,21,0.12)' }}>
                                        <div className="form-group">
                                            <label className="label-text">Tipo de Template <span style={{ color: '#facc15', fontSize: '0.7rem' }}>(home)</span></label>
                                            <select value={formData.template_type} onChange={e => setFormData({ ...formData, template_type: e.target.value })} className="input-field">
                                                <option value="editorial">Editorial (texto + imagen)</option>
                                                <option value="grid">Grid (cuadrícula)</option>
                                                <option value="hero">Hero (portada completa)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Vincular a Campaña <span style={{ color: '#facc15', fontSize: '0.7rem' }}>(opcional)</span></label>
                                            <select value={formData.campaign_id || ''} onChange={e => setFormData({ ...formData, campaign_id: e.target.value || '' })} className="input-field">
                                                <option value="">— Sin campaña —</option>
                                                {campaigns.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="label-text">Color de Acento <span style={{ color: '#facc15', fontSize: '0.7rem' }}>(gradientes home)</span></label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {['#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#facc15', '#f97316', '#ef4444', '#ec4899'].map(color => (
                                                    <button key={color} type="button" onClick={() => setFormData({ ...formData, accent_color: color })}
                                                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, border: formData.accent_color === color ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: formData.accent_color === color ? '2px solid #facc15' : 'none' }} />
                                                ))}
                                                <input type="color" value={formData.accent_color || '#a855f7'} onChange={e => setFormData({ ...formData, accent_color: e.target.value })}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
                                                {formData.accent_color && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formData.accent_color}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '12px' }}>Cancelar</button>
                                <button form="collection-form" type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: formData.accent_color || 'var(--primary)' }}>
                                    {isSaving ? <Loader className="spin" size={20} /> : <Save size={20} />}
                                    {isSaving ? 'Guardando...' : 'Guardar Colección'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
