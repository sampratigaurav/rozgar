"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import { getJob, acceptJob, type Job } from "@/lib/api";
import { createClient } from "@/lib/supabase";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

function WorkerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const jobId = searchParams.get("job_id") ?? "";
  const workerId = searchParams.get("worker_id") ?? "";

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    getJob(jobId)
      .then((res) => setJob(res.data))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load job";
        setToast({ message: msg, type: "error" });
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleAccept = async () => {
    if (!jobId || !workerId) {
      setToast({ message: "Missing job_id or worker_id in URL", type: "error" });
      return;
    }
    setAccepting(true);
    try {
      await acceptJob(jobId, workerId);
      setAccepted(true);
      setToast({ message: "Job accepted successfully!", type: "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to accept job";
      setToast({ message: msg, type: "error" });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Dashboard header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <p className="text-sm font-semibold text-gray-700">🔧 Worker</p>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 font-semibold py-1 px-3 rounded-lg border border-red-200 min-h-[36px]"
        >
          Logout
        </button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#FF6B00] mb-6">
          New Job Available
        </h1>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl animate-pulse mb-4">⏳</span>
            <p>Loading job details…</p>
          </div>
        )}

        {!loading && !jobId && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">👋</p>
            <p className="font-semibold text-gray-700 mb-1">
              Welcome, Worker!
            </p>
            <p className="text-gray-500 text-sm">
              Job notifications will arrive via WhatsApp or SMS. When you
              receive a job link, open it here to accept.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Add{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">
                ?job_id=...&worker_id=...
              </span>{" "}
              to the URL to load a specific job.
            </p>
          </div>
        )}

        {!loading && jobId && !job && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
            <p className="text-yellow-700 font-semibold">Job not found</p>
            <p className="text-yellow-600 text-sm mt-1">ID: {jobId}</p>
          </div>
        )}

        {!loading && job && !accepted && (
          <>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-gray-800">
                  {job.category}
                </h2>
                <StatusBadge status={job.status} />
              </div>
              {job.scope && (
                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-semibold">Scope:</span> {job.scope}
                </p>
              )}
              {(job.price_min || job.price_max) && (
                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-semibold">Price:</span> ₹{job.price_min}{" "}
                  – ₹{job.price_max}
                </p>
              )}
              {job.complexity && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">
                    Complexity:
                  </span>
                  <StatusBadge status={job.complexity} />
                </div>
              )}
              <p className="text-gray-500 text-xs mt-3">
                Pin code:{" "}
                <span className="font-mono font-semibold">{job.pin_code}</span>
              </p>
            </div>

            {!workerId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <p className="text-yellow-700 text-sm">
                  No <span className="font-mono">worker_id</span> in URL —
                  cannot accept.
                </p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting || !workerId}
              className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-green-700"
            >
              {accepting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Accepting…
                </span>
              ) : (
                "✅ Accept Job"
              )}
            </button>
          </>
        )}

        {accepted && (
          <div className="text-center py-10">
            <div className="text-7xl mb-5">🎉</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">
              Job Accepted!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Head to the customer's location. They will call you shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Job ID</p>
              <p className="font-mono text-xs break-all text-gray-700">
                {jobId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-gray-400">
          <span className="text-5xl animate-pulse">⏳</span>
        </div>
      }
    >
      <WorkerContent />
    </Suspense>
  );
}
