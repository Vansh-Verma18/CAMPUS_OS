import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubsApi, type ClubResponse } from '../api/clubs';
import { Sparkles } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
    Technology: '💻',
    Cultural: '🎭',
    Sports: '⚽',
    Academic: '📚',
    Social: '🎉',
    Arts: '🎨',
    Music: '🎵',
    Dance: '💃',
    default: '🏛️',
};

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

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            padding: '32px 40px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            animation: 'fadeIn 0.4s ease',
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Header */}
            <div style={{ maxWidth: 1400, margin: '0 auto', marginBottom: 32 }}>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#1a2332',
                    margin: '0 0 8px',
                }}>
                    Campus Clubs
                </h1>
                <p style={{ fontSize: 15, color: '#4a5568', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Explore student communities, interests, and activities across campus.
                </p>

                {/* AI Quick Ask Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#ffffff' }}>
                        <Sparkles size={20} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                            Ask CampusOS about clubs and student communities
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/ai', { state: { question: 'Tell me about student clubs and communities on campus' } })}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 8,
                            padding: '8px 16px',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        Open AI Assistant →
                    </button>
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: 500,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 16px',
                        color: '#1a2332',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                    }}
                    onFocus={e => {
                        e.currentTarget.style.borderColor = '#4c51bf';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76, 81, 191, 0.1)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{
                    maxWidth: 1400,
                    margin: '0 auto',
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
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#4c51bf',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#4a5568', fontSize: 14 }}>Loading clubs...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    <div style={{
                        background: '#fff5f5',
                        border: '1px solid #feb2b2',
                        borderRadius: 12,
                        padding: '16px 20px',
                        color: '#e53e3e',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <span>Unable to load clubs.</span>
                        <button
                            onClick={loadClubs}
                            style={{
                                background: '#fff',
                                border: '1px solid #feb2b2',
                                borderRadius: 6,
                                padding: '6px 12px',
                                color: '#e53e3e',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#fff5f5';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#fff';
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State - No Clubs */}
            {!loading && !error && filteredClubs.length === 0 && !searchQuery && (
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
                            background: '#eef2ff',
                            border: '1px solid #c3dafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            marginBottom: 16,
                        }}>🏛️</div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                            No clubs yet
                        </h2>
                        <p style={{ color: '#4a5568', fontSize: 14, maxWidth: 400, margin: 0 }}>
                            Clubs will appear here once they are created by organizers or administrators.
                        </p>
                    </div>
                </div>
            )}

            {/* Empty State - No Search Results */}
            {!loading && !error && filteredClubs.length === 0 && searchQuery && (
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
                            background: '#f8f9fb',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            marginBottom: 16,
                        }}>🔍</div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                            No clubs found
                        </h2>
                        <p style={{ color: '#4a5568', fontSize: 14, maxWidth: 400, marginBottom: 16 }}>
                            Try a different search.
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: '#4c51bf',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                color: '#ffffff',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#434190';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#4c51bf';
                            }}
                        >
                            Clear search
                        </button>
                    </div>
                </div>
            )}

            {/* Clubs Grid */}
            {!loading && !error && filteredClubs.length > 0 && (
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    <div style={{ marginBottom: 16, color: '#4a5568', fontSize: 14, fontWeight: 500 }}>
                        {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 20,
                    }}>
                        {filteredClubs.map(club => {
                            const icon = CATEGORY_ICONS[club.category] ?? CATEGORY_ICONS.default;
                            const isActive = club.status === 'active';

                            return (
                                <button
                                    key={club._id}
                                    onClick={() => navigate(`/clubs/${club._id}`)}
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 12,
                                        padding: '24px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
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
                                    {/* Icon and Status */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 10,
                                            background: '#eef2ff',
                                            border: '1px solid #c3dafe',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 24,
                                        }}>
                                            {icon}
                                        </div>
                                        {isActive && (
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: '0.03em',
                                                textTransform: 'uppercase',
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                background: '#f0fff4',
                                                color: '#38a169',
                                                border: '1px solid #9ae6b4',
                                            }}>
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {/* Club Name */}
                                    <h3 style={{
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: '#1a2332',
                                        margin: '0 0 6px',
                                        lineHeight: 1.3,
                                    }}>
                                        {club.name}
                                    </h3>

                                    {/* Category Badge */}
                                    <div style={{ marginBottom: 12 }}>
                                        <span style={{
                                            fontSize: 11,
                                            color: '#4c51bf',
                                            background: '#eef2ff',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.03em',
                                        }}>
                                            {club.category}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {club.description && (
                                        <p style={{
                                            fontSize: 14,
                                            color: '#4a5568',
                                            margin: '0 0 16px',
                                            lineHeight: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {club.description}
                                        </p>
                                    )}

                                    {/* Footer - View Club Link */}
                                    <div style={{
                                        paddingTop: 16,
                                        borderTop: '1px solid #f0f4f8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <span style={{
                                            fontSize: 13,
                                            color: '#4c51bf',
                                            fontWeight: 600,
                                        }}>
                                            View Club
                                        </span>
                                        <span style={{
                                            color: '#4c51bf',
                                            fontSize: 14,
                                        }}>
                                            →
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
