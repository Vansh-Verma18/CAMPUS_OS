import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                        <h1 className="text-3xl font-bold text-gray-900">CampusOS Prototype</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                        >
                            Log Out
                        </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-blue-900 mb-4">Authentication Successful</h2>
                        <p className="text-blue-800 mb-2">You are securely logged into the CampusOS testing environment.</p>
                        <p className="text-sm text-blue-600">The current security boundary enforces role-based access control via JWT.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 border rounded-lg bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Identity Details</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Name</dt>
                                    <dd className="text-base font-medium text-gray-900">{user.display_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Email</dt>
                                    <dd className="text-base font-medium text-gray-900">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Username</dt>
                                    <dd className="text-base font-medium text-gray-900">@{user.username}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="p-6 border rounded-lg bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Authorization</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">System Role</dt>
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                                            {user.role}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Account Status</dt>
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {user.account_status}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Internal ID</dt>
                                    <dd className="text-xs font-mono text-gray-400 mt-1">{user._id}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
