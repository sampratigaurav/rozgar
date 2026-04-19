"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { partnerAccept, getAdminStatus, type AdminStatus } from "@/lib/api";
import { createClient } from "@/lib/supabase";

interface ToastState { message: string; type: "success" | "error" | "info"; }
interface ModalState  { jobId: string; workerId: string; partnerId: string; }
interface AcceptResult { commission: number; }

function StatCard({ label, value, icon, accent, bg }: { label: string; value: number; icon: string; accent: string; bg: string }) {
  return (
    <div className={`card rounded-3xl p-4 border ${bg} text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-3xl font-black ${accent}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1 font-medium">{label}</p>
    </div>
  );
}

export default function PartnerDashboard() {
  const router   = useRouter();
  const supabase = createClient();

  const [status,        setStatus]        = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [toast,         setToast]         = useState<ToastState | null>(null);
  const [modal,         setModal]         = useState<ModalState | null>(null);
  const [accepting,     setAccepting]     = useState(false);
  const [result,        setResult]        = useState<AcceptResult | null>(null);
  const [manualJobId,   setManualJobId]   = useState("");

  const showToast = (message: string, type: ToastState["type"]) => setToast({ message, type });

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getAdminStatus();
      setStatus(res.data);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to fetch status", "error");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const openModal = () => {
    if (!manualJobId.trim()) { showToast("Enter a Job ID first", "error"); return; }
    setModal({ jobId: manualJobId.trim(), workerId: "", partnerId: "" });
    setResult(null);
  };

  const handleAccept = async () => {
    if (!modal) return;
    if (!modal.workerId.trim() || !modal.partnerId.trim()) {
      showToast("Worker ID and Partner ID are required", "error");
      return;
    }
    setAccepting(true);
    try {
      const res = await partnerAccept(modal.jobId, modal.workerId, modal.partnerId);
      setResult({ commission: res.data.commission });
      showToast(`Job accepted! ₹${res.data.commission} commission credited.`, "success");
      fetchStatus();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Accept failed", "error");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-white/40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-sm shadow-sm">
              🏪
            </div>
            <p className="text-sm font-bold text-gray-800">Partner Dashboard</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 font-bold py-1.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {/* Earnings Banner */}
        <div className="card rounded-3xl overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-5">
            <p className="text-white/70 text-sm font-medium">Your Earnings</p>
            <p className="text-white font-black text-3xl mt-0.5">₹15 <span className="text-base font-medium opacity-70">per job placed</span></p>
          </div>
          <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-100">
            <p className="text-emerald-700 text-xs font-medium">Accept jobs near you and earn commission instantly</p>
          </div>
        </div>

        {/* Live stats */}
        <div className="animate-slide-up delay-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Status</p>
            {!statusLoading && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">Updates every 5s</span>
              </div>
            )}
          </div>

          {statusLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-3xl" />)}
            </div>
          ) : status ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Pending Jobs"       value={status.pending_jobs}       icon="⏳" accent="text-[#FF6B00]"  bg="border-orange-100" />
              <StatCard label="Available Workers"  value={status.available_workers}  icon="✅" accent="text-green-600" bg="border-green-100" />
              <StatCard label="Total Workers"      value={status.total_workers}      icon="👷" accent="text-blue-600"  bg="border-blue-100" />
              <StatCard label="Total Jobs"         value={status.total_jobs}         icon="📋" accent="text-gray-700"  bg="border-gray-100" />
            </div>
          ) : (
            <div className="card rounded-3xl p-4 text-center text-gray-400 text-sm">Could not load status</div>
          )}
        </div>

        {/* Accept form */}
        <div className="card rounded-3xl p-5 animate-slide-up delay-200">
          <h2 className="font-black text-gray-900 mb-1">Accept on Behalf</h2>
          <p className="text-gray-400 text-xs mb-4">Help a nearby worker accept a job and earn your commission</p>

          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Job ID</label>
          <input
            type="text"
            placeholder="Paste job ID here"
            value={manualJobId}
            onChange={(e) => setManualJobId(e.target.value)}
            className="input-field mb-4"
          />
          <button onClick={openModal} className="btn-primary w-full py-3.5 text-sm min-h-[52px]">
            <span className="flex items-center justify-center gap-2">
              <span>🏪</span> Accept on Behalf of Worker
            </span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 text-lg">Enter Details</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all text-sm font-bold">×</button>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-2 mb-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Job ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{modal.jobId}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Worker ID</label>
                <input
                  type="text"
                  placeholder="Worker's UUID"
                  value={modal.workerId}
                  onChange={(e) => setModal(m => m && { ...m, workerId: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Partner ID (Your ID)</label>
                <input
                  type="text"
                  placeholder="Your partner UUID"
                  value={modal.partnerId}
                  onChange={(e) => setModal(m => m && { ...m, partnerId: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {result ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-green-700 font-black text-2xl">₹{result.commission} Credited!</p>
                <p className="text-green-600 text-sm mt-1">Job matched successfully.</p>
              </div>
            ) : (
              <button onClick={handleAccept} disabled={accepting} className="btn-primary w-full py-3.5 text-sm min-h-[52px] mb-3">
                {accepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : "✅ Confirm Accept"}
              </button>
            )}

            <button onClick={() => setModal(null)} className="btn-ghost w-full py-3 text-sm min-h-[44px]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
