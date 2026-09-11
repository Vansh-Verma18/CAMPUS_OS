import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, detectEventConflicts } from '../api/client';
import { eventsApi, type EventCreate } from '../api/events';

export default function EventPlanner() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [expectedParticipants, setExpectedParticipants] = useState('');
    const [startDatetime, setStartDatetime] = useState('');
    const [endDatetime, setEndDatetime] = useState('');
    const [venueId, setVenueId] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [targetAudience, setTargetAudience] = useState('');

    const [venues, setVenues] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [conflictResult, setConflictResult] = useState<any>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);

    const categories = ['Academic', 'Cultural', 'Competition', 'Workshop', 'Sports', 'Social', 'Technical'];

    useEffect(() => {
        async function loadData() {
            try {
                const [vRes, rRes] = await Promise.all([
                    fetchWithAuth('/venues'),
                    fetchWithAuth('/resources'),
                ]);
                if (vRes.ok) setVenues(await vRes.json());
                if (rRes.ok) setResources(await rRes.json());
            } catch {
                // silent — venues/resources are optional enhancements
            }
        }
        loadData();
    }, []);

    const handleCheckConflicts = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setConflictResult(null);
        setFormError(null);
        setCreateError(null);

        // Basic validation
        if (!title.trim()) {
            setFormError('Event title is required');
            setLoading(false);
            return;
        }
        if (!description.trim()) {
            setFormError('Event description is required');
            setLoading(false);
            return;
        }
        if (!category) {
            setFormError('Event category is required');
            setLoading(false);
            return;
        }
        if (!startDatetime || !endDatetime) {
            setFormError('Start and end date/time are required');
            setLoading(false);
            return;
        }

        try {
            const reqData = {
                title,
                start_datetime: new Date(startDatetime).toISOString(),
                end_datetime: new Date(endDatetime).toISOString(),
                venue_id: venueId || null,
                required_resource_ids: resourceId ? [resourceId] : [],
                target_audience: targetAudience.split(',').map(s => s.trim()).filter(Boolean),
            };
            const data = await detectEventConflicts(reqData);
            setConflictResult(data);
        } catch {
            setFormError('Failed to check conflicts. Please verify dates are valid and you are authorized.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!conflictResult || creating) return;

        // Check for critical conflicts
        const hasCriticalConflict = conflictResult.conflicts?.some((c: any) => c.severity === 'CRITICAL');
        if (hasCriticalConflict) {
            setCreateError('Cannot create event: Critical conflicts must be resolved first');
            return;
        }

        try {
            setCreating(true);
            setCreateError(null);

            const eventData: EventCreate = {
                title: title.trim(),
                description: description.trim(),
                category,
                start_datetime: new Date(startDatetime).toISOString(),
                end_datetime: new Date(endDatetime).toISOString(),
                expected_participants: expectedParticipants ? parseInt(expectedParticipants) : 50,
                target_audience: targetAudience.split(',').map(s => s.trim()).filter(Boolean),
                venue_id: venueId || undefined,
                required_resource_ids: resourceId ? [resourceId] : [],
                status: 'scheduled',
            };

            const newEvent = await eventsApi.createEvent(eventData);
            
            // Navigate to the newly created event
            navigate(`/events/${newEvent._id}`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create event';
            setCreateError(errorMsg);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fb',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            padding: '32px',
        }}>
            <style>{`
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
            `}</style>

            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* Page Header */}
                <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h1 style={{
                            fontSize: 28,
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            color: '#1a2332',
                            margin: 0,
                        }}>
                            Event Planner
                        </h1>
                        <span style={{
                            fontSize: 12,
                            color: '#718096',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontWeight: 500,
                        }}>
                            Planning workspace
                        </span>
                    </div>
                    <p style={{ fontSize: 15, color: '#4a5568', margin: 0 }}>
                        Plan campus events, check availability, and identify conflicts before publishing.
                    </p>
                </div>

                {/* Two-column layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(400px, 500px) 1fr',
                    gap: 24,
                    alignItems: 'start',
                    animation: 'fadeIn 0.5s ease 0.1s both',
                }}>
                    {/* Left: Form */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 32,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        position: 'sticky',
                        top: 32,
                    }}>
                        <form onSubmit={handleCheckConflicts} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Event Details */}
                            <div>
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#1a2332',
                                    margin: '0 0 16px',
                                    paddingBottom: 12,
                                    borderBottom: '1px solid #edf2f7',
                                }}>Event Details</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Event Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="e.g. Annual Hackathon 2026"
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                                transition: 'border-color 0.15s',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Description *</label>
                                        <textarea
                                            required
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Describe your event..."
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Category *</label>
                                        <select
                                            required
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div>
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#1a2332',
                                    margin: '0 0 16px',
                                    paddingBottom: 12,
                                    borderBottom: '1px solid #edf2f7',
                                }}>Schedule</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: '#4a5568',
                                                marginBottom: 6,
                                            }}>Start *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={startDatetime}
                                                onChange={e => setStartDatetime(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    padding: '10px 12px',
                                                    color: '#1a2332',
                                                    fontSize: 14,
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: '#4a5568',
                                                marginBottom: 6,
                                            }}>End *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={endDatetime}
                                                onChange={e => setEndDatetime(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    padding: '10px 12px',
                                                    color: '#1a2332',
                                                    fontSize: 14,
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Venue</label>
                                        <select
                                            value={venueId}
                                            onChange={e => setVenueId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">Select a venue (optional)</option>
                                            {venues.map(v => (
                                                <option key={v._id} value={v._id}>{v.name} — capacity {v.capacity}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Planning */}
                            <div>
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#1a2332',
                                    margin: '0 0 16px',
                                    paddingBottom: 12,
                                    borderBottom: '1px solid #edf2f7',
                                }}>Planning</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Expected Participants</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={expectedParticipants}
                                            onChange={e => setExpectedParticipants(e.target.value)}
                                            placeholder="50"
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Target Audience</label>
                                        <input
                                            type="text"
                                            value={targetAudience}
                                            onChange={e => setTargetAudience(e.target.value)}
                                            placeholder="e.g. AI, Tech, Computer Science"
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                            }}
                                        />
                                        <p style={{ fontSize: 12, color: '#718096', marginTop: 6 }}>
                                            Comma-separated categories for overlap detection
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: '#4a5568',
                                            marginBottom: 6,
                                        }}>Required Resource</label>
                                        <select
                                            value={resourceId}
                                            onChange={e => setResourceId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                color: '#1a2332',
                                                fontSize: 14,
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">Select a resource (optional)</option>
                                            {resources.map(r => (
                                                <option key={r._id} value={r._id}>{r.name} — {r.quantity} available</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {formError && (
                                <div style={{
                                    background: '#fff5f5',
                                    border: '1px solid #feb2b2',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    color: '#e53e3e',
                                    fontSize: 13,
                                }}>
                                    {formError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: loading ? '#cbd5e0' : '#4c51bf',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '12px',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s',
                                    marginTop: 8,
                                    opacity: loading ? 0.7 : 1,
                                }}
                                onMouseEnter={e => {
                                    if (!loading) e.currentTarget.style.background = '#434190';
                                }}
                                onMouseLeave={e => {
                                    if (!loading) e.currentTarget.style.background = '#4c51bf';
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span style={{
                                            width: 16, height: 16,
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'spin 0.7s linear infinite',
                                        }} />
                                        Checking your event...
                                    </>
                                ) : (
                                    <>Check for Conflicts</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right: Results/Insights Panel */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 32,
                        minHeight: 500,
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}>
                        <h2 style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1a2332',
                            margin: '0 0 8px',
                        }}>Scheduling Insights</h2>
                        <p style={{ fontSize: 14, color: '#718096', margin: '0 0 24px' }}>
                            Conflict analysis and recommendations will appear here
                        </p>

                        {!conflictResult && !loading && (
                            <div style={{
                                height: 400,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                animation: 'fadeIn 0.4s ease',
                            }}>
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 12,
                                    background: '#eef2ff',
                                    border: '1px solid #c3dafe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 28,
                                    marginBottom: 16,
                                }}>📋</div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2332', margin: '0 0 8px' }}>
                                    Ready to plan
                                </h3>
                                <p style={{ color: '#718096', fontSize: 14, maxWidth: 340, lineHeight: 1.6, marginBottom: 24 }}>
                                    Fill in the event details and check for conflicts. We'll scan all existing events, venues, and resources.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, width: '100%' }}>
                                    {[
                                        { icon: '✓', text: 'Venue availability' },
                                        { icon: '✓', text: 'Resource conflicts' },
                                        { icon: '✓', text: 'Audience overlap' },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            background: '#f8f9fb',
                                            border: '1px solid #edf2f7',
                                            borderRadius: 8,
                                            padding: '10px 14px',
                                        }}>
                                            <span style={{ color: '#38a169', fontSize: 16 }}>{item.icon}</span>
                                            <span style={{ fontSize: 13, color: '#4a5568' }}>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div style={{
                                height: 400,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'fadeIn 0.3s ease',
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    border: '3px solid #edf2f7',
                                    borderTopColor: '#4c51bf',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite',
                                    marginBottom: 16,
                                }} />
                                <p style={{ fontSize: 14, color: '#4a5568' }}>Checking your event...</p>
                            </div>
                        )}

                        {conflictResult && (
                            <div style={{ animation: 'fadeIn 0.4s ease' }}>
                                {/* Status banner */}
                                <div style={{
                                    background: conflictResult.has_conflicts ? '#fff5f5' : '#f0fff4',
                                    border: `1px solid ${conflictResult.has_conflicts ? '#feb2b2' : '#9ae6b4'}`,
                                    borderRadius: 12,
                                    padding: '16px 20px',
                                    marginBottom: 24,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                }}>
                                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
                                        {conflictResult.has_conflicts ? '⚠' : '✓'}
                                    </span>
                                    <div>
                                        <p style={{
                                            fontWeight: 600,
                                            fontSize: 15,
                                            color: conflictResult.has_conflicts ? '#e53e3e' : '#38a169',
                                            margin: '0 0 4px',
                                        }}>
                                            {conflictResult.has_conflicts ? 'Potential conflicts detected' : 'No scheduling conflicts detected'}
                                        </p>
                                        <p style={{ fontSize: 13, color: '#4a5568', margin: 0, lineHeight: 1.5 }}>
                                            {conflictResult.summary}
                                        </p>
                                    </div>
                                </div>

                                {/* Critical conflicts */}
                                {conflictResult.has_conflicts && conflictResult.conflicts?.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a2332', marginBottom: 12 }}>
                                            Conflicts
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {conflictResult.conflicts.map((c: any, idx: number) => (
                                                <div key={idx} style={{
                                                    background: c.severity === 'CRITICAL' ? '#fff5f5' : '#fffbeb',
                                                    border: `1px solid ${c.severity === 'CRITICAL' ? '#feb2b2' : '#fcd34d'}`,
                                                    borderRadius: 10,
                                                    padding: '16px 18px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                        <span style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            letterSpacing: '0.02em',
                                                            textTransform: 'uppercase',
                                                            padding: '3px 8px',
                                                            borderRadius: 4,
                                                            background: c.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                                                            color: c.severity === 'CRITICAL' ? '#e53e3e' : '#d97706',
                                                        }}>{c.severity === 'CRITICAL' ? 'Critical' : 'Warning'}</span>
                                                        <span style={{ fontSize: 12, color: '#718096' }}>{c.conflict_type}</span>
                                                    </div>
                                                    <p style={{ fontSize: 14, color: '#1a2332', margin: '0 0 12px', lineHeight: 1.5 }}>
                                                        {c.explanation}
                                                    </p>
                                                    <div style={{
                                                        background: '#ffffff',
                                                        border: '1px solid #edf2f7',
                                                        borderRadius: 8,
                                                        padding: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 6,
                                                    }}>
                                                        <p style={{ fontSize: 13, color: '#4a5568', margin: 0 }}>
                                                            <span style={{ fontWeight: 500 }}>Existing event: </span>
                                                            {c.event_title}
                                                        </p>
                                                        {c.evidence.venue_name && (
                                                            <p style={{ fontSize: 13, color: '#4a5568', margin: 0 }}>
                                                                <span style={{ fontWeight: 500 }}>Venue: </span>
                                                                {c.evidence.venue_name}
                                                            </p>
                                                        )}
                                                        {c.evidence.resource_name && (
                                                            <p style={{ fontSize: 13, color: '#4a5568', margin: 0 }}>
                                                                <span style={{ fontWeight: 500 }}>Resource: </span>
                                                                {c.evidence.resource_name}
                                                            </p>
                                                        )}
                                                        <p style={{ fontSize: 13, color: '#4a5568', margin: 0 }}>
                                                            <span style={{ fontWeight: 500 }}>Overlap: </span>
                                                            {c.evidence.overlap_minutes} minutes
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Audience overlaps */}
                                {conflictResult.audience_overlaps?.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a2332', marginBottom: 12 }}>
                                            Audience Overlap
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {conflictResult.audience_overlaps.map((ao: any, idx: number) => (
                                                <div key={idx} style={{
                                                    background: '#eef2ff',
                                                    border: '1px solid #c3dafe',
                                                    borderRadius: 8,
                                                    padding: '14px 16px',
                                                }}>
                                                    <p style={{ fontSize: 14, color: '#4c51bf', margin: '0 0 6px', fontWeight: 500 }}>
                                                        {ao.event_title}
                                                    </p>
                                                    <p style={{ fontSize: 13, color: '#4a5568', margin: '0 0 4px' }}>
                                                        Shared audiences: {ao.overlapping_categories.join(', ')}
                                                    </p>
                                                    <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
                                                        Overlap: {(ao.overlap_score * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Create event error */}
                                {createError && (
                                    <div style={{
                                        background: '#fff5f5',
                                        border: '1px solid #feb2b2',
                                        borderRadius: 10,
                                        padding: '14px 18px',
                                        color: '#e53e3e',
                                        fontSize: 13,
                                        marginBottom: 24,
                                    }}>
                                        {createError}
                                    </div>
                                )}

                                {/* Create event action - only show if no CRITICAL conflicts */}
                                {!conflictResult.conflicts?.some((c: any) => c.severity === 'CRITICAL') && (
                                    <div style={{
                                        background: conflictResult.has_conflicts ? '#fffbeb' : '#f0fff4',
                                        border: `1px solid ${conflictResult.has_conflicts ? '#fcd34d' : '#9ae6b4'}`,
                                        borderRadius: 10,
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 16,
                                    }}>
                                        <div>
                                            <p style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: conflictResult.has_conflicts ? '#d97706' : '#38a169',
                                                margin: '0 0 4px'
                                            }}>
                                                {conflictResult.has_conflicts ? 'Warning only — can proceed' : 'Ready to create'}
                                            </p>
                                            <p style={{ fontSize: 13, color: '#4a5568', margin: 0 }}>
                                                {conflictResult.has_conflicts
                                                    ? 'Review warnings and confirm if acceptable.'
                                                    : 'No conflicts found for this event.'}
                                            </p>
                                        </div>
                                        <button
                                            disabled={creating}
                                            style={{
                                                background: creating ? '#cbd5e0' : '#38a169',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '10px 20px',
                                                color: '#ffffff',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                cursor: creating ? 'not-allowed' : 'pointer',
                                                fontFamily: 'inherit',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                transition: 'all 0.2s',
                                                opacity: creating ? 0.7 : 1,
                                            }}
                                            onClick={handleCreateEvent}
                                            onMouseEnter={e => {
                                                if (!creating) e.currentTarget.style.background = '#2f855a';
                                            }}
                                            onMouseLeave={e => {
                                                if (!creating) e.currentTarget.style.background = '#38a169';
                                            }}
                                        >
                                            {creating ? (
                                                <>
                                                    <span style={{
                                                        width: 14, height: 14,
                                                        border: '2px solid rgba(255,255,255,0.3)',
                                                        borderTopColor: '#fff',
                                                        borderRadius: '50%',
                                                        display: 'inline-block',
                                                        animation: 'spin 0.7s linear infinite',
                                                    }} />
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Event →'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Block creation if CRITICAL conflicts */}
                                {conflictResult.conflicts?.some((c: any) => c.severity === 'CRITICAL') && (
                                    <div style={{
                                        background: '#fff5f5',
                                        border: '1px solid #feb2b2',
                                        borderRadius: 10,
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                    }}>
                                        <span style={{ fontSize: 20, lineHeight: 1 }}>🚫</span>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#e53e3e', margin: '0 0 4px' }}>
                                                Cannot create event
                                            </p>
                                            <p style={{ fontSize: 13, color: '#4a5568', margin: 0, lineHeight: 1.5 }}>
                                                Critical conflicts must be resolved. Modify your event details and check again.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
