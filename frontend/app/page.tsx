"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import CategoryCard from "@/components/CategoryCard";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import {
  analyseImage,
  createJob,
  broadcastJob,
  getJob,
  type AIAnalysisResult,
  type Job,
} from "@/lib/api";

const CATEGORIES = ["Electrician", "Plumber", "Carpenter", "Painter"];

type Step =
  | "category"
  | "photo"
  | "analyse"
  | "pincode"
  | "broadcasting"
  | "polling"
  | "matched";

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function HomePage() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [pinCode, setPinCode] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const showToast = (message: string, type: ToastState["type"]) =>
    setToast({ message, type });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep("analyse");
  };

  const handleAnalyse = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const result = await analyseImage(photo, category);
      setAiResult(result);
      setStep("pincode");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = useCallback((jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getJob(jobId);
        setJob(res.data);
        if (res.data.status === "matched") {
          clearInterval(pollRef.current!);
          setStep("matched");
        }
      } catch {
        // silently retry on polling errors
      }
    }, 3000);
  }, []);

  const handleBroadcast = async () => {
    if (!photo || pinCode.length !== 6) return;
    setLoading(true);
    try {
      const created = await createJob(category, pinCode, photo);
      const jobId = created.data.id;
      setJob(created.data);
      await broadcastJob(jobId);
      setStep("polling");
      startPolling(jobId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Broadcast failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
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

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Step 1 — Category */}
        {step === "category" && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              What do you need help with?
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Select a category to get started
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  selected={category === cat}
                  onSelect={() => {
                    setCategory(cat);
                    setStep("photo");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Photo Upload */}
        {step === "photo" && (
          <div>
            <button
              onClick={() => setStep("category")}
              className="text-[#FF6B00] text-sm mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-1">Upload a photo</h2>
            <p className="text-gray-500 text-sm mb-5">
              Category:{" "}
              <span className="font-medium text-gray-700">{category}</span>
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#FF6B00] rounded-2xl p-10 flex flex-col items-center gap-3 text-[#FF6B00] bg-orange-50 active:bg-orange-100"
            >
              <span className="text-6xl">📷</span>
              <span className="font-semibold text-base">
                Tap to take photo or upload
              </span>
              <span className="text-xs text-gray-500">JPG, PNG up to 10MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 3 — Analyse */}
        {step === "analyse" && (
          <div>
            <button
              onClick={() => setStep("photo")}
              className="text-[#FF6B00] text-sm mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-4">Review your photo</h2>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Problem"
                className="w-full rounded-2xl mb-5 object-cover max-h-72"
              />
            )}
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="w-full bg-[#FF6B00] text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-[#CC5500]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Analysing…
                </span>
              ) : (
                "🔍 Analyse with AI"
              )}
            </button>
          </div>
        )}

        {/* Step 4 — Pin Code + AI Result */}
        {step === "pincode" && aiResult && (
          <div>
            <h2 className="text-xl font-bold mb-4">AI Analysis Result</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
              <p className="text-gray-700 mb-2 text-sm">
                <span className="font-semibold">Scope:</span> {aiResult.scope}
              </p>
              <p className="text-gray-700 mb-2 text-sm">
                <span className="font-semibold">Price:</span> ₹
                {aiResult.price_min} – ₹{aiResult.price_max}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">Complexity:</span>
                <StatusBadge status={aiResult.complexity} />
              </div>
            </div>

            <h3 className="font-bold mb-2 text-gray-800">Your Pin Code</h3>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 560001"
              value={pinCode}
              onChange={(e) =>
                setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full border-2 border-gray-300 rounded-2xl px-4 py-3 text-2xl tracking-widest mb-5 focus:border-[#FF6B00] outline-none"
            />
            <button
              onClick={handleBroadcast}
              disabled={loading || pinCode.length !== 6}
              className="w-full bg-[#FF6B00] text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] disabled:opacity-60 active:bg-[#CC5500]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Broadcasting…
                </span>
              ) : (
                "📡 Broadcast Job"
              )}
            </button>
          </div>
        )}

        {/* Step 5 — Polling */}
        {step === "polling" && (
          <div className="text-center py-12">
            <div className="text-7xl mb-5 animate-pulse">📡</div>
            <h2 className="text-xl font-bold mb-2">
              Looking for workers near you…
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Notifying {category}s in pin code{" "}
              <span className="font-mono font-semibold">{pinCode}</span>
            </p>
            {job && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left">
                <p className="text-xs text-gray-500 mb-1">Job ID</p>
                <p className="font-mono text-xs text-gray-700 break-all mb-2">
                  {job.id}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6 — Matched */}
        {step === "matched" && job?.matched_worker && (
          <div className="text-center py-8">
            <div className="text-7xl mb-5">✅</div>
            <h2 className="text-xl font-bold text-green-700 mb-1">
              Worker Found!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              A {category} is on the way
            </p>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 text-left">
              <p className="font-bold text-lg text-gray-800">
                {job.matched_worker.name}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {job.matched_worker.phone}
              </p>
              <p className="text-gray-500 text-xs mt-1 capitalize">
                {job.matched_worker.language} speaker
              </p>
            </div>
            <a
              href={`tel:${job.matched_worker.phone}`}
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-lg min-h-[52px] active:bg-green-700"
            >
              📞 Call Worker
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
