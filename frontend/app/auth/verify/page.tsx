"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

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

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const mode    = (searchParams.get("mode") ?? "phone") as "phone" | "email";
  const phone   = searchParams.get("phone") ?? "";
  const email   = searchParams.get("email") ?? "";
  const role    = searchParams.get("role")  ?? "customer";
  const contact = mode === "phone" ? phone : email;

  const maskedContact = mode === "phone"
    ? phone.slice(0, -4).replace(/./g, "•") + phone.slice(-4)
    : email.replace(/(.{2}).*@/, "$1••@");

  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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

      const userRole = data.user?.user_metadata?.role ?? role;
      router.push(`/dashboard/${userRole}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
        <div className="card rounded-3xl p-6 max-w-sm w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-red-600 font-bold mb-1">Missing parameters</p>
            <p className="text-red-500 text-sm">Go back and enter your contact details first.</p>
            <Link href={`/auth/signup?role=${role}`} className="block mt-3 text-[#FF6B00] text-sm font-bold">
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <div className="h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF4500]" />

      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-sm mx-auto w-full">
        <Link href={`/auth/signup?role=${role}`} className="flex items-center gap-1 text-[#FF6B00] text-sm font-semibold mb-8 w-fit hover:gap-2 transition-all">
          ← Back
        </Link>

        <div className="card rounded-3xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center mb-4 shadow-md">
            <span className="text-white text-xl">🔐</span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-1">Enter your code</h1>
          <p className="text-gray-500 text-sm mb-6">
            We sent a 6-digit code to{" "}
            <span className="font-bold text-gray-700">{maskedContact}</span>
          </p>

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
              ) : "Verify & Continue →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Didn&apos;t receive it?{" "}
          <Link href={`/auth/signup?role=${role}`} className="text-[#FF6B00] font-bold hover:underline">
            Resend
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
