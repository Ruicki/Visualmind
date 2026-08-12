import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit, Trash2, Calendar, Layout, Palette, 
    Image as ImageIcon, Save, X, Loader, CheckCircle, 
    Clock, Zap, ExternalLink, Sparkles, ArrowRight, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { getProductImage } from '../../utils/imageUtils';
import { useLanguage } from '../../context/LanguageContext';
import { getTemplateComponent } from '../../components/HeroTemplate';

export default function AdminCampaigns({ onOpenCampaignSlots }) {
    const { t } = useLanguage();
    
    // --- Estados ---
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExpiring, setIsExpiring] = useState(false);
    const [expireResult, setExpireResult] = useState(null);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        slug: '',
        description: '',
        banner_url: '',
        accent_color: '#ff4d4d',
        template_type: 'single',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
        countdown_enabled: true,
        type: 'campaign',
        button_text: 'EXPLORAR',
        button_link: '',
        image_file: null,
        secondary_images: [],
        secondary_image_previews: []
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/campaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
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
        template_type: 'cinematic',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            is_active: true,
            countdown_enabled: true,
            type: 'campaign',
            button_text: 'EXPLORAR',
            button_link: '',
            image_file: null,
            secondary_images: [],
            secondary_image_previews: []
        });
        setIsModalOpen(true);
    };

    const handleEdit = (campaign) => {
        setFormData({
            ...campaign,
            start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
            end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
            image_file: null,
            secondary_images: campaign.secondary_images || [],
            secondary_image_previews: campaign.secondary_image_previews || []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar campaña?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            fetchCampaigns();
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_file: file, banner_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSecondaryImageChange = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const newFiles = [...(formData.secondary_images || [])];
            const newPreviews = [...(formData.secondary_image_previews || [])];
            newFiles[index] = file;
            newPreviews[index] = reader.result;
            setFormData({ ...formData, secondary_images: newFiles, secondary_image_previews: newPreviews });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            alert('Por favor ingresa el nombre de la campaña.');
            return;
        }
        if (!formData.start_date || !formData.end_date) {
            alert('Por favor selecciona la Fecha de Inicio y la Fecha de Fin. Son obligatorias.');
            return;
        }

        setIsSaving(true);
        try {
            const data = new FormData();
            const dataToAppend = { ...formData };
            // Campos que se manejan manualmente (no en el loop genérico)
            const skipKeys = new Set(['image_file', 'secondary_images', 'secondary_image_previews', 'id']);

            Object.keys(dataToAppend).forEach(key => {
                if (skipKeys.has(key)) return;
                if (key === 'id') return; // nunca enviar id en el body (va en la URL para PUT)
                if (key === 'banner_url') {
                    if (dataToAppend[key] && !dataToAppend[key].startsWith('data:')) {
                        data.append(key, dataToAppend[key]);
                    }
                } else if (dataToAppend[key] !== null && dataToAppend[key] !== undefined) {
                    data.append(key, dataToAppend[key]);
                }
            });

            // Imagen principal
            if (dataToAppend.image_file) {
                data.append('image', dataToAppend.image_file);
            }

            // Imágenes secundarias nuevas (File objects)
            if (formData.secondary_images && formData.secondary_images.length > 0) {
                formData.secondary_images.forEach((file, i) => {
                    if (file instanceof File) {
                        data.append(`secondary_image_${i}`, file);
                    }
                });
            }

            // URLs existentes de imágenes secundarias (no base64)
            const existingSecondaryImages = (formData.secondary_image_previews || [])
                .map((preview, i) => (preview && !preview.startsWith('data:') ? formData.secondary_images[i] : null))
                .filter(Boolean);
            data.append('secondary_images', JSON.stringify(existingSecondaryImages));

            if (formData.id) {
                await api.put(`/campaigns/${formData.id}`, data);
            } else {
                await api.post('/campaigns', data);
            }
            setIsModalOpen(false);
            fetchCampaigns();
        } catch (error) {
            console.error("Error saving campaign:", error);
            const backendError = error.response?.data?.details || error.response?.data?.error || error.message;
            alert(`Error al guardar: ${backendError}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExpire = async () => {
        setIsExpiring(true);
        try {
            const response = await api.post('/campaigns/expire');
            setExpireResult({ success: true, msg: response.data.message });
            fetchCampaigns();
            setTimeout(() => setExpireResult(null), 5000);
        } catch (error) {
            setExpireResult({ success: false, msg: "Error al procesar expiración" });
        } finally {
            setIsExpiring(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>Campañas</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>Gestiona eventos y temporadas visuales.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleExpire} disabled={isExpiring} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                        {isExpiring ? <Loader className="spin" size={18} /> : <Zap size={18} />}
                        Expirar Obsoletos
                    </button>
                    <button onClick={handleAddNew} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                        <Plus size={20} /> Nuevo Evento
                    </button>
                </div>
            </div>

            {expireResult && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem', borderRadius: '12px', background: expireResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: expireResult.success ? '#22c55e' : '#ef4444', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <CheckCircle size={18} /> {expireResult.msg}
                </motion.div>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {loading ? <Loader className="spin" size={40} /> : campaigns.map(campaign => (
                    <motion.div key={campaign.id} className="bg-secondary" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '180px', position: 'relative' }}>
                            <img src={getProductImage(null, campaign.banner_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="" />
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                {onOpenCampaignSlots && (
                                    <button onClick={() => onOpenCampaignSlots(campaign.id, campaign.name)} style={{ background: 'rgba(var(--primary-rgb), 0.2)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '50%', border: '1px solid rgba(var(--primary-rgb), 0.3)', cursor: 'pointer', display: 'flex' }} title="Slots">
                                        <Layers size={16} />
                                    </button>
                                )}
                                <button onClick={() => handleEdit(campaign)} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.6rem', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex' }} title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(campaign.id)} style={{ background: 'rgba(0,0,0,0.7)', color: '#ff4d4d', padding: '0.6rem', borderRadius: '50%', border: '1px solid rgba(255,77,77,0.3)', cursor: 'pointer', display: 'flex' }} title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontWeight: '900' }}>{campaign.name}</h3>
                                <span style={{ fontSize: '0.7rem', color: campaign.is_active ? '#22c55e' : '#666', fontWeight: '800' }}>
                                    {campaign.is_active ? '● ACTIVA' : '○ INACTIVA'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>{campaign.description}</p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(campaign.start_date).toLocaleDateString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Palette size={14} /> {campaign.template_type}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: '#111', width: '100%', maxWidth: '1000px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', maxHeight: '90vh' }}>
                            {/* Form */}
                            <div style={{ flex: 1.2, padding: '2.5rem', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Configurar Evento</h3>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                                </div>
                                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label-text">Nombre</label>
                                            <input 
                                                type="text" 
                                                value={formData.name} 
                                                onChange={e => {
                                                    const newName = e.target.value;
                                                    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                                    setFormData({ ...formData, name: newName, slug: newSlug });
                                                }} 
                                                className="input-field" 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Tipo</label>
                                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="input-field">
                                                <option value="campaign">Campaña</option>
                                                <option value="season">Temporada</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label-text">Descripción</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label-text">Plantilla</label>
                                            <select value={formData.template_type} onChange={e => setFormData({ ...formData, template_type: e.target.value })} className="input-field">
                                                <option value="single">Single — Imagen completa</option>
                                                <option value="split">Split — Editorial 50/50</option>
                                                <option value="cinematic">Cinematic — Póster de película</option>
                                                <option value="magazine">Magazine — Portada de revista</option>
                                                <option value="ticker">Ticker — Banda animada</option>
                                                <option value="collage-3">Collage 3 — 1 grande + 2 pequeñas</option>
                                                <option value="collage-4">Collage 4 — 1 grande + 3 pequeñas</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Color Acento</label>
                                            <input type="color" value={formData.accent_color} onChange={e => setFormData({ ...formData, accent_color: e.target.value })} className="input-field" style={{ height: '50px' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label-text">Fecha Inicio</label>
                                            <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
                                        </div>
                                        <div className="form-group">
                                            <label className="label-text">Fecha Fin</label>
                                            <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label-text">Texto Botón</label>
                                        <input type="text" placeholder="Ej: COMPRAR AHORA" value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label className="label-text">Banner</label>
                                        <input type="file" onChange={handleFileChange} accept="image/*" />
                                    </div>
                                    {(formData.template_type === 'collage-3' || formData.template_type === 'collage-4') && (
                                        <div className="form-group">
                                            <label className="label-text">
                                                Imágenes secundarias ({formData.template_type === 'collage-3' ? '2 requeridas' : '3 requeridas'})
                                            </label>
                                            {Array.from({ length: formData.template_type === 'collage-3' ? 2 : 3 }, (_, i) => (
                                                <div key={i} style={{ marginBottom: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Imagen {i + 2}</label>
                                                    <input type="file" accept="image/*" onChange={(e) => handleSecondaryImageChange(e, i)} />
                                                    {formData.secondary_image_previews[i] && (
                                                        <img src={formData.secondary_image_previews[i]} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginTop: '0.3rem' }} alt="" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span>Activa</span>
                                        </label>
                                    </div>
                                    <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '1rem', borderRadius: '12px' }}>
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </form>
                            </div>
                            {/* Preview */}
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
                                {(() => {
                                    const PreviewTemplate = getTemplateComponent(formData.template_type);
                                    const previewCampaign = {
                                        ...formData,
                                        secondary_images: formData.secondary_image_previews || [],
                                        banner_url: formData.banner_url || '',
                                    };
                                    const previewTimeLeft = { days: '02', hours: '14', minutes: '45', seconds: '30' };
                                    return (
                                        <div style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center', width: '166%', marginLeft: '-33%' }}>
                                                <PreviewTemplate campaign={previewCampaign} timeLeft={previewTimeLeft} isActive={true} />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}