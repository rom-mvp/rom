import { useState, useEffect } from 'react';
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// Supabase client (env vars in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Stub upload
async function uploadFile(file) {
  console.log('Uploading:', file.name);
  return 'https://stub-upload-url.com/' + file.name;
}

// Dynamic auth
const AuthComponents = dynamic(() => Promise.resolve({
  default: () => (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="user-friendly-button">
            Get Started For Free →
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-system">ROM</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!userNeed.trim()) return;

  setLoadingSubmit(true);
  try {
    console.log('Generating plan for:', userNeed);
    const fileUrl = file ? await uploadFile(file) : null;

    // 1. Insert stub row
    const { data, error } = await supabase.from('requests').insert({
      user_id: user.id,
      need: userNeed,
      file_url: fileUrl,
      status: 'generating',  // Flash for UX
      phases: null,
      result: null
    });
    if (error) throw error;
    const requestId = data[0].id;

    // 2. Run Pipeline: Patterns + Trends → LLM Plan
    const plan = await generatePlan(userNeed);

    // 3. Update to complete + JSON
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: 'complete', 
        phases: plan.phases, 
        result: plan 
      })
      .eq('id', requestId);
    if (updateError) throw updateError;

    console.log('Plan ready:', plan.goal);
    setSubmitted(true);
    setTimeout(() => router.push('/dashboard'), 1000);  // Quick flash
  } catch (error) {
    console.error('Gen error:', error);
    await supabase.from('requests').update({ status: 'failed', result: { error: error.message } }).eq('id', data[0].id);
    alert('Gen failed—check dashboard for details.');
  } finally {
    setLoadingSubmit(false);
  }
};

// Pipeline: Skeleton Adapted for HF (Patterns + Trends → JSON Plan)
async function generatePlan(request) {
  // 1. Fetch Patterns (HF sim embeddings – gen similar templates)
  const templates = await fetchSimilarTemplates(request, 3);

  // 2. Extract Keywords
  const keywords = request.toLowerCase().match(/\b\w+\b/g)?.slice(0, 5) || [];

  // 3. Fetch Trends (HF gen snippets)
  const trends = await fetchTrends(keywords, 5);

  // 4. Build Prompt + Call LLM (JSON-only output)
  const messages = buildPrompt(templates, trends, request);
  const plan = await callLLM(messages);

  return plan;  // { goal, phases: [{title, tasks: [...]}] }
}

// Helpers (From Skeleton, HF-Adapted)
async function fetchSimilarTemplates(query, k = 3) {
  const response = await hf.textGeneration({
    model: 'sentence-transformers/all-MiniLM-L6-v2',  // Embed sim via gen
    inputs: `Generate 3 JSON plan templates similar to query: "${query}". Match schema: ${JSON.stringify(require('./planSchema.json'))}`,
    max_new_tokens: 400,
  });
  // Parse as array (MVP hack – prod: Real vector search)
  return JSON.parse(response.generated_text.match(/\[.*\]/s)?.[0] || '[]').slice(0, k);
}

async function fetchTrends(keywords, topN = 5) {
  const prompt = `Generate 5 recent trends for: ${keywords.join(', ')}. Format: [{title, summary (short), url: 'n/a', date: '2025-11'}]`;
  const response = await hf.textGeneration({
    model: 'microsoft/DialoGPT-medium',
    inputs: prompt,
    max_new_tokens: 300,
  });
  return JSON.parse(response.generated_text.match(/\[.*\]/s)?.[0] || '[]').slice(0, topN);
}

function buildPrompt(templates, trends, request) {
  const system = `Strategic planner. Output ONLY JSON plan: goal (string), phases (array of {title, tasks: [{task_id, title, owner, start_date, end_date, success_metric, creative_shift}]}). Use templates + trends. Request: ${request}`;
  const fewShot = templates.map(t => JSON.stringify(t)).join('\n---\n');
  const user = `Trends: ${JSON.stringify(trends.map(t => `${t.title}: ${t.summary}`))}`;

  return [
    { role: 'system', content: system },
    { role: 'assistant', content: fewShot },
    { role: 'user', content: user },
  ];
}

async function callLLM(messages) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const response = await hf.textGeneration({
    model: 'microsoft/DialoGPT-medium',
    inputs: prompt,
    max_new_tokens: 600,
  });
  const jsonStr = response.generated_text.trim().match(/\{.*\}/s)?.[0] || '{}';
  return JSON.parse(jsonStr);
}

    // AI Process: Call HF
    const aiResult = await generateGrowthPlan(userNeed);
    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'complete', result: aiResult })
      .eq('id', data[0].id);
    if (updateError) throw updateError;

    setSubmitted(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  } catch (error) {
    console.error('Submit error:', error.message);
    // Fallback: Update to failed
    if (data) {
      await supabase.from('requests').update({ status: 'failed' }).eq('id', data[0].id);
    }
    alert(`AI hiccup: ${error.message}. Try refresh—status updated to failed.`);
  } finally {
    setLoadingSubmit(false);
  }
};

// Enhanced HF Gen (Matches B2B/growth, fallback)
async function generateGrowthPlan(need) {
  const lowerNeed = need.toLowerCase();
  if (!lowerNeed.includes('growth') && !lowerNeed.includes('b2b') && !lowerNeed.includes('plan')) {
    return 'Quick tip: For B2B growth, start with customer interviews. Full plan in Pro tier!';
  }

  const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
  if (!HF_TOKEN) throw new Error('HF token missing—check Vercel env');

  const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {  // Better for plans than gpt2
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: `Create a step-by-step B2B startup growth plan: ${need}` }),
  });

  if (!response.ok) throw new Error(`HF API error: ${response.status} - Model busy? Try again.`);
  const { generated_text } = await response.json();
  return generated_text.slice(0, 400) + '\n\n(Pro: Download PDF + custom tweaks)';
}
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-4">
        {!isSignedIn ? (
          <>
            <h1 className="text-4xl font-bold text-gray-900 font-system">ROM</h1>
            <p className="text-sm text-gray-600 font-system">from Mind to Matter</p>
            <div className="space-y-4">
              <AuthComponents />
            </div>
          </>
        ) : (
          <>
            {/* No ROM here – just greeting */}
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold text-gray-900 font-system">
                Hey {user.firstName || user.username || 'there'}!
              </h2>
              <p className="text-sm text-gray-600 font-system">we go from mind to matter</p>
            </div>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-3 w-full">
                <div className="relative">
                  <textarea
                    value={userNeed}
                    onChange={(e) => setUserNeed(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-system text-sm pr-20"  // Extra right padding for corner
                    placeholder="What do you need AI for today? (or upload a file)"
                    required
                    disabled={loadingSubmit}
                  />
                  {/* Corner upload: Small pill in top-right */}
                  <label className="absolute top-3 right-3 cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      accept=".csv,.txt,.json"
                      className="hidden"
                      disabled={loadingSubmit}
                    />
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-system hover:bg-blue-200">
                      📎
                    </span>
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="absolute top-3 right-10 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-system hover:bg-red-200"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="user-friendly-button w-full"
                >
                  {loadingSubmit ? 'Sending...' : 'Send to Next Steps →'}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                <p className="font-system text-xs">Got it! We're processing your request. Redirecting...</p>
                <button
                  onClick={() => { setSubmitted(false); setUserNeed(''); setFile(null); }}
                  className="mt-1 text-blue-600 underline font-system text-xs"
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
