import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CLUBS } from './Clubs';
import { CLUB_IMAGES } from '../data/clubImages';

export default function ClubDetail() {
    const params = useParams();
    const clubId = params.clubId ?? params.id;
    const navigate = useNavigate();

    const club = useMemo(
        () => CLUBS.find((c) => c.id === clubId),
        [clubId]
    );

    if (!club) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    background: '#f8f9fb',
                }}
            >
                <h2 style={{ color: '#172033' }}>Club not found</h2>

                <button
                    onClick={() => navigate('/clubs')}
                    style={{
                        background: '#4c51bf',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    ← Back to Clubs
                </button>
            </div>
        );
    }

    const normalize = (value: string) =>
        value.toLowerCase().replace(/[^a-z0-9]/g, '');

    const imageKey = Object.keys(CLUB_IMAGES).find(
        (key) => normalize(key) === normalize(club.folder)
    );

    const images = imageKey ? CLUB_IMAGES[imageKey] : [];
    const coverImage = images[0];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f8f9fb',
                padding: '32px 40px',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: 1250,
                    margin: '0 auto',
                }}
            >
                <button
                    onClick={() => navigate('/clubs')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4c51bf',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: 20,
                    }}
                >
                    ← Back to Clubs
                </button>

                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}
                >
                    {/* Main image */}
                    {coverImage && (
                        <img
                            src={coverImage}
                            alt={club.name}
                            style={{
                                width: '100%',
                                height: 340,
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    )}

                    {/* All club images */}
                    {images.length > 1 && (
                        <div
                            style={{
                                padding: 24,
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(190px, 1fr))',
                                gap: 14,
                            }}
                        >
                            {images.map((src, index) => (
                                <img
                                    key={`${src}-${index}`}
                                    src={src}
                                    alt={`${club.name} ${index + 1}`}
                                    style={{
                                        width: '100%',
                                        height: 145,
                                        objectFit: 'cover',
                                        borderRadius: 10,
                                        display: 'block',
                                        border: '1px solid #e2e8f0',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div style={{ padding: '8px 32px 32px' }}>
                        <span
                            style={{
                                display: 'inline-block',
                                background: '#eef2ff',
                                color: '#4c51bf',
                                padding: '6px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                marginBottom: 14,
                            }}
                        >
                            {club.category}
                        </span>

                        <h1
                            style={{
                                fontSize: 32,
                                fontWeight: 650,
                                color: '#172033',
                                margin: '0 0 12px',
                            }}
                        >
                            {club.name}
                        </h1>

                        <p
                            style={{
                                fontSize: 16,
                                color: '#4a5568',
                                lineHeight: 1.7,
                                margin: 0,
                                maxWidth: 850,
                            }}
                        >
                            {club.description}
                        </p>

                        <div
                            style={{
                                marginTop: 30,
                                paddingTop: 24,
                                borderTop: '1px solid #edf1f5',
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: 20,
                                    color: '#172033',
                                    margin: '0 0 8px',
                                }}
                            >
                                CampusOS Intelligence
                            </h2>

                            <p
                                style={{
                                    color: '#4a5568',
                                    lineHeight: 1.6,
                                    margin: '0 0 14px',
                                }}
                            >
                                Ask CampusOS about this club's activities,
                                participation, upcoming opportunities, and
                                related campus communities.
                            </p>

                            <button
                                onClick={() =>
                                    navigate('/ai', {
                                        state: {
                                            question: `Tell me about ${club.name}, its activities, upcoming opportunities, participation, and related campus communities.`,
                                        },
                                    })
                                }
                                style={{
                                    background:
                                        'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 9,
                                    padding: '12px 20px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ✦ Ask CampusOS about this club
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}