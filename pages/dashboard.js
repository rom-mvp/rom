import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-system">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 font-system">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Requests</h1>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-600">No requests yet. Head back to make one!</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
              <p className="font-medium text-sm">{req.need}</p>
              {req.file_url && <p className="text-xs text-gray-500 mt-1">📎 {req.file_url.split('/').pop()}</p>}
              <p className="text-xs text-gray-400 mt-2">Status: Processing... (created {new Date(req.created_at).toLocaleDateString()})</p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => router.push('/')}
        className="mt-6 user-friendly-button w-full max-w-xs mx-auto"
      >
        New Request →
      </button>
    </div>
  );
}
