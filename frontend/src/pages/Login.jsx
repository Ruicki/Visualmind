import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';

export default function Login() {
    const { signIn, signUp } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(formData.email, formData.password);
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await signUp(formData.email, formData.password);
                if (error) throw error;
                alert(t('auth.success_create'));
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="reveal" style={{
                width: '100%',
                maxWidth: '450px',
                background: 'var(--bg-secondary)',
                borderRadius: '32px',
                padding: '3rem',
                border: '1px solid var(--border-light)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decor */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                    background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.05) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                        {isLogin ? t('auth.welcome') : t('auth.join')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? t('auth.login_subtitle') : t('auth.signup_subtitle')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255, 77, 77, 0.1)',
                        color: '#ff4d4d',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 77, 77, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="email"
                                placeholder={t('auth.email')}
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    borderRadius: '16px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-light)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                placeholder={t('auth.password')}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    borderRadius: '16px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-light)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            height: '55px',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            marginTop: '1rem',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? <Loader className="spin" size={24} /> : (
                            <>
                                {isLogin ? t('auth.sign_in') : t('auth.create_account')}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', position: 'relative' }}>
                    {isLogin ? t('auth.no_account') + " " : t('auth.has_account') + " "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                    >
                        {isLogin ? t('auth.sign_up') : t('auth.sign_in')}
                    </button>
                </div>
            </div>
        </div>
    );
}
