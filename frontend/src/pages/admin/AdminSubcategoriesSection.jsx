import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Save, Loader, Image as ImageIcon, Upload } from 'lucide-react';
import api from '../../api/axiosConfig';

const emptyForm = () => ({
    id: null,
    name: '',
    slug: '',
    category_id: '',
    image_url: '',
    image_file: null,
    description: ''
});

export default function AdminSubcategoriesSection({ allCategories, onEnterSubcategory }) {
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState(emptyForm());
    const fileInputRef = useRef(null);

    const fetchSubcategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/subcategories');
            setSubcategories(res.data || []);
        } catch (err) {
            console.error('Error fetching subcategories:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubcategories();
    }, [fetchSubcategories]);

    const grouped = useMemo(() => {
        const map = {};
        subcategories.forEach(sub => {
            const catId = sub.category_id;
            if (!map[catId]) map[catId] = [];
            map[catId].push(sub);
        });
        return map;
    }, [subcategories]);

    const sortedCategoryIds = useMemo(() => {
        return Object.keys(grouped).sort((a, b) => {
            const catA = allCategories.find(c => String(c.id) === String(a));
            const catB = allCategories.find(c => String(c.id) === String(b));
            return (catA?.name || '').localeCompare(catB?.name || '');
        });
    }, [grouped, allCategories]);

    const getCategory = (id) => allCategories.find(c => String(c.id) === String(id));

    const handleCreate = () => {
        setFormData(emptyForm());
        setIsModalOpen(true);
    };

    const handleEdit = (sub) => {
        setFormData({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            category_id: sub.category_id,
            image_url: sub.image_url || '',
            image_file: null,
            description: sub.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta subcategoría? Los productos quedarán sin subcategoría.')) return;
        try {
            await api.delete(`/subcategories/${id}`);
            fetchSubcategories();
            onEnterSubcategory(null, null);
        } catch (err) {
            alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.category_id) return;
        setIsSaving(true);
        try {
            const body = {
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                category_id: formData.category_id,
                image_url: formData.image_url || null,
                description: formData.description || null
            };
            if (formData.id) {
                await api.put(`/subcategories/${formData.id}`, body);
            } else {
                await api.post('/subcategories', body);
            }
            setIsModalOpen(false);
            fetchSubcategories();
        } catch (err) {
            alert('Error al guardar: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image_file: file, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Subcategorías</h3>
                <button onClick={handleCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: '10px' }}>
                    <Plus size={16} /> Crear subcategoría
                </button>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader className="spin" size={28} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
            )}

            {!loading && subcategories.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    <p style={{ marginBottom: '0.5rem' }}>No hay subcategorías</p>
                    <p style={{ fontSize: '0.85rem' }}>Crea una para empezar a organizar tus productos.</p>
                </div>
            )}

            {!loading && sortedCategoryIds.map(catId => {
                const cat = getCategory(catId);
                const items = grouped[catId];
                return (
                    <div key={catId} style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {cat ? `${cat.icon || ''} ${cat.name}` : `Categoría #${catId}`}
                            <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.5 }}>({items.length})</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                            {items.map(sub => (
                                <motion.div
                                    key={sub.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '120px',
                                            background: '#1a1a1a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => onEnterSubcategory(sub.id)}
                                    >
                                        {sub.image_url ? (
                                            <img
                                                src={sub.image_url.startsWith('data:') ? sub.image_url : sub.image_url}
                                                alt={sub.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                                <ImageIcon size={32} />
                                                <p style={{ fontSize: '0.65rem', marginTop: '0.3rem' }}>Sin imagen</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <p style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff', marginBottom: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sub.name}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                            <button onClick={() => handleEdit(sub)} className="icon-btn-blue" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(sub.id)} className="icon-btn-red" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                                                <Trash2 size={14} />
                                            </button>

                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ zIndex: 200 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-secondary"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '500px', borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '2rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>
                                    {formData.id ? 'Editar subcategoría' : 'Nueva subcategoría'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div className="form-group">
                                    <label className="label-text">Nombre *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({
                                            ...formData,
                                            name: e.target.value,
                                            slug: formData.id ? formData.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                                        })}
                                        className="input-field"
                                        placeholder="Ej: One Piece"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label-text">Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        className="input-field"
                                        placeholder="one-piece"
                                        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label-text">Categoría *</label>
                                    <select
                                        required
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        className="input-field"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {allCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="label-text">Imagen / Logo</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%', height: '120px', borderRadius: '12px',
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.02)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', overflow: 'hidden',
                                            transition: 'border-color 0.2s'
                                        }}
                                    >
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                                <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                                                <p style={{ fontSize: '0.75rem' }}>Haz clic para subir imagen</p>
                                            </div>
                                        )}
                                        <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label-text">Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field"
                                        rows={3}
                                        placeholder="Descripción opcional"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={isSaving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                                        {isSaving ? <Loader className="spin" size={16} /> : <Save size={16} />}
                                        {formData.id ? 'Guardar cambios' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
