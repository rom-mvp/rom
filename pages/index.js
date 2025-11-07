```jsx
import { useState, useEffect } from 'react';
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import { HfInference } from '@huggingface/inference';

// Supabase client (env vars in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// HF client
const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

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
    let requestId = null;
    try {
      console.log('1. Inserting stub...');
      const fileUrl = file ? await uploadFile(file) : null;
      const { data, error } = await supabase.from('requests').insert({
        user_id: user.id,
        need: userNeed,
        file_url: fileUrl,
        status: 'generating',
        phases: [],
        result: {}
      });
      if (error) throw new Error(`Insert: ${error.message}`);
      requestId = data[0].id;
      console.log('2. Stub ID:', requestId);

      console.log('3. Generating structured plan...');
      const plan = await generateStructuredPlan(userNeed);
      console.log('4. Plan preview:', plan.goal);

      console.log('5. Updating DB...');
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          status: 'complete', 
          phases: plan.phases, 
          result: plan 
        })
        .eq('id', requestId);
      if (updateError) throw new Error(`Update: ${updateError.message}`);

      console.log('6. Done – Redirecting');
      setSubmitted(true);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (error) {
      console.error('Error chain:', error.message);
      if (requestId) {
        await supabase.from('requests').update({ 
          status: 'failed', 
          result: { error: error.message, fallback: generateFallbackPlan(userNeed) }
        }).eq('id', requestId);
      }
      alert(`Gen failed: ${error.message}. Fallback plan in dashboard.`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Structured Gen: HF Pipeline + Fallback (B2B-Focused)
  async function generateStructuredPlan(need) {
    try {
      // 1. Patterns (HF sim – gen examples)
      const templates = await fetchPatterns(need, 2);
      console.log('Patterns:', templates.length);

      // 2. Trends (HF snippets)
      const keywords = need.toLowerCase().match(/\b\w+\b/g)?.slice(0, 4) || ['growth', 'b2b'];
      const trends = await fetchTrends(keywords, 3);
      console.log('Trends:', trends.length);

      // 3. Prompt + LLM (JSON with instructions/examples)
      const prompt = buildPlanPrompt(templates, trends, need);
      const response = await hf.textGeneration({
        model: 'microsoft/DialoGPT-medium',
        inputs: prompt,
        max_new_tokens: 500,
      });
      const jsonStr = response.generated_text.trim().match(/\{.*\}/s)?.[0] || '{}';
      const plan = JSON.parse(jsonStr);

      // Enforce schema (add instructions/examples if missing)
      plan.phases = plan.phases || [];
      plan.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          task.instruction = task.instruction || 'Follow standard process.';
          task.example = task.example || 'E.g., survey 50 leads.';
        });
      });

      return plan;
    } catch (hfError) {
      console.log('HF failed, using fallback');
      return generateFallbackPlan(need);
    }
  }

  // Fallback: Hardcoded B2B Structure (Always Works)
  function generateFallbackPlan(need) {
    return {
      goal: `Growth Plan for B2B Startup: ${need}`,
      phases: [
        {
          title: "Phase 1: Validate Market",
          tasks: [
            {
              task_id: "V1",
              title: "Customer Interviews",
              owner: "CEO",
              start_date: "2025-11-10",
              end_date: "2025-11-20",
              success_metric: "20 interviews completed",
              instruction: "Schedule calls with potential customers to validate pain points.",
              example: "Use Calendly for booking; ask 'What frustrates you most in B2B sales?'"
            },
            {
              task_id: "V2",
              title: "Competitor Analysis",
              owner: "Product Lead",
              start_date: "2025-11-15",
              end_date: "2025-11-25",
              success_metric: "SWOT report drafted",
              instruction: "Map competitors' features and pricing.",
              example: "Tools: SimilarWeb, G2 reviews; output Google Doc with gaps."
            }
          ]
        },
        {
          title: "Phase 2: Build MVP",
          tasks: [
            {
              task_id: "B1",
              title: "Prototype Development",
              owner: "Dev Team",
              start_date: "2025-11-25",
              end_date: "2025-12-10",
              success_metric: "Clickable prototype ready",
              instruction: "Prioritize core features based on validation.",
              example: "Use Figma for wireframes; test with 5 users via UserTesting.com."
            },
            {
              task_id: "B2",
              title: "Beta Launch Prep",
              owner: "Marketing",
              start_date: "2025-12-05",
              end_date: "2025-12-15",
              success_metric: "Landing page live",
              instruction: "Create waitlist and teaser content.",
              example: "Tools: Carrd for page, Mailchimp for signups; aim for 100 leads."
            }
          ]
        },
        {
          title: "Phase 3: Scale & Iterate",
          tasks: [
            {
              task_id: "S1",
              title: "Metrics Tracking",
              owner: "Ops",
              start_date: "2025-12-15",
              end_date: "2025-12-31",
              success_metric: "10 paying users",
              instruction: "Set up analytics and feedback loops.",
              example: "Google Analytics + Hotjar; weekly review meetings."
            },
            {
              task_id: "S2",
              title: "Funding Pitch",
              owner: "CEO",
              start_date: "2025-12-20",
              end_date: "2026-01-10",
              success_metric: "Pitch deck sent to 5 VCs",
              instruction: "Refine deck with traction data.",
              example: "Template: Sequoia pitch deck; highlight 20% MoM growth."
            }
          ]
        }
      ]
    };
  }

  // HF Helpers
  async function fetchPatterns(query, k = 2) {
    const prompt = `Generate ${k} example JSON plan templates for: "${query}". Format as array of objects with goal and phases (2 phases, 2 tasks each).`;
    const response = await hf.textGeneration({ model: 'microsoft/DialoGPT-medium', inputs: prompt, max_new_tokens: 300 });
    return JSON.parse(response.generated_text.match(/\[.*\]/s)?.[0] || '[]');
  }

  async function fetchTrends(keywords, topN = 3) {
    const prompt = `Generate ${topN} recent trends for: ${keywords.join(', ')}. Format as array [{title, summary: 'short desc'}].`;
    const response = await hf.textGeneration({ model: 'microsoft/DialoGPT-medium', inputs: prompt, max_new_tokens: 200 });
    return JSON.parse(response.generated_text.match(/\[.*\]/s)?.[0] || '[]');
  }

  function buildPlanPrompt(templates, trends, request) {
    const system = `Output ONLY JSON plan for "${request}". Use templates/examples. Include instructions/examples in tasks. Schema: goal (string), phases (array of {title, tasks: [{task_id, title, owner, start_date, end_date, success_metric, instruction, example}]}). Incorporate trends.`;
    const fewShot = templates.map(t => JSON.stringify(t)).join('\n---\n');
    const user = `Trends: ${JSON.stringify(trends)}`;

    return [
      { role: 'system', content: system },
      { role: 'assistant', content: fewShot },
      { role: 'user', content: user },
    ];
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-system text-sm pr-20"
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
                  {loadingSubmit ? 'Generating...' : 'Send to Next Steps →'}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                <p className="font-system text-xs">Plan generated! Redirecting...</p>
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
```
