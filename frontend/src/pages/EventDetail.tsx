import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { registrationsApi, type RegistrationResponse } from '../api/registrations';
import { FeedbackForm } from '../components/FeedbackForm';
import { useAuth } from '../context/AuthContext';

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

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 12,
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

export default function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    
    // Feedback state
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [hasFeedback, setHasFeedback] = useState(false);
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);

    const isStudent = user?.role === 'student';

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const data = await eventsApi.getEvent(id);
                setEvent(data);

                // If student, check if already registered and if feedback submitted
                if (isStudent) {
                    try {
                        const myRegs = await registrationsApi.getMyRegistrations();
                        const existingReg = myRegs.find(r => r.event_id === id);
                        setRegistration(existingReg || null);
                        
                        // Check if feedback already submitted
                        // We can't directly query feedback by user, so we'll try to get event feedback
                        // and check if current user already submitted (only after event is completed)
                        if (data.status === 'completed' && existingReg) {
                            try {
                                // This will fail with 403 for students, which is expected
                                // We'll use the duplicate error when they try to submit instead
                                setHasFeedback(false); // Default to false, will be caught on submit
                            } catch {
                                // Expected for students
                            }
                        }
                    } catch {
                        // Ignore registration fetch errors
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load event');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, isStudent]);

    const handleRegister = async () => {
        if (!id || !isStudent) return;
        
        try {
            setRegistering(true);
            setRegisterError(null);
            setRegisterSuccess(false);
            const newRegistration = await registrationsApi.registerForEvent(id);
            setRegistration(newRegistration);
            setRegisterSuccess(true);
            
            // Clear success message after 5 seconds
            setTimeout(() => setRegisterSuccess(false), 5000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to register for event';
            setRegisterError(errorMsg);
        } finally {
            setRegistering(false);
        }
    };

    const handleCancelRegistration = async () => {
        if (!id || !isStudent) return;
        
        if (!window.confirm('Are you sure you want to cancel your registration?')) {
            return;
        }
        
        try {
            setRegistering(true);
            setRegisterError(null);
            await registrationsApi.cancelRegistration(id);
            setRegistration(null);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to cancel registration';
            setRegisterError(errorMsg);
        } finally {
            setRegistering(false);
        }
    };

    const handleFeedbackSuccess = () => {
        setShowFeedbackForm(false);
        setHasFeedback(true);
        setFeedbackSuccess(true);
        setTimeout(() => setFeedbackSuccess(false), 5000);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#080c18',
                color: '#e2e8f0',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        border: '3px solid rgba(99,102,241,0.3)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: 16,
                    }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#080c18',
                color: '#e2e8f0',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
                        Event Not Found
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                        {error || 'The event you are looking for does not exist or has been removed.'}
                    </p>
                    <button
                        onClick={() => navigate('/events')}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 24px',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        ← Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    const icon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.default;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
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
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            padding: '40px 40px 80px',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Back button */}
                <button
                    onClick={() => navigate('/events')}
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        color: '#94a3b8',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        marginBottom: 28,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    ← Back to Events
                </button>

                {/* Event Header */}
                <div style={{
                    background: '#0c1120',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: 32,
                    marginBottom: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                        <span style={{ fontSize: 48, lineHeight: 1 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <StatusBadge status={event.status} />
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: '#64748b',
                                }}>
                                    {event.category}
                                </span>
                            </div>
                            <h1 style={{
                                fontSize: 32,
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: '#f1f5f9',
                                margin: '0 0 12px',
                            }}>
                                {event.title}
                            </h1>
                            <p style={{
                                fontSize: 16,
                                color: '#94a3b8',
                                lineHeight: 1.7,
                                margin: 0,
                            }}>
                                {event.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Event Details Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                    marginBottom: 20,
                }}>
                    {/* Date & Time */}
                    <div style={{
                        background: '#0c1120',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: 20,
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#64748b',
                            margin: '0 0 12px',
                        }}>Date & Time</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>📅</span>
                            <span style={{ fontSize: 14, color: '#e2e8f0' }}>{formatDate(startDate)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🕐</span>
                            <span style={{ fontSize: 14, color: '#94a3b8' }}>
                                {formatTime(startDate)} - {formatTime(endDate)}
                            </span>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div style={{
                        background: '#0c1120',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: 20,
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#64748b',
                            margin: '0 0 12px',
                        }}>Expected Participants</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>👥</span>
                            <span style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                                {event.expected_participants}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Target Audience */}
                {event.target_audience.length > 0 && (
                    <div style={{
                        background: '#0c1120',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: 20,
                        marginBottom: 20,
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#64748b',
                            margin: '0 0 12px',
                        }}>Target Audience</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {event.target_audience.map((audience, i) => (
                                <span key={i} style={{
                                    fontSize: 13,
                                    color: '#818cf8',
                                    background: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.15)',
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                }}>
                                    {audience}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Placeholder for future features */}
                {/* Organizer/Admin/Faculty Actions */}
                {!isStudent && (user?.role === 'admin' || user?.role === 'faculty' || event.created_by === user?._id) && (
                    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button
                            onClick={() => navigate(`/events/${id}/attendance`)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px 24px',
                                color: '#fff',
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.4)';
                            }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <span style={{ fontSize: 18 }}>📋</span>
                            Manage Attendance
                        </button>
                        
                        <button
                            onClick={() => navigate(`/events/${id}/feedback`)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px 24px',
                                color: '#fff',
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = '0 6px 24px rgba(139,92,246,0.4)';
                            }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <span style={{ fontSize: 18 }}>💬</span>
                            View Feedback
                        </button>
                    </div>
                )}

                {isStudent && (
                    <div style={{ marginBottom: 20 }}>
                        {registerSuccess && (
                            <div style={{
                                background: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: 14,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>✓</span>
                                <p style={{ fontSize: 14, color: '#22c55e', margin: 0, fontWeight: 500 }}>
                                    You're registered for {event.title}!
                                </p>
                            </div>
                        )}

                        {registerError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 14,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>⚠</span>
                                <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>
                                    {registerError}
                                </p>
                            </div>
                        )}

                        {!registration && event.status === 'scheduled' && (
                            <button
                                onClick={handleRegister}
                                disabled={registering}
                                style={{
                                    width: '100%',
                                    background: registering
                                        ? 'rgba(34,197,94,0.3)'
                                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '14px 24px',
                                    color: '#fff',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    cursor: registering ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}
                                onMouseEnter={e => {
                                    if (!registering) e.currentTarget.style.boxShadow = '0 6px 24px rgba(34,197,94,0.4)';
                                }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {registering ? (
                                    <>
                                        <span style={{
                                            width: 16,
                                            height: 16,
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'spin 0.8s linear infinite',
                                        }} />
                                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: 18 }}>✓</span>
                                        Register for Event
                                    </>
                                )}
                            </button>
                        )}

                        {registration && registration.status !== 'cancelled' && (
                            <div style={{
                                background: '#0c1120',
                                border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: 14,
                                padding: 20,
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    marginBottom: 16,
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: 'rgba(34,197,94,0.15)',
                                        border: '2px solid rgba(34,197,94,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                    }}>✓</div>
                                    <div>
                                        <p style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            color: '#22c55e',
                                            margin: '0 0 2px',
                                        }}>
                                            You're Registered
                                        </p>
                                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                            Registered on {new Date(registration.registration_timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCancelRegistration}
                                    disabled={registering}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: 10,
                                        padding: '10px 20px',
                                        color: '#f87171',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: registering ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!registering) {
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                                    }}
                                >
                                    {registering ? 'Processing...' : 'Cancel Registration'}
                                </button>
                            </div>
                        )}

                        {event.status === 'cancelled' && (
                            <div style={{
                                background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 14,
                                padding: 20,
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>
                                    This event has been cancelled
                                </p>
                            </div>
                        )}

                        {event.status === 'completed' && !registration && (
                            <div style={{
                                background: 'rgba(148,163,184,0.06)',
                                border: '1px solid rgba(148,163,184,0.2)',
                                borderRadius: 14,
                                padding: 20,
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
                                    This event has already ended
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Student Feedback Section */}
                {isStudent && registration && event.status === 'completed' && (
                    <div style={{ marginBottom: 20 }}>
                        {feedbackSuccess && (
                            <div style={{
                                background: 'rgba(139,92,246,0.08)',
                                border: '1px solid rgba(139,92,246,0.25)',
                                borderRadius: 14,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>✓</span>
                                <p style={{ fontSize: 14, color: '#a78bfa', margin: 0, fontWeight: 500 }}>
                                    Thank you for your feedback!
                                </p>
                            </div>
                        )}

                        {!hasFeedback ? (
                            <button
                                onClick={() => setShowFeedbackForm(true)}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '14px 24px',
                                    color: '#fff',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(139,92,246,0.4)';
                                }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <span style={{ fontSize: 18 }}>💬</span>
                                Give Feedback
                            </button>
                        ) : (
                            <div style={{
                                background: '#0c1120',
                                border: '1px solid rgba(139,92,246,0.25)',
                                borderRadius: 14,
                                padding: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'rgba(139,92,246,0.15)',
                                    border: '2px solid rgba(139,92,246,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                }}>✓</div>
                                <p style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: '#a78bfa',
                                    margin: 0,
                                }}>
                                    Feedback Submitted
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback Form Modal */}
                {showFeedbackForm && (
                    <FeedbackForm 
                        eventId={id!} 
                        eventTitle={event.title}
                        onSuccess={handleFeedbackSuccess}
                        onCancel={() => setShowFeedbackForm(false)}
                    />
                )}
            </div>
        </div>
    );
}
