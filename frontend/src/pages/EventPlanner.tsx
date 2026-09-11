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

    const S = {
        page: {
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            display: 'flex' as const,
            gap: 0,
        },
        panel: {
            background: '#0c1120',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '36px 32px',
            width: 380,
            flexShrink: 0 as const,
            overflowY: 'auto' as const,
        },
        results: {
            flex: 1,
            padding: '36px 32px',
            overflowY: 'auto' as const,
        },
        label: {
            display: 'block',
            fontSize: 12,
            fontWeight: 500 as const,
            color: '#64748b',
            marginBottom: 6,
            letterSpacing: '0.02em',
        },
        input: {
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9,
            padding: '10px 13px',
            color: '#f1f5f9',
            fontSize: 13,
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
        },
        select: {
            width: '100%',
            background: '#0f1626',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9,
            padding: '10px 13px',
            color: '#f1f5f9',
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer',
        },
    };

    const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = 'rgba(99,102,241,0.5)';
        e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
    };
    const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.08)';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div style={S.page}>
            <style>{`
                @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
            `}</style>

            {/* Left: Form */}
            <div style={S.panel}>
                <div style={{ marginBottom: 28 }}>
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
                        textTransform: 'uppercase' as const,
                        color: '#818cf8',
                        marginBottom: 12,
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        Event Intelligence
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 6px' }}>
                        Event Planner
                    </h1>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                        Plan your event and detect campus conflicts before they happen.
                    </p>
                </div>

                <form onSubmit={handleCheckConflicts} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={S.label}>Event Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Annual Hackathon 2026"
                            style={S.input}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        />
                    </div>

                    <div>
                        <label style={S.label}>Description *</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe your event..."
                            rows={3}
                            style={{
                                ...S.input,
                                resize: 'vertical' as const,
                                fontFamily: 'inherit',
                            }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        />
                    </div>

                    <div>
                        <label style={S.label}>Category *</label>
                        <select
                            required
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={S.select}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={S.label}>Expected Participants</label>
                        <input
                            type="number"
                            min="1"
                            value={expectedParticipants}
                            onChange={e => setExpectedParticipants(e.target.value)}
                            placeholder="50"
                            style={S.input}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={S.label}>Start *</label>
                            <input
                                type="datetime-local"
                                required
                                value={startDatetime}
                                onChange={e => setStartDatetime(e.target.value)}
                                style={{ ...S.input, colorScheme: 'dark' }}
                                onFocus={inputFocus}
                                onBlur={inputBlur}
                            />
                        </div>
                        <div>
                            <label style={S.label}>End *</label>
                            <input
                                type="datetime-local"
                                required
                                value={endDatetime}
                                onChange={e => setEndDatetime(e.target.value)}
                                style={{ ...S.input, colorScheme: 'dark' }}
                                onFocus={inputFocus}
                                onBlur={inputBlur}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={S.label}>Venue</label>
                        <select
                            value={venueId}
                            onChange={e => setVenueId(e.target.value)}
                            style={S.select}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        >
                            <option value="">Select a venue (optional)</option>
                            {venues.map(v => (
                                <option key={v._id} value={v._id}>{v.name} — capacity {v.capacity}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={S.label}>Required Resource</label>
                        <select
                            value={resourceId}
                            onChange={e => setResourceId(e.target.value)}
                            style={S.select}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        >
                            <option value="">Select a resource (optional)</option>
                            {resources.map(r => (
                                <option key={r._id} value={r._id}>{r.name} — {r.quantity} available</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={S.label}>Target Audience</label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                            placeholder="e.g. AI, Tech, Computer Science"
                            style={S.input}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                        />
                        <p style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>Comma-separated categories for audience overlap detection</p>
                    </div>

                    {formError && (
                        <div style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 9,
                            padding: '10px 14px',
                            color: '#f87171',
                            fontSize: 13,
                        }}>{formError}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading
                                ? 'rgba(99,102,241,0.3)'
                                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: 10,
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
                            marginTop: 4,
                        }}
                        onMouseEnter={e => {
                            if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                        }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {loading ? (
                            <>
                                <span style={{
                                    width: 14, height: 14,
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: '#fff',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                                Checking campus…
                            </>
                        ) : (
                            <>⊕ Check for Conflicts</>
                        )}
                    </button>
                </form>
            </div>

            {/* Right: Results */}
            <div style={S.results}>
                {!conflictResult && !loading && (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: 40,
                        animation: 'fadeIn 0.4s ease',
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                            marginBottom: 16,
                        }}>⊕</div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
                            Plan Your Event
                        </h2>
                        <p style={{ color: '#475569', fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
                            Fill in the event details and run a conflict check. CampusOS will scan all existing events, venues, and resources to surface any issues before you commit.
                        </p>
                        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, width: '100%' }}>
                            {[
                                { icon: '⊗', text: 'Venue double-booking detection' },
                                { icon: '⊗', text: 'Resource availability conflicts' },
                                { icon: '⊗', text: 'Audience overlap signals' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                }}>
                                    <span style={{ color: '#475569', fontSize: 14 }}>{item.icon}</span>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {conflictResult && (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
                                Campus Check Results
                            </h2>
                            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                                Deterministic conflict analysis for "{title}"
                            </p>
                        </div>

                        {/* Status banner */}
                        <div style={{
                            background: conflictResult.has_conflicts
                                ? 'rgba(239,68,68,0.07)'
                                : 'rgba(34,197,94,0.07)',
                            border: `1px solid ${conflictResult.has_conflicts ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                            borderRadius: 12,
                            padding: '16px 20px',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
                                {conflictResult.has_conflicts ? '⚠' : '✓'}
                            </span>
                            <div>
                                <p style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: conflictResult.has_conflicts ? '#f87171' : '#4ade80',
                                    margin: '0 0 4px',
                                }}>
                                    {conflictResult.has_conflicts ? 'Conflicts Detected' : 'No Conflicts Found'}
                                </p>
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                                    {conflictResult.summary}
                                </p>
                            </div>
                        </div>

                        {/* Hard conflicts */}
                        {conflictResult.has_conflicts && conflictResult.conflicts?.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#334155', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                                    Hard Conflicts
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {conflictResult.conflicts.map((c: any, idx: number) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(239,68,68,0.15)',
                                            borderRadius: 12,
                                            padding: '16px 18px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <span style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: c.severity === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                                    color: c.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
                                                }}>{c.severity}</span>
                                                <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{c.conflict_type}</span>
                                            </div>
                                            <p style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 10px', lineHeight: 1.5 }}>
                                                {c.explanation}
                                            </p>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4,
                                            }}>
                                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>Existing event: </span>
                                                    {c.event_title}
                                                </p>
                                                {c.evidence.venue_name && (
                                                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Venue: </span>
                                                        {c.evidence.venue_name}
                                                    </p>
                                                )}
                                                {c.evidence.resource_name && (
                                                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Resource: </span>
                                                        {c.evidence.resource_name}
                                                    </p>
                                                )}
                                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>Overlap: </span>
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
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#334155', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                                    Audience Overlap Signal
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {conflictResult.audience_overlaps.map((ao: any, idx: number) => (
                                        <div key={idx} style={{
                                            background: 'rgba(96,165,250,0.05)',
                                            border: '1px solid rgba(96,165,250,0.15)',
                                            borderRadius: 10,
                                            padding: '12px 16px',
                                        }}>
                                            <p style={{ fontSize: 13, color: '#93c5fd', margin: '0 0 4px', fontWeight: 500 }}>
                                                {ao.event_title}
                                            </p>
                                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>
                                                Shared audiences: {ao.overlapping_categories.join(', ')}
                                            </p>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0, fontFamily: 'monospace' }}>
                                                Overlap score: {(ao.overlap_score * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Create event error */}
                        {createError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 12,
                                padding: '14px 18px',
                                color: '#f87171',
                                fontSize: 13,
                                marginBottom: 20,
                            }}>
                                {createError}
                            </div>
                        )}

                        {/* Success action - only show if no CRITICAL conflicts */}
                        {!conflictResult.conflicts?.some((c: any) => c.severity === 'CRITICAL') && (
                            <div style={{
                                background: conflictResult.has_conflicts 
                                    ? 'rgba(245,158,11,0.04)'
                                    : 'rgba(34,197,94,0.04)',
                                border: `1px solid ${conflictResult.has_conflicts ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'}`,
                                borderRadius: 12,
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
                                        color: conflictResult.has_conflicts ? '#fbbf24' : '#4ade80', 
                                        margin: '0 0 3px' 
                                    }}>
                                        {conflictResult.has_conflicts ? 'Warnings only — can proceed' : 'Ready to proceed'}
                                    </p>
                                    <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                                        {conflictResult.has_conflicts 
                                            ? 'Non-blocking conflicts detected. Review and confirm if acceptable.'
                                            : 'No scheduling conflicts found for this event.'}
                                    </p>
                                </div>
                                <button
                                    disabled={creating}
                                    style={{
                                        background: creating 
                                            ? 'rgba(34,197,94,0.1)'
                                            : 'rgba(34,197,94,0.15)',
                                        border: '1px solid rgba(34,197,94,0.3)',
                                        borderRadius: 8,
                                        padding: '8px 16px',
                                        color: creating ? '#334155' : '#4ade80',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: creating ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                    onClick={handleCreateEvent}
                                >
                                    {creating ? (
                                        <>
                                            <span style={{
                                                width: 12, height: 12,
                                                border: '2px solid rgba(255,255,255,0.2)',
                                                borderTopColor: '#4ade80',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'spin 0.7s linear infinite',
                                            }} />
                                            Creating...
                                        </>
                                    ) : (
                                        'Confirm Event →'
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Block creation if CRITICAL conflicts */}
                        {conflictResult.conflicts?.some((c: any) => c.severity === 'CRITICAL') && (
                            <div style={{
                                background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 12,
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 20, lineHeight: 1 }}>🚫</span>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171', margin: '0 0 4px' }}>
                                        Cannot create event
                                    </p>
                                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                                        Critical conflicts must be resolved before this event can be created. Modify the event details and run the conflict check again.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
