"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const mode = (searchParams.get("mode") ?? "phone") as "phone" | "email";
  const phone = searchParams.get("phone") ?? "";
  const email = searchParams.get("email") ?? "";
  const role = searchParams.get("role") ?? "customer";

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contact = mode === "phone" ? phone : email;
  const maskedContact =
    mode === "phone"
      ? phone.slice(0, -4).replace(/./g, "•") + phone.slice(-4)
      : email.replace(/(.{2}).*@/, "$1••@");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
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

      // Role comes from user metadata set during signInWithOtp
      const userRole =
        data.user?.user_metadata?.role ?? role;

      router.push(`/dashboard/${userRole}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  if (!contact) {
    return (
      <div className="px-4 py-8 max-w-sm mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-red-600 font-semibold mb-1">Missing parameters</p>
          <p className="text-red-500 text-sm">
            Go back and enter your contact details first.
          </p>
          <Link href={`/auth/signup?role=${role}`} className="block mt-3 text-[#FF6B00] text-sm font-semibold">
            ← Back to Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <div className="mb-6">
        <Link
          href={`/auth/signup?role=${role}`}
          className="text-[#FF6B00] text-sm"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-3 mb-1">
          Enter your OTP
        </h1>
        <p className="text-gray-500 text-sm">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-700">{maskedContact}</span>
        </p>
      </div>

      <form onSubmit={handleVerify}>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={6}
          placeholder="• • • • • •"
          value={token}
          onChange={(e) =>
            setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
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
            "Verify & Continue →"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-5">
        Didn't receive it?{" "}
        <Link
          href={`/auth/signup?role=${role}`}
          className="text-[#FF6B00] font-semibold"
        >
          Resend
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-gray-400">
            <span className="animate-pulse text-4xl">⏳</span>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
