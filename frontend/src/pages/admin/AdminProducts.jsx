/**
 * @file AdminProducts.jsx
 * @description Componente de administración para la gestión integral del catálogo de productos.
 * Proporciona una interfaz avanzada para crear, editar y eliminar productos, gestionar
 * inventario por variantes, y configurar metadatos de marketing y SEO.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosConfig';
import { 
    Plus, Edit, Trash2, Search, Loader, X, Save, 
    Image as ImageIcon, Upload, Link as LinkIcon, 
    Star, Zap, Calendar, Package, Layers, Info, Settings,
    Check, Tag, Percent, Type, Grid3X3, DoorOpen
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getProductImage, compressImage } from '../../utils/imageUtils';
import AdminCategories from './AdminCategories';
import AdminCollections from './AdminCollections';
import AdminFeaturedProducts from './AdminFeaturedProducts';
import AdminSubcategoriesSection from './AdminSubcategoriesSection';

/**
 * @typedef {Object} ProductVariant
 * @property {string} size - Talla de la variante (ej: S, M, L)
 * @property {string} color - Color o estilo de la variante
 * @property {number} stock - Unidades disponibles
 * @property {string} sku - Código de inventario único
 */

/**
 * @typedef {Object} ProductFormData
 * @property {string|null} id - Identificador único (null para nuevos)
 * @property {string} title - Nombre comercial del producto
 * @property {string} description - Descripción detallada para la tienda
 * @property {string} category - Categoría principal del sistema
 * @property {string} sub_category - Subcategoría o nicho (ej: Naruto)
 * @property {string} parent_category - Categoría jerárquica superior
 * @property {number|string} price - Precio base de venta
 * @property {number} discount - Porcentaje de descuento (0-100)
 * @property {string} sku - SKU maestro del producto
 * @property {number} stock - Inventario total (calculado si hay variantes)
 * @property {string} tags - Etiquetas separadas por coma para búsqueda
 * @property {File|null} image_file - Archivo de imagen principal
 * @property {boolean} featured - Indica si es un producto destacado
 * @property {boolean} is_new - Indica si se muestra como novedad
 * @property {boolean} new_arrival - Duplicado semántico para compatibilidad de UI
 * @property {string} launch_date - Fecha programada de publicación
 * @property {string} lifecycle_state - Estado (Draft, Published, Legacy, Archived)
 * @property {ProductVariant[]} variants - Lista de variantes asociadas
 */

/**
 * Categorías estáticas del sistema para fallback en caso de error de conexión
 * o para inicialización del estado.
 */
const SYSTEM_CATEGORIES = [
    { label: 'Anime', value: 'anime' },
    { label: 'Arte', value: 'art' },
    { label: 'Música', value: 'music' },
    { label: 'Pop Culture', value: 'pop_culture' },
    { label: 'Tecnología', value: 'tech' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Personalizado', value: 'custom' }
];

/**
 * @component AdminProducts
 * @description Interfaz de gestión de catálogo de productos.
 * Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Borrar),
 * gestionar variantes de inventario, subir imágenes y controlar la 
 * visibilidad del stock.
 */
export default function AdminProducts() {
    const { t } = useLanguage();
    
    // Estados de datos
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'variants', 'marketing', 'advanced'
    
    // Entidades relacionadas
    const [availableCampaigns, setAvailableCampaigns] = useState([]);
    const [availableCollections, setAvailableCollections] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // Categorías dinámicas desde BD

    // Modal y formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        description: '',
        category: 'anime',
        sub_category: '',
        subcategory_id: '',
        parent_category: '',
        price: '',
        discount: 0,
        sku: '',
        stock: 0,
        tags: '',
        image_url: '',
        image_file: null,
        hover_image_url: '',
        hover_image_file: null,
        featured: false,
        show_on_home: false,
        is_new: false,
        new_arrival: false,
        launch_date: '',
        lifecycle_state: 'Published',
        priority: 0,
        campaign_id: '',
        collection_id: '',
        layout_preference: 'standard',
        admin_notes: '',
        variants: [] // Array de { size, color, stock, sku }
    });

    // Estado del upload de imagen e información dinámica
    const fileInputRef = useRef(null);
    const hoverFileInputRef = useRef(null);
    const [imageError, setImageError] = useState(false);
    const [hoverImageError, setHoverImageError] = useState(false);
    const [categories, setCategories] = useState(SYSTEM_CATEGORIES.map(c => c.value));
    const [subCategories, setSubCategories] = useState([]);
    const [customCategory, setCustomCategory] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [skuError, setSkuError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [hoverDragOver, setHoverDragOver] = useState(false);
    const [currentSection, setCurrentSection] = useState('products');
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');
    const [subcategoryList, setSubcategoryList] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchDynamicMetadata();
    }, []);

    // Cargar subcategorías para el dropdown del formulario cuando cambia la categoría
    useEffect(() => {
        const catSlug = formData.category;
        if (!catSlug) {
            setSubcategoryList([]);
            return;
        }
        const cat = allCategories.find(c => c.slug === catSlug);
        if (!cat) {
            setSubcategoryList([]);
            return;
        }
        api.get(`/subcategories?category_id=${cat.id}`)
            .then(res => setSubcategoryList(res.data || []))
            .catch(() => setSubcategoryList([]));
    }, [formData.category, allCategories]);

    /**
     * @function getCategoryDetails
     * @description Obtiene el objeto completo de categoría basado en el slug almacenado en el producto.
     */
    const getCategoryDetails = (slug) => {
        return allCategories.find(c => c.slug === slug) || { name: slug, icon: '🏷️' };
    };

    /**
     * Carga inicial de datos: Productos y Entidades relacionadas (Categorías, Campañas, etc.)
     */
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const [
                productsRes, 
                campaignsRes, 
                collectionsRes,
                categoriesRes
            ] = await Promise.all([
                api.get('/products/admin'),
                api.get('/campaigns'),
                api.get('/collections'),
                api.get('/categories')
            ]);
            
            setProducts(productsRes.data || []);
            setAvailableCampaigns(campaignsRes.data || []);
            setAvailableCollections(collectionsRes.data || []);
            setAllCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const response = await api.get('/campaigns');
            setAvailableCampaigns(response.data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    const fetchDynamicMetadata = async () => {
        try {
            const [catRes, subRes] = await Promise.all([
                api.get('/products/categories'),
                api.get('/products/sub-categories')
            ]);
            // Merge: DB categories + system categories (sin duplicados)
            const dbCats = catRes.data || [];
            const systemVals = SYSTEM_CATEGORIES.map(c => c.value);
            const merged = [...new Set([...systemVals, ...dbCats])];
            setCategories(merged);
            setSubCategories(subRes.data || []);
        } catch (error) {
            // Si falla el backend, usar categorías del sistema
            setCategories(SYSTEM_CATEGORIES.map(c => c.value));
            console.error('Error fetching metadata:', error);
        }
    };


    /**
     * Elimina un producto tras confirmar la acción con el usuario.
     * @param {number|string} id - ID del producto a eliminar.
     */
    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.confirm_delete') || '¿Estás seguro de eliminar este producto?')) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert(t('common.error') + ': ' + (error.response?.data?.error || error.message));
        }
    };

    /**
     * @function handleEdit
     * @description Prepara el formulario con los datos de un producto existente para su edición.
     * @param {Object} product - El producto a editar.
     */
    const handleEdit = (product) => {
        setFormData({
            id: product.id,
            title: product.title,
            description: product.description || '',
            category: product.category,
            sub_category: product.sub_category || '',
            subcategory_id: product.subcategory_id || '',
            parent_category: product.parent_category || '',
            price: product.price,
            discount: product.discount || 0,
            sku: product.sku || '',
            stock: product.stock || 0,
            tags: product.tags || '',
            image_url: product.image_url || '',
            image_file: null,
            hover_image_url: product.hover_image_url || '',
            hover_image_file: null,
            featured: product.featured || false,
            show_on_home: product.show_on_home || false,
            is_new: product.is_new || product.new_arrival || false,
            new_arrival: product.new_arrival || false,
            launch_date: product.launch_date ? new Date(product.launch_date).toISOString().split('T')[0] : '',
            lifecycle_state: product.lifecycle_state || 'Published',
            priority: product.priority || 0,
            campaign_id: product.campaign_id || '',
            collection_id: product.collection_id || '',
            layout_preference: product.layout_preference || 'standard',
            admin_notes: product.admin_notes || '',
            variants: product.variants || []
        });
        setImageError(false);
        setHoverImageError(false);
        setUploadError(null);
        setSkuError(null);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    /**
     * @function handleAddNew
     * @description Reinicia el formulario para crear un nuevo producto.
     */
    const handleAddNew = () => {
        setFormData({
            id: null,
            title: '',
            description: '',
            category: categories[0] || 'anime',
            subcategory_id: '',
            sub_category: '',
            parent_category: '',
            price: '',
            discount: 0,
            sku: '',
            stock: 0,
            tags: '',
            image_url: '',
            image_file: null,
            hover_image_url: '',
            hover_image_file: null,
        featured: false,
        show_on_home: false,
        is_new: false,
        new_arrival: false,
        launch_date: new Date().toISOString().split('T')[0],
            lifecycle_state: 'Published',
            priority: 0,
            campaign_id: '',
            collection_id: '',
            layout_preference: 'standard',
            admin_notes: '',
            variants: []
        });
        setImageError(false);
        setHoverImageError(false);
        setUploadError(null);
        setSkuError(null);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Recalcular stock total si hay variantes antes de guardar
            let finalStock = formData.stock;
            if (formData.variants && formData.variants.length > 0) {
                finalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
            }

            const productFormData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'variants') {
                    productFormData.append('variants', JSON.stringify(formData.variants));
                } else if (key === 'stock') {
                    productFormData.append('stock', finalStock);
                } else if (key === 'image_file' && formData.image_file) {
                    productFormData.append('image', formData.image_file);
                } else if (key === 'hover_image_file' && formData.hover_image_file) {
                    productFormData.append('hover_image', formData.hover_image_file);
                } else if (!['image_file', 'image_url', 'hover_image_file', 'hover_image_url'].includes(key)) {
                    productFormData.append(key, formData[key]);
                }
            });

            if (!formData.image_file && formData.image_url) {
                productFormData.append('image_url', formData.image_url);
            }
            if (!formData.hover_image_file && formData.hover_image_url) {
                productFormData.append('hover_image_url', formData.hover_image_url);
            }

            if (formData.id) {
                await api.put(`/products/${formData.id}`, productFormData);
            } else {
                await api.post('/products', productFormData);
            }

            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error("Error al guardar:", error);
            if (error.response?.status === 409) {
                setSkuError(error.response.data.error || 'El SKU ya existe');
                setActiveTab('basic');
            } else {
                alert((t('common.error') || "Error") + ': ' + (error.response?.data?.error || error.message));
            }
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
        const newVariants = formData.variants.map((v, i) => 
            i === index ? { ...v, [field]: value } : v
        );
        
        // Sincronizar stock total siempre que haya variantes
        const totalStock = newVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        
        setFormData({ ...formData, variants: newVariants, stock: totalStock });
    };

    const removeVariant = (index) => {
        const newVariants = formData.variants.filter((_, i) => i !== index);
        const totalStock = newVariants.length > 0 
            ? newVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
            : formData.stock;

        setFormData({
            ...formData,
            variants: newVariants,
            stock: totalStock
        });
    };

    const handleFileSelect = (e, type = 'main') => {
        const file = e.target.files?.[0];
        if (file) processImage(file, type);
    };

    const handleDragOver = (e, setDrag) => {
        e.preventDefault();
        setDrag(true);
    };

    const handleDragLeave = (e, setDrag) => {
        e.preventDefault();
        setDrag(false);
    };

    const handleDrop = (e, type = 'main') => {
        e.preventDefault();
        type === 'main' ? setDragOver(false) : setHoverDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processImage(file, type);
    };

    // Imagen
    const processImage = async (file, type = 'main') => {
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Solo se permiten imágenes (JPG, PNG, WebP, AVIF)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('La imagen es demasiado grande (máx 5MB)');
            return;
        }

        try {
            const compressedFile = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'main') {
                    setFormData(prev => ({ ...prev, image_file: compressedFile, image_url: reader.result }));
                    setImageError(false);
                } else {
                    setFormData(prev => ({ ...prev, hover_image_file: compressedFile, hover_image_url: reader.result }));
                    setHoverImageError(false);
                }
                setUploadError(null);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error al procesar imagen:', error);
            setUploadError('Error al procesar la imagen');
        }
    };

    const sectionTabs = [
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'categories', label: 'Categorías', icon: Tag },
        { id: 'collections', label: 'Colecciones', icon: Layers },
        { id: 'featured', label: 'Destacados', icon: Star },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            {/* Tabs de sección */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
                {sectionTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentSection(tab.id)}
                        style={{
                            padding: '0.7rem 1.5rem', border: 'none', borderRadius: '12px',
                            background: currentSection === tab.id ? 'var(--primary)' : 'transparent',
                            color: currentSection === tab.id ? 'black' : 'var(--text-secondary)',
                            fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {currentSection === 'products' && (
            <>
            {!selectedSubcategory ? (
                <>
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

                {/* Subcategorías */}
                <AdminSubcategoriesSection
                    allCategories={allCategories}
                    onEnterSubcategory={(id, name) => { setSelectedSubcategory(id); setSelectedSubcategoryName(name || ''); }}
                />
                </>
            ) : (
                <>
                {/* Vista dentro de subcategoría */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => { setSelectedSubcategory(null); setSelectedSubcategoryName(''); setSearchTerm(''); }}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#10b981', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <DoorOpen size={16} /> Volver
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                            {selectedSubcategoryName}
                        </h2>
                    </div>
                    <button onClick={handleAddNew} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Plus size={20} /> Nuevo Producto
                    </button>
                </div>
                </>
            )}

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
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Subcategoría</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ciclo / Info</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .filter(p => !selectedSubcategory || p.subcategory_id === selectedSubcategory)
                                    .map(product => (
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
                                            <span style={{ 
                                                padding: '0.3rem 0.6rem', border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '8px', background: 'rgba(255,255,255,0.03)', 
                                                fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                                            }}>
                                                <span>{getCategoryDetails(product.category).icon}</span>
                                                <span style={{ fontWeight: '600' }}>{getCategoryDetails(product.category).name}</span>
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <span style={{padding: '0.3rem 0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', textTransform: 'capitalize'}}>
                                                {product.subcategory_name || product.sub_category || '—'}
                                            </span>
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
                                        <td style={{ padding: '1rem 1.2rem', fontWeight: '700', color: '#00ff08ff' }}>${product.price}</td>
                                        <td style={{ padding: '1rem 1.2rem' }}>
                                            <span style={{ 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '8px', 
                                                background: product.lifecycle_state === 'Legacy' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                                                color: product.lifecycle_state === 'Legacy' ? '#ef4444' : '#10b981',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {product.lifecycle_state || 'Published'}
                                            </span>
                                            {product.campaign_id && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Zap size={12} /> Evento Asignado
                                                </div>
                                            )}
                                        </td>
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
                                    { id: 'marketing', label: 'Marketing', icon: Star },
                                    { id: 'advanced', label: 'Avanzado', icon: Settings }
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
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Título</label>
                                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">SKU General</label>
                                                    <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="input-field" placeholder="P-001" style={skuError ? { borderColor: '#ef4444' } : {}} />
                                                    {skuError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>{skuError}</p>}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Categoría</label>
                                                    <select
                                                        value={customCategory ? '__custom__' : (allCategories.find(c => c.slug === formData.category) ? formData.category : '__custom__')}
                                                        onChange={e => {
                                                            if (e.target.value === '__custom__') {
                                                                setCustomCategory(true);
                                                            } else {
                                                                setCustomCategory(false);
                                                                setFormData({ ...formData, category: e.target.value });
                                                            }
                                                        }}
                                                        className="input-field"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <option value="">Seleccionar categoría...</option>
                                                        {allCategories.map(cat => (
                                                            <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
                                                        ))}
                                                        <option value="__custom__">✏️ Personalizado...</option>
                                                    </select>
                                                    {(customCategory || (!allCategories.find(c => c.slug === formData.category) && formData.category)) && (
                                                        <input
                                                            type="text"
                                                            value={formData.category}
                                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                            className="input-field"
                                                            placeholder="Escribe la categoría personalizada"
                                                            style={{ marginTop: '0.5rem' }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">Subcategoría</label>
                                                    <select
                                                        value={formData.subcategory_id}
                                                        onChange={e => {
                                                            const selectedId = e.target.value;
                                                            setFormData({ ...formData, subcategory_id: selectedId });
                                                        }}
                                                        className="input-field"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <option value="">Sin subcategoría</option>
                                                        {subcategoryList.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Precio Base ($)</label>
                                                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="input-field" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">Descuento (%)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input 
                                                            type="number" 
                                                            min="0" max="100" 
                                                            value={formData.discount} 
                                                            onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })} 
                                                            className="input-field" 
                                                        />
                                                        <Percent size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label-text">Stock {formData.variants?.length > 0 ? '(Calculado de variantes)' : 'General'}</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.stock} 
                                                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} 
                                                    className="input-field"
                                                    disabled={formData.variants?.length > 0}
                                                    style={formData.variants?.length > 0 ? { opacity: 0.6, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)' } : {}}
                                                />
                                                {formData.variants?.length > 0 && (
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                                                        * El stock está siendo gestionado por las variantes en la pestaña "Variantes".
                                                    </p>
                                                )}
                                            </div>

                                            {/* Imagen Section */}
                                            <div style={{ marginTop: '1rem' }}>
                                                <label className="label-text" style={{ marginBottom: '1rem', display: 'block' }}>Imagen Principal</label>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <div 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onDragOver={e => handleDragOver(e, setDragOver)}
                                                        onDragLeave={e => handleDragLeave(e, setDragOver)}
                                                        onDrop={e => handleDrop(e, 'main')}
                                                        style={{ 
                                                            width: '120px', height: '120px', borderRadius: '16px', 
                                                            border: `2px dashed ${dragOver ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, 
                                                            background: dragOver ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                                            transition: 'all 0.3s',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <AnimatePresence>
                                                            {dragOver && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    style={{
                                                                        position: 'absolute', inset: 0, 
                                                                        background: 'rgba(var(--primary-rgb), 0.9)',
                                                                        display: 'flex', flexDirection: 'column', 
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        color: 'white', zIndex: 2, gap: '0.5rem'
                                                                    }}
                                                                >
                                                                    <Upload size={20} />
                                                                    <span style={{ fontSize: '0.6rem', fontWeight: '700', textAlign: 'center' }}>SUELTA AQUÍ</span>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {formData.image_url ? (
                                                            <img 
                                                                src={formData.image_url.startsWith('data:') ? formData.image_url : getProductImage(null, formData.image_url)} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                alt="" 
                                                                onError={() => setImageError(true)}
                                                            />
                                                        ) : (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <Upload size={24} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }} />
                                                                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Arrastra o clic</p>
                                                            </div>
                                                        )}
                                                        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'main')} accept="image/*" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.8rem' }}>
                                                            {formData.image_file ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Check size={14} style={{ color: '#22c55e' }} />
                                                                    <span style={{ color: 'white' }}>{formData.image_file.name}</span>
                                                                </div>
                                                            ) : (
                                                                formData.image_url ? 'Imagen actual del producto' : 'Arrastra o haz clic para subir'
                                                            )}
                                                        </div>
                                                        {imageError && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '0.8rem' }}>
                                                                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: '600' }}>⚠️ Esta imagen no carga correctamente</span>
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem' }}>
                                                            <div className="tooltip-container">
                                                                <Info size={14} style={{ color: 'var(--primary)' }} />
                                                                <div className="tooltip-content">
                                                                    <strong>Guía de Imagen:</strong><br/>
                                                                    • <strong>Vertical (4:5):</strong> Recomendado para catálogo estándar.<br/>
                                                                    • <strong>Horizontal (16:9):</strong> Para productos tipo "Hero".<br/>
                                                                    • <strong>Cuadrado (1:1):</strong> Formato flexible.<br/>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                                        <div className="ratio-preview ratio-4-5">4:5</div>
                                                                        <div className="ratio-preview ratio-16-9">16:9</div>
                                                                        <div className="ratio-preview ratio-1-1">1:1</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Usa proporción 4:5 para mejor visualización.</span>
                                                        </div>
                                                        {uploadError && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.5rem' }}>{uploadError}</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Imagen Hover Section */}
                                            <div style={{ marginTop: '1rem' }}>
                                                <label className="label-text" style={{ marginBottom: '1rem', display: 'block' }}>Imagen al Pasar el Mouse (Hover)</label>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <div 
                                                        onClick={() => hoverFileInputRef.current?.click()}
                                                        onDragOver={e => handleDragOver(e, setHoverDragOver)}
                                                        onDragLeave={e => handleDragLeave(e, setHoverDragOver)}
                                                        onDrop={e => handleDrop(e, 'hover')}
                                                        style={{ 
                                                            width: '120px', height: '120px', borderRadius: '16px', 
                                                            border: `2px dashed ${hoverDragOver ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, 
                                                            background: hoverDragOver ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                                            transition: 'all 0.3s',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <AnimatePresence>
                                                            {hoverDragOver && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    style={{
                                                                        position: 'absolute', inset: 0, 
                                                                        background: 'rgba(var(--primary-rgb), 0.9)',
                                                                        display: 'flex', flexDirection: 'column', 
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        color: 'white', zIndex: 2, gap: '0.5rem'
                                                                    }}
                                                                >
                                                                    <Upload size={20} />
                                                                    <span style={{ fontSize: '0.6rem', fontWeight: '700', textAlign: 'center' }}>SUELTA AQUÍ</span>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {formData.hover_image_url ? (
                                                            <img 
                                                                src={formData.hover_image_url.startsWith('data:') ? formData.hover_image_url : getProductImage(null, formData.hover_image_url)} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                alt="" 
                                                                onError={() => setHoverImageError(true)}
                                                            />
                                                        ) : (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <Upload size={24} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }} />
                                                                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Arrastra o clic</p>
                                                            </div>
                                                        )}
                                                        <input ref={hoverFileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'hover')} accept="image/*" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.8rem' }}>
                                                            {formData.hover_image_file ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Check size={14} style={{ color: '#22c55e' }} />
                                                                    <span style={{ color: 'white' }}>{formData.hover_image_file.name}</span>
                                                                </div>
                                                            ) : (
                                                                formData.hover_image_url ? 'Imagen actual del producto' : 'Arrastra o haz clic para subir'
                                                            )}
                                                        </div>
                                                        {hoverImageError && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '0.8rem' }}>
                                                                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: '600' }}>⚠️ Esta imagen no carga correctamente</span>
                                                            </div>
                                                        )}
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
                                                            Esta imagen se mostrará cuando el usuario pase el mouse sobre el producto en la tienda.
                                                        </p>
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
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
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

                                                <div 
                                                    onClick={() => setFormData({ ...formData, show_on_home: !formData.show_on_home })}
                                                    style={{ 
                                                        padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                                                        background: formData.show_on_home ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${formData.show_on_home ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <Package size={24} color={formData.show_on_home ? '#22c55e' : '#666'} />
                                                        <div style={{ width: '40px', height: '20px', borderRadius: '20px', background: formData.show_on_home ? '#22c55e' : '#333', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: '2px', left: formData.show_on_home ? '22px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                                        </div>
                                                    </div>
                                                    <h5 style={{ fontWeight: '700', marginBottom: '0.3rem' }}>Mostrar en Home</h5>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aparecerá en la sección "Explora el Catálogo" de la página principal.</p>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={16} /> Fecha de Lanzamiento
                                                </label>
                                                <input type="date" value={formData.launch_date} onChange={e => setFormData({ ...formData, launch_date: e.target.value })} className="input-field" />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="label-text">Estado del Ciclo de Vida</label>
                                                    <select 
                                                        value={formData.lifecycle_state} 
                                                        onChange={e => setFormData({ ...formData, lifecycle_state: e.target.value })} 
                                                        className="custom-select"
                                                    >
                                                        <option value="Draft">Borrador (Oculto)</option>
                                                        <option value="Published">Publicado (Activo)</option>
                                                        <option value="Legacy">Legado (Versión anterior)</option>
                                                        <option value="Archived">Archivado (Solo histórico)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="label-text">Prioridad (Orden)</label>
                                                    <input 
                                                        type="number" 
                                                        value={formData.priority} 
                                                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} 
                                                        className="input-field" 
                                                        placeholder="0 es normal, mayor es más arriba"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                 <div className="form-group">
                                                     <label className="label-text">Colección</label>
                                                     <select 
                                                         value={formData.collection_id} 
                                                         onChange={e => setFormData({ ...formData, collection_id: e.target.value })} 
                                                         className="custom-select"
                                                     >
                                                         <option value="">Sin Colección</option>
                                                         {availableCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                     </select>
                                                 </div>
                                            </div>

                                             <div className="form-group">
                                                 <label className="label-text">Evento (Campaña / Temporada)</label>
                                                 <select 
                                                     value={formData.campaign_id} 
                                                     onChange={e => setFormData({ ...formData, campaign_id: e.target.value })} 
                                                     className="custom-select"
                                                 >
                                                     <option value="">Sin Evento Específico</option>
                                                     {availableCampaigns.map(camp => (
                                                         <option key={camp.id} value={camp.id}>
                                                             {camp.type === 'season' ? '🍂 ' : '🔥 '} {camp.name} {camp.is_active ? '(Activo)' : ''}
                                                         </option>
                                                     ))}
                                                 </select>
                                             </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'advanced' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div className="form-group">
                                                <label className="label-text">Preferencia de Layout (Composición)</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                    {[
                                                        { id: 'standard', label: 'Estándar', desc: '4:5 Grid' },
                                                        { id: 'portrait', label: 'Retrato', desc: 'Full Height' },
                                                        { id: 'hero', label: 'Hero', desc: 'Featured 16:9' }
                                                    ].map(opt => (
                                                        <div 
                                                            key={opt.id}
                                                            onClick={() => setFormData({ ...formData, layout_preference: opt.id })}
                                                            style={{ 
                                                                padding: '1rem', borderRadius: '12px', border: `1px solid ${formData.layout_preference === opt.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                                                background: formData.layout_preference === opt.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{opt.label}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label-text">Notas Internas (Admin)</label>
                                                <textarea 
                                                    value={formData.admin_notes} 
                                                    onChange={e => setFormData({ ...formData, admin_notes: e.target.value })} 
                                                    className="input-field" 
                                                    style={{ minHeight: '120px', fontSize: '0.85rem' }}
                                                    placeholder="Notas sobre el lanzamiento, ideas o recordatorios..."
                                                />
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
                    z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
                }
                .label-text { font-size: 0.85rem; font-weight: 600; color: #aaa; margin-bottom: 0.5rem; display: block; }
                .input-field { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; color: white; transition: all 0.3s; }
                .input-field:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.08); }
                .input-field-small { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem; color: white; font-size: 0.8rem; }
                .custom-select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; color: white; cursor: pointer; }
                .table-row-hover:hover { background: rgba(255,255,255,0.02); }
                .icon-btn-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: all 0.2s; }
                .icon-btn-blue:hover { background: #3b82f6; color: white; transform: translateY(-2px); }
                .icon-btn-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: all 0.2s; }
                .icon-btn-red:hover { background: #ef4444; color: white; transform: translateY(-2px); }
                .close-btn { background: rgba(255,255,255,0.05); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                
                .tooltip-container { position: relative; display: inline-block; cursor: help; }
                .tooltip-content {
                    position: absolute; bottom: 120%; left: 0; width: 220px;
                    background: #1a1a1a; color: white; padding: 1rem; border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem;
                    opacity: 0; visibility: hidden; transition: all 0.3s; z-index: 100;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .tooltip-container:hover .tooltip-content { opacity: 1; visibility: visible; bottom: 130%; }
                .ratio-preview { 
                    margin-top: 0.8rem; border: 1px solid var(--primary); 
                    background: rgba(var(--primary-rgb), 0.1); border-radius: 4px;
                    display: flex; align-items: center; justify-content: center; font-size: 0.6rem;
                }
                .ratio-4-5 { width: 40px; height: 50px; }
                .ratio-16-9 { width: 60px; height: 34px; }
                .ratio-1-1 { width: 40px; height: 40px; }
            `}</style>
            </>
        )}

        {currentSection === 'categories' && <AdminCategories />}
        {currentSection === 'collections' && <AdminCollections />}
        {currentSection === 'featured' && <AdminFeaturedProducts />}
        </motion.div>
    );
}
