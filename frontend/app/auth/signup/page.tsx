"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type AuthMode = "phone" | "email";

const signupSchema = z.object({
  mode: z.enum(["phone", "email"]),
  phone: z.string().optional(),
  email: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "phone") {
    // E.164 rough validation
    if (!data.phone || data.phone.trim().replace(/\s+/g, "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number (at least 10 digits).",
        path: ["phone"],
      });
    }
  } else {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid email address.",
        path: ["email"],
      });
    }
  }
});

type SignupFormValues = z.infer<typeof signupSchema>;

const ROLE_META: Record<string, { label: string; icon: string; color: string }> = {
  customer: { label: "Customer",      icon: "🏠", color: "from-orange-500 to-red-500" },
  worker:   { label: "Worker",        icon: "🔧", color: "from-blue-500 to-indigo-600" },
  partner:  { label: "Shop Partner",  icon: "🏪", color: "from-emerald-500 to-green-600" },
};

function SignupContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "customer";
  const router = useRouter();
  const supabase = createClient();

  const roleMeta = ROLE_META[role] ?? ROLE_META.customer;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      mode: "phone",
      phone: "",
      email: "",
    },
  });

  const mode = watch("mode");

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    setError("");
    try {
      if (data.mode === "phone") {
        let formattedPhone = data.phone!.trim().replace(/\s+/g, "");
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = `+91${formattedPhone}`;
        }
        
        const { error: err } = await supabase.auth.signInWithOtp({ phone: formattedPhone, options: { data: { role } } });
        if (err) {
          if (err.message.toLowerCase().includes("twilio") || err.message.toLowerCase().includes("sms") || err.message.toLowerCase().includes("phone provider")) {
            setValue("mode", "email");
            setError("Phone OTP is not available. Please use email instead.");
            setLoading(false);
            return;
          }
          throw err;
        }
        router.push(`/auth/verify?phone=${encodeURIComponent(formattedPhone)}&role=${role}&mode=phone`);
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({ email: data.email!, options: { data: { role } } });
        if (err) throw err;
        router.push(`/auth/verify?email=${encodeURIComponent(data.email!)}&role=${role}&mode=email`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <div className="h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF4500]" />

      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-sm mx-auto w-full">
        <Link href="/" className="flex items-center gap-1 text-[#FF6B00] text-sm font-semibold mb-8 w-fit hover:gap-2 transition-all">
          ← Back
        </Link>

        <div className="card rounded-3xl p-6">
          {/* Role pill */}
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${roleMeta.color} text-white text-xs font-bold px-3 py-1.5 rounded-xl mb-4`}>
            <span>{roleMeta.icon}</span>
            <span>Signing up as {roleMeta.label}</span>
          </div>Value("mode", m); setError(""); }}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                {mode === "phone" ? "Phone Number" : "Email Address"}
              </label>
              {mode === "phone" ? (
                <>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("phone")}
                    className={`input-field ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +91</p>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`input-field ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                <  />
                  <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +91</p>
                </>
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
                  Sending OTP…
                </span>
              ) : "Send OTP →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href={`/auth/login?role=${role}`} className="text-[#FF6B00] font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
