"use client";

import { useState, useEffect, useCallback } from "react";
import Toast from "@/components/Toast";
import { partnerAccept, getAdminStatus, type AdminStatus } from "@/lib/api";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface ModalState {
  jobId: string;
  workerId: string;
  partnerId: string;
}

interface AcceptResult {
  commission: number;
}

export default function PartnerPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState<AcceptResult | null>(null);

  // Manual job input for partner to enter job details
  const [manualJobId, setManualJobId] = useState("");

  const showToast = (message: string, type: ToastState["type"]) =>
    setToast({ message, type });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getAdminStatus();
      setStatus(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch status";
      showToast(msg, "error");
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
    if (!manualJobId.trim()) {
      showToast("Enter a Job ID first", "error");
      return;
    }
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
      const msg = e instanceof Error ? e.message : "Accept failed";
      showToast(msg, "error");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-lg mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-[#FF6B00] mb-1">
        Partner Dashboard
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Accept jobs on behalf of workers and earn ₹15 commission per job.
      </p>

      {/* Live Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statusLoading ? (
          <div className="col-span-2 text-center py-6 text-gray-400 animate-pulse">
            Loading status…
          </div>
        ) : status ? (
          <>
            <StatCard
              label="Pending Jobs"
              value={status.pending_jobs}
              accent="text-[#FF6B00]"
            />
            <StatCard
              label="Total Workers"
              value={status.total_workers}
              accent="text-blue-600"
            />
            <StatCard
              label="Available Workers"
              value={status.available_workers}
              accent="text-green-600"
            />
            <StatCard
              label="Total Jobs"
              value={status.total_jobs}
              accent="text-gray-700"
            />
          </>
        ) : (
          <div className="col-span-2 text-center py-4 text-gray-400">
            Could not load status
          </div>
        )}
      </div>

      {/* Accept on behalf of worker */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">
          Accept Job on Behalf of Worker
        </h2>

        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          Job ID
        </label>
        <input
          type="text"
          placeholder="Paste job ID"
          value={manualJobId}
          onChange={(e) => setManualJobId(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:border-[#FF6B00] outline-none"
        />

        <button
          onClick={openModal}
          className="w-full bg-[#FF6B00] text-white rounded-xl py-3 font-bold text-base min-h-[48px] active:bg-[#CC5500]"
        >
          🏪 Accept on Behalf of Worker
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-lg mb-4">Enter Details</h3>

            <p className="text-xs text-gray-500 mb-3">
              Job ID:{" "}
              <span className="font-mono text-gray-700">{modal.jobId}</span>
            </p>

            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Worker ID
            </label>
            <input
              type="text"
              placeholder="Worker's UUID"
              value={modal.workerId}
              onChange={(e) =>
                setModal((m) => m && { ...m, workerId: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:border-[#FF6B00] outline-none"
            />

            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Partner ID (your ID)
            </label>
            <input
              type="text"
              placeholder="Your partner UUID"
              value={modal.partnerId}
              onChange={(e) =>
                setModal((m) => m && { ...m, partnerId: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm mb-5 focus:border-[#FF6B00] outline-none"
            />

            {result ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
                <p className="text-green-700 font-bold text-lg">
                  ₹{result.commission} Commission Credited!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Job matched successfully.
                </p>
              </div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-[#FF6B00] text-white rounded-xl py-3 font-bold text-base min-h-[48px] mb-3 disabled:opacity-60"
              >
                {accepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Processing…
                  </span>
                ) : (
                  "✅ Confirm Accept"
                )}
              </button>
            )}

            <button
              onClick={() => setModal(null)}
              className="w-full border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-semibold text-base min-h-[48px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}
