"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import { getJob, acceptJob, type Job } from "@/lib/api";
import { createClient } from "@/lib/supabase";

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
  const [toast, setToast] = useState<{msg:string;type:"success"|"error"|"info"}|null>(null);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    getJob(jobId)
      .then(r => {
        setJob(r.data);
        // If this worker already accepted
        if (r.data.status === "matched" && r.data.matched_worker_id === workerId) {
          setAccepted(true);
        }
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

  return (
    <div className="min-h-screen bg-white">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <p className="text-sm font-semibold text-gray-700">🔧 Worker</p>
        <button onClick={handleLogout} className="text-sm text-red-500 font-semibold py-1 px-3 rounded-lg border border-red-200 min-h-[36px]">Logout</button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#FF6B00] mb-6">Job Details</h1>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl animate-pulse mb-4">⏳</span>
            <p>Loading job…</p>
          </div>
        )}

        {/* No job_id in URL */}
        {!loading && !jobId && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <p className="font-bold text-gray-800 mb-2">Welcome to Rozgar! 👋</p>
            <p className="text-gray-500 text-sm mb-4">
              When a customer posts a job near you, you&apos;ll get a WhatsApp or SMS
              message with a link. Tap that link to see the job and accept it here.
            </p>
            <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-2">
              {["📱 You receive WhatsApp/SMS alert", "🔗 Tap the job link", "✅ Accept to get the work", "💰 Get paid on site"].map(s => (
                <p key={s} className="text-sm text-gray-600">{s}</p>
              ))}
            </div>
          </div>
        )}

        {/* Job not found */}
        {!loading && jobId && !job && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
            <p className="text-yellow-700 font-semibold">Job not found</p>
            <p className="font-mono text-xs text-yellow-600 mt-1 break-all">{jobId}</p>
          </div>
        )}

        {/* Job already taken by someone else */}
        {!loading && job && !accepted && job.status === "matched" && job.matched_worker_id !== workerId && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">Job Already Taken</h2>
            <p className="text-gray-500 text-sm">
              Another worker accepted this job first. Keep an eye out for the next one!
            </p>
          </div>
        )}

        {/* Job available to accept */}
        {!loading && job && !accepted && job.status !== "matched" && job.status !== "completed" && (
          <>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-gray-800">{job.category}</h2>
                <StatusBadge status={job.status} />
              </div>

              {job.photo_url && (
                <img src={job.photo_url} alt="Job" className="w-full rounded-xl mb-4 object-cover max-h-52" />
              )}

              {job.scope && (
                <div className="bg-white rounded-xl border border-orange-100 p-3 mb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">What needs doing</p>
                  <p className="text-gray-700 text-sm">{job.scope}</p>
                </div>
              )}

              {(job.price_min != null && job.price_max != null) && (
                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-semibold">You earn: </span>
                  ₹{job.price_min.toLocaleString("en-IN")} – ₹{job.price_max.toLocaleString("en-IN")}
                </p>
              )}

              {job.complexity && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">Difficulty:</span>
                  <StatusBadge status={job.complexity} />
                </div>
              )}

              <p className="text-gray-400 text-xs mt-3">
                Area: <span className="font-mono font-semibold">{job.pin_code}</span>
              </p>
            </div>

            {!workerId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <p className="text-yellow-700 text-sm">
                  Missing <code className="bg-yellow-100 px-1 rounded">worker_id</code> — use the link from your WhatsApp or SMS.
                </p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting || !workerId}
              className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-green-700"
            >
              {accepting
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Accepting…</span>
                : "✅ Accept This Job"}
            </button>
          </>
        )}

        {/* Accepted */}
        {accepted && (
          <div className="text-center py-10">
            <div className="text-7xl mb-5">🎉</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Job Accepted!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Head to the customer&apos;s location. They will call you.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Job reference</p>
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
        <span className="text-5xl animate-pulse">⏳</span>
      </div>
    }>
      <WorkerContent />
    </Suspense>
  );
}