import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { registrationsApi, type RegistrationResponse } from '../api/registrations';
import { attendanceApi, type AttendanceResponse } from '../api/attendance';

export default function Attendance() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
    const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingIn, setCheckingIn] = useState<string | null>(null); // user_id being checked in

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            // Load event, registrations, and attendance in parallel
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

        // Check if already attended
        if (attendance.some(a => a.user_id === userId)) {
            return; // Already checked in
        }

        try {
            setCheckingIn(userId);
            const newAttendance = await attendanceApi.recordAttendance(id, { user_id: userId });
            
            // Update attendance list
            setAttendance(prev => [...prev, newAttendance]);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to record attendance';
            alert(errorMsg); // Simple error feedback
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

    const getAttendanceStatus = (userId: string) => {
        return attendance.find(a => a.user_id === userId);
    };

    const attendanceCount = attendance.length;
    const totalRegistrations = registrations.length;
    const attendanceRate = totalRegistrations > 0 
        ? ((attendanceCount / totalRegistrations) * 100).toFixed(1) 
        : '0';

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
        statCard: {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '20px',
            flex: 1,
            minWidth: 160,
        },
        participantRow: {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
        },
        checkInButton: {
            background: 'rgba(34,211,153,0.15)',
            border: '1px solid rgba(34,211,153,0.3)',
            borderRadius: 8,
            padding: '7px 14px',
            color: '#34d399',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap' as const,
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
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading attendance...</p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            </div>
        );
    }

    if (error || !event) {
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
                    }}>🚫</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>
                        {error || 'Event not found'}
                    </h2>
                    <button
                        onClick={() => navigate(`/events/${id}`)}
                        style={{
                            marginTop: 16,
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
                        Back to Event
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
                onClick={() => navigate(`/events/${id}`)}
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
                ← Back to Event
            </button>

            {/* Header */}
            <div style={S.section}>
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
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#818cf8',
                    marginBottom: 12,
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8' }} />
                    Attendance Management
                </div>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#f1f5f9',
                    margin: '0 0 8px',
                }}>
                    {event.title}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                    {formatDate(event.start_datetime)}
                </p>
            </div>

            {/* Statistics */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={S.statCard}>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Total Registrations
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
                        {totalRegistrations}
                    </p>
                </div>

                <div style={S.statCard}>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Checked In
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#34d399', margin: 0, letterSpacing: '-0.02em' }}>
                        {attendanceCount}
                    </p>
                </div>

                <div style={S.statCard}>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Attendance Rate
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#818cf8', margin: 0, letterSpacing: '-0.02em' }}>
                        {attendanceRate}%
                    </p>
                </div>
            </div>

            {/* Participants List */}
            <div style={S.section}>
                <h2 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    margin: '0 0 20px',
                }}>
                    Registered Participants
                </h2>

                {registrations.length === 0 && (
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
                        }}>👥</div>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                            No registrations yet for this event.
                        </p>
                    </div>
                )}

                {registrations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {registrations.map(reg => {
                            const attendanceRecord = getAttendanceStatus(reg.user_id);
                            const isAttended = !!attendanceRecord;
                            const isCheckingInThis = checkingIn === reg.user_id;

                            return (
                                <div key={reg._id} style={S.participantRow}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', margin: '0 0 4px' }}>
                                            User ID: {reg.user_id.substring(0, 8)}...
                                        </p>
                                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                            Registered: {formatDate(reg.registration_timestamp)}
                                        </p>
                                    </div>

                                    {isAttended ? (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '7px 14px',
                                            borderRadius: 8,
                                            background: 'rgba(34,211,153,0.1)',
                                            border: '1px solid rgba(34,211,153,0.2)',
                                        }}>
                                            <span style={{ fontSize: 14 }}>✓</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                                                Checked In
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleCheckIn(reg.user_id)}
                                            disabled={isCheckingInThis}
                                            style={{
                                                ...S.checkInButton,
                                                opacity: isCheckingInThis ? 0.5 : 1,
                                                cursor: isCheckingInThis ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isCheckingInThis) {
                                                    e.currentTarget.style.background = 'rgba(34,211,153,0.25)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(34,211,153,0.15)';
                                            }}
                                        >
                                            {isCheckingInThis ? 'Checking In...' : 'Check In'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
