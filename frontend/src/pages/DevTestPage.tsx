import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { fetchHealth } from '../services/api';

export function DevTestPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const data = await fetchHealth();
        setHealth(data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to API');
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">CampusOS</h1>
            <p className="text-sm text-gray-500">System Health Dashboard</p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
            Error: {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm font-medium text-green-800">API Status</span>
              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold uppercase tracking-wide">
                {health?.status || 'Unknown'}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-700">MongoDB</span>
              <span className={`px-2 py-1 text-xs rounded-full font-semibold uppercase tracking-wide ${health?.dependencies?.mongodb === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {health?.dependencies?.mongodb || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-700">ChromaDB</span>
              <span className={`px-2 py-1 text-xs rounded-full font-semibold uppercase tracking-wide ${health?.dependencies?.chromadb === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {health?.dependencies?.chromadb || 'Unknown'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
