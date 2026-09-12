import { useState } from 'react';
import { feedbackApi, type FeedbackCreate } from '../api/feedback';

interface FeedbackFormProps {
    eventId: string;
    eventTitle: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const SUGGESTED_TAGS = [
    'Well Organized',
    'Informative',
    'Engaging',
    'Useful',
    'Interactive',
    'Great Speakers',
    'Good Venue',
    'Inspiring',
];

export function FeedbackForm({ eventId, eventTitle, onSuccess, onCancel }: FeedbackFormProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comments, setComments] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

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
                tags: selectedTags,
            };

            await feedbackApi.submitFeedback(eventId, feedbackData);
            setSuccess(true);
            
            // Show success state briefly before closing
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to submit feedback';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingLabel = (r: number) => {
        const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        return labels[r];
    };

    if (success) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                    animation: 'fadeIn 0.2s ease',
                }}
                onClick={onCancel}
            >
                <style>{`
                    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                    @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
                `}</style>
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 12,
                        padding: 40,
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#d1fae5',
                        border: '3px solid #86efac',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        margin: '0 auto 16px',
                    }}>
                        ✓
                    </div>
                    <h2 style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#1a2332',
                        margin: '0 0 8px',
                    }}>
                        Feedback Submitted
                    </h2>
                    <p style={{
                        fontSize: 14,
                        color: '#4a5568',
                        margin: 0,
                    }}>
                        Thank you for sharing your experience!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={onCancel}
        >
            <style>{`
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: 32,
                    maxWidth: 560,
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    animation: 'slideUp 0.3s ease',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#1a2332',
                        margin: '0 0 8px',
                        letterSpacing: '-0.01em',
                    }}>
                        Share Your Feedback
                    </h2>
                    <p style={{ fontSize: 14, color: '#4a5568', margin: 0 }}>
                        How was your experience with <strong>{eventTitle}</strong>?
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Rating */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1a2332',
                            marginBottom: 10,
                        }}>
                            How would you rate this event? <span style={{ color: '#e53e3e' }}>*</span>
                        </label>
                        <div style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 8,
                        }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 36,
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: star <= (hoverRating || rating) ? '#f59e0b' : '#e2e8f0',
                                        transition: 'all 0.15s',
                                        transform: star === hoverRating ? 'scale(1.1)' : 'scale(1)',
                                        userSelect: 'none',
                                    }}
                                    aria-label={`Rate ${star} stars`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p style={{
                                fontSize: 13,
                                color: '#4a5568',
                                margin: 0,
                                fontWeight: 500,
                            }}>
                                {getRatingLabel(rating)}
                            </p>
                        )}
                    </div>

                    {/* Comments */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1a2332',
                            marginBottom: 8,
                        }}>
                            Comments (Optional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            placeholder="Tell us what you liked or what we could improve..."
                            style={{
                                width: '100%',
                                background: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 14px',
                                color: '#1a2332',
                                fontSize: 14,
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                minHeight: 100,
                                transition: 'border-color 0.15s',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = '#4c51bf';
                                e.currentTarget.style.outline = 'none';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1a2332',
                            marginBottom: 10,
                        }}>
                            Select Tags (Optional)
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {SUGGESTED_TAGS.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            background: isSelected ? '#eef2ff' : '#ffffff',
                                            border: `1px solid ${isSelected ? '#c3dafe' : '#e2e8f0'}`,
                                            color: isSelected ? '#4c51bf' : '#4a5568',
                                            fontSize: 13,
                                            fontWeight: isSelected ? 600 : 500,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = '#cbd5e0';
                                                e.currentTarget.style.background = '#f7fafc';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#ffffff';
                                            }
                                        }}
                                    >
                                        {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#fff5f5',
                            border: '1px solid #feb2b2',
                            borderRadius: 8,
                            padding: '12px 16px',
                            color: '#c53030',
                            fontSize: 13,
                            marginBottom: 24,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <span style={{ fontSize: 16 }}>⚠</span>
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
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '12px 20px',
                                color: '#4a5568',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                opacity: submitting ? 0.5 : 1,
                            }}
                            onMouseEnter={e => {
                                if (!submitting) {
                                    e.currentTarget.style.background = '#f7fafc';
                                    e.currentTarget.style.borderColor = '#cbd5e0';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
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
                                    ? '#cbd5e0'
                                    : '#4c51bf',
                                border: 'none',
                                borderRadius: 8,
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
                                    e.currentTarget.style.background = '#434190';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!submitting && rating > 0) {
                                    e.currentTarget.style.background = '#4c51bf';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
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
