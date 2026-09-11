import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { queryAI } from '../api/ai';
import type { AIQueryResponse, AIClaim } from '../api/ai';

const SUGGESTED_QUESTIONS = [
    'What events are happening this week?',
    'Which clubs are most active?',
    'Which events have the highest registrations?',
    'Can I schedule a hackathon on Saturday?',
    'What should I consider before organizing a large event?',
];

const CLAIM_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    VERIFIED: {
        label: 'Verified',
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.25)',
        dot: '#22c55e',
    },
    DERIVED: {
        label: 'Derived',
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.08)',
        border: 'rgba(96,165,250,0.25)',
        dot: '#60a5fa',
    },
    RECOMMENDATION: {
        label: 'Recommendation',
        color: '#fbbf24',
        bg: 'rgba(251,191,36,0.08)',
        border: 'rgba(251,191,36,0.25)',
        dot: '#fbbf24',
    },
    INSUFFICIENT_EVIDENCE: {
        label: 'Insufficient Evidence',
        color: '#94a3b8',
        bg: 'rgba(148,163,184,0.08)',
        border: 'rgba(148,163,184,0.25)',
        dot: '#94a3b8',
    },
};

function ClaimBadge({ type }: { type: string }) {
    const cfg = CLAIM_CONFIG[type] ?? CLAIM_CONFIG.VERIFIED;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 10px',
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
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: cfg.dot,
                    display: 'inline-block',
                }}
            />
            {cfg.label}
        </span>
    );
}

function ClaimCard({ claim }: { claim: AIClaim }) {
    const cfg = CLAIM_CONFIG[claim.type] ?? CLAIM_CONFIG.VERIFIED;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                marginBottom: 8,
            }}
        >
            <div style={{ paddingTop: 2, flexShrink: 0 }}>
                <ClaimBadge type={claim.type} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>
                    {claim.text}
                </p>
                {claim.source && (
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                        Source: <code style={{ color: '#94a3b8' }}>{claim.source}</code>
                    </span>
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            {[80, 95, 70].map((w, i) => (
                <div
                    key={i}
                    style={{
                        height: 14,
                        borderRadius: 7,
                        background: 'rgba(255,255,255,0.06)',
                        marginBottom: 10,
                        width: `${w}%`,
                    }}
                />
            ))}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{ height: 28, width: 90, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}
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
            const res = await queryAI(query);
            setResponse(res);
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
                background: '#080c18',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                color: '#e2e8f0',
            }}
        >
            {/* Page-specific keyframes */}
            <style>{`
                textarea:focus { outline: none; }
                button:focus { outline: none; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            `}</style>

            {/* Main */}
            <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(99,102,241,0.12)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: 999,
                            padding: '4px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#818cf8',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            marginBottom: 20,
                        }}
                    >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        AI Operations Agent
                    </div>
                    <h1
                        style={{
                            fontSize: 'clamp(28px, 5vw, 44px)',
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            margin: '0 0 16px',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #c7d2fe 50%, #818cf8 100%)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'gradientShift 4s ease infinite',
                        }}
                    >
                        Ask CampusOS
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16, margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                        Evidence-backed answers from your institution's live operational data.
                        Every claim is verified, derived, or clearly labelled as a recommendation.
                    </p>
                </div>

                {/* Query Card */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 24,
                        backdropFilter: 'blur(8px)',
                        transition: 'border-color 0.2s',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-end',
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <textarea
                                id="ai-question-input"
                                ref={textareaRef}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything about your institution… (Ctrl+Enter to submit)"
                                rows={3}
                                style={{
                                    width: '100%',
                                    resize: 'none',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    color: '#f1f5f9',
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
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
                                    ? 'rgba(99,102,241,0.3)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px 20px',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                whiteSpace: 'nowrap',
                                minHeight: 52,
                            }}
                            onMouseEnter={e => {
                                if (!loading && question.trim()) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
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
                                    Thinking…
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: 16 }}>✦</span>
                                    Ask
                                </>
                            )}
                        </button>
                    </div>

                    {/* Suggested questions */}
                    <div style={{ marginTop: 16 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        padding: '6px 12px',
                                        color: '#94a3b8',
                                        fontSize: 12,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.15s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                                            e.currentTarget.style.color = '#c7d2fe';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = '#94a3b8';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 28,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 20,
                                color: '#818cf8',
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <span
                                style={{
                                    width: 16,
                                    height: 16,
                                    border: '2px solid rgba(99,102,241,0.3)',
                                    borderTopColor: '#818cf8',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                            Retrieving institutional data and generating response…
                        </div>
                        <LoadingSkeleton />
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div
                        style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 16,
                            padding: 24,
                            animation: 'fadeIn 0.3s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 18 }}>⚠</span>
                            <p style={{ margin: 0, fontWeight: 600, color: '#f87171', fontSize: 14 }}>Error</p>
                        </div>
                        <p style={{ margin: '0 0 16px', color: '#fca5a5', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
                        <button
                            id="ai-retry-btn"
                            onClick={() => handleSubmit()}
                            style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 8,
                                padding: '6px 16px',
                                color: '#f87171',
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Response */}
                {response && !loading && (
                    <div
                        id="ai-response-area"
                        ref={responseRef}
                        style={{
                            animation: 'fadeIn 0.4s ease',
                        }}
                    >
                        {/* Answer */}
                        <div
                            style={{
                                background: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 16,
                                padding: 28,
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 14,
                                    color: '#818cf8',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                <span>✦</span> CampusOS AI Response
                                {response.processing_time_ms && (
                                    <span style={{ marginLeft: 'auto', color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
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
                                    color: '#e2e8f0',
                                    fontWeight: 400,
                                }}
                            >
                                {response.answer}
                            </p>
                        </div>

                        {/* Claims */}
                        {response.claims.length > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 16,
                                    padding: 24,
                                    marginBottom: 16,
                                }}
                            >
                                <SectionHeader label="Evidence & Claims" />
                                <div style={{ marginTop: 14 }}>
                                    {response.claims.map((claim, i) => (
                                        <ClaimCard key={i} claim={claim} />
                                    ))}
                                </div>
                                {/* Legend */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
                                    background: 'rgba(251,191,36,0.04)',
                                    border: '1px solid rgba(251,191,36,0.15)',
                                    borderRadius: 16,
                                    padding: 24,
                                    marginBottom: 16,
                                }}
                            >
                                <SectionHeader label="Recommendations" color="#fbbf24" />
                                <ul style={{ margin: '14px 0 0', paddingLeft: 20, color: '#e2e8f0', fontSize: 14, lineHeight: 1.7 }}>
                                    {response.recommendations.map((rec, i) => (
                                        <li key={i} style={{ marginBottom: 6 }}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Sources */}
                        {response.sources.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    flexWrap: 'wrap',
                                    padding: '14px 20px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                }}
                            >
                                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Sources
                                </span>
                                {response.sources.map((src, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 6,
                                            padding: '2px 10px',
                                            fontSize: 12,
                                            color: '#94a3b8',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {src}
                                    </span>
                                ))}
                                {response.role_context && (
                                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>
                                        Scoped to role:{' '}
                                        <code
                                            style={{
                                                color: roleColor[response.role_context] ?? '#94a3b8',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {response.role_context}
                                        </code>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !response && !error && (
                    <div style={{ textAlign: 'center', paddingTop: 40 }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                                border: '1px solid rgba(99,102,241,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 28,
                                margin: '0 auto 16px',
                            }}
                        >
                            ✦
                        </div>
                        <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
                            Ask a question to get started. Every answer is evidence-backed.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}


function SectionHeader({ label, color = '#94a3b8' }: { label: string; color?: string }) {
    return (
        <p
            style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color,
            }}
        >
            {label}
        </p>
    );
}
