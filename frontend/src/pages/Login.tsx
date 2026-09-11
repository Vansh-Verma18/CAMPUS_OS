import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';

const ROLE_COLOR: Record<string, string> = {
    admin: '#a78bfa',
    faculty: '#60a5fa',
    organizer: '#34d399',
    student: '#fbbf24',
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
            background: 'linear-gradient(135deg, #080c18 0%, #0d1321 60%, #080c18 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            padding: '24px',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                input:focus { outline: none; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: 440,
                animation: 'fadeUp 0.5s ease',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                    }}>⚡</div>
                    <h1 style={{
                        fontSize: 26,
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        margin: '0 0 6px',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #c7d2fe 60%, #818cf8 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'gradientShift 4s ease infinite',
                    }}>CampusOS</h1>
                    <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                        One Campus. One Memory. One Intelligence.
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    padding: '32px',
                    backdropFilter: 'blur(12px)',
                }}>
                    <h2 style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#f1f5f9',
                        margin: '0 0 24px',
                    }}>Sign in to your account</h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 10,
                                padding: '10px 14px',
                                marginBottom: 16,
                                color: '#f87171',
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}>
                                <span>⚠</span>{error}
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 500,
                                color: '#94a3b8',
                                marginBottom: 6,
                                letterSpacing: '0.02em',
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
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                    color: '#f1f5f9',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 500,
                                color: '#94a3b8',
                                marginBottom: 6,
                                letterSpacing: '0.02em',
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
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                    color: '#f1f5f9',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
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
                                    ? 'rgba(99,102,241,0.4)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: 10,
                                padding: '12px',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                            onMouseEnter={e => {
                                if (!isLoading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.45)';
                            }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {isLoading ? (
                                <>
                                    <span style={{
                                        width: 14, height: 14,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Signing in…
                                </>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Demo accounts — password: password123
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {DEMO_ACCOUNTS.map(acct => (
                                <button
                                    key={acct.role}
                                    onClick={() => { setEmail(acct.email); setPassword('password123'); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${acct.color}22`,
                                        borderRadius: 8,
                                        padding: '7px 10px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = `${acct.color}11`;
                                        e.currentTarget.style.borderColor = `${acct.color}44`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.borderColor = `${acct.color}22`;
                                    }}
                                >
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: acct.color, marginBottom: 1 }}>
                                        {acct.role}
                                    </p>
                                    <p style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
