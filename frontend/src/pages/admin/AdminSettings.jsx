import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { Shield, Check, Loader, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminSettings() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [emailToPromote, setEmailToPromote] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handlePromote = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await api.post('/auth/promote', { email: emailToPromote });
            setMessage({ type: 'success', text: response.data.message || t('admin.success_promote') || 'Usuario promovido con éxito.' });
            setEmailToPromote('');
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '2rem' }}>{t('admin.settings_title') || 'Ajustes del Sistema'}</h2>

            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{t('admin.admin_mgmt') || 'Gestión de Administradores'}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('admin.admin_desc') || 'Promueve usuarios normales a administradores.'}</p>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('admin.promote_title') || 'Promover Usuario'}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {t('admin.promote_desc') || 'Ingresa el correo del usuario que deseas convertir en administrador.'}
                        <strong> {t('admin.promote_warn') || 'Esta acción no se puede deshacer fácilmente.'}</strong>
                    </p>

                    <form onSubmit={handlePromote} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={emailToPromote}
                            onChange={e => setEmailToPromote(e.target.value)}
                            style={{
                                flex: 1, padding: '0.8rem 1rem', borderRadius: '12px',
                                background: 'var(--bg-primary)', border: '1px solid var(--border-light)',
                                color: 'white', outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px' }}
                        >
                            {loading ? <Loader className="spin" size={18} /> : <Check size={18} />}
                            {t('admin.promote_btn') || 'Promover'}
                        </button>
                    </form>

                    {message && (
                        <div style={{
                            marginTop: '1.5rem', padding: '1rem', borderRadius: '12px',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{t('admin.your_profile') || 'Tu Perfil'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{user?.email}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {t('admin.role_label') || 'Rol'}: <span style={{ color: '#3b82f6', fontWeight: 'bold', textTransform: 'capitalize' }}>{user?.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
