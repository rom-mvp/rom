import { useState, useEffect } from 'react';
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Dynamic for client-only auth
const AuthComponents = dynamic(() => Promise.resolve({
  default: () => (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="glass-button">
            Get Started Free
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
  const [isClient, setIsClient] = useState(false);
  const [userNeed, setUserNeed] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4 font-system">ROM</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('User need:', userNeed, 'File:', file);
    setSubmitted(true);
    // Day 2: Redirect to /dashboard?need=[userNeed]
    // window.location.href = `/dashboard?need=${encodeURIComponent(userNeed)}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <h1 className="text-6xl font-bold text-gray-900 font-system">ROM</h1>
        
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
                  />
                </div>
                <button
                  type="submit"
                  className="glass-button w-full"
                >
                  Send to Next Steps
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                <p className="font-system text-sm">Got it! We're processing your request.</p>
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
