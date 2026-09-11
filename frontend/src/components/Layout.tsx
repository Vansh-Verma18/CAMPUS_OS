import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLOR: Record<string, string> = {
    admin: '#4c51bf',
    faculty: '#3182ce',
    organizer: '#38a169',
    student: '#d69e2e',
};

const ROLE_BG: Record<string, string> = {
    admin: '#eef2ff',
    faculty: '#ebf8ff',
    organizer: '#f0fff4',
    student: '#fffaf0',
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
    { path: '/clubs', label: 'Clubs', icon: '🏛️' },
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
    const [searchFocused, setSearchFocused] = useState(false);

    if (!user) return null;

    const visibleNav = NAV_ITEMS.filter(
        item => !item.roles || item.roles.includes(user.role)
    );

    const roleColor = ROLE_COLOR[user.role] ?? '#4a5568';
    const roleBg = ROLE_BG[user.role] ?? '#f7fafc';
    const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    // Get current page title
    const currentItem = NAV_ITEMS.find(item => item.path === location.pathname);
    const pageTitle = currentItem?.label ?? 'CampusOS';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            display: 'flex',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            color: '#1a2332',
        }}>
            {/* Sidebar */}
            <aside style={{
                width: collapsed ? 72 : 260,
                minHeight: '100vh',
                background: '#ffffff',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.2s ease',
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden',
            }}>
                {/* Logo */}
                <div style={{
                    padding: collapsed ? '24px 16px' : '24px',
                    borderBottom: '1px solid #edf2f7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: collapsed ? 'center' : 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard')}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: '#4c51bf',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                            color: '#ffffff',
                        }}>🎓</div>
                        {!collapsed && (
                            <span style={{
                                fontWeight: 600,
                                fontSize: 18,
                                color: '#1a2332',
                                letterSpacing: '-0.01em',
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
                                color: '#718096',
                                cursor: 'pointer',
                                fontSize: 18,
                                padding: 4,
                                borderRadius: 4,
                                lineHeight: 1,
                            }}
                            title="Collapse sidebar"
                        >←</button>
                    )}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(false)}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 80,
                                transform: 'translateX(-50%)',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#718096',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: '6px 8px',
                                borderRadius: 6,
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            }}
                            title="Expand sidebar"
                        >→</button>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '16px 12px', overflow: 'auto' }}>
                    {!collapsed && (
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#718096',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            padding: '0 12px',
                            marginBottom: 12,
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
                                    gap: collapsed ? 0 : 12,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    padding: collapsed ? '12px 0' : '10px 12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: isActive ? 600 : 400,
                                    fontFamily: 'inherit',
                                    color: isActive ? '#4c51bf' : '#4a5568',
                                    background: isActive ? '#eef2ff' : 'transparent',
                                    marginBottom: 4,
                                    transition: 'all 0.15s ease',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = '#f7fafc';
                                        e.currentTarget.style.color = '#1a2332';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#4a5568';
                                    }
                                }}
                            >
                                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User card */}
                <div style={{
                    padding: collapsed ? '16px 12px' : '16px',
                    borderTop: '1px solid #edf2f7',
                }}>
                    {!collapsed ? (
                        <div style={{
                            background: roleBg,
                            border: `1px solid ${roleColor}33`,
                            borderRadius: 10,
                            padding: '12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: roleColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    flexShrink: 0,
                                }}>{initials}</div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <p style={{ 
                                        fontSize: 14, 
                                        fontWeight: 600, 
                                        color: '#1a2332', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis',
                                        marginBottom: 2,
                                    }}>
                                        {user.display_name}
                                    </p>
                                    <p style={{ 
                                        fontSize: 11, 
                                        fontWeight: 600, 
                                        letterSpacing: '0.03em', 
                                        textTransform: 'uppercase', 
                                        color: roleColor 
                                    }}>
                                        {user.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    color: '#4a5568',
                                    padding: '8px 0',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = '#1a2332';
                                    e.currentTarget.style.background = '#f7fafc';
                                    e.currentTarget.style.borderColor = '#cbd5e0';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = '#4a5568';
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
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
                                color: '#718096',
                                cursor: 'pointer',
                                fontSize: 18,
                                padding: '8px 0',
                                textAlign: 'center',
                            }}
                        >↩</button>
                    )}
                </div>
            </aside>

            {/* Main content area with top header */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Top header */}
                <header style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '16px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 24,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    {/* Breadcrumb / Page title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, color: '#1a2332', fontWeight: 600 }}>
                            {pageTitle}
                        </span>
                    </div>

                    {/* Search bar - "Ask CampusOS" */}
                    <div style={{ flex: 1, maxWidth: 480 }}>
                        <button
                            onClick={() => navigate('/ai')}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px',
                                background: '#f8f9fb',
                                border: searchFocused ? '1px solid #4c51bf' : '1px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 14,
                                color: '#718096',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                textAlign: 'left',
                            }}
                            onMouseEnter={e => {
                                if (!searchFocused) e.currentTarget.style.borderColor = '#cbd5e0';
                            }}
                            onMouseLeave={e => {
                                if (!searchFocused) e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <span style={{ fontSize: 16 }}>🔍</span>
                            <span>Ask CampusOS anything...</span>
                            <span style={{ 
                                marginLeft: 'auto', 
                                fontSize: 11, 
                                background: '#ffffff', 
                                padding: '2px 8px', 
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                color: '#4a5568',
                                fontWeight: 500,
                            }}>AI</span>
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
