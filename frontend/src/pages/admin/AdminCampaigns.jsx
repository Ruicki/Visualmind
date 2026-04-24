import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Plus, Edit, Trash2, Calendar, Layout, Palette, 
    Image as ImageIcon, Save, X, Loader, CheckCircle, 
    Clock, Zap, ExternalLink 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getProductImage, compressImage } from '../../utils/imageUtils';

export default function AdminCampaigns() {
    const { t } = useLanguage();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        slug: '',
        description: '',
        banner_url: '',
        accent_color: '#ff4d4d',
        template_type: 'grid',
        start_date: '',
        end_date: '',
        is_active: true,
        countdown_enabled: false,
        image_file: null
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/campaigns');
            setCampaigns(response.data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
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
            banner_url: '',
            accent_color: '#ff4d4d',
            template_type: 'grid',
            start_date: '',
            end_date: '',
            is_active: true,
            countdown_enabled: false
        });
        setIsModalOpen(true);
    };

    const handleEdit = (campaign) => {
        setFormData({
            ...campaign,
            start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
            end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta campaña? Los productos asociados perderán su vinculación.')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const campaignFormData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'image_file' && formData.image_file) {
                    campaignFormData.append('image', formData.image_file);
                } else if (key !== 'image_file') {
                    campaignFormData.append(key, formData[key]);
                }
            });

            if (formData.id) {
                await api.put(`/campaigns/${formData.id}`, campaignFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/campaigns', campaignFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchCampaigns();
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
            const compressed = await compressImage(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920 });
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_file: compressed, banner_url: reader.result });
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
                        {t('admin.manage_campaigns') || 'Gestión de Campañas'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Controla el ambiente visual y drops de temporada.</p>
                </div>
                <button onClick={handleAddNew} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Plus size={20} /> Nueva Campaña
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', gridColumn: '1/-1' }}><Loader className="spin" size={40} /></div>
                ) : (
                    campaigns.map(campaign => (
                        <motion.div 
                            key={campaign.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ 
                                background: 'rgba(255,255,255,0.02)', 
                                borderRadius: '24px', 
                                border: `1px solid ${campaign.is_active ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {/* Banner Preview */}
                            <div style={{ height: '140px', background: campaign.accent_color, position: 'relative', overflow: 'hidden' }}>
                                {campaign.banner_url ? (
                                    <img src={getProductImage(null, campaign.banner_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.4rem 0.8rem', borderRadius: '100px', 
                                        background: campaign.is_active ? '#22c55e' : '#333', 
                                        color: 'white', fontSize: '0.7rem', fontWeight: '800', backdropFilter: 'blur(10px)'
                                    }}>
                                        {campaign.is_active ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{campaign.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(campaign)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(campaign.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {campaign.description || 'Sin descripción.'}
                                </p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Layout size={12} /> {campaign.template_type.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Palette size={12} /> {campaign.accent_color}
                                    </div>
                                    {campaign.end_date && (
                                        <div style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={12} /> Termina: {new Date(campaign.end_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
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
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{formData.id ? 'Editar Campaña' : 'Nueva Campaña'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            <div style={{ padding: '2rem', overflowY: 'auto' }}>
                                <form id="campaign-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="label-text">Nombre de la Campaña</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} className="input-field" placeholder="Ej: Black Friday 2024" />
                                    </div>

                                    <div className="form-group">
                                        <label className="label-text">Descripción</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="label-text">Color de Acento</label>
                                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                                <input type="color" value={formData.accent_color} onChange={e => setFormData({ ...formData, accent_color: e.target.value })} style={{ width: '45px', height: '45px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer' }} />
                                                <input type="text" value={formData.accent_color} onChange={e => setFormData({ ...formData, accent_color: e.target.value })} className="input-field" style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Plantilla</label>
                                            <select value={formData.template_type} onChange={e => setFormData({ ...formData, template_type: e.target.value })} className="custom-select">
                                                <option value="grid">Estándar (Grid)</option>
                                                <option value="editorial">Editorial (Grandes Imágenes)</option>
                                                <option value="masonry">Mosaico (Orgánico)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="label-text">Banner de Campaña</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '80px', height: '45px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {formData.banner_url && <img src={formData.banner_url.startsWith('data:') ? formData.banner_url : getProductImage(null, formData.banner_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <input type="file" onChange={handleFileChange} accept="image/*" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>O ingresa URL abajo:</p>
                                            </div>
                                        </div>
                                        <input type="text" value={formData.banner_url} onChange={e => setFormData({ ...formData, banner_url: e.target.value })} className="input-field" placeholder="https://..." style={{ marginTop: '0.5rem' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="label-text">Fecha Inicio</label>
                                            <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Fecha Fin</label>
                                            <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span style={{ fontSize: '0.9rem' }}>Campaña Activa</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.countdown_enabled} onChange={e => setFormData({ ...formData, countdown_enabled: e.target.checked })} />
                                            <span style={{ fontSize: '0.9rem' }}>Habilitar Contador</span>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '12px' }}>Cancelar</button>
                                <button form="campaign-form" type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                                    {isSaving ? <Loader className="spin" size={20} /> : <Save size={20} />}
                                    {isSaving ? 'Guardando...' : 'Guardar Campaña'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
