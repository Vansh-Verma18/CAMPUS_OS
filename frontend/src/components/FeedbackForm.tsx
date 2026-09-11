import { useState } from 'react';
import { feedbackApi, type FeedbackCreate } from '../api/feedback';

interface FeedbackFormProps {
    eventId: string;
    eventTitle: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function FeedbackForm({ eventId, eventTitle, onSuccess, onCancel }: FeedbackFormProps) {
    const [rating, setRating] = useState<number>(0);
    const [comments, setComments] = useState('');
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const feedbackData: FeedbackCreate = {
                rating,
                comments: comments.trim() || undefined,
                tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            };

            await feedbackApi.submitFeedback(eventId, feedbackData);
            onSuccess();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to submit feedback';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const S = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            animation: 'fadeIn 0.2s ease',
        },
        modal: {
            background: '#0c1120',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto' as const,
            animation: 'slideUp 0.3s ease',
        },
        label: {
            display: 'block',
            fontSize: 13,
            fontWeight: 500 as const,
            color: '#94a3b8',
            marginBottom: 8,
        },
        input: {
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#f1f5f9',
            fontSize: 14,
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
        },
        textarea: {
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#f1f5f9',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical' as const,
            minHeight: 100,
            transition: 'border-color 0.2s',
        },
        star: {
            fontSize: 32,
            cursor: 'pointer',
            transition: 'all 0.2s',
            userSelect: 'none' as const,
        },
    };

    return (
        <div style={S.overlay} onClick={onCancel}>
            <style>{`
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#f1f5f9',
                        margin: '0 0 8px',
                        letterSpacing: '-0.02em',
                    }}>
                        Event Feedback
                    </h2>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                        Share your experience with "{eventTitle}"
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Rating */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Rating *</label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    style={{
                                        ...S.star,
                                        color: star <= rating ? '#fbbf24' : '#334155',
                                    }}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </p>
                        )}
                    </div>

                    {/* Comments */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Comments (Optional)</label>
                        <textarea
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            placeholder="Share your thoughts about the event..."
                            style={S.textarea}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Tags (Optional)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="e.g. Informative, Well-Organized, Engaging"
                            style={S.input}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }}
                        />
                        <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                            Separate multiple tags with commas
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 10,
                            padding: '12px 16px',
                            color: '#f87171',
                            fontSize: 13,
                            marginBottom: 20,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10,
                                padding: '12px 20px',
                                color: '#94a3b8',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                if (!submitting) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.color = '#e2e8f0';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            style={{
                                flex: 1,
                                background: submitting || rating === 0
                                    ? 'rgba(99,102,241,0.3)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: 10,
                                padding: '12px 20px',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                if (!submitting && rating > 0) {
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
