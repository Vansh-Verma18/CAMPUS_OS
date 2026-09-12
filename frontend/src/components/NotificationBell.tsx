import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, type NotificationItem } from '../api/notifications';

const TYPE_CONFIG = {
    info:    { icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    success: { icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    warning: { icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    error:   { icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch unread count on mount and every 60s
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const count = await notificationsApi.getUnreadCount();
                setUnread(count);
            } catch { /* silent */ }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = async () => {
        setOpen(prev => !prev);
        if (!open) {
            setLoading(true);
            try {
                const data = await notificationsApi.getMyNotifications();
                setNotifications(data);
                setUnread(data.filter(n => !n.read).length);
            } catch { /* silent */ }
            finally { setLoading(false); }
        }
    };

    const handleClick = async (n: NotificationItem) => {
        if (!n.read) {
            await notificationsApi.markAsRead(n.id).catch(() => {});
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
            setUnread(prev => Math.max(0, prev - 1));
        }
        if (n.link) {
            navigate(n.link);
            setOpen(false);
        }
    };

    const handleMarkAll = async () => {
        await notificationsApi.markAllAsRead().catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                title="Notifications"
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: 8,
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        lineHeight: 1,
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 340,
                    maxHeight: 420,
                    background: '#1e2535',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    zIndex: 9999,
                    animation: 'slideDown 0.15s ease',
                }}>
                    <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>
                            Notifications {unread > 0 && <span style={{ color: '#818cf8', marginLeft: 4 }}>({unread} new)</span>}
                        </span>
                        {unread > 0 && (
                            <button
                                onClick={handleMarkAll}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#818cf8',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    padding: 0,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                        {loading ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>You're all caught up!</p>
                            </div>
                        ) : notifications.map(n => {
                            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                            return (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    style={{
                                        width: '100%',
                                        background: n.read ? 'transparent' : 'rgba(129,140,248,0.04)',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontFamily: 'inherit',
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'flex-start',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(129,140,248,0.04)'; }}
                                >
                                    <span style={{
                                        fontSize: 18,
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        background: cfg.bg,
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>{cfg.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {!n.read && (
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', flexShrink: 0 }} />
                                            )}
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {n.title}
                                            </p>
                                        </div>
                                        <p style={{ margin: '2px 0 4px', fontSize: 12, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {n.message}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{timeAgo(n.created_at)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
