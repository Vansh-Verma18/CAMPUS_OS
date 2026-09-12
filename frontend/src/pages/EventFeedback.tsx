import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, type EventResponse } from '../api/events';
import { feedbackApi, type FeedbackResponse } from '../api/feedback';

// Animated counter hook
function useCounter(end: number, duration: number = 1000, delay: number = 0) {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        const startTime = Date.now() + delay;
        const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            if (progress < 0) return;
            
            const value = progress * end;
            // For decimals, show one decimal place
            setCount(end % 1 !== 0 ? parseFloat(value.toFixed(1)) : Math.floor(value));
            
            if (progress >= 1) {
                clearInterval(timer);
            }
        }, 16);
        
        return () => clearInterval(timer);
    }, [end, duration, delay]);
    
    return count;
}

export default function EventFeedback() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [feedback, setFeedback] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
        ? parseFloat((feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalResponses).toFixed(1))
        : 0;
    
    // Use counters for animation
    const animatedTotal = useCounter(animateMetrics ? totalResponses : 0, 800, 0);
    const animatedRating = useCounter(animateMetrics ? averageRating : 0, 800, 150);
    
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
        const count = feedback.filter(f => f.rating === rating).length;
        const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
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
                    <p style={{ color: '#4a5568', fontSize: 14 }}>Loading feedback...</p>
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
                @keyframes slideInBar{from{width:0}to{width:var(--target-width)}}
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
                        Event Feedback
                    </h1>
                    <p style={{ fontSize: 14, color: '#4a5568', margin: 0 }}>
                        Understand how participants experienced this event
                    </p>
                    <div style={{
                        paddingTop: 16,
                        marginTop: 16,
                        borderTop: '1px solid #e2e8f0',
                        fontSize: 14,
                        color: '#1a2332',
                        fontWeight: 600,
                    }}>
                        {event.title}
                    </div>
                </div>

                {/* Summary Statistics */}
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
                            Total Responses
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
                        border: '1px solid #fef3c7',
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
                            color: '#b45309',
                            margin: '0 0 8px',
                        }}>
                            Average Rating
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <p style={{
                                fontSize: 36,
                                fontWeight: 700,
                                color: '#d97706',
                                margin: 0,
                                letterSpacing: '-0.02em',
                            }}>
                                {animatedRating.toFixed(1)}
                            </p>
                            <span style={{ fontSize: 20, color: '#f59e0b' }}>★</span>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                {totalResponses > 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '24px 28px',
                        marginBottom: 20,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <h2 style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1a2332',
                            margin: '0 0 20px',
                        }}>
                            Rating Distribution
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {ratingDistribution.map(({ rating, count, percentage }) => (
                                <div key={rating} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        width: 70,
                                        flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a2332' }}>
                                            {rating}
                                        </span>
                                        <span style={{ fontSize: 16, color: '#f59e0b' }}>★</span>
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        height: 32,
                                        background: '#f7fafc',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: animateMetrics ? `${percentage}%` : '0%',
                                                background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transitionDelay: `${rating * 0.1}s`,
                                                borderRadius: 7,
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        width: 100,
                                        flexShrink: 0,
                                        textAlign: 'right',
                                        fontSize: 13,
                                        color: '#4a5568',
                                    }}>
                                        <span style={{ fontWeight: 600, color: '#1a2332' }}>{count}</span>
                                        {' '}
                                        <span style={{ color: '#718096' }}>({percentage}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Tags */}
                {topTags.length > 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '24px 28px',
                        marginBottom: 20,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <h2 style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1a2332',
                            margin: '0 0 16px',
                        }}>
                            Popular Feedback Themes
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {topTags.map(({ tag, count }) => (
                                <span
                                    key={tag}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        background: '#eef2ff',
                                        border: '1px solid #c3dafe',
                                        color: '#4c51bf',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {tag}
                                    <span style={{
                                        background: '#c3dafe',
                                        padding: '2px 7px',
                                        borderRadius: 5,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#3730a3',
                                    }}>
                                        {count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Individual Feedback */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '24px 28px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <h2 style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#1a2332',
                        margin: '0 0 20px',
                    }}>
                        All Feedback ({totalResponses})
                    </h2>

                    {feedback.length === 0 && (
                        <div style={{
                            padding: 60,
                            textAlign: 'center',
                            background: '#f7fafc',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a2332', margin: '0 0 6px' }}>
                                No feedback yet
                            </p>
                            <p style={{ color: '#4a5568', fontSize: 14, margin: 0 }}>
                                Participant feedback will appear here after the event.
                            </p>
                        </div>
                    )}

                    {feedback.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {feedback.map(fb => (
                                <div
                                    key={fb._id}
                                    style={{
                                        background: '#f7fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 10,
                                        padding: '20px 22px',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 14,
                                        flexWrap: 'wrap',
                                        gap: 12,
                                    }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span
                                                    key={star}
                                                    style={{
                                                        fontSize: 18,
                                                        color: star <= (fb.rating || 0) ? '#f59e0b' : '#e2e8f0',
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span style={{
                                            fontSize: 12,
                                            color: '#718096',
                                        }}>
                                            {formatDate(fb.submitted_timestamp)}
                                        </span>
                                    </div>

                                    {fb.comments && (
                                        <p style={{
                                            fontSize: 14,
                                            color: '#1a2332',
                                            lineHeight: 1.6,
                                            margin: '0 0 14px',
                                        }}>
                                            {fb.comments}
                                        </p>
                                    )}

                                    {fb.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {fb.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#4a5568',
                                                        fontSize: 12,
                                                    }}
                                                >
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
        </div>
    );
}
