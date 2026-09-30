import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader, CheckCircle } from 'lucide-react';
import api from '../api/axiosConfig';
import { useLanguage } from '../context/LanguageContext';
import { whatsappLink } from '../config/storeConfig';

const PASSWORD_PATTERN = '(?=.*[A-Za-z])(?=.*\\d).{8,}';

/**
 * @component ResetPassword
 * @description Cambia la contraseña con el enlace de un solo uso que envía la tienda.
 */
export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError(t('auth.passwords_mismatch', 'Las contraseñas no coinciden.'));
            return;
        }
        setStatus('sending');
        setError('');
        try {
            await api.post('/auth/reset-password', { token, password });
            setStatus('done');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setStatus('idle');
            setError(err.response?.data?.message || t('auth.reset_error', 'No se pudo cambiar la contraseña.'));
        }
    };

    const inputStyle = {
        width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', background: 'var(--bg-primary)',
        border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
    };

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', paddingBottom: '4rem' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{t('auth.reset_title', 'Nueva contraseña')}</h1>
                {!token ? (
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t('auth.reset_missing', 'Este enlace no es válido. Pídenos uno nuevo por')}{' '}
                        <a href={whatsappLink('Hola, necesito un enlace para cambiar mi contraseña.')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>WhatsApp</a>.
                    </p>
                ) : status === 'done' ? (
                    <p role="status" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                        <CheckCircle size={20} /> {t('auth.reset_done', 'Contraseña actualizada. Te llevamos al inicio de sesión…')}
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('auth.password_rules', 'Mínimo 8 caracteres, con letras y números')}</p>
                        {[['new-password', password, setPassword, t('auth.new_password', 'Nueva contraseña')],
                          ['confirm-password', confirm, setConfirm, t('auth.confirm_password', 'Repite la contraseña')]].map(([id, value, setter, label]) => (
                            <div key={id} style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input id={id} type="password" required minLength={8} pattern={PASSWORD_PATTERN} autoComplete="new-password"
                                    aria-label={label} placeholder={label} value={value} onChange={(e) => setter(e.target.value)} style={inputStyle} />
                            </div>
                        ))}
                        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}
                        <button type="submit" className="btn-primary" disabled={status === 'sending'} style={{ height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {status === 'sending' ? <Loader className="spin" size={22} /> : t('auth.reset_submit', 'Guardar contraseña')}
                        </button>
                        <Link to="/login" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('auth.back_to_login', 'Volver a iniciar sesión')}</Link>
                    </form>
                )}
            </div>
        </div>
    );
}
