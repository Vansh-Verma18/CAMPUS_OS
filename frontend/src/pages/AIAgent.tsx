import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { queryAI } from '../api/ai';
import type { AIQueryResponse, AIClaim, ConversationMessage } from '../api/ai';
import { FileText, CheckCircle2, Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
    'What events are happening this week?',
    'Which clubs organized the most events?',
    'How did our hackathons perform?',
    'Which events had the highest attendance?',
    'What should I consider before planning a large event?',
];

const CLAIM_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: string }> = {
    VERIFIED: {
        label: 'Verified',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.25)',
        dot: '#10B981',
        icon: '✓',
    },
    DERIVED: {
        label: 'Derived',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)',
        border: 'rgba(59, 130, 246, 0.25)',
        dot: '#3B82F6',
        icon: '◈',
    },
    RECOMMENDATION: {
        label: 'Recommendation',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.08)',
        border: 'rgba(139, 92, 246, 0.25)',
        dot: '#8B5CF6',
        icon: '★',
    },
    INSUFFICIENT_EVIDENCE: {
        label: 'Insufficient Evidence',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.25)',
        dot: '#F59E0B',
        icon: '⚠',
    },
};

function ClaimBadge({ type }: { type: string }) {
    const cfg = CLAIM_CONFIG[type] ?? CLAIM_CONFIG.VERIFIED;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}
        >
            <span style={{ fontSize: 12 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function ClaimCard({ claim, index }: { claim: AIClaim; index: number }) {
    const cfg = CLAIM_CONFIG[claim.type] ?? CLAIM_CONFIG.VERIFIED;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                marginBottom: 10,
                animation: `fadeInUp 0.4s ease ${index * 0.1}s both`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${cfg.border}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
            }}
        >
            <div style={{ paddingTop: 3, flexShrink: 0 }}>
                <ClaimBadge type={claim.type} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: '#1a202c', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                    {claim.text}
                </p>
                {claim.source && (
                    <div style={{ 
                        marginTop: 8, 
                        paddingTop: 8, 
                        borderTop: `1px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}>
                        <FileText size={12} style={{ color: cfg.color, opacity: 0.7 }} />
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                            Source: <span style={{ color: cfg.color, fontWeight: 600 }}>{claim.source}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <style>{`
                @keyframes pulse { 
                    0%, 100% { opacity: 1; } 
                    50% { opacity: 0.4; } 
                }
            `}</style>
            {[85, 95, 75, 90].map((w, i) => (
                <div
                    key={i}
                    style={{
                        height: 16,
                        borderRadius: 8,
                        background: '#F1F5F9',
                        marginBottom: 12,
                        width: `${w}%`,
                    }}
                />
            ))}
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{ 
                            height: 32, 
                            width: 100, 
                            borderRadius: 8, 
                            background: '#F1F5F9',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function AIAgent() {
    const location = useLocation();
    const [question, setQuestion] = useState((location.state as any)?.question ?? '');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIQueryResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const responseRef = useRef<HTMLDivElement>(null);

    // Auto-submit if navigated from Dashboard with a pre-filled question
    useEffect(() => {
        const preQ = (location.state as any)?.question;
        if (preQ) handleSubmit(preQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (response && responseRef.current) {
            responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [response]);

    const handleSubmit = async (q?: string) => {
        const query = (q ?? question).trim();
        if (!query || loading) return;
        setQuestion(query);
        setLoading(true);
        setError(null);
        setResponse(null);
        try {
            const res = await queryAI(query, conversationHistory);
            setResponse(res);
            // Append this turn to conversation history (keep last 10)
            setConversationHistory(prev => [
                ...prev,
                { role: 'user' as const, content: query },
                { role: 'assistant' as const, content: res.answer },
            ].slice(-10));
        } catch (err: any) {
            setError(err.message ?? 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const roleColor: Record<string, string> = {
        admin: '#a78bfa',
        faculty: '#60a5fa',
        organizer: '#34d399',
        student: '#fbbf24',
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#F8F9FB',
                fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: '#1a202c',
                padding: '40px 24px 80px',
            }}
        >
            {/* Page-specific styles and animations */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                textarea:focus { outline: none; }
                button:focus { outline: none; }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                
                @keyframes float-gentle {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

            {/* Main Container */}
            <main style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
                {/* Header */}
                <header style={{ marginBottom: 40, animation: 'fadeInUp 0.6s ease' }}>
                    {/* Status Badge */}
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(79, 70, 229, 0.08)',
                            border: '1px solid rgba(79, 70, 229, 0.2)',
                            borderRadius: 999,
                            padding: '6px 14px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#4F46E5',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: 16,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#4F46E5',
                                display: 'inline-block',
                                animation: 'pulse-slow 2s ease-in-out infinite',
                            }}
                        />
                        Campus Intelligence
                    </div>
                    
                    {/* Main Title */}
                    <h1
                        style={{
                            fontSize: 'clamp(32px, 5vw, 48px)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            margin: '0 0 12px',
                            color: '#1a202c',
                            lineHeight: 1.1,
                        }}
                    >
                        Ask your entire institution
                    </h1>
                    
                    {/* Subtitle */}
                    <p style={{ 
                        color: '#64748b', 
                        fontSize: 16, 
                        margin: 0, 
                        maxWidth: 650,
                        lineHeight: 1.6,
                        fontWeight: 500,
                    }}>
                        Ask CampusOS about events, participation, clubs, resources, reports, and institutional history.
                    </p>
                </header>

                {/* AI Intelligence Visual (Empty State) */}
                {!loading && !response && !error && (
                    <div style={{ 
                        marginBottom: 40, 
                        display: 'flex', 
                        justifyContent: 'center',
                        animation: 'fadeInUp 0.6s ease 0.1s both',
                    }}>
                        <div style={{ 
                            position: 'relative', 
                            width: 120, 
                            height: 120,
                        }}>
                            {/* Animated AI Orb */}
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ animation: 'float-gentle 4s ease-in-out infinite' }}>
                                <defs>
                                    <radialGradient id="aiOrb" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                                        <stop offset="50%" stopColor="#6366F1" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
                                    </radialGradient>
                                    <filter id="glow-ai">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
                                    </filter>
                                </defs>
                                
                                {/* Outer ring */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#E0E7FF" strokeWidth="1" opacity="0.3" />
                                
                                {/* Middle ring */}
                                <circle cx="60" cy="60" r="38" fill="none" stroke="#C7D2FE" strokeWidth="1.5" opacity="0.4" />
                                
                                {/* Core */}
                                <circle cx="60" cy="60" r="28" fill="url(#aiOrb)" filter="url(#glow-ai)" style={{ animation: 'pulse-slow 3s ease-in-out infinite' }} />
                                
                                {/* Center dot */}
                                <circle cx="60" cy="60" r="6" fill="#6366F1" />
                                
                                {/* Connection nodes */}
                                <circle cx="60" cy="30" r="3" fill="#8B5CF6" opacity="0.8" />
                                <circle cx="85" cy="45" r="2.5" fill="#06B6D4" opacity="0.8" />
                                <circle cx="85" cy="75" r="2.5" fill="#3B82F6" opacity="0.8" />
                                <circle cx="60" cy="90" r="3" fill="#8B5CF6" opacity="0.8" />
                                <circle cx="35" cy="75" r="2.5" fill="#06B6D4" opacity="0.8" />
                                <circle cx="35" cy="45" r="2.5" fill="#3B82F6" opacity="0.8" />
                                
                                {/* Connecting lines */}
                                <path d="M 60 34 L 60 54" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                                <path d="M 82 48 L 70 56" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                                <path d="M 82 72 L 70 64" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                                <path d="M 60 86 L 60 66" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                                <path d="M 38 72 L 50 64" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                                <path d="M 38 48 L 50 56" stroke="#C7D2FE" strokeWidth="1" opacity="0.3" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Query Composer Card */}
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 32,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        animation: 'fadeInUp 0.6s ease 0.2s both',
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <label 
                            htmlFor="ai-question-input"
                            style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: 10,
                                letterSpacing: '0.02em',
                            }}
                        >
                            Your Question
                        </label>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    id="ai-question-input"
                                    ref={textareaRef}
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask CampusOS anything about your institution..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        resize: 'none',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 12,
                                        padding: '14px 16px',
                                        color: '#1a202c',
                                        fontSize: 15,
                                        lineHeight: 1.6,
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        fontWeight: 500,
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <button
                                id="ai-submit-btn"
                                onClick={() => handleSubmit()}
                                disabled={loading || !question.trim()}
                                style={{
                                    background: loading || !question.trim()
                                        ? '#CBD5E1'
                                        : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '14px 24px',
                                    color: '#ffffff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    whiteSpace: 'nowrap',
                                    minHeight: 52,
                                    boxShadow: loading || !question.trim() ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                                }}
                                onMouseEnter={e => {
                                    if (!loading && question.trim()) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = loading || !question.trim() ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)';
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span
                                            style={{
                                                width: 14,
                                                height: 14,
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'spin 0.8s linear infinite',
                                            }}
                                        />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Ask CampusOS
                                    </>
                                )}
                            </button>
                        </div>
                        <p style={{ 
                            fontSize: 11, 
                            color: '#94A3B8', 
                            margin: '8px 0 0',
                            fontWeight: 500,
                        }}>
                            Press Ctrl+Enter to submit
                        </p>
                    </div>

                    {/* Suggested Questions */}
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                        <p style={{ 
                            margin: '0 0 12px', 
                            fontSize: 12, 
                            color: '#64748b', 
                            fontWeight: 600, 
                            letterSpacing: '0.04em', 
                            textTransform: 'uppercase',
                        }}>
                            Try asking
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    id={`ai-suggestion-${i}`}
                                    onClick={() => handleSubmit(q)}
                                    disabled={loading}
                                    style={{
                                        background: '#F8F9FB',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 9999,
                                        padding: '8px 14px',
                                        color: '#475569',
                                        fontSize: 13,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.borderColor = '#6366F1';
                                            e.currentTarget.style.color = '#6366F1';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#F8F9FB';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.color = '#475569';
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #E2E8F0',
                            borderRadius: 16,
                            padding: 32,
                            animation: 'fadeInUp 0.4s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 24,
                                color: '#6366F1',
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            <span
                                style={{
                                    width: 20,
                                    height: 20,
                                    border: '2.5px solid #E0E7FF',
                                    borderTopColor: '#6366F1',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                            CampusOS is thinking...
                        </div>
                        <LoadingSkeleton />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 16,
                            padding: 24,
                            animation: 'fadeInUp 0.4s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                flexShrink: 0,
                            }}>
                                ⚠
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#DC2626', fontSize: 15 }}>
                                    CampusOS couldn't complete that request
                                </p>
                                <p style={{ margin: 0, color: '#EF4444', fontSize: 14, lineHeight: 1.6 }}>
                                    {error}
                                </p>
                            </div>
                        </div>
                        <button
                            id="ai-retry-btn"
                            onClick={() => handleSubmit()}
                            style={{
                                background: '#ffffff',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 10,
                                padding: '10px 18px',
                                color: '#DC2626',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.transform = '';
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Response Section */}
                {response && !loading && (
                    <div
                        id="ai-response-area"
                        ref={responseRef}
                        style={{
                            animation: 'fadeInUp 0.5s ease',
                        }}
                    >
                        {/* Main Answer */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: 16,
                                padding: 28,
                                marginBottom: 20,
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 16,
                                }}
                            >
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                }}>
                                    <Sparkles size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: '#6366F1',
                                    }}>
                                        CampusOS Response
                                    </p>
                                </div>
                                {response.processing_time_ms && (
                                    <span style={{ 
                                        fontSize: 11, 
                                        color: '#94A3B8', 
                                        fontWeight: 500,
                                        background: '#F8F9FB',
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                    }}>
                                        {response.processing_time_ms}ms
                                    </span>
                                )}
                            </div>
                            <p
                                id="ai-response-answer"
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    lineHeight: 1.75,
                                    color: '#1a202c',
                                    fontWeight: 500,
                                }}
                            >
                                {response.answer}
                            </p>
                        </div>

                        {/* Evidence & Claims */}
                        {response.claims.length > 0 && (
                            <div
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 16,
                                    padding: 28,
                                    marginBottom: 20,
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 18,
                                }}>
                                    <CheckCircle2 size={20} style={{ color: '#6366F1' }} />
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: '#1a202c',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        Evidence
                                    </h3>
                                </div>
                                <p style={{
                                    margin: '0 0 20px',
                                    fontSize: 13,
                                    color: '#64748b',
                                    lineHeight: 1.6,
                                    fontWeight: 500,
                                }}>
                                    All claims are backed by institutional data. CampusOS is not guessing.
                                </p>
                                <div>
                                    {response.claims.map((claim, i) => (
                                        <ClaimCard key={i} claim={claim} index={i} />
                                    ))}
                                </div>
                                {/* Claim Type Legend */}
                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 8, 
                                    marginTop: 20, 
                                    paddingTop: 20, 
                                    borderTop: '1px solid #F1F5F9',
                                }}>
                                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
                                        Claim Types:
                                    </span>
                                    {Object.entries(CLAIM_CONFIG).map(([type]) => (
                                        <ClaimBadge key={type} type={type} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {response.recommendations.length > 0 && (
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    borderRadius: 16,
                                    padding: 28,
                                    marginBottom: 20,
                                    animation: 'fadeInUp 0.5s ease 0.2s both',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 16,
                                }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 16,
                                        flexShrink: 0,
                                    }}>
                                        ★
                                    </div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: '#8B5CF6',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        Recommended Actions
                                    </h3>
                                </div>
                                <p style={{
                                    margin: '0 0 16px',
                                    fontSize: 13,
                                    color: '#64748b',
                                    lineHeight: 1.6,
                                    fontWeight: 500,
                                }}>
                                    AI-generated suggestions based on evidence. These are recommendations, not guaranteed outcomes.
                                </p>
                                <ul style={{ 
                                    margin: 0, 
                                    paddingLeft: 20, 
                                    color: '#1a202c', 
                                    fontSize: 14, 
                                    lineHeight: 1.8,
                                }}>
                                    {response.recommendations.map((rec, i) => (
                                        <li key={i} style={{ marginBottom: 8, fontWeight: 500 }}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Sources & Context Footer */}
                        {response.sources.length > 0 && (
                            <div
                                style={{
                                    background: '#F8F9FB',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 12,
                                    padding: '16px 20px',
                                    animation: 'fadeInUp 0.5s ease 0.3s both',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 12,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FileText size={14} style={{ color: '#64748b' }} />
                                        <span style={{ 
                                            fontSize: 11, 
                                            color: '#64748b', 
                                            fontWeight: 700, 
                                            letterSpacing: '0.05em', 
                                            textTransform: 'uppercase',
                                        }}>
                                            Sources
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                                        {response.sources.slice(0, 5).map((src, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: 6,
                                                    padding: '4px 10px',
                                                    fontSize: 11,
                                                    color: '#475569',
                                                    fontFamily: 'monospace',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {src}
                                            </span>
                                        ))}
                                        {response.sources.length > 5 && (
                                            <span style={{
                                                padding: '4px 10px',
                                                fontSize: 11,
                                                color: '#94A3B8',
                                                fontWeight: 600,
                                            }}>
                                                +{response.sources.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                    {response.role_context && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingLeft: 12,
                                            borderLeft: '1px solid #E2E8F0',
                                        }}>
                                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                                                Using data available to you
                                            </span>
                                            <span style={{
                                                background: roleColor[response.role_context] ?? '#94A3B8',
                                                color: '#ffffff',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}>
                                                {response.role_context}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !response && !error && (
                    <div style={{ 
                        textAlign: 'center', 
                        paddingTop: 20,
                        animation: 'fadeInUp 0.6s ease 0.3s both',
                    }}>
                        <p style={{ 
                            color: '#64748b', 
                            fontSize: 14, 
                            margin: 0,
                            fontWeight: 500,
                            lineHeight: 1.8,
                            maxWidth: 550,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}>
                            CampusOS connects events, clubs, participation, feedback, resources, analytics, and institutional records to help you understand what's happening and what to do next.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
