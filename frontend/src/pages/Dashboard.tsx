import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';

const ROLE_TAGLINE: Record<string, string> = {
    admin: 'Access institution-wide insights and manage all campus activities.',
    faculty: 'Coordinate events, review analytics, and engage with students.',
    organizer: 'Create events, manage attendance, and collect feedback.',
    student: 'Discover events, join clubs, and stay connected with campus life.',
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; sub: string; path: string; icon: string; }>> = {
    admin: [
        { label: 'Discover Events', sub: 'Browse all campus events', path: '/events', icon: '📅' },
        { label: 'Clubs Directory', sub: 'Explore student organizations', path: '/clubs', icon: '🏛️' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '📋' },
        { label: 'Knowledge Base', sub: 'Upload and manage documents', path: '/institutional-memory', icon: '📚' },
        { label: 'Analytics', sub: 'Institution-wide reporting', path: '/analytics', icon: '📊' },
    ],
    faculty: [
        { label: 'Discover Events', sub: 'Browse all campus events', path: '/events', icon: '📅' },
        { label: 'Clubs Directory', sub: 'Explore student organizations', path: '/clubs', icon: '🏛️' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '📋' },
        { label: 'Knowledge Base', sub: 'Department documents', path: '/institutional-memory', icon: '📚' },
        { label: 'Analytics', sub: 'Participation & event data', path: '/analytics', icon: '📊' },
    ],
    organizer: [
        { label: 'Discover Events', sub: 'Browse and manage events', path: '/events', icon: '📅' },
        { label: 'Clubs Directory', sub: 'View all campus clubs', path: '/clubs', icon: '🏛️' },
        { label: 'Event Planner', sub: 'Schedule with conflict detection', path: '/event-planner', icon: '📋' },
        { label: 'Knowledge Base', sub: 'Upload event reports', path: '/institutional-memory', icon: '📚' },
    ],
    student: [
        { label: 'Discover Events', sub: 'Explore what\'s happening on campus', path: '/events', icon: '📅' },
        { label: 'Clubs Directory', sub: 'Discover student organizations', path: '/clubs', icon: '🏛️' },
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

    const actions = QUICK_ACTIONS[user.role] ?? QUICK_ACTIONS.student;
    const aiQuestions = SUGGESTED_AI_QUESTIONS[user.role] ?? SUGGESTED_AI_QUESTIONS.student;
    const tagline = ROLE_TAGLINE[user.role] ?? '';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            color: '#1a2332',
            padding: '32px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Welcome header */}
            <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#1a2332',
                    margin: '0 0 8px',
                }}>
                    Welcome back, {user.display_name.split(' ')[0]}
                </h1>
                <p style={{ color: '#4a5568', fontSize: 15, margin: 0 }}>{tagline}</p>
            </div>

            {/* AI Assistant Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 12,
                padding: '32px',
                marginBottom: 32,
                color: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.5s ease 0.1s both',
            }}>
                <div style={{ maxWidth: 720 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 999,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 16,
                    }}>
                        <span>✨</span>
                        <span>AI-Powered Assistant</span>
                    </div>
                    <h2 style={{
                        fontSize: 24,
                        fontWeight: 600,
                        margin: '0 0 12px',
                        letterSpacing: '-0.01em',
                    }}>
                        Ask CampusOS anything about your institution
                    </h2>
                    <p style={{ 
                        fontSize: 15, 
                        margin: '0 0 20px', 
                        opacity: 0.95,
                        lineHeight: 1.6,
                    }}>
                        Get instant answers about events, clubs, schedules, attendance, and more. Our AI assistant has access to your entire institutional knowledge base.
                    </p>
                    <button
                        onClick={() => navigate('/ai')}
                        style={{
                            background: '#ffffff',
                            color: '#4c51bf',
                            border: 'none',
                            borderRadius: 8,
                            padding: '12px 24px',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                    >
                        Open AI Assistant →
                    </button>
                </div>

                {/* Suggested Questions */}
                <div style={{ marginTop: 28 }}>
                    <p style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        marginBottom: 12,
                        opacity: 0.9,
                    }}>Try asking:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {aiQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => navigate('/ai', { state: { question: q } })}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    color: '#ffffff',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick stats (admin/faculty only, if loaded) */}
            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 32,
                    animation: 'fadeIn 0.5s ease 0.15s both',
                }}>
                    {[
                        { label: 'Total Events', value: summary.events.total, icon: '📅', color: '#4c51bf' },
                        { label: 'Active Clubs', value: summary.clubs.active, icon: '🏛️', color: '#3182ce' },
                        { label: 'Registrations', value: summary.participation.total_registrations, icon: '🎟️', color: '#38a169' },
                        { label: 'Documents', value: summary.documents.vectorized, icon: '📚', color: '#d69e2e' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '20px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <span style={{ fontSize: 24 }}>{stat.icon}</span>
                                <span style={{ fontSize: 13, color: '#718096', fontWeight: 500 }}>{stat.label}</span>
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 700, color: stat.color, letterSpacing: '-1px' }}>
                                {stat.value.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick actions */}
            <div style={{ animation: 'fadeIn 0.5s ease 0.2s both' }}>
                <h3 style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#1a2332',
                    marginBottom: 16,
                }}>Quick Access</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                }}>
                    {actions.map(action => (
                        <button
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '20px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = '#cbd5e0';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                            }}
                        >
                            <span style={{ fontSize: 28, lineHeight: 1 }}>{action.icon}</span>
                            <p style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#1a2332',
                                margin: 0,
                            }}>{action.label}</p>
                            <p style={{ fontSize: 14, color: '#4a5568', margin: 0, lineHeight: 1.5 }}>
                                {action.sub}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
