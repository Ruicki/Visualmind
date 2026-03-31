import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Plus, Edit, Trash2, Search, Loader, X, Save, 
    Image as ImageIcon, Upload, Link as LinkIcon, 
    Star, Zap, Calendar, Package, Layers, Info 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getProductImage } from '../../utils/imageUtils';

/**
 * Panel de administración de productos mejorado con variantes y marketing.
 */
export default function AdminProducts() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'variants', 'marketing'

    // Modal y formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        category: 'anime',
        sub_category: '',
        price: '',
        sku: '',
        stock: 0,
        image_url: '',
        image_file: null,
        featured: false,
        new_arrival: false,
        launch_date: '',
        variants: [] // Array de { size, color, stock, sku }
    });

    // Estado del upload de imagen e información dinámica
    const [imageMode, setImageMode] = useState('upload'); // 'upload' o 'url'
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [uploadError, setUploadError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchDynamicMetadata();
    }, []);

    const fetchDynamicMetadata = async () => {
        try {
            const [catRes, subRes] = await Promise.all([
                api.get('/products/categories'),
                api.get('/products/sub-categories')
            ]);
            setCategories(catRes.data || []);
            setSubCategories(subRes.data || []);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products/admin');
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error al obtener productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.confirm_delete') || '¿Estás seguro de eliminar este producto?')) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert(t('common.error') + ': ' + (error.response?.data?.error || error.message));
        }
    };

    const handleEdit = (product) => {
        setFormData({
            id: product.id,
            title: product.title,
            category: product.category,
            sub_category: product.sub_category || '',
            price: product.price,
            sku: product.sku || '',
            stock: product.stock || 0,
            image_url: product.image_url || '',
            image_file: null,
            featured: product.featured || false,
            new_arrival: product.new_arrival || false,
            launch_date: product.launch_date ? new Date(product.launch_date).toISOString().split('T')[0] : '',
            variants: product.variants || []
        });
        setImageMode(product.image_url && !product.image_url.startsWith('uploads/') ? 'url' : 'upload');
        setUploadError(null);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            id: null,
            title: '',
            category: categories[0] || 'anime',
            sub_category: '',
            price: '',
            sku: '',
            stock: 0,
            image_url: '',
            image_file: null,
            featured: false,
            new_arrival: false,
            launch_date: new Date().toISOString().split('T')[0],
            variants: []
        });
        setImageMode('upload');
        setUploadError(null);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const productFormData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'variants') {
                    productFormData.append('variants', JSON.stringify(formData.variants));
                } else if (key === 'image_file' && formData.image_file) {
                    productFormData.append('image', formData.image_file);
                } else if (key !== 'image_file' && key !== 'image_url') {
                    productFormData.append(key, formData[key]);
                }
            });

            if (!formData.image_file && formData.image_url) {
                productFormData.append('image_url', formData.image_url);
            }

            if (formData.id) {
                await api.put(`/products/${formData.id}`, productFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/products', productFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert((t('common.error') || "Error") + ': ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    // Variantes
    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size: '', color: '', stock: 0, sku: '' }]
        });
    };

    const updateVariant = (index, field, value) => {
        const newVariants = [...formData.variants];
        newVariants[index][field] = value;
        
        // Sincronizar stock total si se modifica el stock de una variante
        let totalStock = formData.stock;
        if (field === 'stock') {
            totalStock = newVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        }
        
        setFormData({ ...formData, variants: newVariants, stock: totalStock });
    };

    const removeVariant = (index) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index)
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processImage(file);
    };

    // Imagen
    const processImage = (file) => {
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Solo se permiten imágenes (JPG, PNG, WebP, AVIF)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('La imagen no debe superar 5MB');
            return;
        }
        setUploadError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image_file: file, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('admin.products') || 'Gestión de Productos'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Administra tu catálogo, variantes y stock local.</p>
                </div>
                <button onClick={handleAddNew} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Plus size={20} /> {t('admin.add_product') || 'Nuevo Producto'}
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder={t('admin.search_products') || 'Buscar productos...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '3rem', background: 'transparent' }}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><Loader className="spin" size={40} /></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Producto</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Categoría</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                                    <tr key={product.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '45px', height: '45px', borderRadius: '10px', overflow: 'hidden', background: '#222' }}>
                                                    <img src={getProductImage(null, product.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{product.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {product.sku || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>{product.category}</span>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>{product.sub_category}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ 
                                                    width: '8px', height: '8px', borderRadius: '50%', 
                                                    background: product.stock > 10 ? '#22c55e' : product.stock > 0 ? '#f59e0b' : '#ef4444' 
                                                }} />
                                                <span style={{ fontWeight: '500' }}>{product.stock}</span>
                                                {product.variants?.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({product.variants.length} var)</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: '700', color: 'var(--primary)' }}>${product.price}</td>
                                        <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                                <button onClick={() => handleEdit(product)} className="icon-btn-blue"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(product.id)} className="icon-btn-red"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-secondary"
                            style={{ width: '100%', maxWidth: '700px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Modal Header */}
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configura los detalles, variantes y visibilidad.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
                            </div>

                            {/* Modal Tabs */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.5rem' }}>
                                {[
                                    { id: 'basic', label: 'Info Básica', icon: Info },
                                    { id: 'variants', label: 'Variantes', icon: Layers },
                                    { id: 'marketing', label: 'Marketing', icon: Star }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{ 
                                            flex: 1, padding: '0.8rem', border: 'none', background: 'none', 
                                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                            fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                            transition: 'all 0.3s', cursor: 'pointer'
                                        }}
                                    >
                                        <tab.icon size={16} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                                <form id="product-form" onSubmit={handleSave}>
                                    {activeTab === 'basic' && (
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Título</label>
                                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">SKU General</label>
                                                    <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="input-field" placeholder="P-001" />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Categoría</label>
                                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="custom-select">
                                                        {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">Subcategoría</label>
                                                    <input list="sub-cats" value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })} className="input-field" placeholder="Ej: Naruto" />
                                                    <datalist id="sub-cats">{subCategories.map(s => <option key={s} value={s} />)}</datalist>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Precio Base ($)</label>
                                                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="input-field" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">Stock Total</label>
                                                    <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="input-field" />
                                                </div>
                                            </div>

                                            {/* Imagen Section */}
                                            <div style={{ marginTop: '1rem' }}>
                                                <label className="label-text" style={{ marginBottom: '1rem', display: 'block' }}>Imagen Principal</label>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <div 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                        style={{ 
                                                            width: '120px', height: '120px', borderRadius: '16px', 
                                                            border: `2px dashed ${dragOver ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, 
                                                            background: dragOver ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        {formData.image_url ? (
                                                            <img src={formData.image_url.startsWith('data:') ? formData.image_url : getProductImage(null, formData.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                        ) : (
                                                            <Upload size={24} style={{ color: dragOver ? 'var(--primary)' : 'rgba(255,255,255,0.2)' }} />
                                                        )}
                                                        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.3rem', marginBottom: '0.8rem' }}>
                                                            <button type="button" onClick={() => setImageMode('upload')} style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: imageMode === 'upload' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}>Archivo</button>
                                                            <button type="button" onClick={() => setImageMode('url')} style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: imageMode === 'url' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}>URL</button>
                                                        </div>
                                                        {imageMode === 'url' ? (
                                                            <input type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input-field" placeholder="https://..." />
                                                        ) : (
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                {formData.image_file ? formData.image_file.name : 'No hay archivo seleccionado'}
                                                            </div>
                                                        )}
                                                        {uploadError && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.5rem' }}>{uploadError}</p>}
                                                        {!uploadError && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Formatos: JPG, PNG, WebP, AVIF. Max: 5MB.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'variants' && (
                                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Variantes (Talla / Color)</h4>
                                                <button type="button" onClick={addVariant} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                                                    <Plus size={14} /> Añadir Variante
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {formData.variants.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                                                        <Layers size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Este producto no tiene variantes. Se usará el stock general.</p>
                                                    </div>
                                                ) : (
                                                    formData.variants.map((variant, idx) => (
                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', gap: '0.8rem', alignItems: 'end', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div className="form-group">
                                                                <label className="label-text" style={{ fontSize: '0.7rem' }}>Talla</label>
                                                                <input type="text" value={variant.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="input-field-small" placeholder="M, L, XL..." />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="label-text" style={{ fontSize: '0.7rem' }}>Color</label>
                                                                <input type="text" value={variant.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="input-field-small" placeholder="Rojo, Azul..." />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="label-text" style={{ fontSize: '0.7rem' }}>Stock</label>
                                                                <input type="number" value={variant.stock} onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)} className="input-field-small" />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="label-text" style={{ fontSize: '0.7rem' }}>SKU Var</label>
                                                                <input type="text" value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="input-field-small" placeholder="VAR-01" />
                                                            </div>
                                                            <button type="button" onClick={() => removeVariant(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1.5rem', fontStyle: 'italic' }}>
                                                * El stock total se sincronizará automáticamente con la suma de las variantes al guardar.
                                            </p>
                                        </motion.div>
                                    )}

                                    {activeTab === 'marketing' && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div 
                                                    onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                                                    style={{ 
                                                        padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                                                        background: formData.featured ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${formData.featured ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <Star size={24} color={formData.featured ? '#eab308' : '#666'} fill={formData.featured ? '#eab308' : 'none'} />
                                                        <div style={{ width: '40px', height: '20px', borderRadius: '20px', background: formData.featured ? 'var(--primary)' : '#333', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: '2px', left: formData.featured ? '22px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                                        </div>
                                                    </div>
                                                    <h5 style={{ fontWeight: '700', marginBottom: '0.3rem' }}>Producto Destacado</h5>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aparecerá en la sección "Featured" de la home.</p>
                                                </div>

                                                <div 
                                                    onClick={() => setFormData({ ...formData, new_arrival: !formData.new_arrival })}
                                                    style={{ 
                                                        padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                                                        background: formData.new_arrival ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${formData.new_arrival ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <Zap size={24} color={formData.new_arrival ? 'var(--primary)' : '#666'} />
                                                        <div style={{ width: '40px', height: '20px', borderRadius: '20px', background: formData.new_arrival ? 'var(--primary)' : '#333', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: '2px', left: formData.new_arrival ? '22px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                                        </div>
                                                    </div>
                                                    <h5 style={{ fontWeight: '700', marginBottom: '0.3rem' }}>Nueva Llegada</h5>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Etiqueta especial en la tienda para productos recientes.</p>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={16} /> Fecha de Lanzamiento
                                                </label>
                                                <input type="date" value={formData.launch_date} onChange={e => setFormData({ ...formData, launch_date: e.target.value })} className="input-field" />
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Útil para programar visibilidad futura o mostrar fecha de salida.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '12px' }}>Cancelar</button>
                                <button form="product-form" type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                                    {isSaving ? <Loader className="spin" size={20} /> : <Save size={20} />}
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                    z-index: 2000; display: flex; alignItems: center; justifyContent: center; padding: 1.5rem;
                }
                .label-text { font-size: 0.85rem; font-weight: 600; color: #aaa; margin-bottom: 0.5rem; display: block; }
                .input-field { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; color: white; transition: all 0.3s; }
                .input-field:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.08); }
                .input-field-small { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem; color: white; font-size: 0.8rem; }
                .custom-select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; color: white; cursor: pointer; }
                .table-row-hover:hover { background: rgba(255,255,255,0.02); }
                .icon-btn-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justifyContent: center; transition: all 0.2s; }
                .icon-btn-blue:hover { background: #3b82f6; color: white; }
                .icon-btn-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justifyContent: center; transition: all 0.2s; }
                .icon-btn-red:hover { background: #ef4444; color: white; }
                .close-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </motion.div>
    );
}
