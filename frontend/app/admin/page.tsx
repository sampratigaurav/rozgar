"use client";

import { useState, useCallback } from "react";
import Toast from "@/components/Toast";
import {
  seedWorkers,
  resetDemo,
  broadcastJob,
  acceptJob,
  partnerAccept,
  getAdminStatus,
  type AdminStatus,
} from "@/lib/api";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface LoadingMap {
  seed: boolean;
  reset: boolean;
  broadcast: boolean;
  workerAccept: boolean;
  partnerAccept: boolean;
  status: boolean;
}

export default function AdminPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState<LoadingMap>({
    seed: false,
    reset: false,
    broadcast: false,
    workerAccept: false,
    partnerAccept: false,
    status: false,
  });
  const [status, setStatus] = useState<AdminStatus | null>(null);

  // Input fields
  const [broadcastJobId, setBroadcastJobId] = useState("");
  const [acceptJobId, setAcceptJobId] = useState("");
  const [acceptWorkerId, setAcceptWorkerId] = useState("");
  const [partnerJobId, setPartnerJobId] = useState("");
  const [partnerWorkerId, setPartnerWorkerId] = useState("");
  const [partnerPartnerId, setPartnerPartnerId] = useState("");

  const setL = (key: keyof LoadingMap, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const showToast = (message: string, type: ToastState["type"]) =>
    setToast({ message, type });

  const handleSeed = async () => {
    setL("seed", true);
    try {
      const res = await seedWorkers();
      showToast(res.data, "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Seed failed", "error");
    } finally {
      setL("seed", false);
    }
  };

  const handleReset = async () => {
    setL("reset", true);
    try {
      const res = await resetDemo();
      showToast(res.data, "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Reset failed", "error");
    } finally {
      setL("reset", false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastJobId.trim()) {
      showToast("Enter a Job ID", "error");
      return;
    }
    setL("broadcast", true);
    try {
      const res = await broadcastJob(broadcastJobId.trim());
      showToast(
        `Broadcasted! ${res.data.notified_count} worker(s) notified.`,
        "success"
      );
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Broadcast failed", "error");
    } finally {
      setL("broadcast", false);
    }
  };

  const handleWorkerAccept = async () => {
    if (!acceptJobId.trim() || !acceptWorkerId.trim()) {
      showToast("Enter both Job ID and Worker ID", "error");
      return;
    }
    setL("workerAccept", true);
    try {
      await acceptJob(acceptJobId.trim(), acceptWorkerId.trim());
      showToast("Job accepted by worker!", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Worker accept failed", "error");
    } finally {
      setL("workerAccept", false);
    }
  };

  const handlePartnerAccept = async () => {
    if (!partnerJobId.trim() || !partnerWorkerId.trim() || !partnerPartnerId.trim()) {
      showToast("All three IDs are required", "error");
      return;
    }
    setL("partnerAccept", true);
    try {
      const res = await partnerAccept(
        partnerJobId.trim(),
        partnerWorkerId.trim(),
        partnerPartnerId.trim()
      );
      showToast(
        `Accepted! ₹${res.data.commission} commission credited.`,
        "success"
      );
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : "Partner accept failed",
        "error"
      );
    } finally {
      setL("partnerAccept", false);
    }
  };

  const handleStatus = useCallback(async () => {
    setL("status", true);
    try {
      const res = await getAdminStatus();
      setStatus(res.data);
      showToast("Status refreshed", "info");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Status fetch failed", "error");
    } finally {
      setL("status", false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-lg mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-[#FF6B00] mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Demo controls for Rozgar</p>

      {/* Seed Workers */}
      <Section title="🌱 Seed Workers">
        <p className="text-gray-500 text-sm mb-3">
          Inserts 3 demo workers into pin code 560001 (Raju, Suresh, Mohan).
        </p>
        <ActionButton onClick={handleSeed} loading={loading.seed}>
          🌱 Seed Workers
        </ActionButton>
      </Section>

      {/* Broadcast Job */}
      <Section title="📡 Broadcast Job">
        <Input
          label="Job ID"
          value={broadcastJobId}
          onChange={setBroadcastJobId}
          placeholder="UUID of the job"
        />
        <ActionButton onClick={handleBroadcast} loading={loading.broadcast}>
          📡 Broadcast
        </ActionButton>
      </Section>

      {/* Simulate Worker Accept */}
      <Section title="✅ Simulate Worker Accept">
        <Input
          label="Job ID"
          value={acceptJobId}
          onChange={setAcceptJobId}
          placeholder="Job UUID"
        />
        <Input
          label="Worker ID"
          value={acceptWorkerId}
          onChange={setAcceptWorkerId}
          placeholder="Worker UUID"
        />
        <ActionButton onClick={handleWorkerAccept} loading={loading.workerAccept}>
          ✅ Accept as Worker
        </ActionButton>
      </Section>

      {/* Simulate Partner Accept */}
      <Section title="🏪 Simulate Partner Accept">
        <Input
          label="Job ID"
          value={partnerJobId}
          onChange={setPartnerJobId}
          placeholder="Job UUID"
        />
        <Input
          label="Worker ID"
          value={partnerWorkerId}
          onChange={setPartnerWorkerId}
          placeholder="Worker UUID"
        />
        <Input
          label="Partner ID"
          value={partnerPartnerId}
          onChange={setPartnerPartnerId}
          placeholder="Partner UUID"
        />
        <ActionButton onClick={handlePartnerAccept} loading={loading.partnerAccept}>
          🏪 Accept as Partner
        </ActionButton>
      </Section>

      {/* Reset Demo */}
      <Section title="🔄 Reset Demo">
        <p className="text-gray-500 text-sm mb-3">
          Restores all workers to available and removes pending/broadcast jobs.
        </p>
        <ActionButton
          onClick={handleReset}
          loading={loading.reset}
          variant="danger"
        >
          🔄 Reset Demo
        </ActionButton>
      </Section>

      {/* Status */}
      <Section title="📊 System Status">
        <ActionButton onClick={handleStatus} loading={loading.status} variant="outline">
          📊 Refresh Status
        </ActionButton>
        {status && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatusCard label="Total Workers" value={status.total_workers} />
            <StatusCard
              label="Available Workers"
              value={status.available_workers}
              accent="text-green-600"
            />
            <StatusCard label="Total Jobs" value={status.total_jobs} />
            <StatusCard
              label="Pending Jobs"
              value={status.pending_jobs}
              accent="text-[#FF6B00]"
            />
            <StatusCard
              label="Partners"
              value={status.partners}
              accent="text-blue-600"
            />
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
      <h2 className="font-bold text-gray-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none"
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  loading,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  variant?: "primary" | "danger" | "outline";
}) {
  const base =
    "w-full rounded-xl py-3 font-bold text-base min-h-[48px] disabled:opacity-60 transition-colors";
  const styles = {
    primary: `${base} bg-[#FF6B00] text-white active:bg-[#CC5500]`,
    danger: `${base} bg-red-600 text-white active:bg-red-700`,
    outline: `${base} border-2 border-[#FF6B00] text-[#FF6B00] bg-white`,
  };

  return (
    <button onClick={onClick} disabled={loading} className={styles[variant]}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span> Loading…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function StatusCard({
  label,
  value,
  accent = "text-gray-800",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}
