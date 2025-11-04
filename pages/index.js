import { useState, useEffect } from 'react';
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// Supabase client (env vars in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Stub upload (real: supabase.storage.from('files').upload())
async function uploadFile(file) {
  console.log('Uploading:', file.name);
  return 'https://stub-upload-url.com/' + file.name;  // Placeholder
}

// Dynamic for client-only auth
const AuthComponents = dynamic(() => Promise.resolve({
  default: () => (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="glass-button font-system">
            Get Started For Free
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  )
}), { ssr: false });

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userNeed, setUserNeed] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-system">ROM</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userNeed.trim()) return;  // Basic validation

    setLoadingSubmit(true);
    try {
      console.log('User need:', userNeed, 'File:', file);
      const fileUrl = file ? await uploadFile(file) : null;
      const { error } = await supabase.from('requests').insert({
        user_id: user.id,
        need: userNeed,
        file_url: fileUrl,
      });
      if (error) throw error;

      setSubmitted(true);
      // Auto-redirect after 2s (or remove for manual)
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Oops—try again! (Check console)');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <h1 className="text-5xl font-bold text-gray-900 font-system">ROM</h1>
        
        {!isSignedIn ? (
          <>
            <p className="text-lg text-gray-600 font-system">from Mind to Matter</p>
            <div className="space-y-4">
              <AuthComponents />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-4xl font-semibold text-gray-900 font-system">
                Hey {user.firstName || user.username || 'there'}!
              </h2>
              <p className="text-xl text-gray-600 font-system">we go from mind to matter</p>
            </div>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-system">
                    What do you need AI for today?
                  </label>
                  <textarea
                    value={userNeed}
                    onChange={(e) => setUserNeed(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-system text-base"
                    placeholder="Describe your task or upload a file..."
                    required
                    disabled={loadingSubmit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-system">
                    Or upload data (CSV, TXT, etc.)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".csv,.txt,.json"
                    className="w-full p-3 border border-gray-300 rounded-xl font-system text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={loadingSubmit}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="glass-button w-full font-system disabled:opacity-50"
                >
                  {loadingSubmit ? 'Sending...' : 'Send to Next Steps'}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                <p className="font-system text-sm">Got it! We're processing your request. Redirecting...</p>
                <button
                  onClick={() => { setSubmitted(false); setUserNeed(''); setFile(null); }}
                  className="mt-2 text-blue-600 underline font-system text-sm"
                >
                  New Request
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
