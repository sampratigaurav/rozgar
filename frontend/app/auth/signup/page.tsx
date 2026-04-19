"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type AuthMode = "phone" | "email";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  worker: "Worker",
  partner: "Partner",
};

function SignupContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "customer";
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "phone") {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone,
          options: { data: { role } },
        });

        if (otpError) {
          // Twilio not configured — auto-switch to email
          if (
            otpError.message.toLowerCase().includes("twilio") ||
            otpError.message.toLowerCase().includes("sms") ||
            otpError.message.toLowerCase().includes("phone provider")
          ) {
            setMode("email");
            setError(
              "Phone OTP is not available. Please use email instead."
            );
            setLoading(false);
            return;
          }
          throw otpError;
        }

        router.push(
          `/auth/verify?phone=${encodeURIComponent(phone)}&role=${role}&mode=phone`
        );
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { data: { role } },
        });
        if (otpError) throw otpError;

        router.push(
          `/auth/verify?email=${encodeURIComponent(email)}&role=${role}&mode=email`
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          Sign up as {ROLE_LABELS[role] ?? role}
        </h1>
        <p className="text-gray-500 text-sm">
          We'll send a one-time code to verify you.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 mb-5">
        <button
          type="button"
          onClick={() => { setMode("phone"); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === "phone"
              ? "bg-[#FF6B00] text-white"
              : "text-gray-500 bg-white"
          }`}
        >
          📱 Phone
        </button>
        <button
          type="button"
          onClick={() => { setMode("email"); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === "email"
              ? "bg-[#FF6B00] text-white"
              : "text-gray-500 bg-white"
          }`}
        >
          ✉️ Email
        </button>
      </div>

      <form onSubmit={handleSubmit}>
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
            <p className="text-xs text-gray-400 mt-1">
              Include country code, e.g. +91
            </p>
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

      <p className="text-center text-sm text-gray-500 mt-5">
        Already have an account?{" "}
        <Link
          href={`/auth/login?role=${role}`}
          className="text-[#FF6B00] font-semibold"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-gray-400">
            <span className="animate-pulse text-4xl">⏳</span>
          </div>
        }
      >
        <SignupContent />
      </Suspense>
    </div>
  );
}
