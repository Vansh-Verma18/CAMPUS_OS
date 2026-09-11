import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { registrationsApi, type RegistrationResponse } from '../api/registrations';
import { FeedbackForm } from '../components/FeedbackForm';
import { useAuth } from '../context/AuthContext';

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

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
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
                background: '#f8f9fb',
                color: '#1a2332',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        border: '3px solid #edf2f7',
                        borderTopColor: '#4c51bf',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: 16,
                    }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <p style={{ color: '#4a5568', fontSize: 14 }}>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#f8f9fb',
                color: '#1a2332',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                        Event Not Found
                    </h2>
                    <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24 }}>
                        {error || 'The event you are looking for does not exist or has been removed.'}
                    </p>
                    <button
                        onClick={() => navigate('/events')}
                        style={{
                            background: '#4c51bf',
                            border: 'none',
                            borderRadius: 8,
                            padding: '12px 24px',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#434190';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#4c51bf';
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
            background: '#f8f9fb',
            color: '#1a2332',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            padding: '32px',
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Back button */}
                <button
                    onClick={() => navigate('/events')}
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#f7fafc';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                >
                    ← Back to Events
                </button>

                {/* Event Header */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 32,
                    marginBottom: 20,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                        <span style={{ fontSize: 48, lineHeight: 1 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                                <StatusBadge status={event.status} />
                                <span style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                    color: '#718096',
                                }}>
                                    {event.category}
                                </span>
                            </div>
                            <h1 style={{
                                fontSize: 28,
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                color: '#1a2332',
                                margin: '0 0 12px',
                            }}>
                                {event.title}
                            </h1>
                            <p style={{
                                fontSize: 15,
                                color: '#4a5568',
                                lineHeight: 1.7,
                                margin: 0,
                            }}>
                                {event.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Two-column layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 20,
                    marginBottom: 20,
                }}>
                    {/* Date & Time */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#718096',
                            margin: '0 0 16px',
                        }}>Date & Time</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 20 }}>📅</span>
                            <span style={{ fontSize: 15, color: '#1a2332', fontWeight: 500 }}>{formatDate(startDate)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>🕐</span>
                            <span style={{ fontSize: 14, color: '#4a5568' }}>
                                {formatTime(startDate)} – {formatTime(endDate)}
                            </span>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#718096',
                            margin: '0 0 16px',
                        }}>Expected Participants</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 20 }}>👥</span>
                            <span style={{ fontSize: 28, fontWeight: 700, color: '#1a2332' }}>
                                {event.expected_participants}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Target Audience */}
                {event.target_audience.length > 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 20,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#718096',
                            margin: '0 0 16px',
                        }}>Target Audience</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {event.target_audience.map((audience, i) => (
                                <span key={i} style={{
                                    fontSize: 13,
                                    color: '#4c51bf',
                                    background: '#eef2ff',
                                    border: '1px solid #c3dafe',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontWeight: 500,
                                }}>
                                    {audience}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Shortcut */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 20,
                    color: '#ffffff',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>✨</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Ask CampusOS about this event</span>
                    </div>
                    <button
                        onClick={() => navigate('/ai', { state: { question: `Tell me more about ${event.title}` } })}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            padding: '10px 18px',
                            color: '#ffffff',
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        }}
                    >
                        Open AI Assistant →
                    </button>
                </div>

                {/* Organizer/Admin/Faculty Actions */}
                {!isStudent && (user?.role === 'admin' || user?.role === 'faculty' || event.created_by === user?._id) && (
                    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button
                            onClick={() => navigate(`/events/${id}/attendance`)}
                            style={{
                                width: '100%',
                                background: '#4c51bf',
                                border: 'none',
                                borderRadius: 10,
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
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#434190';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={e => { 
                                e.currentTarget.style.background = '#4c51bf';
                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'; 
                            }}
                        >
                            <span style={{ fontSize: 18 }}>📋</span>
                            Manage Attendance
                        </button>
                        
                        <button
                            onClick={() => navigate(`/events/${id}/feedback`)}
                            style={{
                                width: '100%',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '14px 24px',
                                color: '#1a2332',
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
                                e.currentTarget.style.background = '#f7fafc';
                                e.currentTarget.style.borderColor = '#cbd5e0';
                            }}
                            onMouseLeave={e => { 
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
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
                                background: '#f0fff4',
                                border: '1px solid #9ae6b4',
                                borderRadius: 12,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>✓</span>
                                <p style={{ fontSize: 14, color: '#38a169', margin: 0, fontWeight: 600 }}>
                                    You're registered for {event.title}!
                                </p>
                            </div>
                        )}

                        {registerError && (
                            <div style={{
                                background: '#fff5f5',
                                border: '1px solid #feb2b2',
                                borderRadius: 12,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>⚠</span>
                                <p style={{ fontSize: 14, color: '#e53e3e', margin: 0 }}>
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
                                    background: registering ? '#9ae6b4' : '#38a169',
                                    border: 'none',
                                    borderRadius: 10,
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
                                    opacity: registering ? 0.7 : 1,
                                }}
                                onMouseEnter={e => {
                                    if (!registering) e.currentTarget.style.background = '#2f855a';
                                }}
                                onMouseLeave={e => {
                                    if (!registering) e.currentTarget.style.background = '#38a169';
                                }}
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
                                background: '#ffffff',
                                border: '1px solid #9ae6b4',
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
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
                                        background: '#f0fff4',
                                        border: '2px solid #9ae6b4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                    }}>✓</div>
                                    <div>
                                        <p style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            color: '#38a169',
                                            margin: '0 0 2px',
                                        }}>
                                            You're Registered
                                        </p>
                                        <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
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
                                        background: '#ffffff',
                                        border: '1px solid #feb2b2',
                                        borderRadius: 8,
                                        padding: '10px 20px',
                                        color: '#e53e3e',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: registering ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!registering) {
                                            e.currentTarget.style.background = '#fff5f5';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#ffffff';
                                    }}
                                >
                                    {registering ? 'Processing...' : 'Cancel Registration'}
                                </button>
                            </div>
                        )}

                        {event.status === 'cancelled' && (
                            <div style={{
                                background: '#fff5f5',
                                border: '1px solid #feb2b2',
                                borderRadius: 12,
                                padding: 20,
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 14, color: '#e53e3e', margin: 0 }}>
                                    This event has been cancelled
                                </p>
                            </div>
                        )}

                        {event.status === 'completed' && !registration && (
                            <div style={{
                                background: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: 20,
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>
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
                                background: '#eef2ff',
                                border: '1px solid #c3dafe',
                                borderRadius: 12,
                                padding: '16px 20px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>✓</span>
                                <p style={{ fontSize: 14, color: '#4c51bf', margin: 0, fontWeight: 600 }}>
                                    Thank you for your feedback!
                                </p>
                            </div>
                        )}

                        {!hasFeedback ? (
                            <button
                                onClick={() => setShowFeedbackForm(true)}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 10,
                                    padding: '14px 24px',
                                    color: '#1a2332',
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
                                    e.currentTarget.style.background = '#f7fafc';
                                    e.currentTarget.style.borderColor = '#cbd5e0';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <span style={{ fontSize: 18 }}>💬</span>
                                Give Feedback
                            </button>
                        ) : (
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid #c3dafe',
                                borderRadius: 12,
                                padding: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: '#eef2ff',
                                    border: '2px solid #c3dafe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                }}>✓</div>
                                <p style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: '#4c51bf',
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
