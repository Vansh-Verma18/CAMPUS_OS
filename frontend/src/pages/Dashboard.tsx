import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';
import { Sparkles, TrendingUp, Calendar, Users, FileText, Building2, Zap } from 'lucide-react';

const ROLE_TAGLINE: Record<string, string> = {
    admin: 'Everything happening across campus, intelligently connected.',
    faculty: 'Coordinate events, review analytics, and engage with students.',
    organizer: 'Create impactful events and manage attendance seamlessly.',
    student: 'Discover opportunities and stay connected with campus life.',
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; sub: string; path: string; icon: any; color: string; emoji: string }>> = {
    admin: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#8B5CF6', emoji: '⚡' },
        { label: 'Discover Events', sub: 'Browse what\'s happening', path: '/events', icon: Sparkles, color: '#06B6D4', emoji: '28' },
        { label: 'Clubs Directory', sub: 'Explore organizations', path: '/clubs', icon: Building2, color: '#14B8A6', emoji: '🌐' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#F43F5E', emoji: '' },
    ],
    faculty: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#8B5CF6', emoji: '⚡' },
        { label: 'Discover Events', sub: 'Browse what\'s happening', path: '/events', icon: Sparkles, color: '#06B6D4', emoji: '28' },
        { label: 'View Analytics', sub: 'Participation insights', path: '/analytics', icon: TrendingUp, color: '#14B8A6', emoji: '' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#F43F5E', emoji: '' },
    ],
    organizer: [
        { label: 'Create Event', sub: 'Schedule with AI assistance', path: '/event-planner', icon: Calendar, color: '#8B5CF6', emoji: '⚡' },
        { label: 'Discover Events', sub: 'Browse and manage', path: '/events', icon: Sparkles, color: '#06B6D4', emoji: '28' },
        { label: 'Clubs Directory', sub: 'Explore organizations', path: '/clubs', icon: Building2, color: '#14B8A6', emoji: '🌐' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#F43F5E', emoji: '' },
    ],
    student: [
        { label: 'Discover Events', sub: 'Explore what\'s happening', path: '/events', icon: Sparkles, color: '#8B5CF6', emoji: '28' },
        { label: 'Clubs Directory', sub: 'Find your community', path: '/clubs', icon: Building2, color: '#06B6D4', emoji: '🌐' },
        { label: 'My Registrations', sub: 'Manage your events', path: '/my-registrations', icon: Calendar, color: '#14B8A6', emoji: '' },
        { label: 'Ask CampusOS', sub: 'AI-powered insights', path: '/ai', icon: Zap, color: '#F43F5E', emoji: '' },
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
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            animation: `fadeInUp 0.5s ease ${delay}ms both`,
            transition: 'all 0.3s ease',
            cursor: 'default',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
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
                color: '#1a202c',
                letterSpacing: '-0.02em',
                marginBottom: 4,
                lineHeight: 1,
            }}>
                {animatedValue.toLocaleString()}
            </div>
            <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7280',
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
            padding: '32px',
            maxWidth: '1550px',
            margin: '0 auto',
            position: 'relative',
        }}>
            <style>{`
                @keyframes float-gentle {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes rotate-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.6)); }
                    50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 20px rgba(217, 70, 239, 0.9)); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                    }
                }
            `}</style>

            {/* Welcome Section */}
            <div style={{
                marginBottom: '32px',
                animation: 'fadeInUp 0.6s ease',
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(90deg, #6D28D9 0%, #5B21B6 100%)',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    marginBottom: '12px',
                    boxShadow: '0 2px 8px rgba(109, 40, 217, 0.3)',
                }}>
                    <span>✨</span>
                    <span>CAMPUS INTELLIGENCE</span>
                </div>
                <h2 style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#1a202c',
                    margin: '0 0 8px',
                    lineHeight: 1.1,
                }}>
                    Good morning, {firstName}
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#4a5568',
                    margin: 0,
                    fontWeight: 500,
                }}>
                    {tagline}
                </p>
            </div>

            {/* Campus Intelligence Hero Card */}
            <section style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(246, 243, 252, 0.9) 50%, rgba(237, 231, 249, 0.8) 100%)',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 50px rgba(130, 110, 180, 0.08)',
                overflow: 'hidden',
                marginBottom: '32px',
                animation: 'fadeInUp 0.6s ease 0.1s both',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '48px',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {/* Left: Content */}
                    <div style={{ maxWidth: '640px' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#E9D5FF',
                            color: '#6B21A8',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            borderRadius: '8px',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                        }}>
                            Campus Intelligence
                        </span>
                        <h3 style={{
                            fontSize: '36px',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: '#1a202c',
                            margin: '0 0 12px',
                            lineHeight: 1.2,
                        }}>
                            Your campus, understood.
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#4a5568',
                            lineHeight: 1.7,
                            marginBottom: '24px',
                            fontWeight: 500,
                            maxWidth: '560px',
                        }}>
                            Ask CampusOS about events, participation, clubs, reports, and institutional history. Get intelligent answers powered by your campus data.
                        </p>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '24px',
                        }}>
                            <button
                                onClick={() => navigate('/ai')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: '0 10px 25px rgba(124, 58, 237, 0.4)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.6)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(124, 58, 237, 0.4)';
                                    e.currentTarget.style.transform = '';
                                }}
                            >
                                <Sparkles size={16} />
                                <span>Ask CampusOS</span>
                            </button>
                            <button
                                onClick={() => navigate('/events')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '9999px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#4a5568',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.transform = '';
                                }}
                            >
                                Explore Events
                            </button>
                        </div>

                        {/* Try Asking Prompts */}
                        <div>
                            <p style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#6b7280',
                                marginBottom: '8px',
                            }}>
                                Try asking:
                            </p>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                            }}>
                                {aiQuestions.slice(0, 3).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate('/ai', { state: { question: q } })}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '9999px',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            border: '1px solid #E9D5FF',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                            e.currentTarget.style.transform = '';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Animated AI Neural Orb */}
                    <div style={{
                        width: '330px',
                        height: '280px',
                        position: 'relative',
                        flexShrink: 0,
                    }}>
                        <svg width="330" height="330" viewBox="0 0 400 400" style={{
                            position: 'absolute',
                            overflow: 'visible',
                        }}>
                            <defs>
                                <radialGradient id="sphereGrad" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#9333EA" stopOpacity="0.85" />
                                    <stop offset="60%" stopColor="#6B21A8" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="#3B0764" stopOpacity="0.95" />
                                </radialGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur result="blur" stdDeviation="6" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <linearGradient id="fiberGlowPink" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#EC4899" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                                <linearGradient id="fiberGlowCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06B6D4" />
                                    <stop offset="100%" stopColor="#6366F1" />
                                </linearGradient>
                            </defs>

                            {/* Concentric Atmospheric Rings */}
                            <circle cx="200" cy="200" r="160" fill="none" stroke="#C084FC" strokeOpacity="0.15" strokeWidth="32" />
                            <circle cx="200" cy="200" r="125" fill="none" stroke="#A855F7" strokeOpacity="0.25" strokeWidth="20" />
                            <circle cx="200" cy="200" r="95" fill="none" stroke="#7E22CE" strokeOpacity="0.35" strokeWidth="12" />

                            {/* Deep Core Orb */}
                            <circle cx="200" cy="200" r="70" fill="url(#sphereGrad)" />

                            {/* Pulsing AI Core */}
                            <circle 
                                cx="200" 
                                cy="200" 
                                r="24" 
                                fill="#A855F7" 
                                filter="url(#glow)"
                                style={{
                                    animation: 'pulse-glow 4s ease-in-out infinite',
                                }}
                            />
                            <circle cx="200" cy="200" r="8" fill="#FFFFFF" />

                            {/* Neural Network Lines */}
                            <path 
                                d="M 155 170 Q 180 140 230 160 T 250 220 Q 210 245 170 215 Z" 
                                fill="none" 
                                stroke="#67E8F9" 
                                strokeDasharray="3 3" 
                                strokeWidth="1.5" 
                                opacity="0.9"
                            />
                            <path 
                                d="M 140 210 Q 190 270 240 230 T 260 170 Q 200 130 155 170" 
                                fill="none" 
                                stroke="#F472B6" 
                                strokeWidth="1.5" 
                                opacity="0.8"
                            />
                            <path 
                                d="M 120 180 C 140 240 260 250 270 190 C 270 130 160 120 120 180 Z" 
                                fill="none" 
                                stroke="#C084FC" 
                                strokeWidth="1.8"
                            />

                            {/* Glowing Network Nodes */}
                            <circle cx="155" cy="170" r="3.5" fill="#38BDF8" filter="url(#glow)" />
                            <circle cx="230" cy="160" r="3" fill="#F43F5E" filter="url(#glow)" />
                            <circle cx="250" cy="220" r="3.5" fill="#E879F9" filter="url(#glow)" />
                            <circle cx="170" cy="215" r="4" fill="#34D399" filter="url(#glow)" />
                            <circle cx="140" cy="210" r="3" fill="#FBBF24" />
                            <circle cx="260" cy="170" r="3.5" fill="#F472B6" filter="url(#glow)" />

                            {/* Data Flow Lines extending outward */}
                            <path 
                                d="M 155 220 C 130 250 60 270 -60 360" 
                                fill="none" 
                                stroke="url(#fiberGlowPink)" 
                                strokeWidth="3" 
                                opacity="0.75"
                            />
                            <path 
                                d="M 180 230 C 160 280 120 330 20 400" 
                                fill="none" 
                                stroke="url(#fiberGlowCyan)" 
                                strokeWidth="3.5" 
                                opacity="0.75"
                            />
                            <path 
                                d="M 210 235 C 220 290 240 330 260 410" 
                                fill="none" 
                                stroke="url(#fiberGlowPink)" 
                                strokeWidth="3" 
                                opacity="0.8"
                            />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Quick Stats (admin/faculty only) */}
            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                    animation: 'fadeInUp 0.6s ease 0.2s both',
                }}>
                    <StatCard
                        label="Upcoming Events"
                        value={summary.events.total}
                        icon={Calendar}
                        trend="+12%"
                        delay={300}
                    />
                    <StatCard
                        label="Active Clubs"
                        value={summary.clubs.active}
                        icon={Building2}
                        delay={400}
                    />
                    <StatCard
                        label="Total Registrations"
                        value={summary.participation.total_registrations}
                        icon={Users}
                        trend="+8.3%"
                        delay={500}
                    />
                    <StatCard
                        label="Knowledge Documents"
                        value={summary.documents.vectorized}
                        icon={FileText}
                        delay={600}
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div style={{
                animation: 'fadeInUp 0.6s ease 0.3s both',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                }}>
                    <h4 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#1a202c',
                        letterSpacing: '-0.01em',
                        margin: 0,
                    }}>
                        Quick Actions
                    </h4>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '16px',
                }}>
                    {actions.map((action) => {
                        const IconComponent = action.icon;
                        return (
                            <div
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.9)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '140px',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement;
                                    if (arrow) arrow.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                                    e.currentTarget.style.transform = '';
                                    const arrow = e.currentTarget.querySelector('.action-arrow') as HTMLElement;
                                    if (arrow) arrow.style.transform = '';
                                }}
                            >
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '16px',
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '12px',
                                            background: `${action.color}1A`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: action.color,
                                        }}>
                                            <IconComponent size={20} strokeWidth={2.5} />
                                        </div>
                                        {action.emoji && (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #06B6D4, #A855F7)',
                                                opacity: 0.8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                color: '#ffffff',
                                            }}>
                                                {action.emoji}
                                            </div>
                                        )}
                                    </div>
                                    <h5 style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#1a202c',
                                        margin: '0 0 4px',
                                    }}>
                                        {action.label}
                                    </h5>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        margin: 0,
                                        fontWeight: 500,
                                    }}>
                                        {action.sub}
                                    </p>
                                </div>
                                <div style={{
                                    paddingTop: '12px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}>
                                    <span
                                        className="action-arrow"
                                        style={{
                                            color: action.color,
                                            transition: 'transform 0.15s ease',
                                            fontSize: '18px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        →
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
