import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';
import { BarChart3, TrendingUp, Calendar, AlertTriangle, ArrowLeft, Users, FileText, Activity } from 'lucide-react';

// ─── Reusable UI primitives ───────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    icon?: React.ReactNode;
}> = ({ label, value, sub, accent = '#6366f1', icon }) => (
    <div style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.06)';
    }}
    onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
    }}
    >
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
            </div>
            {icon && (
                <div style={{ 
                    width: 48, height: 48, borderRadius: 12, 
                    background: `${accent}15`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
            )}
        </div>
        {sub && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
);

const BarChart: React.FC<{ data: Record<string, number>; title: string; accent?: string }> = ({
    data, title, accent = '#6366f1',
}) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return (
        <div style={{ 
            background: '#ffffff', border: '1px solid #E2E8F0', 
            borderRadius: 16, padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color={accent} />
                {title}
            </div>
            {entries.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No data available</div>
            ) : entries.map(([key, val]) => (
                <div key={key} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, textTransform: 'capitalize' }}>{key}</span>
                        <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 700 }}>{val}</span>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 6,
                            width: `${(val / max) * 100}%`,
                            background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{
        fontSize: 18, fontWeight: 800, color: '#0f172a',
        marginBottom: 20, marginTop: 40, letterSpacing: '-0.01em',
        display: 'flex', alignItems: 'center', gap: 8
    }}>
        {children}
    </div>
);

const RatingBar: React.FC<{ dist: Record<string, number>; total: number }> = ({ dist, total }) => (
    <div style={{ 
        background: '#ffffff', border: '1px solid #E2E8F0', 
        borderRadius: 16, padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
    }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#f59e0b" />
            Rating Distribution
        </div>
        {[5, 4, 3, 2, 1].map(r => {
            const count = dist[String(r)] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const stars = '★'.repeat(r) + '☆'.repeat(5 - r);
            return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 14, color: '#fbbf24', minWidth: 70, letterSpacing: 2 }}>{stars}</span>
                    <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 6,
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{count}</span>
                </div>
            );
        })}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Analytics: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<InstitutionalSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'faculty')) {
            navigate('/dashboard');
            return;
        }
        analyticsApi.getSummary()
            .then(data => { setSummary(data); setLoading(false); })
            .catch(() => { setError('Failed to load analytics. You may not have permission.'); setLoading(false); });
    }, [user, navigate]);

    const styles = {
        page: {
            minHeight: '100vh', background: '#F8F9FB', color: '#1e293b',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
            padding: '40px 40px 80px',
            animation: 'fadeIn 0.5s ease',
        } as React.CSSProperties,
        content: { maxWidth: 1200, margin: '0 auto' } as React.CSSProperties,
        grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 } as React.CSSProperties,
        grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 } as React.CSSProperties,
        backBtn: {
            background: '#ffffff', border: '1px solid #E2E8F0',
            color: '#475569', padding: '10px 20px', borderRadius: 10,
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transition: 'all 0.2s',
        } as React.CSSProperties,
    };

    if (loading) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ 
                    width: 48, height: 48, border: '3px solid #E2E8F0', 
                    borderTopColor: '#6366f1', borderRadius: '50%', 
                    animation: 'spin 1s linear infinite', margin: '0 auto 20px' 
                }} />
                <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>Loading institutional analytics…</div>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#ffffff', padding: 40, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #fecaca' }}>
                <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#1e293b' }}>Access Denied</h3>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>{error}</div>
                <button 
                    style={styles.backBtn} 
                    onClick={() => navigate('/dashboard')}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8F9FB'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>
        </div>
    );

    if (!summary) return null;

    const { events, clubs, participation, feedback, documents, financials } = summary;
    const attRate = participation.attendance_rate_pct.toFixed(1);

    return (
        <div style={styles.page}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ marginBottom: 48, maxWidth: 1200, margin: '0 auto 48px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#4f46e5',
                    marginBottom: 16,
                }}>
                    <Activity size={12} />
                    Analytics & Reporting
                </div>
                <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px', lineHeight: 1.1 }}>
                    Institutional Intelligence
                </h1>
                <p style={{ margin: 0, fontSize: 16, color: '#64748b', fontWeight: 500 }}>
                    Data overview — Role: <strong style={{ color: '#4f46e5', textTransform: 'capitalize' }}>{summary.role}</strong>
                </p>
            </div>

            <div style={styles.content}>
                {/* Events KPIs */}
                <SectionTitle>
                    <Calendar size={22} color="#6366f1" /> Events Overview
                </SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Events" value={events.total} icon={<Calendar size={24} />} accent="#6366f1" />
                    <StatCard label="Upcoming" value={events.upcoming} icon={<Calendar size={24} />} accent="#06b6d4" />
                    <StatCard label="Ongoing" value={events.ongoing} icon={<Activity size={24} />} accent="#f59e0b" />
                    <StatCard label="Completed" value={events.completed} icon={<FileText size={24} />} accent="#10b981" />
                    <StatCard label="Cancelled" value={events.cancelled} icon={<AlertTriangle size={24} />} accent="#ef4444" />
                </div>

                <div style={{ ...styles.grid3, marginTop: 20 }}>
                    <BarChart data={events.by_status} title="By Status" accent="#6366f1" />
                    <BarChart data={events.by_category} title="By Category" accent="#06b6d4" />
                </div>

                {/* Clubs */}
                <SectionTitle>
                    <Users size={22} color="#8b5cf6" /> Club Activity
                </SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Clubs" value={clubs.total} icon={<Users size={24} />} accent="#8b5cf6" />
                    <StatCard label="Active" value={clubs.active} icon={<Activity size={24} />} accent="#10b981" />
                    <StatCard label="Inactive" value={clubs.inactive} icon={<AlertTriangle size={24} />} accent="#94a3b8" />
                </div>
                <div style={{ marginTop: 20 }}>
                    <BarChart data={clubs.by_category} title="Clubs by Category" accent="#8b5cf6" />
                </div>

                {/* Participation */}
                <SectionTitle>
                    <TrendingUp size={22} color="#f59e0b" /> Participation & Attendance
                </SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Registrations" value={participation.total_registrations} icon={<FileText size={24} />} accent="#f59e0b" />
                    <StatCard label="Confirmed" value={participation.confirmed_registrations} accent="#10b981" />
                    <StatCard label="Cancelled" value={participation.cancelled_registrations} accent="#ef4444" />
                    <StatCard label="Attendance Records" value={participation.total_attendance_records} accent="#0ea5e9" />
                    <StatCard label="Attended" value={participation.attended} accent="#06b6d4" />
                    <StatCard label="Attendance Rate" value={`${attRate}%`} icon={<TrendingUp size={24} />} accent="#6366f1"
                        sub={`${participation.attended} of ${participation.total_registrations} registrants`} />
                </div>

                {/* Feedback */}
                <SectionTitle>
                    <FileText size={22} color="#f59e0b" /> Student Feedback
                </SectionTitle>
                <div style={styles.grid3}>
                    <StatCard label="Total Responses" value={feedback.total_responses} accent="#f59e0b" />
                    <StatCard label="Average Rating" value={`${feedback.average_rating} / 5`}
                        accent="#fbbf24" sub={`From ${feedback.total_responses} responses`} />
                    <RatingBar dist={feedback.rating_distribution} total={feedback.total_responses} />
                </div>

                {/* Institutional Memory / Documents */}
                <SectionTitle>
                    <FileText size={22} color="#6366f1" /> Institutional Memory
                </SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Documents" value={documents.total} icon={<FileText size={24} />} accent="#6366f1" />
                    <StatCard label="Vectorized" value={documents.vectorized} accent="#06b6d4"
                        sub="Indexed for AI retrieval" />
                    <StatCard label="Failed Processing" value={documents.failed} accent="#ef4444" />
                </div>
                {Object.keys(documents.by_classification).length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <BarChart data={documents.by_classification} title="By Access Classification" accent="#6366f1" />
                    </div>
                )}

                {/* Financial — Admin Only */}
                {financials && (
                    <>
                        <SectionTitle>
                            <Activity size={22} color="#ef4444" /> Financial Summary
                        </SectionTitle>
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            borderRadius: 12, padding: '12px 20px', marginBottom: 20,
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontSize: 13, color: '#ef4444', fontWeight: 600
                        }}>
                            <AlertTriangle size={16} /> Restricted — This section is visible to administrators only
                        </div>
                        <div style={styles.grid2}>
                            <StatCard label="Total Spend" value={`${financials.currency} ${financials.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                accent="#ef4444" />
                            <StatCard label="Expense Records" value={financials.total_records} accent="#f59e0b" />
                            <StatCard label="Pending" value={`${financials.currency} ${financials.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                accent="#f59e0b" />
                            <StatCard label="Approved" value={`${financials.currency} ${financials.approved_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                accent="#10b981" />
                            <StatCard label="Paid" value={`${financials.currency} ${financials.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                accent="#0ea5e9" />
                        </div>
                        <div style={{ ...styles.grid3, marginTop: 20 }}>
                            <BarChart data={
                                Object.fromEntries(
                                    Object.entries(financials.by_category).map(([k, v]) => [k, Math.round(v)])
                                )
                            } title="Spend by Category" accent="#ef4444" />
                            <BarChart data={financials.by_status} title="Records by Status" accent="#f59e0b" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Analytics;
