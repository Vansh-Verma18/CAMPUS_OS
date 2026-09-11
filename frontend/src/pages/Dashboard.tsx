import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';

const ROLE_COLOR: Record<string, string> = {
    admin: '#a78bfa',
    faculty: '#60a5fa',
    organizer: '#34d399',
    student: '#fbbf24',
};

const ROLE_TAGLINE: Record<string, string> = {
    admin: 'Institution-wide intelligence at your command.',
    faculty: 'Department insights and event coordination.',
    organizer: 'Plan events with campus-wide awareness.',
    student: 'Discover what\'s happening at your campus.',
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; sub: string; path: string; icon: string; highlight?: boolean }>> = {
    admin: [
        { label: 'AI Agent', sub: 'Ask anything about your institution', path: '/ai', icon: '✦', highlight: true },
        { label: 'Discover Events', sub: 'Browse all campus events', path: '/events', icon: '📅' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '⊕' },
        { label: 'Knowledge Base', sub: 'Upload and manage documents', path: '/institutional-memory', icon: '⊗' },
        { label: 'Analytics', sub: 'Institution-wide reporting', path: '/analytics', icon: '◈' },
    ],
    faculty: [
        { label: 'AI Agent', sub: 'Ask anything about your institution', path: '/ai', icon: '✦', highlight: true },
        { label: 'Discover Events', sub: 'Browse all campus events', path: '/events', icon: '📅' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '⊕' },
        { label: 'Knowledge Base', sub: 'Department documents', path: '/institutional-memory', icon: '⊗' },
        { label: 'Analytics', sub: 'Participation & event data', path: '/analytics', icon: '◈' },
    ],
    organizer: [
        { label: 'AI Agent', sub: 'Ask anything about your institution', path: '/ai', icon: '✦', highlight: true },
        { label: 'Discover Events', sub: 'Browse and manage events', path: '/events', icon: '📅' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '⊕' },
        { label: 'Knowledge Base', sub: 'Upload event reports', path: '/institutional-memory', icon: '⊗' },
    ],
    student: [
        { label: 'AI Agent', sub: 'Ask about campus events and activities', path: '/ai', icon: '✦', highlight: true },
        { label: 'Discover Events', sub: 'Explore what\'s happening on campus', path: '/events', icon: '📅' },
        { label: 'My Registrations', sub: 'View and manage your registrations', path: '/my-registrations', icon: '🎟️' },
    ],
};

const SUGGESTED_AI_QUESTIONS: Record<string, string[]> = {
    admin: [
        'Which events had the highest participation?',
        'What is our total event count this semester?',
        'Which clubs are most active?',
    ],
    faculty: [
        'What events are happening in the CS department?',
        'Which events had the most student engagement?',
        'What should we consider before a large symposium?',
    ],
    organizer: [
        'Can I schedule a hackathon on Saturday?',
        'What resources are available for my next event?',
        'What went well at previous tech events?',
    ],
    student: [
        'What events are happening this week?',
        'Which clubs should I join?',
        'Are there any workshops coming up?',
    ],
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<InstitutionalSummary | null>(null);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'faculty')) {
            analyticsApi.getSummary().then(setSummary).catch(() => {});
        }
    }, [user]);

    if (!user) return null;

    const roleColor = ROLE_COLOR[user.role] ?? '#94a3b8';
    const actions = QUICK_ACTIONS[user.role] ?? QUICK_ACTIONS.student;
    const aiQuestions = SUGGESTED_AI_QUESTIONS[user.role] ?? SUGGESTED_AI_QUESTIONS.student;
    const tagline = ROLE_TAGLINE[user.role] ?? '';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            padding: '40px 40px 80px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Welcome header */}
            <div style={{ marginBottom: 40, animation: 'fadeIn 0.4s ease' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: `${roleColor}18`,
                    border: `1px solid ${roleColor}33`,
                    borderRadius: 999,
                    padding: '3px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: roleColor,
                    marginBottom: 14,
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor, display: 'inline-block' }} />
                    {user.role}
                </div>
                <h1 style={{
                    fontSize: 'clamp(22px, 3vw, 32px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#f1f5f9',
                    margin: '0 0 8px',
                }}>
                    Welcome back, {user.display_name.split(' ')[0]}
                </h1>
                <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>{tagline}</p>
            </div>

            {/* Quick stats (admin/faculty only, if loaded) */}
            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 14,
                    marginBottom: 40,
                    animation: 'fadeIn 0.5s ease 0.1s both',
                }}>
                    {[
                        { label: 'Total Events', value: summary.events.total, accent: '#6366f1' },
                        { label: 'Active Clubs', value: summary.clubs.active, accent: '#22d3ee' },
                        { label: 'Registrations', value: summary.participation.total_registrations, accent: '#f59e0b' },
                        { label: 'Documents Indexed', value: summary.documents.vectorized, accent: '#34d399' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: '#0c1120',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            padding: '18px 20px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0,
                                height: 2,
                                background: `linear-gradient(90deg, ${stat.accent}, transparent)`,
                            }} />
                            <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-1px' }}>
                                {stat.value.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick actions */}
            <div style={{ marginBottom: 40, animation: 'fadeIn 0.5s ease 0.15s both' }}>
                <p style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#334155',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                }}>Quick access</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 12,
                }}>
                    {actions.map(action => (
                        <button
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            style={{
                                background: action.highlight
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
                                    : '#0c1120',
                                border: action.highlight
                                    ? '1px solid rgba(99,102,241,0.3)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 14,
                                padding: '18px 20px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = action.highlight
                                    ? 'rgba(99,102,241,0.5)'
                                    : 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.boxShadow = action.highlight
                                    ? '0 8px 24px rgba(99,102,241,0.2)'
                                    : '0 4px 16px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.borderColor = action.highlight
                                    ? 'rgba(99,102,241,0.3)'
                                    : 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <span style={{
                                fontSize: 20,
                                color: action.highlight ? '#818cf8' : '#475569',
                                lineHeight: 1,
                            }}>{action.icon}</span>
                            <p style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: action.highlight ? '#c7d2fe' : '#e2e8f0',
                                margin: 0,
                            }}>{action.label}</p>
                            <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                {action.sub}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Ask AI section */}
            <div style={{ animation: 'fadeIn 0.5s ease 0.2s both' }}>
                <p style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#334155',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                }}>Try asking the AI Agent</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aiQuestions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => navigate('/ai', { state: { question: q } })}
                            style={{
                                background: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.15)',
                                borderRadius: 8,
                                padding: '8px 14px',
                                color: '#818cf8',
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                                e.currentTarget.style.color = '#c7d2fe';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                                e.currentTarget.style.color = '#818cf8';
                            }}
                        >
                            <span style={{ fontSize: 12 }}>✦</span>
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
