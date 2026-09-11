import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    scheduled: { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)', text: '#60a5fa' },
    ongoing: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
    completed: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
    cancelled: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
};

const CATEGORY_ICONS: Record<string, string> = {
    Academic: '📚',
    Cultural: '🎭',
    Competition: '🏆',
    Workshop: '🔧',
    Sports: '⚽',
    Social: '🎉',
    Technical: '💻',
    default: '📅',
};

const AI_SUGGESTIONS = [
    'What technical events are happening this month?',
    'Which events have the highest participation?',
    'Find hackathons and competitions',
    'Show me cultural events',
];

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            background: config.bg,
            border: `1px solid ${config.border}`,
            color: config.text,
        }}>
            {status}
        </span>
    );
}

function EventCard({ event, onClick }: { event: EventResponse; onClick: () => void }) {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    const isUpcoming = startDate > new Date();
    const icon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.default;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    return (
        <button
            onClick={onClick}
            style={{
                background: '#0c1120',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = '';
            }}
        >
            {/* Header with icon and status */}
            <div style={{
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
            }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#f1f5f9',
                        margin: '0 0 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {event.title}
                    </h3>
                    <p style={{
                        fontSize: 12,
                        color: '#64748b',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                    }}>
                        {event.category}
                    </p>
                </div>
                <StatusBadge status={event.status} />
            </div>

            {/* Content */}
            <div style={{ padding: '16px 18px' }}>
                <p style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    margin: '0 0 14px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {event.description}
                </p>

                {/* Meta info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569' }}>📅</span>
                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                            {formatDate(startDate)}
                        </span>
                        {isUpcoming && (
                            <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: '#22c55e',
                                background: 'rgba(34,197,94,0.1)',
                                padding: '2px 6px',
                                borderRadius: 4,
                            }}>
                                Upcoming
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569' }}>🕐</span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            {formatTime(startDate)} - {formatTime(endDate)}
                        </span>
                    </div>

                    {event.venue_id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, color: '#475569' }}>📍</span>
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>
                                Venue assigned
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569' }}>👥</span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            {event.expected_participants} expected participants
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {event.target_audience.length > 0 && (
                <div style={{
                    padding: '12px 18px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                }}>
                    {event.target_audience.slice(0, 3).map((audience, i) => (
                        <span key={i} style={{
                            fontSize: 11,
                            color: '#818cf8',
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.15)',
                            padding: '2px 8px',
                            borderRadius: 6,
                        }}>
                            {audience}
                        </span>
                    ))}
                    {event.target_audience.length > 3 && (
                        <span style={{
                            fontSize: 11,
                            color: '#64748b',
                            padding: '2px 8px',
                        }}>
                            +{event.target_audience.length - 3} more
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 16,
                }}>
                    <div style={{ height: 20, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 14, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '90%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
                </div>
            ))}
        </div>
    );
}

export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters: any = {};
            if (categoryFilter) filters.category = categoryFilter;
            if (statusFilter) filters.status = statusFilter;
            const data = await eventsApi.getEvents(filters);
            setEvents(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [categoryFilter, statusFilter]);

    const categories = Array.from(new Set(events.map(e => e.category))).sort();
    const statuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            padding: '40px 40px 80px',
        }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 40, animation: 'fadeIn 0.4s ease' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 999,
                        padding: '3px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: '#818cf8',
                        marginBottom: 12,
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        Campus Events
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(28px, 4vw, 40px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: '#f1f5f9',
                        margin: '0 0 12px',
                    }}>
                        Discover Campus
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 20px', maxWidth: 600 }}>
                        Explore events, activities, and opportunities happening across campus.
                    </p>

                    {/* AI Shortcuts */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', paddingRight: 8 }}>
                            Ask CampusOS:
                        </span>
                        {AI_SUGGESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => navigate('/ai', { state: { question: q } })}
                                style={{
                                    background: 'rgba(99,102,241,0.06)',
                                    border: '1px solid rgba(99,102,241,0.15)',
                                    borderRadius: 8,
                                    padding: '6px 12px',
                                    color: '#818cf8',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                                }}
                            >
                                <span style={{ fontSize: 11 }}>✦</span>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 28,
                    flexWrap: 'wrap',
                    animation: 'fadeIn 0.4s ease 0.1s both',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Category:</label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            style={{
                                background: '#0c1120',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 9,
                                padding: '8px 12px',
                                color: '#f1f5f9',
                                fontSize: 13,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                background: '#0c1120',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 9,
                                padding: '8px 12px',
                                color: '#f1f5f9',
                                fontSize: 13,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(categoryFilter || statusFilter) && (
                        <button
                            onClick={() => {
                                setCategoryFilter('');
                                setStatusFilter('');
                            }}
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                color: '#f87171',
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ animation: 'fadeIn 0.4s ease 0.15s both' }}>
                        <LoadingSkeleton />
                    </div>
                ) : error ? (
                    <div style={{
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 16,
                        padding: 32,
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
                        <p style={{ color: '#f87171', fontSize: 15, marginBottom: 16 }}>{error}</p>
                        <button
                            onClick={fetchEvents}
                            style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 8,
                                padding: '8px 20px',
                                color: '#f87171',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        animation: 'fadeIn 0.4s ease',
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            margin: '0 auto 16px',
                        }}>
                            📅
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
                            No events found
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                            {categoryFilter || statusFilter
                                ? 'Try adjusting your filters to see more events.'
                                : 'Check back later for upcoming campus events.'}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 16,
                        animation: 'fadeIn 0.4s ease 0.15s both',
                    }}>
                        {events.map(event => (
                            <EventCard
                                key={event._id}
                                event={event}
                                onClick={() => navigate(`/events/${event._id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Footer count */}
                {!loading && !error && events.length > 0 && (
                    <div style={{
                        marginTop: 32,
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: 13,
                    }}>
                        Showing {events.length} {events.length === 1 ? 'event' : 'events'}
                    </div>
                )}
            </div>
        </div>
    );
}
