"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import {
  analyseImage,
  createJob,
  broadcastJob,
  completeJob,
  type AIAnalysisResult,
  type Job,
} from "@/lib/api";
import { createClient } from "@/lib/supabase";

const CATEGORIES = [
  { name: "Electrician", icon: "⚡", desc: "Wiring, fuses, fixtures" },
  { name: "Plumber",     icon: "🔧", desc: "Pipes, taps, drains" },
  { name: "Carpenter",   icon: "🪚", desc: "Doors, furniture, wood" },
  { name: "Painter",     icon: "🎨", desc: "Walls, rooms, touch-ups" },
];

type Step = "category" | "photo" | "analyse" | "pincode" | "polling" | "matched" | "completed";

export default function CustomerDashboard() {
  const router  = useRouter();
  const supabase = createClient();

  const [step,         setStep]         = useState<Step>("category");
  const [category,     setCategory]     = useState("");
  const [photo,        setPhoto]        = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [aiResult,     setAiResult]     = useState<AIAnalysisResult | null>(null);
  const [pinCode,      setPinCode]      = useState("");
  const [job,          setJob]          = useState<Job | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState<{msg:string; type:"success"|"error"|"info"} | null>(null);
  const [waitSeconds,  setWaitSeconds]  = useState(0);
  const [completing,   setCompleting]   = useState(false);

  const fileRef     = useRef<HTMLInputElement>(null);
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    channelRef.current && supabase.removeChannel(channelRef.current);
    timerRef.current  && clearInterval(timerRef.current);
    pollRef.current   && clearInterval(pollRef.current);
  }, [supabase]);

  const showToast = (msg: string, type: "success"|"error"|"info") => setToast({ msg, type });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setStep("analyse");
  };

  const handleAnalyse = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const r = await analyseImage(photo, category);
      setAiResult(r);
      setStep("pincode");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Analysis failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToJob = useCallback((jobId: string) => {
    // Primary: Supabase Realtime
    const ch = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const updated = payload.new as Job;
          setJob(prev => ({ ...(prev ?? {}), ...updated } as Job));
          if (updated.status === "matched") {
            timerRef.current && clearInterval(timerRef.current);
            setStep("matched");
          }
        }
      )
      .subscribe();
    channelRef.current = ch;

    // Fallback: poll every 5s in case realtime isn't enabled
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${jobId}`
        );
        const d = await r.json();
        if (d.success && d.data) {
          setJob(d.data);
          if (d.data.status === "matched") {
            timerRef.current && clearInterval(timerRef.current);
            pollRef.current  && clearInterval(pollRef.current);
            setStep("matched");
          }
        }
      } catch { /* silently retry */ }
    }, 5000);
  }, [supabase]);

  const handleBroadcast = async () => {
    if (!photo || pinCode.length !== 6) return;
    setLoading(true);
    try {
      const created = await createJob(category, pinCode, photo);
      const jobId   = created.data.id;
      setJob(created.data);

      const bcast = await broadcastJob(jobId);
      if (bcast.data.notified_count === 0) {
        showToast(`No workers found in ${pinCode} right now. We'll keep looking.`, "info");
      } else {
        showToast(`Notified ${bcast.data.notified_count} worker${bcast.data.notified_count > 1 ? "s" : ""}!`, "success");
      }

      setStep("polling");
      setWaitSeconds(0);
      timerRef.current = setInterval(() => setWaitSeconds(s => s + 1), 1000);
      subscribeToJob(jobId);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Broadcast failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!job) return;
    setCompleting(true);
    try {
      await completeJob(job.id);
      setStep("completed");
      showToast("Job marked complete!", "success");
      channelRef.current && supabase.removeChannel(channelRef.current);
      pollRef.current    && clearInterval(pollRef.current);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not complete", "error");
    } finally {
      setCompleting(false);
    }
  };

  const restart = () => {
    channelRef.current && supabase.removeChannel(channelRef.current);
    timerRef.current   && clearInterval(timerRef.current);
    pollRef.current    && clearInterval(pollRef.current);
    setStep("category"); setCategory(""); setPhoto(null); setPreview(null);
    setAiResult(null);   setPinCode("");  setJob(null);   setWaitSeconds(0);
  };

  const fmt = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <div className="min-h-screen bg-white">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 max-w-lg mx-auto">
        <div>
          <span className="text-sm font-bold text-gray-800">👤 Customer</span>
          {step !== "category" && (
            <span className="text-xs text-gray-400 ml-2">
              {["category","photo","analyse","pincode","polling","matched","completed"].indexOf(step) + 1}/7
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 font-semibold py-1 px-3 rounded-lg border border-red-200 min-h-[36px]">
          Logout
        </button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* ── STEP 1: category ─────────────────────────────── */}
        {step === "category" && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">What do you need?</h2>
            <p className="text-gray-500 text-sm mb-5">Pick a category to get started</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ name, icon, desc }) => (
                <button
                  key={name}
                  onClick={() => { setCategory(name); setStep("photo"); }}
                  className="flex flex-col items-center gap-2 rounded-2xl p-5 min-h-[110px] border-2 border-gray-200 bg-white font-semibold text-gray-700 hover:border-[#FF6B00] active:scale-95 transition-all text-left"
                >
                  <span className="text-4xl">{icon}</span>
                  <div>
                    <p className="text-sm font-bold">{name}</p>
                    <p className="text-xs text-gray-400 font-normal">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: photo ────────────────────────────────── */}
        {step === "photo" && (
          <div>
            <button onClick={() => setStep("category")} className="text-[#FF6B00] text-sm mb-4 flex items-center gap-1">← Back</button>
            <h2 className="text-xl font-bold mb-1">Take a photo</h2>
            <p className="text-gray-500 text-sm mb-5">
              Category: <span className="font-semibold text-gray-700">{category}</span>
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[#FF6B00] rounded-2xl p-10 flex flex-col items-center gap-3 text-[#FF6B00] bg-orange-50 active:bg-orange-100"
            >
              <span className="text-6xl">📷</span>
              <span className="font-semibold text-base">Tap to take photo or upload</span>
              <span className="text-xs text-gray-400">JPG / PNG · max 10 MB</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          </div>
        )}

        {/* ── STEP 3: analyse ──────────────────────────────── */}
        {step === "analyse" && (
          <div>
            <button onClick={() => setStep("photo")} className="text-[#FF6B00] text-sm mb-4 flex items-center gap-1">← Back</button>
            <h2 className="text-xl font-bold mb-4">Review your photo</h2>
            {preview && <img src={preview} alt="Problem" className="w-full rounded-2xl mb-5 object-cover max-h-72" />}
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="w-full bg-[#FF6B00] text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-[#CC5500]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Analysing with AI…</span>
                : "🔍 Analyse with AI"}
            </button>
          </div>
        )}

        {/* ── STEP 4: pincode ──────────────────────────────── */}
        {step === "pincode" && aiResult && (
          <div>
            <h2 className="text-xl font-bold mb-4">AI Estimate</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
              <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                <span className="font-semibold">Scope: </span>{aiResult.scope}
              </p>
              <p className="text-gray-700 mb-3 text-sm">
                <span className="font-semibold">Price estimate: </span>
                ₹{aiResult.price_min.toLocaleString("en-IN")} – ₹{aiResult.price_max.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">Complexity:</span>
                <StatusBadge status={aiResult.complexity} />
              </div>
            </div>
            <label className="block font-bold mb-2 text-gray-800">Your area pin code</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="560001"
              value={pinCode}
              onChange={e => setPinCode(e.target.value.replace(/\D/g,"").slice(0,6))}
              className="w-full border-2 border-gray-300 rounded-2xl px-4 py-3 text-2xl tracking-widest mb-5 focus:border-[#FF6B00] outline-none"
            />
            <button
              onClick={handleBroadcast}
              disabled={loading || pinCode.length !== 6}
              className="w-full bg-[#FF6B00] text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-[#CC5500]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Broadcasting…</span>
                : "📡 Broadcast Job"}
            </button>
          </div>
        )}

        {/* ── STEP 5: polling ──────────────────────────────── */}
        {step === "polling" && (
          <div className="text-center py-12">
            <div className="text-7xl mb-5 animate-pulse">📡</div>
            <h2 className="text-xl font-bold mb-2">Finding a {category}…</h2>
            <p className="text-gray-500 text-sm mb-1">
              Notifying workers in <span className="font-mono font-semibold">{pinCode}</span>
            </p>
            <p className="text-gray-400 text-xs mb-6">Waiting: {fmt(waitSeconds)}</p>
            {job && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left mb-4">
                <p className="text-xs text-gray-500 mb-1">Job ID (share with admin for testing)</p>
                <p className="font-mono text-xs text-gray-700 break-all">{job.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            )}
            <button onClick={restart} className="text-sm text-gray-400 underline underline-offset-2">
              Cancel and start over
            </button>
          </div>
        )}

        {/* ── STEP 6: matched ──────────────────────────────── */}
        {step === "matched" && job?.matched_worker && (
          <div className="text-center py-8">
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-700 mb-1">Worker Found!</h2>
            <p className="text-gray-500 text-sm mb-6">A {category} is on the way</p>

            {/* Worker card */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white text-xl font-bold">
                  {job.matched_worker.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-800">{job.matched_worker.name}</p>
                  <p className="text-gray-500 text-sm capitalize">{job.matched_worker.language} speaker</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{job.matched_worker.phone}</p>
            </div>

            <a
              href={`tel:${job.matched_worker.phone}`}
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] active:bg-green-700 mb-3"
            >
              📞 Call Worker
            </a>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full border-2 border-gray-200 text-gray-600 rounded-2xl py-3 font-semibold text-base min-h-[48px] disabled:opacity-60"
            >
              {completing
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span></span>
                : "✅ Mark Job as Complete"}
            </button>
          </div>
        )}

        {/* ── STEP 7: completed ────────────────────────────── */}
        {step === "completed" && (
          <div className="text-center py-10">
            <div className="text-7xl mb-5">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Job Done!</h2>
            <p className="text-gray-500 text-sm mb-8">
              Thank you for using Rozgar.
            </p>
            <button
              onClick={restart}
              className="w-full bg-[#FF6B00] text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] active:bg-[#CC5500]"
            >
              📋 Post Another Job
            </button>
          </div>
        )}

      </div>
    </div>
  );
}