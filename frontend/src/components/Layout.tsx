import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLOR: Record<string, string> = {
    admin: '#a78bfa',
    faculty: '#60a5fa',
    organizer: '#34d399',
    student: '#fbbf24',
};

const ROLE_BG: Record<string, string> = {
    admin: 'rgba(167,139,250,0.12)',
    faculty: 'rgba(96,165,250,0.12)',
    organizer: 'rgba(52,211,153,0.12)',
    student: 'rgba(251,191,36,0.12)',
};

interface NavItem {
    path: string;
    label: string;
    icon: string;
    roles?: string[]; // undefined = all roles
}

const NAV_ITEMS: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/my-registrations', label: 'My Registrations', icon: '🎟️', roles: ['student'] },
    { path: '/ai', label: 'AI Agent', icon: '✦' },
    { path: '/event-planner', label: 'Event Planner', icon: '⊕', roles: ['admin', 'faculty', 'organizer'] },
    { path: '/institutional-memory', label: 'Knowledge Base', icon: '⊗', roles: ['admin', 'faculty', 'organizer'] },
    { path: '/analytics', label: 'Analytics', icon: '◈', roles: ['admin', 'faculty'] },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const visibleNav = NAV_ITEMS.filter(
        item => !item.roles || item.roles.includes(user.role)
    );

    const roleColor = ROLE_COLOR[user.role] ?? '#94a3b8';
    const roleBg = ROLE_BG[user.role] ?? 'rgba(148,163,184,0.12)';
    const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080c18',
            display: 'flex',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            color: '#e2e8f0',
        }}>
            {/* Global font import */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
            `}</style>

            {/* Sidebar */}
            <aside style={{
                width: collapsed ? 64 : 240,
                minHeight: '100vh',
                background: '#0c1120',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.25s ease',
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden',
            }}>
                {/* Logo */}
                <div style={{
                    padding: collapsed ? '20px 16px' : '20px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    justifyContent: collapsed ? 'center' : 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard')}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                        }}>⚡</div>
                        {!collapsed && (
                            <span style={{
                                fontWeight: 700,
                                fontSize: 16,
                                color: '#f1f5f9',
                                letterSpacing: '-0.02em',
                                whiteSpace: 'nowrap',
                            }}>CampusOS</span>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#475569',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 4,
                                borderRadius: 4,
                                lineHeight: 1,
                            }}
                            title="Collapse sidebar"
                        >◀</button>
                    )}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(false)}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 70,
                                transform: 'translateX(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#475569',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 4,
                            }}
                            title="Expand sidebar"
                        >▶</button>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
                    {!collapsed && (
                        <p style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#334155',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0 12px',
                            marginBottom: 8,
                        }}>Navigation</p>
                    )}
                    {visibleNav.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: collapsed ? 0 : 10,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    padding: collapsed ? '10px 0' : '9px 12px',
                                    borderRadius: 9,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: isActive ? 600 : 400,
                                    fontFamily: 'inherit',
                                    color: isActive ? '#c7d2fe' : '#64748b',
                                    background: isActive
                                        ? 'rgba(99,102,241,0.12)'
                                        : 'transparent',
                                    borderLeft: isActive && !collapsed
                                        ? '2px solid #6366f1'
                                        : '2px solid transparent',
                                    marginBottom: 2,
                                    transition: 'all 0.15s ease',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.color = '#94a3b8';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#64748b';
                                    }
                                }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                                {!collapsed && item.path === '/ai' && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: '#6366f1',
                                        background: 'rgba(99,102,241,0.15)',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                    }}>AI</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User card */}
                <div style={{
                    padding: collapsed ? '12px 8px' : '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {!collapsed ? (
                        <div style={{
                            background: roleBg,
                            border: `1px solid ${roleColor}22`,
                            borderRadius: 10,
                            padding: '10px 12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${roleColor}66, ${roleColor}33)`,
                                    border: `1px solid ${roleColor}44`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: roleColor,
                                    flexShrink: 0,
                                }}>{initials}</div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {user.display_name}
                                    </p>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: roleColor }}>
                                        {user.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#64748b',
                                    padding: '5px 0',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = '#64748b';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                            >Sign out</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            title="Sign out"
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: '#475569',
                                cursor: 'pointer',
                                fontSize: 16,
                                padding: '8px 0',
                                textAlign: 'center',
                            }}
                        >↩</button>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
