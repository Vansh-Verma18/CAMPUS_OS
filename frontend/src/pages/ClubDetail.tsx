import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubsApi, type ClubResponse } from '../api/clubs';
import { eventsApi, type EventResponse } from '../api/events';
import { Sparkles, ArrowLeft, Calendar } from 'lucide-react';

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

export default function ClubDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [club, setClub] = useState<ClubResponse | null>(null);
    const [events, setEvents] = useState<EventResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadClubAndEvents();
        }
    }, [id]);

    const loadClubAndEvents = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            
            // Load club details
            const clubData = await clubsApi.getClub(id);
            setClub(clubData);
            
            // Load club events
            setEventsLoading(true);
            try {
                const eventsData = await eventsApi.getEvents({ club_id: id });
                setEvents(eventsData);
            } catch (err) {
                // Events loading failure doesn't block club display
                console.error('Failed to load club events:', err);
            } finally {
                setEventsLoading(false);
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('Club not found');
            } else {
                setError(err.response?.data?.detail || 'Failed to load club');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#f8f9fb',
                padding: '32px 40px',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    gap: 12,
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#4c51bf',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#4a5568', fontSize: 14 }}>Loading club...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#f8f9fb',
                padding: '32px 40px',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    textAlign: 'center',
                    padding: 40,
                }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: '#fff5f5',
                        border: '1px solid #feb2b2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        marginBottom: 16,
                    }}>❌</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e53e3e', margin: '0 0 8px' }}>
                        {error || 'Club not found'}
                    </h2>
                    <p style={{ color: '#4a5568', fontSize: 14, maxWidth: 400, marginBottom: 20 }}>
                        This club may have been removed or doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate('/clubs')}
                        style={{
                            background: '#4c51bf',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 20px',
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#434190';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#4c51bf';
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Clubs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            padding: '32px 40px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            animation: 'fadeIn 0.4s ease',
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Back button */}
                <button
                    onClick={() => navigate('/clubs')}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '10px 16px',
                        color: '#4a5568',
                        fontSize: 14,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        marginBottom: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#f8f9fb';
                        e.currentTarget.style.color = '#1a2332';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#4a5568';
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Clubs
                </button>

                {/* Club Header Card */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '32px',
                    marginBottom: 20,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            {/* Category Badge */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#eef2ff',
                                border: '1px solid #c3dafe',
                                borderRadius: 999,
                                padding: '4px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                                color: '#4c51bf',
                                marginBottom: 12,
                            }}>
                                {club.category}
                            </div>
                            <h1 style={{
                                fontSize: 32,
                                fontWeight: 600,
                                letterSpacing: '-0.02em',
                                color: '#1a2332',
                                margin: '0 0 12px',
                                lineHeight: 1.2,
                            }}>
                                {club.name}
                            </h1>
                        </div>
                        {club.status === 'active' && (
                            <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                                padding: '6px 14px',
                                borderRadius: 6,
                                background: '#f0fff4',
                                color: '#38a169',
                                border: '1px solid #9ae6b4',
                            }}>
                                Active
                            </span>
                        )}
                    </div>

                    {club.description && (
                        <p style={{
                            fontSize: 15,
                            color: '#4a5568',
                            lineHeight: 1.6,
                            margin: 0,
                        }}>
                            {club.description}
                        </p>
                    )}
                </div>

                {/* AI Assistance Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#ffffff' }}>
                        <Sparkles size={20} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                            Ask CampusOS about this club
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/ai', { state: { question: `Tell me about ${club.name}` } })}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 8,
                            padding: '8px 16px',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        Open AI Assistant →
                    </button>
                </div>

                {/* Club Events Section */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '28px 32px',
                    marginBottom: 20,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <h2 style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#1a2332',
                        margin: '0 0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <Calendar size={22} style={{ color: '#4c51bf' }} />
                        Upcoming Events
                    </h2>

                    {eventsLoading && (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                border: '3px solid #e2e8f0',
                                borderTopColor: '#4c51bf',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 12px',
                            }} />
                            <p style={{ color: '#4a5568', fontSize: 14 }}>Loading events...</p>
                        </div>
                    )}

                    {!eventsLoading && events.length === 0 && (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            background: '#f8f9fb',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: '#eef2ff',
                                border: '1px solid #c3dafe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                                margin: '0 auto 12px',
                            }}>📅</div>
                            <p style={{ color: '#4a5568', fontSize: 14, margin: 0 }}>
                                No upcoming events for this club yet.
                            </p>
                        </div>
                    )}

                    {!eventsLoading && events.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {events.map(event => {
                                const statusConfig = STATUS_COLORS[event.status] ?? STATUS_COLORS.scheduled;
                                const icon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.default;

                                return (
                                    <button
                                        key={event._id}
                                        onClick={() => navigate(`/events/${event._id}`)}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 10,
                                            padding: '20px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = '#f8f9fb';
                                            e.currentTarget.style.borderColor = '#cbd5e0';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                            <div style={{ flex: 1 }}>
                                                {/* Event Title */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <span style={{ fontSize: 20 }}>{icon}</span>
                                                    <h3 style={{
                                                        fontSize: 16,
                                                        fontWeight: 600,
                                                        color: '#1a2332',
                                                        margin: 0,
                                                    }}>
                                                        {event.title}
                                                    </h3>
                                                </div>

                                                {/* Event Description */}
                                                {event.description && (
                                                    <p style={{
                                                        fontSize: 14,
                                                        color: '#4a5568',
                                                        margin: '0 0 12px',
                                                        lineHeight: 1.5,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}>
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Event Meta */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: 13,
                                                        color: '#4a5568',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                    }}>
                                                        📅 {formatDate(event.start_datetime)}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 13,
                                                        color: '#4a5568',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                    }}>
                                                        🕐 {formatTime(event.start_datetime)}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        letterSpacing: '0.03em',
                                                        textTransform: 'uppercase',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        background: statusConfig.bg,
                                                        border: `1px solid ${statusConfig.border}`,
                                                        color: statusConfig.text,
                                                    }}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{
                                                color: '#4c51bf',
                                                fontSize: 18,
                                                flexShrink: 0,
                                            }}>
                                                →
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
