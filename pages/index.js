import { useState, useEffect } from 'react';
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Dynamic for client-only auth
const AuthComponents = dynamic(() => Promise.resolve({
  default: () => (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg">
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
  const [userNeed, setUserNeed] = useState('');  // For the input box
  const [file, setFile] = useState(null);  // For upload
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">Rom</h1>
          <p className="text-xl text-gray-600 mb-8">from Mind to Matter</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // Stub: Save to Supabase or HF API later. For now, just set submitted.
    console.log('User need:', userNeed, 'File:', file);
    setSubmitted(true);
    // TODO: Redirect to /dashboard or process AI
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-900 mb-2">Rom</h1>
        
        {!isSignedIn ? (
          <>
            <p className="text-xl text-gray-600 mb-8">from Mind to Matter</p>
            <div className="space-y-4">
              <AuthComponents />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Heya {user.firstName || user.username || 'there'}!
            </h2>
            <p className="text-lg text-gray-600 mb-8">from Mind to Matter</p>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you need AI for today? (e.g., "Analyze my sales data")
                  </label>
                  <textarea
                    value={userNeed}
                    onChange={(e) => setUserNeed(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your task or upload a file..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or upload data (CSV, TXT, etc.)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".csv,.txt,.json"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
                >
                  Send to Next Steps
                </button>
              </form>
            ) : (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                <p>Got it! We're processing your request. Check back soon or head to dashboard.</p>
                <button
                  onClick={() => { setSubmitted(false); setUserNeed(''); setFile(null); }}
                  className="mt-2 text-blue-600 underline"
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
