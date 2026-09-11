import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { feedbackApi, type FeedbackResponse } from '../api/feedback';

export default function EventFeedback() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [feedback, setFeedback] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            const [eventData, feedbackData] = await Promise.all([
                eventsApi.getEvent(id),
                feedbackApi.getEventFeedback(id),
            ]);

            setEvent(eventData);
            setFeedback(feedbackData);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You are not authorized to view feedback for this event');
            } else if (err.response?.status === 404) {
                setError('Event not found');
            } else {
                setError(err.response?.data?.detail || 'Failed to load feedback');
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
            minute: '2-digit',
        });
    };

    // Calculate statistics
    const totalResponses = feedback.length;
    const averageRating = totalResponses > 0
        ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalResponses).toFixed(1)
        : '0.0';
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
        const count = feedback.filter(f => f.rating === rating).length;
        const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(0) : '0';
        return { rating, count, percentage };
    });

    // Collect all tags
    const allTags = feedback.flatMap(f => f.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

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
        feedbackCard: {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '18px 20px',
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
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading feedback...</p>
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
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 999,
                    padding: '3px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#a78bfa',
                    marginBottom: 12,
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                    Event Feedback
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
                    Feedback received from participants
                </p>
            </div>

            {/* Statistics */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={S.statCard}>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Total Responses
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
                        {totalResponses}
                    </p>
                </div>

                <div style={S.statCard}>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                        Average Rating
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <p style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24', margin: 0, letterSpacing: '-0.02em' }}>
                            {averageRating}
                        </p>
                        <span style={{ fontSize: 18, color: '#fbbf24' }}>★</span>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            {totalResponses > 0 && (
                <div style={S.section}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px' }}>
                        Rating Distribution
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {ratingDistribution.reverse().map(({ rating, count, percentage }) => (
                            <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 14, color: '#fbbf24', width: 60, flexShrink: 0 }}>
                                    {rating} ★
                                </span>
                                <div style={{
                                    flex: 1,
                                    height: 24,
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${percentage}%`,
                                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                                <span style={{ fontSize: 13, color: '#64748b', width: 80, flexShrink: 0, textAlign: 'right' }}>
                                    {count} ({percentage}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Tags */}
            {topTags.length > 0 && (
                <div style={S.section}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 16px' }}>
                        Popular Tags
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {topTags.map(({ tag, count }) => (
                            <span key={tag} style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'rgba(99,102,241,0.1)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                color: '#818cf8',
                                fontSize: 12,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                {tag}
                                <span style={{
                                    background: 'rgba(99,102,241,0.2)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}>
                                    {count}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Individual Feedback */}
            <div style={S.section}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px' }}>
                    All Feedback ({totalResponses})
                </h2>

                {feedback.length === 0 && (
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
                        }}>💬</div>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                            No feedback submitted yet for this event.
                        </p>
                    </div>
                )}

                {feedback.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {feedback.map(fb => (
                            <div key={fb._id} style={S.feedbackCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} style={{
                                                fontSize: 18,
                                                color: star <= (fb.rating || 0) ? '#fbbf24' : '#334155',
                                            }}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: 11, color: '#475569' }}>
                                        {formatDate(fb.submitted_timestamp)}
                                    </span>
                                </div>

                                {fb.comments && (
                                    <p style={{
                                        fontSize: 14,
                                        color: '#cbd5e1',
                                        lineHeight: 1.6,
                                        margin: '0 0 12px',
                                    }}>
                                        {fb.comments}
                                    </p>
                                )}

                                {fb.tags.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {fb.tags.map((tag, idx) => (
                                            <span key={idx} style={{
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                color: '#94a3b8',
                                                fontSize: 11,
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
