import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';

const ROLE_COLOR: Record<string, string> = {
    admin: '#8b5cf6',
    faculty: '#3b82f6',
    organizer: '#10b981',
    student: '#f59e0b',
};

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.access_token, data.user);
                navigate(from, { replace: true });
            } else if (response.status === 401) {
                setError('Invalid email or password.');
            } else if (response.status === 422) {
                setError('Please provide both email and password.');
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || 'Failed to sign in. Please try again.');
            }
        } catch {
            setError('Cannot reach the server. Please ensure CampusOS backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const DEMO_ACCOUNTS = [
        { role: 'admin', email: 'admin@campus.edu', color: ROLE_COLOR.admin },
        { role: 'faculty', email: 'prof.smith@campus.edu', color: ROLE_COLOR.faculty },
        { role: 'organizer', email: 'organizer@campus.edu', color: ROLE_COLOR.organizer },
        { role: 'student', email: 'student@campus.edu', color: ROLE_COLOR.student },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8F9FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                input:focus { outline: none; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Decorative background elements */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(248,249,251,0) 70%)',
                borderRadius: '50%', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', right: '-5%', width: '50vw', height: '50vw',
                background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, rgba(248,249,251,0) 70%)',
                borderRadius: '50%', zIndex: 0
            }} />

            <div style={{
                width: '100%',
                maxWidth: 440,
                animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        margin: '0 auto 20px',
                        boxShadow: '0 12px 36px rgba(99,102,241,0.35)',
                        transform: 'rotate(-5deg)',
                        transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-5deg)'}
                    >⚡</div>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        margin: '0 0 8px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #4f46e5 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'gradientShift 4s ease infinite',
                    }}>CampusOS</h1>
                    <p style={{ color: '#64748b', fontSize: 15, margin: 0, fontWeight: 500 }}>
                        One Campus. One Memory. One Intelligence.
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 24,
                    padding: '36px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
                }}>
                    <h2 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 28px',
                        letterSpacing: '-0.01em',
                    }}>Sign in to your account</h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fca5a5',
                                borderRadius: 12,
                                padding: '12px 16px',
                                marginBottom: 20,
                                color: '#ef4444',
                                fontSize: 14,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <span style={{ fontSize: 16 }}>⚠️</span>{error}
                            </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: 8,
                            }}>Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@campus.edu"
                                style={{
                                    width: '100%',
                                    background: '#F8F9FB',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    color: '#0f172a',
                                    fontSize: 15,
                                    fontFamily: 'inherit',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.background = '#ffffff';
                                    e.target.style.borderColor = '#818cf8';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
                                }}
                                onBlur={e => {
                                    if (!e.target.value) e.target.style.background = '#F8F9FB';
                                    e.target.style.borderColor = '#E2E8F0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: 8,
                            }}>Password</label>
                            <input
                                id="login-password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    background: '#F8F9FB',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    color: '#0f172a',
                                    fontSize: 15,
                                    fontFamily: 'inherit',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.background = '#ffffff';
                                    e.target.style.borderColor = '#818cf8';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
                                }}
                                onBlur={e => {
                                    if (!e.target.value) e.target.style.background = '#F8F9FB';
                                    e.target.style.borderColor = '#E2E8F0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                background: isLoading
                                    ? '#818cf8'
                                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px',
                                color: '#fff',
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                            }}
                            onMouseEnter={e => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.5)';
                                }
                            }}
                            onMouseLeave={e => { 
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)';
                                }
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span style={{
                                        width: 16, height: 16,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Signing in…
                                </>
                            ) : 'Sign in to CampusOS'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <span style={{ height: 1, flex: 1, background: '#E2E8F0' }} />
                            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                                Quick Login (Demo)
                            </p>
                            <span style={{ height: 1, flex: 1, background: '#E2E8F0' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {DEMO_ACCOUNTS.map(acct => (
                                <button
                                    key={acct.role}
                                    onClick={() => { setEmail(acct.email); setPassword('password123'); }}
                                    style={{
                                        background: '#ffffff',
                                        border: `1px solid ${acct.color}33`,
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = `${acct.color}08`;
                                        e.currentTarget.style.borderColor = `${acct.color}66`;
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.borderColor = `${acct.color}33`;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: acct.color, margin: '0 0 2px' }}>
                                        {acct.role}
                                    </p>
                                    <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {acct.email}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
