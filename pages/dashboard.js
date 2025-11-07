```jsx
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import PlanGrid from '../components/PlanGrid';  // Import the grid component

// Single Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isLoaded) {
      fetchRequests();
    }
  }, [user, isLoaded]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('requests')
        .select('*, phases, result')  // Include phases and result
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiff = async (updatedPlan, requestId) => {
    // Update local state for immediate UI feedback
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, result: updatedPlan, phases: updatedPlan.phases } : r
    ));
    // Optional: Re-fetch or sync to Supabase
    await supabase.from('requests').update({ result: updatedPlan, phases: updatedPlan.phases }).eq('id', requestId);
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-system">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-4 font-system">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Requests</h1>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-600">No requests yet. Head back to make one!</p>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4">
              <p className="font-medium text-sm mb-2">{req.need}</p>
              {req.file_url && <p className="text-xs text-gray-500 mb-2">📎 {req.file_url.split('/').pop()}</p>}
              <p className="text-xs text-gray-400 mb-2">Status: {req.status} (created {new Date(req.created_at).toLocaleDateString()})</p>
              {req.result && req.status === 'complete' ? (
                <div className="mt-2">
                  <h4 className="text-xs font-semibold mb-1">Plan Goal: {req.result.goal}</h4>
                  <PlanGrid plan={req.result} onDiff={(updated) => handleDiff(updated, req.id)} planId={req.id} />
                </div>
              ) : req.status === 'failed' ? (
                <div className="text-xs text-red-500">Failed: {req.result?.error}</div>
              ) : (
                <p className="text-xs text-gray-500">Generating structured plan...</p>
              )}
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
```
