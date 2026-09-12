import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, Building2, Ticket, Sparkles, PlusCircle, BookText, BarChart3, Search, LogOut } from 'lucide-react';

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

    if (!user) return null;

    const visibleNav = NAV_ITEMS.filter(
        item => !item.roles || item.roles.includes(user.role)
    );

    const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    // Get current page title
    const currentItem = NAV_ITEMS.find(item => item.path === location.pathname);
    const pageTitle = currentItem?.label ?? 'CampusOS';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ECE7F4',
            display: 'flex',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
            color: '#1E192B',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                .sidebar-glass {
                    background: linear-gradient(180deg, #0B1020 0%, #11182B 100%);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-right: 1px solid rgba(39, 48, 74, 0.4);
                    box-shadow: 12px 0 35px -5px rgba(79, 70, 229, 0.08);
                }
                
                .active-nav-glow {
                    background: linear-gradient(90deg, rgba(79, 70, 229, 0.22) 0%, rgba(124, 58, 237, 0.28) 100%);
                    box-shadow: 0 0 12px -2px rgba(124, 58, 237, 0.4);
                    border: 1px solid rgba(99, 102, 241, 0.35);
                }
                
                .nav-item-hover:hover {
                    background: rgba(99, 102, 241, 0.10);
                    transform: translateX(3px);
                }
                
                .nav-item-hover {
                    transition: all 0.25s ease;
                }
                
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                @keyframes breathing-glow {
                    0%, 100% { box-shadow: 0 0 12px -2px rgba(124, 58, 237, 0.4); }
                    50% { box-shadow: 0 0 16px -1px rgba(124, 58, 237, 0.5); }
                }
                
                .active-nav-glow {
                    animation: breathing-glow 3s ease-in-out infinite;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .active-nav-glow {
                        animation: none;
                    }
                    .nav-item-hover:hover {
                        transform: none;
                    }
                }
            `}</style>

            {/* Ambient floating background glows */}
            <div style={{
                position: 'fixed',
                top: '96px',
                right: '192px',
                width: '384px',
                height: '384px',
                background: 'rgba(216, 180, 254, 0.3)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />
            <div style={{
                position: 'fixed',
                bottom: '40px',
                left: '320px',
                width: '320px',
                height: '320px',
                background: 'rgba(251, 207, 232, 0.25)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />
            <div style={{
                position: 'fixed',
                top: '50%',
                right: '25%',
                width: '288px',
                height: '288px',
                background: 'rgba(165, 243, 252, 0.3)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            {/* Glassmorphic Dark Sidebar */}
            <aside className="sidebar-glass" style={{
                width: '260px',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 30,
                borderRadius: '0 24px 24px 0',
            }}>
                {/* Top Section: Brand & Nav */}
                <div style={{ padding: '24px' }}>
                    {/* Logo */}
                    <div 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '32px',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/dashboard')}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H4c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z"/>
                                <path d="M12 8l-4 4h3v4h2v-4h3z"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                background: 'linear-gradient(90deg, #ffffff 0%, #A5B4FC 50%, #67E8F9 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                CampusOS
                            </div>
                        </div>
                    </div>

                    {/* Section Label */}
                    <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(168, 177, 197, 0.6)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '16px',
                        paddingLeft: '8px',
                    }}>
                        Navigation
                    </p>

                    {/* Navigation Menu */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {visibleNav.map(item => {
                            const isActive = location.pathname === item.path;
                            const IconComponent = item.icon;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={isActive ? 'active-nav-glow' : 'nav-item-hover'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '10px 16px',
                                        borderRadius: '9999px',
                                        color: isActive ? '#ffffff' : '#A8B1C5',
                                        fontSize: '14px',
                                        fontWeight: isActive ? 600 : 500,
                                        cursor: 'pointer',
                                        border: 'none',
                                        background: 'transparent',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                        width: '100%',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    <IconComponent size={16} strokeWidth={2.5} style={{
                                        color: isActive ? '#A78BFA' : '#67E8F9',
                                        flexShrink: 0,
                                    }} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Profile Area */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid rgba(39, 48, 74, 0.5)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#111827',
                        padding: '10px',
                        borderRadius: '16px',
                        border: '1px solid #29344D',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#ffffff',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <p style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {user.display_name}
                                </p>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#34D399',
                                    animation: 'pulse-dot 2s ease-in-out infinite',
                                    flexShrink: 0,
                                }} />
                            </div>
                            <p style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#A8B1C5',
                            }}>
                                {user.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#A8B1C5',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            letterSpacing: '0.02em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(124, 58, 237, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = '#A8B1C5';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <LogOut size={14} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div style={{
                flex: 1,
                marginLeft: '260px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Top Header */}
                <header style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(226, 219, 237, 0.8)',
                    padding: '16px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    {/* Page title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            fontSize: '24px',
                            color: '#1a202c',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                        }}>
                            {pageTitle}
                        </span>
                    </div>

                    {/* AI Search Bar */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '320px' }}>
                        <input
                            type="text"
                            placeholder="Ask CampusOS anything..."
                            onClick={() => navigate('/ai')}
                            readOnly
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.7)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '9999px',
                                paddingLeft: '40px',
                                paddingRight: '48px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                fontSize: '13px',
                                color: '#4a5568',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)',
                            }}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.1)';
                            }}
                        />
                        <Search size={16} style={{
                            position: 'absolute',
                            left: '14px',
                            color: '#8B5CF6',
                        }} />
                        <span style={{
                            position: 'absolute',
                            right: '10px',
                            background: '#e5e7eb',
                            border: '1px solid #d1d5db',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#6b7280',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                        }}>
                            AI
                        </span>
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
