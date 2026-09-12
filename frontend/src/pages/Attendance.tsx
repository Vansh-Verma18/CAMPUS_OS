import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { registrationsApi, type RegistrationResponse } from '../api/registrations';
import { attendanceApi, type AttendanceResponse } from '../api/attendance';

// Animated counter hook
function useCounter(end: number, duration: number = 1000, delay: number = 0) {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        const startTime = Date.now() + delay;
        const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            if (progress < 0) return;
            
            setCount(Math.floor(progress * end));
            
            if (progress >= 1) {
                clearInterval(timer);
            }
        }, 16);
        
        return () => clearInterval(timer);
    }, [end, duration, delay]);
    
    return count;
}

export default function Attendance() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
    const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'checked' | 'not-checked'>('all');
    const [animateMetrics, setAnimateMetrics] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    useEffect(() => {
        if (!loading && event) {
            // Trigger animation after data loads
            setTimeout(() => setAnimateMetrics(true), 100);
        }
    }, [loading, event]);

    const loadData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const [eventData, registrationsData, attendanceData] = await Promise.all([
                eventsApi.getEvent(id),
                registrationsApi.getEventRegistrations(id),
                attendanceApi.getEventAttendance(id),
            ]);

            setEvent(eventData);
            setRegistrations(registrationsData);
            setAttendance(attendanceData);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You are not authorized to manage attendance for this event');
            } else if (err.response?.status === 404) {
                setError('Event not found');
            } else {
                setError(err.response?.data?.detail || 'Failed to load attendance data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (userId: string) => {
        if (!id || checkingIn) return;

        if (attendance.some(a => a.user_id === userId)) {
            return;
        }

        try {
            setCheckingIn(userId);
            const newAttendance = await attendanceApi.recordAttendance(id, { user_id: userId });
            setAttendance(prev => [...prev, newAttendance]);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to record attendance';
            alert(errorMsg);
        } finally {
            setCheckingIn(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const attendanceCount = attendance.length;
    const totalRegistrations = registrations.length;
    const attendanceRate = totalRegistrations > 0 
        ? parseFloat(((attendanceCount / totalRegistrations) * 100).toFixed(1))
        : 0;
    
    // Use counters for animation
    const animatedTotal = useCounter(animateMetrics ? totalRegistrations : 0, 800, 0);
    const animatedCheckedIn = useCounter(animateMetrics ? attendanceCount : 0, 800, 150);
    const animatedRate = useCounter(animateMetrics ? attendanceRate : 0, 800, 300);
    
    // Filter registrations
    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch = searchQuery === '' || 
            reg.user_id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const isCheckedIn = attendance.some(a => a.user_id === reg.user_id);
        const matchesStatus = 
            filterStatus === 'all' ||
            (filterStatus === 'checked' && isCheckedIn) ||
            (filterStatus === 'not-checked' && !isCheckedIn);
        
        return matchesSearch && matchesStatus;
    });

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
                    <p style={{ color: '#4a5568', fontSize: 14 }}>Loading attendance...</p>
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
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                        {error?.includes('not authorized') ? 'Access Denied' : 'Event Not Found'}
                    </h2>
                    <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24 }}>
                        {error || 'The event you are looking for does not exist.'}
                    </p>
                    <button
                        onClick={() => navigate(`/events/${id}`)}
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
                        ← Back to Event
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            color: '#1a2332',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            padding: '32px',
        }}>
            <style>{`
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
            
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Back button */}
                <button
                    onClick={() => navigate(`/events/${id}`)}
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
                    ← Back to Event
                </button>

                {/* Event Summary Header */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '24px 28px',
                    marginBottom: 20,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        color: '#1a2332',
                        margin: '0 0 6px',
                    }}>
                        Manage Attendance
                    </h1>
                    <p style={{ fontSize: 14, color: '#4a5568', margin: '0 0 16px' }}>
                        Track participation for this event
                    </p>
                    <div style={{
                        paddingTop: 16,
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '20px',
                        fontSize: 14,
                        color: '#4a5568',
                    }}>
                        <div>
                            <span style={{ fontWeight: 600, color: '#1a2332' }}>{event.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📅</span>
                            {formatDate(event.start_datetime)}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 20,
                }}>
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        animation: 'fadeIn 0.4s ease',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#718096',
                            margin: '0 0 8px',
                        }}>
                            Total Registrations
                        </p>
                        <p style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: '#1a2332',
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}>
                            {animatedTotal}
                        </p>
                    </div>

                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #d1fae5',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        animation: 'fadeIn 0.4s ease 0.1s',
                        animationFillMode: 'both',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#047857',
                            margin: '0 0 8px',
                        }}>
                            Checked In
                        </p>
                        <p style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: '#059669',
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}>
                            {animatedCheckedIn}
                        </p>
                    </div>

                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e0e7ff',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        animation: 'fadeIn 0.4s ease 0.2s',
                        animationFillMode: 'both',
                    }}>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#4338ca',
                            margin: '0 0 8px',
                        }}>
                            Attendance Rate
                        </p>
                        <p style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: '#4c51bf',
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}>
                            {animatedRate}%
                        </p>
                    </div>
                </div>

                {/* Participants List */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '24px 28px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: 20,
                    }}>
                        <h2 style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1a2332',
                            margin: 0,
                        }}>
                            Registered Participants ({registrations.length})
                        </h2>

                        {/* Search & Filter */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search by user ID..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    background: '#f7fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: '8px 12px',
                                    fontSize: 14,
                                    color: '#1a2332',
                                    fontFamily: 'inherit',
                                    minWidth: 200,
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.borderColor = '#4c51bf';
                                    e.currentTarget.style.outline = 'none';
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            />
                            
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                style={{
                                    background: '#f7fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: '8px 12px',
                                    fontSize: 14,
                                    color: '#1a2332',
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.borderColor = '#4c51bf';
                                    e.currentTarget.style.outline = 'none';
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <option value="all">All</option>
                                <option value="checked">Checked In</option>
                                <option value="not-checked">Not Checked In</option>
                            </select>
                        </div>
                    </div>

                    {registrations.length === 0 && (
                        <div style={{
                            padding: 60,
                            textAlign: 'center',
                            background: '#f7fafc',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a2332', margin: '0 0 6px' }}>
                                No registered participants yet
                            </p>
                            <p style={{ color: '#4a5568', fontSize: 14, margin: 0 }}>
                                Students who register for this event will appear here.
                            </p>
                        </div>
                    )}

                    {filteredRegistrations.length === 0 && registrations.length > 0 && (
                        <div style={{
                            padding: 40,
                            textAlign: 'center',
                            background: '#f7fafc',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                        }}>
                            <p style={{ color: '#4a5568', fontSize: 14, margin: 0 }}>
                                No participants match your search or filter criteria.
                            </p>
                        </div>
                    )}

                    {filteredRegistrations.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filteredRegistrations.map(reg => {
                                const attendanceRecord = attendance.find(a => a.user_id === reg.user_id);
                                const isCheckedIn = !!attendanceRecord;
                                const isCheckingInThis = checkingIn === reg.user_id;

                                return (
                                    <div
                                        key={reg._id}
                                        style={{
                                            background: isCheckedIn ? '#f0fdf4' : '#ffffff',
                                            border: `1px solid ${isCheckedIn ? '#bbf7d0' : '#e2e8f0'}`,
                                            borderRadius: 10,
                                            padding: '16px 18px',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 16,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <p style={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                color: '#1a2332',
                                                margin: '0 0 4px',
                                                fontFamily: 'monospace',
                                            }}>
                                                {reg.user_id}
                                            </p>
                                            <p style={{ fontSize: 12, color: '#4a5568', margin: 0 }}>
                                                Registered: {new Date(reg.registration_timestamp).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        {isCheckedIn ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '8px 16px',
                                                borderRadius: 8,
                                                background: '#d1fae5',
                                                border: '1px solid #86efac',
                                            }}>
                                                <span style={{ fontSize: 16, color: '#059669' }}>✓</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#047857' }}>
                                                    Checked In
                                                </span>
                                                {attendanceRecord && (
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: '#065f46',
                                                        marginLeft: 4,
                                                    }}>
                                                        {new Date(attendanceRecord.check_in_timestamp).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCheckIn(reg.user_id)}
                                                disabled={isCheckingInThis}
                                                style={{
                                                    background: isCheckingInThis ? '#e2e8f0' : '#4c51bf',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    padding: '10px 20px',
                                                    color: isCheckingInThis ? '#718096' : '#fff',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    cursor: isCheckingInThis ? 'not-allowed' : 'pointer',
                                                    fontFamily: 'inherit',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.15s',
                                                    minWidth: 120,
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isCheckingInThis) {
                                                        e.currentTarget.style.background = '#434190';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isCheckingInThis) {
                                                        e.currentTarget.style.background = '#4c51bf';
                                                    }
                                                }}
                                            >
                                                {isCheckingInThis ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                                        <span style={{
                                                            width: 12,
                                                            height: 12,
                                                            border: '2px solid #cbd5e0',
                                                            borderTopColor: '#718096',
                                                            borderRadius: '50%',
                                                            display: 'inline-block',
                                                            animation: 'spin 0.6s linear infinite',
                                                        }} />
                                                        Checking In...
                                                    </span>
                                                ) : (
                                                    'Check In'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
