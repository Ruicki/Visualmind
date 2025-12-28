import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit, Trash2, Search, Loader, X, Save, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminProducts() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
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

    useEffect(() => {
        fetchProducts();
    }, []);

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
            console.error('Error fetching products:', error);
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

            if (formData.id) {
                // Update
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', formData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchProducts(); // Refresh list
        } catch (error) {
            alert(t('common.error') + ': ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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

            {/* Search Bar */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '1rem', border: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder={t('admin.search_products')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none',
                            padding: '0.8rem 0.8rem 0.8rem 3rem', borderRadius: '10px', color: 'white', outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Products Table */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /></div>
                ) : products.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {t('admin.no_products')}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Image</th>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.8rem', width: 'fit-content' }}>{product.category}</span>
                                            {product.sub_category && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{product.sub_category}</span>}
                                        </div>
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
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="reveal" style={{
                        width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)',
                        borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                                {formData.id ? t('admin.edit_product') : t('admin.add_product')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('admin.label_title')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('admin.label_category')}</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                    >
                                        <option value="anime">Anime</option>
                                        <option value="videojuegos">Videojuegos</option>
                                        <option value="deportes">Deportes</option>
                                        <option value="caricaturas">Caricaturas</option>
                                        <option value="sanvalentin">San Valentín</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('admin.label_subcategory')}</label>
                                    <input
                                        type="text"
                                        value={formData.sub_category}
                                        onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                                        placeholder="e.g. One Piece"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('admin.label_price')} ($)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('admin.label_image')}</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    placeholder="https://..."
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
                                />
                                {formData.image_url && (
                                    <div style={{ marginTop: '1rem', width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#333' }}>
                                        <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn-primary"
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', marginTop: '1rem', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {isSaving ? <Loader className="spin" /> : <Save size={20} />}
                                {isSaving ? t('admin.saving') : t('admin.save_product')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
