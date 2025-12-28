import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, LogOut, Shield, Trash2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RepairKit() {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const fetchProfile = async () => {
        if (!user) return;
        setLoading(true);
        addLog("Fetching profile...");
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                addLog(`Info: Profile not found or error: ${error.message}`);
                setProfile(null);
            } else {
                setProfile(data);
                addLog(`Success: Profile found. Role: ${data.role}`);
            }
        } catch (e) {
            addLog(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const forceMakeAdmin = async () => {
        if (!user) return;
        setLoading(true);
        addLog("Attempting to force Admin role...");
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    role: 'admin',
                    full_name: 'Admin User (Forced)'
                });

            if (error) throw error;
            addLog("Success: Role updated to 'admin'.");
            fetchProfile();
        } catch (e) {
            addLog(`Error updating role: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchProfile();
        else addLog("No user logged in.");
    }, [user]);

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem', color: 'white' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', background: '#1a1a1a', padding: '2rem', borderRadius: '16px', border: '1px solid #333' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield color="var(--primary)" /> Repair Kit
                </h1>

                {/* User Info Block */}
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#222', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>CURRENT AUTH SESSION</h3>
                    {user ? (
                        <div style={{ fontSize: '0.9rem' }}>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>ID:</strong> {user.id}</p>
                            <p><strong>DB Role:</strong> <span style={{ color: profile?.role === 'admin' ? '#10b981' : '#f59e0b' }}>{profile?.role || 'NONE'}</span></p>
                        </div>
                    ) : (
                        <p style={{ color: '#ef4444' }}>Not Logged In</p>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gap: '1rem' }}>

                    {/* Action 1: Fix Admin */}
                    <button
                        onClick={forceMakeAdmin}
                        disabled={!user || loading}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
                    >
                        <Shield size={18} /> Force "Admin" Role
                    </button>

                    {/* Action 2: Logout */}
                    <button
                        onClick={() => signOut()}
                        className="btn-primary"
                        style={{ background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
                    >
                        <LogOut size={18} /> Force Log Out
                    </button>

                    {/* Action 3: Refresh Info */}
                    <button
                        onClick={fetchProfile}
                        disabled={loading}
                        style={{ background: '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh Data
                    </button>

                    <Link to="/admin" style={{ textAlign: 'center', padding: '1rem', color: '#10b981', textDecoration: 'none', border: '1px solid #10b981', borderRadius: '8px' }}>
                        Try Entering Admin Panel →
                    </Link>

                    <Link to="/" style={{ textAlign: 'center', padding: '1rem', color: '#888', textDecoration: 'none' }}>
                        Back to Home
                    </Link>
                </div>

                {/* Logs Console */}
                <div style={{ marginTop: '2rem', background: 'black', padding: '1rem', borderRadius: '8px', height: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid #333' }}>
                    {logs.length === 0 && <span style={{ color: '#555' }}>Waiting for actions...</span>}
                    {logs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '0.2rem', color: '#ccc' }}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
