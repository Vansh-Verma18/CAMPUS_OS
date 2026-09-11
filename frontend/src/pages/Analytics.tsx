import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type InstitutionalSummary } from '../api/analytics';

// ─── Reusable UI primitives ───────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    icon?: string;
}> = ({ label, value, sub, accent = '#6366f1', icon }) => (
    <div style={{
        background: '#1e1e2e',
        border: '1px solid #2d2d3f',
        borderRadius: 14,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
    }}>
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${accent}, transparent)`,
        }} />
        {icon && <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>}
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f8f8ff', letterSpacing: -1 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 13, color: '#9999bb', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#6666aa', marginTop: 2 }}>{sub}</div>}
    </div>
);

const BarChart: React.FC<{ data: Record<string, number>; title: string; accent?: string }> = ({
    data, title, accent = '#6366f1',
}) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return (
        <div style={{ background: '#1e1e2e', border: '1px solid #2d2d3f', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9999bb', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </div>
            {entries.length === 0 ? (
                <div style={{ color: '#555577', fontSize: 13 }}>No data</div>
            ) : entries.map(([key, val]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#ccccdd', textTransform: 'capitalize' }}>{key}</span>
                        <span style={{ fontSize: 12, color: '#f8f8ff', fontWeight: 600 }}>{val}</span>
                    </div>
                    <div style={{ background: '#2d2d3f', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 4,
                            width: `${(val / max) * 100}%`,
                            background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#6666aa',
        textTransform: 'uppercase', marginBottom: 12, marginTop: 28,
    }}>
        {children}
    </div>
);

const RatingBar: React.FC<{ dist: Record<string, number>; total: number }> = ({ dist, total }) => (
    <div style={{ background: '#1e1e2e', border: '1px solid #2d2d3f', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9999bb', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            Rating Distribution
        </div>
        {[5, 4, 3, 2, 1].map(r => {
            const count = dist[String(r)] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const stars = '★'.repeat(r) + '☆'.repeat(5 - r);
            return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#fbbf24', minWidth: 60 }}>{stars}</span>
                    <div style={{ flex: 1, background: '#2d2d3f', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 4,
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #f59e0b, #f59e0b88)',
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#9999bb', minWidth: 30 }}>{count}</span>
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
            minHeight: '100vh', background: '#080c18', color: '#e2e8f0',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: '40px 40px 80px',
            animation: 'fadeIn 0.5s ease',
        } as React.CSSProperties,
        content: { maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
        grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 } as React.CSSProperties,
        grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 } as React.CSSProperties,
        backBtn: {
            background: 'transparent', border: '1px solid #3d3d5f',
            color: '#9999bb', padding: '8px 16px', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
        } as React.CSSProperties,
    };

    if (loading) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
                <div style={{ color: '#9999bb', fontSize: 14 }}>Loading institutional analytics…</div>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#f87171' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <div>{error}</div>
                <button style={{ ...styles.backBtn, marginTop: 20 }} onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    if (!summary) return null;

    const { events, clubs, participation, feedback, documents, financials } = summary;
    const attRate = participation.attendance_rate_pct.toFixed(1);

    return (
        <div style={styles.page}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div style={{ marginBottom: 40, maxWidth: 1100, margin: '0 auto 40px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 999,
                    padding: '3px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: '#818cf8',
                    marginBottom: 12,
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                    Analytics & Reporting
                </div>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 8px' }}>
                    Institutional Intelligence
                </h1>
                <p style={{ margin: 0, fontSize: 15, color: '#475569' }}>
                    Data overview — Role: <strong style={{ color: '#a5b4fc', textTransform: 'capitalize' }}>{summary.role}</strong>
                </p>
            </div>

            <div style={styles.content}>
                {/* Events KPIs */}
                <SectionTitle>Events Overview</SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Events" value={events.total} icon="📅" accent="#6366f1" />
                    <StatCard label="Upcoming" value={events.upcoming} icon="🗓️" accent="#22d3ee" />
                    <StatCard label="Ongoing" value={events.ongoing} icon="▶️" accent="#f59e0b" />
                    <StatCard label="Completed" value={events.completed} icon="✅" accent="#22c55e" />
                    <StatCard label="Cancelled" value={events.cancelled} icon="❌" accent="#ef4444" />
                </div>

                <div style={{ ...styles.grid3, marginTop: 16 }}>
                    <BarChart data={events.by_status} title="By Status" accent="#6366f1" />
                    <BarChart data={events.by_category} title="By Category" accent="#22d3ee" />
                </div>

                {/* Clubs */}
                <SectionTitle>Club Activity</SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Clubs" value={clubs.total} icon="🏛️" accent="#a78bfa" />
                    <StatCard label="Active" value={clubs.active} icon="✦" accent="#22c55e" />
                    <StatCard label="Inactive" value={clubs.inactive} icon="⏸" accent="#6b7280" />
                </div>
                <div style={{ marginTop: 16 }}>
                    <BarChart data={clubs.by_category} title="Clubs by Category" accent="#a78bfa" />
                </div>

                {/* Participation */}
                <SectionTitle>Participation & Attendance</SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Registrations" value={participation.total_registrations} icon="🎟️" accent="#f59e0b" />
                    <StatCard label="Confirmed" value={participation.confirmed_registrations} icon="✔" accent="#22c55e" />
                    <StatCard label="Cancelled" value={participation.cancelled_registrations} icon="✘" accent="#ef4444" />
                    <StatCard label="Attendance Records" value={participation.total_attendance_records} icon="👥" accent="#38bdf8" />
                    <StatCard label="Attended" value={participation.attended} icon="🙋" accent="#22d3ee" />
                    <StatCard label="Attendance Rate" value={`${attRate}%`} icon="📈" accent="#6366f1"
                        sub={`${participation.attended} of ${participation.total_registrations} registrants`} />
                </div>

                {/* Feedback */}
                <SectionTitle>Student Feedback</SectionTitle>
                <div style={styles.grid3}>
                    <StatCard label="Total Responses" value={feedback.total_responses} icon="💬" accent="#f59e0b" />
                    <StatCard label="Average Rating" value={`${feedback.average_rating} / 5`} icon="⭐"
                        accent="#fbbf24" sub={`From ${feedback.total_responses} responses`} />
                    <RatingBar dist={feedback.rating_distribution} total={feedback.total_responses} />
                </div>

                {/* Institutional Memory / Documents */}
                <SectionTitle>Institutional Memory</SectionTitle>
                <div style={styles.grid2}>
                    <StatCard label="Total Documents" value={documents.total} icon="📄" accent="#6366f1" />
                    <StatCard label="Vectorized" value={documents.vectorized} icon="🧠" accent="#22d3ee"
                        sub="Indexed for AI retrieval" />
                    <StatCard label="Failed Processing" value={documents.failed} icon="⚠️" accent="#ef4444" />
                </div>
                {Object.keys(documents.by_classification).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <BarChart data={documents.by_classification} title="By Access Classification" accent="#6366f1" />
                    </div>
                )}

                {/* Financial — Admin Only */}
                {financials && (
                    <>
                        <SectionTitle>Financial Summary (Admin Only)</SectionTitle>
                        <div style={{
                            background: '#1a0f0f', border: '1px solid #3d1515',
                            borderRadius: 10, padding: '10px 18px', marginBottom: 16,
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontSize: 12, color: '#f87171',
                        }}>
                            🔒 Restricted — This section is visible to administrators only
                        </div>
                        <div style={styles.grid2}>
                            <StatCard label="Total Spend" value={`${financials.currency} ${financials.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                icon="💰" accent="#ef4444" />
                            <StatCard label="Expense Records" value={financials.total_records} icon="🧾" accent="#f59e0b" />
                            <StatCard label="Pending" value={`${financials.currency} ${financials.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                icon="⏳" accent="#f59e0b" />
                            <StatCard label="Approved" value={`${financials.currency} ${financials.approved_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                icon="✔" accent="#22c55e" />
                            <StatCard label="Paid" value={`${financials.currency} ${financials.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                icon="💳" accent="#38bdf8" />
                        </div>
                        <div style={{ ...styles.grid3, marginTop: 16 }}>
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
