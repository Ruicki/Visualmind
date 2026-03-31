import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit, Trash2, Search, Loader, X, Save, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Panel de administración de productos.
 * Soporta subida de imágenes tanto por archivo local (Supabase Storage)
 * como por URL externa.
 */

// Nombre del bucket en Supabase Storage
const STORAGE_BUCKET = 'product-images';

export default function AdminProducts() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal y formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        category: 'anime',
        sub_category: '',
        price: '',
        image_url: ''
    });

    // Estado del upload de imagen
    const [imageMode, setImageMode] = useState('upload'); // 'upload' o 'url'
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    // === Operaciones CRUD ===

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error al obtener productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.confirm_delete'))) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert(t('common.error') + ': ' + error.message);
        }
    };

    const handleEdit = (product) => {
        setFormData({
            id: product.id,
            title: product.title,
            category: product.category,
            sub_category: product.sub_category || '',
            price: product.price,
            image_url: product.image_url || ''
        });
        // Si ya tiene una URL, mostrar en modo URL
        setImageMode(product.image_url ? 'url' : 'upload');
        setUploadError(null);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            id: null,
            title: '',
            category: 'anime',
            sub_category: '',
            price: '',
            image_url: ''
        });
        setImageMode('upload');
        setUploadError(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const productData = {
                title: formData.title,
                category: formData.category,
                sub_category: formData.sub_category,
                price: parseFloat(formData.price),
                image_url: formData.image_url
            };

            let error;
            if (formData.id) {
                const { error: err } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', formData.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('products')
                    .insert([productData]);
                error = err;
            }

            if (error) throw error;

            setIsModalOpen(false);
            fetchProducts();
            alert(t('admin.success_save') || "¡Guardado exitosamente!");
        } catch (error) {
            console.error("Error al guardar:", error);
            alert((t('common.error') || "Error") + ': ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // === Lógica de Upload de Imágenes ===

    /**
     * Sube una imagen a Supabase Storage y devuelve la URL pública.
     * Si el bucket no existe, muestra un error explicativo.
     */
    const uploadImage = async (file) => {
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Solo se permiten imágenes (JPG, PNG, WebP)');
            return;
        }

        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('La imagen no debe superar 5MB');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            // Generar nombre único para evitar colisiones
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            // Subir a Supabase Storage
            const { data, error: uploadErr } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadErr) {
                // Error común: bucket no existe
                if (uploadErr.message?.includes('not found') || uploadErr.statusCode === '404' || uploadErr.error === 'Bucket not found') {
                    setUploadError(
                        `El bucket "${STORAGE_BUCKET}" no existe en Supabase. ` +
                        'Ve a tu panel de Supabase → Storage → New Bucket → ' +
                        `Crea uno llamado "${STORAGE_BUCKET}" con acceso público.`
                    );
                } else {
                    setUploadError(`Error al subir: ${uploadErr.message}`);
                }
                return;
            }

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            if (urlData?.publicUrl) {
                setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
                setUploadError(null);
            }
        } catch (err) {
            console.error('Error en upload:', err);
            setUploadError(`Error inesperado: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Manejar selección de archivo
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file);
    };

    // Manejar drag & drop
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadImage(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    return (
        <div>
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{t('admin.products')}</h2>
                <button
                    onClick={handleAddNew}
                    className="btn-primary"
                    style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                    <Plus size={20} />
                    {t('admin.add_product')}
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '1rem', border: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder={t('admin.search_products')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
            </div>

            {/* Tabla de productos */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /></div>
                ) : products.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {t('admin.no_products')}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Imagen</th>
                                    <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.label_title')}</th>
                                    <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.label_category')}</th>
                                    <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('admin.label_price')}</th>
                                    <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>{t('admin.table_action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                                    <tr key={product.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <div style={{ width: '50px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="gray" /></div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: '600' }}>{product.title}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.8rem' }}>{product.category}</span>
                                            {product.sub_category && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{product.sub_category}</span>}
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem' }}>${product.price}</td>
                                        <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* === Modal de Crear/Editar Producto === */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '550px', background: 'var(--bg-secondary)',
                        borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)',
                        maxHeight: '90vh', overflowY: 'auto',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        {/* Cabecera del modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                                {formData.id ? t('admin.edit_product') : t('admin.add_product')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Título */}
                            <div>
                                <label className="label-text">{t('admin.label_title')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            {/* Categoría y Subcategoría */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label-text">{t('admin.label_category')}</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="custom-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="anime">Anime</option>
                                        <option value="videojuegos">Videojuegos</option>
                                        <option value="deportes">Deportes</option>
                                        <option value="caricaturas">Caricaturas</option>
                                        <option value="sanvalentin">San Valentín</option>
                                        <option value="halloween">Halloween</option>
                                        <option value="fiestas_patrias">Fiestas Patrias</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-text">{t('admin.label_subcategory')}</label>
                                    <input
                                        type="text"
                                        value={formData.sub_category}
                                        onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                                        placeholder="Ej: One Piece"
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Precio */}
                            <div>
                                <label className="label-text">{t('admin.label_price')} ($)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            {/* === Sección de Imagen (NUEVA) === */}
                            <div>
                                <label className="label-text">Imagen del Producto</label>

                                {/* Toggle: Subir archivo vs URL */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setImageMode('upload')}
                                        style={{
                                            flex: 1, padding: '0.6rem', borderRadius: '10px',
                                            border: `1px solid ${imageMode === 'upload' ? 'var(--primary)' : 'var(--border-light)'}`,
                                            background: imageMode === 'upload' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            color: imageMode === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.3s'
                                        }}
                                    >
                                        <Upload size={16} /> Subir Archivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageMode('url')}
                                        style={{
                                            flex: 1, padding: '0.6rem', borderRadius: '10px',
                                            border: `1px solid ${imageMode === 'url' ? 'var(--primary)' : 'var(--border-light)'}`,
                                            background: imageMode === 'url' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            color: imageMode === 'url' ? 'var(--primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.3s'
                                        }}
                                    >
                                        <LinkIcon size={16} /> Pegar URL
                                    </button>
                                </div>

                                {/* Modo: Subir archivo */}
                                {imageMode === 'upload' && (
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-light)'}`,
                                            borderRadius: '16px',
                                            padding: '2rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            background: dragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />

                                        {uploading ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                                <Loader className="spin" size={32} style={{ color: 'var(--primary)' }} />
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subiendo imagen...</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                                <Upload size={32} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Haz clic aquí</span> o arrastra una imagen
                                                </p>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.6 }}>
                                                    JPG, PNG, WebP o GIF • Máximo 5MB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Modo: URL externa */}
                                {imageMode === 'url' && (
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        className="input-field"
                                    />
                                )}

                                {/* Error de upload */}
                                {uploadError && (
                                    <div style={{
                                        marginTop: '0.8rem', padding: '0.8rem 1rem', borderRadius: '10px',
                                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444', fontSize: '0.85rem', lineHeight: 1.5
                                    }}>
                                        ⚠️ {uploadError}
                                    </div>
                                )}

                                {/* Preview de imagen */}
                                {formData.image_url && (
                                    <div style={{
                                        marginTop: '1rem', position: 'relative',
                                        width: '100%', height: '180px', borderRadius: '12px',
                                        overflow: 'hidden', background: '#1a1a2e',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        <img
                                            src={formData.image_url}
                                            alt="Vista previa"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div style={{
                                            display: 'none', position: 'absolute', inset: 0,
                                            alignItems: 'center', justifyContent: 'center',
                                            color: '#ef4444', fontSize: '0.85rem', flexDirection: 'column', gap: '0.5rem'
                                        }}>
                                            <ImageIcon size={24} />
                                            <span>No se pudo cargar la imagen</span>
                                        </div>

                                        {/* Botón eliminar imagen */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image_url: '' })}
                                            style={{
                                                position: 'absolute', top: '0.5rem', right: '0.5rem',
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', border: 'none',
                                                color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Botón guardar */}
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn-primary"
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    fontSize: '1rem', marginTop: '0.5rem',
                                    cursor: isSaving ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                {isSaving ? <Loader className="spin" /> : <Save size={20} />}
                                {isSaving ? (t('admin.saving') || 'Guardando...') : (t('admin.save_product') || 'Guardar Producto')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
