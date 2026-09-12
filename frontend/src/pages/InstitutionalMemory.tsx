import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../api/documents';
import type { DocumentResponse } from '../api/documents';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, Search, Sparkles, Calendar, Building2, Shield, Trash2, Clock } from 'lucide-react';

export default function InstitutionalMemory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterAccess, setFilterAccess] = useState('');

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [documentName, setDocumentName] = useState('');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [accessClassification, setAccessClassification] = useState('PUBLIC');

    const canUpload = user && ['admin', 'faculty', 'organizer'].includes(user.role);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentApi.getDocuments();
            setDocuments(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        try {
            setUploading(true);
            setError(null);
            
            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
            if (!['pdf', 'docx'].includes(fileExt)) {
                throw new Error('Only PDF and DOCX files are supported');
            }

            const metadata: Record<string, string | number> = {
                document_name: documentName,
                document_type: fileExt,
                access_classification: accessClassification,
            };
            if (department) metadata.department = department;
            if (year) metadata.year = parseInt(year);

            await documentApi.uploadDocument(file, metadata);
            
            // Reset form
            setFile(null);
            setDocumentName('');
            setDepartment('');
            setYear('');
            setAccessClassification('PUBLIC');
            
            // Refresh list
            fetchDocuments();
        } catch (err: any) {
            setError(err.message || err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        
        try {
            await documentApi.deleteDocument(id);
            fetchDocuments();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete document');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !searchQuery || 
            doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.department?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesDept = !filterDept || doc.department === filterDept;
        const matchesYear = !filterYear || doc.year?.toString() === filterYear;
        const matchesAccess = !filterAccess || doc.access_classification === filterAccess;
        return matchesSearch && matchesDept && matchesYear && matchesAccess;
    });

    // Get unique values for filters
    const departments = Array.from(new Set(documents.map(d => d.department).filter(Boolean)));
    const years = Array.from(new Set(documents.map(d => d.year).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));

    const getAccessColor = (classification: string) => {
        switch (classification) {
            case 'PUBLIC': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
            case 'ADMIN': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'vectorized': return '#10B981';
            case 'failed': return '#EF4444';
            default: return '#6366F1';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8F9FB',
            color: '#1a202c',
            padding: '40px 24px 80px',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                    }
                }
            `}</style>
            
            <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
                {/* Header */}
                <header style={{ marginBottom: 40, animation: 'fadeInUp 0.6s ease' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(79, 70, 229, 0.08)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        borderRadius: 999,
                        padding: '6px 14px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#4F46E5',
                        marginBottom: 16,
                    }}>
                        <FileText size={12} />
                        Knowledge Base
                    </div>
                    <h1 style={{ 
                        fontSize: 'clamp(32px, 5vw, 48px)', 
                        fontWeight: 800, 
                        letterSpacing: '-0.03em', 
                        color: '#1a202c', 
                        margin: '0 0 12px',
                        lineHeight: 1.1,
                    }}>
                        Institutional Memory
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 12px', maxWidth: 650, lineHeight: 1.6, fontWeight: 500 }}>
                        Explore the knowledge your institution has collected over time.
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, fontWeight: 500 }}>
                        CampusOS makes institutional knowledge searchable and useful.
                    </p>
                </header>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        animation: 'fadeInUp 0.4s ease',
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 18,
                        }}>
                            ⚠
                        </div>
                        <p style={{ margin: 0, color: '#DC2626', fontSize: 14, fontWeight: 500, flex: 1 }}>{error}</p>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                padding: 4,
                                fontSize: 18,
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Upload Section */}
                {canUpload && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 16,
                        padding: 28,
                        marginBottom: 32,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        animation: 'fadeInUp 0.6s ease 0.1s both',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                            }}>
                                <Upload size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a202c', letterSpacing: '-0.01em' }}>
                                    Add Institutional Record
                                </h2>
                            </div>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6, fontWeight: 500 }}>
                            Upload reports, policies, event documents, and other institutional records so CampusOS can use them when answering questions.
                        </p>

                        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                            {/* Document Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Document Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    placeholder="e.g., 2025 Annual Tech Symposium Report"
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                    }}
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Optional"
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                    }}
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Year
                                </label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    placeholder="Optional"
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                    }}
                                />
                            </div>

                            {/* Access Classification */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Access Classification *
                                </label>
                                <select
                                    value={accessClassification}
                                    onChange={(e) => setAccessClassification(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                    }}
                                >
                                    <option value="PUBLIC">Public (All Users)</option>
                                    <option value="CLUB">Club (Organizers & Admins)</option>
                                    <option value="DEPARTMENT">Department (Faculty & Admins)</option>
                                    {user?.role === 'admin' && <option value="ADMIN">Admin (Admins Only)</option>}
                                </select>
                            </div>

                            {/* File Upload - Full Width */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    File (PDF or DOCX, max 10MB) *
                                </label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px dashed #E2E8F0',
                                        borderRadius: 10,
                                        padding: '20px',
                                        color: '#64748b',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#6366F1';
                                        e.currentTarget.style.background = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.background = '#F8F9FB';
                                    }}
                                />
                                {file && (
                                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
                                        Selected: {file.name} ({formatBytes(file.size)})
                                    </p>
                                )}
                            </div>

                            {/* Submit Button - Full Width */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <button
                                    type="submit"
                                    disabled={uploading || !file || !documentName}
                                    style={{
                                        width: '100%',
                                        background: uploading || !file || !documentName
                                            ? '#CBD5E1'
                                            : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '14px 24px',
                                        color: '#ffffff',
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: uploading || !file || !documentName ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        fontFamily: 'inherit',
                                        boxShadow: uploading || !file || !documentName ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!uploading && file && documentName) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = uploading || !file || !documentName ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)';
                                    }}
                                >
                                    {uploading ? (
                                        <>
                                            <span style={{
                                                width: 18,
                                                height: 18,
                                                border: '2.5px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'spin 0.8s linear infinite',
                                            }} />
                                            Processing document...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Upload Document
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search and Filters */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    padding: '20px 24px',
                    marginBottom: 24,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    animation: 'fadeInUp 0.6s ease 0.2s both',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
                        {/* Search */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                Search Records
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search documents..."
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '10px 14px 10px 38px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.background = '#F8F9FB';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Department Filter */}
                        {departments.length > 0 && (
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Department
                                </label>
                                <select
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '10px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Year Filter */}
                        {years.length > 0 && (
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                    Year
                                </label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#F8F9FB',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: 10,
                                        padding: '10px 14px',
                                        color: '#1a202c',
                                        fontSize: 14,
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="">All Years</option>
                                    {years.map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Access Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                Access Level
                            </label>
                            <select
                                value={filterAccess}
                                onChange={(e) => setFilterAccess(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#F8F9FB',
                                    border: '2px solid #E2E8F0',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    color: '#1a202c',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">All Levels</option>
                                <option value="PUBLIC">Public</option>
                                <option value="CLUB">Club</option>
                                <option value="DEPARTMENT">Department</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Knowledge Library */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    animation: 'fadeInUp 0.6s ease 0.3s both',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '24px 28px',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a202c', letterSpacing: '-0.01em' }}>
                                Knowledge Library
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'record' : 'records'} available
                            </p>
                        </div>
                        <button
                            onClick={fetchDocuments}
                            style={{
                                background: '#F8F9FB',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                padding: '8px 16px',
                                color: '#475569',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#6366F1';
                                e.currentTarget.style.color = '#6366F1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F8F9FB';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.color = '#475569';
                            }}
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div style={{ padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                border: '3px solid #E2E8F0',
                                borderTopColor: '#6366F1',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading documents...</p>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'rgba(99, 102, 241, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}>
                                <FileText size={32} style={{ color: '#6366F1' }} />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
                                {searchQuery || filterDept || filterYear || filterAccess ? 'No matching records' : 'No institutional records yet'}
                            </h3>
                            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                                {searchQuery || filterDept || filterYear || filterAccess 
                                    ? 'Try adjusting your filters to find what you\'re looking for.'
                                    : 'Upload reports, policies, and event records to build your campus memory.'
                                }
                            </p>
                            {canUpload && !searchQuery && !filterDept && !filterYear && !filterAccess && (
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    style={{
                                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '12px 24px',
                                        color: '#ffffff',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                                    }}
                                >
                                    <Upload size={16} />
                                    Upload Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '0 0 20px' }}>
                            {filteredDocuments.map((doc, index) => {
                                const accessColor = getAccessColor(doc.access_classification);
                                const statusColor = getStatusColor(doc.processing_status);
                                
                                return (
                                    <div
                                        key={doc._id}
                                        style={{
                                            padding: '20px 28px',
                                            borderBottom: index < filteredDocuments.length - 1 ? '1px solid #F1F5F9' : 'none',
                                            transition: 'all 0.2s ease',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#F8F9FB';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                            {/* Icon */}
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 12,
                                                background: 'rgba(99, 102, 241, 0.08)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <FileText size={24} style={{ color: '#6366F1' }} />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Title */}
                                                <h3 style={{
                                                    margin: '0 0 8px',
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#1a202c',
                                                    letterSpacing: '-0.01em',
                                                }}>
                                                    {doc.document_name}
                                                </h3>

                                                {/* Metadata */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 12 }}>
                                                    {doc.department && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                            <Building2 size={14} />
                                                            {doc.department}
                                                        </div>
                                                    )}
                                                    {doc.year && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                            <Calendar size={14} />
                                                            {doc.year}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                        <FileText size={14} />
                                                        {doc.document_type.toUpperCase()} • {formatBytes(doc.file_size_bytes)}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                        <Clock size={14} />
                                                        {formatDate(doc.upload_timestamp)}
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                                    {/* Access Badge */}
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '4px 12px',
                                                        borderRadius: 9999,
                                                        background: accessColor.bg,
                                                        border: `1px solid ${accessColor.border}`,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: accessColor.text,
                                                    }}>
                                                        <Shield size={12} />
                                                        {doc.access_classification}
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '4px 12px',
                                                        borderRadius: 9999,
                                                        background: 'rgba(148, 163, 184, 0.1)',
                                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#64748b',
                                                    }}>
                                                        <span style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: statusColor,
                                                            animation: doc.processing_status === 'processing' ? 'pulse-slow 2s ease-in-out infinite' : 'none',
                                                        }} />
                                                        {doc.processing_status === 'vectorized' ? 'Ready' : doc.processing_status}
                                                        {doc.processing_status === 'vectorized' && ` • ${doc.chunk_count} chunks`}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    {doc.processing_status === 'vectorized' && (
                                                        <button
                                                            onClick={() => navigate('/ai', { state: { question: `Summarize the document: ${doc.document_name}` } })}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                                border: 'none',
                                                                borderRadius: 8,
                                                                padding: '8px 16px',
                                                                color: '#ffffff',
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                fontFamily: 'inherit',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = '';
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                                                            }}
                                                        >
                                                            <Sparkles size={14} />
                                                            Ask AI
                                                        </button>
                                                    )}
                                                    {(user?.role === 'admin' || user?._id === doc.uploaded_by) && (
                                                        <button
                                                            onClick={() => handleDelete(doc._id)}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                background: 'transparent',
                                                                border: '1px solid #FCA5A5',
                                                                borderRadius: 8,
                                                                padding: '8px 16px',
                                                                color: '#EF4444',
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                fontFamily: 'inherit',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.transform = '';
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* AI Connection Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 16,
                    padding: 28,
                    marginTop: 32,
                    animation: 'fadeInUp 0.6s ease 0.4s both',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                        }}>
                            <Sparkles size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a202c', letterSpacing: '-0.01em' }}>
                            Use your institutional memory
                        </h3>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6, fontWeight: 500 }}>
                        Ask CampusOS questions that require historical or document-based knowledge.
                    </p>
                    <button
                        onClick={() => navigate('/ai')}
                        style={{
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            border: 'none',
                            borderRadius: 10,
                            padding: '12px 24px',
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                        }}
                    >
                        <Sparkles size={16} />
                        Ask CampusOS
                    </button>
                </div>
            </div>
        </div>
    );
}
