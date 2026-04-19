"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import { getJob, acceptJob, type Job } from "@/lib/api";
import { createClient } from "@/lib/supabase";

const CATEGORY_ICONS: Record<string, string> = {
  Electrician: "⚡",
  Plumber:     "🔧",
  Carpenter:   "🪚",
  Painter:     "🎨",
};

function WorkerContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const supabase = createClient();

  const jobId    = params.get("job_id")    ?? "";
  const workerId = params.get("worker_id") ?? "";

  const [job,       setJob]       = useState<Job | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted,  setAccepted]  = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    getJob(jobId)
      .then(r => {
        setJob(r.data);
        if (r.data.status === "matched" && r.data.matched_worker_id === workerId) setAccepted(true);
      })
      .catch((e: unknown) => setToast({ msg: e instanceof Error ? e.message : "Failed to load job", type: "error" }))
      .finally(() => setLoading(false));
  }, [jobId, workerId]);

  const handleAccept = async () => {
    if (!jobId || !workerId) {
      setToast({ msg: "Missing job_id or worker_id — use the link from your WhatsApp", type: "error" });
      return;
    }
    setAccepting(true);
    try {
      await acceptJob(jobId, workerId);
      setAccepted(true);
      setToast({ msg: "Job accepted! Head to the customer.", type: "success" });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : "Accept failed", type: "error" });
    } finally {
      setAccepting(false);
    }
  };

  const icon = CATEGORY_ICONS[job?.category ?? ""] ?? "🔨";

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-white/40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm shadow-sm">
              🔧
            </div>
            <p className="text-sm font-bold text-gray-800">Worker Portal</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 font-bold py-1.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-fade-in space-y-3">
            <div className="skeleton h-6 w-1/2 rounded-xl" />
            <div className="skeleton h-48 w-full rounded-3xl" />
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
        )}

        {/* No job_id in URL — welcome state */}
        {!loading && !jobId && (
          <div className="animate-slide-up">
            <div className="card rounded-3xl overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-4xl">
                  👋
                </div>
                <h2 className="font-black text-white text-xl mb-1">Welcome to Rozgar!</h2>
                <p className="text-white/70 text-sm">You're all set to receive job alerts</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-gray-500 text-sm mb-4 text-center leading-relaxed">
                  When a customer posts a job near you, you'll get a WhatsApp or SMS alert with a link. Tap it to see and accept the job.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "📲", text: "WhatsApp or SMS alert arrives" },
                    { icon: "🔗", text: "Tap the link to see job details" },
                    { icon: "✅", text: "Accept in one tap" },
                    { icon: "💰", text: "Get paid on site" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm text-gray-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job not found */}
        {!loading && jobId && !job && (
          <div className="animate-scale-in card rounded-3xl p-6 text-center border border-yellow-200">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-bold text-gray-800 mb-1">Job not found</p>
            <p className="font-mono text-xs text-gray-400 break-all">{jobId}</p>
          </div>
        )}

        {/* Job already taken by someone else */}
        {!loading && job && !accepted && job.status === "matched" && job.matched_worker_id !== workerId && (
          <div className="animate-scale-in card rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Job Already Taken</h2>
            <p className="text-gray-500 text-sm">Another worker accepted first. Stay tuned for the next one!</p>
          </div>
        )}

        {/* Job available */}
        {!loading && job && !accepted && job.status !== "matched" && job.status !== "completed" && (
          <div className="animate-slide-up space-y-4">
            {/* Job card */}
            <div className="card rounded-3xl overflow-hidden border border-gray-100">
              {/* Category header */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 border-b border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center text-2xl shadow-md">
                      {icon}
                    </div>
                    <div>
                      <h2 className="font-black text-gray-900 text-lg">{job.category}</h2>
                      <p className="text-gray-400 text-xs font-mono">PIN: {job.pin_code}</p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </div>

              {/* Photo */}
              {job.photo_url && (
                <div className="relative">
                  <img src={job.photo_url} alt="Job" className="w-full object-cover max-h-56" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              {/* Details */}
              <div className="px-5 py-4 space-y-3">
                {job.scope && (
                  <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1">What needs doing</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{job.scope}</p>
                  </div>
                )}

                {(job.price_min != null && job.price_max != null) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl px-4 py-3 flex items-center justify-between border border-green-100">
                    <div>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">You earn</p>
                      <p className="font-black text-xl text-gray-900">
                        ₹{job.price_min.toLocaleString("en-IN")}
                        <span className="text-gray-400 font-medium text-base"> – </span>
                        ₹{job.price_max.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-3xl">💰</span>
                  </div>
                )}

                {job.complexity && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Difficulty</span>
                    <StatusBadge status={job.complexity} />
                  </div>
                )}
              </div>
            </div>

            {!workerId && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-amber-500 text-xl">⚠️</span>
                <p className="text-amber-700 text-sm">
                  Missing <code className="bg-amber-100 px-1.5 py-0.5 rounded-lg font-mono text-xs">worker_id</code> — use the link from your WhatsApp or SMS message.
                </p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting || !workerId}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl py-4 font-bold text-base min-h-[52px] disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-97 transition-all"
            >
              {accepting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Accepting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✅</span> Accept This Job
                </span>
              )}
            </button>
          </div>
        )}

        {/* Accepted */}
        {accepted && (
          <div className="animate-bounce-in text-center py-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-xl">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-black text-green-700 mb-2">Job Accepted!</h2>
            <p className="text-gray-500 text-sm mb-6">Head to the customer's location. They will call you.</p>
            <div className="card rounded-3xl border border-green-100 p-4 text-left">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1">Job Reference</p>
              <p className="font-mono text-xs text-gray-600 break-all">{jobId}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    }>
      <WorkerContent />
    </Suspense>
  );
}
