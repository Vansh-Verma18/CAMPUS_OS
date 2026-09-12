import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, Building2, Ticket, Sparkles, PlusCircle, BookText, BarChart3, Menu, X, Search, Command } from 'lucide-react';

const ROLE_COLOR: Record<string, string> = {
    admin: '#4f46e5',
    faculty: '#3b82f6',
    organizer: '#10b981',
    student: '#f59e0b',
};

const ROLE_BG: Record<string, string> = {
    admin: '#eef2ff',
    faculty: '#dbeafe',
    organizer: '#d1fae5',
    student: '#fef3c7',
};

interface NavItem {
    path: string;
    label: string;
    icon: any;
    roles?: string[]; // undefined = all roles
}

const NAV_ITEMS: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/clubs', label: 'Clubs', icon: Building2 },
    { path: '/my-registrations', label: 'My Registrations', icon: Ticket, roles: ['student'] },
    { path: '/ai', label: 'AI Agent', icon: Sparkles },
    { path: '/event-planner', label: 'Event Planner', icon: PlusCircle, roles: ['admin', 'faculty', 'organizer'] },
    { path: '/institutional-memory', label: 'Knowledge Base', icon: BookText, roles: ['admin', 'faculty', 'organizer'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'faculty'] },
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

    const roleColor = ROLE_COLOR[user.role] ?? '#64748b';
    const roleBg = ROLE_BG[user.role] ?? '#f1f5f9';
    const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    // Get current page title
    const currentItem = NAV_ITEMS.find(item => item.path === location.pathname);
    const pageTitle = currentItem?.label ?? 'CampusOS';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fafbfc',
            display: 'flex',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            color: '#0f172a',
        }}>
            {/* Premium Sidebar */}
            <aside style={{
                width: collapsed ? 80 : 280,
                minHeight: '100vh',
                background: '#ffffff',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            }}>
                {/* Logo */}
                <div style={{
                    padding: collapsed ? '28px 20px' : '28px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    justifyContent: collapsed ? 'center' : 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard')}>
                        {/* Premium logo icon */}
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0,
                            color: '#ffffff',
                            boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.4)',
                        }}>
                            🎓
                        </div>
                        {!collapsed && (
                            <div>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 20,
                                    color: '#0f172a',
                                    letterSpacing: '-0.02em',
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1,
                                    marginBottom: 4,
                                }}>CampusOS</div>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#64748b',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}>Campus Intelligence</div>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            title="Collapse sidebar"
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.color = '#64748b';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Expand button (when collapsed) */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        style={{
                            position: 'absolute',
                            bottom: 100,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '8px 10px',
                            borderRadius: 8,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title="Expand sidebar"
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#4f46e5';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#64748b';
                        }}
                    >
                        <Menu size={18} />
                    </button>
                )}

                {/* Nav */}
                <nav style={{ flex: 1, padding: '20px 16px', overflow: 'auto' }}>
                    {!collapsed && (
                        <p style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94a3b8',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0 12px',
                            marginBottom: 16,
                        }}>Navigation</p>
                    )}
                    {visibleNav.map(item => {
                        const isActive = location.pathname === item.path;
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: collapsed ? 0 : 14,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    padding: collapsed ? '14px 0' : '12px 14px',
                                    borderRadius: 10,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    fontWeight: isActive ? 600 : 500,
                                    fontFamily: 'inherit',
                                    color: isActive ? '#4f46e5' : '#475569',
                                    background: isActive ? '#eef2ff' : 'transparent',
                                    marginBottom: 4,
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    position: 'relative',
                                    boxShadow: isActive ? '0 1px 3px 0 rgba(79, 70, 229, 0.1)' : 'none',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.color = '#0f172a';
                                    }
                                    const icon = e.currentTarget.querySelector('.nav-icon') as HTMLElement;
                                    if (icon) icon.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#475569';
                                    }
                                    const icon = e.currentTarget.querySelector('.nav-icon') as HTMLElement;
                                    if (icon) icon.style.transform = '';
                                }}
                            >
                                {isActive && !collapsed && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3,
                                        height: '60%',
                                        background: '#4f46e5',
                                        borderRadius: '0 4px 4px 0',
                                    }} />
                                )}
                                <span
                                    className="nav-icon"
                                    style={{
                                        lineHeight: 1,
                                        flexShrink: 0,
                                        transition: 'transform 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <IconComponent size={20} strokeWidth={2.5} />
                                </span>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User card */}
                <div style={{
                    padding: collapsed ? '20px 16px' : '20px',
                    borderTop: '1px solid #f1f5f9',
                }}>
                    {!collapsed ? (
                        <div style={{
                            background: roleBg,
                            border: `1px solid ${roleColor}22`,
                            borderRadius: 12,
                            padding: '16px',
                            transition: 'all 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '50%',
                                    background: roleColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#ffffff',
                                    flexShrink: 0,
                                    boxShadow: `0 2px 8px ${roleColor}40`,
                                }}>{initials}</div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <p style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: 4,
                                    }}>
                                        {user.display_name}
                                    </p>
                                    <p style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        color: roleColor,
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
                                    color: '#475569',
                                    padding: '10px 0',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = '#0f172a';
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = '#475569';
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
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 20,
                                padding: '8px 0',
                                textAlign: 'center',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = '#64748b';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >↩</button>
                    )}
                </div>
            </aside>

            {/* Main content area with top header */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Premium Top Header */}
                <header style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '16px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 32,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                }}>
                    {/* Breadcrumb / Page title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: 20,
                            color: '#0f172a',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                        }}>
                            {pageTitle}
                        </span>
                    </div>

                    {/* AI Search Command Bar */}
                    <div style={{ flex: 1, maxWidth: 560 }}>
                        <button
                            onClick={() => navigate('/ai')}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 18px',
                                background: '#fafbfc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                fontSize: 15,
                                color: '#64748b',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#c7d2fe';
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = '#fafbfc';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>Ask CampusOS...</span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                background: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                color: '#64748b',
                            }}>
                                <Command size={12} />
                                <span>K</span>
                            </div>
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
