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
  { name: "Electrician", icon: "⚡", desc: "Wiring, fuses, fixtures", color: "from-yellow-400 to-orange-500", bg: "bg-yellow-50", border: "border-yellow-200" },
  { name: "Plumber",     icon: "🔧", desc: "Pipes, taps, drains",    color: "from-blue-400 to-cyan-500",   bg: "bg-blue-50",   border: "border-blue-200"   },
  { name: "Carpenter",   icon: "🪚", desc: "Doors, furniture, wood", color: "from-amber-500 to-orange-600", bg: "bg-amber-50", border: "border-amber-200" },
  { name: "Painter",     icon: "🎨", desc: "Walls, rooms, touch-ups", color: "from-pink-400 to-rose-500",  bg: "bg-pink-50",   border: "border-pink-200"   },
];

type Step = "category" | "photo" | "analyse" | "pincode" | "polling" | "matched" | "completed";

const STEPS: Step[] = ["category", "photo", "analyse", "pincode", "polling", "matched", "completed"];
const STEP_LABELS = ["Category", "Photo", "AI", "Area", "Finding", "Matched", "Done"];

export default function CustomerDashboard() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,        setStep]        = useState<Step>("category");
  const [category,    setCategory]    = useState("");
  const [photo,       setPhoto]       = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [aiResult,    setAiResult]    = useState<AIAnalysisResult | null>(null);
  const [pinCode,     setPinCode]     = useState("");
  const [job,         setJob]         = useState<Job | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [completing,  setCompleting]  = useState(false);

  const fileRef    = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    channelRef.current && supabase.removeChannel(channelRef.current);
    timerRef.current   && clearInterval(timerRef.current);
    pollRef.current    && clearInterval(pollRef.current);
  }, [supabase]);

  const showToast = (msg: string, type: "success" | "error" | "info") => setToast({ msg, type });

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
    const ch = supabase
      .channel(`job-${jobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, (payload) => {
        const updated = payload.new as Job;
        setJob(prev => ({ ...(prev ?? {}), ...updated } as Job));
        if (updated.status === "matched") {
          timerRef.current && clearInterval(timerRef.current);
          setStep("matched");
        }
      })
      .subscribe();
    channelRef.current = ch;

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${jobId}`);
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
    setAiResult(null);   setPinCode(""); setJob(null); setWaitSeconds(0);
  };

  const fmt = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const stepIndex = STEPS.indexOf(step);
  const catMeta = CATEGORIES.find(c => c.name === category);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Sticky Header ──────────────────────────────── */}
      <div className="sticky top-0 z-30 glass border-b border-white/40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center text-sm shadow-sm">
              🏠
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-tight">Customer</p>
              {step !== "category" && (
                <p className="text-[10px] text-gray-400 font-medium leading-tight">{STEP_LABELS[stepIndex]}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 font-bold py-1.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Progress bar */}
        {step !== "category" && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex items-center gap-1">
              {STEPS.slice(0, 6).map((s, i) => (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i < stepIndex ? "bg-[#FF6B00]" : i === stepIndex ? "bg-[#FF6B00]/60" : "bg-gray-200"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* ── STEP 1: category ──────────────────────────── */}
        {step === "category" && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">What do you need?</h2>
              <p className="text-gray-500 text-sm">Pick a category to get started</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ name, icon, desc, color, bg, border }, i) => (
                <button
                  key={name}
                  onClick={() => { setCategory(name); setStep("photo"); }}
                  className={`category-card flex flex-col gap-3 rounded-3xl p-5 min-h-[120px] border-2 ${border} ${bg} text-left overflow-hidden`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-md`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: photo ─────────────────────────────── */}
        {step === "photo" && (
          <div className="animate-slide-up">
            <button onClick={() => setStep("category")} className="flex items-center gap-1 text-[#FF6B00] text-sm font-semibold mb-6 hover:gap-2 transition-all">
              ← Back
            </button>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                {catMeta && (
                  <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${catMeta.color} flex items-center justify-center text-lg shadow-sm`}>
                    {catMeta.icon}
                  </span>
                )}
                <h2 className="text-2xl font-black text-gray-900">{category}</h2>
              </div>
              <p className="text-gray-500 text-sm">Take or upload a photo of the problem</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[#FF6B00]/40 rounded-3xl p-10 flex flex-col items-center gap-4 bg-gradient-to-br from-orange-50 to-amber-50 hover:border-[#FF6B00]/70 hover:shadow-md transition-all active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-glow animate-float">
                <span className="text-3xl">📷</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 text-base">Tap to take photo or upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG / PNG · max 10 MB</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          </div>
        )}

        {/* ── STEP 3: analyse ───────────────────────────── */}
        {step === "analyse" && (
          <div className="animate-slide-up">
            <button onClick={() => setStep("photo")} className="flex items-center gap-1 text-[#FF6B00] text-sm font-semibold mb-6 hover:gap-2 transition-all">
              ← Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Review photo</h2>
            <p className="text-gray-500 text-sm mb-5">AI will analyse this to estimate cost and scope</p>

            {preview && (
              <div className="relative rounded-3xl overflow-hidden mb-5 shadow-card">
                <img src={preview} alt="Problem" className="w-full object-cover max-h-72" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="btn-primary w-full py-4 text-base min-h-[52px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analysing with AI…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🤖</span> Analyse with AI
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 4: pincode ───────────────────────────── */}
        {step === "pincode" && aiResult && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-black text-gray-900 mb-5">AI Estimate</h2>

            {/* AI Result Card */}
            <div className="card rounded-3xl border border-orange-100 overflow-hidden mb-5">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <span className="font-bold text-gray-700 text-sm">AI Analysis Complete</span>
                  <span className="ml-auto">
                    <StatusBadge status={aiResult.complexity} />
                  </span>
                </div>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1">Scope of work</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{aiResult.scope}</p>
                </div>
                <div className="bg-gradient-to-r from-[#FFF3E8] to-[#FFE4C4] rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Estimated Price</p>
                    <p className="font-black text-xl text-gray-900 mt-0.5">
                      ₹{aiResult.price_min.toLocaleString("en-IN")}
                      <span className="text-gray-400 font-medium text-base"> – </span>
                      ₹{aiResult.price_max.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-3xl">💰</span>
                </div>
              </div>
            </div>

            {/* Pin Code Input */}
            <div className="card rounded-3xl p-5 mb-5">
              <label className="block font-bold text-gray-800 mb-1">Your area PIN code</label>
              <p className="text-gray-400 text-xs mb-3">We'll notify workers in your area</p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="560001"
                value={pinCode}
                onChange={e => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-3xl tracking-[0.4em] text-center font-bold focus:border-[#FF6B00] outline-none transition-all"
                style={{ boxShadow: pinCode.length === 6 ? '0 0 0 4px rgba(255,107,0,0.12)' : '' }}
              />
              {pinCode.length > 0 && pinCode.length < 6 && (
                <p className="text-center text-xs text-gray-400 mt-2">{6 - pinCode.length} more digits</p>
              )}
            </div>

            <button
              onClick={handleBroadcast}
              disabled={loading || pinCode.length !== 6}
              className="btn-primary w-full py-4 text-base min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Broadcasting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>📡</span> Broadcast Job
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 5: polling ───────────────────────────── */}
        {step === "polling" && (
          <div className="animate-fade-in text-center py-10">
            {/* Radar animation */}
            <div className="radar-container w-32 h-32 mx-auto mb-8">
              <div className="radar-ring" />
              <div className="radar-ring" />
              <div className="radar-ring" />
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-glow-strong">
                <span className="text-2xl">📡</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-2">Finding a {category}…</h2>
            <p className="text-gray-500 text-sm mb-1">
              Notifying workers in{" "}
              <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{pinCode}</span>
            </p>
            <p className="text-gray-400 text-xs mb-8 font-mono">Waiting: {fmt(waitSeconds)}</p>

            {job && (
              <div className="card rounded-3xl border border-gray-100 p-4 text-left mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Job Reference</p>
                  <StatusBadge status={job.status} />
                </div>
                <p className="font-mono text-xs text-gray-600 break-all">{job.id}</p>
              </div>
            )}

            <button onClick={restart} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
              Cancel and start over
            </button>
          </div>
        )}

        {/* ── STEP 6: matched ───────────────────────────── */}
        {step === "matched" && job?.matched_worker && (
          <div className="animate-bounce-in text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-black text-green-700 mb-1">Worker Found!</h2>
            <p className="text-gray-500 text-sm mb-6">A {category} is on the way to you</p>

            {/* Worker card */}
            <div className="card rounded-3xl border border-green-100 overflow-hidden mb-4 text-left">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                    {job.matched_worker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{job.matched_worker.name}</p>
                    <p className="text-gray-500 text-sm capitalize">{job.matched_worker.language} speaker</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-500 font-medium">{job.matched_worker.phone}</p>
              </div>
            </div>

            <a
              href={`tel:${job.matched_worker.phone}`}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl py-4 font-bold text-base min-h-[52px] mb-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-97"
            >
              <span>📞</span> Call Worker
            </a>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-ghost w-full py-3.5 font-bold text-sm min-h-[48px] disabled:opacity-50"
            >
              {completing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                  Completing…
                </span>
              ) : "✅ Mark Job as Complete"}
            </button>
          </div>
        )}

        {/* ── STEP 7: completed ─────────────────────────── */}
        {step === "completed" && (
          <div className="animate-bounce-in text-center py-10">
            {/* Celebration */}
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-glow-strong mx-auto">
                <span className="text-5xl">🎉</span>
              </div>
              {/* Floating dots */}
              {["bg-yellow-400", "bg-blue-400", "bg-green-400", "bg-pink-400", "bg-purple-400"].map((c, i) => (
                <div
                  key={i}
                  className={`confetti-dot w-3 h-3 ${c}`}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: "0%",
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-2">Job Complete! 🙌</h2>
            <p className="text-gray-500 text-sm mb-2">Thank you for using Rozgar.</p>
            <p className="text-gray-400 text-xs mb-8">Your review helps workers build their reputation</p>

            {/* Rating (cosmetic) */}
            <div className="flex justify-center gap-2 mb-8">
              {[1,2,3,4,5].map(n => (
                <button key={n} className="text-3xl hover:scale-125 transition-transform">⭐</button>
              ))}
            </div>

            <button
              onClick={restart}
              className="btn-primary w-full py-4 text-base min-h-[52px]"
            >
              Post Another Job
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
