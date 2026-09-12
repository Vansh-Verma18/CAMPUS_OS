import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationsApi, type RegistrationResponse } from '../api/registrations';
import { eventsApi, type EventResponse } from '../api/events';

interface RegistrationWithEvent {
    registration: RegistrationResponse;
    event: EventResponse | null;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    registered: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
    confirmed: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
    waitlisted: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
    cancelled: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    pending: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
};

const ATTENDANCE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    attended: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
    missed: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    pending: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
};

function StatusBadge({ status, type = 'registration' }: { status: string; type?: 'registration' | 'attendance' }) {
    const colors = type === 'registration' ? STATUS_COLORS : ATTENDANCE_STATUS_COLORS;
    const config = colors[status] ?? colors.pending;
    
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'capitalize',
            background: config.bg,
            border: `1px solid ${config.border}`,
            color: config.text,
        }}>
            {status}
        </span>
    );
}

function RegistrationCard({ item, onCancel, cancelling }: {
    item: RegistrationWithEvent;
    onCancel: (eventId: string) => void;
    cancelling: boolean;
}) {
    const navigate = useNavigate();
    const { registration, event } = item;

    if (!event) {
        return null;
    }

    const startDate = new Date(event.start_datetime);
    const regDate = new Date(registration.registration_timestamp);
    const isUpcoming = startDate > new Date();
    const canCancel = (registration.status === 'registered' || registration.status === 'confirmed') && event.status === 'scheduled' && isUpcoming;

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
        <div style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1E293B',
                        margin: '0 0 6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {event.title}
                    </h3>
                    <p style={{
                        fontSize: 12,
                        color: '#64748B',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                    }}>
                        {event.category}
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <StatusBadge status={registration.status} type="registration" />
                    {registration.attendance_status !== 'pending' && (
                        <StatusBadge status={registration.attendance_status} type="attendance" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748B' }}>📅</span>
                        <span style={{ fontSize: 13, color: '#475569' }}>
                            {formatDate(startDate)} at {formatTime(startDate)}
                        </span>
                    </div>

                    {event.venue_id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, color: '#64748B' }}>📍</span>
                            <span style={{ fontSize: 13, color: '#64748B' }}>
                                Venue assigned
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#64748B' }}>🎟️</span>
                        <span style={{ fontSize: 13, color: '#64748B' }}>
                            Registered on {formatDate(regDate)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => navigate(`/events/${event._id}`)}
                        style={{
                            flex: 1,
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 10,
                            padding: '10px 16px',
                            color: '#6366F1',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                        }}
                    >
                        View Event
                    </button>

                    {canCancel && (
                        <button
                            onClick={() => onCancel(event._id)}
                            disabled={cancelling}
                            style={{
                                flex: 1,
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 10,
                                padding: '10px 16px',
                                color: '#EF4444',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: cancelling ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                opacity: cancelling ? 0.6 : 1,
                            }}
                            onMouseEnter={e => {
                                if (!cancelling) {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                            }}
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 16,
                }}>
                    <div style={{ height: 18, width: '60%', background: '#F1F5F9', borderRadius: 6, marginBottom: 10 }} />
                    <div style={{ height: 14, width: '40%', background: '#F8FAFC', borderRadius: 4, marginBottom: 16 }} />
                    <div style={{ height: 12, width: '80%', background: '#F8FAFC', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '70%', background: '#F8FAFC', borderRadius: 4 }} />
                </div>
            ))}
        </div>
    );
}

export default function MyRegistrations() {
    const navigate = useNavigate();
    const [items, setItems] = useState<RegistrationWithEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const registrations = await registrationsApi.getMyRegistrations();
            
            // Fetch event details for each registration
            const withEvents = await Promise.all(
                registrations.map(async (reg) => {
                    try {
                        const event = await eventsApi.getEvent(reg.event_id);
                        return { registration: reg, event };
                    } catch {
                        return { registration: reg, event: null };
                    }
                })
            );
            
            // Filter out registrations without valid events and sort by date
            const validItems = withEvents.filter(item => item.event !== null);
            validItems.sort((a, b) => {
                if (!a.event || !b.event) return 0;
                return new Date(b.event.start_datetime).getTime() - new Date(a.event.start_datetime).getTime();
            });
            
            setItems(validItems);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load registrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleCancel = async (eventId: string) => {
        if (!window.confirm('Are you sure you want to cancel this registration?')) {
            return;
        }

        try {
            setCancellingId(eventId);
            await registrationsApi.cancelRegistration(eventId);
            
            // Remove the cancelled registration from the list
            setItems(prev => prev.filter(item => item.event?._id !== eventId));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to cancel registration');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8F9FB',
            color: '#1E293B',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            padding: '40px 40px 80px',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 40, animation: 'fadeIn 0.4s ease' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 999,
                        padding: '4px 14px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: '#6366F1',
                        marginBottom: 16,
                    }}>
                        <span style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            background: '#6366F1', 
                            display: 'inline-block',
                            animation: 'pulse 2s ease-in-out infinite',
                        }} />
                        My Activity
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(32px, 4vw, 44px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: '#1E293B',
                        margin: '0 0 12px',
                    }}>
                        My Registrations
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 16, margin: 0, maxWidth: 600 }}>
                        View and manage your event registrations.
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
                        <LoadingSkeleton />
                    </div>
                ) : error ? (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 16,
                        padding: 32,
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
                        <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 16, fontWeight: 500 }}>{error}</p>
                        <button
                            onClick={fetchRegistrations}
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 10,
                                padding: '10px 24px',
                                color: '#EF4444',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            }}
                        >
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        animation: 'fadeIn 0.4s ease',
                    }}>
                        <div style={{
                            width: 72,
                            height: 72,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                            margin: '0 auto 20px',
                        }}>
                            🎟️
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>
                            No Registrations Yet
                        </h2>
                        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                            You haven't registered for any events yet.
                        </p>
                        <button
                            onClick={() => navigate('/events')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: 10,
                                padding: '12px 28px',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.25)';
                            }}
                        >
                            Discover Events
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: 16,
                        animation: 'fadeIn 0.4s ease 0.1s both',
                    }}>
                        {items.map(item => (
                            <RegistrationCard
                                key={item.registration._id}
                                item={item}
                                onCancel={handleCancel}
                                cancelling={cancellingId === item.event?._id}
                            />
                        ))}
                    </div>
                )}

                {/* Footer count */}
                {!loading && !error && items.length > 0 && (
                    <div style={{
                        marginTop: 32,
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: 13,
                        fontWeight: 500,
                    }}>
                        {items.length} {items.length === 1 ? 'registration' : 'registrations'}
                    </div>
                )}
            </div>
        </div>
    );
}
