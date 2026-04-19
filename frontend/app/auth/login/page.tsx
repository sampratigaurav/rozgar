"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type AuthMode = "phone" | "email";
type Step = "contact" | "otp";

function OTPBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => inputRefs.current[i]?.focus();

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) focus(i - 1);
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
    arr[i] = digit;
    onChange(arr.join(""));
    if (digit && i < 5) focus(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          autoFocus={i === 0}
          className={`otp-box ${value[i] ? "filled" : ""}`}
        />
      ))}
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "";
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("phone");
  const [step, setStep] = useState<Step>("contact");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contact = mode === "phone" ? phone : email;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "phone") {
        const { error: err } = await supabase.auth.signInWithOtp({ phone });
        if (err) {
          if (err.message.toLowerCase().includes("twilio") || err.message.toLowerCase().includes("sms") || err.message.toLowerCase().includes("phone provider")) {
            setMode("email");
            setError("Phone OTP unavailable. Please use email instead.");
            setLoading(false);
            return;
          }
          throw err;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({ email });
        if (err) throw err;
      }
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = mode === "phone"
        ? { phone: contact, token, type: "sms" as const }
        : { email: contact, token, type: "email" as const };

      const { data, error: err } = await supabase.auth.verifyOtp(payload);
      if (err) throw err;

      let userRole = data.user?.user_metadata?.role as string | undefined;
      if (!userRole && data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        userRole = profile?.role;
      }
      router.push(`/dashboard/${userRole ?? "customer"}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF4500]" />

      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-sm mx-auto w-full">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1 text-[#FF6B00] text-sm font-semibold mb-8 w-fit hover:gap-2 transition-all">
          ← Back
        </Link>

        {/* Card */}
        <div className="card rounded-3xl p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center mb-4 shadow-md">
              <span className="text-white text-xl">{step === "contact" ? "👋" : "🔐"}</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {step === "contact" ? "Welcome back" : "Check your messages"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === "contact"
                ? "Sign in to your Rozgar account"
                : `We sent a 6-digit code to ${contact}`}
            </p>
          </div>

          {step === "contact" && (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-2xl overflow-hidden bg-gray-100 p-1 mb-5 gap-1">
                {(["phone", "email"] as AuthMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                      mode === m
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "phone" ? "📱 Phone" : "✉️ Email"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {mode === "phone" ? "Phone Number" : "Email Address"}
                  </label>
                  {mode === "phone" ? (
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="input-field"
                    />
                  ) : (
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field"
                    />
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
                    <span className="text-red-500 text-sm mt-0.5">⚠</span>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm min-h-[52px]">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : "Send OTP →"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <OTPBoxes value={token} onChange={setToken} />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
                  <span className="text-red-500 text-sm mt-0.5">⚠</span>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || token.length !== 6} className="btn-primary w-full py-3.5 text-sm min-h-[52px]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : "Verify & Login →"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("contact"); setToken(""); setError(""); }}
                className="w-full text-gray-400 text-sm py-2 font-medium hover:text-gray-600 transition-colors"
              >
                ← Change contact
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          New to Rozgar?{" "}
          <Link href={`/auth/signup${role ? `?role=${role}` : ""}`} className="text-[#FF6B00] font-bold hover:underline">
            Sign Up Free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
