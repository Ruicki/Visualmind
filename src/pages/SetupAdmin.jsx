import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SetupAdmin() {
    const { user } = useAuth();
    const [status, setStatus] = useState('checking'); // checking, success, error, unauthorized
    const [message, setMessage] = useState('Checking permissions...');

    useEffect(() => {
        if (!user) {
            setStatus('unauthorized');
            return;
        }

        const grantAdmin = async () => {
            try {
                // Upsert profile (Update if exists, Insert if not)
                // This handles users created before the profiles table existed
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        role: 'admin',
                        full_name: user.user_metadata?.full_name || 'Admin User'
                    });

                if (error) throw error;

                // Force a session refresh to reflect changes if needed
                // (Supabase session usually caches user metadata, but we check 'profiles' table directly in views so it should be fine)

                setStatus('success');
                setMessage(`Success! User ${user.email} is now an Admin. Profile synced.`);
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err.message);
            }
        };

        grantAdmin();
    }, [user]);

    if (!user) return (
        <div style={{ paddingTop: '150px', textAlign: 'center', color: 'white' }}>
            <h2>Please <Link to="/login" style={{ color: 'var(--primary)' }}>Log In</Link> first.</h2>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '150px', paddingBottom: '4rem', textAlign: 'center', color: 'white' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                {status === 'success' ? (
                    <>
                        <ShieldCheck size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>Admin Access Granted</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
                        <Link to="/admin" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '1rem 2rem', marginRight: '1rem' }}>
                            Go to Admin Panel
                        </Link>
                        <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', padding: '1rem 2rem', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'white' }}>
                            Back Home
                        </Link>
                    </>
                ) : status === 'error' ? (
                    <>
                        <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>Error</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{message}</p>
                    </>
                ) : (
                    <>
                        <div className="loader spin" style={{ margin: '0 auto 1.5rem' }}></div>
                        <p>Updating permissions...</p>
                    </>
                )}
            </div>
        </div>
    );
}
