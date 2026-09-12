import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';
import { Sparkles, TrendingUp, Calendar, Users, FileText, Building2, ArrowRight, Zap } from 'lucide-react';

const ROLE_TAGLINE: Record<string, string> = {
    admin: 'Everything happening across campus, intelligently connected.',
    faculty: 'Coordinate events, review analytics, and engage with students.',
    organizer: 'Create impactful events and manage attendance seamlessly.',
    student: 'Discover opportunities and stay connected with campus life.',
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; sub: string; path: string; icon: any; color: string; }>> = {
    admin: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#4f46e5' },
        { label: 'Discover Events', sub: 'Browse what\'s happening', path: '/events', icon: Sparkles, color: '#3b82f6' },
        { label: 'Manage Attendance', sub: 'Track participation', path: '/events', icon: Users, color: '#10b981' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#8b5cf6' },
    ],
    faculty: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#4f46e5' },
        { label: 'Discover Events', sub: 'Browse what\'s happening', path: '/events', icon: Sparkles, color: '#3b82f6' },
        { label: 'View Analytics', sub: 'Participation insights', path: '/analytics', icon: TrendingUp, color: '#10b981' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#8b5cf6' },
    ],
    organizer: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#4f46e5' },
        { label: 'Discover Events', sub: 'Browse and manage', path: '/events', icon: Sparkles, color: '#3b82f6' },
        { label: 'Clubs Directory', sub: 'Explore organizations', path: '/clubs', icon: Building2, color: '#10b981' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#8b5cf6' },
    ],
    student: [
        { label: 'Discover Events', sub: 'Explore what\'s happening', path: '/events', icon: Sparkles, color: '#4f46e5' },
        { label: 'Clubs Directory', sub: 'Find your community', path: '/clubs', icon: Building2, color: '#3b82f6' },
        { label: 'My Registrations', sub: 'Manage your events', path: '/my-registrations', icon: Calendar, color: '#10b981' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#8b5cf6' },
    ],
};

const SUGGESTED_AI_QUESTIONS: Record<string, string[]> = {
    admin: [
        'Which events had the highest participation?',
        'What is our total event count this semester?',
        'How did our hackathons perform?',
        'What should I consider before planning a large event?',
    ],
    faculty: [
        'What events are happening in the CS department?',
        'Which events had the most student engagement?',
        'Show me participation trends over time',
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

// Stat card component with animation
function StatCard({ label, value, icon: Icon, trend, delay }: { 
    label: string; 
    value: number; 
    icon: any; 
    trend?: string;
    delay: number;
}) {
    const animatedValue = useCounter(value, 1200, delay);
    
    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            animation: `fadeInUp 0.5s ease ${delay}ms both`,
            transition: 'all 0.3s ease',
            cursor: 'default',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
        }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.3)',
                }}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#10b981',
                    }}>
                        <TrendingUp size={14} />
                        {trend}
                    </div>
                )}
            </div>
            <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: 4,
                lineHeight: 1,
            }}>
                {animatedValue.toLocaleString()}
            </div>
            <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#64748b',
                letterSpacing: '-0.01em',
            }}>
                {label}
            </div>
        </div>
    );
}

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
    const firstName = user.display_name.split(' ')[0];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fafbfc',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Ambient animated background */}
            <div style={{
                position: 'fixed',
                top: -200,
                right: -200,
                width: 600,
                height: 600,
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'ambient-move 20s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 0,
            }} />
            <div style={{
                position: 'fixed',
                bottom: -150,
                left: -150,
                width: 500,
                height: 500,
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'ambient-move 25s ease-in-out infinite reverse',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                padding: '40px',
                maxWidth: 1400,
                margin: '0 auto',
            }}>
                {/* Welcome header */}
                <div style={{
                    marginBottom: 40,
                    animation: 'fadeIn 0.4s ease',
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 999,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        color: '#ffffff',
                        marginBottom: 12,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    }}>
                        <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#ffffff',
                            animation: 'pulse-subtle 2s ease-in-out infinite',
                        }} />
                        CAMPUS INTELLIGENCE
                    </div>
                    <h1 style={{
                        fontSize: 40,
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: '#0f172a',
                        margin: '0 0 8px',
                        lineHeight: 1.1,
                    }}>
                        Good morning, {firstName}
                    </h1>
                    <p style={{
                        color: '#475569',
                        fontSize: 17,
                        margin: 0,
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
                    }}>{tagline}</p>
                </div>

                {/* AI Assistant Hero Section */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 24,
                    overflow: 'hidden',
                    marginBottom: 40,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    animation: 'fadeInUp 0.6s ease 0.1s both',
                    position: 'relative',
                }}>
                    {/* Background decoration */}
                    <div style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 60,
                        padding: '48px',
                        alignItems: 'center',
                        position: 'relative',
                    }}>
                        {/* Left: Content */}
                        <div style={{ maxWidth: 640 }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#eef2ff',
                                borderRadius: 999,
                                padding: '6px 16px',
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: '#4f46e5',
                                marginBottom: 20,
                                border: '1px solid #c7d2fe',
                            }}>
                                CAMPUS INTELLIGENCE
                            </div>
                            <h2 style={{
                                fontSize: 36,
                                fontWeight: 700,
                                margin: '0 0 16px',
                                letterSpacing: '-0.02em',
                                color: '#0f172a',
                                lineHeight: 1.2,
                            }}>
                                Your campus, understood.
                            </h2>
                            <p style={{
                                fontSize: 17,
                                color: '#475569',
                                margin: '0 0 32px',
                                lineHeight: 1.7,
                                fontWeight: 400,
                            }}>
                                Ask CampusOS about events, participation, clubs, reports, and institutional history. Get intelligent answers powered by your campus data.
                            </p>
                            
                            {/* Primary action */}
                            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                                <button
                                    onClick={() => navigate('/ai')}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: 12,
                                        padding: '14px 28px',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                    }}
                                >
                                    <Sparkles size={20} />
                                    Ask CampusOS
                                </button>
                                <button
                                    onClick={() => navigate('/events')}
                                    style={{
                                        background: '#ffffff',
                                        color: '#475569',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 12,
                                        padding: '14px 28px',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.transform = '';
                                    }}
                                >
                                    Explore Events
                                </button>
                            </div>

                            {/* Suggested questions */}
                            <div>
                                <p style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    marginBottom: 12,
                                    color: '#64748b',
                                    letterSpacing: '0.02em',
                                }}>Try asking:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {aiQuestions.slice(0, 3).map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => navigate('/ai', { state: { question: q } })}
                                            style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 10,
                                                padding: '10px 16px',
                                                color: '#475569',
                                                fontSize: 14,
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.2s ease',
                                                fontWeight: 500,
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.borderColor = '#c7d2fe';
                                                e.currentTarget.style.color = '#4f46e5';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
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

                        {/* Right: Abstract AI visualization */}
                        <div style={{
                            width: 280,
                            height: 280,
                            position: 'relative',
                            flexShrink: 0,
                        }}>
                            {/* Layered translucent circles with gradient */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 200,
                                height: 200,
                                transform: 'translate(-50%, -50%)',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                borderRadius: '50%',
                                animation: 'float 6s ease-in-out infinite',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 150,
                                height: 150,
                                transform: 'translate(-50%, -50%)',
                                background: 'linear-gradient(225deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                                borderRadius: '50%',
                                animation: 'float 8s ease-in-out infinite reverse',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 100,
                                height: 100,
                                transform: 'translate(-50%, -50%)',
                                background: 'linear-gradient(315deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
                                borderRadius: '50%',
                                animation: 'float 10s ease-in-out infinite',
                            }} />
                            
                            {/* Center glow */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 60,
                                height: 60,
                                transform: 'translate(-50%, -50%)',
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(99, 102, 241, 0.3) 100%)',
                                borderRadius: '50%',
                                boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)',
                            }} />

                            {/* Sparkle accent */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#4f46e5',
                                opacity: 0.8,
                            }}>
                                <Sparkles size={32} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick stats (admin/faculty only, if loaded) */}
                {summary && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 20,
                        marginBottom: 40,
                    }}>
                        <StatCard
                            label="Upcoming Events"
                            value={summary.events.total}
                            icon={Calendar}
                            trend="+12%"
                            delay={200}
                        />
                        <StatCard
                            label="Active Clubs"
                            value={summary.clubs.active}
                            icon={Building2}
                            delay={300}
                        />
                        <StatCard
                            label="Total Registrations"
                            value={summary.participation.total_registrations}
                            icon={Users}
                            trend="+8.3%"
                            delay={400}
                        />
                        <StatCard
                            label="Knowledge Documents"
                            value={summary.documents.vectorized}
                            icon={FileText}
                            delay={500}
                        />
                    </div>
                )}

                {/* Quick actions */}
                <div style={{ animation: 'fadeIn 0.6s ease 0.3s both' }}>
                    <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: 20,
                        letterSpacing: '-0.01em',
                    }}>Quick Actions</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 16,
                    }}>
                        {actions.map((action, i) => {
                            const IconComponent = action.icon;
                            return (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 16,
                                        padding: '24px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                                        animation: `scaleIn 0.4s ease ${0.4 + i * 0.05}s both`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = '#c7d2fe';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
                                        const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement;
                                        if (arrow) arrow.style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
                                        const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement;
                                        if (arrow) arrow.style.transform = '';
                                    }}
                                >
                                    {/* Icon with colored background */}
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}25 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: action.color,
                                        marginBottom: 4,
                                    }}>
                                        <IconComponent size={24} strokeWidth={2.5} />
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <p style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            margin: '0 0 6px',
                                            letterSpacing: '-0.01em',
                                        }}>{action.label}</p>
                                        <p style={{
                                            fontSize: 14,
                                            color: '#64748b',
                                            margin: 0,
                                            lineHeight: 1.5,
                                        }}>
                                            {action.sub}
                                        </p>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div
                                        className="action-arrow"
                                        style={{
                                            position: 'absolute',
                                            bottom: 20,
                                            right: 20,
                                            color: action.color,
                                            transition: 'transform 0.3s ease',
                                        }}
                                    >
                                        <ArrowRight size={20} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
