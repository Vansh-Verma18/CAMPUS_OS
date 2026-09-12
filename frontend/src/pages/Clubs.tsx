import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { CLUB_IMAGES } from '../data/clubImages';

export type CampusClub = {
    id: string;
    name: string;
    folder: string;
    category: string;
    description: string;
};

export const CLUBS: CampusClub[] = [
    {
        id: 'aiclub-kiet',
        name: 'AI Club KIET',
        folder: 'aiclub_kiet',
        category: 'Technology',
        description: 'Explore artificial intelligence, machine learning, and emerging technologies.',
    },
    {
        id: 'ek-prayaas',
        name: 'EK PRAYAASS',
        folder: 'ek prayaass',
        category: 'Social',
        description: 'Student-led initiatives focused on community service and social impact.',
    },
    {
        id: 'fc-kiet',
        name: 'FC-KIET',
        folder: 'fc-kiet',
        category: 'Sports',
        description: 'Build teamwork, fitness, and competitive spirit through football.',
    },
    {
        id: 'kavyanjali',
        name: 'Kavyanjali',
        folder: 'kavyanjali',
        category: 'Literary',
        description: 'A creative community for poetry, literature, expression, and performance.',
    },
    {
        id: 'kiet-architecture',
        name: 'KIET Architecture',
        folder: 'kiet architecture',
        category: 'Academic',
        description: 'A student community around architecture, design, and built environments.',
    },
    {
        id: 'kiet-mun',
        name: 'KIET Model United Nations',
        folder: 'kiet model united nations',
        category: 'Academic',
        description: 'Develop diplomacy, public speaking, negotiation, and international awareness.',
    },
    {
        id: 'kiet-movie',
        name: 'KIET Movie Society',
        folder: 'kiet movie society',
        category: 'Cultural',
        description: 'A film-focused community for cinema, storytelling, and visual culture.',
    },
    {
        id: 'kiet-music',
        name: 'KIET Music Club',
        folder: 'kiet music club',
        category: 'Music',
        description: 'A platform for singers, instrumentalists, performers, and music lovers.',
    },
    {
        id: 'nss',
        name: 'National Service Scheme',
        folder: 'national service scheme',
        category: 'Social',
        description: 'Student volunteering and community engagement through meaningful initiatives.',
    },
    {
        id: 'odyssey',
        name: 'Odyssey Literary Society',
        folder: 'odyssey literary society',
        category: 'Literary',
        description: 'A space for literature, writing, public speaking, and creative expression.',
    },
    {
        id: 'phoenix',
        name: 'Phoenix',
        folder: 'phoenix',
        category: 'Cultural',
        description: 'A student community for creativity, performance, and campus engagement.',
    },
    {
        id: 'pragmatic-fashion',
        name: 'Pragmatic Fashion Society',
        folder: 'pragmatic fashion society',
        category: 'Arts',
        description: 'Creative exploration of fashion, styling, design, and presentation.',
    },
    {
        id: 'quizzinga',
        name: 'Quizzinga',
        folder: 'quizzinga',
        category: 'Academic',
        description: 'Competitive quizzing, general knowledge, problem solving, and curiosity.',
    },
    {
        id: 'sparks',
        name: 'SPARKS',
        folder: 'sparks',
        category: 'Technology',
        description: 'A technical community focused on innovation, projects, and technology.',
    },
    {
        id: 'steppers',
        name: 'Steppers',
        folder: 'steppers',
        category: 'Dance',
        description: 'A dance community for choreography, performance, and movement.',
    },
    {
        id: 'tedxkiet',
        name: 'TEDxKIET',
        folder: 'tedxkiet',
        category: 'Academic',
        description: 'Ideas, speakers, innovation, storytelling, and conversations that matter.',
    },
    {
        id: 'the-impeccables',
        name: 'THE IMPECCABLES',
        folder: 'the_impeccables',
        category: 'Cultural',
        description: 'A creative student community built around performance and campus culture.',
    },
    {
        id: 'v-paksh',
        name: 'V-Paksh',
        folder: 'v-paksh',
        category: 'Literary',
        description: 'A platform for ideas, communication, discussion, and student expression.',
    },
];

const CATEGORY_ICONS: Record<string, string> = {
    Technology: '💻',
    Cultural: '🎭',
    Sports: '⚽',
    Academic: '📚',
    Social: '🤝',
    Arts: '🎨',
    Music: '🎵',
    Dance: '💃',
    Literary: '📖',
    default: '🏛️',
};

export default function Clubs() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClubs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return CLUBS;

        return CLUBS.filter((club) =>
            club.name.toLowerCase().includes(query) ||
            club.category.toLowerCase().includes(query) ||
            club.description.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f8f9fb',
                padding: '32px 40px',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .club-card {
                    transition: all 0.2s ease;
                }

                .club-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.08);
                }

                .club-image {
                    transition: transform 0.25s ease;
                }

                .club-card:hover .club-image {
                    transform: scale(1.025);
                }
            `}</style>

            {/* Header */}
            <div
                style={{
                    maxWidth: 1400,
                    margin: '0 auto',
                    marginBottom: 28,
                    animation: 'fadeIn 0.4s ease',
                }}
            >
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 650,
                        color: '#172033',
                        margin: '0 0 8px',
                    }}
                >
                    Campus Clubs
                </h1>

                <p
                    style={{
                        fontSize: 15,
                        color: '#4a5568',
                        margin: '0 0 24px',
                    }}
                >
                    Discover student communities, interests, and activities across KIET.
                </p>

                {/* AI CTA */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 14,
                        padding: '20px 24px',
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                        color: '#fff',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <Sparkles size={20} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                            Ask CampusOS about clubs and student communities
                        </span>
                    </div>

                    <button
                        onClick={() =>
                            navigate('/ai', {
                                state: {
                                    question:
                                        'Which campus clubs are most relevant to students interested in technology, culture, sports, and academics?',
                                },
                            })
                        }
                        style={{
                            background: 'rgba(255,255,255,0.18)',
                            border: '1px solid rgba(255,255,255,0.35)',
                            borderRadius: 9,
                            padding: '9px 16px',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Open AI Assistant →
                    </button>
                </div>

                {/* Search */}
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clubs..."
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        background: '#fff',
                        border: '1px solid #dfe5ee',
                        borderRadius: 10,
                        padding: '13px 16px',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* Count */}
            <div
                style={{
                    maxWidth: 1400,
                    margin: '0 auto 16px',
                    color: '#4a5568',
                    fontSize: 14,
                    fontWeight: 500,
                }}
            >
                {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
            </div>

            {/* Grid */}
            <div
                style={{
                    maxWidth: 1400,
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20,
                }}
            >
                {filteredClubs.map((club) => {
                    const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');

const imageKey = Object.keys(CLUB_IMAGES).find(
    key => normalize(key) === normalize(club.folder)
);

const images = imageKey ? CLUB_IMAGES[imageKey] : [];
const image = images[0];
                    const icon =
                        CATEGORY_ICONS[club.category] ??
                        CATEGORY_ICONS.default;

                    return (
                        <div
                            key={club.id}
                            className="club-card"
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 14,
                                overflow: 'hidden',
                                cursor: 'pointer',
                            }}
                            onClick={() =>
                                navigate(`/clubs/${club.id}`)
                            }
                        >
                            {/* Club image */}
                            {image ? (
                                <div
                                    style={{
                                        width: '100%',
                                        height: 185,
                                        overflow: 'hidden',
                                        background: '#eef2ff',
                                    }}
                                >
                                    <img
                                        className="club-image"
                                        src={image}
                                        alt={club.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        height: 185,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#eef2ff',
                                        fontSize: 44,
                                    }}
                                >
                                    {icon}
                                </div>
                            )}

                            {/* Content */}
                            <div style={{ padding: 20 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        marginBottom: 14,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 10,
                                            background: '#eef2ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 22,
                                        }}
                                    >
                                        {icon}
                                    </div>

                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#16845b',
                                            background: '#effdf5',
                                            border: '1px solid #a7e7c5',
                                            borderRadius: 6,
                                            padding: '5px 9px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Active
                                    </span>
                                </div>

                                <h3
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 650,
                                        color: '#172033',
                                        margin: '0 0 8px',
                                    }}
                                >
                                    {club.name}
                                </h3>

                                <div style={{ marginBottom: 12 }}>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#4c51bf',
                                            background: '#eef2ff',
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {club.category}
                                    </span>
                                </div>

                                <p
                                    style={{
                                        fontSize: 14,
                                        color: '#4a5568',
                                        lineHeight: 1.5,
                                        margin: '0 0 18px',
                                        minHeight: 42,
                                    }}
                                >
                                    {club.description}
                                </p>

                                <div
                                    style={{
                                        paddingTop: 14,
                                        borderTop: '1px solid #edf1f5',
                                        color: '#4c51bf',
                                        fontSize: 13,
                                        fontWeight: 650,
                                    }}
                                >
                                    View Club →
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty search result */}
            {filteredClubs.length === 0 && (
                <div
                    style={{
                        maxWidth: 1400,
                        margin: '60px auto',
                        textAlign: 'center',
                        color: '#4a5568',
                    }}
                >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <h2
                        style={{
                            color: '#172033',
                            fontSize: 18,
                            marginBottom: 6,
                        }}
                    >
                        No clubs found
                    </h2>
                    <p style={{ margin: 0 }}>
                        Try a different search.
                    </p>
                </div>
            )}
        </div>
    );
}