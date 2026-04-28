import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Tag, Plus, Trash2, Edit, CheckCircle2, 
    AlertCircle, Loader, RefreshCw, X, 
    ChevronRight, Save, Info
} from 'lucide-react';

/**
 * @component AdminCategories
 * @description Administración dinámica de categorías de productos.
 * Permite al administrador crear, editar y eliminar categorías reales de la base de datos.
 */
export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [productCounts, setProductCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    
    // Estados para el Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '🏷️',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    /**
     * Carga las categorías de la tabla 'categories' y los conteos de productos.
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const [catsRes, productsRes] = await Promise.all([
                api.get('/categories'),
                api.get('/products/admin')
            ]);

            setCategories(catsRes.data || []);

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
            showFeedback('error', 'Error al cargar datos del servidor.');
        } finally {
            setLoading(false);
        }
    };

    const showFeedback = (type, msg) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    /**
     * Abre el modal para crear o editar.
     */
    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                icon: '🏷️',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    /**
     * Maneja el cambio en el nombre para autogenerar el slug.
     */
    const handleNameChange = (e) => {
        const name = e.target.value;
        const slug = name.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        setFormData(prev => ({ ...prev, name, slug }));
    };

    /**
     * Guarda la categoría (Create o Update).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, formData);
                showFeedback('success', 'Categoría actualizada correctamente.');
            } else {
                await api.post('/categories', formData);
                showFeedback('success', 'Nueva categoría creada.');
            }
            loadData();
            closeModal();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al guardar.';
            showFeedback('error', errorMsg);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Elimina una categoría.
     */
    const handleDelete = async (id, slug) => {
        if ((productCounts[slug] || 0) > 0) {
            showFeedback('error', 'No puedes eliminar una categoría que tiene productos asociados.');
            return;
        }

        if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

        try {
            await api.delete(`/categories/${id}`);
            showFeedback('success', 'Categoría eliminada.');
            loadData();
        } catch (error) {
            showFeedback('error', error.response?.data?.error || 'Error al eliminar.');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            {/* Header con glassmorphism */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', 
                marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' 
            }}>
                <div>
                    <h2 style={{
                        fontSize: '2.5rem', fontWeight: '900',
                        background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        Categorías
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
                        Gestiona las etiquetas principales de tu catálogo.
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={loadData} className="refresh-btn">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={() => openModal()} className="add-btn-premium">
                        <Plus size={20} /> Nueva Categoría
                    </button>
                </div>
            </div>

            {/* Feedback floating */}
            <AnimatePresence>
                {feedback && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed', top: '2rem', left: '50%', zIndex: 1000,
                            padding: '1rem 2rem', borderRadius: '14px',
                            background: feedback.type === 'success' ? '#059669' : '#dc2626',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: '700'
                        }}
                    >
                        {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        {feedback.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div style={{ padding: '8rem 0', textAlign: 'center' }}>
                    <Loader className="spin" size={50} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                </div>
            ) : (
                <div className="categories-grid-premium">
                    {categories.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                            <Tag size={48} style={{ marginBottom: '1rem' }} />
                            <p>No hay categorías registradas. Crea la primera.</p>
                        </div>
                    ) : (
                        categories.map((cat, i) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="category-card-premium"
                            >
                                <div className="card-badge">
                                    {productCounts[cat.slug] || 0} productos
                                </div>
                                <div className="cat-icon-large">{cat.icon}</div>
                                <h3 className="cat-name">{cat.name}</h3>
                                <p className="cat-desc">{cat.description || 'Sin descripción'}</p>
                                <code className="cat-slug">/{cat.slug}</code>
                                
                                <div className="cat-actions-overlay">
                                    <button onClick={() => openModal(cat)} className="cat-action-btn edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id, cat.slug)} className="cat-action-btn delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Creación/Edición */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay-premium">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content-premium"
                        >
                            <div className="modal-header">
                                <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                                <button onClick={closeModal} className="close-btn"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group-grid">
                                    <div className="input-group">
                                        <label>Nombre</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            placeholder="Ej: Anime, T-Shirts..."
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Slug (URL)</label>
                                        <input 
                                            type="text" 
                                            value={formData.slug}
                                            onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                            placeholder="ej-url-amigable"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Icono (Emoji)</label>
                                    <input 
                                        type="text" 
                                        value={formData.icon}
                                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                                        style={{ fontSize: '1.5rem', textAlign: 'center', width: '80px' }}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Descripción</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Breve descripción de la categoría..."
                                        rows="3"
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={closeModal} className="cancel-btn">Cancelar</button>
                                    <button type="submit" disabled={saving} className="save-btn-premium">
                                        {saving ? <Loader className="spin" size={18} /> : <Save size={18} />}
                                        {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .categories-grid-premium {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }

                .category-card-premium {
                    position: relative;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    padding: 2rem;
                    text-align: center;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .category-card-premium:hover {
                    transform: translateY(-8px);
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--primary);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }

                .card-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(var(--primary-rgb), 0.1);
                    color: var(--primary);
                    padding: 0.3rem 0.8rem;
                    border-radius: 100px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }

                .cat-icon-large {
                    font-size: 3.5rem;
                    margin-bottom: 1.2rem;
                    filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
                }

                .cat-name {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .cat-desc {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .cat-slug {
                    display: inline-block;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.1);
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                }

                .cat-actions-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                }

                .category-card-premium:hover .cat-actions-overlay {
                    opacity: 1;
                    transform: translateY(0);
                }

                .cat-action-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cat-action-btn.edit { background: #3b82f6; color: white; }
                .cat-action-btn.delete { background: #ef4444; color: white; }
                .cat-action-btn:hover { transform: scale(1.1); filter: brightness(1.2); }

                /* Buttons */
                .refresh-btn {
                    width: 46px; height: 46px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .refresh-btn:hover { background: rgba(255,255,255,0.1); transform: rotate(30deg); }

                .add-btn-premium {
                    padding: 0 1.5rem;
                    height: 46px;
                    border-radius: 14px;
                    background: var(--primary);
                    color: black;
                    border: none;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.3);
                }
                .add-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(var(--primary-rgb), 0.5); }

                /* Modal Premium */
                .modal-overlay-premium {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 1rem;
                }

                .modal-content-premium {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 550px;
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.8);
                }

                .modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 { font-size: 1.3rem; font-weight: 800; }

                .close-btn {
                    background: rgba(255,255,255,0.05);
                    border: none; color: #888;
                    width: 32px; height: 32px; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s;
                }
                .close-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

                .modal-form { padding: 2rem; }

                .form-group-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .input-group { margin-bottom: 1.5rem; }
                .input-group label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .input-group input, .input-group textarea {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    color: white;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }

                .input-group input:focus, .input-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.05);
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .cancel-btn {
                    padding: 0.8rem 1.5rem;
                    border-radius: 12px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                }

                .save-btn-premium {
                    padding: 0.8rem 1.8rem;
                    border-radius: 12px;
                    background: var(--primary);
                    color: black;
                    border: none;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .save-btn-premium:disabled { opacity: 0.5; cursor: not-allowed; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </motion.div>
    );
}
