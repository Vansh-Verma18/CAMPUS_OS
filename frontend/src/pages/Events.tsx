import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    scheduled: { bg: '#eef2ff', border: '#c3dafe', text: '#4c51bf' },
    ongoing: { bg: '#f0fff4', border: '#9ae6b4', text: '#38a169' },
    completed: { bg: '#f7fafc', border: '#e2e8f0', text: '#718096' },
    cancelled: { bg: '#fff5f5', border: '#feb2b2', text: '#e53e3e' },
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
];

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.03em',
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#cbd5e0';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
            }}
        >
            {/* Header with icon and status */}
            <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid #edf2f7',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
            }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontSize: 11,
                        color: '#718096',
                        margin: '0 0 6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                    }}>
                        {event.category}
                    </p>
                    <h3 style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: '#1a2332',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {event.title}
                    </h3>
                </div>
                <StatusBadge status={event.status} />
            </div>

            {/* Content */}
            <div style={{ padding: '18px 20px' }}>
                <p style={{
                    fontSize: 14,
                    color: '#4a5568',
                    lineHeight: 1.6,
                    margin: '0 0 16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {event.description}
                </p>

                {/* Meta info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, color: '#718096' }}>📅</span>
                        <span style={{ fontSize: 14, color: '#1a2332', fontWeight: 500 }}>
                            {formatDate(startDate)}
                        </span>
                        {isUpcoming && (
                            <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                                color: '#38a169',
                                background: '#f0fff4',
                                border: '1px solid #9ae6b4',
                                padding: '2px 8px',
                                borderRadius: 4,
                            }}>
                                Upcoming
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, color: '#718096' }}>🕐</span>
                        <span style={{ fontSize: 13, color: '#4a5568' }}>
                            {formatTime(startDate)} – {formatTime(endDate)}
                        </span>
                    </div>

                    {event.venue_id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, color: '#718096' }}>📍</span>
                            <span style={{ fontSize: 13, color: '#4a5568' }}>
                                Venue assigned
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, color: '#718096' }}>👥</span>
                        <span style={{ fontSize: 13, color: '#4a5568' }}>
                            {event.expected_participants} expected participants
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {event.target_audience.length > 0 && (
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid #edf2f7',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    background: '#f8f9fb',
                }}>
                    {event.target_audience.slice(0, 3).map((audience, i) => (
                        <span key={i} style={{
                            fontSize: 12,
                            color: '#4c51bf',
                            background: '#eef2ff',
                            border: '1px solid #c3dafe',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: 500,
                        }}>
                            {audience}
                        </span>
                    ))}
                    {event.target_audience.length > 3 && (
                        <span style={{
                            fontSize: 12,
                            color: '#718096',
                            padding: '4px 10px',
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
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                }}>
                    <div style={{ height: 20, width: '70%', background: '#edf2f7', borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 14, width: '100%', background: '#f7fafc', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '90%', background: '#f7fafc', borderRadius: 4 }} />
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
            background: '#f8f9fb',
            color: '#1a2332',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            padding: '32px',
        }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        color: '#1a2332',
                        margin: '0 0 8px',
                    }}>
                        Discover Campus
                    </h1>
                    <p style={{ color: '#4a5568', fontSize: 15, margin: '0 0 20px', maxWidth: 600 }}>
                        Explore events, activities, and opportunities happening across campus.
                    </p>

                    {/* AI Shortcuts */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 12,
                        padding: '20px 24px',
                        marginTop: 20,
                        color: '#ffffff',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>✨</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Ask CampusOS</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {AI_SUGGESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate('/ai', { state: { question: q } })}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: 8,
                                        padding: '8px 14px',
                                        color: '#ffffff',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    animation: 'fadeIn 0.4s ease 0.1s both',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>Category:</label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '8px 12px',
                                color: '#1a2332',
                                fontSize: 14,
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
                        <label style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '8px 12px',
                                color: '#1a2332',
                                fontSize: 14,
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
                                background: '#ffffff',
                                border: '1px solid #feb2b2',
                                borderRadius: 8,
                                padding: '8px 16px',
                                color: '#e53e3e',
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 500,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#fff5f5';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#ffffff';
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
                        background: '#ffffff',
                        border: '1px solid #feb2b2',
                        borderRadius: 12,
                        padding: 32,
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
                        <p style={{ color: '#e53e3e', fontSize: 15, marginBottom: 16 }}>{error}</p>
                        <button
                            onClick={fetchEvents}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #feb2b2',
                                borderRadius: 8,
                                padding: '10px 24px',
                                color: '#e53e3e',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#fff5f5';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#ffffff';
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
                            borderRadius: 12,
                            background: '#eef2ff',
                            border: '1px solid #c3dafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            margin: '0 auto 16px',
                        }}>
                            📅
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                            No events found
                        </h2>
                        <p style={{ color: '#4a5568', fontSize: 14, margin: 0 }}>
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
                        color: '#718096',
                        fontSize: 13,
                    }}>
                        Showing {events.length} {events.length === 1 ? 'event' : 'events'}
                    </div>
                )}
            </div>
        </div>
    );
}
