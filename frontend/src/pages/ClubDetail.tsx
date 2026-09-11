import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubsApi, type ClubResponse } from '../api/clubs';
import { eventsApi, type EventResponse } from '../api/events';

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
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const S = {
        page: {
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            padding: '40px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        },
        section: {
            background: '#0c1120',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '28px 32px',
            marginBottom: 20,
        },
        eventCard: {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
    };

    if (loading) {
        return (
            <div style={S.page}>
                <div style={{
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
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading club...</p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div style={S.page}>
                <div style={{
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
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        marginBottom: 16,
                    }}>❌</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>
                        {error || 'Club not found'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 340, marginBottom: 20 }}>
                        This club may have been removed or doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate('/clubs')}
                        style={{
                            background: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: 8,
                            padding: '8px 16px',
                            color: '#818cf8',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        ← Back to Clubs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={S.page}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Back button */}
            <button
                onClick={() => navigate('/clubs')}
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: '#94a3b8',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: 24,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = '#e2e8f0';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = '#94a3b8';
                }}
            >
                ← Back to Clubs
            </button>

            {/* Club Header */}
            <div style={S.section}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(34,211,153,0.1)',
                            border: '1px solid rgba(34,211,153,0.2)',
                            borderRadius: 999,
                            padding: '3px 12px',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#34d399',
                            marginBottom: 12,
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                            {club.category}
                        </div>
                        <h1 style={{
                            fontSize: 32,
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: '#f1f5f9',
                            margin: '0 0 12px',
                        }}>
                            {club.name}
                        </h1>
                    </div>
                    {club.status === 'active' && (
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '4px 12px',
                            borderRadius: 6,
                            background: 'rgba(34,211,153,0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(34,211,153,0.2)',
                        }}>
                            Active
                        </span>
                    )}
                </div>

                {club.description && (
                    <p style={{
                        fontSize: 15,
                        color: '#cbd5e1',
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        {club.description}
                    </p>
                )}
            </div>

            {/* Club Events */}
            <div style={S.section}>
                <h2 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    margin: '0 0 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <span>📅</span>
                    Club Events
                </h2>

                {eventsLoading && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            border: '2px solid rgba(99,102,241,0.2)',
                            borderTopColor: '#6366f1',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 12px',
                        }} />
                        Loading events...
                    </div>
                )}

                {!eventsLoading && events.length === 0 && (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: 'rgba(148,163,184,0.08)',
                            border: '1px solid rgba(148,163,184,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            margin: '0 auto 12px',
                        }}>📅</div>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                            No events scheduled for this club yet.
                        </p>
                    </div>
                )}

                {!eventsLoading && events.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {events.map(event => (
                            <div
                                key={event._id}
                                style={S.eventCard}
                                onClick={() => navigate(`/events/${event._id}`)}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: '#f1f5f9',
                                            margin: '0 0 6px',
                                        }}>
                                            {event.title}
                                        </h3>
                                        {event.description && (
                                            <p style={{
                                                fontSize: 13,
                                                color: '#94a3b8',
                                                margin: '0 0 10px',
                                                lineHeight: 1.4,
                                            }}>
                                                {event.description}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: 12,
                                                color: '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}>
                                                🕐 {formatDate(event.start_datetime)}
                                            </span>
                                            <span style={{
                                                fontSize: 11,
                                                color: '#6366f1',
                                                background: 'rgba(99,102,241,0.1)',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                fontWeight: 500,
                                            }}>
                                                {event.category}
                                            </span>
                                            <span style={{
                                                fontSize: 11,
                                                color: event.status === 'scheduled' ? '#34d399' : '#94a3b8',
                                                background: event.status === 'scheduled' ? 'rgba(34,211,153,0.1)' : 'rgba(148,163,184,0.1)',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                            }}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        color: '#475569',
                                        fontSize: 18,
                                        flexShrink: 0,
                                    }}>
                                        →
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
            }}>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#c7d2fe', margin: '0 0 4px' }}>
                        Want to see all events?
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                        Browse all campus events and discover more activities.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/events')}
                    style={{
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        color: '#818cf8',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                    }}
                >
                    View All Events →
                </button>
            </div>
        </div>
    );
}
