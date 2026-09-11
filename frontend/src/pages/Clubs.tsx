import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubsApi, type ClubResponse } from '../api/clubs';

export default function Clubs() {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<ClubResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clubsApi.getClubs();
            setClubs(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load clubs');
        } finally {
            setLoading(false);
        }
    };

    const filteredClubs = clubs.filter(club => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            club.name.toLowerCase().includes(query) ||
            club.description?.toLowerCase().includes(query) ||
            club.category.toLowerCase().includes(query)
        );
    });

    const S = {
        page: {
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            padding: '40px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        },
        header: {
            marginBottom: 32,
        },
        searchBox: {
            width: '100%',
            maxWidth: 400,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#f1f5f9',
            fontSize: 14,
            fontFamily: 'inherit',
            marginTop: 16,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
        },
        card: {
            background: '#0c1120',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        badge: {
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            padding: '3px 10px',
            borderRadius: 6,
            background: 'rgba(34,211,153,0.12)',
            color: '#34d399',
            border: '1px solid rgba(34,211,153,0.2)',
        },
    };

    const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, isEnter: boolean) => {
        if (isEnter) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
        } else {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.boxShadow = '';
        }
    };

    return (
        <div style={S.page}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div style={S.header}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(34,211,153,0.1)',
                    border: '1px solid rgba(34,211,153,0.2)',
                    borderRadius: 999,
                    padding: '3px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#34d399',
                    marginBottom: 12,
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                    Campus Organizations
                </div>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#f1f5f9',
                    margin: '0 0 8px',
                }}>
                    Clubs Directory
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                    Discover and explore student clubs and organizations
                </p>

                <input
                    type="text"
                    placeholder="Search clubs by name, description, or category..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={S.searchBox}
                    onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
            </div>

            {loading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    gap: 12,
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading clubs...</p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            )}

            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    color: '#f87171',
                    fontSize: 14,
                }}>
                    {error}
                    <button
                        onClick={loadClubs}
                        style={{
                            marginLeft: 12,
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            padding: '4px 12px',
                            color: '#f87171',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && filteredClubs.length === 0 && !searchQuery && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    textAlign: 'center',
                    padding: 40,
                }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: 'rgba(34,211,153,0.08)',
                        border: '1px solid rgba(34,211,153,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        marginBottom: 16,
                    }}>🏛️</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
                        No clubs yet
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 340 }}>
                        Clubs will appear here once they are created by organizers or administrators.
                    </p>
                </div>
            )}

            {!loading && !error && filteredClubs.length === 0 && searchQuery && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    textAlign: 'center',
                    padding: 40,
                }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: 'rgba(148,163,184,0.08)',
                        border: '1px solid rgba(148,163,184,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        marginBottom: 16,
                    }}>🔍</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
                        No clubs match your search
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 340 }}>
                        Try different keywords or clear your search.
                    </p>
                </div>
            )}

            {!loading && !error && filteredClubs.length > 0 && (
                <>
                    <div style={{ marginBottom: 16, color: '#64748b', fontSize: 13 }}>
                        {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                    <div style={S.grid}>
                        {filteredClubs.map(club => (
                            <div
                                key={club._id}
                                style={S.card}
                                onClick={() => navigate(`/clubs/${club._id}`)}
                                onMouseEnter={e => handleCardHover(e, true)}
                                onMouseLeave={e => handleCardHover(e, false)}
                            >
                                {(() => {
    const n = club.name.toLowerCase();

    const image =
        n.includes('phoenix')
            ? '/campus-data/clubs/Phoenix/management_headphoenix.png'
            : n.includes('sparks')
            ? '/campus-data/clubs/SPARKS/sparks_img.jpg'
            : n.includes('steppers')
            ? '/campus-data/clubs/Steppers/steppers_achievement.jpg'
            : null;

    return image ? (
        <img
            src={image}
            alt={club.name}
            style={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 12,
            }}
        />
    ) : null;
})()}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h3 style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: '#f1f5f9',
                                        margin: 0,
                                        flex: 1,
                                    }}>
                                        {club.name}
                                    </h3>
                                    {club.status === 'active' && (
                                        <span style={S.badge}>Active</span>
                                    )}
                                </div>

                                {club.description && (
                                    <p style={{
                                        fontSize: 13,
                                        color: '#94a3b8',
                                        margin: '0 0 12px',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        {club.description}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    paddingTop: 12,
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <span style={{
                                        fontSize: 11,
                                        color: '#6366f1',
                                        background: 'rgba(99,102,241,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontWeight: 500,
                                    }}>
                                        {club.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
