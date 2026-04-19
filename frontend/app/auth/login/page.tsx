"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type AuthMode = "phone" | "email";
type Step = "contact" | "otp";

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
        const { error: otpError } = await supabase.auth.signInWithOtp({ phone });

        if (otpError) {
          if (
            otpError.message.toLowerCase().includes("twilio") ||
            otpError.message.toLowerCase().includes("sms") ||
            otpError.message.toLowerCase().includes("phone provider")
          ) {
            setMode("email");
            setError("Phone OTP unavailable. Please use email instead.");
            setLoading(false);
            return;
          }
          throw otpError;
        }
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({ email });
        if (otpError) throw otpError;
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
      const verifyPayload =
        mode === "phone"
          ? { phone: contact, token, type: "sms" as const }
          : { email: contact, token, type: "email" as const };

      const { data, error: verifyError } =
        await supabase.auth.verifyOtp(verifyPayload);

      if (verifyError) throw verifyError;

      // Read role from user metadata; fall back to querying profiles table
      let userRole = data.user?.user_metadata?.role as string | undefined;

      if (!userRole && data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
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
    <div className="px-4 py-8 max-w-sm mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-[#FF6B00] text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-3 mb-1">
          {step === "contact" ? "Login to Rozgar" : "Enter your OTP"}
        </h1>
        <p className="text-gray-500 text-sm">
          {step === "contact"
            ? "Enter your contact to receive a one-time code."
            : `We sent a code to ${contact}`}
        </p>
      </div>

      {step === "contact" && (
        <>
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 mb-5">
            <button
              type="button"
              onClick={() => { setMode("phone"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "phone" ? "bg-[#FF6B00] text-white" : "text-gray-500 bg-white"
              }`}
            >
              📱 Phone
            </button>
            <button
              type="button"
              onClick={() => { setMode("email"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "email" ? "bg-[#FF6B00] text-white" : "text-gray-500 bg-white"
              }`}
            >
              ✉️ Email
            </button>
          </div>

          <form onSubmit={handleSendOtp}>
            {mode === "phone" ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:border-[#FF6B00] outline-none"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:border-[#FF6B00] outline-none"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] text-white rounded-xl py-4 font-bold text-base min-h-[52px] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Sending OTP…
                </span>
              ) : (
                "Send OTP →"
              )}
            </button>
          </form>
        </>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerify}>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            placeholder="• • • • • •"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 text-3xl tracking-[0.5em] text-center mb-5 focus:border-[#FF6B00] outline-none font-mono"
            autoFocus
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="w-full bg-[#FF6B00] text-white rounded-xl py-4 font-bold text-base min-h-[52px] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Verifying…
              </span>
            ) : (
              "Verify & Login →"
            )}
          </button>

          <button
            type="button"
            onClick={() => { setStep("contact"); setToken(""); setError(""); }}
            className="w-full mt-3 text-gray-500 text-sm py-2"
          >
            ← Change contact
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-5">
        New to Rozgar?{" "}
        <Link
          href={`/auth/signup${role ? `?role=${role}` : ""}`}
          className="text-[#FF6B00] font-semibold"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-gray-400">
            <span className="animate-pulse text-4xl">⏳</span>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
