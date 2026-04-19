"use client";

import { useState, useCallback, useEffect } from "react";
import Toast from "@/components/Toast";
import {
  seedWorkers, resetDemo, broadcastJob, acceptJob,
  partnerAccept, getAdminStatus, type AdminStatus,
} from "@/lib/api";

type LoadingKey = "seed"|"reset"|"broadcast"|"workerAccept"|"partnerAccept";

export default function AdminPage() {
  const [toast,   setToast]   = useState<{msg:string;type:"success"|"error"|"info"}|null>(null);
  const [loading, setLoading] = useState<Record<LoadingKey, boolean>>({
    seed: false, reset: false, broadcast: false, workerAccept: false, partnerAccept: false,
  });
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Input state
  const [broadcastId, setBroadcastId]   = useState("");
  const [acceptJob_,  setAcceptJob]     = useState("");
  const [acceptWorker, setAcceptWorker] = useState("");
  const [pJobId,   setPJobId]     = useState("");
  const [pWorkerId, setPWorkerId] = useState("");
  const [pPartnerId, setPPartnerId] = useState("00000000-0000-0000-0000-000000000001");

  const show = (msg: string, type: "success"|"error"|"info") => setToast({ msg, type });
  const setL = (k: LoadingKey, v: boolean) => setLoading(p => ({ ...p, [k]: v }));

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const r = await getAdminStatus();
      setStatus(r.data);
    } catch { /* ignore */ } finally {
      setStatusLoading(false);
    }
  }, []);

  // Auto-refresh every 8s
  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 8000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    show(`${label} copied`, "info");
  };

  const run = async (key: LoadingKey, fn: () => Promise<string>) => {
    setL(key, true);
    try {
      const msg = await fn();
      show(msg, "success");
      refreshStatus();
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setL(key, false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-lg mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <h1 className="text-2xl font-bold text-[#FF6B00] mb-1">Admin Panel</h1>
      <p className="text-gray-400 text-sm mb-6">Demo controls · status auto-refreshes every 8s</p>

      {/* Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">📊 Live Status</h2>
          <button onClick={refreshStatus} className="text-xs text-[#FF6B00] font-semibold">Refresh</button>
        </div>
        {statusLoading && !status
          ? <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
          : status ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Workers", status.total_workers, "text-gray-700"],
                ["Available", status.available_workers, "text-green-600"],
                ["Total Jobs", status.total_jobs, "text-gray-700"],
                ["Pending", status.pending_jobs, "text-[#FF6B00]"],
                ["Partners", status.partners, "text-blue-600"],
              ].map(([label, val, color]) => (
                <div key={String(label)} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{val}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">Could not load status</p>}
      </div>

      {/* 1. Seed */}
      <Step num={1} title="Seed Demo Workers">
        <p className="text-gray-500 text-sm mb-3">
          Adds Raju (Electrician), Suresh (Plumber), Mohan (Carpenter) to pin 560001.
        </p>
        <Btn loading={loading.seed} onClick={() => run("seed", async () => {
          const r = await seedWorkers(); return r.data;
        })}>🌱 Seed Workers</Btn>
      </Step>

      {/* 2. Get worker IDs */}
      <Step num={2} title="Get Worker IDs (for steps 3 & 4)">
        <p className="text-gray-500 text-sm mb-2">
          Run this in Supabase SQL Editor to get worker UUIDs:
        </p>
        <div
          className="bg-gray-100 rounded-xl p-3 font-mono text-xs text-gray-600 cursor-pointer select-all"
          onClick={() => copy("SELECT id, name, phone FROM workers ORDER BY created_at DESC LIMIT 10;", "SQL")}
        >
          SELECT id, name, phone FROM workers ORDER BY created_at DESC LIMIT 10;
          <span className="ml-2 text-gray-400 not-italic font-sans">(tap to copy)</span>
        </div>
      </Step>

      {/* 3. Broadcast */}
      <Step num={3} title="Broadcast Job">
        <p className="text-gray-500 text-sm mb-3">
          Paste the Job ID from the customer dashboard URL or the polling screen.
        </p>
        <Input label="Job ID" value={broadcastId} onChange={setBroadcastId} placeholder="UUID from customer flow" />
        <Btn loading={loading.broadcast} onClick={() => run("broadcast", async () => {
          if (!broadcastId.trim()) throw new Error("Enter a Job ID");
          const r = await broadcastJob(broadcastId.trim());
          return `Broadcasted! ${r.data.notified_count} worker(s) notified.`;
        })}>📡 Broadcast</Btn>
      </Step>

      {/* 4. Worker accept */}
      <Step num={4} title="Simulate Worker Accept">
        <Input label="Job ID"    value={acceptJob_}   onChange={setAcceptJob}    placeholder="Job UUID" />
        <Input label="Worker ID" value={acceptWorker} onChange={setAcceptWorker} placeholder="Worker UUID from step 2" />
        <Btn loading={loading.workerAccept} onClick={() => run("workerAccept", async () => {
          if (!acceptJob_.trim() || !acceptWorker.trim()) throw new Error("Both IDs required");
          await acceptJob(acceptJob_.trim(), acceptWorker.trim());
          return "Job accepted by worker! Customer should see match.";
        })}>✅ Accept as Worker</Btn>
      </Step>

      {/* 5. Partner accept */}
      <Step num={5} title="Simulate Partner Accept">
        <p className="text-gray-500 text-sm mb-3">Demo partner ID is pre-filled (seeded in schema).</p>
        <Input label="Job ID"    value={pJobId}    onChange={setPJobId}    placeholder="Job UUID" />
        <Input label="Worker ID" value={pWorkerId} onChange={setPWorkerId} placeholder="Worker UUID" />
        <Input label="Partner ID" value={pPartnerId} onChange={setPPartnerId} placeholder="Partner UUID" />
        <Btn loading={loading.partnerAccept} onClick={() => run("partnerAccept", async () => {
          if (!pJobId.trim() || !pWorkerId.trim() || !pPartnerId.trim()) throw new Error("All 3 IDs required");
          const r = await partnerAccept(pJobId.trim(), pWorkerId.trim(), pPartnerId.trim());
          return `Accepted! ₹${r.data.commission} commission credited to partner.`;
        })}>🏪 Accept as Partner</Btn>
      </Step>

      {/* 6. Reset */}
      <Step num={6} title="Reset Demo">
        <p className="text-gray-500 text-sm mb-3">
          Marks all workers available, removes pending/broadcast jobs.
        </p>
        <Btn loading={loading.reset} variant="danger" onClick={() => run("reset", async () => {
          const r = await resetDemo(); return r.data;
        })}>🔄 Reset</Btn>
      </Step>
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#FF6B00] outline-none"
      />
    </div>
  );
}

function Btn({ children, onClick, loading, variant = "primary" }: {
  children: React.ReactNode; onClick: () => void; loading: boolean; variant?: "primary"|"danger";
}) {
  return (
    <button
      onClick={onClick} disabled={loading}
      className={`w-full rounded-xl py-3 font-bold text-sm min-h-[44px] disabled:opacity-60 transition-colors
        ${variant === "danger" ? "bg-red-600 text-white active:bg-red-700" : "bg-[#FF6B00] text-white active:bg-[#CC5500]"}`}
    >
      {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Loading…</span> : children}
    </button>
  );
}