import { useState } from 'react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Stub for now

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">🚀 HF-Next Pro</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md">AI for Work, in 3 Clicks. Upload data → Pick a template → Get insights.</p>
        <div className="space-y-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg">
                Get Started Free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
            <div className="mt-4 text-lg">Welcome! Head to Dashboard → Run Your First AI.</div>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
