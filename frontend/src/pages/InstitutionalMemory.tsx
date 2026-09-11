import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../api/documents';
import type { DocumentResponse } from '../api/documents';
import { useAuth } from '../context/AuthContext';

export default function InstitutionalMemory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080c18',
            color: '#e2e8f0',
            padding: '40px 40px 80px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            maxWidth: 1200,
            margin: '0 auto',
            animation: 'fadeIn 0.5s ease',
        }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            
            <div style={{ marginBottom: 40 }}>
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
                    Knowledge Base
                </div>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 8px' }}>
                    Institutional Memory
                </h1>
                <p style={{ color: '#475569', fontSize: 15, margin: 0, maxWidth: 500 }}>
                    Manage the documents that power CampusOS intelligence.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {canUpload && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">Upload Document</h2>
                    <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Document Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 2023 Annual Tech Symposium Report"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">File (PDF or DOCX, max 10MB) *</label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Access Classification *</label>
                                <select
                                    value={accessClassification}
                                    onChange={(e) => setAccessClassification(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="PUBLIC">Public (All Users)</option>
                                    <option value="CLUB">Club (Organizers & Admins)</option>
                                    <option value="DEPARTMENT">Department (Faculty & Admins)</option>
                                    {user.role === 'admin' && <option value="ADMIN">Admin (Admins Only)</option>}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file || !documentName}
                                className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Upload & Index Document'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Indexed Documents</h2>
                    <button onClick={fetchDocuments} className="text-sm text-gray-400 hover:text-white transition-colors">
                        Refresh
                    </button>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No documents found matching your access level.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-slate-900/50 text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Document</th>
                                    <th className="px-6 py-4 font-medium">Classification</th>
                                    <th className="px-6 py-4 font-medium">Size</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {documents.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{doc.document_name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {doc.document_type.toUpperCase()} • {doc.year || 'No year'} • {doc.department || 'No dept'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                doc.access_classification === 'PUBLIC' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                doc.access_classification === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                {doc.access_classification}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {formatBytes(doc.file_size_bytes)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    doc.processing_status === 'vectorized' ? 'bg-green-500' : 
                                                    doc.processing_status === 'failed' ? 'bg-red-500' : 
                                                    'bg-blue-500 animate-pulse'
                                                }`} />
                                                <span className="capitalize">{doc.processing_status}</span>
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {doc.chunk_count} chunks
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                                                {doc.processing_status === 'vectorized' && (
                                                    <button
                                                        onClick={() => navigate('/ai', { state: { question: `Summarize the document: ${doc.document_name}` } })}
                                                        style={{
                                                            background: 'rgba(99,102,241,0.1)',
                                                            border: '1px solid rgba(99,102,241,0.2)',
                                                            color: '#818cf8',
                                                            padding: '4px 10px',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                                                        }}
                                                    >
                                                        <span>✦</span> Ask AI
                                                    </button>
                                                )}
                                                {(user?.role === 'admin' || user?._id === doc.uploaded_by) && (
                                                    <button 
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        title="Delete document"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
