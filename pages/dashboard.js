import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('requests')  // Create this table in Supabase
      .select('*')
      .eq('user_id', user.id);
    setRequests(data || []);
  };

  return (
    <div className="min-h-screen bg-white p-4 font-system">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Your Dashboard</h1>
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="p-4 border border-gray-200 rounded-xl">
            <p className="font-medium">{req.need}</p>
            <p className="text-sm text-gray-600">Status: Processing...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
